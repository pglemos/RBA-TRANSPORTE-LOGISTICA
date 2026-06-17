'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderForm from '@/components/FreightOrderForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditOrderPage() {
const params = useParams<{ id: string }>();
const id = params?.id;
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setErrorMsg("Ordem de frete não encontrada ou acesso proibido.");
        }
      } catch (e) {
        setErrorMsg("Erro de rede ao buscar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    window.addEventListener('rba-auth-switch', fetchOrder);
    return () => window.removeEventListener('rba-auth-switch', fetchOrder);
  }, [id]);

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-black block tracking-wider">Edição da Emissão</span>
            <h1 className="text-sm font-black text-slate-900">Editar Ficha de Frete {order ? `#${order.order_number}` : ''}</h1>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center border rounded-3xl">
            <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-xs">Sincronizando ficha para auditoria de revisão...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl font-bold text-xs text-center">
            {errorMsg}
          </div>
        ) : (
          <FreightOrderForm initialData={order} />
        )}

      </div>
    </HeaderAndSidebar>
  );
}
