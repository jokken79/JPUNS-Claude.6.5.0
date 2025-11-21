# 🔧 AI Troubleshooting Guide

**For AI systems when things go wrong**

---

## 🚨 Common Issues & Solutions

### Issue 1: "I don't know what to do"

**Symptom:** You're confused about where to start or what the project needs.

**Solution:**

```bash
# 1. Read files in order
cat AGENT_QUICK_START.md          # ← Start here
cat .claude/CLAUDE.md              # ← Orchestrator pattern
cat agents.md                       # ← Development guide
cat .cursorrules                    # ← Golden rules

# 2. Create a todo list (if you're Claude Code)
# Use TodoWrite to break work into steps

# 3. Start with first todo
# Don't try to do everything at once
```

---

### Issue 2: "Services aren't healthy"

**Symptom:** `docker compose ps` shows services as "unhealthy"

**Solution:**

```bash
# 1. Check all services
docker compose ps

# 2. View logs of unhealthy service
docker compose logs backend  # Replace with service name

# 3. Common causes:
# - Service not ready yet (wait 30s)
# - Port already in use
# - Database not initialized
# - Wrong environment variables

# 4. Full reset
docker compose down
docker compose up -d
sleep 30
docker compose ps  # Check again
```

**If backend won't start:**
```bash
# Database migration issue
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"
docker compose restart backend
```

**If frontend won't compile:**
```bash
# Clear cache
docker exec -it uns-claudejp-frontend bash -c "rm -rf .next && npm run build"
docker compose restart frontend
```

---

### Issue 3: "TypeScript errors before commit"

**Symptom:** `npm run type-check` fails with type errors

**Solution:**

```bash
# 1. See all errors
docker exec -it uns-claudejp-frontend npm run type-check

# 2. Common fixes:
# - Add @ts-ignore (if you know what you're doing)
# - Fix prop types (check component interface)
# - Add null checks (use ?)
# - Import types correctly (import type { Type } from '...')

# 3. Fix and recheck
docker exec -it uns-claudejp-frontend npm run type-check

# CRITICAL: Don't commit if types don't pass!
```

---

### Issue 4: "Tests are failing"

**Symptom:** `pytest` or `npm test` shows failures

**Solution - Backend:**

```bash
# 1. See which tests failed
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/ -v"

# 2. Run specific failing test with more detail
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/test_file.py::test_name -vvs"

# 3. Check test database state
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp_test -c "SELECT * FROM users;"

# 4. Common issues:
# - Data state changed (test expected empty table)
# - Transaction not rolled back
# - Mock not set up correctly
# - Database not initialized

# 5. Fix and rerun tests
docker exec -it uns-claudejp-backend bash -c "cd /app && pytest tests/test_file.py -v"
```

**Solution - Frontend:**

```bash
# 1. See which tests failed
docker exec -it uns-claudejp-frontend npm test

# 2. Run specific test
docker exec -it uns-claudejp-frontend npm test -- tests/component.test.tsx

# 3. Common issues:
# - Component not rendering
# - Mock not configured
# - Async operation not awaited
# - Event not firing

# 4. Fix and rerun
docker exec -it uns-claudejp-frontend npm test

# 5. E2E tests
docker exec -it uns-claudejp-frontend npm run test:e2e
```

---

### Issue 5: "Can't access the database"

**Symptom:** "Connection refused" or "Authentication failed"

**Solution:**

```bash
# 1. Check database is running
docker compose ps db

# 2. Test connection
docker exec -it uns-claudejp-db pg_isready -U uns_admin

# 3. Check credentials in .env
cat .env | grep DATABASE_URL
# Should be: postgresql://uns_admin:password@db:5432/uns_claudejp

# 4. Check database exists
docker exec -it uns-claudejp-db psql -U uns_admin -c "\l"

# 5. If not, create it
docker exec -it uns-claudejp-db psql -U uns_admin -c "CREATE DATABASE uns_claudejp;"

# 6. Run migrations
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"
```

---

### Issue 6: "I modified the wrong file"

**Symptom:** You accidentally changed `.claude/CLAUDE.md`, `docker-compose.yml`, or another protected file

**Solution:**

