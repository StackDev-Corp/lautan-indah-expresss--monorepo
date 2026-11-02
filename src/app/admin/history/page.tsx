"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  Search,
  Truck,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  RefreshCw,
  Printer,
  Building2,
  Phone,
  PackageCheck,
  User,
} from "lucide-react";

interface HistoryItem {
  id: number;
  resi: string;
  reference_po: string | null;
  trip_code: string | null;
  sender_company: string;
  sender_contact: string;
  receiver_company: string;
  receiver_contact: string;
  receiver_phone: string;
  origin_city: string;
  destination_city: string;
  destination_address: string;
  service_type: string;
  status: string;
  actual_weight_kg: string;
  total_colli: number;
  total_cost: string;
  received_by: string | null;
  received_date: string | null;
  shipped_date: string;
  created_at: string;
  driver_name: string | null;
  driver_phone: string | null;
  plate_no: string | null;
  vehicle_name: string | null;
  departure_photo: string | null;
  arrival_driver_photo: string | null;
  arrival_confirm_photo: string | null;
  confirmation_notes: string | null;
}

export default function AdminHistoryPage() {
  // State filter periode: selectedYear & selectedMonth
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateBounds, setDateBounds] = useState<{ earliest: string | null; latest: string | null }>({
    earliest: null,
    latest: null,
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Selected Item for Detail Modal
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async (year: number, month: number) => {
    try {
      setLoading(true);
      const periodStr = `${year}-${String(month).padStart(2, "0")}`;
      const res = await fetch(`/api/admin/history?period=${encodeURIComponent(periodStr)}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.items || []);
        if (json.dateRange) {
          setDateBounds(json.dateRange);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Hitung batasan tahun & bulan awal berdasarkan data terlama di database
  const boundsInfo = useMemo(() => {
    const today = new Date();
    const curY = today.getFullYear();
    const curM = today.getMonth() + 1; // 1 - 12

    let startY = curY;
    let startM = curM;

    if (dateBounds.earliest) {
      const eDate = new Date(dateBounds.earliest);
      if (!isNaN(eDate.getTime())) {
        startY = eDate.getFullYear();
        startM = eDate.getMonth() + 1;
      }
    }

    // Daftar pilihan Tahun: dari startY sampai curY
    const yearOptions: number[] = [];
    for (let yr = curY; yr >= startY; yr--) {
      yearOptions.push(yr);
    }

    return { startY, startM, curY, curM, yearOptions };
  }, [dateBounds]);

  // Daftar nama bulan dalam Bahasa Indonesia
  const allMonths = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  // Pilihan Bulan yang aktif untuk tahun yang sedang dipilih
  // - Jika memilih tahun data paling awal (startY): bulan sebelum startM dinonaktifkan / tidak muncul
  // - Jika memilih tahun saat ini (curY): bulan setelah curM tidak muncul
  // - Jika memilih tahun di antaranya: full 12 bulan (Jan - Des)
  const availableMonths = useMemo(() => {
    const { startY, startM, curY, curM } = boundsInfo;

    return allMonths.filter((m) => {
      if (selectedYear === startY && m.value < startM) {
        return false;
      }
      if (selectedYear === curY && m.value > curM) {
        return false;
      }
      return true;
    });
  }, [selectedYear, boundsInfo]);

  // Jika pergantian tahun membuat selectedMonth berada di luar availableMonths, auto-adjust ke bulan valid
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    const { startY, startM, curY, curM } = boundsInfo;
    let validMonth = selectedMonth;

    if (newYear === startY && validMonth < startM) {
      validMonth = startM;
    }
    if (newYear === curY && validMonth > curM) {
      validMonth = curM;
    }
    setSelectedMonth(validMonth);
  };

  const handlePrevMonth = () => {
    const { startY, startM } = boundsInfo;
    if (selectedYear === startY && selectedMonth <= startM) return; // Sudah di titik paling awal

    if (selectedMonth > 1) {
      setSelectedMonth((prev) => prev - 1);
    } else {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    }
  };

  const handleNextMonth = () => {
    const { curY, curM } = boundsInfo;
    if (selectedYear === curY && selectedMonth >= curM) return; // Sudah di titik paling akhir

    if (selectedMonth < 12) {
      setSelectedMonth((prev) => prev + 1);
    } else {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    }
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    return (
      it.resi.toLowerCase().includes(q) ||
      it.receiver_company.toLowerCase().includes(q) ||
      it.sender_company.toLowerCase().includes(q) ||
      it.destination_city.toLowerCase().includes(q) ||
      (it.driver_name && it.driver_name.toLowerCase().includes(q)) ||
      (it.plate_no && it.plate_no.toLowerCase().includes(q)) ||
      (it.received_by && it.received_by.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Histori Pengiriman & Bukti Serah Terima (POD)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arsip lengkap seluruh resi yang berstatus terkirim resmi beserta foto bukti absen supir dan foto penerimaan.
          </p>
        </div>
        <button
          onClick={() => fetchHistory(selectedYear, selectedMonth)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Filter Bar: Periode Kalender (Bulan & Tahun Dinamis) & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Kalender Selector: Pilihan Bulan & Tahun */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              disabled={selectedYear === boundsInfo.startY && selectedMonth <= boundsInfo.startM}
              className="p-1.5 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-slate-600 transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              
              {/* Dropdown Bulan */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer py-1"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <span className="text-slate-300 font-medium">/</span>

              {/* Dropdown Tahun (Hanya dari tahun data terlama sampai tahun sekarang) */}
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-blue-700 focus:outline-none cursor-pointer py-1"
              >
                {boundsInfo.yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={selectedYear === boundsInfo.curY && selectedMonth >= boundsInfo.curM}
              className="p-1.5 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-slate-600 transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            ({filtered.length} Resi Terkirim)
          </span>
        </div>

        {/* Pencarian Keyword */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari resi, PT, kota, sopir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Tabel Data Histori */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Resi</th>
                <th className="py-3 px-4">Pengirim → Penerima</th>
                <th className="py-3 px-4">Diterima Oleh</th>
                <th className="py-3 px-4">Armada & Supir</th>
                <th className="py-3 px-4 text-center">Bukti Foto</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Memuat arsip histori pengiriman...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada arsip pengiriman terkirim pada periode ini.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nomor Resi */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-black text-slate-900 text-sm">
                        {it.resi}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                        ✓ Terkirim
                      </span>
                    </td>

                    {/* Rute & PT */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-extrabold text-slate-900 truncate">
                        {it.receiver_company}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{it.origin_city}</span>
                        <span>→</span>
                        <span className="font-bold text-blue-700">{it.destination_city}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        Dari: {it.sender_company}
                      </div>
                    </td>

                    {/* Penerima */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800">
                        {it.received_by || it.receiver_contact}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {it.received_date
                          ? new Date(it.received_date).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Telah diterima"}
                      </div>
                    </td>

                    {/* Armada & Supir */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{it.plate_no || "-"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {it.driver_name || "Sopir LIE"}
                      </div>
                    </td>

                    {/* Bukti Foto (Mini Thumbnail) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {it.departure_photo && (
                          <div
                            onClick={() => setSelectedItem(it)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-blue-500"
                            title="Foto Absen Berangkat"
                          >
                            <img src={it.departure_photo} alt="Absen" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {it.arrival_confirm_photo && (
                          <div
                            onClick={() => setSelectedItem(it)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-300 bg-emerald-50 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                            title="Foto Serah Terima"
                          >
                            <img src={it.arrival_confirm_photo} alt="Terima" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!it.departure_photo && !it.arrival_confirm_photo && (
                          <span className="text-[10px] text-slate-400 italic">Tanpa foto</span>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedItem(it)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL LENGKAP: BUKTI PENERIMAAN + ABSEN + DETAIL RESI        */}
      {/* ============================================================ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Rincian Bukti Serah Terima & Absen
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Resi: {selectedItem.resi}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Banner Sukses */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-sm text-emerald-950">
                      Telah Diterima Resmi
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Penerima: <strong>{selectedItem.received_by || selectedItem.receiver_contact}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Waktu Terima:{" "}
                    {selectedItem.received_date
                      ? new Date(selectedItem.received_date).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </p>
                </div>
                <Link
                  href={`/track/${selectedItem.resi}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-1 shadow-sm shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Tracking
                </Link>
              </div>

              {/* Rincian Surat Jalan & Muatan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Informasi Pengiriman:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PENGIRIM</span>
                    <span className="font-bold text-slate-900 block truncate">{selectedItem.sender_company}</span>
                    <span className="text-slate-500">{selectedItem.origin_city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PENERIMA</span>
                    <span className="font-bold text-slate-900 block truncate">{selectedItem.receiver_company}</span>
                    <span className="text-slate-500">{selectedItem.destination_city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ARMADA / SOPIR</span>
                    <span className="font-bold text-slate-900 block">{selectedItem.plate_no || "-"}</span>
                    <span className="text-slate-500">{selectedItem.driver_name || "Sopir"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-600">
                  <span>Total Muatan Kargo:</span>
                  <span className="font-bold text-slate-900">{selectedItem.total_colli} Koli • {selectedItem.actual_weight_kg} Kg</span>
                </div>
              </div>

              {/* Dokumentasi Foto Lengkap Lapangan */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Dokumentasi Foto Lapangan (Absen & Bukti Terima):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Absen Mulai Jalan */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">
                      1. Foto Absen Berangkat Supir
                    </span>
                    {selectedItem.departure_photo ? (
                      <a href={selectedItem.departure_photo} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={selectedItem.departure_photo}
                          alt="Foto Absen Berangkat"
                          className="w-full h-44 object-cover rounded-lg border border-slate-200 hover:opacity-90"
                        />
                      </a>
                    ) : (
                      <div className="h-44 rounded-lg bg-slate-200/60 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                        Tidak ada foto absen berangkat
                      </div>
                    )}
                  </div>

                  {/* Foto Serah Terima Fisik Barang */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">
                      2. Foto Bukti Serah Terima (Penerima)
                    </span>
                    {selectedItem.arrival_confirm_photo ? (
                      <a href={selectedItem.arrival_confirm_photo} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={selectedItem.arrival_confirm_photo}
                          alt="Foto Bukti Penerimaan"
                          className="w-full h-44 object-cover rounded-lg border border-slate-200 hover:opacity-90"
                        />
                      </a>
                    ) : (
                      <div className="h-44 rounded-lg bg-slate-200/60 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                        Tidak ada foto serah terima
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Catatan Konfirmasi Penerima */}
              {selectedItem.confirmation_notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <span className="font-bold block text-[11px] mb-1">Catatan Penerima:</span>
                  <p className="italic text-[11px]">&ldquo;{selectedItem.confirmation_notes}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
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
