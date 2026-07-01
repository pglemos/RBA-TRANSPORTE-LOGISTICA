'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { Search, Plus, Building2, Edit3, Trash2, Save, AlertCircle, Filter } from 'lucide-react';
import { getUniqueFilterOptions, matchesAllFilters, matchesSearchFields } from '@/lib/tableFilters';
import { isValidBrazilianPhone, isValidCpfOrCnpj, normalizeDocument, onlyDigits } from '@/lib/validators';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [emailDomainFilter, setEmailDomainFilter] = useState('');

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar clientes.');
      }
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients();
    }, 0);
    window.addEventListener('rba-auth-switch', loadClients);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadClients);
    };
  }, []);

  const handleEditTrigger = (c: any) => {
    setEditingId(c.id);
    setName(c.name || '');
    setDocument(c.document || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar a exclusão permanente deste cliente? Todos os vínculos em relatórios fiscais serão perdidos.")) {
      return;
    }
    setErrorMsg('');
    setMsg('');

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg("Cliente excluído com sucesso!");
        loadClients();
      } else {
        setErrorMsg(data.error || "Acesso proibido.");
      }
    } catch (e) {
      setErrorMsg("Erro de conexão.");
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    const normalizedDocument = normalizeDocument(document);

    if (!name || !document) {
      setErrorMsg("Razão Social / Nome e CNPJ / CPF são obrigatórios.");
      return;
    }
    if (!isValidCpfOrCnpj(normalizedDocument)) {
      setErrorMsg("CPF/CNPJ do cliente inválido.");
      return;
    }
    if (phone && !isValidBrazilianPhone(phone)) {
      setErrorMsg("Telefone do cliente inválido.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("E-mail do cliente inválido.");
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      document: normalizedDocument,
      email: email.trim(),
      phone: phone ? onlyDigits(phone) : ''
    };

    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg(editingId ? "Cliente atualizado com sucesso!" : "Novo cliente adicionado!");
        setShowForm(false);
        setEditingId(null);
        setName(''); setDocument(''); setEmail(''); setPhone('');
        loadClients();
      } else {
        setErrorMsg(data.error || "Erro de gravação cadastral.");
      }
    } catch (err) {
      setErrorMsg("Erro de rede.");
    } finally {
      setSaving(false);
    }
  };

  const getClientDocumentType = (client: any) => {
    const documentValue = String(client.document || '');
    return documentValue.includes('/') ? 'CNPJ' : 'CPF';
  };

  const getClientEmailDomain = (client: any) => String(client.email || '').split('@')[1] || '';

  const filteredClients = clients.filter(c => {
    const matchesSearch = matchesSearchFields(c, search, ['name', 'document', 'email', 'phone']);
    const matchesFilters = matchesAllFilters(c, [
      { value: documentTypeFilter, getValue: getClientDocumentType },
      { value: emailDomainFilter, getValue: getClientEmailDomain },
    ]);

    return matchesSearch && matchesFilters;
  });

  const emailDomainOptions = getUniqueFilterOptions(clients, getClientEmailDomain);

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Carteira de Clientes Tomadores</h1>
            <p className="text-xs text-slate-500 mt-1">Gerencie os clientes pagadores das cargas logísticas e faturamento rodoviário RBA.</p>
          </div>
          
          {!showForm && (
            <button
              id="add-client-btn"
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="h-4.5 w-4.5" />
              Cadastrar Cliente
            </button>
          )}
        </div>

        {/* Messaging popup */}
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
            ✔ {msg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50/70 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-650" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* INPUT COLLAPSIBLE PANEL */}
        {showForm && (
          <div className="bg-white border-2 border-yellow-500/20 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                {editingId ? 'Editar Cliente Tomador' : 'Adicionar Novo Tomador de Frete'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Razão Social / Nome Fantasia *</label>
                  <input
                    id="ip-cli-name"
                    type="text"
                    required
                    placeholder="Ex: Coca Cola Brasil S.A."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">CNPJ / CPF de Cobrança *</label>
                  <input
                    id="ip-cli-doc"
                    type="text"
                    required
                    placeholder="Ex: 12.345.678/0001-90"
                    value={document}
                    onChange={(e) => setDocument(formatCpfOrCnpj(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Faturamento E-mail Contato</label>
                  <input
                    id="ip-cli-email"
                    type="email"
                    placeholder="Ex: financeiro@cliente.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Telefone / Sac Logística</label>
                  <input
                    id="ip-cli-phone"
                    type="text"
                    placeholder="Ex: (11) 4004-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatTelefone(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                >
                  Fechar
                </button>
                <button
                  id="cli-save-btn"
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md"
                >
                  <Save className="h-4.5 w-4.5" />
                  {saving ? 'Salvando...' : 'Salvar Registo'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por razão social, CNPJ ou email faturamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                id="client-document-type-filter"
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Documentos</option>
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <select
                id="client-email-domain-filter"
                value={emailDomainFilter}
                onChange={(e) => setEmailDomainFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os E-mails</option>
                {emailDomainOptions.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Spreadsheet panel */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            Carregando lista de parceiros comerciais...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white border rounded-3xl py-16 text-center text-xs font-bold text-slate-400">
            Nenhum tomador registrado na carteira ativa.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-indigo-200/5 text-[10px]">
                    <th className="p-4">Razão Social / Cliente</th>
                    <th className="p-4">CNPJ / CPF Faturamento</th>
                    <th className="p-4">E-mail para Envio de CTE</th>
                    <th className="p-4">Canal Celular</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-4 font-black text-slate-900">{c.name}</td>
                      <td className="p-4 font-bold text-slate-650">{c.document}</td>
                      <td className="p-4 text-slate-550">{c.email || 'N/A'}</td>
                      <td className="p-4">{c.phone || 'N/A'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditTrigger(c)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg p-1.5 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
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
