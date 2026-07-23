'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { Search, Plus, UserPlus, Edit3, Trash2, ShieldCheck, Lock, Save, AlertCircle, Filter } from 'lucide-react';
import { getUniqueFilterOptions, matchesAllFilters, matchesSearchFields } from '@/lib/tableFilters';
import { isValidBrazilianPhone, isValidCPF, isValidCpfOrCnpj, isValidPixKey, normalizeDocument, onlyDigits } from '@/lib/validators';

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');

  // Creation State Panel
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Bloqueado'>('Ativo');
  
  // Bank Form Fields
  const [bankName, setBankName] = useState('');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryDocument, setBeneficiaryDocument] = useState('');

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const formatTelefone = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const formatCpfOrCnpj = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 11) {
      return formatCPF(clean);
    }
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
  };

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drivers');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar motoristas.');
      }
      setDrivers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar motoristas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrivers();
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleEditTrigger = (drv: any) => {
    setEditingId(drv.id);
    setName(drv.name || '');
    setCpf(drv.cpf || '');
    setRg(drv.rg || '');
    setPhone(drv.phone || '');
    setStatus(drv.status || 'Ativo');
    setBankName(drv.bank_name || '');
    setBankAgency(drv.bank_agency || '');
    setBankAccount(drv.bank_account || '');
    setPixKey(drv.pix_key || '');
    setBeneficiaryName(drv.beneficiary_name || '');
    setBeneficiaryDocument(drv.beneficiary_document || '');

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar a exclusão deste cadastro de motorista? Todas as validações vinculadas de pátio serão invalidadas.")) {
      return;
    }
    setErrorMsg('');
    setMsg('');

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg("Cadastro de motorista excluído permanente!");
        loadDrivers();
      } else {
        setErrorMsg(data.error || "Operação proibida para o seu perfil.");
      }
    } catch (e) {
      setErrorMsg("Erro ao conectar à API.");
    }
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    const normalizedCpf = normalizeDocument(cpf);
    const normalizedBeneficiaryDocument = normalizeDocument(beneficiaryDocument || cpf);

    if (name.trim().length < 3) {
      setErrorMsg("Nome completo do motorista é obrigatório.");
      return;
    }
    if (!isValidCPF(normalizedCpf)) {
      setErrorMsg("CPF do motorista inválido.");
      return;
    }
    if (!isValidBrazilianPhone(phone)) {
      setErrorMsg("Telefone do motorista inválido.");
      return;
    }
    if (!isValidPixKey(pixKey)) {
      setErrorMsg("Chave Pix inválida. Use CPF/CNPJ válido, telefone, e-mail ou chave aleatória UUID.");
      return;
    }
    if ((beneficiaryName || name).trim().length < 3) {
      setErrorMsg("Nome do favorecido é obrigatório.");
      return;
    }
    if (!isValidCpfOrCnpj(normalizedBeneficiaryDocument)) {
      setErrorMsg("CPF/CNPJ do favorecido inválido.");
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      cpf: normalizedCpf,
      rg: rg.trim(),
      phone: onlyDigits(phone),
      status,
      bank_name: bankName.trim(),
      bank_agency: bankAgency.trim(),
      bank_account: bankAccount.trim(),
      pix_key: pixKey.trim(),
      beneficiary_name: (beneficiaryName || name).trim(),
      beneficiary_document: normalizedBeneficiaryDocument
    };

    try {
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      const method = editingId ? 'PUT' : 'POST';
      const isNewDriver = !editingId;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg(editingId ? "Motorista atualizado com sucesso!" : "Novo motorista incluído no banco de dados RBA!");
        const shouldCreateVehicle = isNewDriver && window.confirm("Motorista cadastrado com sucesso. Deseja cadastrar o veículo agora?");
        setShowForm(false);
        setEditingId(null);
        
        // Reset states
        setName(''); setCpf(''); setRg(''); setPhone(''); setStatus('Ativo');
        setBankName(''); setBankAgency(''); setBankAccount(''); setPixKey('');
        setBeneficiaryName(''); setBeneficiaryDocument('');

        loadDrivers();
        if (shouldCreateVehicle) {
          router.push('/veiculos?novo=1');
        }
      } else {
        setErrorMsg(data.error || "Erro de gravação cadastral.");
      }
    } catch (err) {
      setErrorMsg("Erro de rede.");
    } finally {
      setSaving(false);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = matchesSearchFields(d, search, ['name', 'cpf', 'phone', 'rg', 'bank_name', 'pix_key']);
    const matchesFilters = matchesAllFilters(d, [
      { value: statusFilter, getValue: (driver) => driver.status },
      { value: bankFilter, getValue: (driver) => driver.bank_name },
    ]);

    return matchesSearch && matchesFilters;
  });

  const bankOptions = getUniqueFilterOptions(drivers, (driver) => driver.bank_name);

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Cadastro Geral de Motoristas</h1>
            <p className="text-xs text-slate-500 mt-1">Gerencie a identificação, status do seguro de risco, dados PIX e informações fiscais dos condutores.</p>
          </div>
          
          {!showForm && (
            <button
              id="add-driver-btn"
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Novo Condutor
            </button>
          )}
        </div>

        {/* Messaging popup */}
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse">
            ✔ {msg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50/70 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              {/* Dark backdrop overlay */}
              <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" 
                onClick={() => setShowForm(false)} 
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-2xl transform transition duration-500 ease-in-out sm:duration-700">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white p-6 shadow-2xl space-y-6">
                    <div className="border-b pb-3 flex justify-between items-center">
                      <h3 id="slide-over-title" className="text-xs font-black text-slate-900 uppercase tracking-widest">
                        {editingId ? 'Editar Detalhes do Condutor' : 'Lançar Ficha de Novo Motorista'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Cancelar
                      </button>
                    </div>

                    <form onSubmit={handleSaveDriver} className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Nome Completo do Piloto *</label>
                            <input
                              id="ip-drv-name"
                              type="text"
                              required
                              placeholder="Ex: João da Silva Santos"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500">CPF (Somente Números) *</label>
                            <input
                              id="ip-drv-cpf"
                              type="text"
                              required
                              placeholder="Ex: 123.456.789-00"
                              value={cpf}
                              onChange={(e) => setCpf(formatCPF(e.target.value))}
                              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Documento de Identidade RG</label>
                            <input
                              id="ip-drv-rg"
                              type="text"
                              placeholder="Ex: 50.123.456-7"
                              value={rg}
                              onChange={(e) => setRg(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Telefone / Whatsapp do Piloto *</label>
                            <input
                              id="ip-drv-phone"
                              type="text"
                              placeholder="Ex: (11) 98765-4321"
                              value={phone}
                              onChange={(e) => setPhone(formatTelefone(e.target.value))}
                              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Status Operacional Cadastral</label>
                            <select
                              id="ip-drv-status"
                              value={status}
                              onChange={(e) => setStatus(e.target.value as any)}
                              className="w-full text-xs font-black px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                            >
                              <option value="Ativo">🟢 Ativo / Seguro Geral Liberado</option>
                              <option value="Bloqueado">🔴 Bloqueado / Restrição de Risco</option>
                            </select>
                          </div>
                        </div>

                        {/* Sub-form section: Snapshot Banking pix parameters */}
                        <div className="border-t pt-5 space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Dados Bancários / Recebimento de Frete (Pix)</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Instituição Financeira / Banco</label>
                              <input
                                type="text"
                                placeholder="Ex: Banco Itaú"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Agência Bancária</label>
                              <input
                                type="text"
                                placeholder="Ex: 0001"
                                value={bankAgency}
                                onChange={(e) => setBankAgency(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Conta Corrente / Conta Poupança</label>
                              <input
                                type="text"
                                placeholder="Ex: 12345-6"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500 text-emerald-800">Chave PIX Oficial *</label>
                              <input
                                id="ip-drv-pix"
                                type="text"
                                placeholder="E-mail, CPF, celular ou aleatória..."
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Nome Favorecido Completo (Se diferente)</label>
                              <input
                                type="text"
                                placeholder="Deixe em branco se for o próprio motorista"
                                value={beneficiaryName}
                                onChange={(e) => setBeneficiaryName(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">CPF/CNPJ do Favorecido *</label>
                              <input
                                type="text"
                                placeholder="Deixe em branco se for o próprio motorista"
                                value={beneficiaryDocument}
                                onChange={(e) => setBeneficiaryDocument(formatCpfOrCnpj(e.target.value))}
                                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t pt-4 mt-8">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                        >
                          Fechar
                        </button>
                        <button
                          id="driver-save-btn"
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md"
                        >
                          <Save className="h-4.5 w-4.5" />
                          {saving ? 'Gravando...' : 'Gravar Piloto'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar motoristas por nome completo, CPF ou celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                id="driver-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Bloqueado">Bloqueado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <select
                id="driver-bank-filter"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Bancos</option>
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Spreadsheet panel */}
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-450">
            Sincronizando frotas de condutores...
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-white border rounded-3xl py-16 text-center text-xs font-bold text-slate-450 text-slate-400">
            Nenhum motorista cadastrado no sistema atende a essa busca.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-indigo-200/10 text-[10px]">
                    <th className="p-4">Nome do Motorista</th>
                    <th className="p-4">CPF Controle</th>
                    <th className="p-4">Documento Identidade RG</th>
                    <th className="p-4">Celular</th>
                    <th className="p-4">Informação de Banco / Pix</th>
                    <th className="p-4">Seguro Cadastral</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredDrivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900">{d.name}</td>
                      <td className="p-4 font-bold text-slate-650">{d.cpf}</td>
                      <td className="p-4 text-slate-500">{d.rg || 'N/A'}</td>
                      <td className="p-4">{d.phone || 'N/A'}</td>
                      <td className="p-4">
                        <div className="text-[11px] leading-none">
                          <p>{d.bank_name || 'N/A'}</p>
                          <p className="text-[9.5px] text-emerald-800 mt-1 font-bold">Pix: {d.pix_key || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`p-1 px-2.5 rounded text-[10px] font-black uppercase ${
                          d.status === 'Bloqueado' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditTrigger(d)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg p-1.5 text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 rounded-lg p-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
