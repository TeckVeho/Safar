---
name: AI-assisted issue (markdown)
about: Full issue body scaffold — draft in Cursor Agent, then paste or use gh issue create
title: "[AIDD] "
labels:
  - aidd
assignees: ''
---

Use the **YAML forms** (Feature / Bug / Docs / Investigation) when creating issues on the GitHub web UI.

This template is for **Agent-first** drafting: fill the sections below via Cursor Agent, then submit.

---

## Cursor Agent workflow

1. **Context** (use `@` in Agent chat):
   - `docs/architecture/development-flow.md`
   - `docs/readme.md` §2 Policy (if touching process)
   - Relevant `docs/requirements/` and `docs/specifications/`
   - `openspec/changes/1001-issue/proposal.md` as format reference

2. **Prompt** (edit bracketed parts):

   ```
   Create a complete GitHub issue for [WORK TYPE]: [DESCRIPTION].

   Rules:
   - Follow docs/architecture/development-flow.md §7 (feature) or §8 (bug/minor).
   - Use Work Type Matrix §9 for OpenSpec / docs / tests requirements.
   - Include: Background, Purpose, Scope (in/out), Requirements, Acceptance Criteria (- [ ]).
   - List related FR / BR / UC / SCR IDs and docs paths.
   - Suggest openspec/changes/{issue#}-short-title and branch name.

   Output Markdown ready to paste into this issue body.
   ```

3. **Create on GitHub**
   - Web: submit this issue after Agent fills the sections below
   - CLI: `gh issue create --title "..." --body-file issue-body.md`

---

## Issue metadata

| Item | Value |
|---|---|
| Work type | Feature development / Bug fix / Docs only / Investigation |
| Milestone | |
| OpenSpec slug | `{issue#}-short-title` |

## Background

<!-- Why now; link to docs/requirements -->

## Purpose

<!-- User or system outcome -->

## Scope

### In scope

| ID | Content |
|---|---|
| FR- | |

### Out of scope

| ID | Reason |
|---|---|
| | |

## Requirements

1.

## Acceptance criteria

- [ ]

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| | |

## Related documents

- `docs/...`
- `openspec/changes/...` (after creation)

## Deliverables checklist

- [ ] OpenSpec (`proposal.md`, `design.md`, `tasks.md`, `specs/`) — if required
- [ ] Docs updated under `docs/` — if required
- [ ] Branch `feature|fix|docs/{issue#}-short-title`
- [ ] Tests per `docs/architecture/testing-strategy.md` — if required
- [ ] PR with Summary, doc/OpenSpec updates, test results, `Closes #NNN`
