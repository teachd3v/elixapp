import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toElixIndex, elixCategory, blendedScore } from '../../lib/assessment';

const customStyles = StyleSheet.create({
  page: {
    padding: 34,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#1e293b',
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    width: 95,
    fontWeight: 700,
    color: '#64748b',
    fontSize: 8,
  },
  metaValue: {
    flex: 1,
    color: '#1e293b',
    fontSize: 8,
  },
  scoreHero: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  scoreCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 900,
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableHeaderCol: {
    fontWeight: 700,
    fontSize: 7.5,
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  badge: {
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 3.5,
    fontSize: 7.5,
    fontWeight: 700,
    textAlign: 'center',
  },
  badgeSA: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  badgeMA: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  },
  categoryBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#b45309',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 8,
    color: '#78350f',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
});

function formatDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

const CATEGORY_DESCRIPTIONS = {
  'Excellent Leader': "Awardee menunjukkan keunggulan dan konsistensi pada seluruh dimensi pengembangan. Memiliki kesiapan akademik yang tinggi dan berorientasi pada prestasi, menginternalisasi nilai-nilai Islam sebagai landasan perilaku, serta mampu menginisiasi dan memimpin aksi-aksi yang berdampak positif dan berkelanjutan.",
  'Growing Leader': "Awardee menunjukkan kompetensi yang cukup matang pada sebagian besar dimensi. Memiliki kesiapan akademik yang baik, menunjukkan karakter Islami secara konsisten, mampu mengelola potensi diri secara efektif, serta aktif berkontribusi dalam lingkungan sosial.",
  'Developing Leader': "Awardee mulai menunjukkan perkembangan positif pada kelima dimensi, seperti motivasi belajar yang meningkat dan perilaku Islami yang mulai terbentuk. Namun, implementasi masih memerlukan arahan dan pembinaan berkala.",
  'Emerging Leader': "Awardee masih berada pada tahap awal pengembangan diri dan belum menunjukkan kompetensi yang diharapkan pada sebagian besar dimensi. Memerlukan pendampingan intensif, penguatan karakter, dan stimulasi berkelanjutan.",
};

