"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { subscribeToIncidents } from "../lib/supabase";
import { Stethoscope, ShieldAlert, Droplet, Flame, Building, Volume2, Accessibility, Pin } from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType> = {
  medical: Stethoscope, security: ShieldAlert, spill: Droplet,
  fire: Flame, structural: Building, noise: Volume2, accessibility: Accessibility, other: Pin,
};

export default function GlobalListener() {
  useEffect(() => {
    const channel = subscribeToIncidents((payload) => {
      if (payload.eventType === 'INSERT') {
        const incident = payload.new;
        
        // Show notification for ALL incidents
        if (incident) {
          toast.custom((t) => {
            const IconComp = TYPE_ICON[incident.parsed_type] || Pin;
            return (
              <div
                style={{
                  background: '#0d0d12',
                  border: '1px solid #1e1e2e',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '300px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  animation: t.visible ? 'fade-in 0.3s ease-out' : 'fade-out 0.3s ease-out forwards'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      padding: '10px', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={20} color="#ef4444" />
                    </div>
                    <strong style={{ color: '#f0f0f5', textTransform: 'capitalize' }}>{incident.parsed_type} Emergency</strong>
                  </div>
                  <span style={{ 
                    background: '#ef535020', 
                    color: '#ef5350', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '1px solid #ef535040'
                  }}>
                    Severity {incident.severity}
                  </span>
                </div>
                <p style={{ color: '#c0c0d0', fontSize: '14px', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {incident.english_translation || incident.raw_text}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ color: '#8888a0', fontSize: '12px' }}>Reporter: {incident.reporter_name}</span>
                  <span style={{ color: '#8888a0', fontSize: '12px' }}>{incident.location_description || "Unknown Loc"}</span>
                </div>
              </div>
            );
          }, { duration: 8000 });
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return null;
}
