// Generates a "pageless" digital CV PDF that combines the awardee's real
// profile (from /api/profile) and portfolio (from /api/portfolios).
//
// @react-pdf/renderer is ~1.5 MB gzipped — we ONLY import it lazily from
// downloadCV() so the main app bundle stays lean. The component below is a
// factory function returning the tree once the module is loaded.

const CAT_LABEL = {
  PRESTASI: 'Prestasi',
  ORGANISASI: 'Organisasi',
  PELATIHAN: 'Pelatihan',
  KARYA_PERSONAL: 'Karya Personal',
  LAINNYA: 'Lainnya',
};
// Order groups roughly by "impact on a CV". Pelatihan below Karya, Lainnya last.
const CAT_ORDER = ['PRESTASI', 'ORGANISASI', 'PELATIHAN', 'KARYA_PERSONAL', 'LAINNYA'];

function fmtDay(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function fmtMonth(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function fmtPeriode(p) {
  const start = fmtMonth(p.date);
  if (p.isOngoing) return `${start} — Sekarang`;
  if (p.dateEnd)   return `${start} — ${fmtMonth(p.dateEnd)}`;
  return start;
}

// Kick off download of the CV. Fetches fresh profile + portfolio from the API
// (so it always reflects the latest data), builds the PDF, saves as a file.
export async function downloadCV({ dbUser, items }) {
  const [rpdf, profileRes, portfoliosRes] = await Promise.all([
    import('@react-pdf/renderer'),
    fetch('/api/profile'),
    // We could reuse the passed-in `items`, but re-fetching guarantees consistency.
    fetch('/api/portfolios'),
  ]);
  if (!profileRes.ok) throw new Error('Gagal memuat data profil');
  const { user, profile } = await profileRes.json();
  const portfolios = portfoliosRes.ok ? await portfoliosRes.json() : items;

  const doc = buildCVDocument(rpdf, { user: user || dbUser, profile, portfolios });
  const blob = await rpdf.pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (user?.name || dbUser?.name || 'Awardee').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  a.download = `CV-${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Palette & typography — kept in one place so tweaks are trivial.
const COLOR = {
  primary: '#4f46e5', // indigo-600
  accent:  '#f59e0b', // amber-500
  ink:     '#0f172a', // slate-900
  muted:   '#64748b', // slate-500
  hairline:'#e2e8f0', // slate-200
  bgSoft:  '#f8fafc', // slate-50
  cat: {
    PRESTASI:       '#f59e0b',
    ORGANISASI:     '#0284c7',
    PELATIHAN:      '#059669',
    KARYA_PERSONAL: '#7c3aed',
    LAINNYA:        '#64748b',
  },
};

function buildCVDocument(rpdf, { user, profile, portfolios }) {
  const { Document, Page, Text, View, Image, Link, StyleSheet } = rpdf;

  // "Pageless" here = one long custom page height rather than multi A4.
  // We estimate: header (~160) + info section (~180) + each item (~100)
  // + section titles (~40 each) — with generous padding, no page break.
  const groups = CAT_ORDER
    .map((cat) => [cat, (portfolios || []).filter((p) => p.category === cat)])
    .filter(([, list]) => list.length > 0);
  const totalItems = groups.reduce((s, [, list]) => s + list.length, 0);
  const pageHeight = Math.max(842 /* A4 */, 260 + 180 + groups.length * 44 + totalItems * 120 + 80);
  const pageSize = [595, pageHeight]; // A4 width, custom height for pageless feel

  const styles = StyleSheet.create({
    page: { paddingHorizontal: 40, paddingVertical: 36, backgroundColor: '#ffffff', fontSize: 10, color: COLOR.ink, fontFamily: 'Helvetica' },

    // Hero
    heroBand: { backgroundColor: COLOR.primary, marginHorizontal: -40, marginTop: -36, paddingHorizontal: 40, paddingVertical: 24, marginBottom: 20 },
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ffffff22', overflow: 'hidden', marginRight: 18 },
    nameBig: { color: '#ffffff', fontSize: 22, fontWeight: 700 },
    subtitle: { color: '#e0e7ff', fontSize: 10, marginTop: 3 },
    chips: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
    chip: { backgroundColor: '#ffffff22', color: '#ffffff', fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6, marginBottom: 4 },

    // Grid info
    infoCard: { border: `1pt solid ${COLOR.hairline}`, borderRadius: 8, padding: 14, marginBottom: 18 },
    infoTitle: { fontSize: 8, color: COLOR.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    infoCell: { width: '50%', marginBottom: 6, paddingRight: 8 },
    infoLabel: { fontSize: 8, color: COLOR.muted, marginBottom: 2 },
    infoValue: { fontSize: 10, color: COLOR.ink, fontWeight: 600 },

    // ELIX callout
    elixRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1pt solid ${COLOR.hairline}` },
    elixBig: { fontSize: 26, fontWeight: 700, color: COLOR.primary, marginRight: 10 },
    elixMeta: { fontSize: 9, color: COLOR.muted },

    // Section
    section: { marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: 700, color: COLOR.ink, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    sectionRule: { height: 2, backgroundColor: COLOR.primary, width: 30, marginBottom: 10 },

    // Item
    item: { borderLeft: `2pt solid ${COLOR.hairline}`, paddingLeft: 12, marginBottom: 12 },
    itemTitle: { fontSize: 11, fontWeight: 700, color: COLOR.ink, marginBottom: 2 },
    itemMeta: { fontSize: 8, color: COLOR.muted, marginBottom: 4 },
    itemDesc: { fontSize: 9, color: '#334155', lineHeight: 1.4 },
    itemLink: { fontSize: 9, color: COLOR.primary, marginTop: 4, textDecoration: 'underline' },
    catDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },

    footer: { marginTop: 20, paddingTop: 12, borderTop: `1pt solid ${COLOR.hairline}`, fontSize: 8, color: COLOR.muted, textAlign: 'center' },
  });

  const infoCells = [
    profile?.wilayah?.name && ['Wilayah Binaan', profile.wilayah.name],
    profile?.school       && ['Sekolah',        profile.school],
    profile?.major        && ['Jurusan',        profile.major],
    profile?.generation   && ['Angkatan',       profile.generation],
    profile?.gpa != null  && ['GPA / Nilai',    String(profile.gpa)],
    profile?.gender       && ['Gender',         profile.gender],
    profile?.birthInfo    && ['TTL',            profile.birthInfo],
    (profile?.province || profile?.city) && ['Domisili', [profile?.city, profile?.province].filter(Boolean).join(', ')],
    profile?.address      && ['Alamat',         profile.address],
  ].filter(Boolean);

  const hasSA = profile?.hasFilledSA;
  const hasMA = profile?.hasFilledMA;
  const saScore = profile?.saScore || 0;
  const maScore = profile?.maScore || 0;
  const blended = hasSA && hasMA ? 0.4 * saScore + 0.6 * maScore : (hasSA ? saScore : (hasMA ? maScore : 0));
  const elixIndex = (hasSA || hasMA) ? Math.round((blended / 4) * 100) : null;
  const elixCategory = elixIndex == null ? null
    : elixIndex >= 86 ? 'Excellent Leader'
    : elixIndex >= 66 ? 'Growing Leader'
    : elixIndex >= 46 ? 'Developing Leader'
    : 'Emerging Leader';

  const chips = [
    profile?.wilayah?.name && `Wilayah ${profile.wilayah.name}`,
    profile?.school,
    profile?.generation && `Angkatan ${profile.generation}`,
    elixCategory,
  ].filter(Boolean);

  return (
    <Document title={`CV — ${user?.name || 'Awardee'}`} author={user?.name || 'Elix'}>
      <Page size={pageSize} style={styles.page}>
        {/* Hero */}
        <View style={styles.heroBand}>
          <View style={styles.heroRow}>
            {user?.avatarUrl ? (
              <View style={styles.avatar}><Image src={user.avatarUrl} style={{ width: 72, height: 72 }} /></View>
            ) : (
              <View style={styles.avatar} />
            )}
            <View>
              <Text style={styles.nameBig}>{user?.name || '—'}</Text>
              <Text style={styles.subtitle}>{[user?.email, user?.phone].filter(Boolean).join(' • ')}</Text>
              {chips.length > 0 && (
                <View style={styles.chips}>
                  {chips.map((c, i) => <Text key={i} style={styles.chip}>{c}</Text>)}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Profile info + ELIX */}
        {(infoCells.length > 0 || elixIndex != null) && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Profil Awardee</Text>
            {infoCells.length > 0 && (
              <View style={styles.infoGrid}>
                {infoCells.map(([label, value]) => (
                  <View key={label} style={styles.infoCell}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
            {elixIndex != null && (
              <View style={styles.elixRow}>
                <Text style={styles.elixBig}>{elixIndex}</Text>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: COLOR.ink }}>ELIX Index — {elixCategory}</Text>
                  <Text style={styles.elixMeta}>
                    SA {hasSA ? saScore.toFixed(2) : '—'} · MA {hasMA ? maScore.toFixed(2) : '—'} · skala 0-100
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Portfolio sections */}
        {groups.length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.itemMeta}>Belum ada portofolio yang tercatat.</Text>
          </View>
        ) : (
          groups.map(([cat, list]) => (
            <View key={cat} style={styles.section} wrap>
              <Text style={styles.sectionTitle}>{CAT_LABEL[cat]}</Text>
              <View style={[styles.sectionRule, { backgroundColor: COLOR.cat[cat] || COLOR.primary }]} />
              {list.map((p) => (
                <View key={p.id} style={[styles.item, { borderLeftColor: COLOR.cat[cat] || COLOR.primary }]}>
                  <Text style={styles.itemTitle}>{p.title}</Text>
                  <Text style={styles.itemMeta}>{cat === 'ORGANISASI' ? fmtPeriode(p) : fmtDay(p.date)}</Text>
                  {p.description && <Text style={styles.itemDesc}>{p.description}</Text>}
                  {p.link && <Link src={p.link} style={styles.itemLink}>{p.link}</Link>}
                </View>
              ))}
            </View>
          ))
        )}

        <Text style={styles.footer}>Dibuat otomatis oleh Elix — {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </Page>
    </Document>
  );
}