// Render satu bab lengkap (Ringkasan Dimensi + Rincian Butir) murni untuk 1 siklus
function CycleReportPages({ cycle, awardee, dimensions = [] }) {
  const user = awardee.user || {};
  const wilayah = awardee.wilayah?.name || '—';
  const periodName = cycle.period?.name || 'Siklus';
  const isLive = !!cycle.isLive;
  const hasSA = !!cycle.hasFilledSA;
  const hasMA = !!cycle.hasFilledMA;
  const saScore = cycle.saScore || 0;
  const maScore = cycle.maScore || 0;
  const saDim = cycle.saDimensionScores || {};
  const maDim = cycle.maDimensionScores || {};
  const saResponses = cycle.saResponses || {};
  const maResponses = cycle.maResponses || {};
  const rawFinal = blendedScore(saScore, maScore, hasSA, hasMA);
  const elix = cycle.elix != null ? cycle.elix : ((hasSA || hasMA) ? toElixIndex(rawFinal) : null);
  const category = cycle.category || (elix != null ? elixCategory(elix) : 'Belum Ada Kategori');

  const startDateStr = formatDate(cycle.period?.startDate);
  const endDateStr = formatDate(cycle.period?.endDate);
  const dateRange = (startDateStr && endDateStr) ? `${startDateStr} - ${endDateStr}` : '—';
  const saDate = formatDate(cycle.saSubmittedAt);
  const maDate = formatDate(cycle.maSubmittedAt);

  return (
    <React.Fragment key={cycle.id || cycle.periodId || periodName}>
      {/* HALAMAN 1 SIKLUS: Ringkasan & Skor 5 Dimensi Siklus Terkait */}
      <Page size="A4" style={customStyles.page}>
        {/* Header Dokumen */}
        <View style={customStyles.headerBox}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: 900, color: '#1e3a8a' }}>PORTAL EXLEAD</Text>
            <Text style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', marginTop: 1 }}>
              YES GREAT EDUNESIA · LEADERSHIP INDEX (ELIX)
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>
              Laporan Evaluasi · Siklus: {periodName}
            </Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>
              {isLive ? 'Siklus Aktif Saat Ini' : 'Arsip Riwayat Siklus'} · Cetak: {new Date().toLocaleDateString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Profil & Metadata Siklus */}
        <View style={customStyles.metaBox}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Nama Awardee:</Text>
                <Text style={[customStyles.metaValue, { fontWeight: 700 }]}>{user.name || '—'}</Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Wilayah Binaan:</Text>
                <Text style={customStyles.metaValue}>{wilayah}</Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Institusi / Jurusan:</Text>
                <Text style={customStyles.metaValue}>
                  {awardee.university || awardee.school || '—'} {awardee.major ? `· ${awardee.major}` : ''}
                </Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Siklus Penilaian:</Text>
                <Text style={[customStyles.metaValue, { fontWeight: 700, color: '#2563eb' }]}>
                  {periodName} {isLive ? '(Aktif)' : '(Riwayat)'}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Email / No. HP:</Text>
                <Text style={customStyles.metaValue}>{user.email || '—'} · {user.phone || '—'}</Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Rentang Waktu:</Text>
                <Text style={customStyles.metaValue}>{dateRange}</Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Status Form SA:</Text>
                <Text style={[customStyles.metaValue, { color: hasSA ? '#1d4ed8' : '#e11d48', fontWeight: 700 }]}>
                  {hasSA ? `Sudah Diisi ${saDate ? `(${saDate})` : ''}` : 'Belum Diisi'}
                </Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Status Form MA:</Text>
                <Text style={[customStyles.metaValue, { color: hasMA ? '#4338ca' : '#d97706', fontWeight: 700 }]}>
                  {hasMA ? `Sudah Dinilai ${maDate ? `(${maDate})` : ''}` : 'Belum Dinilai'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Kartu Skor Hero Siklus Ini */}
        <View style={customStyles.scoreHero}>
          <View style={[customStyles.scoreCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Indeks ELIX ({periodName})
            </Text>
            <Text style={[customStyles.scoreNumber, { color: '#15803d' }]}>
              {elix != null ? Number(elix).toFixed(1) : '—'}
            </Text>
            <Text style={{ fontSize: 7, color: '#166534', marginTop: 1 }}>Skala 0 - 100</Text>
          </View>

          <View style={[customStyles.scoreCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
              Self Assessment (40%)
            </Text>
            <Text style={[customStyles.scoreNumber, { color: '#2563eb' }]}>
              {hasSA ? ((saScore || 0) * 25).toFixed(1) : '—'}
            </Text>
            <Text style={{ fontSize: 7, color: '#1e40af', marginTop: 1 }}>
              Rata-rata: {hasSA ? Number(saScore).toFixed(2) : '—'} / 4.00
            </Text>
          </View>

          <View style={[customStyles.scoreCard, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#3730a3', textTransform: 'uppercase' }}>
              Mentor Assessment (60%)
            </Text>
            <Text style={[customStyles.scoreNumber, { color: '#4f46e5' }]}>
              {hasMA ? ((maScore || 0) * 25).toFixed(1) : '—'}
            </Text>
            <Text style={{ fontSize: 7, color: '#3730a3', marginTop: 1 }}>
              Rata-rata: {hasMA ? Number(maScore).toFixed(2) : '—'} / 4.00
            </Text>
          </View>

          <View style={[customStyles.scoreCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>
              Kategori Siklus
            </Text>
            <Text style={{ fontSize: 10, fontWeight: 900, color: '#7e22ce', textAlign: 'center', marginTop: 3 }}>
              {category}
            </Text>
          </View>
        </View>

        {/* Deskripsi Kategori Siklus Ini */}
        <View style={customStyles.categoryBox}>
          <Text style={customStyles.categoryTitle}>Kategori Kepemimpinan ({periodName}): {category}</Text>
          <Text style={customStyles.categoryDesc}>
            {CATEGORY_DESCRIPTIONS[category] || "Evaluasi kepemimpinan pada siklus ini memberikan gambaran kesiapan dan perkembangan kompetensi awardee."}
          </Text>
        </View>

        {/* Tabel Rekapitulasi Skor Dimensi Siklus Ini */}
        <Text style={customStyles.sectionTitle}>1. Rekapitulasi Skor per Dimensi · Siklus: {periodName}</Text>
        <View style={customStyles.table}>
          <View style={customStyles.tableHeader}>
            <Text style={[customStyles.tableHeaderCol, { flex: 3 }]}>Dimensi Penilaian</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1, textAlign: 'center' }]}>Bobot</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor SA (1-4)</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor MA (1-4)</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'right' }]}>Indeks Dimensi</Text>
          </View>
          {dimensions.map((d, idx) => {
            const saVal = hasSA && saDim[d.id] != null ? saDim[d.id] : null;
            const maVal = hasMA && maDim[d.id] != null ? maDim[d.id] : null;
            let dimElix = null;
            if (saVal != null && maVal != null) {
              dimElix = toElixIndex(0.4 * saVal + 0.6 * maVal);
            } else if (saVal != null) {
              dimElix = toElixIndex(saVal);
            } else if (maVal != null) {
              dimElix = toElixIndex(maVal);
            }
            const isAlt = idx % 2 === 1;

            return (
              <View key={d.id} style={[customStyles.tableRow, isAlt ? customStyles.tableRowAlt : {}]}>
                <View style={{ flex: 3 }}>
                  <Text style={{ fontWeight: 700, fontSize: 8 }}>{d.name}</Text>
                </View>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 7.5 }}>
                  {d.weight ? `${d.weight}%` : '—'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8, color: '#1d4ed8' }}>
                  {saVal != null ? saVal.toFixed(2) : '—'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8, color: '#4338ca' }}>
                  {maVal != null ? maVal.toFixed(2) : '—'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 900, fontSize: 8.5, color: '#0f172a' }}>
                  {dimElix != null ? dimElix.toFixed(1) : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={customStyles.footer}>
          <Text>Laporan Resmi Evaluasi Kepemimpinan ELIX · Siklus: {periodName}</Text>
          <Text>Portal EXLEAD</Text>
        </View>
      </Page>

      {/* HALAMAN 2 SIKLUS: Rincian Butir Pertanyaan Siklus Terkait */}
      <Page size="A4" style={customStyles.page}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 6, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            2. Rincian Penilaian per Butir Pertanyaan · Siklus: {periodName}
          </Text>
          <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 2 }}>
            Data murni perbandingan penilaian Self Assessment (Awardee) dan Mentor Assessment (Mentor) pada siklus {periodName} (Skala 1 - 4).
          </Text>
        </View>

        {dimensions.map((dim) => {
          const stmts = dim.statements || [];
          if (stmts.length === 0) return null;

          return (
            <View key={dim.id} style={{ marginBottom: 10 }} wrap={false}>
              <View style={{ backgroundColor: '#f1f5f9', paddingVertical: 3.5, paddingHorizontal: 6, borderRadius: 4, marginBottom: 3 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>Dimensi: {dim.name}</Text>
              </View>

              <View style={customStyles.table}>
                <View style={customStyles.tableHeader}>
                  <Text style={[customStyles.tableHeaderCol, { width: 32 }]}>Kode</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 75 }]}>Aspek</Text>
                  <Text style={[customStyles.tableHeaderCol, { flex: 1 }]}>Indikator / Pernyataan</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 40, textAlign: 'center' }]}>Skor SA</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 40, textAlign: 'center' }]}>Skor MA</Text>
                </View>
                {stmts.map((stmt, sIdx) => {
                  const valSA = saResponses[stmt.id] != null ? saResponses[stmt.id] : '—';
                  const valMA = maResponses[stmt.id] != null ? maResponses[stmt.id] : '—';
                  const isAlt = sIdx % 2 === 1;

                  return (
                    <View key={stmt.id} style={[customStyles.tableRow, isAlt ? customStyles.tableRowAlt : {}]}>
                      <Text style={{ width: 32, fontWeight: 700, fontSize: 7.5, color: '#64748b' }}>
                        {stmt.code || `Q${sIdx+1}`}
                      </Text>
                      <Text style={{ width: 75, fontSize: 7.5, color: '#334155', fontWeight: 500 }}>
                        {stmt.aspect || '—'}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 7.5, color: '#1e293b', lineHeight: 1.25 }}>
                        {stmt.textAwardee || stmt.textMentor || '—'}
                      </Text>
                      <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[customStyles.badge, customStyles.badgeSA]}>{valSA}</Text>
                      </View>
                      <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[customStyles.badge, customStyles.badgeMA]}>{valMA}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={customStyles.footer}>
          <Text>Laporan Resmi Evaluasi Kepemimpinan ELIX · Rincian Butir ({periodName})</Text>
          <Text>Portal EXLEAD</Text>
        </View>
      </Page>
    </React.Fragment>
  );
}

