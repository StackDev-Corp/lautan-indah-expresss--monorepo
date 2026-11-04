"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
} from "lucide-react";

interface DriverItem {
  id: number;
  name: string;
  username: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form Tambah Driver
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal & Form Edit Driver (Bisa edit Nama, Username, Password, No Telp, Status Aktif)
  const [editingDriver, setEditingDriver] = useState<DriverItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [showEditPass, setShowEditPass] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          username: formUsername,
          password: formPassword,
          phone: formPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan driver");
      }

      setSuccessMessage("Akun driver berhasil dibuat!");
      setFormName("");
      setFormUsername("");
      setFormPassword("");
      setFormPhone("");
      setShowModal(false);
      fetchDrivers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan sistem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (driver: DriverItem) => {
    setEditingDriver(driver);
    setEditName(driver.name);
    setEditUsername(driver.username);
    setEditPhone(driver.phone === "-" ? "" : driver.phone);
    setEditPassword("");
    setEditIsActive(driver.is_active);
    setShowEditPass(false);
    setEditError(null);
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    setEditError(null);
    setEditSubmitting(true);

    try {
      const payload: Record<string, any> = {
        driverId: editingDriver.id,
        name: editName,
        username: editUsername,
        phone: editPhone,
        isActive: editIsActive,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch("/api/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data sopir");
      }

      setSuccessMessage(`Data sopir '${editName}' berhasil diperbarui!`);
      setEditingDriver(null);
      fetchDrivers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError("Terjadi kesalahan saat menyimpan perubahan");
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Manajemen Kurir & Sopir
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data akun sopir armada untuk login aplikasi driver mobile, reset kata sandi, ubah username, dan kelola nomor kontak.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Sopir Baru</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama sopir, username, atau telepon..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filtered.length} Sopir Terdaftar</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama Sopir</th>
                <th className="px-5 py-3.5">Username Login</th>
                <th className="px-5 py-3.5">No. Telepon / WA</th>
                <th className="px-5 py-3.5">Status Akun</th>
                <th className="px-5 py-3.5">Tanggal Terdaftar</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Memuat data sopir...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada data sopir ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {d.name.slice(0, 2).toUpperCase()}
                        </div>
                        {d.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                      @{d.username}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {d.phone || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-medium">
                      {String(d.created_at).slice(0, 10)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-bold text-xs transition border border-slate-200 shadow-xs cursor-pointer"
                        title="Edit data sopir & reset password"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit / Reset</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Sopir Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Akun Sopir / Kurir
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Sopir *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Bambang Wijaya"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Misal: driver1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="081298765432"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit & Reset Akun Sopir */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Edit & Reset Akun Sopir
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ID #{editingDriver.id} • Dibuat pada {String(editingDriver.created_at).slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDriver} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Sopir *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama sopir"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                <div className="relative">
                  <span className="text-slate-400 absolute left-3 top-2 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ubah jika sopir lupa username lamanya atau ingin mengganti username login.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Kata Sandi Baru (Opsional)</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPass ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    className="w-full px-3 pr-9 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-700 leading-tight">
                  Ketik kata sandi baru jika sopir lupa password login ke aplikasi. Minimal 4 karakter.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keaktifan Akun</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === true}
                      onChange={() => setEditIsActive(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-emerald-700">Aktif (Bisa Login & Bawa Tugas)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === false}
                      onChange={() => setEditIsActive(false)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-red-600">Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