```bash
# 1. Check what you changed
git status

# 2. If you haven't committed:
git checkout -- <file>  # Revert the file

# 3. If you already committed:
git revert HEAD  # Create new commit reverting changes

# 4. Then ask the user:
"I accidentally modified [protected file]. I've reverted it.
Can I make this change with your permission?"
```

---

### Issue 7: "Specialist agent failed"

**Symptom:** You delegated work to a specialist agent and it returned an error.

**Solution:**

```
1. Check error message carefully
2. Understand what went wrong:
   - Missing context?
   - Unclear requirements?
   - Technology not available?
   - Task too complex?

3. Re-invoke with better context:
   Task(
       subagent_type="general-purpose",
       description="[More specific description]",
       prompt="""
       [Better context]
       [More detailed requirements]
       [Code examples]
       """
   )

4. If still failing:
   Task(
       subagent_type="stuck",
       description="Need human help",
       prompt="I tried [A] and [B], but keep failing. [Error]. How should I proceed?"
   )
```

---

### Issue 8: "Package dependency conflict"

**Symptom:** `npm install` fails or `pip install` fails

**Solution:**

```bash
# Backend (Python)
docker exec -it uns-claudejp-backend bash -c "cd /app && pip install --upgrade -r requirements.txt"

# Frontend (Node.js)
docker exec -it uns-claudejp-frontend bash -c "rm -rf node_modules package-lock.json && npm install"

# If still failing:
# STOP! Do not change version numbers!
# You must ask the user first.
# See .cursorrules for locked dependencies.
```

---

### Issue 9: "I'm getting 404 errors"

**Symptom:** Links return 404 in browser

**Solution:**

```
CRITICAL RULE: If you put a link in a header/footer/navigation,
you MUST create the actual page for it!

1. Search where the broken link is:
   grep -r "404" frontend/

2. Find the page that should exist:
   Page link: /candidates → Need: frontend/app/(dashboard)/candidates/page.tsx

3. Create the missing page:
   Create the file with basic structure

4. Test with Playwright:
   npm run test:e2e -- --grep "navigation"

5. Remember: Link → Must have page (ALWAYS!)
```

---

### Issue 10: "Git branch issues"

**Symptom:** Git push fails or merge conflicts

**Solution:**

```bash
# 1. Check your branch
git branch -a

# 2. If wrong branch:
git checkout claude/add-agents-documentation-SESSION_ID

# 3. If push fails:
git pull origin <branch>
git push -u origin <branch>

# 4. If merge conflicts:
# This is complex! Escalate to user:
Task(
    subagent_type="stuck",
    description="Git merge conflict",
    prompt="I have a merge conflict in [files]. How should I resolve this?"
)

# 5. Never force push without permission!
# NEVER use: git push --force-with-lease
```

---

### Issue 11: "API endpoint not working"

**Symptom:** `curl http://localhost:8000/api/endpoint` returns error

**Solution:**

```bash
# 1. Check backend is running
docker compose ps backend

# 2. Check logs
docker compose logs backend | tail -50

# 3. Test API directly
curl -X GET http://localhost:8000/api/health

# 4. Check the endpoint exists
docker exec -it uns-claudejp-backend bash -c "cd /app && grep -r '@router.get' app/api/"

# 5. Common issues:
# - Endpoint not registered in main.py
# - Authentication required (need token)
# - Database connection failed
# - Validation error

# 6. Fix and retest
curl -X GET http://localhost:8000/api/health
```

---

### Issue 12: "Frontend won't build"

**Symptom:** `npm run build` fails

**Solution:**

```bash
# 1. Clear cache
docker exec -it uns-claudejp-frontend bash -c "rm -rf .next node_modules"

# 2. Reinstall
docker exec -it uns-claudejp-frontend npm install

# 3. Check for TypeScript errors first
docker exec -it uns-claudejp-frontend npm run type-check

# 4. Try build again
docker exec -it uns-claudejp-frontend npm run build

# 5. If still failing, check logs carefully
docker exec -it uns-claudejp-frontend npm run build 2>&1 | tail -100

# 6. Common issues:
# - TypeScript errors (fix first!)
# - Missing imports
# - Invalid JSX syntax
```

---

### Issue 13: "I'm out of context"

