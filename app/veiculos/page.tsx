'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { Search, Plus, Truck, Edit3, Trash2, ShieldCheck, Key, Save, AlertCircle } from 'lucide-react';
import { isValidBrazilianPlate, isValidCpfOrCnpj, isValidVehicleYear, normalizeDocument, normalizePlate, normalizeUf } from '@/lib/validators';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState('');

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Vehicle form values
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [tractorPlate, setTractorPlate] = useState('');
  const [trailerPlate, setTrailerPlate] = useState('');
  const [uf, setUf] = useState('');
  const [antt, setAntt] = useState('');
  const [renavam, setRenavam] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerDocument, setOwnerDocument] = useState('');

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar veículos.');
      }
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar veículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVehicles();
    }, 0);
    window.addEventListener('rba-auth-switch', loadVehicles);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadVehicles);
    };
  }, []);

  const handleEditTrigger = (vhc: any) => {
    setEditingId(vhc.id);
    setModel(vhc.model || '');
    setYear(String(vhc.year || ''));
    setTractorPlate(vhc.tractor_plate || '');
    setTrailerPlate(vhc.trailer_plate || '');
    setUf(vhc.uf || '');
    setAntt(vhc.antt || '');
    setRenavam(vhc.renavam || '');
    setOwnerName(vhc.owner_name || '');
    setOwnerDocument(vhc.owner_document || '');

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar a exclusão permanente deste veículo do banco de dados?")) {
      return;
    }
    setErrorMsg('');
    setMsg('');

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg("Veículo removido da base de dados com sucesso!");
        loadVehicles();
      } else {
        setErrorMsg(data.error || "Acesso proibido.");
      }
    } catch (e) {
      setErrorMsg("Erro de conexão.");
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    const normalizedTractorPlate = normalizePlate(tractorPlate);
    const normalizedTrailerPlate = normalizePlate(trailerPlate);
    const normalizedUf = normalizeUf(uf);
    const normalizedOwnerDocument = normalizeDocument(ownerDocument);
    const parsedYear = Number(year);

    if (model.trim().length < 2) {
      setErrorMsg("Modelo do veículo é obrigatório.");
      return;
    }
    if (!isValidVehicleYear(parsedYear)) {
      setErrorMsg("Ano do veículo inválido.");
      return;
    }
    if (!isValidBrazilianPlate(normalizedTractorPlate)) {
      setErrorMsg("Placa do cavalo inválida. Use formato antigo ABC1234 ou Mercosul ABC1D23.");
      return;
    }
    if (!isValidBrazilianPlate(normalizedTrailerPlate)) {
      setErrorMsg("Placa da carreta inválida. Use formato antigo ABC1234 ou Mercosul ABC1D23.");
      return;
    }
    if (ownerName.trim().length < 3) {
      setErrorMsg("Nome do proprietário é obrigatório.");
      return;
    }
    if (!isValidCpfOrCnpj(normalizedOwnerDocument)) {
      setErrorMsg("CPF/CNPJ do proprietário inválido.");
      return;
    }
    if (normalizedUf.length !== 2) {
      setErrorMsg("UF do veículo é obrigatória com 2 letras.");
      return;
    }

    setSaving(true);
    const payload = {
      model: model.trim(),
      year: parsedYear,
      tractor_plate: normalizedTractorPlate,
      trailer_plate: normalizedTrailerPlate,
      uf: normalizedUf,
      antt: antt.trim(),
      renavam: renavam.trim(),
      owner_name: ownerName.trim(),
      owner_document: normalizedOwnerDocument
    };

    try {
      const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg(editingId ? "Veículo atualizado com sucesso!" : "Novo veículo conjugado cadastrado!");
        setShowForm(false);
        setEditingId(null);

        // Reset
        setModel(''); setYear(''); setTractorPlate(''); setTrailerPlate('');
        setUf(''); setAntt(''); setRenavam(''); setOwnerName(''); setOwnerDocument('');

        loadVehicles();
      } else {
        setErrorMsg(data.error || "Erro de gravação cadastral.");
      }
    } catch (err) {
      setErrorMsg("Erro de rede.");
    } finally {
      setSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.tractor_plate?.toLowerCase().includes(search.toLowerCase()) ||
    v.trailer_plate?.toLowerCase().includes(search.toLowerCase()) ||
    v.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Frota Conjugada de Veículos</h1>
            <p className="text-xs text-slate-500 mt-1">Controle de frotas associando cavalos trator mecânicos com semi-reboques graneleiros, baús ou tanques.</p>
          </div>
          
          {!showForm && (
            <button
              id="add-vehicle-btn"
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="h-4.5 w-4.5" />
              Cadastrar Veículo
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
          <div className="bg-white border-2 border-yellow-500/20 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                {editingId ? 'Editar Detalhes do Equipamento' : 'Novo Registro de Veículo Conjugado'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Modelo Mecânico / Chassi *</label>
                  <input
                    id="ip-vhc-model"
                    type="text"
                    required
                    placeholder="Ex: Scania R 450"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Ano de Fabricação *</label>
                  <input
                    id="ip-vhc-year"
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 2}
                    placeholder="Ex: 2021"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Estado UF de Registro Principal *</label>
                  <input
                    id="ip-vhc-uf"
                    type="text"
                    maxLength={2}
                    placeholder="Ex: SP"
                    value={uf}
                    onChange={(e) => setUf(normalizeUf(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Placa Cavalo Trator *</label>
                  <input
                    id="ip-vhc-tractor"
                    type="text"
                    required
                    maxLength={7}
                    placeholder="Ex: ABC1D23"
                    value={tractorPlate}
                    onChange={(e) => setTractorPlate(normalizePlate(e.target.value).slice(0, 7))}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Placa Semi-Reboque (Carreta) *</label>
                  <input
                    id="ip-vhc-trailer"
                    type="text"
                    required
                    maxLength={7}
                    placeholder="Ex: XYZ9W87"
                    value={trailerPlate}
                    onChange={(e) => setTrailerPlate(normalizePlate(e.target.value).slice(0, 7))}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">ANTT Registro</label>
                  <input
                    id="ip-vhc-antt"
                    type="text"
                    placeholder="Ex: ANTT-9034123"
                    value={antt}
                    onChange={(e) => setAntt(e.target.value)}
                    className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">RENAVAM ID</label>
                  <input
                    id="ip-vhc-renavam"
                    type="text"
                    placeholder="Ex: 12345678901"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Nome Proprietário Unidade</label>
                  <input
                    type="text"
                    placeholder="João da Silva ou RBA Frota"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">CPF/CNPJ do Proprietário *</label>
                  <input
                    type="text"
                    placeholder="Ex: 12.345.678/0001-90"
                    value={ownerDocument}
                    onChange={(e) => setOwnerDocument(e.target.value)}
                    className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
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
                  id="vhc-save-btn"
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md"
                >
                  <Save className="h-4.5 w-4.5" />
                  {saving ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Filter search bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por modelo, UF, ou placas trator/semi-reboque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 text-slate-800"
            />
          </div>
        </div>

        {/* Spreadsheet grid */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            Buscando frotas registradas...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white border rounded-3xl py-16 text-center text-xs font-bold text-slate-400">
            Nenhum veículo conjugado cadastrado nesta empresa de transporte.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-indigo-200/5 text-[10px]">
                    <th className="p-4">Modelo Trator</th>
                    <th className="p-4">Placa Cavalo</th>
                    <th className="p-4">Placa Carreta (Reboque)</th>
                    <th className="p-4">ANTT Registro</th>
                    <th className="p-4">RENAVAM</th>
                    <th className="p-4">Proprietário Equipamento</th>
                    <th className="p-4">Estado UF</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-4 font-extrabold text-slate-900">{v.model} ({v.year || 'N/A'})</td>
                      <td className="p-4">
                        <span className="font-mono font-bold border-2 border-slate-600 bg-slate-55 rounded p-1 px-2.5 text-slate-900 text-[11px]">
                          {v.tractor_plate}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold border-2 border-slate-450 bg-slate-55 rounded p-1 px-2.5 text-slate-600 text-[11px]">
                          {v.trailer_plate}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600 font-bold">{v.antt || 'Isento'}</td>
                      <td className="p-4 font-mono text-slate-450">{v.renavam || 'N/A'}</td>
                      <td className="p-4">
                        <div className="text-[11px]">
                          <p>{v.owner_name}</p>
                          <p className="text-[9.5px] text-slate-450">ID: {v.owner_document}</p>
                        </div>
                      </td>
                      <td className="p-4 font-black text-slate-800">{v.uf}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditTrigger(v)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg p-1.5 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
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
