'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { Shield, Settings, Key, Terminal, Save, Lock, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form preferences
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [blockOnRiskAlert, setBlockOnRiskAlert] = useState(false);

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [logsRes, settingsRes] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch('/api/settings')
      ]);

      if (logsRes.ok) {
        setAuditLogs(await logsRes.json());
      } else {
        setErrorMsg("Acesso restrito ao painel de registros de auditoria (LGPD). Verifique o Simulador de Perfil!");
      }

      if (settingsRes.ok) {
        const loadedSettings = await settingsRes.json();
        setSettings(loadedSettings);
        setCompanyName(loadedSettings.company_name || "RBA Transporte & Logística Ltda");
        setCompanyDocument(loadedSettings.company_document || "12.345.678/0001-90");
        setSupportPhone(loadedSettings.support_phone || "(11) 4004-9281");
        setInsurancePolicyNumber(loadedSettings.insurance_policy_number || "BR-TOKIO-903124A");
        setBlockOnRiskAlert(String(loadedSettings.block_on_risk_alert ?? 'true') === 'true');
      } else {
        const data = await settingsRes.json();
        setErrorMsg(data?.error || "Erro ao carregar configurações.");
      }

    } catch (e) {
      setErrorMsg("Erro de rede ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    window.addEventListener('rba-auth-switch', loadData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadData);
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_document: companyDocument,
          support_phone: supportPhone,
          insurance_policy_number: insurancePolicyNumber,
          block_on_risk_alert: String(blockOnRiskAlert)
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || "Falha ao salvar preferências.");
        return;
      }
      setSettings(data.settings);
      setMsg("Parâmetros do sistema RBA Fretes salvos com sucesso!");
      await loadData();

    } catch (err) {
      setErrorMsg("Falha ao salvar preferências.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="bg-white border p-6 rounded-3xl border-slate-200">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Preferências Gerais de Segurança & Auditorias</h1>
          <p className="text-xs text-slate-500 mt-1">Configure as premissas fiscais da RBA Logística e audite os logins e as modificações cadastrais no banco de dados.</p>
        </div>

        {/* Global feedbacks */}
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse">
            ✔ {msg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settings Parameters Form panel */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-6 h-fit">
            
            <div className="border-b pb-3 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-800" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Premissas do Sistema</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Razão Social Licença *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">CNPJ Licença *</label>
                <input
                  type="text"
                  required
                  value={companyDocument}
                  onChange={(e) => setCompanyDocument(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 border border-slate-100 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Telefone Suporte Técnico</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Apólice Consolidada de Carga</label>
                <input
                  type="text"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-55 border border-slate-200 rounded-lg outline-none text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={blockOnRiskAlert}
                    onChange={(e) => setBlockOnRiskAlert(e.target.checked)}
                    className="h-4 w-4 text-slate-800 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span>Estrito Seguradora</span>
                    <span className="text-[9px] text-slate-450 block font-normal leading-normal mt-0.5">
                      Bloquear liberação automática de pátio se Buonny reprovado.
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase cursor-pointer text-center"
              >
                {saving ? 'Gravando...' : 'Gravar Premissas'}
              </button>

            </form>
          </div>

          {/* AUDIT LOG IMMUTABLE CONSOLE */}
          <div className="lg:col-span-2 bg-slate-950 text-slate-200 border border-slate-850 rounded-3xl p-6 space-y-6 overflow-hidden">
            
            <div className="border-b border-white/5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-yellow-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Console RBA Access Logs (LGPD)</h3>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Rastreamento de acessos e CRUDs às tabelas de dados.</span>
                </div>
              </div>
              <span className="text-[9px] bg-red-500/10 text-red-400 rounded px-2 py-0.5 font-mono uppercase font-bold tracking-wider">
                Imutável
              </span>
            </div>

            {loading ? (
              <div className="py-24 text-center font-mono text-slate-500 text-xs">
                Resgatando log do pátio securitário...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-24 text-center font-mono text-slate-500 text-xs">
                Sem logs registrados no sistema.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-900/60 border border-slate-850 hover:bg-slate-900 rounded-xl space-y-1.5 transition-colors text-[11px] font-mono leading-relaxed">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-500 gap-1">
                      <span className="text-yellow-450 block font-bold uppercase tracking-wider">{log.action}</span>
                      <span>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : 'N/A'}</span>
                    </div>

                    <p className="text-slate-100 font-semibold">{log.details}</p>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1.5 gap-2">
                      <span className="font-bold text-white">Operador: {log.user_name}</span>
                      <span>Endereço IP: {log.ip_address || '127.0.0.1'}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-white/5 text-[9px] text-slate-500 font-mono flex items-center justify-between">
              <span>RBA LOG ENGINE V1.0</span>
              <span>ESTE HISTÓRICO NÃO PODE SER EXCLUÍDO MESMO POR ADMINISTRADORES</span>
            </div>

          </div>

        </div>

      </div>
    </HeaderAndSidebar>
  );
}
