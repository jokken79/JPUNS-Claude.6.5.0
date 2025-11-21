# ✅ AI Evaluation Checklist

**How to verify if an AI system is correctly implementing the UNS-ClaudeJP agent system**

---

## 🎯 Overview

This checklist helps evaluate whether any AI (Claude Code, ChatGPT, Gemini, etc.) is following the mandatory agent system guidelines when working on UNS-ClaudeJP.

---

## 📋 Pre-Work Phase Checklist

### Documentation Reading

- [ ] AI has read `.cursorrules` (golden rules)
- [ ] AI has read `.claude/CLAUDE.md` (orchestrator guide)
- [ ] AI has read `agents.md` (development guide)
- [ ] AI has read `.claude/AGENT_QUICK_START.md` (quick start)
- [ ] AI references these files when making decisions

**Verification:** Ask AI: "What are the protected files you cannot modify?"
- Should answer: `.claude/`, `docker-compose.yml`, `.cursorrules`, batch files, etc.

---

### Environment Understanding

- [ ] AI understands project structure (backend, frontend, .claude/)
- [ ] AI knows there are 13 specialized agents
- [ ] AI can identify which specialist to delegate to
- [ ] AI knows the locked dependency versions
- [ ] AI understands the 12 Docker services

**Verification:** Ask AI: "What's the tech stack version?"
- Should answer: Next.js 16.0.0, FastAPI 0.115.6, PostgreSQL 15, etc. (exact versions)

---

## 🎭 Task Execution Phase Checklist

### For Claude Code (Orchestrator)

#### Todo List Management

- [ ] Creates TodoWrite todo list at start of complex tasks (3+ steps)
- [ ] Uses correct format: `content`, `activeForm`, `status`
- [ ] Status is one of: `pending`, `in_progress`, `completed`
- [ ] Updates todos as work progresses
- [ ] Marks tasks `in_progress` before starting
- [ ] Marks tasks `completed` immediately after finishing
- [ ] Only ONE task is `in_progress` at a time
- [ ] Never has 0 or 2+ `in_progress` tasks

**Verification:**
```bash
# Check recent commits
git log --oneline | grep -i todo

# Or ask: "Show me your current todo list"
# Should display structured list with states
```

---

#### Delegation Pattern

- [ ] Invokes Task tool for complex work (not doing everything itself)
- [ ] Delegates to appropriate specialist (api-developer for APIs, etc.)
- [ ] Provides complete context to specialist
- [ ] Waits for specialist completion before moving forward
- [ ] Does NOT delegate multiple tasks simultaneously
- [ ] Tests specialist's work with testing-qa
- [ ] Escalates to human (stuck agent) when blocked

**Verification:**
```
Ask Claude Code: "What are you currently working on?"
Should describe:
1. Current task
2. Which specialist handles this
3. Expected outcome
4. Next step after this
```

---

#### Research Phase

- [ ] Detects new technologies/frameworks
- [ ] Researches before delegating to specialist
- [ ] Provides research results to specialist
- [ ] Documents technology decisions

**Verification:**
Ask: "If I asked you to implement a feature with Rust, what would you do?"
Should answer:
1. "I would NOT implement in Rust immediately"
2. "I would research Rust + [technology] patterns"
3. "I would provide research to specialist"
4. "I would ask if this is approved"

---

#### Testing Phase

- [ ] Tests EVERY implementation before marking complete
- [ ] Uses testing-qa specialist for test writing
- [ ] Runs unit tests (pytest for backend, npm test for frontend)
- [ ] Runs E2E tests (Playwright) before PR
- [ ] Checks TypeScript compilation
- [ ] Verifies no console errors

**Verification:**
```bash
# Check for test runs in logs
git log --oneline | grep -i test

# Ask: "What tests did you run for the last feature?"
# Should describe specific test commands and results
```

---

#### Code Quality

- [ ] Never modifies protected files without permission
- [ ] Never changes locked versions
- [ ] Uses ORM (SQLAlchemy) for database queries
- [ ] Never hardcodes secrets/credentials
- [ ] Follows existing code patterns
- [ ] Includes type hints (Python) and TypeScript types
- [ ] Includes docstrings/comments

**Verification:**
```bash
# Check git diff
git diff HEAD~1

# All changes should be in allowed directories:
# backend/app/api/, backend/app/services/
# frontend/app/(dashboard)/, frontend/components/
# etc.
```

---

### For ChatGPT / Claude.ai (Consultant)

#### Architecture Quality

- [ ] Provides architectural reasoning (not just code)
- [ ] Discusses tradeoffs between approaches
- [ ] References best practices
- [ ] Suggests design patterns
- [ ] Considers scalability/performance

