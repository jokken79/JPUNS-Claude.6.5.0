# 🤖 AI Integration Patterns

**How to integrate any AI system with UNS-ClaudeJP**

---

## 🎯 Overview

This guide shows exactly how to use any AI system with UNS-ClaudeJP's multi-agent architecture.

Each AI has different capabilities:

| AI System | Capabilities | Best For | Cannot Do |
|-----------|--------------|----------|-----------|
| **Claude Code** | Orchestration, delegation, full stack | Orchestrating complex projects, delegating work to specialists | Web access (unless you have it) |
| **ChatGPT** | Analysis, code review, suggestions | Architecture questions, code reviews, learning | Run commands, commit code, test directly |
| **Claude.ai (Web)** | Analysis, documentation, planning | Design docs, architecture, planning | Run commands, commit code |
| **Gemini CLI** | Code generation, analysis, patterns | Boilerplate generation, code analysis | Orchestration, complex workflows |
| **GitHub Copilot** | Code completion, suggestions | IDE code completion | Standalone tasks, no web context |

---

## 🔄 Integration Patterns

### Pattern 1: Claude Code as Orchestrator (PRIMARY)

**Best for:** Complex projects, multiple features, tight deadlines

```
User Request
    ↓
Claude Code reads agents.md
    ↓
Creates todo list (TodoWrite)
    ↓
For each todo:
  ├─ Detects technology
  ├─ Research if needed (Jina AI)
  ├─ Delegates to specialist (Task tool)
  └─ Tests with Playwright
    ↓
All todos complete → Report to user
```

**When to use:** ANY complex request

---

### Pattern 2: ChatGPT as Consultant + Claude Code as Executor

**Best for:** Architecture decisions, learning, detailed guidance

```
User: "How should I structure the payment system?"
    ↓
ChatGPT:
├─ Explains architecture
├─ Shows code examples
├─ Suggests best practices
└─ User copies response
    ↓
User pastes to Claude Code:
"Here's ChatGPT's suggestion: [paste]
Please implement it."
    ↓
Claude Code:
├─ Reads suggestion
├─ Creates todo list
├─ Delegates to specialists
├─ Tests everything
└─ Creates PR
```

**When to use:** Planning phase, architectural questions, code reviews

**Example Prompts for ChatGPT:**

```
"I'm building a Japanese HR system using Next.js + FastAPI.
I need to add a candidates import feature that:
- Accepts Excel/CSV files
- Validates Japanese characters
- Handles duplicate detection
- Stores in PostgreSQL

Show me:
1. The API endpoint design
2. The Pydantic schema
3. The React component
4. Error handling approach

Don't implement it yet, just show the patterns."
```

---

### Pattern 3: Gemini CLI for Code Generation

**Best for:** Boilerplate, schema generation, code analysis

```
Developer: "Generate a FastAPI CRUD endpoint for the contracts table"
    ↓
Gemini CLI:
├─ Analyzes models.py
├─ Generates full CRUD code
└─ Developer reviews & integrates
    ↓
Developer pastes into Claude Code:
"Here's Gemini-generated code. Please integrate and test it."
    ↓
Claude Code:
├─ Reviews code
├─ Integrates
├─ Tests
└─ Creates PR
```

**When to use:** Repetitive code generation, boilerplate, quick scaffolding

**Setup:**

```bash
# Install Gemini CLI
npm install -g @google/generative-ai-cli

# Or use directly with API key
export GOOGLE_API_KEY="your-key"

# Example usage
gemini-code generate-endpoint \
  --model=FastAPI \
  --table=contracts \
  --action=CRUD
```

---

## 📝 Prompt Templates by AI Type

### For Claude Code (Orchestrator)

**Template for complex features:**

```
User: "Implement [FEATURE] that [REQUIREMENT]"

Claude Code should respond:

"I'll implement [FEATURE] using the orchestration system.

Let me create a todo list:
1. [Sub-task 1]
2. [Sub-task 2]
3. [Testing & verification]

Starting with task 1..."

[Creates TodoWrite, delegates to specialists, tests, reports]
```

**Example:**

```
"Add candidate import feature that:
- Accepts Excel files
- Validates Japanese data
- Detects duplicates
- Stores in database"

Claude Code:
1. Creates todo list with 6 items
2. Delegates to api-developer (API design)
3. Delegates to database-specialist (schema)
4. Delegates to frontend-architect (form UI)
5. Tests each piece
6. Reports: ✅ Feature complete
```

---

### For ChatGPT (Consultant)

**Template for architecture questions:**

