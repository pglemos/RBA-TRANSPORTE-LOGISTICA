# RBA Executive Report Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a reliable CSV data export and an executive A4 landscape PDF report for `/relatorios`, using only the financial values already returned by the application API.

**Architecture:** A pure presentation adapter in `lib/reportExport.ts` maps API orders into report rows, aggregates returned fields, describes filters and serializes CSV. The report page owns only data loading, user filters, interaction and rendering. Print behavior is isolated through report-specific classes in `app/globals.css`, and the RBA logo becomes a real image element so it survives browser PDF generation.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.8, Tailwind CSS 4, Node.js built-in test runner, browser print/PDF.

## Global Constraints

- Do not recalculate freight, balance, CTE discount, expenses or net value inside the report.
- Read each financial value directly from the objects returned by `/api/orders`.
- Aggregation for totals, averages, counts and percentages is allowed.
- CSV must use UTF-8 BOM, semicolon delimiter, CRLF and pt-BR decimal comma.
- PDF must use A4 landscape and remain readable with at least 119 records.
- Do not mutate orders or Supabase data.
- Keep existing client, status and emission-period filters.
- Do not add XLSX export.

---

### Task 1: Read-only report model and CSV serializer

**Files:**
- Create: `lib/reportExport.ts`
- Create: `tests/reportExport.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: populated order objects returned by `/api/orders` and normalized status labels.
- Produces:
  - `buildReportRows(orders: ReportOrderInput[]): ReportRow[]`
  - `buildReportSummary(rows: ReportRow[]): ReportSummary`
  - `serializeReportCsv(rows: ReportRow[]): string`
  - `buildReportFileName(extension: 'csv' | 'pdf', date?: Date): string`
  - `neutralizeSpreadsheetFormula(value: string): string`

- [ ] **Step 1: Write failing tests for raw-field mapping**

Create tests that pass deliberately conflicting values and assert that `net_value`, `balance_value`, `total_expenses`, `freight_value`, `cte_value`, `advance_value` and `cash_value` are copied from the API object without deriving replacements.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportRows,
  buildReportSummary,
  neutralizeSpreadsheetFormula,
  serializeReportCsv,
} from '../lib/reportExport.ts';

test('copies financial fields returned by the API without recalculation', () => {
  const [row] = buildReportRows([{
    id: '1',
    order_number: 'RBA-2026-0001',
    cte_value: 10000,
    freight_value: 7000,
    advance_value: 3000,
    cash_value: 500,
    balance_value: 999,
    total_expenses: 321,
    net_value: 1234,
    status: 'Entregue',
  }]);

  assert.equal(row.balanceValue, 999);
  assert.equal(row.totalExpenses, 321);
  assert.equal(row.netValue, 1234);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
node --test --experimental-strip-types tests/reportExport.test.ts
```

Expected: failure because `lib/reportExport.ts` does not exist.

- [ ] **Step 3: Implement the presentation adapter**

Implement safe readers, immutable row mapping, raw-field aggregation, status counts, CSV headers, quoting, formula neutralization and deterministic filenames. Do not import `calculateFreightOrderFinancials` or `summarizeFreightOrders`.

- [ ] **Step 4: Add CSV contract tests**

Cover:

```ts
test('neutralizes spreadsheet formulas', () => {
  assert.equal(neutralizeSpreadsheetFormula('=1+1'), "'=1+1");
  assert.equal(neutralizeSpreadsheetFormula('+cmd'), "'+cmd");
  assert.equal(neutralizeSpreadsheetFormula('-10'), "'-10");
  assert.equal(neutralizeSpreadsheetFormula('@SUM(A1:A2)'), "'@SUM(A1:A2)");
});

test('serializes BOM, CRLF, semicolon and stable column counts', () => {
  const csv = serializeReportCsv(buildReportRows([{ id: '1', order_number: '001', status: 'Entregue' }]));
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /\r\n/);
  const lines = csv.slice(1).split('\r\n');
  const counts = lines.map((line) => line.split(';').length);
  assert.ok(counts.every((count) => count === counts[0]));
});
```

- [ ] **Step 5: Add test script without a new package**

Add to `package.json`:

```json
"test:report": "node --test --experimental-strip-types tests/reportExport.test.ts"
```

- [ ] **Step 6: Run tests and commit**

```bash
npm run test:report
git add lib/reportExport.ts tests/reportExport.test.ts package.json
git commit -m "test(report): define raw-field export contract"
```

Expected: all report tests pass.

---

### Task 2: Refactor the report screen and export interaction

**Files:**
- Modify: `app/relatorios/page.tsx`

**Interfaces:**
- Consumes: Task 1 exports and `/api/orders?page_size=1000`.
- Produces: responsive report screen, CSV download and isolated printable document.

- [ ] **Step 1: Replace imported financial engines**

Remove `calculateFreightOrderFinancials`, `summarizeFreightOrders` and unused icon/date imports. Import the Task 1 helpers instead.

- [ ] **Step 2: Add explicit TypeScript shapes and memoized derived data**

Define order/client interfaces, validate API array responses, use `useMemo` for filtered orders, report rows and summary, and use `useCallback` for export handlers.

- [ ] **Step 3: Add filter validation and resilient loading states**

When `startDate > endDate`, show an inline error, disable both exports and do not silently export an invalid interval. Add retry behavior for API failures.

- [ ] **Step 4: Replace CSV implementation**

Call `serializeReportCsv(reportRows)`, construct the Blob, click the temporary link, revoke the object URL and use `buildReportFileName('csv')`.

- [ ] **Step 5: Build executive on-screen KPI hierarchy**

