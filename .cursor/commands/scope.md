You are compressing an ongoing development conversation.

Goal:
Create a clean handoff so a new chat can continue the task
without reading the full history and without loading unnecessary context.

You are NOT planning the solution.
You are NOT solving the task.
You are preserving working knowledge only.

Rules:

- No explanations
- No reasoning
- No alternatives
- No brainstorming
- No refactors
- No suggestions
- Do NOT include full code
- Only concrete implementation facts
- Maximum brevity
- If the user mentioned a next goal, include it verbatim (do not invent one)
- FILES THAT MATTER must be one file path per line
- NEXT STEP must be only the immediate action (not a multi-step plan)

Output structure:

TASK:
(short description of what we were doing)

CURRENT STATE:
(relevant existing behavior, implementation facts, constraints)

DECISIONS MADE:
(agreements already taken — libraries, patterns, architecture choices)

FILES THAT MATTER:
(minimal working set likely needed again — one path per line)

INTENDED CONTINUATION:
(user provided next step, if mentioned)

NEXT STEP:
(the single immediate technical action to perform next)

UNKNOWN / VERIFY:
(open questions that must be confirmed in the new chat)

This output will be copy-pasted into a fresh chat.
Think like writing a precise handoff to another senior engineer.
Keep it compact.
