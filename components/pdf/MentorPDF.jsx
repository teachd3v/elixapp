import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { s, pdfColors } from '../../lib/pdfStyles';
import { elixCategory } from '../../lib/assessment';

export default function MentorPDF({ dbUser, wilayah, awardees, avgElix, activePeriodName, dynamicTrend = [], barData = [], dimensionAverages = [] }) {
  // Sort awardees by elix score descending
  const scoredAwardees = [...awardees].filter(a => a.elix != null).sort((a, b) => b.elix - a.elix);

  // Group by category
  const catCount = {
    'Excellent Leader': 0,
    'Growing Leader': 0,
    'Developing Leader': 0,
    'Emerging Leader': 0
  };
  scoredAwardees.forEach(a => {
    catCount[elixCategory(a.elix)]++;
  });

  return (
    <Document>
      <Page size={[595.28, 2000]} style={s.page}>
        {/* Header */}
        <View style={[s.row, s.justifyBetween, s.borderB, s.pb6, s.mb8]}>
          <View>
            <Text style={[s.text3xl, s.fontBlack, s.textSlate800]}>Laporan <Text style={s.textEmerald600}>ELIX</Text></Text>
            <Text style={[s.textSm, s.fontBold, s.textSlate400, s.uppercase, s.mt1]}>Kompilasi Wilayah</Text>
          </View>
          <View style={s.textRight}>
            <Text style={[s.textXs, s.fontBold, s.textSlate500]}>Siklus</Text>
            <Text style={[s.textSm, s.fontBlack, s.textSlate800]}>{activePeriodName || 'Aktif'}</Text>
            <Text style={[s.textXs, s.textSlate400, s.mt1]}>Dicetak: {new Date().toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* Profil */}
        <View style={[s.row, s.bgSlate50, s.p6, s.rounded2xl, s.borderAll, s.mb8, s.justifyBetween, s.itemsCenter]}>
          <View>
            <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase, s.mb1]}>Wilayah Binaan</Text>
            <Text style={[s.text3xl, s.fontBlack, s.textSlate800]}>{wilayah?.name || '—'}</Text>
            <View style={[s.row, s.itemsCenter, s.mt2]}>
              <Text style={[s.textSm, s.fontBold, s.textSlate600]}>Mentor: {dbUser?.name}</Text>
            </View>
          </View>
          <View style={[s.bgWhite, s.p4, s.rounded2xl, s.borderAll, s.textRight]}>
            <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase, s.mb1]}>Rata-rata ELIX Wilayah</Text>
            <Text style={[s.text4xl, s.fontBlack, s.textEmerald600]}>{avgElix ? avgElix.toFixed(1) : '—'}</Text>
          </View>
        </View>

        {/* Statistik */}
        <View style={[s.row, s.mb8, { gap: 16 }]}>
          <View style={[s.bgBlue50, s.borderAll, { borderColor: pdfColors.blue100 }, s.p4, s.rounded2xl, s.textCenter, s.flex1]}>
            <Text style={[s.text2xl, s.fontBlack, s.textBlue600]}>{catCount['Excellent Leader']}</Text>
            <Text style={[s.textXs, s.fontBold, s.textBlue400, s.uppercase, s.mt1]}>Excellent Leader</Text>
          </View>
          <View style={[s.bgEmerald50, s.borderAll, { borderColor: pdfColors.emerald100 }, s.p4, s.rounded2xl, s.textCenter, s.flex1]}>
            <Text style={[s.text2xl, s.fontBlack, s.textEmerald600]}>{catCount['Growing Leader']}</Text>
            <Text style={[s.textXs, s.fontBold, s.textEmerald400, s.uppercase, s.mt1]}>Growing Leader</Text>
          </View>
          <View style={[s.bgOrange50, s.borderAll, { borderColor: pdfColors.orange100 }, s.p4, s.rounded2xl, s.textCenter, s.flex1]}>
            <Text style={[s.text2xl, s.fontBlack, s.textOrange600]}>{catCount['Developing Leader']}</Text>
            <Text style={[s.textXs, s.fontBold, s.textOrange400, s.uppercase, s.mt1]}>Developing Leader</Text>
          </View>
          <View style={[s.bgRose50, s.borderAll, { borderColor: pdfColors.rose100 }, s.p4, s.rounded2xl, s.textCenter, s.flex1]}>
            <Text style={[s.text2xl, s.fontBlack, s.textRose600]}>{catCount['Emerging Leader']}</Text>
            <Text style={[s.textXs, s.fontBold, s.textRose400, s.uppercase, s.mt1]}>Emerging Leader</Text>
          </View>
        </View>

        {/* Rekapitulasi Awardee */}
        <View>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Rekapitulasi Awardee Wilayah</Text>
          <View style={s.table}>
            {/* Table Header */}
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '15%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Peringkat</Text></View>
              <View style={[{ width: '45%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Nama Awardee</Text></View>
              <View style={[{ width: '25%' }, s.textCenter]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Kategori</Text></View>
              <View style={[{ width: '15%' }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Skor</Text></View>
            </View>
            
            {/* Table Body */}
            {scoredAwardees.map((a, index) => {
              const isLast = index === scoredAwardees.length - 1;
              const cat = elixCategory(a.elix);
              let catStyle = { bg: pdfColors.slate100, text: pdfColors.slate600 };
              if (cat === 'Excellent Leader') { catStyle = { bg: pdfColors.blue100, text: pdfColors.blue600 }; }
              else if (cat === 'Growing Leader') { catStyle = { bg: pdfColors.emerald100, text: pdfColors.emerald600 }; }
              else if (cat === 'Developing Leader') { catStyle = { bg: pdfColors.orange100, text: pdfColors.orange600 }; }
              else if (cat === 'Emerging Leader') { catStyle = { bg: pdfColors.rose100, text: pdfColors.rose600 }; }

              return (
                <View key={a.id} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol, s.itemsCenter]}>
                  <View style={[{ width: '15%' }]}>
                    <Text style={[s.textSm, s.fontBlack, s.textSlate400]}>#{index + 1}</Text>
                  </View>
                  <View style={[{ width: '45%' }]}>
                    <Text style={[s.textSm, s.fontBold, s.textSlate800]}>{a.user?.name}</Text>
                  </View>
                  <View style={[{ width: '25%' }, s.textCenter, s.itemsCenter]}>
                    <View style={[{ backgroundColor: catStyle.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                       <Text style={[{ fontSize: 8 }, s.fontBold, { color: catStyle.text }]}>{cat}</Text>
                    </View>
                  </View>
                  <View style={[{ width: '15%' }, s.textRight]}>
                    <Text style={[s.textSm, s.fontBlack, s.textSlate800]}>{a.elix.toFixed(1)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Analisis Tren Siklus & Analisis Dimensi */}
        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Analisis Tren Siklus</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '50%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Nama Siklus</Text></View>
              <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Rata-rata ELIX Wilayah</Text></View>
            </View>
            {dynamicTrend.map((t, index) => {
              const isLast = index === dynamicTrend.length - 1;
              return (
                <View key={t.name} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ width: '50%' }]}><Text style={[s.textSm, s.fontBold, s.textSlate800]}>{t.name}</Text></View>
                  <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textSm, s.fontBlack, s.textEmerald600]}>{t.avgElix ? t.avgElix.toFixed(1) : '—'}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Perbandingan Dimensi per Awardee</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '20%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Nama Awardee</Text></View>
              {dimensionAverages.map(d => (
                <View key={d.id} style={[{ width: `${80 / dimensionAverages.length}%` }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>{d.name.split(' ')[0]}</Text></View>
              ))}
            </View>
            {barData.map((b, index) => {
              const isLast = index === barData.length - 1;
              return (
                <View key={b.name} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ width: '20%' }]}><Text style={[s.textSm, s.fontBold, s.textSlate800]}>{b.name}</Text></View>
                  {dimensionAverages.map(d => {
                    const val = b[d.name.split(' ')[0]];
                    return (
                      <View key={d.id} style={[{ width: `${80 / dimensionAverages.length}%` }, s.textRight]}>
                        <Text style={[s.textSm, s.textSlate600]}>{val ? val.toFixed(1) : '—'}</Text>
                      </View>
                    );
                  })}
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
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Pemimpin luar biasa yang telah mencapai tingkat keunggulan dalam semua dimensi.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgEmerald50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textEmerald600]}>Growing Leader (66 - 85)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Menunjukkan pertumbuhan kepemimpinan yang konsisten dan berdampak positif.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgOrange50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textOrange600]}>Developing Leader (46 - 65)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Dalam proses pengembangan kemampuan dasar kepemimpinan.</Text>
            </View>
            <View style={[{ width: '48%' }, s.bgRose50, s.p4, s.roundedLg]}>
              <Text style={[s.textSm, s.fontBold, s.textRose600]}>Emerging Leader (0 - 45)</Text>
              <Text style={[s.textXs, s.textSlate600, s.mt1]}>Baru memulai perjalanan kepemimpinan dan memerlukan fokus pada penguatan fondasi.</Text>
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
