# Pending Work Handoff

**Project:** ServiceFormAI
**Handoff date:** 2026-09-30

## Current status

Core platform work is largely implemented: citizen OTP identity, tenant staff OIDC, transactional tenant onboarding, immutable service releases, case transition integrity, and the application-output/certificate retrieval path. QA and deployment validation scripts have also been added or hardened.

The remaining work is not verified complete. Two workstreams remain open:

1. Complete the reference service journeys.
2. Run and close out production assurance gates.

Treat the actual browser journeys and release checks as the completion evidence. A frontend build or type-check alone does not prove end-to-end readiness.

## Resolved build blocker

The `ConsumerService` constructor ordering issue (TS1016) has been fixed by moving optional `S3StorageService` after the required injected services. `pnpm --dir backend run build` passes. Do not repeat this fix; continue with the real Income Certificate browser journey.

## Workstream 1: Reference service journeys

The focused live journey is Income Certificate. After resolving the compile blocker, run:

```sh
pnpm exec playwright test e2e/income-certificate.spec.ts --project='Income Certificate' --reporter=line
```

The intended journey exercises OTP login, service discovery/selection, and opening the application form. Continue the journey through submission, staff approval/status transitions, certificate/output generation, consumer retrieval, and download verification. Fix any actual journey failures and rerun the focused test.

Then complete equivalent end-to-end reference journeys for:

- Trade Licence
- Birth Certificate

Check that each journey uses valid, deterministic tenant/service/release seed data and exercises the real application workflow rather than only asserting static UI presence.

Relevant implementation areas include:

- `e2e/income-certificate.spec.ts`
- `e2e/global-setup.ts`
- `backend/src/test/e2e-setup.ts`
- `backend/src/consumer/consumer.service.ts`
- `backend/src/producer/producer.service.ts`
- `src/app/pages/CertificateDownload.tsx`

The seed setup and output path were added in prior work, but must be verified by running the browser journey. Do not infer success from their presence.

## Workstream 2: Production assurance gates

After the focused flow passes, verify the relevant checks from the repository root:

```sh
pnpm type-check
pnpm test:e2e:income
pnpm qa:gate
pnpm qa:gate:full
pnpm qa:deployment:pre
pnpm qa:deployment
```

`qa:gate:full` includes the full E2E gate and may require the expected local services and environment configuration. Inspect its output and report environmental prerequisites separately from code failures. Confirm the release checks fail closed when required configuration, builds, tests, or E2E checks are missing or failing.

For backend changes, also run the backend build and the narrow relevant backend tests using the scripts configured in `backend/package.json`. Record exact commands and results; do not claim a gate passed without fresh output.

Key gate files:

- `deployment/scripts/qa-gate.sh`
- `deployment/scripts/validate.sh`
- `package.json`
- `backend/package.json`

## Recommended execution order

1. Run the Income Certificate Playwright flow and debug the next concrete failure, if any.
2. Expand deterministic seed data to include Trade Licence and Birth Certificate.
3. Complete all three browser journeys with real workflow and output assertions.
4. Run the full relevant QA and deployment gates; address failures within scope.
5. Summarize passed, failed, and environment-blocked checks, with command evidence. Leave incomplete work explicitly marked pending.

## Completion criteria

Consider the pending work complete only when:

- The backend compiles without the constructor-ordering error.
- Income Certificate, Trade Licence, and Birth Certificate journeys complete their intended real workflows in Playwright.
- Output metadata and certificate retrieval/download behavior are verified where applicable.
- Required QA, backend, and deployment gates have fresh passing results.
- Any unavailable checks are clearly identified as blocked, not reported as passing.
