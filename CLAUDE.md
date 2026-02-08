# Claude Playground

Workspace for designing and building new projects. Currently contains the **Gymli** AI gym assistant (design + implementation plan).

**Doc style:** Tables over prose, inline formats, no duplicate info, bullets not paragraphs.

## Project Structure

```
claude-playground/
├── docs/plans/              # Design docs and implementation plans
│   ├── 2026-02-07-gymli-design.md
│   └── 2026-02-07-gymli-implementation-plan.md
└── CLAUDE.md                # This file
```

## Skill & Plugin Reference

### Workflow Skills (slash commands)

These skills are the primary way to get work done. Use them in the order shown for each workflow.

#### Development Lifecycle

| Phase | Skill | When to Use |
|-------|-------|-------------|
| **Think** | `/superpowers:brainstorming` | REQUIRED before any creative work - features, components, functionality changes |
| **Plan** | `/superpowers:writing-plans` | After brainstorming, before touching code for multi-step tasks |
| **Branch** | `/feature-start` | Create and switch to a new feature branch |
| **Isolate** | `/superpowers:using-git-worktrees` | When feature needs isolation from current workspace |
| **Design** | `/architect` | Architecture consultation, review, or audit |
| **Explore** | `/feature-dev:feature-dev` | Guided feature development with codebase understanding |
| **Build** | `/superpowers:executing-plans` | Execute a written implementation plan task-by-task |
| **Build (parallel)** | `/superpowers:subagent-driven-development` | Execute independent tasks from a plan simultaneously |
| **UI** | `/frontend-design:frontend-design` | ALL frontend pages, components, and interfaces - produces distinctive, production-grade code |
| **TDD** | `/superpowers:test-driven-development` | Write tests BEFORE implementation code |
| **Debug** | `/superpowers:systematic-debugging` | Any bug, test failure, or unexpected behavior - BEFORE proposing fixes |
| **Lint** | `/lint-check` | Run ESLint on frontend and backend |
| **Verify** | `/superpowers:verification-before-completion` | REQUIRED before claiming any work is done |
| **Commit** | `/commit-push` | Safe commit with lint + security checks (use instead of `git commit`) |
| **Security** | `/security-scan` | Pre-commit scan for secrets and sensitive files |
| **Review** | `/superpowers:requesting-code-review` | After completing tasks or major features |
| **Review (PR)** | `/code-review` | Multi-agent review (4 parallel agents: Security, Standards, Logic, Performance) |
| **Review (PR)** | `/pr-review-toolkit:review-pr` | Comprehensive PR review with specialized agents |
| **Respond** | `/superpowers:receiving-code-review` | Before implementing review suggestions - verify feedback first |
| **Finish** | `/superpowers:finishing-a-development-branch` | When implementation is complete, decide on merge/PR/cleanup |
| **PR** | `/pr-flow` | Autonomous PR workflow with auto-fix for blocking issues |
| **Merge** | `/pr-merge` | Smart PR merge with branch-aware strategy |
| **Release** | `/release` | Auto-bump version based on conventional commits |
| **Build APK** | `/build-app` | Build Android APK and copy to Google Drive |
| **Publish** | `/upload-play-store` | Upload AAB to Play Store |

#### Meta Skills

| Skill | When to Use |
|-------|-------------|
| `/superpowers:using-superpowers` | Starting any conversation - discover available skills |
| `/superpowers:dispatching-parallel-agents` | 2+ independent tasks that can run simultaneously |
| `/superpowers:writing-skills` | Creating or editing custom skills |
| `/claude-md-management:revise-claude-md` | Update CLAUDE.md with session learnings |
| `/claude-md-management:claude-md-improver` | Audit and improve CLAUDE.md quality |
| `/keybindings-help` | Customize keyboard shortcuts |

### MCP Plugins

#### Playwright (Browser Automation)

Use for testing web UIs, taking screenshots, filling forms, and end-to-end testing.

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Open URLs |
| `browser_snapshot` | Get accessibility tree (better than screenshots for actions) |
| `browser_take_screenshot` | Visual capture of current page |
| `browser_click` / `browser_type` / `browser_fill_form` | Interact with page elements |
| `browser_evaluate` | Run JavaScript on the page |
| `browser_console_messages` | Check for JS errors |
| `browser_network_requests` | Debug API calls |
| `browser_run_code` | Execute Playwright scripts directly |

**Best practices:**
- Use `browser_snapshot` before interacting - it returns element refs needed for clicks/typing
- Use `browser_take_screenshot` for visual verification, not for finding elements
- Chain: navigate -> snapshot -> interact -> snapshot to verify

#### Context7 (Library Documentation)

Use for up-to-date docs and code examples for any library/framework.

| Tool | Purpose |
|------|---------|
| `resolve-library-id` | MUST call first to get a valid library ID |
| `query-docs` | Fetch docs/examples for a specific library |

**Best practices:**
- Always call `resolve-library-id` before `query-docs`
- Max 3 calls per question - use best result if not found after 3
- Use when unsure about API syntax, new library features, or migration patterns

