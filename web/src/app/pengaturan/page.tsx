"use client";

import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Key, Save } from 'lucide-react';

type Tab = 'keamanan' | 'notifikasi' | 'apikey';

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('keamanan');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Ambil semua pengaturan dari database
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSettings(data);
      })
      .catch(err => console.error("Gagal mengambil pengaturan:", err));
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) {
        const error = await res.json();
        alert('Gagal menyimpan ' + key + ': ' + error.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveFonnteToken = async () => {
    await saveSetting('fonnte_api_token', settings['fonnte_api_token'] || '');
    alert('Token Fonnte berhasil disimpan!');
  };

  const handleResetData = async () => {
    if (!confirm('PERINGATAN KERAS! Ini akan menghapus SEMUA SUARA dan mengembalikan status mahasiswa menjadi BELUM MEMILIH. Apakah Anda 100% yakin?')) return;
    if (!confirm('KONFIRMASI TERAKHIR: Aksi ini tidak dapat dibatalkan. Ketik "OKE" dalam pikiran Anda dan klik OK jika setuju.')) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        alert('Data pemilihan berhasil direset total!');
      } else {
        const error = await res.json();
        alert('Gagal reset: ' + error.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi keamanan dan preferensi aplikasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('keamanan')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-colors ${
              activeTab === 'keamanan' 
                ? 'bg-primary-50 text-primary-700 border-primary-100' 
                : 'text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <Shield size={18} /> Keamanan
          </button>
          <button 
            onClick={() => setActiveTab('notifikasi')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-colors ${
              activeTab === 'notifikasi' 
                ? 'bg-primary-50 text-primary-700 border-primary-100' 
                : 'text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <Bell size={18} /> Notifikasi
          </button>
          <button 
            onClick={() => setActiveTab('apikey')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-colors ${
              activeTab === 'apikey' 
                ? 'bg-primary-50 text-primary-700 border-primary-100' 
                : 'text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <Key size={18} /> API Keys
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 glass-panel p-6 animate-fade-in">
          
          {/* TAB: KEAMANAN */}
          {activeTab === 'keamanan' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Shield className="text-primary-600" /> Keamanan Kriptografi
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Secret Salt (Kunci Hash Chain)</label>
                  <div className="flex gap-3">
                    <input 
                      type="password" 
                      value="KPU_SAINTEK_SECRET_2026_DO_NOT_SHARE" 
                      disabled
                      className="flex-1 border border-slate-300 bg-slate-100 text-slate-500 rounded-lg px-4 py-2 text-sm font-mono outline-none"
                    />
                    <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors">
                      Ubah
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Kunci ini digunakan oleh mesin database untuk mengenkripsi rentetan suara. Mengubah kunci ini di tengah pemilihan dapat merusak integritas Hash Chain.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Durasi Kedaluwarsa OTP</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="number" 
                      value={settings['otp_expiry_minutes'] || '5'} 
                      onChange={(e) => handleSettingChange('otp_expiry_minutes', e.target.value)}
                      className="w-24 border border-slate-300 bg-white text-slate-700 rounded-lg px-4 py-2 text-sm text-center outline-none focus:border-primary-500"
                    />
                    <span className="text-sm text-slate-600 font-medium">Menit</span>
                    <button 
                      onClick={() => saveSetting('otp_expiry_minutes', settings['otp_expiry_minutes'] || '5')}
                      disabled={isSaving}
                      className="ml-4 px-3 py-1.5 text-xs font-bold bg-primary-50 text-primary-600 rounded-lg border border-primary-200 hover:bg-primary-100"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-amber-800 mb-1">Peringatan Zona Berbahaya</h3>
                    <p className="text-xs text-amber-700 mb-3">
                      Pengaturan lanjutan di bawah ini dapat menghapus seluruh data suara. Harap berhati-hati.
                    </p>
                    <button 
                      onClick={handleResetData}
                      disabled={isSaving}
                      className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Memproses...' : 'Reset Semua Data Pemilihan (Format)'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: NOTIFIKASI */}
          {activeTab === 'notifikasi' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Bell className="text-primary-600" /> Pengaturan Notifikasi WA
              </h2>
              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const newVal = settings['wa_notif_otp'] === 'false' ? 'true' : 'false';
                    handleSettingChange('wa_notif_otp', newVal);
                    saveSetting('wa_notif_otp', newVal);
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Notifikasi OTP Registrasi</h3>
                    <p className="text-xs text-slate-500 mt-1">Kirim pesan WhatsApp berisi 6 digit kode OTP saat pendaftaran.</p>
                  </div>
                  <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${settings['wa_notif_otp'] === 'false' ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings['wa_notif_otp'] === 'false' ? 'left-1' : 'left-7'}`}></span>
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const newVal = settings['wa_notif_bukti'] === 'false' ? 'true' : 'false';
                    handleSettingChange('wa_notif_bukti', newVal);
                    saveSetting('wa_notif_bukti', newVal);
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Bukti Coblos Digital</h3>
                    <p className="text-xs text-slate-500 mt-1">Kirim pesan WhatsApp berisi ucapan terima kasih dan nomor bukti sah setelah mencoblos.</p>
                  </div>
                  <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${settings['wa_notif_bukti'] === 'false' ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings['wa_notif_bukti'] === 'false' ? 'left-1' : 'left-7'}`}></span>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const newVal = settings['wa_notif_blast'] === 'true' ? 'false' : 'true';
                    handleSettingChange('wa_notif_blast', newVal);
                    saveSetting('wa_notif_blast', newVal);
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Pengumuman Massal (Blast)</h3>
                    <p className="text-xs text-slate-500 mt-1">Izinkan sistem mengirimkan pengingat untuk memilih kepada seluruh DPT yang belum mencoblos.</p>
                  </div>
                  <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${settings['wa_notif_blast'] === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings['wa_notif_blast'] === 'true' ? 'left-7' : 'left-1'}`}></span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: API KEYS */}
          {activeTab === 'apikey' && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Key className="text-primary-600" /> Integrasi Pihak Ketiga (API)
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Gateway Token (Fonnte/Watzap)</label>
                  <input 
                    type="password" 
                    value={settings['fonnte_api_token'] || ''}
                    onChange={(e) => handleSettingChange('fonnte_api_token', e.target.value)}
                    placeholder="Masukkan token Fonnte di sini..."
                    className="w-full border border-slate-300 bg-white text-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg px-4 py-2 text-sm font-mono outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">Token API untuk mengirimkan pesan bot WhatsApp secara otomatis.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supabase Project URL</label>
                  <input 
                    type="text" 
                    value="https://vdphlanneoyqnnmsvtrx.supabase.co" 
                    disabled
                    className="w-full border border-slate-300 bg-slate-100 text-slate-500 rounded-lg px-4 py-2 text-sm font-mono outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={saveFonnteToken}
                    disabled={isSaving}
                    className="glass-button flex items-center gap-2 text-sm"
                  >
                    <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan API'}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