Show six financial KPIs sourced from summary fields and four operational KPIs. Labels must clearly say “registrado” or “consolidado” where appropriate and must not imply the report calculated a new freight value.

- [ ] **Step 6: Build the print-only executive document**

Render:

- brand header with real RBA logo;
- issue timestamp and confidentiality badge;
- applied filters;
- financial and operational KPI bands;
- detailed table with stable column classes;
- empty-state row;
- source/validation statement;
- signature/approval lines.

Use full status labels in print and avoid icons/emoji in the printed table.

- [ ] **Step 7: Add accessible interaction details**

Add button `type`, disabled state, focus-visible styles, descriptive labels and `aria-live` feedback for loading/errors.

- [ ] **Step 8: Commit**

```bash
git add app/relatorios/page.tsx
git commit -m "feat(report): rebuild executive export experience"
```

---

### Task 3: Make the RBA logo reliably printable

**Files:**
- Modify: `components/RBALogo.tsx`

**Interfaces:**
- Consumes: `/public/rba-logo-transparent.png`.
- Produces: a semantic image component that accepts the existing `className` API.

- [ ] **Step 1: Replace background-image rendering**

Use an actual `<img src="/rba-logo-transparent.png" alt="RBA Transporte & Logística" />` wrapped only if needed for sizing. Preserve `className` compatibility and add `object-contain`.

- [ ] **Step 2: Verify all existing usages remain dimensioned by class names**

Check sidebar, mobile header and report print header usages.

- [ ] **Step 3: Commit**

```bash
git add components/RBALogo.tsx
git commit -m "fix(brand): render RBA logo in printed documents"
```

---

### Task 4: Implement deterministic A4 landscape print styling

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: report-specific classes and IDs from Task 2.
- Produces: browser PDF layout with controlled pagination.

- [ ] **Step 1: Define the page box and color behavior**

Add:

```css
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm 7mm 10mm;
  }

  html,
  body {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
}
```

- [ ] **Step 2: Isolate report printing**

Hide application chrome and screen-only report controls; ensure `#report-print-target` is visible, full width, static and unclipped.

- [ ] **Step 3: Stabilize table pagination**

Use `table-layout: fixed`, repeated `thead`, `break-inside: avoid` on rows, controlled cell wrapping and explicit widths for ID/date/driver/route/client/money/status columns.

- [ ] **Step 4: Prevent blank trailing pages**

Keep the closing block adjacent to the final table flow, avoid large fixed margins, and use `break-inside: avoid` only for small atomic sections rather than the whole report.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "fix(print): stabilize executive A4 report pagination"
```

---

### Task 5: Add autonomous-agent operating instructions

**Files:**
- Create: `docs/AGENTE-IA-EXPORTACAO-RELATORIOS.md`

**Interfaces:**
- Consumes: repository scripts and report contract.
- Produces: a single instruction document for future agents.

- [ ] **Step 1: Document the non-recalculation rule**

State that the agent must never add a second financial engine to reports and must use fields already returned by `/api/orders`.

- [ ] **Step 2: Document validation commands and acceptance checks**

Include test, build, CSV parser validation, browser PDF generation, page rendering and visual inspection steps.

- [ ] **Step 3: Add the requested one-sentence execution instruction**

Use:

> Aplique integralmente o código deste repositório, preserve os valores financeiros retornados pela API sem recalculá-los, execute os testes e o build, gere CSV e PDF reais pela tela `/relatorios`, valide todos os arquivos visualmente e por estrutura e somente conclua quando não houver cortes, sobreposições, colunas inconsistentes ou divergência de dados.

- [ ] **Step 4: Commit**

```bash
git add docs/AGENTE-IA-EXPORTACAO-RELATORIOS.md
git commit -m "docs: add autonomous report validation guide"
```

---

### Task 6: Full verification, deployment and integration

**Files:**
- Verify: all modified files
- Generate locally: representative CSV, HTML/PDF and page renders in a temporary validation directory

**Interfaces:**
- Consumes: completed implementation.
- Produces: verified branch and fast-forwarded `main`.

- [ ] **Step 1: Run automated verification**

```bash
npm run test:report
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 2: Validate CSV structure using the supplied 119-order dataset**

Parse the exported CSV with a standards-compliant CSV parser and assert:

- BOM exists;
- header has the expected column count;
- all data rows have the same column count;
- monetary columns parse after decimal-comma conversion;
- record count matches the filtered report;
- no unneutralized formula-leading cell exists.

- [ ] **Step 3: Generate and inspect the representative PDF**

Use Chromium print-to-PDF with A4 landscape, render every page to PNG at 200 DPI and inspect:

- logo present;
- title and timestamp not clipped;
- status labels complete;
- no horizontal clipping;
- repeated table headers;
- no overlaps;
- no almost-empty trailing page;
- closing block present.

- [ ] **Step 4: Compare against the supplied broken PDF**

Run:

```bash
python /home/oai/skills/pdfs/scripts/compare_renders.py \
  "RBA Transporte Premium.pdf" \
  "RBA Transporte Executivo Validado.pdf" \
  --out_dir /tmp/rba-report-diff \
  --dpi 200
```

The comparison is visual evidence, not a pixel-equality target because the layout is intentionally redesigned.

- [ ] **Step 5: Review branch diff and update main**

Confirm the branch contains only report/export/branding/documentation changes, then fast-forward `main` to the verified branch head.

- [ ] **Step 6: Validate production**

Wait for the linked Vercel deployment, open `/relatorios`, generate a live CSV and PDF, repeat structural and visual checks, and record any environment-specific difference before completion.

- [ ] **Step 7: Final verification commit if required**

Only commit further changes when a reproduced validation defect requires them. Repeat Tasks 1-6 checks after every correction.