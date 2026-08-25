"use client";

import { Bell, Search, LogOut, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingKYC, setPendingKYC] = useState(0);
  const [pendingVotes, setPendingVotes] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data && !data.error) {
          setPendingKYC(data.pendingKYC || 0);
          setPendingVotes(data.pendingVotes || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari dasbor admin?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const totalNotifications = pendingKYC + pendingVotes;

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-20 sticky top-0">
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

        {/* NOTIFICATION BELL */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <Bell size={20} />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Notifikasi</h3>
                {totalNotifications > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalNotifications} Baru
                  </span>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {totalNotifications === 0 ? (
                  <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                    <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                    <p className="text-sm">Yey! Tidak ada tugas atau antrian verifikasi saat ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {pendingKYC > 0 && (
                      <Link href="/verifikasi-dpt" onClick={() => setShowNotifications(false)} className="block p-4 hover:bg-primary-50 transition-colors group cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-sm">+{pendingKYC}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700">Verifikasi DPT Baru</p>
                            <p className="text-xs text-slate-500 mt-0.5">Ada {pendingKYC} mahasiswa baru yang mendaftar dan menunggu persetujuan KYC.</p>
                          </div>
                        </div>
                      </Link>
                    )}
                    
                    {pendingVotes > 0 && (
                      <Link href="/verifikasi-suara" onClick={() => setShowNotifications(false)} className="block p-4 hover:bg-primary-50 transition-colors group cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-sm">+{pendingVotes}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700">Verifikasi Suara Masuk</p>
                            <p className="text-xs text-slate-500 mt-0.5">Ada {pendingVotes} suara baru yang masuk dan perlu diverifikasi keabsahannya.</p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
