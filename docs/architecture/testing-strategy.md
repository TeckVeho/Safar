# Testing Strategy

This document defines the project-wide testing strategy.  
Assuming AI-Driven Development (AI-DD), it organizes test types, responsibilities, mocking policy, external integration, and E2E scope to maintain quality, reproducibility, and maintainability.

---

## Standard Policy and Project-specific Notes

This document is split into **Standard Policy** (AIDD standard; principles must not change) and **Project-specific Notes** (project-specific additions allowed). Details follow [readme.md](../readme.md) §3 “May change, but intent must be clear.”

### Standard Policy (maintain)

- Include tests in Definition of Done
- Update required tests when code changes
- Layer policies for Backend / Frontend / Integration / E2E
- Confirm test / lint / type check results before PR

Sections §1–§14 are Standard Policy and its elaboration.

When deviating from Standard Policy, record in the Issue / OpenSpec / PR: **delta, rationale, risk, mitigation or future resolution plan**.

### Project-specific Notes (additions allowed)

The following may be added in [§15 Project-specific Notes](#15-project-specific-notes).

- Test layers adopted
- Coverage criteria
- Whether E2E is adopted
- Test scope run in CI
- Handling of external service integration tests
- Temporary exceptions and migration-period handling

---

# 1. Purpose

This project runs tests to prevent the following.

- Misinterpretation of requirements
- Missing boundary conditions
- Breaking existing behavior through refactoring
- Authorization control gaps
- Differences from production due to over-mocking
- Incorrect AI-generated implementations

Also, to prevent “code that only appears to work,” which is common in AI-DD, and to keep the system continuously changeable.

---

# 2. Basic Policy

- Treat AI-generated code like hand-written code: review and test equally
- Include required tests in the same change as implementation changes
- Unit tests verify logic in isolation
- Integration tests verify module connections and data flow
- Separate external service connectivity from normal integration tests
- Limit E2E to main business flows
- Use manual tests for business validity, usability, and copy
- Run test / lint / type check before PR and confirm they pass

Tests verify behavior; lint verifies code quality and conventions; type check verifies type safety. Lint / type check are pre-PR quality checks, not test layers.

---

# 3. Test Layers

This project tests at the following layers.

- Frontend Unit Test
- Frontend Integration Test
- Backend Unit Test
- Backend Integration Test
- Backend External Integration Test
- E2E Test
- Manual Test

---

# 4. Frontend Unit Test

## 4.1 Purpose

Verify logic at the smallest unit: React components, hooks, utility functions, etc.

## 4.2 Main Targets

- Pure functions
- Formatters
- Validation
- Custom hooks
- UI conditional branching
- Permission-based display
- Input transformation

## 4.3 What to Verify

- Happy path
- Error cases
- Boundary values
- null / undefined
- Permission differences
- State differences

## 4.4 Mocking Policy

The following may be mocked.

- API communication
- Date/time
- UUID
- Random numbers

Do not over-mock state management or event handling.

---

# 5. Frontend Integration Test

## 5.1 Purpose

Verify in-screen flows when combining screens, hooks, state management, and API client.

## 5.2 Main Targets

- Screen rendering
- Form submission
- Updates on API success
- Display on API failure
- Search / filter
- Pagination
- Permission control

## 5.3 Mocking Policy

- Replace API responses with mocks or stubs
- Do not start the Backend
- Run screen navigation and state updates for real

---

# 6. Backend Unit Test

## 6.1 Purpose

Verify business logic at the smallest unit.

## 6.2 Main Targets

- Service
- UseCase
- Validation
- Permission logic
- Status transition
- Mapper / DTO

## 6.3 Mocking Policy

The following may be mocked.

- DB
- External APIs
- Storage
- Notification
- Mail
- Clock

Do not mock the entire business logic body.

---

# 7. Backend Integration Test

## 7.1 Purpose

Verify Backend end-to-end from HTTP request through DB.

## 7.2 Main Targets

- Route
- Middleware
- Authentication / authorization
- Validation
- Controller
- Service
- Repository
- DB

## 7.3 What to Verify

- Status code
- Response format
- DB updates
- Error handling
- Permission errors

## 7.4 Policy

- Verify via HTTP in principle
- Do not call controllers directly
- Use a real DB when possible
- Replace external services with mocks or stubs

## 7.5 Out of Scope for This Layer

Handle the following in Backend External Integration Test.

- Slack
- Google API
- OAuth
- Storage
- Mail
- Webhook
- Payment API

---

# 8. Backend External Integration Test

## 8.1 Purpose

Verify actual connectivity with external services.

## 8.2 Main Targets

- OAuth / OIDC
- Google Drive / Docs API (employee information PDF, contract PDF integration; details in [external-api-spec.md](../specifications/backend/external-api-spec.md))
- Webhook
- Storage upload
- Mail delivery
- Notification
- External API authentication

## 8.3 Basic Policy

- Avoid direct external service connections in CI
- Normally use mocks or stubs
- Use sandbox / test tenant only when needed
- Production-like checks are limited in scope

## 8.4 Example Timing

- Initial introduction
- Authentication changes
- SDK updates
- Infrastructure changes
- Before production release

---

# 9. E2E Test

## 9.1 Purpose

Verify main business flows from the browser through Frontend, Backend, and DB.

## 9.2 Main Targets

- Login
- CRUD
- Workflow
- Permission control
- Main business flow

## 9.3 Policy

- Do not cover all features in E2E
- Prioritize business-critical flows
- Focus on representative happy paths
- Add important error cases when needed

## 9.4 Mocking Policy

- Run the system internally for real when possible
- Mock or disable external services only

---

# 10. Manual Test

## 10.1 Purpose

Verify business validity that automated tests catch poorly.

## 10.2 Main Targets

- UI/UX
- Copy / wording
- Operability
- Business flows
- Permission control validity
- Error messages
- Notification content
- Layout breakage

## 10.3 Policy

- Perform minimum manual checks when adding features
- Pay extra attention to AI-generated UI / copy
- Do not treat passing automated tests alone as done

---

# 11. Overall Mocking Policy

## 11.1 Principles

- Unit tests may mock aggressively
- Integration tests: keep mocking minimal
- E2E: avoid internal mocks
- Mock external services only as needed for purpose

## 11.2 Avoid

- Excessive mocking
- Coupling to implementation details
- Overly complex mock setup
- AI-generated mocks whose only goal is to pass

---

# 12. No Fallbacks in Tests

Test code must not include fallbacks that hide failures and treat them as success.

Prohibited examples:

- Swallowing errors in try/catch
- Passing assertions with default values
- Unconditional skip
- Ambiguous success via `||` / `??`
- Hiding failure with retry only

Allowed examples:

- Fixed time
- Fixed seed
- Explicit external stubs

---

# 13. Additional Rules for AI-DD

- Prohibit implementation-only PRs
- Add regression tests for bug fixes
- Humans review AI-generated test code
- Check surrounding impact
- Prohibit tests whose only purpose is to pass

---

# 14. Done Criteria

Feature completion requires at least the following.

- Required test types are selected
- Required unit tests exist
- Required integration tests exist
- External integration policy is defined when integrating externally
- E2E applicability is decided
- Required manual test perspectives are organized
- Lint / type check pass

---

# 15. Project-specific Notes

Add project-specific testing rules here (adopted test layers, coverage criteria, E2E adoption, CI scope, external integration handling, migration exceptions, etc.).

When deviating from Standard Policy, record in the Issue / OpenSpec / PR: **delta, rationale, risk, mitigation or future resolution plan**.
