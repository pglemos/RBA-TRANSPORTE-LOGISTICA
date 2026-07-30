import { buildPrintPagePlan, selectAppendixOrders } from '@/lib/reporting/printLayout';
import type { GeneratedReport } from '@/lib/reporting/types';

import AppendixPages from './print/AppendixPages';
import ExecutivePrintPages from './print/ExecutivePrintPages';
import ModelPrintPages from './print/ModelPrintPages';

export default function ReportPrintDocument({ report }: { report: GeneratedReport }) {
  const appendixOrders = selectAppendixOrders(report);
  const plan = buildPrintPagePlan(report.kind, appendixOrders.length, report.includeDetails);
  const basePageCount = plan.filter((page) => page.type !== 'appendix').length;
  const hasAppendix = plan.some((page) => page.type === 'appendix');

  return (
    <section id="dynamic-report-print-target" className="report-print-only rba-print-document" aria-label="Relatório premium para impressão">
      {report.kind === 'executive'
        ? <ExecutivePrintPages report={report} totalPages={plan.length} />
        : <ModelPrintPages report={report} totalPages={plan.length} />}
      {hasAppendix && <AppendixPages report={report} basePageCount={basePageCount} totalPages={plan.length} />}
    </section>
  );
}