#### Firebase (Project Management)

Direct access to Firebase services without CLI.

| Tool Category | Tools |
|---------------|-------|
| **Auth** | `firebase_login`, `firebase_logout`, `auth_get_users`, `auth_update_user` |
| **Firestore** | `firestore_get_documents`, `firestore_query_collection`, `firestore_list_collections`, `firestore_delete_document` |
| **Project** | `firebase_get_project`, `firebase_list_projects`, `firebase_create_project`, `firebase_get_environment` |
| **Config** | `firebase_get_sdk_config`, `firebase_init`, `firebase_get_security_rules`, `firebase_validate_security_rules` |
| **Hosting** | `firebase_init` with hosting feature |
| **Storage** | `storage_get_object_download_url` |
| **Messaging** | `messaging_send_message` |
| **Remote Config** | `remoteconfig_get_template`, `remoteconfig_update_template` |
| **RTDB** | `realtimedatabase_get_data`, `realtimedatabase_set_data` |

**Best practices:**
- Use `firebase_get_environment` first to check auth status and active project
- Use `firebase_validate_security_rules` before deploying rule changes
- Prefer MCP tools over CLI for read operations (faster, no shell overhead)

### Task Agents

Specialized agents launched via the Task tool for complex subtasks.

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `feature-dev:code-architect` | Design feature architectures | New feature needs architecture blueprint |
| `feature-dev:code-explorer` | Deep codebase analysis | Need to understand existing patterns before building |
| `feature-dev:code-reviewer` | Review for bugs and quality | After writing code, before committing |
| `code-simplifier:code-simplifier` | Simplify code for clarity | After writing or modifying code |
| `pr-review-toolkit:code-reviewer` | PR-focused code review | Reviewing pull requests |
| `pr-review-toolkit:code-simplifier` | Post-coding simplification | After completing a coding task |
| `pr-review-toolkit:silent-failure-hunter` | Find silent failures | After changes to error handling or async code |
| `pr-review-toolkit:type-design-analyzer` | Analyze type design | After creating/modifying type definitions |
| `pr-review-toolkit:pr-test-analyzer` | Analyze PR test coverage | Before merging PRs |
| `superpowers:code-reviewer` | Review against plan | After completing a major implementation step |

## Standard Workflows

### New Feature (full lifecycle)

```
/superpowers:brainstorming          # Explore intent and requirements
/superpowers:writing-plans          # Create implementation plan
/feature-start <feature-name>      # Create branch
/superpowers:executing-plans        # Build it task-by-task
  -> /frontend-design:frontend-design   # For each UI task
  -> /superpowers:systematic-debugging  # If anything breaks
/superpowers:verification-before-completion  # Verify everything works
/commit-push -m "feat: description" # Safe commit
/superpowers:requesting-code-review # Self-review
/pr-flow                           # Create PR with auto-fix
```

### Quick Fix

```
/superpowers:systematic-debugging   # Understand the bug first
# ... fix it ...
/superpowers:verification-before-completion
/commit-push -m "fix: description"
```

### New Project Setup (like Gymli)

```
/superpowers:brainstorming          # Define scope and requirements
/architect consult <project>        # Architecture decisions
/superpowers:writing-plans          # Full implementation plan
/superpowers:executing-plans        # Execute with sub-skills:
  -> Context7 for library docs
  -> Firebase MCP for project setup
  -> /frontend-design:frontend-design for UI
  -> Playwright for E2E testing
```

### Code Review Incoming

```
/superpowers:receiving-code-review  # Analyze feedback critically first
# ... implement validated suggestions only ...
/superpowers:verification-before-completion
/commit-push
```

## Conventions

### Git

- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`)
- **Branches:** `feature/<name>`, `fix/<name>`, `claude/<name>` for worktrees
- **Always use `/commit-push`** instead of raw `git commit` - enforces lint + security checks
- **Never commit secrets** - run `/security-scan` when in doubt

### Code Style

- **Files:** kebab-case | **Components:** PascalCase | **Variables:** camelCase
- **Frontend:** React + Vite + Tailwind CSS + Capacitor
- **Backend:** Express with controller-service pattern, Pino logging
- **API client:** Axios wrappers in `api/` directory, never raw fetch in components

### Implementation Plans

Plans live in `docs/plans/` with naming: `YYYY-MM-DD-<project>-<type>.md`

Include in every plan:
- Skill invocation notes at the top (which skills to use for which tasks)
- Task dependency graph at the bottom
- Specific file paths for creates/modifies per task

## Current Projects

### Gymli - AI Gym Assistant

| Doc | Path |
|-----|------|
| Design | `docs/plans/2026-02-07-gymli-design.md` |
| Implementation Plan | `docs/plans/2026-02-07-gymli-implementation-plan.md` |

**Status:** Planning complete (20 tasks). Ready for implementation.

**To start building:**
```
/superpowers:executing-plans
# Point it at docs/plans/2026-02-07-gymli-implementation-plan.md
# It will execute tasks sequentially, using sub-skills as noted in the plan
```
