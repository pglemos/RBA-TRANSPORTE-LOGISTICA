'use client';

import React from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderForm from '@/components/FreightOrderForm';

export default function NewOrderPage() {
  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        <div className="bg-white border rounded-3xl p-5 border-slate-200">
          <h1 id="hd-nova-ordem" className="text-lg font-black text-slate-900 tracking-tight">Emissão Assistida de Ficha de Frete</h1>
          <p className="text-xs text-slate-500 mt-1">Siga as etapas do assistente digital para autorizar o motorista e o conjunto de reboques conjugados de pátio.</p>
        </div>

        {/* Master Form component */}
        <FreightOrderForm />
      </div>
    </HeaderAndSidebar>
  );
}