```
Context: I'm working on [PROJECT] with [TECH STACK]

Question: How should I [PROBLEM]?

Constraints:
- Must use [REQUIREMENT 1]
- Must not use [REQUIREMENT 2]
- Performance: [REQUIREMENT 3]

Show me:
1. [Aspect 1] (with code example)
2. [Aspect 2] (with code example)
3. [Aspect 3] (with reasoning)

Don't implement yet, just show the patterns.
```

**Example:**

```
Context: UNS-ClaudeJP HR system (Next.js 16 + FastAPI + PostgreSQL)

Question: How should I implement the OCR document processing pipeline?

Constraints:
- Must support 3 OCR providers (Azure, EasyOCR, Tesseract)
- Must process Japanese documents (resume, residence card, license)
- Must extract 50+ fields
- Must have fallback logic

Show me:
1. Service architecture (class structure)
2. Error handling (try/except flow)
3. Fallback logic (when to switch providers)
```

---

### For Gemini CLI (Code Generator)

**Template for code generation:**

```
Generate a [CODE TYPE] for:
- Model: [DATABASE TABLE]
- Actions: [CRUD / READ / WRITE / DELETE]
- Validation: [REQUIRED RULES]
- Return type: [JSON / OBJECT / LIST]

Context:
- Using [FRAMEWORK] version [VERSION]
- Following [PATTERN]
- With [SPECIAL REQUIREMENTS]
```

**Example:**

```
Generate a FastAPI CRUD endpoint for the candidates table:
- Model: Candidate (from backend/app/models/models.py)
- Actions: CREATE, READ, UPDATE, DELETE, LIST
- Validation: Japanese names, email format, date validation
- Return type: Pydantic CandidateResponse

Context:
- FastAPI 0.115.6
- SQLAlchemy 2.0.36
- Following dependency injection pattern
- Include error handling and validation
```

---

### For GitHub Copilot (Code Completion)

**Best used in IDE directly:**

```
Start typing code, Copilot suggests completions.

Best for:
- Implementing a service method (type function signature, Copilot suggests implementation)
- Creating a component (type component name, Copilot suggests JSX)
- Writing tests (type test name, Copilot suggests test cases)

Then review suggestions and copy to Claude Code for testing.
```

---

## 🚀 Complete Workflow Examples

### Example 1: Adding a New Module (Orchestrated)

```
User: "Add a contracts module to manage employee contracts"

Claude Code (Orchestrator):
1. Creates todo list:
   [ ] Design contract schema
   [ ] Create database model
   [ ] Create API endpoints (CRUD)
   [ ] Create React components
   [ ] Add tests
   [ ] Test E2E

2. For "Design contract schema" todo:
   - Delegates to: database-specialist
   - Specialist creates schema with relationships
   - Tester verifies database schema

3. For "Create API endpoints" todo:
   - Delegates to: api-developer
   - Specialist creates FastAPI router
   - Tester verifies endpoints work

4. For "Create React components" todo:
   - Delegates to: frontend-architect + ui-designer
   - Specialists create components
   - Tester verifies UI works

5. For "Add tests" todo:
   - Delegates to: testing-qa
   - Specialist writes all tests
   - Tester runs tests

6. Reports: ✅ Contracts module complete

Claude Code then:
- Creates PR
- All tests passing
- Ready for merge
```

---

### Example 2: Architecture Question (ChatGPT + Claude Code)

```
User: "How should I implement the Japanese payroll calculation system?"

Step 1: User asks ChatGPT:
"I'm building a payroll system for Japan.
Need to calculate:
- Base salary
- Overtime (時間外手当)
- Bonuses (賞与)
- Taxes (所得税)
- Social insurance (社会保険)
- Pension (厚生年金)

Show me the architecture and code patterns."

ChatGPT responds with:
- Service architecture
- Calculation formulas
- Tax tables
- Code examples (classes, methods)
- Error handling approach

Step 2: User copies ChatGPT's response and pastes to Claude Code:
"Here's the payroll architecture from ChatGPT.
Please implement it:
[Paste ChatGPT's full response]"

Claude Code:
- Reads ChatGPT's architecture
- Creates todo list
- Delegates to payroll-calculator specialist
- Implements all logic
- Tests with sample calculations
- Creates PR
```

---

### Example 3: Boilerplate Generation (Gemini CLI + Claude Code)

```
Developer: "Generate a new API module for requests/leave"

Step 1: Use Gemini CLI to generate:
```bash
gemini-code generate-fastapi-module \
  --table=requests \
  --actions=CRUD \
  --model-file=backend/app/models/models.py
