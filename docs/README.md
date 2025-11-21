# 📚 UNS-ClaudeJP 6.0.0 Documentation

**Comprehensive documentation for the UNS-ClaudeJP HR Management System (人材派遣会社向けシステム)**

---

## 🚀 Quick Start

**New to UNS-ClaudeJP?** Start here:

1. **[Getting Started](setup/getting-started.md)** - Begin your 8-week remediation journey
2. **[Installation Guide](setup/installation.md)** - Set up on a new PC
3. **[Quick Reference](setup/next-steps.md)** - Next steps after setup

---

## 📖 Documentation Structure

### 🔧 Setup & Deployment
- **[Getting Started Guide](setup/getting-started.md)** - 8-week remediation plan overview
- **[Installation Instructions](setup/installation.md)** - Complete installation for Windows/Linux/Mac
- **[Next Steps](setup/next-steps.md)** - Onboarding checklist

### 📋 Guides & How-To
- **[Guides Overview](guides/)** - All operational guides
  - **[Theme Customization](guides/theming/)** - Customize colors, styles, and themes
    - [Quick Start](guides/theming/quick-start.md)
    - [Complete Guide](guides/theming/complete-guide.md)
    - [Testing Guide](guides/theming/testing-guide.md)
  - **[Data Import](guides/import/)** - Import candidates, employees, and data
    - [Candidate Import](guides/import/candidatos-completa.md)
    - [Photo Synchronization](guides/import/photo-sync.md)
    - [Reference Data](guides/import/reference-data.md)
  - **[Troubleshooting](guides/troubleshooting/)** - Common issues and solutions
  - **[Error Boundaries](guides/error-boundary.md)** - Frontend error handling

### ✨ Features & Architecture
- **[Features Overview](features/)** - Feature documentation
  - [Candidate-Employee Relationship](features/candidate-employee-diagrams.md)
  - [Quick Reference Guide](features/candidate-employee-reference.md)
  - [Frontend Fixes & Updates](features/frontend-fix.md)
  - [Docker Setup](features/docker-fix.md)
  - [Hydration Fix](features/hydration-fix.md)
  - [Diagnostics](features/candidates-diagnostic.md)

- **[Architecture](architecture/)** - System design and structure
- **[Database Schema](database/)** - Database models and relationships
- **[API Documentation](api/)** - REST API endpoints and integration

### 📊 Reports & Analysis
- **[Audit Reports](audit/)** - System audit findings
  - [Complete Analysis](audit/complete-analysis.md)
  - [Backend Report](audit/backend-report.md)
  - [Bug Report](audit/bugs-report.md)
  - [Test Report](audit/test-report.md)
  - [Dashboard Report](audit/dashboard-report.md)

- **[Data Analysis](analysis/)** - Data structure and import analysis
  - [Access Database Migration](analysis/access-database.md)
  - [Candidate-Employee Analysis](analysis/candidate-employee.md)
  - [Excel Import Analysis](analysis/excel-import-plan.md)

### 🔄 Refactoring & Cleanup
- **[Code Cleanup](refactoring/)** - SEMANA 3-4 consolidation results
  - [Cleanup Summary](refactoring/semana-3-4-cleanup.md)
  - [Essential Scripts](refactoring/essential-scripts.md)
  - [Configuration Fixes](refactoring/config-fixes.md)

### 📅 Planning & Decisions
- **[8-Week Execution Plan](planning/8-week-plan.md)** - Complete roadmap (SEMANA 1-8)
- **[Migration Decisions](planning/migrations-decisions.md)** - Database migration strategy
- **[Previous Cleanup Summary](refactoring/cleanup-summary.md)** - Pre-v6.0.0 cleanup

### 🔐 Security & Integration
- **[Security](security/)** - Security configurations and best practices
- **[Integrations](integration/)** - Third-party integrations
  - [Zhipu GLM Integration](integration/zhipu-glm.md)

### 🤖 AI & Agents
- **[AI Documentation](ai/)** - Claude Code and AI agents
  - [Claude Guide](ai/claude-guide.md) - AI assistant instructions (CLAUDE.md)
  - [Agents Configuration](ai/agents.md) - Agent orchestration

### 📚 Reference
- **[System Maps](reference/mapeo-rutas.md)** - Route and module maps
- **[Complete Structure](reference/estructura-completa.md)** - Project structure overview
- **[Executive Summary](reference/resumen-ejecutivo.md)** - High-level overview
- **[Documentation Index](reference/indice.md)** - Complete file index
- **[Documentation Inventory](reference/inventario.md)** - Full documentation inventory

### 📜 Changelog & History
- **[Changelogs](changelogs/)** - Version history and changes
- **[Archive](archive/)** - Obsolete or historical documentation

---

## 🎯 By Use Case

### 👤 I'm a User
1. Start with [Getting Started](setup/getting-started.md)
2. Read [Feature Documentation](features/)
3. Refer to [Troubleshooting](guides/troubleshooting/) if issues arise

### 👨‍💻 I'm a Developer
1. Read [Architecture Overview](architecture/)
2. Check [API Documentation](api/)
3. Review [Database Schema](database/)
4. See [Development Guides](guides/)

### 🏗️ I'm Setting Up a New Installation
1. Follow [Installation Guide](setup/installation.md)
2. Review [Data Import Guides](guides/import/)
3. Check [Configuration Fixes](refactoring/config-fixes.md)

