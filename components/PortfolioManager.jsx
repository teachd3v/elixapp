import React, { useEffect, useState } from 'react';
import { FolderHeart, Plus, Edit, Trash2, X, AlertCircle, Calendar, Award, Users, GraduationCap, User, Camera, Image as ImageIcon, Tag, Link as LinkIcon, Download } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/image';
import { downloadCV } from './CVDocument';
import { useDialog } from './DialogProvider';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

const CATEGORIES = [
  { value: 'PRESTASI',       label: 'Prestasi',       icon: Award,          tone: 'bg-amber-500/10 text-amber-600',
    dateLabel: 'Tanggal Prestasi',
    descPlaceholder: 'Ceritakan prestasi yang kamu raih — kompetisi, tingkat/skala, hasil yang dicapai.' },
  { value: 'ORGANISASI',     label: 'Organisasi',     icon: Users,          tone: 'bg-sky-500/10 text-sky-600',
    dateLabel: 'Periode',
    descPlaceholder: 'Ceritakan pengalaman apa saja yang kamu lakukan dalam organisasi tersebut — jabatan, kontribusi, program yang dijalankan.' },
  { value: 'PELATIHAN',      label: 'Pelatihan',      icon: GraduationCap,  tone: 'bg-emerald-500/10 text-emerald-600',
    dateLabel: 'Tanggal Pelatihan',
    descPlaceholder: 'Jelaskan pelatihan yang kamu ikuti — penyelenggara, materi utama, sertifikasi yang diperoleh.' },
  { value: 'KARYA_PERSONAL', label: 'Karya Personal', icon: User,           tone: 'bg-violet-500/10 text-violet-600',
    dateLabel: 'Tanggal Rilis Karya',
    descPlaceholder: 'Deskripsikan karyamu — jenis karya, tema, media, dan cerita di baliknya.' },
  { value: 'LAINNYA',        label: 'Lainnya',        icon: Tag,            tone: 'bg-slate-500/10 text-slate-600',
    dateLabel: 'Tanggal',
    descPlaceholder: 'Ceritakan aktivitas atau pencapaian ini secara singkat.' },
];
const CAT_META = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function fmtMonthYear(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function toDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
function toMonthInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 7); // YYYY-MM
}
function fmtPeriode(p) {
  const start = fmtMonthYear(p.date);
  if (p.isOngoing) return `${start} — Sekarang`;
  if (p.dateEnd)   return `${start} — ${fmtMonthYear(p.dateEnd)}`;
  return start;
}

