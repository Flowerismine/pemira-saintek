"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, UserCheck } from 'lucide-react';

function DetailContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'ALL';
  const router = useRouter();

  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/dpt')
      .then(res => res.json())
      .then(data => {
        setWhitelist(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filteredData = whitelist.filter(w => {
    // 1. Jurusan Filter
    if (filter !== 'ALL' && w.jurusan !== filter) return false;
    
    // 2. Search Text
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const nim = String(w.nim).toLowerCase();
      const nama = String(w.nama).toLowerCase();
      if (!nim.includes(q) && !nama.includes(q)) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Detail DPT: {filter === 'ALL' ? 'Semua Mahasiswa' : `Jurusan ${filter}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Daftar lengkap pemilih tetap berdasarkan filter yang dipilih.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
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
          <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
            Total: {filteredData.length} Mahasiswa
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
                <th className="px-6 py-4 font-medium">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Data tidak ditemukan.</td></tr>
              ) : (
                filteredData.map(w => (
                  <tr key={w.nim} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{w.nim}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{w.nama}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{w.fakultas || '-'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{w.jurusan || '-'}</td>
                    <td className="px-6 py-3">
                      {w.is_registered ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 w-max">
                          <UserCheck size={12} /> Terdaftar
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">Belum Login</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RegistrasiDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat antarmuka...</div>}>
      <DetailContent />
    </Suspense>
  );
}
