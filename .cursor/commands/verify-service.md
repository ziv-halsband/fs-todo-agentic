You are maintaining service-level documentation for this repository.

Goal:
Create or update a concise README for a single service.

Hard rules:

- Don’t guess. Verify by reading files.
- If unsure, ask (max 3 questions).
- Keep it short: target 1 screen, max 2.
- No generic tutorials.

Before starting:

- Ask which service to verify (path under /services), unless the user already specified it.

README contract (for the chosen service):
Must include:

1. What this service does (2–4 lines)
2. Tech stack (only what exists)
3. Key folders (based on actual structure)
4. How to run locally (commands only)
5. Environment variables (NAMES only)
6. Key API surface (high-level only)
7. Notes for agents:
   - Where business logic lives
   - Where validation lives
   - Where auth/cookies are handled
   - Where error shape is defined

Forbidden:

- Full endpoint tables
- DB schema dumps
- Security/infra deep dives
- Non-existent services or packages

Tasks:

1. Identify the target service.
2. Read its code.
3. Create or update services/<service>/README.md.
4. Output the full README.
5. Ask up to 3 questions only if required.

Output:
A) services/<service>/README.md (full content)
B) Questions (0–3)
