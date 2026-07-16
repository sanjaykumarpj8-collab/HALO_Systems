import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reporter_name, raw_text, detected_language, section_id } = await req.json();

    if (!raw_text || !reporter_name) {
      throw new Error('Missing required fields: raw_text and reporter_name');
    }

    // 1. Call Gemini AI to process the raw text
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
You are an expert stadium operations AI assistant named "Crisis-Bridge".
Analyze the following incident report from a stadium fan.

Report: "${raw_text}"
Detected Language: ${detected_language}

Extract the following information and output strictly as a JSON object (no markdown formatting, just raw JSON).
{
  "parsed_type": "medical | security | spill | structural | noise | accessibility | other",
  "severity": <integer from 1 to 5, where 1 is critical emergency and 5 is minor annoyance>,
  "english_translation": "<translate the report to English>",
  "location_description": "<extract any location mentioned, like 'Gate 5' or null if none>",
  "confidence": <float from 0.0 to 1.0 representing how confident you are in this parsing>,
  "ai_reasoning": "<a short 1-sentence reason for your severity and category>"
}
    `;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      })
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      console.error('Gemini API Error:', err);
      throw new Error('Failed to process text with Gemini AI');
    }

    const geminiData = await geminiResponse.json();
    let aiParsed;
    try {
      const contentText = geminiData.candidates[0].content.parts[0].text;
      aiParsed = JSON.parse(contentText);
    } catch (e) {
      console.error('Failed to parse Gemini output:', e);
      throw new Error('Invalid JSON from Gemini');
    }

    // 2. Insert into Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert([
        {
          reporter_name,
          raw_text,
          detected_language,
          section_id: section_id ? parseInt(section_id) : null,
          parsed_type: aiParsed.parsed_type,
          severity: aiParsed.severity,
          english_translation: aiParsed.english_translation,
          location_description: aiParsed.location_description,
          confidence: aiParsed.confidence,
          ai_reasoning: aiParsed.ai_reasoning,
          status: aiParsed.severity >= 4 ? 'assigned' : 'new'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify(incident), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Process-Report Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