// Komponen Utama Dokumen PDF
export default function AwardeeComprehensivePDF({ awardee, dimensions = [], selectedCycle = null }) {
  if (!awardee) return null;

  const user = awardee.user || {};
  const wilayah = awardee.wilayah?.name || '—';
  const allCycles = awardee.cycles || awardee.history || [];

  // Tentukan siklus mana yang dicetak:
  let targetCycles = [];
  if (selectedCycle && selectedCycle !== 'ALL') {
    const cycleObj = typeof selectedCycle === 'object'
      ? selectedCycle
      : allCycles.find(c => c.periodId === selectedCycle || c.id === selectedCycle);
    if (cycleObj) {
      targetCycles = [cycleObj];
    }
  }

  // Jika tidak memilih siklus spesifik atau memilih 'ALL', cetak seluruh siklus secara berurutan
  if (targetCycles.length === 0) {
    targetCycles = allCycles.length > 0 ? allCycles : [{
      period: { name: 'Siklus Evaluasi', isActive: true },
      isLive: true,
      hasFilledSA: awardee.hasFilledSA,
      saScore: awardee.saScore,
      saResponses: awardee.saResponses,
      saDimensionScores: awardee.saDimensionScores,
      saSubmittedAt: awardee.saSubmittedAt,
      hasFilledMA: awardee.hasFilledMA,
      maScore: awardee.maScore,
      maResponses: awardee.maResponses,
      maDimensionScores: awardee.maDimensionScores,
      maSubmittedAt: awardee.maSubmittedAt,
      elix: awardee.elix,
      category: awardee.category
    }];
  }

  const isMultiCycleReport = targetCycles.length > 1;

  return (
    <Document title={`Laporan_ELIX_${(user.name || 'Awardee').replace(/[^a-zA-Z0-9]/g, '_')}`}>
      {/* Jika laporan mencakup lebih dari 1 siklus, tampilkan halaman ringkasan eksekutif komparasi terlebih dahulu */}
      {isMultiCycleReport && (
        <Page size="A4" style={customStyles.page}>
          <View style={customStyles.headerBox}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 900, color: '#1e3a8a' }}>PORTAL EXLEAD</Text>
              <Text style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 1 }}>
                YES GREAT EDUNESIA · LEADERSHIP INDEX (ELIX)
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                Ringkasan Komparasi Seluruh Siklus
              </Text>
              <Text style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 2 }}>
                Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>

          {/* Profil Awardee */}
          <View style={customStyles.metaBox}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>Nama Lengkap:</Text>
                  <Text style={[customStyles.metaValue, { fontWeight: 700 }]}>{user.name || '—'}</Text>
                </View>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>Wilayah Binaan:</Text>
                  <Text style={customStyles.metaValue}>{wilayah}</Text>
                </View>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>Sekolah / Univ:</Text>
                  <Text style={customStyles.metaValue}>{awardee.university || awardee.school || '—'}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>Email Akun:</Text>
                  <Text style={customStyles.metaValue}>{user.email || '—'}</Text>
                </View>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>No. Handphone:</Text>
                  <Text style={customStyles.metaValue}>{user.phone || '—'}</Text>
                </View>
                <View style={customStyles.metaRow}>
                  <Text style={customStyles.metaLabel}>Total Siklus:</Text>
                  <Text style={[customStyles.metaValue, { fontWeight: 700 }]}>{targetCycles.length} Siklus Terdata</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tabel Komparasi Antar Siklus */}
          <Text style={customStyles.sectionTitle}>Tabel Perbandingan Skor Antar Siklus</Text>
          <View style={customStyles.table}>
            <View style={customStyles.tableHeader}>
              <Text style={[customStyles.tableHeaderCol, { flex: 2.5 }]}>Nama Siklus</Text>
              <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
              <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor SA</Text>
              <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor MA</Text>
              <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'right' }]}>Indeks ELIX</Text>
              <Text style={[customStyles.tableHeaderCol, { flex: 2, textAlign: 'right' }]}>Kategori</Text>
            </View>
            {targetCycles.map((c, i) => (
              <View key={c.id || i} style={[customStyles.tableRow, i % 2 === 1 ? customStyles.tableRowAlt : {}]}>
                <Text style={{ flex: 2.5, fontWeight: 700, fontSize: 8 }}>
                  {c.period?.name || `Siklus ${i + 1}`}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 7.5, color: c.isLive ? '#059669' : '#64748b' }}>
                  {c.isLive ? 'Aktif' : 'Riwayat'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8, color: '#1d4ed8' }}>
                  {c.hasFilledSA ? Number(c.saScore).toFixed(2) : '—'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8, color: '#4338ca' }}>
                  {c.hasFilledMA ? Number(c.maScore).toFixed(2) : '—'}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 900, fontSize: 8.5, color: '#0f172a' }}>
                  {c.elix != null ? Number(c.elix).toFixed(1) : '—'}
                </Text>
                <Text style={{ flex: 2, textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#b45309' }}>
                  {c.category || '—'}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 8, color: '#166534', lineHeight: 1.35 }}>
              Catatan: Setiap siklus disajikan secara mandiri dan terpisah pada halaman-halaman berikutnya untuk memastikan data evaluasi murni sesuai instrumen pengisian masing-masing periode.
            </Text>
          </View>

          <View style={customStyles.footer}>
            <Text>Laporan Resmi Evaluasi Kepemimpinan ELIX · Ringkasan Komparasi</Text>
            <Text>Portal EXLEAD</Text>
          </View>
        </Page>
      )}

      {/* Render bab murni untuk setiap siklus */}
      {targetCycles.map(c => (
        <CycleReportPages
          key={c.id || c.periodId}
          cycle={c}
          awardee={awardee}
          dimensions={dimensions}
        />
      ))}
    </Document>
  );
}