// Awardee portfolio CRUD. Handles karya/prestasi/organisasi/pelatihan.
// Server enforces AWARDEE ownership; SUPERADMIN dapat lihat/hapus juga.
// `canCreate` diteruskan dari parent — true untuk awardee, false untuk viewer.
export default function PortfolioManager({ darkMode, dbUser, role, canCreate = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'PRESTASI', date: '', dateEnd: '', isOngoing: false, description: '', link: '', attachment: null });
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const { confirm } = useDialog();

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await fetchJson('/api/portfolios')); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', category: 'PRESTASI', date: '', dateEnd: '', isOngoing: false, description: '', link: '', attachment: null });
    setError(null);
    setFormOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    const isOrg = p.category === 'ORGANISASI';
    setForm({
      title: p.title, category: p.category,
      date: isOrg ? toMonthInput(p.date) : toDateInput(p.date),
      dateEnd: p.dateEnd ? (isOrg ? toMonthInput(p.dateEnd) : toDateInput(p.dateEnd)) : '',
      isOngoing: !!p.isOngoing,
      description: p.description || '',
      link: p.link || '',
      attachment: p.attachment || null,
    });
    setError(null);
    setFormOpen(true);
  };

  // When user switches category in the form, reset the date to the correct
  // input mode (month for Organisasi, day for others) so old value doesn't leak.
  const setCategory = (nextCat) => {
    setForm((f) => {
      const wasOrg = f.category === 'ORGANISASI';
      const isOrg  = nextCat === 'ORGANISASI';
      if (wasOrg === isOrg) return { ...f, category: nextCat };
      return { ...f, category: nextCat, date: '', dateEnd: '', isOngoing: false };
    });
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true); setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxDim: 1000, quality: 0.75 });
      setForm((f) => ({ ...f, attachment: dataUrl }));
    } catch (e) {
      setError(`Gagal memproses foto: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const isOrg = form.category === 'ORGANISASI';
    if (!form.title.trim() || !form.date) { setError(isOrg ? 'Judul dan periode awal wajib diisi.' : 'Judul dan tanggal wajib diisi.'); return; }
    if (isOrg && !form.isOngoing && !form.dateEnd) { setError('Periode akhir wajib diisi (atau centang "Sampai sekarang").'); return; }
    setSaving(true); setError(null);
    try {
      // Month input value "YYYY-MM" — normalize to "YYYY-MM-01" so it becomes a valid date.
      const normDate    = isOrg && form.date    ? `${form.date}-01`    : form.date;
      const normDateEnd = isOrg && form.dateEnd ? `${form.dateEnd}-01` : form.dateEnd;
      const payload = {
        title: form.title, category: form.category,
        date: normDate,
        dateEnd: isOrg && !form.isOngoing ? normDateEnd : null,
        isOngoing: isOrg ? form.isOngoing : false,
        description: form.description,
        link: form.link,
        attachment: form.attachment,
      };
      if (editing) {
        await fetchJson(`/api/portfolios/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson('/api/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    const isConfirmed = await confirm(`Hapus "${p.title}" dari portofolio?`);
    if (!isConfirmed) return;
    setBusyId(p.id);
    try {
      await fetchJson(`/api/portfolios/${p.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-6">
      <div className={`border rounded-3xl p-5 flex items-center justify-between gap-3 ${card}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 rounded-full bg-violet-500/10 text-violet-600"><FolderHeart className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-black">Portofolio</h3>
            <p className="text-xs text-slate-500 truncate">
              {loading ? 'Memuat...' : `${items.length} karya/prestasi tercatat`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canCreate && items.length > 0 && (
            <button onClick={async () => {
                setDownloadingCV(true);
                try { await downloadCV({ dbUser, items }); } catch (e) { setError('Gagal membuat CV: ' + e.message); }
                finally { setDownloadingCV(false); }
              }} disabled={downloadingCV}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-xs rounded-xl flex items-center gap-1 disabled:opacity-50">
              <Download className="w-4 h-4" /> {downloadingCV ? 'Menyiapkan...' : 'Unduh CV'}
            </button>
          )}
          {canCreate && !formOpen && (
            <button onClick={openNew}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-indigo-500/20">
              <Plus className="w-4 h-4" /> Tambah Karya
            </button>
          )}
        </div>
      </div>

      {error && !formOpen && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {formOpen && (
        <form onSubmit={submit} className={`border rounded-3xl p-5 space-y-4 ${card}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black">{editing ? 'Edit Karya' : 'Karya Baru'}</h4>
            <button type="button" onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Judul <span className="text-rose-500">*</span></label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Juara 1 LKTIN 2026" required maxLength={200} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Kategori <span className="text-rose-500">*</span></label>
            <select className={`${inputCls} cursor-pointer`} value={form.category} onChange={(e) => setCategory(e.target.value)} required>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {form.category === 'ORGANISASI' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Periode Awal <span className="text-rose-500">*</span></label>
                  <input type="month" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Periode Akhir {!form.isOngoing && <span className="text-rose-500">*</span>}
                  </label>
                  <input type="month" className={inputCls} value={form.dateEnd} onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
                    disabled={form.isOngoing} required={!form.isOngoing} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded accent-indigo-500"
                  checked={form.isOngoing}
                  onChange={(e) => setForm({ ...form, isOngoing: e.target.checked, dateEnd: e.target.checked ? '' : form.dateEnd })} />
                <span className="text-xs font-bold">Berjalan sampai sekarang</span>
              </label>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{CAT_META[form.category].dateLabel} <span className="text-rose-500">*</span></label>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Deskripsi</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={CAT_META[form.category].descPlaceholder} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Tautan (opsional)
            </label>
            <input type="url" className={inputCls} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="mis. https://youtube.com/@username atau https://drive.google.com/…" />
            <p className="text-[10px] text-slate-400 mt-1">Gunakan jika bukti tidak berupa foto — misal channel YouTube, portfolio online, atau Google Drive.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">Foto Bukti (sertifikat, dsb.)</label>
            {form.attachment ? (
              <div className="relative">
                <img src={form.attachment} alt="Lampiran" className="w-full max-h-56 object-contain rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <button type="button" onClick={() => setForm({ ...form, attachment: null })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <label className={`h-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-slate-700 hover:border-violet-500 bg-slate-800/40' : 'border-slate-300 hover:border-violet-400 bg-slate-50'}`}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])} disabled={processing} />
                {processing ? <p className="text-xs font-bold text-slate-500">Memproses...</p> : (
                  <>
                    <Camera className="w-6 h-6 text-slate-400" />
                    <p className="text-xs font-bold text-slate-500">Pilih Foto (opsional)</p>
                  </>
                )}
              </label>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={saving || processing}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50">
              {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah ke Portofolio')}
            </button>
            <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Batal</button>
          </div>
        </form>
      )}

      {!loading && items.length === 0 && (
        <div className={`border rounded-3xl p-10 text-center ${card}`}>
          <FolderHeart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold mb-1">Portofolio masih kosong</p>
          <p className="text-xs text-slate-500">{canCreate ? 'Klik "Tambah Karya" untuk mengunggah karya atau prestasi.' : 'Belum ada karya yang diunggah.'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((p) => {
          const meta = CAT_META[p.category] || CAT_META.LAINNYA;
          const Icon = meta.icon;
          const mine = role === 'awardee' || role === 'superadmin'; // owner atau superadmin
          return (
            <div key={p.id} className={`border rounded-3xl overflow-hidden ${card}`}>
              {p.attachment ? (
                <button type="button" onClick={() => setPreview({ src: p.attachment, alt: p.title })}
                  className="block w-full h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img src={p.attachment} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </button>
              ) : (
                <div className="h-24 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${meta.tone}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {p.category === 'ORGANISASI' ? fmtPeriode(p) : fmtDate(p.date)}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1 line-clamp-2">{p.title}</h4>
                {p.description && <p className="text-[11px] text-slate-500 line-clamp-3 mb-2">{p.description}</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-500 hover:text-sky-600 mb-2 truncate max-w-full">
                    <LinkIcon className="w-3 h-3 shrink-0" /> <span className="truncate">{p.link.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {p.awardeeName && role !== 'awardee' && (
                  <p className="text-[10px] text-slate-400 mb-2">oleh {p.awardeeName}</p>
                )}
                {(canCreate || role === 'superadmin') && mine && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {canCreate && (
                      <button onClick={() => openEdit(p)} disabled={busyId === p.id}
                        className="flex-1 px-3 py-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button onClick={() => remove(p)} disabled={busyId === p.id}
                      className="flex-1 px-3 py-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" /> {busyId === p.id ? '...' : 'Hapus'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview.src} alt={preview.alt} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
