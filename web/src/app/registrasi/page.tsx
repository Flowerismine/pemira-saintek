"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { CheckCircle, XCircle, Search, Upload, FileSpreadsheet, Users, UserCheck, Filter } from 'lucide-react';
import Papa from 'papaparse';

type TabType = 'dpt' | 'import' | 'kyc';

export default function RegistrasiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dpt');
  
  // Data States
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Import States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, failed: number} | null>(null);

  // Status Filter State
  const [regStatusFilter, setRegStatusFilter] = useState<'ALL' | 'REGISTERED' | 'UNREGISTERED'>('ALL');
  
  const router = useRouter();
  
  useEffect(() => {
    if (activeTab === 'dpt') fetchWhitelist();
  }, [activeTab]);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dpt');
      const data = await res.json();
      if (res.ok) {
        setWhitelist(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const processCsv = () => {
    if (!csvFile) return;
    setImportLoading(true);
    
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        
        // Map CSV rows to database columns (assuming CSV headers: NIM, Nama, Fakultas, Jurusan)
        const formattedData = rows.map(r => ({
          nim: r.NIM || r.nim,
          nama: r.Nama || r.nama,
          fakultas: r.Fakultas || r.fakultas || null,
          jurusan: r.Jurusan || r.jurusan || null,
          kelas: r.Kelas || r.kelas || null
        })).filter(r => r.nim && r.nama); // minimal require nim and nama

        if (formattedData.length === 0) {
          alert('Data kosong atau format kolom tidak sesuai (butuh header NIM dan Nama)');
          setImportLoading(false);
          return;
        }

        // Bulk insert to Supabase
        const { error, count } = await supabase
          .from('whitelist_mahasiswa')
          .insert(formattedData);

        if (error) {
          alert('Gagal mengimport sebagian atau seluruh data: ' + error.message);
        } else {
          setImportResult({ success: formattedData.length, failed: 0 });
          setCsvFile(null);
        }
        setImportLoading(false);
      },
      error: (error) => {
        alert('Gagal membaca file CSV: ' + error.message);
        setImportLoading(false);
      }
    });
  };

    const filteredWhitelist = whitelist.filter(w => {
      const nimStr = w.nim ? String(w.nim).toLowerCase() : '';
      const namaStr = w.nama ? String(w.nama).toLowerCase() : '';
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = nimStr.includes(searchStr) || namaStr.includes(searchStr);
      
      let matchesStatus = true;
      if (regStatusFilter === 'REGISTERED') matchesStatus = w.is_registered === true;
      if (regStatusFilter === 'UNREGISTERED') matchesStatus = w.is_registered === false || w.is_registered === null;
      
      return matchesSearch && matchesStatus;
    });

    const totalDpt = whitelist.length;
    const totalRegistered = whitelist.filter(w => w.is_registered).length;
    const demaPercent = totalDpt > 0 ? Math.round((totalRegistered / totalDpt) * 100) : 0;

    const hmjStats = whitelist.reduce((acc, curr) => {
      const jurusan = curr.jurusan || 'Tanpa Jurusan';
      if (!acc[jurusan]) acc[jurusan] = { total: 0, registered: 0 };
      acc[jurusan].total += 1;
      if (curr.is_registered) acc[jurusan].registered += 1;
      return acc;
    }, {} as Record<string, { total: number, registered: number }>);

    const handleCardClick = (filterValue: string) => {
      router.push(`/registrasi/detail?filter=${encodeURIComponent(filterValue)}`);
    };

    return (
      <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registrasi Mahasiswa</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola persetujuan akun dan Daftar Pemilih Tetap (DPT)</p>
      </div>

      {/* Dashboard Cards for DPT Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <div 
          onClick={() => handleCardClick('ALL')}
          className="glass-panel p-4 flex flex-col cursor-pointer transition-all hover:-translate-y-1 border-t-4 shadow-sm border-t-primary-500 hover:bg-slate-50"
        >
          <span className="text-xs font-bold text-slate-500 uppercase">DPT DEMA-F (Semua)</span>
          <span className="text-3xl font-black text-slate-800 mt-1">{totalRegistered} <span className="text-xl font-semibold text-slate-400">/ {totalDpt}</span></span>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full" style={{ width: `${demaPercent}%` }}></div>
          </div>
        </div>
        <div 
          onClick={() => handleCardClick('ALL')}
          className="glass-panel p-4 flex flex-col cursor-pointer transition-all hover:-translate-y-1 border-t-4 shadow-sm border-t-emerald-500 hover:bg-slate-50"
        >
          <span className="text-xs font-bold text-slate-500 uppercase">DPT SEMA-F (Semua)</span>
          <span className="text-3xl font-black text-slate-800 mt-1">{totalRegistered} <span className="text-xl font-semibold text-slate-400">/ {totalDpt}</span></span>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${demaPercent}%` }}></div>
          </div>
        </div>
        {Object.entries(hmjStats).map(([jur, stats], i) => {
          const pct = stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0;
          return (
            <div 
              key={jur} 
              onClick={() => handleCardClick(jur)}
              className={`glass-panel p-4 flex flex-col cursor-pointer transition-all hover:-translate-y-1 border-t-4 shadow-sm hover:bg-slate-50 ${i % 2 === 0 ? 'border-t-blue-500' : 'border-t-purple-500'}`}
            >
              <span className="text-xs font-bold text-slate-500 uppercase truncate" title={`DPT HMJ ${jur}`}>DPT HMJ {jur}</span>
              <span className="text-3xl font-black text-slate-800 mt-1">{stats.registered} <span className="text-xl font-semibold text-slate-400">/ {stats.total}</span></span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">

        <button 
          onClick={() => setActiveTab('dpt')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dpt' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={16} /> Daftar Pemilih (DPT)
        </button>
        <button 
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'import' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Upload size={16} /> Import Data
        </button>
      </div>

      {/* TAB 2: DPT */}
      {activeTab === 'dpt' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari NIM atau Nama..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-64"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                <Filter size={14} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                  value={regStatusFilter}
                  onChange={e => setRegStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="REGISTERED">Sudah Registrasi</option>
                  <option value="UNREGISTERED">Belum Login</option>
                </select>
              </div>
              <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">Total: {filteredWhitelist.length} Data</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">NIM</th>
                  <th className="px-6 py-4 font-medium">Nama Mahasiswa</th>
                  <th className="px-6 py-4 font-medium">Fakultas</th>
                  <th className="px-6 py-4 font-medium">Jurusan</th>
                  <th className="px-6 py-4 font-medium">Foto KTM</th>
                  <th className="px-6 py-4 font-medium">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
                ) : filteredWhitelist.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Data tidak ditemukan.</td></tr>
                ) : (
                  filteredWhitelist.slice(0, 100).map(w => ( // Limit 100 for UI performance
                    <tr key={w.nim} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">{w.nim}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{w.nama}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{w.fakultas || '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{w.jurusan || '-'}</td>
                      <td className="px-6 py-3 text-sm">
                        {w.foto_ktm_url ? (
                          <button 
                            onClick={() => setPreviewImage(w.foto_ktm_url)} 
                            className="text-primary-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <UserCheck size={14} /> Lihat KTM
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Belum Ada</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {w.is_registered ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Terdaftar</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">Belum Login</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredWhitelist.length > 100 && (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50">Menampilkan 100 data pertama. Gunakan pencarian untuk data spesifik.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT */}
      {activeTab === 'import' && (
        <div className="glass-panel p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
              <FileSpreadsheet size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Import Daftar Pemilih Tetap (DPT)</h2>
            <p className="text-slate-500 text-sm mt-1">Unggah file CSV yang berisi kolom: <strong className="text-slate-700">NIM, Nama, Fakultas, Jurusan</strong></p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-primary-400 transition-colors">
            <input type="file" accept=".csv" id="csv-upload" className="hidden" onChange={handleFileUpload} />
            
            {!csvFile ? (
              <div>
                <Upload className="mx-auto text-slate-400 mb-3" size={24} />
                <button onClick={() => document.getElementById('csv-upload')?.click()} className="text-primary-600 font-medium hover:underline">
                  Klik untuk memilih file CSV
                </button>
                <p className="text-xs text-slate-400 mt-2">atau drag & drop file ke area ini</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-700 font-medium break-all">{csvFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                <button onClick={() => setCsvFile(null)} className="text-red-500 text-sm font-medium mt-3 hover:underline">
                  Batal / Ganti File
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={processCsv} 
              disabled={!csvFile || importLoading}
              className="glass-button w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
            >
              {importLoading ? 'Memproses Data...' : 'Mulai Import Data'}
            </button>
          </div>

          {importResult && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-emerald-500 shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Import Berhasil!</h4>
                <p className="text-sm text-emerald-600 mt-0.5">
                  Berhasil menyimpan {importResult.success} data mahasiswa ke dalam sistem DPT.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Preview Gambar KTM */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Pratinjau Foto KTM</h3>
              <button 
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 bg-slate-100 flex justify-center">
              <img 
                src={previewImage} 
                alt="Foto KTM" 
                className="max-w-full max-h-[60vh] object-contain rounded shadow-sm border border-slate-200"
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