**Symptom:** You're Claude Code and ran out of 200k context

**Solution:**

```
If you're running low on context (over 150k used):

1. Create a comprehensive progress report:
   "Completed todos: [list]
    Current state: [description]
    Next steps: [list]
    Key decisions: [list]"

2. Create new session with report as context

3. In new session:
   "I'm continuing work on UNS-ClaudeJP.
    Previous progress: [your report]
    Next todo: [specific task]"

Don't try to squeeze everything into one session!
```

---

### Issue 14: "Linting errors"

**Symptom:** `npm run lint` shows errors

**Solution:**

```bash
# 1. See all errors
docker exec -it uns-claudejp-frontend npm run lint

# 2. Auto-fix common issues
docker exec -it uns-claudejp-frontend npm run lint:fix

# 3. Common errors:
# - Unused imports (remove them)
# - Missing semicolons (fix)
# - Wrong quotes (use single)
# - Spacing issues (ESLint fixes)

# 4. Recheck
docker exec -it uns-claudejp-frontend npm run lint
```

---

### Issue 15: "Permission denied errors"

**Symptom:** Can't write to files or run Docker commands

**Solution:**

```bash
# Docker permission issue (Linux)
sudo usermod -aG docker $USER
newgrp docker

# File permission issue
# DON'T change permissions on protected files!
# Instead, work within your permissions

# Or ask the user:
"I'm getting permission errors on [file].
Is this expected? Should I approach this differently?"
```

---

## 🆘 Escalation Checklist

**If you've tried everything and still stuck:**

```bash
# 1. Gather complete information
# - What were you trying to do?
# - What errors did you get?
# - What have you already tried?
# - Current state of system?

# 2. Use stuck agent (Claude Code only)
Task(
    subagent_type="stuck",
    description="Need human decision",
    prompt="""
    I was trying to: [task]
    I got error: [error]
    I tried: [solution A, B, C]
    Current state: [what it looks like now]

    How should I proceed?
    """
)

# 3. For other AIs
# Use AskUserQuestion tool (if available)
# Or directly ask in context

# 4. Provide clear next steps
"I'm blocked on [issue]. Please help with [specific request]."
```

---

## 📊 Decision Tree

```
Something went wrong
    ↓
Is it a Docker issue?
├─ YES: See "Services aren't healthy"
└─ NO: Continue
    ↓
Is it a code issue?
├─ YES:
│   ├─ TypeScript errors? → See "TypeScript errors before commit"
│   ├─ Tests failing? → See "Tests are failing"
│   └─ Other? → See "Frontend won't build"
└─ NO: Continue
    ↓
Is it a database issue?
├─ YES: See "Can't access the database"
└─ NO: Continue
    ↓
Is it a Git issue?
├─ YES: See "Git branch issues"
└─ NO: Continue
    ↓
Is it unclear what to do?
├─ YES: See "I don't know what to do"
└─ NO: Continue
    ↓
Are you completely stuck?
├─ YES: Use escalation checklist above
└─ NO: Read again more carefully
```

---

## 🚀 Prevention Tips

**To avoid most issues:**

1. **Always test before committing**
   ```bash
   npm run type-check
   npm test
   pytest backend/tests/
   npm run test:e2e
   ```

2. **Read errors carefully**
   - Don't just see "error", understand WHY

3. **Small, focused changes**
   - One feature at a time
   - Easier to debug if something breaks

4. **Use version control**
   - Commit frequently
   - Revert if needed

5. **Ask for help early**
   - Don't struggle for hours
   - Escalate when blocked
   - User wants you to succeed!

6. **Follow the rules**
   - Don't modify protected files
   - Don't change dependency versions
   - Don't skip testing
   - Don't use raw SQL

---

## 📞 Getting Help

### If you're Claude Code:
```
Task(subagent_type="stuck", description="Need help", prompt="[problem]")
```

### If you're ChatGPT/Claude.ai:
```
"I'm working on a UNS-ClaudeJP project. I'm stuck on [problem].
What's the best way to [solve it]?"
```

### If you're another AI:
```
Ask the user directly for clarification or help.
Don't try to solve everything yourself.
Escalation is okay!
```

---

**Remember: Getting stuck is normal. Getting help is smart.** 🚀
