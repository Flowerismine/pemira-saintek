"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Calendar, Target, Activity, Search } from 'lucide-react';

type Periode = {
  id: string;
  jenjang: string;
  fakultas_id: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
};

export default function PeriodePemilihan() {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [jurusanList, setJurusanList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [jenjang, setJenjang] = useState('BEM-F');
  const [fakultasId, setFakultasId] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPeriodes();
    fetchJurusan();
  }, []);

  const fetchJurusan = async () => {
    const { data, error } = await supabase.from('whitelist_mahasiswa').select('jurusan');
    if (!error && data) {
      const unique = Array.from(new Set(data.map(d => d.jurusan).filter(Boolean)));
      setJurusanList(unique as string[]);
    }
  };

  const fetchPeriodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/periode');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPeriodes(data || []);
    } catch (error) {
      console.error('Error fetching periode:', error);
    }
    setLoading(false);
  };

  const formatForInput = (isoDate: string) => {
    const d = new Date(isoDate);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleEditClick = (p: Periode) => {
    setEditId(p.id);
    setJenjang(p.jenjang);
    setFakultasId(p.fakultas_id || '');
    setTanggalMulai(formatForInput(p.tanggal_mulai));
    setTanggalSelesai(formatForInput(p.tanggal_selesai));
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setJenjang('BEM-F');
    setFakultasId('');
    setTanggalMulai('');
    setTanggalSelesai('');
    setStatus('draft');
  };

  const handleSavePeriode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert local datetime-local to UTC for Supabase
    const mulaiISO = new Date(tanggalMulai).toISOString();
    const selesaiISO = new Date(tanggalSelesai).toISOString();

    const payload = {
      jenjang,
      fakultas_id: (jenjang === 'BEM-F' || jenjang === 'SEMA-F') ? 'Seluruh Fakultas' : fakultasId,
      tanggal_mulai: mulaiISO,
      tanggal_selesai: selesaiISO,
      status: editId ? status : 'draft',
    };

    let errorMessage = null;
    try {
      const method = editId ? 'PUT' : 'POST';
      const bodyPayload = editId ? { id: editId, ...payload } : payload;
      
      const res = await fetch('/api/periode', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await res.json();
      if (!res.ok) errorMessage = data.error;
    } catch (e: any) {
      errorMessage = e.message;
    }

    setIsSubmitting(false);

    if (errorMessage) {
      alert('Gagal menyimpan periode: ' + errorMessage);
    } else {
      handleCloseModal();
      fetchPeriodes(); // Refresh table
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'aktif': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Aktif</span>;
      case 'draft': return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">Draft</span>;
      case 'ditutup': return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Ditutup</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Periode Pemilihan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola jadwal dan status pemilihan mahasiswa</p>
        </div>
        <button 
          onClick={() => { handleCloseModal(); setIsModalOpen(true); }}
          className="glass-button flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Buat Periode Baru</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari periode..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Jenjang & Sasaran</th>
                <th className="px-6 py-4 font-medium">Jadwal Mulai</th>
                <th className="px-6 py-4 font-medium">Jadwal Selesai</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : periodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data periode pemilihan. Klik "Buat Periode Baru" untuk memulai.
                  </td>
                </tr>
              ) : (
                periodes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                          <Target size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{p.jenjang}</p>
                          <p className="text-xs text-slate-500">{p.fakultas_id || 'Seluruh Universitas'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(p.tanggal_mulai).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(p.tanggal_selesai).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEditClick(p)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Create */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Edit Periode Pemilihan' : 'Buat Periode Baru'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSavePeriode} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang Pemilihan</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value)}
                  required
                >
                  <option value="BEM-F">BEM Fakultas</option>
                  <option value="SEMA-F">SEMA Fakultas</option>
                  <option value="HMJ">Himpunan Mahasiswa Jurusan (HMJ)</option>
                </select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Pemilih</label>
                  {jenjang === 'BEM-F' || jenjang === 'SEMA-F' ? (
                    <input 
                      type="text" 
                      value="Seluruh Fakultas"
                      disabled
                      className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed"
                    />
                  ) : (
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      value={fakultasId}
                      onChange={(e) => setFakultasId(e.target.value)}
                      required
                    >
                      <option value="">Pilih Target Jurusan...</option>
                      {jurusanList.map(j => (
                        <option key={j} value={j}>Jurusan {j}</option>
                      ))}
                    </select>
                  )}
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                  <input 
                    type="datetime-local" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                  <input 
                    type="datetime-local" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {editId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Periode</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="draft">Draft (Belum Dimulai)</option>
                    <option value="aktif">Aktif (Sedang Berjalan)</option>
                    <option value="ditutup">Ditutup (Selesai)</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="glass-button flex items-center gap-2 opacity-100 disabled:opacity-70"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
