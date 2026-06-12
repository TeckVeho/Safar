# Development Flow

## 1. Purpose and Scope

This document defines the development flow under the AIDD development standard.

It covers issue-driven processes, whether deliverables are required by work type, and common principles.  
Specific content for requirements, specifications, and architecture is managed in `docs/requirements/`, `docs/specifications/`, and `docs/architecture/`, respectively.

This file is the AIDD development standard’s concrete development flow. Treat it in **Standard Policy** / **Project-specific Notes** sections; for details, follow [../readme.md](../readme.md) §3 “May change, but intent must be clear.”

---

## 2. Standard Policy and Project-specific Notes

This document is split into **Standard Policy** (AIDD standard; principles must not change) and **Project-specific Notes** (project-specific additions allowed).

### Standard Policy (maintain)

- Issue-driven
- Markdown First
- OpenSpec integration
- Alignment of `docs` / `openspec` / implementation / tests
- Pre-PR verification

The body from §3 Overview through §9 Work Type Matrix is Standard Policy and its elaboration.

When deviating from Standard Policy, record in the Issue / OpenSpec / PR: **delta, rationale, risk, mitigation or future resolution plan**.

### Project-specific Notes (additions allowed)

The following may be added in [§10 Project-specific Notes](#10-project-specific-notes).

- Issue splitting granularity
- Milestone operations
- PR review process
- Branch naming details
- Work-type-specific supplements
- Team-specific verification steps

When supplementing or adjusting Work Type Matrix rows or requirements, document in Project-specific Notes while maintaining Standard Policy.

---

## 3. Overview

Rather than binding all work to the same process, **switch required deliverables and steps by work type**.

GitHub Issue as the unit of work, Markdown First, and alignment of `docs/` / `openspec/` / implementation code apply regardless of work type.

---

## 4. Common Principles

The following apply as common principles to all work types.

- **Use GitHub Issue as the unit of work** — Record change background, scope, and acceptance criteria on the Issue
- **Markdown First** — Treat Markdown in the repository as the source of truth for design, specifications, and rationale
- **Keep `docs` / `openspec` / implementation aligned** — Update required documentation and behavior specs according to the change
- **Run required tests before PR** — Confirm tests appropriate to the work type (unit test / CI, etc.) before opening a PR
- **Decide whether deliverables need updates** — Perform OpenSpec / docs update / unit test only when required by the change

### Development Unit

The development unit is a GitHub Issue.

GitHub Milestone is used to manage releases, feature groups, or development phases.

```txt
Milestone
└── Issue
    ├── OpenSpec          # when required
    ├── Docs update       # when required
    ├── Implementation    # when required
    ├── Unit test         # when required
    └── Pull Request
```

See [§9 Work Type Matrix](#9-work-type-matrix) for whether each step is required.

---

## 5. New Development

Flow for greenfield development.

Assume `docs/` is in place before implementation, building from requirements in order.

### Flow

1. **Organize business / functional / non-functional requirements**
   - `docs/requirements/business-requirements.md`
   - `docs/requirements/functional-requirements.md`
   - `docs/requirements/nonfunctional-requirements.md`
2. **Organize use cases**
   - `docs/requirements/use-case.md`
3. **Organize architecture / infrastructure**
   - `docs/architecture/architecture.md`
   - `docs/architecture/infrastructure.md`
4. **Organize API spec / UI spec / DB schema, etc.**
   - `docs/specifications/backend/`
   - `docs/specifications/frontend/`
   - `docs/architecture/testing-strategy.md`
5. **Create Milestone / Issue**
6. **Create implementation plan per Issue with OpenSpec**
7. **Implement, unit test, and open PR** — Follow [§7 Feature Development](#7-feature-development)

---

## 6. Standardization for Existing System

Flow when introducing the AIDD development standard to an existing system.

Reverse-engineer from current code, screens, DB, and operations to establish `docs/` as the current specification.

### Flow

1. **Review current code, screens, DB, and infrastructure**
2. **Create docs as current specification**
3. **Organize architecture / infrastructure / requirements / specifications**
4. **Document unknowns and undefined specs** — Distinguish assumptions from verified facts
5. **Apply issue-driven flow for subsequent changes** — Use [§7 Feature Development](#7-feature-development) or [§8 Bug Fix and Minor Change](#8-bug-fix-and-minor-change)

In this phase, docs preparation is the main goal; OpenSpec / unit test apply only when code changes occur.

---

## 7. Feature Development

Flow for feature additions and specification changes based on existing `docs/`.

The standard flow Milestone → Issue → OpenSpec → Docs update → Implementation → Test → PR applies to this section.

### 1. Create Milestone

Create a GitHub Milestone per release, feature group, or development phase.

---

### 2. Create Issues

Create GitHub Issues linked to the Milestone.

Each Issue has a `title` and `body`.

The Issue body should concretely describe what implementers should do, including:

* Background
* Purpose
* Scope
* Requirements
* Acceptance Criteria
* Notes

When creating Issues, organizing content with an AI Editor is recommended.

---

### 3. Plan with OpenSpec

Plan implementation with OpenSpec based on the Issue body.

Create or update as needed:

```txt
openspec/changes/{issue_slug}/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
```

---

### 4. Update Docs

Update required docs according to the Issue.

Examples:

* requirements
* architecture
* backend API spec
* frontend screen / component spec
* testing strategy

---

### 5. Create Branch

Create a branch per Issue.

```txt
feature/{issue-number}-{short-title}
fix/{issue-number}-{short-title}
docs/{issue-number}-{short-title}
```

---

### 6. Implement and Update Unit Tests

Implement according to the Issue.

When code changes, add or update corresponding unit tests.

Treat implementation and unit tests as a set.

---

### 7. Run Unit Tests Before PR

Run unit tests before creating a PR and confirm they pass.

---

### 8. Create Pull Request

Create a Pull Request for the Issue.

Use [`.github/pull_request_template.md`](../../.github/pull_request_template.md) as the PR body format. Fill in at minimum:

* Summary
* Related Issue (`Closes #…`)
* Work type
* Changes
* Docs / OpenSpec (or “none”)
* Tests (or “N/A” with reason)
* Acceptance criteria (from the Issue)
* Notes for reviewers (optional)

Whether OpenSpec, docs updates, and tests are required depends on the work type; see [§9 Work Type Matrix](#9-work-type-matrix).

When drafting the PR body with Cursor Agent, attach the Issue, relevant `docs/` paths, and changed files; ask for text that matches the template above.

---

## 8. Bug Fix and Minor Change

Flow for bug fixes and minor changes.

Emphasis on not making the process too heavy.

### Typical Work

* bug fix
* typo / copy change
* dependency update
* config / CI change
* refactoring
* investigation

### Guidelines

- **Keep Issue as unit** — Record background, cause, and fix on the Issue
- **OpenSpec only when needed** — Create when behavior changes or design decisions are involved
- **Update docs only when impacted** — Update when external specs, operations, or design are affected
- **Unit test: generally add/update for code changes or reproducible bugs** — Add regression tests for bug fixes with clear reproduction steps
- **Tests optional for typo / docs only / investigation** — May omit when code and external specs are unaffected
- **PR should describe cause, fix, and verification** — Leave information reviewers need to judge

### Flow

1. Create Issue with reproduction conditions, expected behavior, and investigation results
2. Update OpenSpec / docs as needed
3. Create branch, fix, and test
4. Run required tests (unit test / CI) before PR
5. Create PR with cause, fix, and verification results

---

## 9. Work Type Matrix

Whether OpenSpec / docs update / unit test are required by work type. This matrix is an AIDD standard example; project supplements go in [§10 Project-specific Notes](#10-project-specific-notes).

| Work Type | OpenSpec | Docs update | Unit test | Notes |
|---|---|---|---|---|
| New development | Required | Required | Required | Build docs from requirements first |
| Existing system standardization | Optional | Required | Not required unless code changes | Reverse-engineer current behavior into docs |
| Feature development | Required | Required | Required | Add or change features against existing docs |
| Spec change | Required | Required | Required if code changes | External behavior or contract changes |
| Bug fix | Optional | Required if behavior changes | Required if reproducible | Record root cause and verification |
| Refactoring | Optional | Required if design changes | Required | No external behavior change |
| Dependency update | Not required | Required if behavior changes | CI pass required | e.g. Dependabot PRs |
| Config / CI change | Optional | Required if development flow changes | CI pass required | Workflow or environment settings |
| Docs only | Not required | Required | Not required | Documentation changes only |
| Investigation | Not required | Optional | Not required | Record findings in the Issue |

**Legend**

- **Required** — Perform in principle
- **Optional** — Decide based on the change
- **Not required** — Normally omit (switch to Required / Optional when impact appears)

---

## 10. Project-specific Notes

Add project-specific development flow supplements here (Issue splitting granularity, Milestone operations, PR review process, branch naming, work-type supplements, Work Type Matrix project adjustments, etc.).

When deviating from Standard Policy, record in the Issue / OpenSpec / PR: **delta, rationale, risk, mitigation or future resolution plan**.