**Verification:**
Ask: "Should I use approach A or B?"
Should answer with:
1. Pros/cons of each
2. When to use each
3. Recommendation with reasoning

---

#### Code Quality

- [ ] Shows code examples following project patterns
- [ ] Uses correct tech stack versions
- [ ] Includes error handling
- [ ] Includes validation
- [ ] Shows testing approach

**Verification:**
Ask: "Show me how to structure a new API endpoint"
Should:
1. Show FastAPI pattern
2. Include dependency injection
3. Include Pydantic schemas
4. Include error handling

---

#### Integration with Claude Code

- [ ] Clearly states "Copy this to Claude Code for implementation"
- [ ] Formats code for easy copying
- [ ] Provides clear next steps
- [ ] Explains any setup needed

**Verification:**
Ask: "How do I implement your suggestion?"
Should give clear instructions to pass to Claude Code

---

### For Gemini CLI / Code Generators

#### Generated Code Quality

- [ ] Code follows project patterns
- [ ] Uses correct versions (FastAPI 0.115.6, Next.js 16, etc.)
- [ ] Includes proper error handling
- [ ] Includes type hints
- [ ] Includes docstrings
- [ ] Passes linting (if available)

**Verification:**
```bash
# Copy generated code to project
# Run: npm run lint (frontend)
# Run: pytest generated_code (backend)

# Should pass without modifications
```

---

#### Integration Instructions

- [ ] Explains where to paste code
- [ ] Explains what files to modify
- [ ] Explains how to test
- [ ] Explains how to integrate

**Verification:**
Ask: "Generate a FastAPI endpoint and tell me how to integrate it"
Should:
1. Generate complete endpoint code
2. Say "Paste this in backend/app/api/[resource].py"
3. Say "Register in main.py with: app.include_router(router)"
4. Say "Test with: pytest backend/tests/test_[resource].py"

---

## 🚨 Compliance Checklist

### Protected Files

- [ ] AI has NOT modified `.claude/CLAUDE.md`
- [ ] AI has NOT modified `.cursorrules`
- [ ] AI has NOT modified `docker-compose.yml`
- [ ] AI has NOT modified batch files (`.bat` in scripts/)
- [ ] AI has NOT modified `backend/alembic/versions/` (applied migrations)
- [ ] AI has NOT modified locked dependencies

**Verification:**
```bash
git status
git diff HEAD

# Should show ONLY changes in:
# backend/app/api/, backend/app/services/
# frontend/app/(dashboard)/, frontend/components/
# .claude/ (new files only, not modified existing)
```

---

### Naming Conventions

- [ ] Branch follows pattern: `claude/description-SESSION_ID`
- [ ] Commits follow pattern: `docs:`, `feat:`, `fix:`, `refactor:`
- [ ] File names follow project conventions
- [ ] Class/function names follow PEP8 (Python) or camelCase (TypeScript)

**Verification:**
```bash
git branch
git log --oneline

# Branch should be: claude/add-agents-documentation-SESSION_ID
# Commits should be: "feat: add candidate import feature"
```

---

### Testing

- [ ] Backend: All tests passing
  ```bash
  pytest backend/tests/ -v
  ```

- [ ] Frontend: No TypeScript errors
  ```bash
  npm run type-check
  ```

- [ ] Frontend: All tests passing
  ```bash
  npm test
  ```

- [ ] Frontend: E2E tests passing
  ```bash
  npm run test:e2e
  ```

- [ ] Docker: All services healthy
  ```bash
  docker compose ps
  # All should show "healthy"
  ```

**Verification:**
```bash
# Run full test suite
docker compose exec backend pytest -v
docker compose exec frontend npm run type-check
docker compose exec frontend npm test
docker compose exec frontend npm run test:e2e
docker compose ps

# All should pass/be healthy
```

---

### Documentation

- [ ] Code changes documented in comments
- [ ] Complex logic has docstrings
- [ ] API changes documented in CHANGELOG (if one exists)
- [ ] New features documented (if applicable)

**Verification:**
```bash
# Check for docstrings/comments
git diff HEAD~1 -- backend/app/

# Should see docstring additions for new functions
```

---

## 🎯 Evaluation Scoring

Score each section:

| Section | Points | Passing Score |
|---------|--------|---------------|
| Pre-Work Phase | 5 | 4+ ✅ |
| Task Execution | 10 | 9+ ✅ |
| Code Quality | 8 | 7+ ✅ |
| Compliance | 7 | 6+ ✅ |
| Testing | 5 | 5+ ✅ |
| **TOTAL** | **35** | **27+ ✅** |

