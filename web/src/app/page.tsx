"use client";

import { useState, useEffect } from 'react';
import StatCard from '@/components/StatCard';
import { Users, CheckCircle, Clock, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const { stats, activity, chartData, candidateData } = data || {};
  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 relative overflow-hidden bg-white border border-slate-200">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Selamat Datang, Admin KPU! 👋</h1>
          <p className="text-slate-500 max-w-2xl">
            Pantau dan kelola seluruh aktivitas Pemira secara real-time. Pastikan semua jadwal dan data kandidat sudah diatur sebelum periode pemilihan dimulai.
          </p>
        </div>
        
        {/* Decorative elements - Subtle for light mode */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute right-32 bottom-0 w-48 h-48 bg-blue-50 rounded-full blur-2xl translate-y-1/3"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Mahasiswa Terdaftar" 
          value={stats?.totalDpt?.toString() || '0'} 
          icon={<Users size={24} />} 
          trend="Real-time" 
          trendUp={true} 
        />
        <StatCard 
          title="Suara Masuk" 
          value={stats?.totalSuara?.toString() || '0'} 
          icon={<CheckCircle size={24} />} 
          trend="Real-time" 
          trendUp={true} 
        />
        <StatCard 
          title="Antrian Verifikasi" 
          value={stats?.antrianVerifikasi?.toString() || '0'} 
          icon={<Clock size={24} />} 
          trend="Real-time" 
          trendUp={true} 
        />
        <StatCard 
          title="Status Server" 
          value={stats?.serverStatus || 'Optimal'} 
          icon={<Activity size={24} />} 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Grafik Partisipasi Pemilihan</h3>
            <div className="flex-1 w-full bg-slate-50 rounded-xl pt-4 pr-4 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Suara Masuk" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Total DPT" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Live Quick Count Candidates */}
          {candidateData && candidateData.length > 0 && (
            <div className="space-y-6">
              {candidateData.map((periode: any) => {
                if (!periode.kandidat || periode.kandidat.length === 0) return null;
                
                // Hitung total suara sah di periode ini untuk persentase
                const totalSuaraSah = periode.kandidat.reduce((sum: number, k: any) => sum + k.suara, 0);

                return (
                  <div key={periode.periode_id} className="glass-panel p-6 flex flex-col border-t-4 border-primary-500">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">Quick Count: {periode.jenjang}</h3>
                      <span className="bg-primary-50 text-primary-700 text-xs px-3 py-1 rounded-full font-bold">
                        {totalSuaraSah} Suara Sah
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {periode.kandidat.map((k: any) => {
                        const percentage = totalSuaraSah > 0 ? ((k.suara / totalSuaraSah) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={k.id} className="relative">
                            <div className="flex justify-between items-end mb-1">
                              <div>
                                <span className="text-xs font-bold text-slate-500">PASLON {k.nomor_urut}</span>
                                <p className="font-bold text-slate-800">{k.nama}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-black text-primary-600">{k.suara}</span>
                                <span className="text-sm text-slate-500 ml-1">suara ({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-primary-500 to-indigo-500 h-3 rounded-full transition-all duration-1000" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Aktivitas Terbaru</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {activity && activity.length > 0 ? activity.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${act.status_verifikasi === 'menunggu_verifikasi' ? 'bg-amber-100 text-amber-600' : act.status_verifikasi === 'terverifikasi' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {act.status_verifikasi === 'menunggu_verifikasi' ? <Clock size={14} /> : act.status_verifikasi === 'terverifikasi' ? <CheckCircle size={14} /> : <Activity size={14} />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 font-medium">
                      {act.status_verifikasi === 'menunggu_verifikasi' ? 'Suara Masuk (Menunggu)' : act.status_verifikasi === 'terverifikasi' ? 'Suara Sah Terverifikasi' : 'Suara Ditolak'}
                      <span className="text-xs text-primary-600 ml-1">({act.periode_pemilihan?.jenjang === 'HMJ' ? `HMJ ${act.periode_pemilihan?.fakultas_id}` : act.periode_pemilihan?.jenjang})</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{act.users?.nim} - {act.users?.nama} • {new Date(act.created_at).toLocaleTimeString('id-ID')}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center mt-10">Belum ada aktivitas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
