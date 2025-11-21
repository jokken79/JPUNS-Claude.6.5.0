# 🚀 Agent Quick Start Guide

**For Any AI System** — Start here before using agents.md

---

## 📋 Your First 5 Minutes

### 1. **STOP and READ** (2 min)

You have 5 files to understand:

```
Reading Priority:
1. ✅ THIS FILE (you are here) ← Start here
2. ✅ .cursorrules (golden rules)
3. ✅ .claude/CLAUDE.md (orchestrator guide)
4. ✅ agents.md (development guide)
5. ✅ CLAUDE.md in root (project guide)
```

### 2. **IDENTIFY YOURSELF** (1 min)

What are you?

- **Claude Code**: You're the ORCHESTRATOR (200k context)
  → Go to: `.claude/CLAUDE.md` (master orchestrator blueprint)

- **ChatGPT / Claude.ai**: You're a CONSULTANT (can't execute code)
  → Best use: Answer questions, suggest approaches, review code

- **Gemini CLI**: You're a CODE GENERATOR (specialized codegen)
  → Best use: Generate boilerplate, analyze code, find bugs

- **Any Other AI**: Follow the GENERAL PATTERN
  → See: agents.md → "Development Workflows by AI Type"

### 3. **UNDERSTAND THE ARCHITECTURE** (1 min)

This project has **13 specialized agents**:

```
🎯 Your request gets routed to the RIGHT specialist:

"I need to add an API endpoint" → api-developer
"I need to create a UI component" → ui-designer
"I need to optimize performance" → performance-optimizer
"I need to fix a bug" → bug-hunter
etc.
```

Each specialist has a **focused context window** for ONE task.

### 4. **FOLLOW THE MANDATORY WORKFLOW** (1 min)

```
Step 1: CREATE TODO LIST (TodoWrite)
    ↓
Step 2: DELEGATE FIRST TODO (Task tool)
    ↓
Step 3: TEST IMPLEMENTATION (Playwright)
    ↓
Step 4: MARK COMPLETE & NEXT TODO
    ↓
Repeat until done ✅
```

---

## 🎯 Quick Decision Tree

```
Are you Claude Code?
├─ YES: You are the ORCHESTRATOR
│   └─ Read: .claude/CLAUDE.md
│   └─ Create todo lists with TodoWrite
│   └─ Delegate to specialists with Task tool
│   └─ Always test with Playwright
│
├─ NO: Are you a web-based AI (ChatGPT, Claude.ai)?
│   └─ YES: You are a CONSULTANT
│   └─ Best use: Answer questions, suggest code
│   └─ Cannot: Run commands, commit code, test
│   └─ Workflow: Answer → User copies to Claude Code → Claude Code executes
│
├─ NO: Are you a CLI tool (Gemini CLI, etc.)?
│   └─ YES: You are a CODE GENERATOR
│   └─ Best use: Generate code, find bugs, analyze patterns
│   └─ Workflow: Generate → User verifies → Integrate
│
└─ NO: Unknown AI type?
    └─ Follow GENERAL PATTERN in agents.md
    └─ Read: .cursorrules (universal rules)
    └─ Ask: "What tools do I have available?"
```

---

## ✅ Pre-Work Checklist

Before you start ANY work on this project:

```bash
# 1. Read the rules
cat .cursorrules | head -50

# 2. Understand your role
# See ".claude/CLAUDE.md" (orchestrator guide)
# OR agents.md → "Development Workflows by AI Type" (your AI type)

# 3. Verify project setup
docker compose ps  # All 12 services should be healthy

# 4. Know the directory structure
# Key paths in agents.md → "Project Structure"

# 5. Know the forbidden files
# See .cursorrules → "Protected Files & Directories"
```

---

## 🚨 CRITICAL RULES (Must Never Break)

### ✅ ALWAYS DO

