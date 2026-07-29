# RBA Executive Report Export Design

## Objective

Rebuild the `/relatorios` export experience so the CSV is a reliable data extract and the printed PDF is an executive document suitable for company management and directors.

## Confirmed business rule

The reporting module must not recreate freight financial rules.

Every row must use the values already returned by `/api/orders`, which originate from the order, freight sheet, CTE and manifesto records maintained by the application and Supabase. The report may aggregate those returned values to present totals, averages, counts and percentages, but it must not derive a freight balance, discount, net value, expense or other per-order financial field again.

Consequently, the report must not call `calculateFreightOrderFinancials` or another parallel financial engine.

## Root causes found

1. `app/relatorios/page.tsx` in `main` differs from the production/export code supplied for review.
2. The current report mixes loading, filtering, CSV serialization, financial presentation and print layout in one component.
3. The current CSV uses inconsistent fields and lacks a central escaping/sanitization contract.
4. The printable logo is rendered as a CSS background, which browsers may omit from PDF.
5. The print stylesheet does not fully define A4 landscape pagination, color reproduction, repeated table headers, column sizing and footer behavior.
6. The supplied five-page PDF confirms clipped header text, missing logo, truncated statuses and a nearly empty final page.

## Architecture

### Read-only report model

Create `lib/reportExport.ts` as a presentation-only adapter. It receives the populated order objects returned by `/api/orders` and exposes:

- safe string and numeric readers;
- report row mapping without financial recalculation;
- summary aggregation using the returned values;
- status distribution and operational counts;
- CSV escaping, formula-injection neutralization and UTF-8 BOM serialization;
- deterministic file names and filter descriptions.

### Report page

Refactor `app/relatorios/page.tsx` to:

- fetch orders and clients;
- filter by client, normalized operational status and emission period;
- build presentation rows and summary through `lib/reportExport.ts`;
- export the filtered dataset as CSV;
- render responsive on-screen indicators;
- render an isolated executive print document for PDF.

### Printable identity

Change `components/RBALogo.tsx` from a background image to a real `<img>` element so the logo is included in browser-generated PDFs without requiring the user to enable background graphics.

### Print stylesheet

Extend `app/globals.css` with a report-specific print contract:

- A4 landscape;
- fixed millimetre margins;
- exact color adjustment;
- hidden application chrome;
- repeated table header;
- controlled row breaks;
- readable compact typography;
- print-only page header and footer;
- no clipped overflow;
- no decorative shadows or interaction states.

## Executive information hierarchy

1. Brand header with RBA logo, document title, issue date and confidentiality marker.
2. Applied filters and record count.
3. Primary KPIs: gross CTE value, driver freight, advances, outstanding balances, recorded expenses and recorded net value.
4. Operational KPIs: delivered, in transit, loading, pending contracting and average CTE value.
5. Detailed freight table with identifiers, dates, driver, route, client, financial fields and operational status.
6. Closing block with source statement, validation note and approval/signature areas.

## CSV contract

- UTF-8 BOM.
- Semicolon delimiter for Excel pt-BR.
- CRLF line endings.
- One stable header row.
- Every record has the same number of columns.
- Monetary values use decimal comma and no currency symbol inside numeric cells.
- Identifiers, CPF, plates, CTE/manifest and text remain textual.
- Cells beginning with `=`, `+`, `-` or `@` are prefixed with an apostrophe before quoting to prevent spreadsheet formula execution.
- Data source is only the values returned by `/api/orders`.

## Error and empty states

- Disable exports while loading.
- Show a useful API error message and retry action.
- Prevent invalid date intervals and explain the problem inline.
- Keep orders without a valid emission date visible unless a date filter is active; when excluded, report the count.
- Exporting an empty filter result produces a CSV with the header only and a PDF with a documented empty state.

## Validation

- Unit tests cover CSV escaping, formula neutralization, stable column counts and raw-field aggregation.
- TypeScript and production build must pass.
- A representative CSV must be parsed and checked for row/column consistency.
- The generated PDF must be rendered page by page and inspected for logo presence, clipped text, overlaps, truncated status labels, repeated headers and excessive blank pages.
- The production route must be checked after deployment.

## Non-goals

- No new freight pricing, discount, balance, expense or net-value formula.
- No mutation of orders or Supabase data.
- No replacement of the existing order-entry workflow.
- No XLSX export in this scope.