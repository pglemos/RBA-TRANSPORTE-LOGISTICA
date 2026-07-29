import type { ReactNode } from 'react';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <style>{`
        @media print {
          .report-reference {
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: normal !important;
          }
        }
      `}</style>
    </>
  );
}