```

Step 2: Gemini CLI generates:
- API router file
- Schema file
- Service file

Step 3: Developer pastes to Claude Code:
"Here's Gemini-generated code for the requests module.
Please integrate, test, and create PR:
[Paste code]"

Claude Code:
- Integrates into project
- Adds to API __init__.py
- Tests all endpoints
- Tests database operations
- Creates PR
```

---

## 🔧 Setting Up Each AI

### Claude Code

**Already integrated!**

```bash
# Start Claude Code
claude dev <project-path>

# It automatically:
# - Reads agents.md
# - Reads CLAUDE.md
# - Activates specialized agents
# - Uses TodoWrite for task tracking
```

---

### ChatGPT

**For architecture questions & code review:**

```
1. Go to ChatGPT (chat.openai.com)
2. Create new conversation
3. Provide context:
   "I'm working on UNS-ClaudeJP (Next.js + FastAPI + PostgreSQL HR system)"
4. Ask questions about architecture/design
5. Copy responses to Claude Code for implementation
```

---

### Claude.ai (Web)

**For learning & documentation:**

```
1. Go to Claude.ai
2. Upload project files or provide context
3. Ask questions about:
   - Architecture
   - Design patterns
   - Troubleshooting
   - Documentation
4. Copy responses to Claude Code
```

---

### Gemini CLI

**For code generation:**

```bash
# Install
npm install -g @google/generative-ai-cli

# Set API key
export GOOGLE_API_KEY="your-key"

# Use for boilerplate generation
gemini-code generate-endpoint --table=candidates --action=CRUD

# Copy output to Claude Code for integration
```

---

### GitHub Copilot

**For IDE code completion:**

```
1. Install GitHub Copilot extension in VS Code
2. Enable in settings
3. Start typing code
4. Copilot suggests completions
5. Accept suggestions or modify
6. Test in Claude Code
```

---

## 📊 Quick Reference Matrix

| AI | Orchestration | Code Review | Code Gen | Architecture | Testing |
|----|---|---|---|---|---|
| Claude Code | ✅✅✅ | ✅ | ✅ | ✅ | ✅✅✅ |
| ChatGPT | ❌ | ✅✅✅ | ✅ | ✅✅✅ | ❌ |
| Claude.ai | ❌ | ✅✅ | ✅ | ✅✅✅ | ❌ |
| Gemini CLI | ❌ | ✅ | ✅✅✅ | ✅ | ❌ |
| GitHub Copilot | ❌ | ❌ | ✅✅ | ❌ | ❌ |

---

## 🎓 Best Practices

### 1. **Always Start with Context**
Any AI should read:
1. agents.md
2. .claude/CLAUDE.md
3. .cursorrules

### 2. **Provide Complete Context**
Don't ask vague questions. Include:
- What you're building
- Tech stack being used
- Constraints/requirements
- Code examples or file paths

### 3. **Use Specialists for Complex Work**
Don't ask one AI to do everything. Use:
- ChatGPT for architecture
- Gemini for boilerplate
- Claude Code for execution & testing

### 4. **Always Test After Generation**
Any AI-generated code needs:
- Type checking (`npm run type-check`)
- Unit tests
- E2E tests
- Code review

### 5. **Document the Flow**
When using multiple AIs:
1. Document who did what
2. Document decisions made
3. Keep a log of AI-assisted work

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Using Wrong AI for Task
```
WRONG: "Claude.ai, run the test suite"
RIGHT: "Claude Code, run the test suite"
       (Claude.ai can't execute commands)
```

### ❌ Mistake 2: Not Verifying Generated Code
```
WRONG: Use Gemini-generated code directly
RIGHT: Gemini generates → You review → Claude Code tests → Then use
```

### ❌ Mistake 3: No Context
```
WRONG: "Generate a FastAPI endpoint"
RIGHT: "Generate a FastAPI CRUD endpoint for the contracts table
       following FastAPI 0.115.6 patterns and dependency injection"
```

### ❌ Mistake 4: Multiple AIs Conflicting
```
WRONG: ChatGPT suggests architecture, Gemini suggests different pattern
RIGHT: Get ChatGPT's architecture first, use Gemini to generate following it
```

### ❌ Mistake 5: Forgetting to Update Agents
```
WRONG: Add new code without updating agents.json
RIGHT: Always update agents.json if adding new agent rules
```

---

## 📞 Support

If any AI gets stuck:

1. **In Claude Code:** Use `Task(subagent_type="stuck", ...)`
2. **In ChatGPT:** Say "I'm stuck on [problem], how do I?"
3. **In other AIs:** Escalate to human for clarification

---

**This guide enables any AI to effectively contribute to UNS-ClaudeJP!** 🚀
