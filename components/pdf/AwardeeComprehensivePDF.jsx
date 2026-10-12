import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { s, pdfColors } from '../../lib/pdfStyles';
import { toElixIndex, elixCategory, blendedScore } from '../../lib/assessment';

const customStyles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 100,
    fontWeight: 700,
    color: '#64748b',
    fontSize: 8.5,
  },
  metaValue: {
    flex: 1,
    color: '#1e293b',
    fontSize: 8.5,
  },
  scoreHero: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scoreCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: 900,
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCol: {
    fontWeight: 700,
    fontSize: 8,
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
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
    padding: 10,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#b45309',
    marginBottom: 3,
  },
  categoryDesc: {
    fontSize: 8.5,
    color: '#78350f',
    lineHeight: 1.35,
  },
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
  },
});

export default function AwardeeComprehensivePDF({ awardee, dimensions = [] }) {
  if (!awardee) return null;

  const user = awardee.user || {};
  const wilayah = awardee.wilayah?.name || '—';
  const hasSA = !!awardee.hasFilledSA;
  const hasMA = !!awardee.hasFilledMA;
  const rawFinal = blendedScore(awardee.saScore || 0, awardee.maScore || 0, hasSA, hasMA);
  const elix = awardee.elix != null ? awardee.elix : ((hasSA || hasMA) ? toElixIndex(rawFinal) : 0);
  const category = awardee.category || elixCategory(elix);

  const saResponses = awardee.saResponses || {};
  const maResponses = awardee.maResponses || {};
  const saDim = awardee.saDimensionScores || {};
  const maDim = awardee.maDimensionScores || {};

  const history = awardee.history || [];

  return (
    <Document title={`Laporan_ELIX_${(user.name || 'Awardee').replace(/[^a-zA-Z0-9]/g, '_')}`}>
      {/* PAGE 1: Ringkasan Profil & Evaluasi Dimensi */}
      <Page size="A4" style={customStyles.page}>
        {/* Header Dokumen */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 10, marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 900, color: '#1e3a8a' }}>PORTAL EXLEAD</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 1 }}>YES GREAT EDUNESIA · LEADERSHIP INDEX (ELIX)</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Laporan Evaluasi Individu</Text>
            <Text style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 2 }}>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
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
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Jurusan:</Text>
                <Text style={customStyles.metaValue}>{awardee.major || '—'}</Text>
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
                <Text style={customStyles.metaLabel}>Angkatan / IPK:</Text>
                <Text style={customStyles.metaValue}>{awardee.generation || '—'} · IPK: {awardee.gpa || '—'}</Text>
              </View>
              <View style={customStyles.metaRow}>
                <Text style={customStyles.metaLabel}>Status Form:</Text>
                <Text style={customStyles.metaValue}>SA: {hasSA ? 'Sudah Diisi' : 'Belum'} · MA: {hasMA ? 'Sudah Dinilai' : 'Belum'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Kartu Skor Utama */}
        <View style={customStyles.scoreHero}>
          <View style={[customStyles.scoreCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Indeks Akhir ELIX</Text>
            <Text style={[customStyles.scoreNumber, { color: '#15803d' }]}>{elix ? Number(elix).toFixed(1) : '—'}</Text>
            <Text style={{ fontSize: 7.5, color: '#166534', marginTop: 2 }}>Skala 0 - 100</Text>
          </View>
          <View style={[customStyles.scoreCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Self Assessment (40%)</Text>
            <Text style={[customStyles.scoreNumber, { color: '#2563eb' }]}>{hasSA ? ((awardee.saScore || 0) * 25).toFixed(1) : '—'}</Text>
            <Text style={{ fontSize: 7.5, color: '#1e40af', marginTop: 2 }}>Rata-rata: {hasSA ? (awardee.saScore || 0).toFixed(2) : '—'} / 4.00</Text>
          </View>
          <View style={[customStyles.scoreCard, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#3730a3', textTransform: 'uppercase' }}>Mentor Assessment (60%)</Text>
            <Text style={[customStyles.scoreNumber, { color: '#4f46e5' }]}>{hasMA ? ((awardee.maScore || 0) * 25).toFixed(1) : '—'}</Text>
            <Text style={{ fontSize: 7.5, color: '#3730a3', marginTop: 2 }}>Rata-rata: {hasMA ? (awardee.maScore || 0).toFixed(2) : '—'} / 4.00</Text>
          </View>
          <View style={[customStyles.scoreCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>Kategori</Text>
            <Text style={{ fontSize: 11, fontWeight: 900, color: '#7e22ce', textAlign: 'center', marginTop: 4 }}>{category}</Text>
          </View>
        </View>

        {/* Deskripsi Kategori */}
        <View style={customStyles.categoryBox}>
          <Text style={customStyles.categoryTitle}>Kategori: {category}</Text>
          <Text style={customStyles.categoryDesc}>
            {category === 'Excellent Leader' && "Awardee menunjukkan keunggulan dan konsistensi pada seluruh dimensi pengembangan. Memiliki kesiapan akademik yang tinggi dan berorientasi pada prestasi, menginternalisasi nilai-nilai Islam sebagai landasan perilaku dan pengambilan keputusan, serta mampu menginisiasi aksi-aksi yang berdampak nyata."}
            {category === 'Growing Leader' && "Awardee menunjukkan kompetensi yang cukup matang pada sebagian besar dimensi. Memiliki kesiapan akademik yang baik, menunjukkan karakter Islami secara konsisten, mampu mengelola potensi diri secara efektif, serta aktif berkontribusi dalam lingkungan sosial."}
            {category === 'Developing Leader' && "Awardee mulai menunjukkan perkembangan positif pada kelima dimensi, seperti motivasi belajar yang meningkat dan perilaku Islami yang mulai terbentuk. Namun, implementasi kompetensi masih memerlukan arahan dan pendampingan berkala."}
            {category === 'Emerging Leader' && "Awardee masih berada pada tahap awal pengembangan diri dan memerlukan penguatan karakter, stimulasi berkelanjutan, serta bimbingan intensif untuk mengembangkan potensi kepemimpinannya."}
          </Text>
        </View>

        {/* Tabel Sebaran Dimensi */}
        <Text style={customStyles.sectionTitle}>1. Rekapitulasi Skor per Dimensi</Text>
        <View style={customStyles.table}>
          <View style={customStyles.tableHeader}>
            <Text style={[customStyles.tableHeaderCol, { flex: 3 }]}>Dimensi Penilaian</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1, textAlign: 'center' }]}>Bobot</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor SA (1-4)</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor MA (1-4)</Text>
            <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'right' }]}>Indeks Dimensi</Text>
          </View>
          {dimensions.map((d, idx) => {
            const saVal = saDim[d.id] ?? 0;
            const maVal = maDim[d.id] ?? 0;
            const dimRaw = blendedScore(saVal, maVal, hasSA, hasMA);
            const dimElix = toElixIndex(dimRaw);
            const isAlt = idx % 2 === 1;

            return (
              <View key={d.id} style={[customStyles.tableRow, isAlt ? customStyles.tableRowAlt : {}]}>
                <View style={{ flex: 3 }}>
                  <Text style={{ fontWeight: 700, fontSize: 8.5 }}>{d.name}</Text>
                </View>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 8 }}>{d.weight ? `${d.weight}%` : '—'}</Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8.5, color: '#1d4ed8' }}>{hasSA ? saVal.toFixed(2) : '—'}</Text>
                <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8.5, color: '#4338ca' }}>{hasMA ? maVal.toFixed(2) : '—'}</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 900, fontSize: 9, color: '#0f172a' }}>{dimElix.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>

        {/* Riwayat Siklus jika ada */}
        {history.length > 0 && (
          <>
            <Text style={customStyles.sectionTitle}>2. Tren Perkembangan Antar Siklus</Text>
            <View style={customStyles.table}>
              <View style={customStyles.tableHeader}>
                <Text style={[customStyles.tableHeaderCol, { flex: 3 }]}>Nama Siklus / Periode</Text>
                <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor SA</Text>
                <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'center' }]}>Skor MA</Text>
                <Text style={[customStyles.tableHeaderCol, { flex: 1.5, textAlign: 'right' }]}>Indeks ELIX</Text>
              </View>
              {history.map((h, i) => (
                <View key={h.id || i} style={[customStyles.tableRow, i % 2 === 1 ? customStyles.tableRowAlt : {}]}>
                  <Text style={{ flex: 3, fontWeight: 700, fontSize: 8.5 }}>{h.period?.name || 'Siklus'}</Text>
                  <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8.5 }}>{h.saScore ? (h.saScore * 25).toFixed(0) : '—'}</Text>
                  <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 8.5 }}>{h.maScore ? (h.maScore * 25).toFixed(0) : '—'}</Text>
                  <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 900, fontSize: 9, color: '#1e3a8a' }}>{h.elix != null ? h.elix.toFixed(1) : '—'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={customStyles.footer}>
          <Text>Laporan Resmi Evaluasi Kepemimpinan ELIX · Halaman 1</Text>
          <Text>Portal EXLEAD</Text>
        </View>
      </Page>

      {/* PAGE 2+: Rincian Butir Penilaian per Pertanyaan */}
      <Page size="A4" style={customStyles.page}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>2. Rincian Penilaian per Butir Pertanyaan</Text>
          <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>Perbandingan nilai Self Assessment (Awardee) dan Mentor Assessment (Mentor) skala 1 - 4.</Text>
        </View>

        {dimensions.map((dim) => {
          const stmts = dim.statements || [];
          if (stmts.length === 0) return null;

          return (
            <View key={dim.id} style={{ marginBottom: 12 }} wrap={false}>
              <View style={{ backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, marginBottom: 4 }}>
                <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#1e293b' }}>Dimensi: {dim.name}</Text>
              </View>

              <View style={customStyles.table}>
                <View style={customStyles.tableHeader}>
                  <Text style={[customStyles.tableHeaderCol, { width: 35 }]}>Kode</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 80 }]}>Aspek</Text>
                  <Text style={[customStyles.tableHeaderCol, { flex: 1 }]}>Indikator / Pernyataan</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 42, textAlign: 'center' }]}>Skor SA</Text>
                  <Text style={[customStyles.tableHeaderCol, { width: 42, textAlign: 'center' }]}>Skor MA</Text>
                </View>
                {stmts.map((stmt, sIdx) => {
                  const valSA = saResponses[stmt.id] != null ? saResponses[stmt.id] : '—';
                  const valMA = maResponses[stmt.id] != null ? maResponses[stmt.id] : '—';
                  const isAlt = sIdx % 2 === 1;

                  return (
                    <View key={stmt.id} style={[customStyles.tableRow, isAlt ? customStyles.tableRowAlt : {}]}>
                      <Text style={{ width: 35, fontWeight: 700, fontSize: 8, color: '#64748b' }}>{stmt.code || `Q${sIdx+1}`}</Text>
                      <Text style={{ width: 80, fontSize: 8, color: '#334155', fontWeight: 500 }}>{stmt.aspect || '—'}</Text>
                      <Text style={{ flex: 1, fontSize: 8, color: '#1e293b', lineHeight: 1.25 }}>{stmt.textAwardee || stmt.textMentor || '—'}</Text>
                      <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[customStyles.badge, customStyles.badgeSA]}>{valSA}</Text>
                      </View>
                      <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
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
          <Text>Laporan Resmi Evaluasi Kepemimpinan ELIX · Rincian Butir</Text>
          <Text>Portal EXLEAD</Text>
        </View>
      </Page>
    </Document>
  );
}
