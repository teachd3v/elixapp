// Rules for when awardees can submit attendance vs. excuse for a session.
// Used on both server (enforcement) and client (button state) so the two agree.

// Parse `Session.time` like "13:30 - 15:30" → { startMin, endMin } in minutes-of-day.
// Returns null if unparseable/empty; caller treats null as "no time = whole day".
export function parseSessionTime(time) {
  if (!time || typeof time !== 'string') return null;
  const m = time.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, sh, sm, eh, em] = m;
  const start = (+sh) * 60 + (+sm);
  const end = (+eh) * 60 + (+em);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return { startMin: start, endMin: end };
}

// Same calendar day (Y-M-D) in local time.
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function daysDiff(a, b) {
  // a - b in whole days (calendar). Positive = a is later.
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((A - B) / 86400000);
}

// Attendance (HADIR) submission window:
// - Must be the same calendar day as session.date, AND
// - Current time must be within [startMin, endMin] if the session has a time.
// - If no time set: any time on the session day.
export function isAttendanceOpen(session, now = new Date()) {
  const sessDate = new Date(session.date);
  if (!sameDay(now, sessDate)) return false;
  const win = parseSessionTime(session.time);
  if (!win) return true; // no time = whole day
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= win.startMin && nowMin <= win.endMin;
}

// Explain why attendance is closed (for UI tooltip).
export function attendanceStatusText(session, now = new Date()) {
  const sessDate = new Date(session.date);
  const d = daysDiff(sessDate, now);
  if (d > 0) return 'Absensi belum dibuka — belum tanggal sesi';
  if (d < 0) return 'Absensi sudah lewat — sesi sudah berakhir';
  const win = parseSessionTime(session.time);
  if (!win) return 'Absensi terbuka';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hh = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  if (nowMin < win.startMin) return `Absensi dibuka jam ${hh(win.startMin)}`;
  if (nowMin > win.endMin)  return `Absensi ditutup jam ${hh(win.endMin)}`;
  return 'Absensi terbuka';
}

// Excuse (IZIN) submission window:
// - Session date is today or in the future (belum lewat), AND
// - Current attendance status is not one that a reviewer has already set
//   (HADIR/ALFA/IZIN). MENUNGGU_KONFIRMASI or no row yet = OK.
export function isExcuseOpen(session, currentStatus, now = new Date()) {
  const sessDate = new Date(session.date);
  if (daysDiff(sessDate, now) < 0) return false;
  if (currentStatus && currentStatus !== 'MENUNGGU_KONFIRMASI') return false;
  return true;
}

export function excuseStatusText(session, currentStatus, now = new Date()) {
  const sessDate = new Date(session.date);
  if (daysDiff(sessDate, now) < 0) return 'Izin tidak tersedia — tanggal sudah lewat';
  if (currentStatus === 'ALFA') return 'Sudah ditandai Alfa oleh mentor';
  if (currentStatus === 'HADIR') return 'Sudah tercatat Hadir — hubungi mentor jika keliru';
  if (currentStatus === 'IZIN') return 'Izin sudah diverifikasi';
  return 'Ajukan izin';
}
