import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { s, pdfColors } from '../../lib/pdfStyles';
import { toElixIndex, elixCategory, blendedScore } from '../../lib/assessment';

export default function AwardeePDF({ profile, dbUser, dimensions, activePeriodName, dynamicTrend = [] }) {
  const saScore = profile?.saScore ?? 0;
  const hasSA = !!profile?.hasFilledSA;
  const maScore = profile?.maScore ?? 0;
  const hasMA = !!profile?.hasFilledMA;
  
  const rawFinal = blendedScore(saScore, maScore, hasSA, hasMA);
  const elixIndex = toElixIndex(rawFinal);
  const category = elixCategory(elixIndex);

  const saDim = profile?.saDimensionScores || {};
  const maDim = profile?.maDimensionScores || {};

  return (
    <Document>
      <Page size={[595.28, 2000]} style={s.page}>
        {/* Header */}
        <View style={[s.row, s.justifyBetween, s.borderB, s.pb6, s.mb8]}>
          <View>
            <Text style={[s.text3xl, s.fontBlack, s.textSlate800]}>Laporan <Text style={s.textIndigo600}>ELIX</Text></Text>
            <Text style={[s.textSm, s.fontBold, s.textSlate400, s.uppercase, s.mt1]}>Evaluasi Individu</Text>
          </View>
          <View style={s.textRight}>
            <Text style={[s.textXs, s.fontBold, s.textSlate500]}>Siklus</Text>
            <Text style={[s.textSm, s.fontBlack, s.textSlate800]}>{activePeriodName || 'Aktif'}</Text>
            <Text style={[s.textXs, s.textSlate400, s.mt1]}>Dicetak: {new Date().toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* Profil */}
        <View style={[s.row, s.bgSlate50, s.p6, s.rounded2xl, s.borderAll, s.mb8, s.itemsCenter]}>
          <View style={[{ width: 60, height: 60, borderRadius: 30, backgroundColor: pdfColors.indigo100, alignItems: 'center', justifyContent: 'center', marginRight: 16, overflow: 'hidden' }]}>
            {dbUser?.avatarUrl ? (
              <Image src={dbUser.avatarUrl} style={[{ width: '100%', height: '100%', objectFit: 'cover' }]} />
            ) : (
              <Text style={[s.text2xl, s.fontBlack, s.textIndigo600]}>{dbUser?.name?.charAt(0) || 'A'}</Text>
            )}
          </View>
          <View style={s.flex1}>
            <Text style={[s.text2xl, s.fontBlack, s.textSlate800]}>{dbUser?.name}</Text>
            <View style={[s.row, s.mt2]}>
              <View>
                <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase]}>Wilayah</Text>
                <Text style={[s.textSm, s.fontBold, s.textSlate700]}>{profile?.wilayah?.name || '—'}</Text>
              </View>
              <View style={s.line} />
              <View>
                <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase]}>Mentor</Text>
                <Text style={[s.textSm, s.fontBold, s.textSlate700]}>{profile?.wilayah?.mentorProfile?.user?.name || '—'}</Text>
              </View>
              <View style={s.line} />
              <View>
                <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase]}>Universitas</Text>
                <Text style={[s.textSm, s.fontBold, s.textSlate700]}>{profile?.university || profile?.school || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Skor Utama */}
        <View style={[s.row, s.justifyBetween, s.mb8]}>
          <View style={[s.bgIndigo50, s.p8, s.rounded2xl, s.textCenter, { flex: 1, marginRight: 8 }]}>
            <Text style={[s.textXs, s.fontBold, s.textIndigo400, s.uppercase, s.mb2]}>Indeks ELIX Akhir</Text>
            <Text style={[s.text6xl, s.fontBlack, s.textIndigo600]}>{elixIndex.toFixed(1)}</Text>
          </View>
          <View style={[s.bgBlue50, s.p8, s.rounded2xl, s.itemsCenter, s.justifyCenter, { flex: 1, marginLeft: 8 }]}>
            <Text style={[s.textXs, s.fontBold, s.textBlue400, s.uppercase, s.mb2]}>Kategori Kepemimpinan</Text>
            <View style={[{ backgroundColor: pdfColors.blue500, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 4 }]}>
               <Text style={[s.textXl, s.fontBlack, s.textWhite]}>{category}</Text>
            </View>
          </View>
        </View>

        {/* Rincian Dimensi */}
        <View>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Rincian Skor per Dimensi</Text>
          
          <View style={s.table}>
            {/* Table Header */}
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ flex: 2 }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Dimensi Penilaian</Text></View>
              <View style={[{ flex: 1 }, s.textCenter]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Self (40%)</Text></View>
              <View style={[{ flex: 1 }, s.textCenter]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Mentor (60%)</Text></View>
              <View style={[{ flex: 1 }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Skor Akhir</Text></View>
            </View>
            
            {/* Table Body */}
            {dimensions.map((d, index) => {
              const saVal = saDim[d.id] ?? 0;
              const maVal = maDim[d.id] ?? 0;
              const finalDimRaw = blendedScore(saVal, maVal, hasSA, hasMA);
              const finalDimElix = toElixIndex(finalDimRaw);
              const isLast = index === dimensions.length - 1;

              return (
                <View key={d.id} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ flex: 2 }, s.col]}>
                    <Text style={[s.textSm, s.fontBold, s.textSlate800]}>{d.name}</Text>
                  </View>
                  <View style={[{ flex: 1 }, s.textCenter]}>
                    <Text style={[s.textSm, s.textSlate600]}>{hasSA ? saVal.toFixed(2) : '—'}</Text>
                  </View>
                  <View style={[{ flex: 1 }, s.textCenter]}>
                    <Text style={[s.textSm, s.textSlate600]}>{hasMA ? maVal.toFixed(2) : '—'}</Text>
                  </View>
                  <View style={[{ flex: 1 }, s.textRight]}>
                    <Text style={[s.textSm, s.fontBlack, s.textIndigo600]}>{finalDimElix.toFixed(1)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Analisis Tren Siklus */}
        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Analisis Tren Siklus</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '50%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Nama Siklus</Text></View>
              <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Skor ELIX Individu</Text></View>
            </View>
            {dynamicTrend.map((t, index) => {
              const isLast = index === dynamicTrend.length - 1;
              return (
                <View key={t.name} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ width: '50%' }]}><Text style={[s.textSm, s.fontBold, s.textSlate800]}>{t.name}</Text></View>
                  <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textSm, s.fontBlack, s.textIndigo600]}>{t.avgElix ? t.avgElix.toFixed(1) : '—'}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Kamus Kategori */}
        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textBase, s.fontBlack, s.textSlate800, s.mb2]}>Kamus Kategori ELIX</Text>
          <View style={[s.row, { flexWrap: 'wrap', gap: 12 }]}>
            <View style={[{ width: '48%' }, s.bgBlue50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textBlue600]}>Excellent Leader (86 - 100)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Pemimpin luar biasa yang telah mencapai tingkat keunggulan dalam semua dimensi, siap untuk tanggung jawab lebih besar.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgEmerald50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textEmerald600]}>Growing Leader (66 - 85)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Menunjukkan pertumbuhan kepemimpinan yang konsisten dan berdampak positif pada lingkungan sekitarnya.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgOrange50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textOrange600]}>Developing Leader (46 - 65)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Dalam proses pengembangan kemampuan dasar kepemimpinan dan membutuhkan lebih banyak bimbingan strategis.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgRose50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textRose600]}>Emerging Leader (0 - 45)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Baru memulai perjalanan kepemimpinan dan memerlukan fokus pada penguatan fondasi karakter dan keterampilan dasar.</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[{ marginTop: 40 }, s.textCenter]}>
          <Text style={[s.textXs, s.textSlate400, s.fontMedium]}>Dokumen ini di-generate secara otomatis oleh sistem ELIX App.</Text>
          <Text style={[s.textXs, s.textSlate400, s.fontMedium]}>Penilaian ini bersifat rahasia dan menjadi hak milik program.</Text>
        </View>
      </Page>
    </Document>
  );
}
