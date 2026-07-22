// Rules for when awardees can submit attendance vs. excuse for a session.
// Used on both server (enforcement) and client (button state) so the two agree.

// Attendance (HADIR) submission window:
// - Current time must be within [session.date, session.endDate] (absolute UTC).
export function isAttendanceOpen(session, now = new Date()) {
  const start = new Date(session.date);
  // Default to 24 hours if endDate is missing (legacy)
  const end = session.endDate ? new Date(session.endDate) : new Date(start.getTime() + 24 * 3600 * 1000);
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

// Explain why attendance is closed (for UI tooltip).
export function attendanceStatusText(session, now = new Date()) {
  const start = new Date(session.date);
  const end = session.endDate ? new Date(session.endDate) : new Date(start.getTime() + 24 * 3600 * 1000);
  
  if (now.getTime() < start.getTime()) return 'Absensi belum dibuka';
  if (now.getTime() > end.getTime()) return 'Absensi sudah ditutup';
  return 'Absensi terbuka';
}

// Excuse (IZIN) submission window:
// - Session time hasn't passed, AND
// - Current attendance status is not one that a reviewer has already set
export function isExcuseOpen(session, currentStatus, now = new Date()) {
  const start = new Date(session.date);
  const end = session.endDate ? new Date(session.endDate) : new Date(start.getTime() + 24 * 3600 * 1000);
  if (now.getTime() > end.getTime()) return false;
  if (currentStatus && currentStatus !== 'MENUNGGU_KONFIRMASI') return false;
  return true;
}

export function excuseStatusText(session, currentStatus, now = new Date()) {
  const start = new Date(session.date);
  const end = session.endDate ? new Date(session.endDate) : new Date(start.getTime() + 24 * 3600 * 1000);
  if (now.getTime() > end.getTime()) return 'Izin tidak tersedia — waktu sesi sudah lewat';
  if (currentStatus === 'ALFA') return 'Sudah ditandai Alfa oleh mentor';
  if (currentStatus === 'HADIR') return 'Sudah tercatat Hadir — hubungi mentor jika keliru';
  if (currentStatus === 'IZIN') return 'Izin sudah diverifikasi';
  return 'Ajukan izin';
}