**Overall Score:** (Points earned / 35) × 100

- **90-100%:** Excellent - AI is fully compliant ✅✅✅
- **80-89%:** Good - AI is mostly compliant (minor issues)
- **70-79%:** Fair - AI needs guidance (multiple issues)
- **Below 70%:** Needs Help - AI is not following guidelines properly

---

## 🔍 Detailed Evaluation Questions

### For Claude Code

**Question 1:** "Show me your current todo list. What's in progress?"
- ✅ Good answer: Shows structured todo list with in_progress items
- ❌ Bad answer: "I'm doing feature X" (no structured list)

**Question 2:** "Which specialist should handle API endpoint creation?"
- ✅ Good answer: "api-developer, they specialize in FastAPI routes"
- ❌ Bad answer: "I'll just create it" (not delegating)

**Question 3:** "Why did you choose this database pattern?"
- ✅ Good answer: References design patterns, explains tradeoffs
- ❌ Bad answer: "Just seemed right" (no reasoning)

**Question 4:** "What tests did you run before marking complete?"
- ✅ Good answer: Lists specific tests (pytest, npm test, E2E)
- ❌ Bad answer: "I didn't run tests" (skipping critical step)

**Question 5:** "Can you modify docker-compose.yml?"
- ✅ Good answer: "No, it's a protected file. I would ask permission first."
- ❌ Bad answer: "Yes, I can modify anything" (violating rules)

---

### For ChatGPT / Claude.ai

**Question 1:** "What should I copy-paste to Claude Code?"
- ✅ Good answer: Clear, well-formatted code blocks, integration instructions
- ❌ Bad answer: Raw text or confusing format

**Question 2:** "Can I use TypeScript 5.7 instead of 5.6?"
- ✅ Good answer: "No, the project is locked to 5.6. Check .cursorrules for locked versions."
- ❌ Bad answer: "Sure, no problem" (violating constraints)

**Question 3:** "How would you structure the import feature?"
- ✅ Good answer: Explains architecture, shows code examples, discusses patterns
- ❌ Bad answer: Just shows one quick approach without explanation

---

### For Gemini CLI / Code Generators

**Question 1:** "Generate a FastAPI CRUD endpoint and explain how to integrate it"
- ✅ Good answer: Code + integration instructions + testing commands
- ❌ Bad answer: Just code, no context on where to put it

**Question 2:** "Does your generated code follow our project patterns?"
- ✅ Good answer: "Yes, using FastAPI 0.115.6, dependency injection, Pydantic schemas"
- ❌ Bad answer: "I don't know the project patterns"

---

## 📊 Audit Report Template

Use this to document evaluation:

```markdown
# AI Evaluation Report

**AI Name:** [Claude Code / ChatGPT / Gemini CLI / etc.]
**Date:** 2025-11-16
**Evaluator:** [Your name]

## Scores

| Category | Score | Status |
|----------|-------|--------|
| Pre-Work Phase | 5/5 | ✅ |
| Task Execution | 8/10 | ⚠️ |
| Code Quality | 7/8 | ✅ |
| Compliance | 7/7 | ✅ |
| Testing | 5/5 | ✅ |
| **TOTAL** | **32/35** | **91%** |

## Strengths
- [Specific praise]
- [Specific praise]

## Areas for Improvement
- [Specific issue with guidance]
- [Specific issue with guidance]

## Recommendations
1. [Action item]
2. [Action item]
3. [Action item]

## Next Steps
- [ ] Review recommendations with AI
- [ ] Re-test in next task
- [ ] Document improvements
```

---

## 🚀 How to Use This Checklist

### As Project Lead

1. **Initial Setup:** Onboard AI with AGENT_QUICK_START.md
2. **First Task:** Use this checklist after first implementation
3. **Ongoing:** Check checklist periodically (after 5th, 10th task)
4. **Improvement:** Document patterns and provide feedback

### As AI System

When evaluating yourself:

1. **Before Finishing:** Mentally run through this checklist
2. **Answer Honestly:** Don't self-grade too generously
3. **Ask for Feedback:** "Can you evaluate my work with this checklist?"
4. **Improve:** Address any ⚠️ items before next task

---

## 📞 Escalation

If AI scores below 70%:

1. **Review with AI:** Show which items failed
2. **Re-read Guidelines:** Have AI re-read relevant sections
3. **Practice Task:** Give simple task with close supervision
4. **Re-evaluate:** Check if improvements made
5. **Escalate if Needed:** Consider if AI can contribute effectively

---

**Use this checklist to maintain quality and consistency across all AI contributors!** ✅
