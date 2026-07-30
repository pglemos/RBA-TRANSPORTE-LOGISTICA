
# Report Export Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:systematic-debugging, superpowers:test-driven-development and superpowers:verification-before-completion.

**Goal:** Correct date integrity, KPI definitions, financial reconciliation, PDF overflow, CSV schema and Excel usability in the production report exports.

**Architecture:** Keep persisted financial values as the source of truth. Add a reporting-only integrity layer for strict emission-date filtering, aggregate reconciliation and display normalization. Reuse the same reporting projection across PDF, CSV and Excel.

**Tech Stack:** Next.js 15, TypeScript, Supabase, React, ExcelJS, Chromium print CSS, Node test runner.

## Global Constraints

- Work directly on `main` as explicitly authorized.
- Never create a second financial calculation engine.
- CTE, deduction, net revenue, freight, expenses and net value must be read from API fields.
- Payment coverage is a reconciliation indicator, not a replacement for persisted fields.
- PDF, CSV and XLSX must use the same filtered reporting orders.
- Production build and report tests must pass before completion.

## Tasks

- [x] Add regression tests for strict emission-date filtering, partial periods, client CTE share and payment reconciliation.
- [x] Add the shared reporting audit layer.
- [x] Map persisted deduction and net-revenue fields into the reporting projection.
- [x] Filter the report API and client projection by emission date.
- [x] Fix leading-client dependency to use CTE value share.
- [x] Expose payment gaps and recorded deductions in PDF, CSV and XLSX.
- [x] Normalize export-only references and known location spacing defects.
- [x] Rebuild Excel as a legible snapshot with real dates, structured tables, validation sheet and correct print setup.
- [x] Expand PDF comparisons with actual/reference values and percentage-point deltas.
- [x] Add safe-width CSS and remove clipped side content.
- [ ] Run all tests and production build in GitHub Actions.
- [ ] Confirm Vercel deployment for the final `main` commit.
