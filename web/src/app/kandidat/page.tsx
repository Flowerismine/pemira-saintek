"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, User, ArrowLeft, Image as ImageIcon, Users, Shield, BookOpen, ChevronRight } from 'lucide-react';

type Kandidat = {
  id: string;
  periode_id: string;
  nomor_urut: number;
  nama: string;
  foto_url: string;
  visi_misi: string;
};

type Periode = {
  id: string;
  jenjang: string;
  fakultas_id: string | null;
};

type ViewLevel = 'ROOT' | 'HMJ_LIST' | 'CANDIDATE_LIST';

export default function KandidatPage() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('ROOT');
  
  // Data
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [kandidats, setKandidats] = useState<Kandidat[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected State
  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomorUrut, setNomorUrut] = useState('');
  const [nama, setNama] = useState('');
  const [visiMisi, setVisiMisi] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPeriodes();
  }, []);

  useEffect(() => {
    if (viewLevel === 'CANDIDATE_LIST' && selectedPeriode) {
      fetchKandidats(selectedPeriode.id);
    }
  }, [viewLevel, selectedPeriode]);

  const fetchPeriodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('periode_pemilihan')
      .select('id, jenjang, fakultas_id')
      .neq('status', 'ditutup');
    if (data) setPeriodes(data);
    setLoading(false);
  };

  const fetchKandidats = async (periodeId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('kandidat')
      .select('*')
      .eq('periode_id', periodeId)
      .order('nomor_urut', { ascending: true });
    if (data) setKandidats(data);
    setLoading(false);
  };

  const handleLevel1Click = (jenjang: string) => {
    if (jenjang === 'HMJ') {
      setViewLevel('HMJ_LIST');
    } else {
      const targetPeriode = periodes.find(p => p.jenjang === jenjang);
      if (targetPeriode) {
        setSelectedPeriode(targetPeriode);
        setViewLevel('CANDIDATE_LIST');
      } else {
        alert(`Periode pemilihan untuk ${jenjang} belum dibuat atau sedang tidak aktif di menu Periode Pemilihan!`);
      }
    }
  };

  const handleLevel2Click = (periode: Periode) => {
    setSelectedPeriode(periode);
    setViewLevel('CANDIDATE_LIST');
  };

  const handleBack = () => {
    if (viewLevel === 'HMJ_LIST') setViewLevel('ROOT');
    if (viewLevel === 'CANDIDATE_LIST') {
      if (selectedPeriode?.jenjang === 'HMJ') setViewLevel('HMJ_LIST');
      else setViewLevel('ROOT');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateKandidat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoFile || !selectedPeriode) {
      alert('Foto dan Periode harus diisi!');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const fileExt = fotoFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('foto-kandidat')
        .upload(filePath, fotoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('foto-kandidat')
        .getPublicUrl(filePath);

      const res = await fetch('/api/kandidat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode_id: selectedPeriode.id,
          nomor_urut: parseInt(nomorUrut),
          nama: nama,
          visi_misi: visiMisi,
          foto_url: publicUrl
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setIsModalOpen(false);
      setNama('');
      setNomorUrut('');
      setVisiMisi('');
      setFotoFile(null);
      setPreviewUrl('');
      fetchKandidats(selectedPeriode.id);
      
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper Filters
  const hmjPeriodes = periodes.filter(p => p.jenjang === 'HMJ');

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {viewLevel !== 'ROOT' && (
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900">Kelola Kandidat</h1>
          </div>
          
          {/* Breadcrumbs */}
          <div className="text-sm text-slate-500 mt-2 flex items-center gap-2 ml-[44px]">
            <span className={viewLevel === 'ROOT' ? 'text-primary-600 font-semibold' : ''}>Kategori</span>
            {viewLevel !== 'ROOT' && <ChevronRight size={14} />}
            
            {viewLevel === 'HMJ_LIST' && <span className="text-primary-600 font-semibold">Daftar Jurusan HMJ</span>}
            
            {viewLevel === 'CANDIDATE_LIST' && selectedPeriode?.jenjang === 'HMJ' && (
              <>
                <span>Daftar Jurusan HMJ</span>
                <ChevronRight size={14} />
                <span className="text-primary-600 font-semibold">{selectedPeriode.fakultas_id}</span>
              </>
            )}
            {viewLevel === 'CANDIDATE_LIST' && selectedPeriode?.jenjang !== 'HMJ' && (
              <span className="text-primary-600 font-semibold">{selectedPeriode?.jenjang}</span>
            )}
          </div>
        </div>

        {viewLevel === 'CANDIDATE_LIST' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="glass-button flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            <span>Tambah Kandidat</span>
          </button>
        )}
      </div>

      {loading && viewLevel === 'ROOT' ? (
        <div className="py-20 text-center text-slate-500">Memuat kategori...</div>
      ) : (
        <>
          {/* LEVEL 1: ROOT */}
          {viewLevel === 'ROOT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in mt-8">
              <button onClick={() => handleLevel1Click('BEM-F')} className="glass-panel p-8 text-left hover:border-primary-300 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">BEM Fakultas</h2>
                <p className="text-sm text-slate-500">Kelola kandidat Badan Eksekutif Mahasiswa tingkat Fakultas.</p>
              </button>
              
              <button onClick={() => handleLevel1Click('SEMA-F')} className="glass-panel p-8 text-left hover:border-primary-300 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">SEMA Fakultas</h2>
                <p className="text-sm text-slate-500">Kelola kandidat Senat Mahasiswa tingkat Fakultas.</p>
              </button>
              
              <button onClick={() => handleLevel1Click('HMJ')} className="glass-panel p-8 text-left hover:border-primary-300 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Himpunan Jurusan (HMJ)</h2>
                <p className="text-sm text-slate-500">Buka folder untuk melihat daftar jurusan yang tersedia.</p>
              </button>
            </div>
          )}

          {/* LEVEL 2: HMJ LIST */}
          {viewLevel === 'HMJ_LIST' && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Pilih Jurusan</h3>
              {hmjPeriodes.length === 0 ? (
                <div className="glass-panel py-12 text-center text-slate-500 border-dashed border-2">
                  Belum ada periode pemilihan HMJ yang dibuat atau aktif.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {hmjPeriodes.map(p => (
                    <button key={p.id} onClick={() => handleLevel2Click(p)} className="bg-white border border-slate-200 p-5 rounded-xl text-left hover:border-primary-500 hover:shadow-md transition-all group flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-1">JURUSAN</div>
                        <div className="font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">{p.fakultas_id}</div>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" size={20} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: CANDIDATES */}
          {viewLevel === 'CANDIDATE_LIST' && (
            <div className="animate-fade-in">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium">Memuat data kandidat...</p>
                </div>
              ) : kandidats.length === 0 ? (
                <div className="glass-panel py-20 text-center flex flex-col items-center justify-center border-dashed border-2 mt-4">
                  <User size={48} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">Belum Ada Kandidat</h3>
                  <p className="text-slate-500 text-sm max-w-sm mt-1 mb-4">Mulai tambahkan kandidat untuk pemilihan {selectedPeriode?.jenjang} {selectedPeriode?.fakultas_id}.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-primary-600 font-medium text-sm hover:underline">
                    + Tambah Kandidat Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                  {kandidats.map((k) => (
                    <div key={k.id} className="glass-panel overflow-hidden group hover:shadow-md hover:border-primary-200 transition-all">
                      <div className="h-48 w-full relative bg-slate-100 border-b border-slate-100">
                        {k.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={k.foto_url} alt={k.nama} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={64} /></div>
                        )}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 font-bold px-3 py-1 rounded-lg shadow-sm border border-slate-100">
                          #{k.nomor_urut}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{k.nama}</h3>
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          <span className="font-semibold text-slate-700">Visi & Misi:</span><br/>
                          {k.visi_misi}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tambah Kandidat Baru</h2>
                <p className="text-xs text-slate-500 mt-1">Untuk: {selectedPeriode?.jenjang} {selectedPeriode?.fakultas_id ? `- ${selectedPeriode.fakultas_id}` : ''}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateKandidat} className="p-6 overflow-y-auto flex-1 space-y-5">
              
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary-400 transition-colors"
                  onClick={() => document.getElementById('foto-upload')?.click()}
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-slate-400 group-hover:text-primary-500 mb-2" size={24} />
                      <span className="text-xs text-slate-500 font-medium">Unggah Foto</span>
                    </div>
                  )}
                  <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Urut</label>
                  <input 
                    type="number" min="1"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={nomorUrut}
                    onChange={(e) => setNomorUrut(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visi & Misi</label>
                  <textarea 
                    rows={5}
                    placeholder="Tuliskan visi dan misi kandidat secara detail..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    value={visiMisi}
                    onChange={(e) => setVisiMisi(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-100">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >Batal</button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="glass-button flex items-center justify-center gap-2 min-w-[140px] opacity-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Simpan Kandidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
