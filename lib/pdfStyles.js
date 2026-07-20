import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for PDF (Using Roboto as it has good support in react-pdf)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-black-webfont.ttf', fontWeight: 900 },
  ],
});

export const pdfColors = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo400: '#818cf8',
  indigo600: '#4f46e5',
  
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald400: '#34d399',
  emerald600: '#059669',
  
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange400: '#fb923c',
  orange600: '#ea580c',
  
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose400: '#fb7185',
  rose600: '#e11d48',
  
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple400: '#c084fc',
  purple600: '#9333ea',
};

// Base styles for all PDF reports
export const s = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    padding: 40,
  },
  
  // Layout utilities
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  itemsCenter: { alignItems: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyCenter: { justifyContent: 'center' },
  flex1: { flex: 1 },
  
  // Margins & Paddings
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt4: { marginTop: 16 },
  mt6: { marginTop: 24 },
  mt8: { marginTop: 32 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb4: { marginBottom: 16 },
  mb6: { marginBottom: 24 },
  mb8: { marginBottom: 32 },
  p4: { padding: 16 },
  p6: { padding: 24 },
  p8: { padding: 32 },
  
  // Typography
  textXs: { fontSize: 9 },
  textSm: { fontSize: 11 },
  textBase: { fontSize: 13 },
  textLg: { fontSize: 16 },
  textXl: { fontSize: 20 },
  text2xl: { fontSize: 24 },
  text3xl: { fontSize: 28 },
  text4xl: { fontSize: 34 },
  text6xl: { fontSize: 48 },
  
  fontNormal: { fontWeight: 400 },
  fontMedium: { fontWeight: 500 },
  fontBold: { fontWeight: 700 },
  fontBlack: { fontWeight: 900 },
  
  uppercase: { textTransform: 'uppercase' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  
  // Colors
  textSlate400: { color: pdfColors.slate400 },
  textSlate500: { color: pdfColors.slate500 },
  textSlate600: { color: pdfColors.slate600 },
  textSlate700: { color: pdfColors.slate700 },
  textSlate800: { color: pdfColors.slate800 },
  
  textIndigo400: { color: pdfColors.indigo400 },
  textIndigo600: { color: pdfColors.indigo600 },
  textBlue400: { color: pdfColors.blue400 },
  textBlue600: { color: pdfColors.blue600 },
  textEmerald400: { color: pdfColors.emerald400 },
  textEmerald600: { color: pdfColors.emerald600 },
  textOrange400: { color: pdfColors.orange400 },
  textOrange600: { color: pdfColors.orange600 },
  textRose400: { color: pdfColors.rose400 },
  textRose600: { color: pdfColors.rose600 },
  textPurple600: { color: pdfColors.purple600 },
  textWhite: { color: '#ffffff' },
  
  // Borders & Backgrounds
  borderB: { borderBottomWidth: 2, borderBottomColor: pdfColors.slate100 },
  borderAll: { borderWidth: 1, borderColor: pdfColors.slate200 },
  roundedLg: { borderRadius: 8 },
  roundedXl: { borderRadius: 12 },
  rounded2xl: { borderRadius: 16 },
  rounded3xl: { borderRadius: 24 },
  
  bgSlate50: { backgroundColor: pdfColors.slate50 },
  bgBlue50: { backgroundColor: pdfColors.blue50 },
  bgBlue100: { backgroundColor: pdfColors.blue100 },
  bgBlue500: { backgroundColor: pdfColors.blue500 },
  bgIndigo50: { backgroundColor: pdfColors.indigo50 },
  bgEmerald50: { backgroundColor: pdfColors.emerald50 },
  bgEmerald100: { backgroundColor: pdfColors.emerald100 },
  bgOrange50: { backgroundColor: pdfColors.orange50 },
  bgOrange100: { backgroundColor: pdfColors.orange100 },
  bgRose50: { backgroundColor: pdfColors.rose50 },
  bgRose100: { backgroundColor: pdfColors.rose100 },
  bgPurple50: { backgroundColor: pdfColors.purple50 },
  
  // Table
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: pdfColors.slate200, borderRadius: 12 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: pdfColors.slate100 },
  tableRowLast: { flexDirection: 'row' },
  tableColHeader: { padding: 10, backgroundColor: pdfColors.slate50 },
  tableCol: { padding: 10 },
  
  // Misc
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: pdfColors.slate200 },
  line: { width: 1, height: 30, backgroundColor: pdfColors.slate200, marginHorizontal: 16 }
});
