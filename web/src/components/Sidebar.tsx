"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, CheckSquare, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dasbor', href: '/' },
    { icon: Users, label: 'Registrasi Mahasiswa', href: '/registrasi' },
    { icon: CalendarDays, label: 'Periode Pemilihan', href: '/periode-pemilihan' },
    { icon: Users, label: 'Kandidat', href: '/kandidat' },
    { icon: CheckSquare, label: 'Verifikasi Suara', href: '/verifikasi-suara' },
    { icon: Settings, label: 'Pengaturan', href: '/pengaturan' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between overflow-hidden animate-fade-in z-20 h-screen sticky top-0">
      <div>
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">
            E-Voting Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">KPU Mahasiswa</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={index} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium">
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
