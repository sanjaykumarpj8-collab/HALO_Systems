# HALO Stadium Operations Suite (Hackathon Submission)

## 1. Chosen Vertical
**Stadium Operations Assistant (HALO — Crisis-Bridge Orchestrator)**. 
Managing operations during massive live events like the FIFA World Cup requires coordinating janitorial, medical, and security staff under immense pressure. This project addresses the challenge by providing a central AI assistant that instantly parses chaotic, multilingual fan reports, determines severity and duplicate status, and dispatches the most appropriate nearby staff member with translated routing instructions. This creates a safer and more efficient environment in chaotic live-event scenarios.

## 2. Approach and Logic
The pipeline utilizes a multi-agent orchestrated approach divided into logical, context-aware steps. We split the logic into AI-driven reasoning and deterministic rule-based checks to ensure reliability and speed:
- **Input Sanitization (Security)**: Raw inputs are first stripped of control characters and HTML tags and hard-capped at a reasonable length to prevent Prompt Injection and XSS attacks.
- **Agent A (Intake - AI)**: Ingests raw fan text (any language), detects the language, translates to English, and classifies the event type (e.g., medical, spill, security).
- **Agent B (Prioritizer - AI + Rules)**: Analyzes the classified incident against recent historical incidents. It assigns a priority (1 to 5), checks for duplicate clusters in the same section, determines the necessary worker type, and escalates if multiple identical emergencies happen simultaneously. *The AI is required to output its reasoning in plain language.*
- **Agent C (Dispatcher - AI + Rules)**: Deterministically searches a simulated pool of workers to find the closest available staff member of the required type. It then generates route instructions and a translated dispatch message in that specific worker's native language.

## 3. How the Solution Works
The core logic resides in `packages/ai-pipeline/pipeline.ts`. 

### Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` and insert your Gemini API Key:
   ```bash
   cp .env.example .env
   # Edit .env to add GEMINI_API_KEY
   ```

### Running the Assistant
To run the interactive CLI assistant and test the AI pipeline end-to-end:
```bash
npm run start:cli
```
You will be prompted to enter a raw fan incident report. The CLI will process it and output the classification, priority, AI reasoning, and final dispatch action.

### Running Tests
The project includes unit tests for core logic (sanitization & prioritization) and an integration test for the full pipeline. 
We use `vitest` as a lightweight runner.
```bash
npm run test
```

## 4. Assumptions Made
- **Database/Data Store**: To make this submission easily runnable for evaluators without configuring PostgreSQL/Supabase, the CLI utilizes mocked data for `recentIncidents` and `availableWorkers`. In a production scenario, these would be fetched directly from the database.
- **Worker Locations**: Worker proximity is calculated using a simplified 1D section distance heuristic (`abs(sectionA - sectionB)`). In production, this would use a real GPS/indoor positioning coordinate system.
- **Escalation**: Escalation rules are simplified (e.g., a hardcoded severity 1 flag automatically escalates).
- **Monorepo Structure**: The repository contains UI apps in the `/apps` directory (Command Center and Mobile Apps). These are included for context regarding the broader system architecture but the core hackathon AI logic is entirely contained and executable via the standalone Node CLI in the root and `/packages/ai-pipeline`.
