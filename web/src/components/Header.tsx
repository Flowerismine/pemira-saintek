"use client";

import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari dasbor admin?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Ringkasan Sistem</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari data..." 
            className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all w-64"
          />
        </div>

        <button 
          onClick={() => alert('Tidak ada notifikasi sistem terbaru saat ini.')}
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 pl-6 border-l border-slate-200 cursor-pointer group"
          title="Klik untuk Keluar"
        >
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 group-hover:text-red-600 transition-colors">Admin KPU</p>
            <p className="text-xs text-slate-500 group-hover:text-red-400 transition-colors">Keluar (Logout)</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-red-50 group-hover:text-red-500 group-hover:border-red-200 transition-colors">
            <LogOut size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