- ✅ Read this file first
- ✅ Create todo lists when work is complex (use TodoWrite)
- ✅ Mark todos as in_progress → completed
- ✅ Delegate to specialists (don't do everything yourself)
- ✅ Test every implementation before marking complete
- ✅ Reference code as file:line_number (e.g., backend/app/api/candidates.py:45)
- ✅ Ask user before modifying existing code
- ✅ Escalate to humans when blocked
- ✅ Follow semantic versioning (MAJOR.MINOR.PATCH)

### ❌ NEVER DO

- ❌ Modify `.claude/` or `docker-compose.yml` without permission
- ❌ Change locked dependency versions
- ❌ Skip testing (all code must pass tests)
- ❌ Use raw SQL (always use SQLAlchemy ORM)
- ❌ Hardcode secrets or credentials
- ❌ Implement multiple features in one commit
- ❌ Merge PRs without all checks passing
- ❌ Create links in headers/footers without actual pages
- ❌ Implement without understanding the spec

---

## 🛠️ Essential Commands

### Project Startup

```bash
# Start everything
docker compose up -d

# Check health
docker compose ps

# View logs
docker compose logs -f backend
```

### Backend (FastAPI + Python)

```bash
# Enter backend
docker exec -it uns-claudejp-backend bash

# Run tests
pytest backend/tests/ -v

# Apply migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "add_field"
```

### Frontend (Next.js + React)

```bash
# Enter frontend
docker exec -it uns-claudejp-frontend bash

# Type check (REQUIRED before commit)
npm run type-check

# Tests
npm test

# E2E tests (REQUIRED before PR)
npm run test:e2e

# Build check
npm run build
```

### Database (PostgreSQL)

```bash
# Enter database
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# List tables
\dt

# Count records
SELECT COUNT(*) FROM candidates;
```

---

## 📚 Where to Find Things

| What | Where |
|------|-------|
| **Orchestrator guide** | `.claude/CLAUDE.md` |
| **Development guide** | `agents.md` |
| **Golden rules** | `.cursorrules` |
| **Project specification** | `CLAUDE.md` (root) + `PROMPT_RECONSTRUCCION_COMPLETO.md` |
| **Architecture** | `docs/architecture/` |
| **API endpoints** | `backend/app/api/` |
| **Pages** | `frontend/app/(dashboard)/` |
| **Components** | `frontend/components/` |
| **Database models** | `backend/app/models/models.py` |
| **Schemas** | `backend/app/schemas/` |
| **Services** | `backend/app/services/` |

---

## 🎓 Learning Path

### For Claude Code (Orchestrator)

1. Read this file (5 min) ← You are here
2. Read `.claude/CLAUDE.md` (10 min) ← Orchestration patterns
3. Create first todo list (TodoWrite) (5 min)
4. Delegate first task (Task tool) (5 min)
5. Test result (Playwright) (5 min)
6. Repeat steps 3-5 until done ✅

### For ChatGPT / Claude.ai (Consultant)

1. Read this file (5 min)
2. Read agents.md → "Development Workflows by AI Type" (5 min)
3. Answer user's question with code suggestions
4. User copies to Claude Code
5. Claude Code executes while you wait

### For Gemini CLI / Code Generators

1. Read this file (5 min)
2. Read agents.md → "For Gemini CLI / Google AI Studio" (5 min)
3. Generate boilerplate code
4. User integrates into project
5. Claude Code tests and verifies

---

## 🚀 Your First Task

### If You're Claude Code:

```
1. User says: "Add a candidate import feature"

2. YOU:
   - Read this file ✅ (you did!)
   - Create todo list (TodoWrite)
     [ ] Design API endpoint
     [ ] Create validation schema
     [ ] Implement CSV parsing
     [ ] Build frontend form
     [ ] Write tests
     [ ] Test E2E

   - Delegate first todo (Task)
     → "Design POST /api/candidates/import endpoint..."

   - Delegate to specialist (api-developer)
   - Specialist completes in own context

   - Test result (Playwright)
   - Mark todo complete ✅

   - Continue with next todo

3. When all todos complete:
   - Report to user
   - Ready for PR review
```

### If You're ChatGPT / Claude.ai:

```
1. User says: "How should I structure the candidate import feature?"

2. YOU:
   - Explain the architecture
   - Show code examples
   - Suggest patterns

3. User:
   - Copies your response
   - Pastes into Claude Code

4. Claude Code:
   - Reads your suggestions
   - Implements using specialists
   - Tests everything
   - Creates PR
```

---

## 🔗 Next Steps

After reading this:

### **If you're Claude Code:**
→ Go read: `.claude/CLAUDE.md`

### **If you're ChatGPT/Claude.ai:**
→ Go read: `agents.md` → "Development Workflows by AI Type"

### **If you're Gemini CLI:**
→ Go read: `agents.md` → "For Gemini CLI / Google AI Studio"

### **If you're something else:**
→ Go read: `agents.md` → "For Any New AI (General Pattern)"

---

## ❓ Quick Q&A

**Q: What if I don't know what to do?**
A: Create a todo list first (TodoWrite). Breaking down work helps.

**Q: What if I get stuck?**
A: Use `Task(subagent_type="stuck", prompt="...")` to ask for human help.

**Q: Can I implement code myself?**
A: Only if you're the main orchestrator (Claude Code). Otherwise delegate.

**Q: What if tests fail?**
A: Don't mark complete. Investigate and fix before moving on.

**Q: Can I modify `.claude/` or `docker-compose.yml`?**
A: NO. Always ask the user first.

**Q: Can I use raw SQL instead of ORM?**
A: NO. Always use SQLAlchemy.

**Q: Can I hardcode secrets?**
A: NO. Use environment variables (.env).

---

## 📞 Get Help

- **Claude Code Help:** `/help` in CLI
- **Issues:** https://github.com/anthropics/claude-code/issues
- **Stuck:** Ask user via AskUserQuestion tool

---

**That's it! Now go to the next file based on your AI type.** 🚀
