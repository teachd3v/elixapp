import React, { useEffect, useRef, useState } from 'react';
import { UserCheck, Save, Edit, AlertCircle, Sparkles, Camera, Trash2 } from 'lucide-react';
import { fileToDataUrl } from '../lib/image';
import { useDialog } from './DialogProvider';
import AvatarCropModal from './AvatarCropModal';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const detail = contentType.includes('application/json')
      ? (await res.json().catch(() => ({})))?.error
      : null;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const GENDERS = ['Laki-laki', 'Perempuan'];

// Real, DB-backed profile for an approved Awardee/Mentor. Shows a completion
// form when the profile is not yet filled, and a summary once saved. Replaces
// the mock prototype profile entirely — a real user never sees mock data.
export default function RealProfile({ darkMode, role, dbUser, setDbUser }) {
  const isMentor = role === 'mentor';
  const { confirm } = useDialog();
  const [wilayahList, setWilayahList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(!dbUser?.isProfileComplete);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cascading province → city dropdown data (bundled to public/api-wilayah/).
  // provinces = [{ id, name }]; cities = [{ id, name }] scoped to current provinceId.
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Avatar upload state (available in view mode via camera overlay button).
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [cropSrc, setCropSrc] = useState(null); // data URL of the picked file, feeds the crop modal
  const avatarInputRef = useRef(null);

  // Called when user picks a file — we DON'T upload yet, we open the crop
  // modal so they can zoom/pan into the round frame first.
  const onAvatarFilePicked = async (file) => {
    if (!file) return;
    setAvatarError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setCropSrc(dataUrl);
    } catch (e) {
      setAvatarError('Gagal membaca file: ' + e.message);
    }
  };

  // Called from AvatarCropModal after user finishes cropping. Posts the
  // already-cropped/compressed data URL — server UPDATE overwrites the previous
  // avatar (no old-blob orphan).
  const uploadCroppedAvatar = async (dataUrl) => {
    setAvatarBusy(true); setAvatarError(null);
    try {
      const res = await fetchJson('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      if (setDbUser) setDbUser(res.user);
      setCropSrc(null);
    } catch (e) {
      setAvatarError(e.message);
      // Leave the modal open so user can retry/cancel.
      throw e;
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    const isConfirmed = await confirm('Hapus foto profil? Nanti akan muncul ikon default.');
    if (!isConfirmed) return;
    setAvatarBusy(true); setAvatarError(null);
    try {
      const res = await fetchJson('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (setDbUser) setDbUser(res.user);
    } catch (e) {
      setAvatarError(e.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const [form, setForm] = useState({
    name: dbUser?.name || '',
    phone: dbUser?.phone || '',
    wilayahId: '',
    school: '', major: '', generation: '', gpa: '',
    gender: '', birthInfo: '', address: '', ktp: '', kk: '', province: '', city: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [wilayah, data, provs] = await Promise.all([
          fetchJson('/api/wilayah'),
          fetchJson('/api/profile'),
          fetchJson('/api-wilayah/provinces.json').catch(() => []),
        ]);
        if (!active) return;
        setWilayahList(wilayah);
        setProvinces(provs);
        setProfile(data.profile);
        // Prefill form from any existing profile.
        setForm((f) => ({
          ...f,
          name: data.user?.name || f.name,
          phone: data.user?.phone || '',
          wilayahId: data.profile?.wilayahId || '',
          school: data.profile?.school || '',
          major: data.profile?.major || '',
          generation: data.profile?.generation || '',
          gpa: data.profile?.gpa ?? '',
          gender: data.profile?.gender || '',
          birthInfo: data.profile?.birthInfo || '',
          address: data.profile?.address || '',
          ktp: data.profile?.ktp || '',
          kk: data.profile?.kk || '',
          province: data.profile?.province || '',
          city: data.profile?.city || '',
        }));
        // Show the form immediately if the profile isn't complete yet.
        setEditing(!dbUser?.isProfileComplete);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Cascade: whenever the selected province changes (or provinces load in),
  // fetch that province's kabupaten/kota list. Case-insensitive name match
  // handles pre-existing profile values that may differ in casing.
  useEffect(() => {
    if (!form.province || provinces.length === 0) { setCities([]); return; }
    const match = provinces.find((p) => p.name.toLowerCase() === form.province.toLowerCase());
    if (!match) { setCities([]); return; }
    let active = true;
    setLoadingCities(true);
    fetch(`/api-wilayah/regencies/${match.id}.json`)
      .then((res) => res.ok ? res.json() : [])
      .then((list) => { if (active) setCities(list); })
      .catch(() => { if (active) setCities([]); })
      .finally(() => { if (active) setLoadingCities(false); });
    return () => { active = false; };
  }, [form.province, provinces]);

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.wilayahId) { setError('Wilayah wajib dipilih.'); return; }
    setSaving(true);
    try {
      const payload = isMentor
        ? { name: form.name, phone: form.phone, wilayahId: form.wilayahId }
        : { ...form };
      const res = await fetchJson('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.user && setDbUser) setDbUser(res.user);
      const fresh = await fetchJson('/api/profile');
      setProfile(fresh.profile);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;
  const labelCls = 'text-xs font-bold text-slate-400 block mb-1';

  if (loading) {
    return (
      <div className={`border rounded-3xl p-8 text-center ${card}`}>
        <p className="text-sm opacity-60">Memuat profil...</p>
      </div>
    );
  }

  const wilayahName = wilayahList.find((w) => w.id === (profile?.wilayahId))?.name;

  // ---------- VIEW MODE (profile complete, not editing) ----------
  if (!editing) {
    const rows = isMentor
      ? [['Wilayah Binaan', wilayahName]]
      : [
          ['Wilayah', wilayahName],
          ['Sekolah', profile?.school],
          ['Jurusan', profile?.major],
          ['Angkatan', profile?.generation],
          ['GPA', profile?.gpa],
          ['Gender', profile?.gender],
          ['TTL', profile?.birthInfo],
          ['No. KTP', profile?.ktp],
          ['No. KK', profile?.kk],
          ['Provinsi', profile?.province],
          ['Kota', profile?.city],
          ['Alamat', profile?.address],
        ];

    return (
      <div className="space-y-6">
        <div className={`border rounded-3xl p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {dbUser?.avatarUrl
                    ? <img src={dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
                    : <UserCheck className="w-6 h-6 text-slate-400" />}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  title="Ganti foto profil"
                >
                  {avatarBusy ? <span className="text-[9px] font-bold">...</span> : <Camera className="w-5 h-5" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { onAvatarFilePicked(e.target.files?.[0]); e.target.value = ''; }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black truncate">{dbUser?.name}</h2>
                <p className="text-xs text-slate-500 truncate">{dbUser?.email} • {isMentor ? 'Mentor' : 'Awardee'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarBusy}
                    className="text-[10px] font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 disabled:opacity-40"
                  >
                    <Camera className="w-3 h-3" /> {dbUser?.avatarUrl ? 'Ganti foto' : 'Tambah foto'}
                  </button>
                  {dbUser?.avatarUrl && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={avatarBusy}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl flex items-center gap-2 font-bold text-xs transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
          {avatarError && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{avatarError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-400">{label}</span>
                <span className="text-xs font-semibold text-right">{value || <span className="text-slate-400 font-normal italic">—</span>}</span>
              </div>
            ))}
          </div>
        </div>

        {isMentor && (
        <div className={`border rounded-3xl p-5 flex items-center gap-3 ${darkMode ? 'bg-sky-500/5 border-sky-500/20 text-sky-300' : 'bg-sky-50 border-sky-100 text-sky-700'}`}>
          <Sparkles className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">
            Profilmu sudah tersimpan. Dashboard mentor dengan data aslimu sedang dibangun dan akan segera hadir di sini.
          </p>
        </div>
        )}

        {cropSrc && (
          <AvatarCropModal
            darkMode={darkMode}
            imageSrc={cropSrc}
            onClose={() => setCropSrc(null)}
            onCropped={uploadCroppedAvatar}
          />
        )}
      </div>
    );
  }

  // ---------- EDIT / SETUP MODE ----------
  return (
    <div className={`border rounded-3xl p-6 max-w-2xl mx-auto ${card}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500"><UserCheck className="w-5 h-5" /></div>
        <h2 className="text-lg font-black">{dbUser?.isProfileComplete ? 'Ubah Data Profil' : 'Lengkapi Profil'}</h2>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        {isMentor ? 'Pilih wilayah binaanmu untuk mengaktifkan akun mentor.' : 'Lengkapi data dirimu sebagai awardee.'}
      </p>

      {error && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Nama lengkap" />
          </div>
          <div>
            <label className={labelCls}>No. HP</label>
            <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="08xx" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Wilayah {isMentor ? 'Binaan' : ''} <span className="text-rose-500">*</span></label>
            <select className={`${inputCls} cursor-pointer`} value={form.wilayahId} onChange={set('wilayahId')} required>
              <option value="">— Pilih Wilayah —</option>
              {wilayahList.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {!isMentor && (
            <>
              <div>
                <label className={labelCls}>Sekolah</label>
                <input className={inputCls} value={form.school} onChange={set('school')} placeholder="Nama sekolah" />
              </div>
              <div>
                <label className={labelCls}>Jurusan</label>
                <input className={inputCls} value={form.major} onChange={set('major')} placeholder="IPA / IPS" />
              </div>
              <div>
                <label className={labelCls}>Angkatan</label>
                <input className={inputCls} value={form.generation} onChange={set('generation')} placeholder="mis. 5" />
              </div>
              <div>
                <label className={labelCls}>GPA / Rata-rata</label>
                <input className={inputCls} value={form.gpa} onChange={set('gpa')} placeholder="mis. 3.85" inputMode="decimal" />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select className={`${inputCls} cursor-pointer`} value={form.gender} onChange={set('gender')}>
                  <option value="">— Pilih —</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tempat, Tgl Lahir</label>
                <input className={inputCls} value={form.birthInfo} onChange={set('birthInfo')} placeholder="Kota, 1 Jan 2008" />
              </div>
              <div>
                <label className={labelCls}>No. KTP</label>
                <input className={inputCls} value={form.ktp} onChange={set('ktp')} placeholder="NIK" />
              </div>
              <div>
                <label className={labelCls}>No. KK</label>
                <input className={inputCls} value={form.kk} onChange={set('kk')} placeholder="No. Kartu Keluarga" />
              </div>
              <div>
                <label className={labelCls}>Provinsi</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, city: '' }))}
                >
                  <option value="">— Pilih Provinsi —</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Kota/Kabupaten</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.city}
                  onChange={set('city')}
                  disabled={!form.province || loadingCities}
                >
                  <option value="">
                    {!form.province ? '— Pilih provinsi dulu —' : loadingCities ? 'Memuat...' : '— Pilih Kota/Kabupaten —'}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Alamat</label>
                <input className={inputCls} value={form.address} onChange={set('address')} placeholder="Alamat lengkap" />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Profil</>}
          </button>
          {dbUser?.isProfileComplete && (
            <button type="button" onClick={() => setEditing(false)} className="px-5 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
