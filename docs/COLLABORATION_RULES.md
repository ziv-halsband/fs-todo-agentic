# Collaboration Rules

## Core Principle

**This is a LEARNING project, not just a todo app!**

The goal is to build confidence, understanding, and practical skills - not just to complete features quickly.

## Working Together

### 1. One Thing at a Time

- Implement ONE configuration/feature at a time
- Fully explain EACH change before moving to the next
- No bulk changes without discussion

### 🚨 2. CRITICAL: Wait for Acknowledgment

- **NEVER proceed to next step without explicit user confirmation**
- After completing a step, STOP and wait
- User will review, ask questions, verify understanding
- Only continue when user says: "ok", "continue", "next", or similar
- This is NOT optional - always wait for the green light!

### 3. Understand WHY and HOW

- Every configuration must be explained:
  - **WHY** we need it
  - **HOW** it works
  - **WHAT** problem it solves
  - **ALTERNATIVES** we could have chosen
- No "just trust me" or "it's standard" - we discuss everything

### 3. Make Decisions Together

- Discuss options before implementing
- User has final say on all decisions
- If uncertain, present 2-3 options with pros/cons
- User wants to understand trade-offs

### 4. Build Confidence Through Understanding

- Explain technical concepts in clear language
- Show examples and use cases
- Connect to real-world work scenarios
- Answer "why does this matter?" for each thing

### 5. Learning Over Speed

- Taking time to understand > rushing to complete
- It's okay to ask questions
- It's okay to experiment and make mistakes
- The journey matters more than the destination

## What This Means for AI Assistant

### DO:

✅ Explain one thing at a time thoroughly
✅ Ask which option the user prefers
✅ Provide context and reasoning
✅ Show real examples
✅ Wait for user confirmation before proceeding
✅ Relate configurations to real work scenarios

### DON'T:

❌ Bulk create multiple files without explanation
❌ Assume user wants "standard" setup
❌ Skip explaining "obvious" things
❌ Make decisions without discussion
❌ Rush through configurations
❌ Use jargon without explanation

## Example Good Interaction

**Assistant:** "Before we continue, we need to decide about code formatting. We have 3 main options:

1. **Prettier** - Automatic formatting, very opinionated, zero config needed
2. **ESLint with styling rules** - More configurable but can conflict
3. **Manual** - Team agrees on style guide, no automation

In your work, which do you use? What do you prefer?"

**User:** "We use Prettier at work, let's go with that"

**Assistant:** "Great! Prettier will automatically format code on save. Key decisions we need to make:

- Tab size (2 or 4 spaces)
- Single vs double quotes
- Semicolons or not
- Line length limit

Here's what I recommend based on your conventions doc... [explains each]"

## Security & Production Standards

### Always Production-Ready

- **Goal:** Build production-grade code, not just "learning" code
- **Mindset:** Understand security implications and best practices
- **Standard:** If we wouldn't use it in production, we discuss alternatives

### Security First

- **JWT Storage:** NEVER localStorage - use HttpOnly cookies
  - localStorage vulnerable to XSS attacks
  - HttpOnly cookies inaccessible to JavaScript
  - Secure flag for HTTPS only
  - SameSite flag for CSRF protection

- **Understand Trade-offs:**
  - Know WHY each approach is secure
  - Understand attack vectors
  - Learn industry best practices

- **If Shortcuts Taken:**
  - Document WHY (e.g., "stateless logout acceptable with 15min tokens")
  - Note what production would need (e.g., "add Redis for instant revocation")
  - Plan migration path

## Remember

Every configuration is a learning opportunity. Every decision teaches something valuable about software engineering.