### 📊 I'm Analyzing the System
1. Review [Audit Reports](audit/)
2. Check [Data Analysis](analysis/)
3. See [Complete Analysis](audit/complete-analysis.md)

### 🔄 I'm Contributing to Development
1. Read [8-Week Plan](planning/8-week-plan.md)
2. Check [Code Cleanup Summary](refactoring/semana-3-4-cleanup.md)
3. Review [Essential Scripts](refactoring/essential-scripts.md)
4. See [Architecture](architecture/)

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Documentation Files** | 611 .md files |
| **Organized in docs/** | 238+ files |
| **Feature Modules** | 45+ pages |
| **API Endpoints** | 24+ routers |
| **Database Models** | 50+ tables |
| **Test Coverage** | Development phase |
| **Code Cleanup (v6.0.0)** | -24,000 LOC (-77%) |

---

## 🗂️ Complete Directory Structure

```
docs/
├── README.md (this file)
├── setup/
│   ├── getting-started.md
│   ├── installation.md
│   └── next-steps.md
├── guides/
│   ├── error-boundary.md
│   ├── theming/
│   │   ├── quick-start.md
│   │   ├── complete-guide.md
│   │   ├── switcher-integration.md
│   │   ├── testing-guide.md
│   │   ├── cambiar-temas.md
│   │   └── summary.md
│   ├── import/
│   │   ├── candidatos-completa.md
│   │   ├── photo-sync.md
│   │   └── reference-data.md
│   └── troubleshooting/
│       └── complete-guide.md
├── features/
│   ├── candidate-employee-diagrams.md
│   ├── candidate-employee-reference.md
│   ├── candidate-employee-readme.md
│   ├── frontend-fix.md
│   ├── docker-fix.md
│   ├── hydration-fix.md
│   └── candidates-diagnostic.md
├── architecture/
│   ├── ... (system design docs)
├── api/
│   ├── ... (API endpoint documentation)
├── database/
│   ├── ... (schema and models)
├── audit/
│   ├── complete-analysis.md
│   ├── backend-report.md
│   ├── bugs-report.md
│   ├── test-report.md
│   ├── dashboard-report.md
│   └── summary-reference.md
├── analysis/
│   ├── access-database.md
│   ├── candidate-employee.md
│   ├── excel-import-plan.md
│   └── excel-summary.md
├── refactoring/
│   ├── semana-3-4-cleanup.md
│   ├── essential-scripts.md
│   ├── config-fixes.md
│   └── cleanup-summary.md
├── planning/
│   ├── 8-week-plan.md
│   └── migrations-decisions.md
├── security/
│   ├── ... (security documentation)
├── integration/
│   ├── zhipu-glm.md
│   ├── ... (other integrations)
├── ai/
│   ├── claude-guide.md
│   └── agents.md
├── reference/
│   ├── mapeo-rutas.md
│   ├── estructura-completa.md
│   ├── resumen-ejecutivo.md
│   ├── indice.md
│   └── inventario.md
├── changelogs/
│   ├── ... (version history)
├── archive/
│   ├── ... (historical docs)
└── [existing directories]
    ├── 02-guides/
    ├── 04-troubleshooting/
    ├── 06-archive/
    ├── ai/
    ├── analysis/
    ├── architecture/
    ├── changelogs/
    ├── core/
    ├── database/
    ├── features/
    ├── github/
    ├── integration/
    ├── research/
    ├── scripts/
    ├── security/
    ├── troubleshooting/
    └── [others]
```

---

## 🔗 Key Links

### Development
- **Main Project:** https://github.com/jokken79/UNS-ClaudeJP-6.0.0
- **Issue Tracker:** See GitHub Issues
- **CI/CD:** See GitHub Actions

### External Resources
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Next.js Docs:** https://nextjs.org/docs
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## 📝 Version Information

- **Current Version:** 6.0.0
- **Last Updated:** 2025-11-19
- **Documentation Phase:** SEMANA 5 (Organization)
- **Status:** 📋 In Progress (docs reorganization)

---

## 🎓 Learning Resources

### For Beginners
- Start with [Getting Started](setup/getting-started.md)
- Read [Installation Guide](setup/installation.md)
- Follow [Troubleshooting](guides/troubleshooting/) as needed

### For Developers
- Review [Architecture](architecture/)
- Study [Database Design](database/)
- Read [API Docs](api/)
- Check [Feature Documentation](features/)

### For System Administrators
- Follow [Installation Guide](setup/installation.md)
- Review [Security Documentation](security/)
- Check [Deployment Guides](planning/)

---

## 🤝 Contributing

To contribute documentation:

1. Read existing documentation for style consistency
2. Place new docs in appropriate `docs/` subdirectory
3. Update this README.md with new links
4. Verify all links work (no 404s)

---

## ⚖️ License & Rights

This documentation is part of the UNS-ClaudeJP HR Management System.

---

## 📞 Support & Questions

For questions about documentation:
- Check the [FAQ / Troubleshooting](guides/troubleshooting/)
- Review relevant audit reports in [Audit Reports](audit/)
- See [Analysis Documentation](analysis/)

---

**Last Updated:** 2025-11-19
**Documentation Status:** ✅ Reorganized (SEMANA 5)
**Next Phase:** SEMANA 6 - Testing & Validation

