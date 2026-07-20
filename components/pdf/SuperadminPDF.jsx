import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { s, pdfColors } from '../../lib/pdfStyles';

export default function SuperadminPDF({ superadmin, wilayahRollup = [], scoredAwardees = [], avgElix, activePeriodName, dynamicTrend = [], barData = [], dimensionAverages = [], filterWilayah, filterAwardee }) {
  // Calculate top 3 awardees from live data
  const top3 = [...scoredAwardees].slice(0, 3);

  return (
    <Document>
      <Page size={[595.28, 2000]} style={s.page}>
        {/* Header */}
        <View style={[s.row, s.justifyBetween, s.borderB, s.pb6, s.mb8]}>
          <View>
            <Text style={[s.text3xl, s.fontBlack, s.textSlate800]}>Laporan <Text style={s.textPurple600}>ELIX</Text></Text>
            <Text style={[s.textSm, s.fontBold, s.textSlate400, s.uppercase, s.mt1]}>Konsolidasi Nasional</Text>
          </View>
          <View style={s.textRight}>
            <Text style={[s.textXs, s.fontBold, s.textSlate500]}>Siklus</Text>
            <Text style={[s.textSm, s.fontBlack, s.textSlate800]}>{activePeriodName || 'Aktif'}</Text>
            <Text style={[s.textXs, s.textSlate400, s.mt1]}>Dicetak: {new Date().toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* Skor Nasional */}
        <View style={[s.row, s.bgSlate50, s.p6, s.rounded2xl, s.borderAll, s.mb8, s.justifyBetween, s.itemsCenter]}>
          <View>
            <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase, s.mb1]}>Total Populasi</Text>
            <View style={[s.row, s.itemsCenter, s.mt2]}>
              <View>
                <Text style={[s.text2xl, s.fontBlack, s.textSlate800]}>{scoredAwardees.length}</Text>
                <Text style={[s.textXs, s.fontBold, s.textSlate500]}>Awardee Ternilai</Text>
              </View>
              <View style={[s.line, { marginHorizontal: 24 }]} />
              <View>
                <Text style={[s.text2xl, s.fontBlack, s.textSlate800]}>{wilayahRollup.filter(w => w.elix != null).length}</Text>
                <Text style={[s.textXs, s.fontBold, s.textSlate500]}>Wilayah Aktif</Text>
              </View>
            </View>
          </View>
          <View style={[s.bgWhite, s.p4, s.rounded2xl, s.borderAll, s.textRight]}>
            <Text style={[s.textXs, s.fontBold, s.textSlate400, s.uppercase, s.mb1]}>Rata-rata ELIX Nasional</Text>
            <Text style={[s.text4xl, s.fontBlack, s.textPurple600]}>{avgElix ? avgElix.toFixed(1) : '—'}</Text>
          </View>
        </View>

        {/* Rekapitulasi Wilayah */}
        <View style={s.mb8}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Performa per Wilayah</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '30%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Wilayah Binaan</Text></View>
              <View style={[{ width: '20%' }, s.textCenter]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Jml Awardee</Text></View>
              <View style={[{ width: '30%' }, s.textCenter]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Ketuntasan (SA/MA)</Text></View>
              <View style={[{ width: '20%' }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Skor Rata-rata</Text></View>
            </View>
            
            {wilayahRollup.map((w, index) => {
              const isLast = index === wilayahRollup.length - 1;
              const wAwardees = w.awardees || [];
              const completedSA = wAwardees.filter(a => a.hasFilledSA).length;
              const completedMA = wAwardees.filter(a => a.hasFilledMA).length;
              const total = wAwardees.length;
              const avgSA = total > 0 ? (completedSA / total) * 100 : 0;
              const avgMA = total > 0 ? (completedMA / total) * 100 : 0;
              const pctText = total > 0 ? `${((avgSA + avgMA) / 2).toFixed(0)}%` : '0%';

              return (
                <View key={w.id} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ width: '30%' }]}><Text style={[s.textSm, s.fontBold, s.textSlate800]}>{w.name}</Text></View>
                  <View style={[{ width: '20%' }, s.textCenter]}><Text style={[s.textSm, s.textSlate600]}>{total}</Text></View>
                  <View style={[{ width: '30%' }]}><Text style={[s.textXs, s.fontBold, s.textEmerald600]}>{pctText}</Text></View>
                  <View style={[{ width: '20%' }, s.textRight]}><Text style={[s.textSm, s.fontBlack, s.textSlate800]}>{w.elix ? w.elix.toFixed(1) : '—'}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Awardees */}
        {top3.length > 0 && (
          <View>
            <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Top 3 Awardee Nasional</Text>
            <View style={[s.row, { gap: 16 }]}>
              {top3.map((a, i) => {
                const medals = ['#1', '#2', '#3'];
                const stylesList = [
                  { border: pdfColors.orange100, bg: pdfColors.orange50, text: pdfColors.orange600 },
                  { border: pdfColors.slate200, bg: pdfColors.slate50, text: pdfColors.slate600 },
                  { border: pdfColors.orange100, bg: pdfColors.orange50, text: pdfColors.orange600 } 
                ];
                const st = stylesList[i];
                return (
                  <View key={a.id} style={[s.borderAll, { borderColor: st.border }, { backgroundColor: st.bg }, s.p4, s.rounded2xl, s.textCenter, s.flex1]}>
                    <Text style={[s.text2xl, s.fontBlack, s.mb2, { color: st.text }]}>{medals[i]}</Text>
                    <Text style={[s.textSm, s.fontBold, s.textSlate800]}>{a.user?.name || 'Awardee'}</Text>
                    <Text style={[s.textXs, s.textSlate500]}>{wilayahRollup.find(w => w.id === a.wilayahId)?.name || '—'}</Text>
                    <Text style={[{ marginTop: 8 }, s.textLg, s.fontBlack, { color: st.text }]}>{a.elix.toFixed(1)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Analisis Tren Siklus & Analisis Dimensi */}
        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Analisis Tren Siklus</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '50%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Nama Siklus</Text></View>
              <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Rata-rata ELIX</Text></View>
            </View>
            {dynamicTrend.map((t, index) => {
              const isLast = index === dynamicTrend.length - 1;
              return (
                <View key={t.name} style={[isLast ? s.tableRowLast : s.tableRow, s.tableCol]}>
                  <View style={[{ width: '50%' }]}><Text style={[s.textSm, s.fontBold, s.textSlate800]}>{t.name}</Text></View>
                  <View style={[{ width: '50%' }, s.textRight]}><Text style={[s.textSm, s.fontBlack, s.textPurple600]}>{t.avgElix ? t.avgElix.toFixed(1) : '—'}</Text></View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[{ marginTop: 32 }]}>
          <Text style={[s.textLg, s.fontBlack, s.textSlate800, s.mb4]}>Perbandingan Dimensi per Wilayah</Text>
          <View style={s.table}>
            <View style={[s.tableRow, s.tableColHeader]}>
              <View style={[{ width: '20%' }]}><Text style={[s.textXs, s.fontBold, s.textSlate500, s.uppercase]}>Wilayah</Text></View>
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
