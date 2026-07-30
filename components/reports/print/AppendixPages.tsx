import { chunkForPrint } from '@/lib/reporting/printLayout';
import type { GeneratedReport, ReportingOrder } from '@/lib/reporting/types';

import { formatCurrency, formatPercent, PrintPage } from './PrintPrimitives';

const DAY_MS = 24 * 60 * 60 * 1000;

const reference = (order: ReportingOrder) => order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber;
const route = (order: ReportingOrder) => `${order.origin} → ${order.destination}`;
const margin = (order: ReportingOrder) => order.cteValue > 0 ? (order.netValue / order.cteValue) * 100 : 0;
const statusClass = (status: string) => `rba-status-pill rba-status-${status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;

function openDays(order: ReportingOrder, generatedAt: Date): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.emissionDateValue)) return 0;
  const [year, month, day] = order.emissionDateValue.split('-').map(Number);
  const start = Date.UTC(year, month - 1, day);
  const end = Date.UTC(generatedAt.getFullYear(), generatedAt.getMonth(), generatedAt.getDate());
  return end >= start ? Math.floor((end - start) / DAY_MS) : 0;
}

function ExecutiveTable({ orders }: { orders: ReportingOrder[] }) {
  return (
    <table className="rba-appendix-table rba-appendix-table-wide">
      <thead><tr><th>CTE / ficha</th><th>Emissão</th><th>Motorista</th><th>Origem / destino</th><th>Cliente</th><th>CTE</th><th>Frete</th><th>Adiant.</th><th>À vista</th><th>Saldo</th><th>Desp.</th><th>Líquido</th><th>Status</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}><td>{reference(order)}</td><td>{order.emissionDate}</td><td>{order.driverName}</td><td>{route(order)}</td><td>{order.clientName}</td><td className="rba-cell-number">{formatCurrency(order.cteValue)}</td><td className="rba-cell-number">{formatCurrency(order.freightValue)}</td><td className="rba-cell-number">{formatCurrency(order.advanceValue)}</td><td className="rba-cell-number">{formatCurrency(order.cashValue)}</td><td className="rba-cell-number">{formatCurrency(order.balanceValue)}</td><td className="rba-cell-number">{formatCurrency(order.totalExpenses)}</td><td className="rba-cell-number rba-cell-positive">{formatCurrency(order.netValue)}</td><td><span className={statusClass(order.status)}>{order.status}</span></td></tr>)}</tbody>
    </table>
  );
}

function ExpenseTable({ orders }: { orders: ReportingOrder[] }) {
  return (
    <table className="rba-appendix-table">
      <thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Carga</th><th>Descarga</th><th>Outros</th><th>Total</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}><td>{reference(order)}</td><td>{order.emissionDate}</td><td>{order.clientName}</td><td>{order.driverName}</td><td>{route(order)}</td><td className="rba-cell-number">{formatCurrency(order.loadingExpense)}</td><td className="rba-cell-number">{formatCurrency(order.unloadingExpense)}</td><td className="rba-cell-number">{formatCurrency(order.otherExpenses)}</td><td className="rba-cell-number rba-cell-strong">{formatCurrency(order.totalExpenses)}</td></tr>)}</tbody>
    </table>
  );
}

function ProfitTable({ orders }: { orders: ReportingOrder[] }) {
  return (
    <table className="rba-appendix-table">
      <thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Margem</th><th>Status</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}><td>{reference(order)}</td><td>{order.emissionDate}</td><td>{order.clientName}</td><td>{order.driverName}</td><td>{route(order)}</td><td className="rba-cell-number">{formatCurrency(order.cteValue)}</td><td className="rba-cell-number rba-cell-positive">{formatCurrency(order.netValue)}</td><td className="rba-cell-number">{formatPercent(margin(order))}</td><td><span className={statusClass(order.status)}>{order.status}</span></td></tr>)}</tbody>
    </table>
  );
}

function InProgressTable({ orders, generatedAt }: { orders: ReportingOrder[]; generatedAt: Date }) {
  return (
    <table className="rba-appendix-table">
      <thead><tr><th>Referência</th><th>Emissão</th><th>Dias</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Status</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}><td>{reference(order)}</td><td>{order.emissionDate}</td><td className="rba-cell-center rba-cell-strong">{openDays(order, generatedAt)}</td><td>{order.clientName}</td><td>{order.driverName}</td><td>{route(order)}</td><td className="rba-cell-number">{formatCurrency(order.cteValue)}</td><td className="rba-cell-number rba-cell-positive">{formatCurrency(order.netValue)}</td><td><span className={statusClass(order.status)}>{order.status}</span></td></tr>)}</tbody>
    </table>
  );
}

function TableForKind({ report, orders }: { report: GeneratedReport; orders: ReportingOrder[] }) {
  if (report.kind === 'expenses') return <ExpenseTable orders={orders} />;
  if (report.kind === 'profits') return <ProfitTable orders={orders} />;
  if (report.kind === 'in-progress') return <InProgressTable orders={orders} generatedAt={report.generatedAt} />;
  return <ExecutiveTable orders={orders} />;
}

export default function AppendixPages({
  report,
  basePageCount,
  totalPages,
}: {
  report: GeneratedReport;
  basePageCount: number;
  totalPages: number;
}) {
  const source = report.kind === 'in-progress'
    ? report.orders.filter((order) => ['Contratar', 'Carregando', 'Em Trânsito'].includes(order.status))
    : report.orders;
  const pages = chunkForPrint(source);

  return (
    <>
      {pages.map((orders, index) => {
        const start = index * 20 + 1;
        const end = start + orders.length - 1;
        return (
          <PrintPage
            key={`appendix-${index + 1}`}
            report={report}
            pageNumber={basePageCount + index + 1}
            totalPages={totalPages}
            eyebrow="APÊNDICE OPERACIONAL"
            title="Detalhamento das ordens registradas"
            subtitle={`Registros ${start} a ${end} de ${source.length}`}
            className="rba-appendix-page"
          >
            <TableForKind report={report} orders={orders} />
            <div className="rba-appendix-source">Fonte: exportação oficial do RBA Fretes Digital. Valores reproduzidos dos campos registrados; consolidações gerenciais nas páginas executivas.</div>
          </PrintPage>
        );
      })}
    </>
  );
}
