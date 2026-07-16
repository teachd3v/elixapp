"use client";
import { Show, SignIn, UserButton } from '@clerk/nextjs';

import AlertModal from '../components/modals/AlertModal';
import DialogModal from '../components/modals/DialogModal';
import DesktopNav from '../components/DesktopNav';
import MobileNav from '../components/MobileNav';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, User, Users, ShieldAlert, CheckCircle, 
  HelpCircle, LogOut, Award, Sparkles, Phone, Video, MessageSquare, 
  Info, Calendar, Clock, ChevronRight, ChevronLeft, Sun, Moon, Bell, 
  ArrowRight, Search, SlidersHorizontal, BookOpen, Compass, ClipboardCheck, 
  UserCheck, MapPin, Building, GraduationCap, Edit, Plus, Trash2, Shield, FolderHeart,
  FileText, Send, UploadCloud, ChevronDown, ChevronUp, BarChart3, Megaphone, CheckCircle2
} from 'lucide-react';

import { useAppLogic } from '../hooks/useAppLogic';

import UnverifiedView from '../components/UnverifiedView';
import RealProfile from '../components/RealProfile';
import NotificationsBell from '../components/NotificationsBell';
import AwardeeDashboard from '../components/AwardeeDashboard';
import MentorDashboard from '../components/MentorDashboard';
import SuperadminDashboardReal from '../components/SuperadminDashboardReal';
function App() {
  const logic = useAppLogic();
  const {
    dbUser,
    setDbUser,
    isLoggedIn,
    setIsLoggedIn,
    role,
    setRole,
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    selectedPeriod,
    setSelectedPeriod,
    saCycleSelected,
    setSaCycleSelected,
    maCycleSelected,
    setMaCycleSelected,
    selectedMaAwardeeId,
    setSelectedMaAwardeeId,
    isEditingMa,
    setIsEditingMa,
    awardeeProfilePic,
    setAwardeeProfilePic,
    mentorProfilePic,
    setMentorProfilePic,
    saStep,
    setSaStep,
    maStep,
    setMaStep,
    showOnboarding,
    setShowOnboarding,
    onboardingSlide,
    setOnboardingSlide,
    sliderVal,
    setSliderVal,
    saWeight,
    setSaWeight,
    maWeight,
    setMaWeight,
    dimensions,
    setDimensions,
    statements,
    setStatements,
    awardeeProfile,
    setAwardeeProfile,
    provinces,
    setProvinces,
    regencies,
    setRegencies,
    loadingProvinces,
    setLoadingProvinces,
    loadingRegencies,
    setLoadingRegencies,
    modalOpen,
    setModalOpen,
    modalTitle,
    setModalTitle,
    modalMessage,
    setModalMessage,
    modalType,
    setModalType,
    triggerModal,
    dialogOpen,
    setDialogOpen,
    dialogTitle,
    setDialogTitle,
    dialogMessage,
    setDialogMessage,
    dialogType,
    setDialogType,
    dialogInputs,
    setDialogInputs,
    dialogOnConfirm,
    setDialogOnConfirm,
    dialogOnCancel,
    setDialogOnCancel,
    customAlert,
    customConfirm,
    customPrompt,
    handleProvinceChange,
    mentorRegencies,
    setMentorRegencies,
    loadingMentorRegencies,
    setLoadingMentorRegencies,
    handleMentorProvinceChange,
    mentorProfile,
    setMentorProfile,
    regionalAwardees,
    setRegionalAwardees,
    selectedAwardeeId,
    setSelectedAwardeeId,
    viewingAwardeeId,
    setViewingAwardeeId,
    regionalAttendance,
    setRegionalAttendance,
    coachingSessions,
    setCoachingSessions,
    isSessionModalOpen,
    setIsSessionModalOpen,
    sessionForm,
    setSessionForm,
    sessionScopeFilter,
    setSessionScopeFilter,
    userDirectory,
    setUserDirectory,
    editingUser,
    setEditingUser,
    sessions,
    setSessions,
    attendanceModalOpen,
    setAttendanceModalOpen,
    attendanceSessionId,
    setAttendanceSessionId,
    attendanceStep,
    setAttendanceStep,
    selfiePhoto,
    setSelfiePhoto,
    atmospherePhoto,
    setAtmospherePhoto,
    cameraError,
    setCameraError,
    videoStream,
    setVideoStream,
    videoRef,
    newAttendanceProof,
    setNewAttendanceProof,
    excuseModalOpen,
    setExcuseModalOpen,
    excuseSessionId,
    setExcuseSessionId,
    excuseCategory,
    setExcuseCategory,
    excuseDetail,
    setExcuseDetail,
    excuseProof,
    setExcuseProof,
    approvalRecord,
    setApprovalRecord,
    expandedSessions,
    setExpandedSessions,
    attendanceRecords,
    setAttendanceRecords,
    selectedManageSessionId,
    setSelectedManageSessionId,
    saExpandAwardee,
    setSaExpandAwardee,
    saExpandMentor,
    setSaExpandMentor,
    saExpandedUserRoles,
    setSaExpandedUserRoles,
    saExpandedWilayah,
    setSaExpandedWilayah,
    saExpandedAttendance,
    setSaExpandedAttendance,
    notifications,
    setNotifications,
    showNotifPopup,
    setShowNotifPopup,
    notifForm,
    setNotifForm,
    previewImage,
    setPreviewImage,
    saExpandedMentorWilayah,
    setSaExpandedMentorWilayah,
    superadminViewingAwardee,
    setSuperadminViewingAwardee,
    superadminViewingMentor,
    setSuperadminViewingMentor,
    elixFilterWilayah,
    setElixFilterWilayah,
    elixFilterAwardee,
    setElixFilterAwardee,
    elixExpandScoreCard,
    setElixExpandScoreCard,
    wilayahData,
    totalAwardeeNasional,
    totalMentorNasional,
    portfolioItems,
    setPortfolioItems,
    newPortTitle,
    setNewPortTitle,
    newPortCategory,
    setNewPortCategory,
    newPortDate,
    setNewPortDate,
    newPortDesc,
    setNewPortDesc,
    newPortFileName,
    setNewPortFileName,
    editingPortId,
    setEditingPortId,
    portModalOpen,
    setPortModalOpen,
    saScores,
    setSaScores,
    maScores,
    setMaScores,
    periods,
    calculatedData,
    radarData,
    adjustedElixIndex,
    filteredElixAnalysis,
    handleGoogleLogin,
    handleAttendanceSubmit,
    stopVideoStream,
    startCamera,
    capturePhoto,
    updateDimensionWeight,
    updateStatementText,
    currentTheme,
    signOut
  } = logic;

  // Real, DB-backed experience end-to-end. Awardee/Mentor must complete their
  // profile before the real dashboard unlocks.
  const profileComplete = !!dbUser?.isProfileComplete;
  const awardeeReady = role === 'awardee' && profileComplete;
  const mentorReady = role === 'mentor' && profileComplete;
  const showNav = role === 'superadmin' || awardeeReady || mentorReady;

return (
    <>
      <Show when="signed-out">
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0a0a]">
          
          {/* LEFT PANEL - Gradient Blue to Yellow */}
          <div className="hidden lg:flex w-1/2 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 p-12">
            <div className="absolute inset-0 bg-black/10"></div>
            
            <div className="relative z-10 flex items-center">
              <img src="/logo-yes.png" alt="YES Logo" className="h-20 w-auto object-contain brightness-0 invert" />
            </div>

            <div className="relative z-10 space-y-8 my-auto">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight">
                Portal Excellent<br/>Leader
              </h1>
              <p className="text-white/80 max-w-md text-lg leading-relaxed">
                Manage your data and activities with the YES GREAT Edunesia Dompet Dhuafa program
              </p>
              
              <div className="flex gap-4 mt-12">
                <div className="bg-white text-slate-900 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between shadow-xl">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold leading-tight">Awardee</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold leading-tight text-white/90">Mentor</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold leading-tight text-white/90">Management<br/>Center</p>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 text-white/50 text-xs">
              © {new Date().getFullYear()} Youth Ekselensia Scholarship. All rights reserved.
            </div>
          </div>

          {/* RIGHT PANEL - Dark Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen relative">
            <div className="max-w-md w-full z-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                <p className="text-sm text-slate-400">Enter your gmail to access the platform.</p>
              </div>
              
              <SignIn 
                routing="hash" 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none w-full p-0 m-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "bg-[#171717] border border-[#262626] hover:bg-[#262626] text-white py-3 rounded-xl transition-all",
                    socialButtonsBlockButtonText: "text-white font-semibold text-sm",
                    dividerRow: "my-6",
                    dividerText: "text-slate-500",
                    dividerLine: "bg-[#262626]",
                    formFieldLabel: "text-slate-300 text-xs font-bold mb-1.5",
                    formFieldInput: "bg-[#171717] border-[#262626] text-white focus:border-amber-500 focus:ring-amber-500 rounded-xl py-3 px-4 transition-all",
                    formButtonPrimary: "bg-white text-black hover:bg-slate-200 font-bold text-sm py-3.5 rounded-xl transition-all",
                    footerActionText: "text-slate-400 text-xs",
                    footerActionLink: "text-amber-500 hover:text-amber-400 text-xs font-bold",
                    identityPreviewText: "text-slate-300",
                    identityPreviewEditButton: "text-amber-500 hover:text-amber-400"
                  }
                }} 
              />
            </div>
          </div>

        </div>
      </Show>

      <Show when="signed-in">
        
    <div className={`min-h-screen ${currentTheme} flex flex-col transition-colors duration-300 pb-24 md:pb-0`}>
      {/* Floating Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 pt-4 sticky top-0 z-50 transition-all duration-300">
        <div className={`border rounded-full px-6 py-3.5 flex items-center justify-between backdrop-blur-lg shadow-xl shadow-slate-950/5 transition-all ${
          darkMode ? 'border-slate-800/40 bg-slate-950/65' : 'bg-white/70'
        }`}>
          <div className="flex items-center gap-3">
            <img src="/logo-yes.png" alt="YES Logo" className="h-8 w-auto object-contain" />
            <span className={`text-xs font-bold tracking-wider uppercase hidden sm:inline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Youth Ekselensia Scholarship
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Avatar Quick info removed */}

            <NotificationsBell darkMode={darkMode} />

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.clear();
                  window.sessionStorage.clear();
                }
                setIsLoggedIn(false);
                // Clear the Clerk session and land back on the sign-in screen.
                // Next login shows Google's account chooser (oidcPrompt=select_account).
                signOut({ redirectUrl: '/sign-in' });
              }}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Navigation Tabs */}
            {showNav && (
            <DesktopNav
              role={role}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            )}

        {/* ---------------- UNVERIFIED (PENDING APPROVAL) ---------------- */}
        {role === 'unverified' && <UnverifiedView darkMode={darkMode} />}

        {/* ---------- AWARDEE: complete profile first, then real dashboard ---------- */}
        {role === 'awardee' && !profileComplete && (
          <RealProfile darkMode={darkMode} role={role} dbUser={dbUser} setDbUser={setDbUser} />
        )}
        {role === 'awardee' && profileComplete && (
          <AwardeeDashboard darkMode={darkMode} role={role} dbUser={dbUser} setDbUser={setDbUser} activeTab={activeTab} />
        )}

        {/* ---------- MENTOR: complete profile first, then real dashboard ---------- */}
        {role === 'mentor' && !profileComplete && (
          <RealProfile darkMode={darkMode} role={role} dbUser={dbUser} setDbUser={setDbUser} />
        )}
        {role === 'mentor' && profileComplete && (
          <MentorDashboard darkMode={darkMode} role={role} dbUser={dbUser} setDbUser={setDbUser} activeTab={activeTab} />
        )}

        {/* ---------------- SUPERADMIN (real, DB-backed) ---------------- */}
        {role === 'superadmin' && (
          <SuperadminDashboardReal darkMode={darkMode} activeTab={activeTab} dbUser={dbUser} role={role} />
        )}

      </main>

      {/* Floating Bottom Nav Bar for Hape / Mobile
  Responsiveness */}
          {showNav && (
          <MobileNav
            darkMode={darkMode}
            role={role}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          )}

      {/* Portfolio Add/Edit Modal */}
      {portModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black tracking-tight">
                {editingPortId !== null ? 'Edit Aktivitas' : 'Tambah Aktivitas'}
              </h3>
              <button 
                onClick={() => {
                  setPortModalOpen(false);
                  setEditingPortId(null);
                  setNewPortTitle('');
                  setNewPortDate('');
                  setNewPortDesc('');
                  setNewPortFileName('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nama Aktivitas / Judul</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Juara 1 OSN Fisika"
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-inherit"
                  value={newPortTitle}
                  onChange={(e) => setNewPortTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Kategori</label>
                <select 
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent font-semibold text-inherit"
                  value={newPortCategory}
                  onChange={(e) => setNewPortCategory(e.target.value)}
                >
                  <option className="dark:bg-slate-900 text-inherit" value="Karya Personal">Karya Personal</option>
                  <option className="dark:bg-slate-900 text-inherit" value="Organisasi">Pengalaman Organisasi</option>
                  <option className="dark:bg-slate-900 text-inherit" value="Kepanitiaan">Kepanitiaan</option>
                  <option className="dark:bg-slate-900 text-inherit" value="Prestasi">Prestasi</option>
                  <option className="dark:bg-slate-900 text-inherit" value="Pelatihan">Pelatihan</option>
                  <option className="dark:bg-slate-900 text-inherit" value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal / Waktu Kegiatan</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-inherit"
                  value={newPortDate}
                  onChange={(e) => setNewPortDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Deskripsi Aktivitas</label>
                <textarea 
                  rows="3"
                  placeholder="Jelaskan peran atau detail kegiatan Anda..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-inherit"
                  value={newPortDesc}
                  onChange={(e) => setNewPortDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Dokumen Pendukung (Sertifikat/Foto)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    id="portfolio-file-modal" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewPortFileName(file.name);
                      }
                    }}
                  />
                  <label 
                    htmlFor="portfolio-file-modal"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#0f2942] dark:text-white rounded-xl text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-750 flex-1 text-center"
                  >
                    {newPortFileName ? 'Ganti File' : 'Pilih Dokumen'}
                  </label>
                </div>
                {newPortFileName && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1 text-center truncate">📎 {newPortFileName}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setPortModalOpen(false);
                  setEditingPortId(null);
                  setNewPortTitle('');
                  setNewPortDate('');
                  setNewPortDesc('');
                  setNewPortFileName('');
                }}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (!newPortTitle || !newPortDate) {
                    customAlert('Input Tidak Lengkap', 'Nama Aktivitas dan Tanggal wajib diisi bro!');
                    return;
                  }
                  if (editingPortId !== null) {
                    setPortfolioItems(prev => prev.map(item => {
                      if (item.id === editingPortId) {
                        return {
                          ...item,
                          title: newPortTitle,
                          category: newPortCategory,
                          date: newPortDate,
                          desc: newPortDesc,
                          fileName: newPortFileName || 'dokumen_pendukung.pdf'
                        };
                      }
                      return item;
                    }));
                    setEditingPortId(null);
                    triggerModal('Portofolio Diperbarui', 'Aktivitas portofolio berhasil diperbarui.', 'success');
                  } else {
                    const newItem = {
                      id: portfolioItems.length + 1,
                      title: newPortTitle,
                      category: newPortCategory,
                      date: newPortDate,
                      desc: newPortDesc,
                      fileName: newPortFileName || 'dokumen_pendukung.pdf'
                    };
                    setPortfolioItems(prev => [newItem, ...prev]);
                    triggerModal('Portofolio Ditambahkan', 'Aktivitas portofolio baru berhasil disimpan.', 'success');
                  }
                  setNewPortTitle('');
                  setNewPortDate('');
                  setNewPortDesc('');
                  setNewPortFileName('');
                  setPortModalOpen(false);
                }}
                className="w-1/2 py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                {editingPortId !== null ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Camera Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-sky-500" />
                Presensi Kehadiran Pembinaan
              </h3>
              <button 
                onClick={() => {
                  stopVideoStream();
                  setAttendanceModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Permission request */}
            {attendanceStep === 'permission' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto text-sky-500">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold">Verifikasi Identitas & Suasana</h4>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Sistem memerlukan akses kamera untuk mengambil foto selfie wajah (kamera depan) dan suasana pembinaan (kamera belakang) sebagai bukti verifikasi kehadiran yang valid.
                </p>
                <div className="space-y-2 pt-2">
                  <button 
                    onClick={() => {
                      setAttendanceStep('selfie-capture');
                      setTimeout(() => startCamera('user'), 100);
                    }}
                    className="w-full py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all"
                  >
                    Izinkan & Mulai Selfie
                  </button>
                  <button 
                    onClick={() => {
                      setSelfiePhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
                      setAtmospherePhoto("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80");
                      setAttendanceStep('preview');
                    }}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Simulasi Kamera (Pengujian)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Front Camera Selfie Capture */}
            {attendanceStep === 'selfie-capture' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-600 rounded text-[9px] font-black uppercase tracking-wider">Langkah 1: Ambil Foto Selfie</span>
                  <p className="text-[11px] text-slate-400 mt-1">Posisikan wajah Anda di tengah kamera depan</p>
                </div>

                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-200 dark:border-slate-800">
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white space-y-3">
                      <p className="text-xs text-rose-400 font-semibold px-4">{cameraError}</p>
                      <p className="text-[10px] text-slate-400">Gunakan kamera bawaan mobile Anda:</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="user" 
                        id="mobile-selfie-fallback"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setSelfiePhoto(event.target.result);
                              setAttendanceStep('selfie-review');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="mobile-selfie-fallback"
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                      >
                        Ambil Foto dengan Kamera HP
                      </label>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                  {!cameraError && <div className="absolute inset-0 border-[3px] border-sky-500/40 rounded-2xl pointer-events-none border-dashed m-3"></div>}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      stopVideoStream();
                      setAttendanceStep('permission');
                    }}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Batal
                  </button>
                  {!cameraError && (
                    <button 
                      onClick={() => {
                        capturePhoto((photo) => {
                          setSelfiePhoto(photo);
                          stopVideoStream();
                          setAttendanceStep('selfie-review');
                        });
                      }}
                      className="w-2/3 py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                    >
                      Ambil Foto
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Selfie Review */}
            {attendanceStep === 'selfie-review' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-600 rounded text-[9px] font-black uppercase tracking-wider">Tinjau Foto Selfie</span>
                  <p className="text-[11px] text-slate-400 mt-1">Apakah foto wajah Anda sudah terlihat jelas?</p>
                </div>

                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={selfiePhoto} alt="Selfie Review" className="w-full h-full object-cover scale-x-[-1]" />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelfiePhoto(null);
                      setAttendanceStep('selfie-capture');
                      setTimeout(() => startCamera('user'), 100);
                    }}
                    className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Ulangi Foto
                  </button>
                  <button 
                    onClick={() => {
                      setAttendanceStep('atmosphere-capture');
                      setTimeout(() => startCamera('environment'), 100);
                    }}
                    className="w-1/2 py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Back Camera Atmosphere Capture */}
            {attendanceStep === 'atmosphere-capture' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-black uppercase tracking-wider">Langkah 2: Ambil Foto Suasana</span>
                  <p className="text-[11px] text-slate-400 mt-1">Arahkan kamera belakang ke suasana pembinaan/ruangan</p>
                </div>

                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-200 dark:border-slate-800">
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white space-y-3">
                      <p className="text-xs text-rose-400 font-semibold px-4">{cameraError}</p>
                      <p className="text-[10px] text-slate-400">Gunakan kamera bawaan mobile Anda:</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        id="mobile-atmosphere-fallback"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setAtmospherePhoto(event.target.result);
                              setAttendanceStep('atmosphere-review');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="mobile-atmosphere-fallback"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                      >
                        Ambil Foto dengan Kamera HP
                      </label>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!cameraError && <div className="absolute inset-0 border-[3px] border-amber-500/40 rounded-2xl pointer-events-none border-dashed m-3"></div>}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      stopVideoStream();
                      setAttendanceStep('selfie-review');
                    }}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Kembali
                  </button>
                  {!cameraError && (
                    <button 
                      onClick={() => {
                        capturePhoto((photo) => {
                          setAtmospherePhoto(photo);
                          stopVideoStream();
                          setAttendanceStep('atmosphere-review');
                        });
                      }}
                      className="w-2/3 py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                    >
                      Ambil Foto
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Atmosphere Review */}
            {attendanceStep === 'atmosphere-review' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-black uppercase tracking-wider">Tinjau Foto Suasana</span>
                  <p className="text-[11px] text-slate-400 mt-1">Apakah foto suasana sudah terlihat memadai?</p>
                </div>

                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={atmospherePhoto} alt="Atmosphere Review" className="w-full h-full object-cover" />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setAtmospherePhoto(null);
                      setAttendanceStep('atmosphere-capture');
                      setTimeout(() => startCamera('environment'), 100);
                    }}
                    className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Ulangi Foto
                  </button>
                  <button 
                    onClick={() => {
                      setAttendanceStep('preview');
                    }}
                    className="w-1/2 py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Final Review and Submit */}
            {attendanceStep === 'preview' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black uppercase tracking-wider">Langkah 3: Tinjau & Kirim</span>
                  <p className="text-[11px] text-slate-400 mt-1">Konfirmasi bukti presensi Anda sebelum dikirim</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block text-center">Foto Selfie</span>
                    <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={selfiePhoto} alt="Captured Selfie" className="w-full h-full object-cover scale-x-[-1]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block text-center">Suasana Pembinaan</span>
                    <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={atmospherePhoto} alt="Captured Atmosphere" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setSelfiePhoto(null);
                      setAtmospherePhoto(null);
                      setAttendanceStep('permission');
                    }}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Ulangi Semua
                  </button>
                  <button 
                    onClick={() => {
                      handleAttendanceSubmit(attendanceSessionId, selfiePhoto, atmospherePhoto);
                      setAttendanceModalOpen(false);
                    }}
                    className="w-2/3 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    Kirim Presensi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sesi Pembinaan Modal (Mentor) */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                {sessionForm.id ? 'Edit Sesi Pembinaan Wilayah' : 'Tambah Sesi Pembinaan Wilayah'}
              </h3>
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider">Judul Sesi Pembinaan</label>
                <input 
                  type="text" 
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  placeholder="Contoh: Pembinaan Mingguan: Quranic Tahfidz & Quran Literacy"
                  className={`w-full p-3 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  className={`w-full p-3 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider">Waktu Pelaksanaan</label>
                <input 
                  type="text" 
                  value={sessionForm.time || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                  placeholder="Contoh: 08:00 - 10:00 WIB"
                  className={`w-full p-3 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-205 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (!sessionForm.title.trim() || !sessionForm.date) {
                    triggerModal('Gagal', 'Mohon lengkapi judul sesi dan tanggal pelaksanaan.', 'error');
                    return;
                  }
                  if (sessionForm.id) {
                    // Update
                    setCoachingSessions(prev => prev.map(item => item.id === sessionForm.id ? sessionForm : item));
                    triggerModal('Sesi Diperbarui', 'Sesi pembinaan wilayah berhasil diperbarui.', 'success');
                  } else {
                    // Add
                    const newId = coachingSessions.length > 0 ? Math.max(...coachingSessions.map(s => s.id)) + 1 : 1;
                    setCoachingSessions(prev => [...prev, { ...sessionForm, id: newId, scope: 'Wilayah' }]);
                    triggerModal('Sesi Ditambahkan', 'Sesi pembinaan wilayah baru berhasil didaftarkan.', 'success');
                  }
                  setIsSessionModalOpen(false);
                }}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
              >
                Simpan Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excuse (Izin) Submission Modal */}
      {excuseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Form Pengajuan Izin Pembinaan
              </h3>
              <button 
                onClick={() => setExcuseModalOpen(false)}
                className="text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Kategori Izin</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Sakit', 'Agenda Keluarga', 'Lainnya'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExcuseCategory(cat)}
                      className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        excuseCategory === cat
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                          : darkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {excuseCategory === 'Lainnya' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">Sebutkan Alasan Lainnya</label>
                  <input
                    type="text"
                    value={excuseDetail}
                    onChange={(e) => setExcuseDetail(e.target.value)}
                    placeholder="Tuliskan alasan izin Anda..."
                    className="w-full p-3 border rounded-xl bg-transparent text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              )}

              {excuseCategory !== 'Lainnya' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">Keterangan Tambahan (Opsional)</label>
                  <textarea
                    value={excuseDetail}
                    onChange={(e) => setExcuseDetail(e.target.value)}
                    placeholder="Tuliskan keterangan detail sakit/agenda..."
                    rows={3}
                    className="w-full p-3 border rounded-xl bg-transparent text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Upload Bukti Izin (Wajib)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all bg-slate-50 dark:bg-slate-950/20">
                  <div className="space-y-1 text-center">
                    {excuseProof ? (
                      <div className="relative inline-block">
                        <img src={excuseProof} alt="Bukti Izin" className="mx-auto h-24 w-auto rounded-lg object-cover border border-slate-200 dark:border-slate-805" />
                        <button
                          type="button"
                          onClick={() => setExcuseProof(null)}
                          className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full text-[8px] cursor-pointer hover:bg-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                        <div className="flex text-xs text-slate-600 dark:text-slate-400 justify-center">
                          <label className="relative cursor-pointer rounded-md font-bold text-amber-600 hover:text-amber-500 focus-within:outline-none">
                            <span>Upload Dokumen / Foto</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setExcuseProof(ev.target.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">Surat Sakit / Bukti Foto Maks 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExcuseModalOpen(false)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!excuseProof}
                  onClick={() => {
                    // Update sessions state (for the logged in awardee)
                    setSessions(prev => prev.map(s => s.id === excuseSessionId ? { ...s, status: 'Need Approval' } : s));
                    
                    // Update regionalAttendance mock state
                    setRegionalAttendance(prev => {
                      const existingIdx = prev.findIndex(item => item.sessionId === excuseSessionId && item.awardeeId === 'a1'); // assume awardee logged in is Yulianti ('a1')
                      if (existingIdx > -1) {
                        return prev.map((item, idx) => idx === existingIdx ? { 
                          ...item, 
                          status: 'Need Approval', 
                          reasonCategory: excuseCategory, 
                          reasonDetail: excuseDetail || (excuseCategory === 'Lainnya' ? 'Lainnya' : ''),
                          proof: excuseProof
                        } : item);
                      } else {
                        return [
                          ...prev,
                          {
                            sessionId: excuseSessionId,
                            awardeeId: 'a1',
                            status: 'Need Approval',
                            reasonCategory: excuseCategory,
                            reasonDetail: excuseDetail,
                            proof: excuseProof
                          }
                        ];
                      }
                    });

                    setExcuseModalOpen(false);
                    triggerModal('Pengajuan Izin Dikirim', 'Pengajuan izin bimbingan Anda berhasil dikirim untuk persetujuan mentor.', 'success');
                  }}
                  className={`w-2/3 py-3 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 ${
                    excuseProof 
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Pengajuan Izin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excuse (Izin) Approval Modal for Mentor */}
      {approvalRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Persetujuan Izin Awardee
              </h3>
              <button 
                onClick={() => setApprovalRecord(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Awardee</span>
                  <span className="font-bold">{approvalRecord.awardeeName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Kategori Izin</span>
                  <span className="font-bold text-amber-500">{approvalRecord.reasonCategory}</span>
                </div>
                <div className="flex flex-col text-xs pt-1 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-semibold mb-1">Alasan Detail:</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                    {approvalRecord.reasonDetail || '(Tidak ada keterangan tambahan)'}
                  </p>
                </div>
              </div>

              {approvalRecord.proof && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Dokumen Bukti / Foto</span>
                  <div className="border rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800">
                    <img 
                      src={approvalRecord.proof} 
                      alt="Bukti Izin" 
                      className="w-full max-h-48 object-contain mx-auto" 
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovalRecord(null)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update regionalAttendance
                    setRegionalAttendance(prev => prev.map(item => 
                      item.sessionId === approvalRecord.sessionId && item.awardeeId === approvalRecord.awardeeId 
                        ? { ...item, status: 'Izin' } 
                        : item
                    ));
                    
                    // Also if it is the current logged-in awardee's record, update sessions (just for mockup integrity)
                    if (approvalRecord.awardeeId === 'a1') {
                      setSessions(prev => prev.map(s => s.id === approvalRecord.sessionId ? { ...s, status: 'Izin' } : s));
                    }

                    setApprovalRecord(null);
                    triggerModal('Izin Disetujui', 'Pengajuan izin awardee bimbingan telah berhasil disetujui.', 'success');
                  }}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Izin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Custom Modal Notification */}
      <AlertModal 
        modalOpen={modalOpen} setModalOpen={setModalOpen}
        darkMode={darkMode} modalType={modalType}
        modalTitle={modalTitle} modalMessage={modalMessage}
      />

      {/* Custom Modal Dialog (Alert/Confirm/Prompt) */}
      <DialogModal 
        dialogOpen={dialogOpen} setDialogOpen={setDialogOpen}
        darkMode={darkMode} dialogTitle={dialogTitle}
        dialogMessage={dialogMessage} dialogType={dialogType}
        dialogInputs={dialogInputs} setDialogInputs={setDialogInputs}
        dialogOnConfirm={dialogOnConfirm} dialogOnCancel={dialogOnCancel}
      />

    </div>
  
      </Show>
    </>
  );
}


export default App;
