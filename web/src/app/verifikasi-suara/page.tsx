"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle, XCircle, Search, ShieldAlert, FileWarning, Fingerprint, Filter, Users, Activity } from 'lucide-react';
import Image from 'next/image';

type VoteVerifikasi = {
  id: string;
  user_id: string;
  foto_vote_url: string;
  nomor_bukti: string;
  hash_record?: string;
  created_at: string;
  users?: {
    nim: string;
    nama: string;
    foto_ktm_url: string;
    fakultas: string;
  };
  periode_pemilihan?: {
    jenjang: string;
  };
  kandidat?: {
    nomor_urut: number;
    nama_kandidat: string;
    foto_url: string;
  };
  status_verifikasi?: string;
  catatan_admin?: string;
};

export default function VerifikasiSuaraPage() {
  const [queue, setQueue] = useState<VoteVerifikasi[]>([]);
  const [periodeList, setPeriodeList] = useState<{id: string, jenjang: string}[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'menunggu_verifikasi' | 'terverifikasi' | 'gagal_verifikasi' | 'dpt_status'>('menunggu_verifikasi');
  const [loading, setLoading] = useState(true);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  
  // DPT Status State
  const [dptStatusList, setDptStatusList] = useState<any[]>([]);
  
  // Stats State
  const [stats, setStats] = useState({
    total_dpt: 0,
    total_registered: 0,
    sudah_coblos: 0,
    belum_coblos: 0,
    menunggu_verifikasi: 0,
    sah: 0,
    ditolak: 0
  });
  
  // Reject Modal State
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'dpt_status') {
      fetchDptStatus();
    } else {
      fetchQueue();
    }
    fetchStats();
    fetchPeriodes();
  }, [selectedPeriode, activeTab]);

  const fetchDptStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/verifikasi/dpt-status`);
      if (res.ok) {
        const data = await res.json();
        setDptStatusList(data);
      }
    } catch (e) {
      console.error('Error fetching DPT status:', e);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/verifikasi/stats?periode=${selectedPeriode}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchPeriodes = async () => {
    const { data } = await supabase.from('periode_pemilihan').select('id, jenjang, fakultas_id').neq('status', 'ditutup');
    if (data) {
      setPeriodeList(data.map(d => ({ id: d.id, jenjang: `${d.jenjang} ${d.fakultas_id ? '- ' + d.fakultas_id : ''}` })));
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/verifikasi?periode=${selectedPeriode}&status=${activeTab}`);
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error fetching queue:', data.error);
      } else {
        setQueue(data as VoteVerifikasi[]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Anda yakin foto identitas dan selfie ini COCOK? Suara akan disahkan.')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert('Gagal menyetujui: ' + data.error);
      } else {
        // Remove from queue and close modal
        setQueue(q => q.filter(item => item.id !== id));
        setSelectedVoteId(null);
        fetchStats();
      }
    } catch (e) {
      alert('Gagal: ' + e);
    }
    setIsSubmitting(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', id: rejectId, reason: rejectReason })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert('Gagal menolak: ' + data.error);
      } else {
        // Close modal and remove from queue
        setRejectId(null);
        setRejectReason('');
        setSelectedVoteId(null);
        setQueue(q => q.filter(item => item.id !== rejectId));
        fetchStats();
      }
    } catch (e) {
      alert('Gagal: ' + e);
    }
    setIsSubmitting(false);
  };

  const handleRevert = async (id: string) => {
    if (!confirm('Batalkan keputusan dan kembalikan suara ini ke antrian utama?')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', id })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert('Gagal membatalkan: ' + data.error);
      } else {
        setSelectedVoteId(null);
        setQueue(q => q.filter(item => item.id !== id));
        fetchStats();
      }
    } catch (e) {
      alert('Gagal: ' + e);
    }
    setIsSubmitting(false);
  };

  const currentVote = selectedVoteId ? queue.find(v => v.id === selectedVoteId) : null;

  return (
    <div className="space-y-6 pb-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Fingerprint className="text-primary-600" /> Verifikasi Suara (KYC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cocokkan foto selfie saat voting dengan foto identitas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              value={selectedPeriode}
              onChange={e => setSelectedPeriode(e.target.value)}
            >
              <option value="all">Semua Antrian Pemilihan</option>
              {periodeList.map(p => (
                <option key={p.id} value={p.id}>{p.jenjang}</option>
              ))}
            </select>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-lg font-medium text-slate-700 flex items-center gap-2">
            Total Data: <span className="bg-primary-600 text-white px-2 py-0.5 rounded-md">{queue.length}</span>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        <div className="glass-panel p-4 flex flex-col border-t-4 shadow-sm border-t-purple-500 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-purple-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Registrasi to Vote</span>
          </div>
          <span className="text-3xl font-black text-slate-800 mt-1">{stats.sudah_coblos} <span className="text-xl font-semibold text-slate-400">/ {stats.total_registered}</span></span>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${stats.total_registered > 0 ? (stats.sudah_coblos / stats.total_registered) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="glass-panel p-4 flex flex-col border-t-4 shadow-sm border-t-blue-500 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Partisipasi Coblos (DPT)</span>
          </div>
          <span className="text-3xl font-black text-slate-800 mt-1">{stats.sudah_coblos} <span className="text-xl font-semibold text-slate-400">/ {stats.total_dpt}</span></span>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${stats.total_dpt > 0 ? (stats.sudah_coblos / stats.total_dpt) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="glass-panel p-4 flex flex-col border-t-4 shadow-sm border-t-amber-500 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Antrean Verifikasi</span>
          </div>
          <span className="text-3xl font-black text-amber-600 mt-1">{stats.menunggu_verifikasi} <span className="text-sm font-medium text-slate-500">Menunggu</span></span>
        </div>
        <div className="glass-panel p-4 flex flex-col border-t-4 shadow-sm border-t-emerald-500 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Suara Sah (Diterima)</span>
          </div>
          <span className="text-3xl font-black text-emerald-600 mt-1">{stats.sah} <span className="text-sm font-medium text-slate-500">Suara</span></span>
        </div>
        <div className="glass-panel p-4 flex flex-col border-t-4 shadow-sm border-t-red-500 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Suara Ditolak</span>
          </div>
          <span className="text-3xl font-black text-red-600 mt-1">{stats.ditolak} <span className="text-sm font-medium text-slate-500">Suara</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('menunggu_verifikasi')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'menunggu_verifikasi' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Antrian Verifikasi
        </button>
        <button 
          onClick={() => setActiveTab('terverifikasi')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'terverifikasi' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Suara Sah
        </button>
        <button 
          onClick={() => setActiveTab('gagal_verifikasi')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'gagal_verifikasi' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Suara Ditolak
        </button>
        <button 
          onClick={() => setActiveTab('dpt_status')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dpt_status' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pantau DPT (Multi-Ceklis)
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500">Memuat antrian verifikasi...</p>
        </div>
      ) : (activeTab !== 'dpt_status' && queue.length === 0) || (activeTab === 'dpt_status' && dptStatusList.length === 0) ? (
        <div className="glass-panel flex-1 flex flex-col items-center justify-center min-h-[500px] border-dashed border-2 text-center p-8">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Data Kosong</h2>
          <p className="text-slate-500 mt-2 max-w-md">Tidak ada data suara pada kategori ini.</p>
          <button onClick={activeTab === 'dpt_status' ? fetchDptStatus : fetchQueue} className="mt-6 text-primary-600 font-medium hover:underline">
            Refresh Data
          </button>
        </div>
      ) : activeTab === 'dpt_status' ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">NIM</th>
                  <th className="px-6 py-4 font-medium">Nama / Jurusan</th>
                  <th className="px-6 py-4 font-medium">Status Vote: BEM-F</th>
                  <th className="px-6 py-4 font-medium">Status Vote: SEMA-F</th>
                  <th className="px-6 py-4 font-medium">Status Vote: HMJ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dptStatusList
                  .filter(d => {
                     const pData = periodeList.find(p => p.id === selectedPeriode);
                     if (pData && pData.jenjang.startsWith('HMJ')) {
                        const target = pData.jenjang.split('- ')[1];
                        if (target && d.jurusan !== target) return false;
                     }
                     return true;
                  })
                  .slice(0, 100).map(d => {
                  const renderBadge = (status: string | undefined) => {
                    if (status === 'terverifikasi') return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-max"><CheckCircle size={12}/> Sah</span>;
                    if (status === 'menunggu_verifikasi') return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-max"><Activity size={12}/> Menunggu</span>;
                    if (status === 'gagal_verifikasi') return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-max"><XCircle size={12}/> Ditolak</span>;
                    return <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-max"><XCircle size={12}/> Belum Vote</span>;
                  };

                  return (
                    <tr key={d.nim} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{d.nim}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{d.nama}</div>
                        <div className="text-xs text-slate-500">{d.jurusan || 'Tanpa Jurusan'}</div>
                      </td>
                      <td className="px-6 py-4">{renderBadge(d.votes['BEM-F'])}</td>
                      <td className="px-6 py-4">{renderBadge(d.votes['SEMA-F'])}</td>
                      <td className="px-6 py-4">{renderBadge(d.votes['HMJ'])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Pemilih</th>
                  <th className="px-6 py-4 font-medium">Periode</th>
                  <th className="px-6 py-4 font-medium">Waktu Vote</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map(vote => (
                  <tr key={vote.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{vote.users?.nama}</div>
                      <div className="text-sm text-slate-500">{vote.users?.nim}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{vote.periode_pemilihan?.jenjang}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(vote.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedVoteId(vote.id)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2 text-sm"
                      >
                        <Fingerprint size={16} /> {activeTab === 'menunggu_verifikasi' ? 'Lakukan Verifikasi' : 'Lihat Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Verifikasi (Card Besar) */}
      {currentVote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-10 md:pl-72">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Fingerprint className="text-primary-600" /> Proses Verifikasi Suara
              </h3>
              <button 
                onClick={() => setSelectedVoteId(null)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Modal Body - Split Screen */}
            <div className="flex flex-col md:flex-row p-6 gap-6 bg-slate-50/50">
              {/* Sisi Kiri: Data Profil & KTM */}
              <div className="bg-white p-6 rounded-xl flex-1 flex flex-col border-t-4 border-t-slate-800 shadow-md">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">DATA PROFIL</span>
                  <h2 className="text-lg font-bold text-slate-800 flex-1">{currentVote.users?.nama}</h2>
                  <span className="text-sm font-mono text-slate-500">{currentVote.users?.nim}</span>
                </div>
                
                <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative group min-h-[300px]">
                  {currentVote.users?.foto_ktm_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={currentVote.users.foto_ktm_url} 
                      alt="KTM" 
                      className="max-w-full max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-150 cursor-zoom-in"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ShieldAlert size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Tidak ada foto identitas di profil</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sisi Kanan: Data Vote & Selfie */}
              <div className="bg-white p-6 rounded-xl flex-1 flex flex-col border-t-4 border-t-primary-500 shadow-md">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded">BUKTI VOTE</span>
                  <h2 className="text-lg font-bold text-slate-800 flex-1">{currentVote.periode_pemilihan?.jenjang}</h2>
                  <span className="text-xs font-medium text-slate-400">{new Date(currentVote.created_at).toLocaleString('id-ID')}</span>
                </div>

                {/* Info Pilihan Kandidat */}
                {currentVote.kandidat && (
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-4">
                    {currentVote.kandidat.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentVote.kandidat.foto_url} alt="Kandidat" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        {currentVote.kandidat.nomor_urut}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-indigo-600 font-bold mb-0.5">PILIHAN KANDIDAT</p>
                      <p className="text-sm font-bold text-slate-800">Paslon No. {currentVote.kandidat.nomor_urut}: {currentVote.kandidat.nama_kandidat}</p>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 font-bold mb-1">NOMOR RESI BUKTI</p>
                  <p className="text-lg font-mono font-bold text-slate-800 mb-3">{currentVote.nomor_bukti}</p>
                  <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
                    <ShieldAlert size={14} className="text-primary-500" /> HASH KRIPTOGRAFI (SHA-256)
                  </p>
                  <p className="text-xs font-mono text-slate-600 break-all bg-slate-200 p-2 rounded">{currentVote.hash_record || 'Menunggu Sinkronisasi'}</p>
                </div>
                
                <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative group min-h-[300px]">
                  {currentVote.foto_vote_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={currentVote.foto_vote_url} 
                      alt="Selfie Voting" 
                      className="max-w-full max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-150 cursor-zoom-in"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ShieldAlert size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Tidak ada foto selfie</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                {currentVote.status_verifikasi === 'menunggu_verifikasi' ? (
                  <div className="mt-6 flex gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setRejectId(currentVote.id)}
                      disabled={isSubmitting}
                      className="flex-1 py-4 flex items-center justify-center gap-2 font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <XCircle size={20} /> TOLAK
                    </button>
                    <button 
                      onClick={() => handleApprove(currentVote.id)}
                      disabled={isSubmitting}
                      className="flex-[2] py-4 flex items-center justify-center gap-2 font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <CheckCircle size={24} /> COCOK - SAHKAN
                    </button>
                  </div>
                ) : (
                  <div className={`mt-6 p-5 rounded-xl flex flex-col gap-4 border ${currentVote.status_verifikasi === 'terverifikasi' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <div className="flex items-start gap-3">
                      {currentVote.status_verifikasi === 'terverifikasi' ? <CheckCircle size={24} className="mt-0.5 shrink-0" /> : <XCircle size={24} className="mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <h4 className="font-bold text-base">Status: {currentVote.status_verifikasi === 'terverifikasi' ? 'SUARA SAH' : 'DITOLAK'}</h4>
                        {currentVote.catatan_admin && (
                          <p className="text-sm mt-1 opacity-90">Alasan Penolakan: {currentVote.catatan_admin}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRevert(currentVote.id)}
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 font-bold rounded-lg transition-colors border shadow-sm text-sm disabled:opacity-50 mt-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    >
                      Batalkan Keputusan & Kembalikan ke Antrian
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in md:pl-72">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 border-b border-red-100 p-6 flex gap-4 items-start">
              <div className="bg-red-100 text-red-600 p-3 rounded-full shrink-0">
                <FileWarning size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">Tolak Verifikasi Suara</h3>
                <p className="text-sm text-red-600/80 mt-1">
                  Suara yang ditolak tidak akan dihitung. Mahasiswa dapat melihat alasan penolakan ini.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Alasan Penolakan (Wajib Diisi)</label>
                <textarea 
                  rows={4}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-red-400 focus:ring-4 focus:ring-red-400/20 outline-none transition-all resize-none"
                  placeholder="Misal: Wajah tidak terlihat jelas karena gelap / Wajah tidak cocok dengan foto KTM..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setRejectId(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak Suara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
