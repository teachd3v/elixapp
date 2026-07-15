import AlertModal from '../components/modals/AlertModal';
import DialogModal from '../components/modals/DialogModal';
import DesktopNav from '../components/DesktopNav';
import MobileNav from '../components/MobileNav';
import { useUser, useClerk } from '@clerk/nextjs';
import { defaultDimensionsList, defaultStatements } from '../data/constants';
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

// Fetch + normalize a wilayah (region) list. Guards res.ok so a missing static
// file (Next serves an HTML 404 page) throws a clear error instead of a cryptic
// "Unexpected token '<' ... is not valid JSON" crash from res.json().
async function fetchWilayah(url) {
  const res = await fetch(url);
  const contentType = res.headers.get('content-type') || '';
  // Reject non-JSON (a missing static file 404s to an HTML page, and an auth
  // redirect returns the sign-in HTML) so we never feed HTML to res.json().
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(`${url} -> HTTP ${res.status} (${contentType || 'no content-type'})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

export function useAppLogic() {

  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('unverified'); // 'unverified' | 'awardee' | 'mentor' | 'superadmin'
  const [dbUser, setDbUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        fetch('/api/auth/sync')
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Sync failed: ${res.status} ${text}`);
            }
            return res.json();
          })
          .then(data => {
            setDbUser(data);
            setRole(data.role.toLowerCase());
            setIsLoggedIn(true);
          })
          .catch(err => console.error("Failed to sync user", err));
      } else {
        setIsLoggedIn(false);
        setRole('unverified');
      }
    }
  }, [isLoaded, isSignedIn, user]);
  const [selectedPeriod, setSelectedPeriod] = useState('p2');
  const [saCycleSelected, setSaCycleSelected] = useState(false);
  const [maCycleSelected, setMaCycleSelected] = useState(false);
  const [selectedMaAwardeeId, setSelectedMaAwardeeId] = useState(null);
  const [isEditingMa, setIsEditingMa] = useState(false);
  const [awardeeProfilePic, setAwardeeProfilePic] = useState(null);
  const [mentorProfilePic, setMentorProfilePic] = useState(null);
  const [saStep, setSaStep] = useState(0);
  const [maStep, setMaStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('hasSeenOnboarding');
    }
    return false;
  });
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [sliderVal, setSliderVal] = useState(0);

  // Dynamic formula configuration state (Superadmin settings)
  const [saWeight, setSaWeight] = useState(0.4);
  const [maWeight, setMaWeight] = useState(0.6);
  const [dimensions, setDimensions] = useState(defaultDimensionsList);
  const [statements, setStatements] = useState(defaultStatements);

  // MOCK DATA - AWARDEE PROFILE
  const [awardeeProfile, setAwardeeProfile] = useState({
    name: 'Yulianti',
    school: 'SMAN 1 Bogor',
    major: 'IPA',
    generation: '5',
    region: 'Bogor',
    ktp: '3201024508980003',
    kk: '3201021204120005',
    gender: 'Perempuan',
    birthInfo: 'Bogor, 15 Juli 2008',
    phone: '0812-9876-5432',
    email: 'yulianti@gmail.com',
    address: 'Jl. Pajajaran No. 25, RT 01/RW 03',
    city: 'Kota Bogor',
    province: 'Jawa Barat'
  });

  // Geographic API states
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);

  // Custom Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');

  const triggerModal = (title, message, type = 'success') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  };

  // Custom Modal Dialog (Prompt/Confirm/Alert Replacement) States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState('confirm'); // 'alert' | 'confirm' | 'prompt'
  const [dialogInputs, setDialogInputs] = useState([]); // [{ key, label, value, type, placeholder }]
  const [dialogOnConfirm, setDialogOnConfirm] = useState(null);
  const [dialogOnCancel, setDialogOnCancel] = useState(null);

  const customAlert = (title, message, onConfirm = null) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType('alert');
    setDialogInputs([]);
    setDialogOnConfirm(() => () => { if (onConfirm) onConfirm(); setDialogOpen(false); });
    setDialogOpen(true);
  };

  const customConfirm = (title, message, onConfirm, onCancel = null) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType('confirm');
    setDialogInputs([]);
    setDialogOnConfirm(() => () => { onConfirm(); setDialogOpen(false); });
    setDialogOnCancel(() => () => { if (onCancel) onCancel(); setDialogOpen(false); });
    setDialogOpen(true);
  };

  const customPrompt = (title, inputs, onConfirm, onCancel = null) => {
    setDialogTitle(title);
    setDialogMessage('');
    setDialogType('prompt');
    setDialogInputs(inputs);
    setDialogOnConfirm(() => (currentInputs) => { onConfirm(currentInputs); setDialogOpen(false); });
    setDialogOnCancel(() => () => { if (onCancel) onCancel(); setDialogOpen(false); });
    setDialogOpen(true);
  };

  // (Wilayah dropdown sekarang di-handle langsung di RealProfile.jsx — komponen
  // mock lama yang butuh state ini sudah dihapus. State + handlers di-preserve
  // di return object supaya destructure di page.jsx yang masih ada tidak error.)

  // Fetch regencies initially if province is pre-populated
  React.useEffect(() => {
    if (provinces.length > 0 && awardeeProfile?.province) {
      const matchedProv = provinces.find(p => p.name.toLowerCase() === awardeeProfile.province.toLowerCase());
      if (matchedProv) {
        setLoadingRegencies(true);
        fetchWilayah(`/api-wilayah/regencies/${matchedProv.code}.json`)
          .then(list => {
            setRegencies(list);
            setLoadingRegencies(false);
          })
          .catch(err => {
            console.warn("Data kota/kabupaten belum tersedia (ditunda):", err.message);
            setLoadingRegencies(false);
          });
      }
    }
  }, [provinces]);

  const handleProvinceChange = (e) => {
    const provinceName = e.target.value;
    const matchedProv = provinces.find(p => p.name.toLowerCase() === provinceName.toLowerCase());
    
    setAwardeeProfile(prev => ({ ...prev, province: provinceName, city: '' }));
    setRegencies([]);
    
    if (matchedProv) {
      setLoadingRegencies(true);
      fetchWilayah(`/api-wilayah/regencies/${matchedProv.code}.json`)
        .then(list => {
          setRegencies(list);
          setLoadingRegencies(false);
        })
        .catch(err => {
          console.warn("Data kota/kabupaten belum tersedia (ditunda):", err.message);
          setLoadingRegencies(false);
        });
    }
  };

  // Geographic API states for Mentor
  const [mentorRegencies, setMentorRegencies] = useState([]);
  const [loadingMentorRegencies, setLoadingMentorRegencies] = useState(false);

  // Fetch mentor regencies initially if province is pre-populated
  React.useEffect(() => {
    if (provinces.length > 0 && mentorProfile?.province) {
      const matchedProv = provinces.find(p => p.name.toLowerCase() === mentorProfile.province.toLowerCase());
      if (matchedProv) {
        setLoadingMentorRegencies(true);
        fetchWilayah(`/api-wilayah/regencies/${matchedProv.code}.json`)
          .then(list => {
            setMentorRegencies(list);
            setLoadingMentorRegencies(false);
          })
          .catch(err => {
            console.warn("Data kota/kabupaten belum tersedia (ditunda):", err.message);
            setLoadingMentorRegencies(false);
          });
      }
    }
  }, [provinces]);

  const handleMentorProvinceChange = (e) => {
    const provinceName = e.target.value;
    const matchedProv = provinces.find(p => p.name.toLowerCase() === provinceName.toLowerCase());
    
    setMentorProfile(prev => ({ ...prev, province: provinceName, city: '' }));
    setMentorRegencies([]);
    
    if (matchedProv) {
      setLoadingMentorRegencies(true);
      fetchWilayah(`/api-wilayah/regencies/${matchedProv.code}.json`)
        .then(list => {
          setMentorRegencies(list);
          setLoadingMentorRegencies(false);
        })
        .catch(err => {
          console.warn("Data kota/kabupaten belum tersedia (ditunda):", err.message);
          setLoadingMentorRegencies(false);
        });
    }
  };

  // MOCK DATA - MENTOR PROFILE
  const [mentorProfile, setMentorProfile] = useState({
    name: 'Kak Huda Rohman',
    region: 'Bogor',
    totalBimbingan: 8,
    phone: '0812-3456-7890',
    email: 'huda@yes.org',
    gender: 'Laki-laki',
    birthInfo: 'Bandung, 10 Mei 1995',
    address: 'Jl. Pemuda No. 12, RT 02/RW 04',
    city: 'Kota Bogor',
    province: 'Jawa Barat'
  });

  // MOCK DATA - REGIONAL AWARDEES FOR MENTOR
  const [regionalAwardees, setRegionalAwardees] = useState([
    { id: 'a1', name: 'Yulianti', university: 'SMAN 1 Bogor', gpa: '3.82', saScore: 3.55, maScore: 3.32, hasFilledSA: true, hasFilledMA: true, email: 'yulianti@gmail.com', phone: '0812-9876-5432', birthInfo: 'Bogor, 15 Juli 2008', gender: 'Perempuan', address: 'Jl. Pajajaran No. 25, RT 01/RW 03, Kota Bogor, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    { id: 'a2', name: 'Fulanah Adila', university: 'SMAN 2 Bogor', gpa: '3.65', saScore: 3.80, maScore: 0.00, hasFilledSA: true, hasFilledMA: false, email: 'fulanah@gmail.com', phone: '0856-1111-2222', birthInfo: 'Bogor, 12 Desember 2008', gender: 'Perempuan', address: 'Jl. Pemuda No. 12, RT 02/RW 04, Kota Bogor, Jawa Barat', generation: '5', major: 'IPS', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' },
    { id: 'a3', name: 'Rian Hidayat', university: 'SMAN 3 Bogor', gpa: '3.41', saScore: 0.00, maScore: 0.00, hasFilledSA: false, hasFilledMA: false, email: 'rian@gmail.com', phone: '0899-3333-4444', birthInfo: 'Bogor, 3 April 2007', gender: 'Laki-laki', address: 'Jl. Merdeka No. 45, Kota Bogor, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' }
  ]);

  const [selectedAwardeeId, setSelectedAwardeeId] = useState('a1');
  const [viewingAwardeeId, setViewingAwardeeId] = useState(null);
  const [regionalAttendance, setRegionalAttendance] = useState([
    { sessionId: 1, awardeeId: 'a1', status: 'Hadir', selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', atmosphere: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&q=80' },
    { sessionId: 1, awardeeId: 'a2', status: 'Hadir', selfie: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', atmosphere: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=150&q=80' },
    { sessionId: 1, awardeeId: 'a3', status: 'Belum Mengisi' },

    { sessionId: 2, awardeeId: 'a1', status: 'Hadir', selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', atmosphere: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&q=80' },
    { sessionId: 2, awardeeId: 'a2', status: 'Izin', reasonCategory: 'Sakit', reasonDetail: 'Sakit demam tinggi, butuh istirahat', proof: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=150&q=80' },
    { sessionId: 2, awardeeId: 'a3', status: 'Belum Mengisi' },

    { sessionId: 3, awardeeId: 'a1', status: 'Belum Mengisi' },
    { sessionId: 3, awardeeId: 'a2', status: 'Belum Mengisi' },
    { sessionId: 3, awardeeId: 'a3', status: 'Need Approval', reasonCategory: 'Agenda Keluarga', reasonDetail: 'Acara pernikahan kakak kandung di Bandung', proof: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=150&q=80' }
  ]);

  const [coachingSessions, setCoachingSessions] = useState([
    { id: 1, title: 'Pembinaan Bulanan Juli: Leadership Character Development', date: '2026-07-12', time: '08:00 - 10:00', scope: 'Nasional' },
    { id: 2, title: 'Pembinaan Mingguan: Quranic Tahfidz & Quran Literacy', date: '2026-07-19', time: '13:30 - 15:30', scope: 'Wilayah' },
    { id: 3, title: 'Pembinaan Bulanan Agustus: Professional Presentation Skill', date: '2026-08-05', time: '09:00 - 11:30', scope: 'Nasional' }
  ]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ id: null, title: '', date: '', time: '08:00 - 10:00', scope: 'Wilayah' });
  const [sessionScopeFilter, setSessionScopeFilter] = useState('all');

  // MOCK DATA - USERS DIRECTORY FOR SUPERADMIN
  const [userDirectory, setUserDirectory] = useState([
    { 
      id: 1, name: 'Yulianti', email: 'yulianti@gmail.com', role: 'awardee', region: 'Bogor',
      school: 'SMAN 1 Bogor', major: 'IPA', generation: '5',
      ktp: '3201024508980003', kk: '3201021204120005', gender: 'Perempuan',
      birthInfo: 'Bogor, 15 Juli 2008', phone: '0812-9876-5432',
      address: 'Jl. Pajajaran No. 25, RT 01/RW 03', city: 'Kota Bogor', province: 'Jawa Barat',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    { 
      id: 2, name: 'Kak Huda Rohman', email: 'huda@yes.org', role: 'mentor', region: 'Bogor',
      phone: '0812-3456-7890', gender: 'Laki-laki', birthInfo: 'Bandung, 10 Mei 1995',
      address: 'Jl. Pemuda No. 12, RT 02/RW 04', city: 'Kota Bogor', province: 'Jawa Barat',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    { 
      id: 3, name: 'Fulanah Adila', email: 'fulanah@gmail.com', role: 'awardee', region: 'Bogor',
      school: 'SMAN 2 Bogor', major: 'IPS', generation: '5',
      ktp: '3201024508980010', kk: '3201021204120020', gender: 'Perempuan',
      birthInfo: 'Bogor, 20 Agustus 2008', phone: '0812-1111-2222',
      address: 'Jl. Baranangsiang No. 10', city: 'Kota Bogor', province: 'Jawa Barat',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
    },
    { 
      id: 4, name: 'Pak Admin YES', email: 'admin@yes.org', role: 'superadmin', region: 'Pusat',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
    }
  ]);

  const [editingUser, setEditingUser] = useState(null);

  // MOCK DATA - SESSIONS & ATTENDANCE
  const [sessions, setSessions] = useState([
    { id: 1, title: 'Pembinaan Bulanan Juli: Leadership Character Development', date: '2026-07-12', time: '09:00 - 12:00', scope: 'Nasional', status: 'Hadir', selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', atmosphere: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&q=80' },
    { id: 2, title: 'Pembinaan Mingguan: Quranic Tahfidz & Quran Literacy', date: '2026-07-19', time: '16:00 - 18:00', scope: 'Wilayah', status: 'Hadir', selfie: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', atmosphere: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=150&q=80' },
    { id: 3, title: 'Pembinaan Bulanan Agustus: Professional Presentation Skill', date: '2026-08-05', time: '09:00 - 12:00', scope: 'Nasional', status: 'Pending', selfie: null, atmosphere: null }
  ]);

  // Camera & Attendance States
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState(null);
  const [attendanceStep, setAttendanceStep] = useState('permission'); // 'permission' | 'selfie' | 'atmosphere' | 'preview'
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [atmospherePhoto, setAtmospherePhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);

  const [newAttendanceProof, setNewAttendanceProof] = useState(null);

  // Excuse (Izin) States
  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [excuseSessionId, setExcuseSessionId] = useState(null);
  const [excuseCategory, setExcuseCategory] = useState('Sakit');
  const [excuseDetail, setExcuseDetail] = useState('');
  const [excuseProof, setExcuseProof] = useState(null);
  const [approvalRecord, setApprovalRecord] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});

  // SUPERADMIN ATTENDANCE MANAGEMENT STATE
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, sessionId: 1, awardeeName: 'Yulianti', status: 'Hadir', date: '2026-07-12', proof: 'bukti_yulianti_1.jpg' },
    { id: 2, sessionId: 1, awardeeName: 'Fulanah Adila', status: 'Hadir', date: '2026-07-12', proof: 'bukti_fulanah_1.jpg' },
    { id: 3, sessionId: 1, awardeeName: 'Rian Hidayat', status: 'Hadir', date: '2026-07-12', proof: 'bukti_rian_1.jpg' },
    { id: 4, sessionId: 2, awardeeName: 'Yulianti', status: 'Hadir', date: '2026-07-19', proof: 'bukti_yulianti_2.jpg' },
    { id: 5, sessionId: 2, awardeeName: 'Fulanah Adila', status: 'Alfa', date: '2026-07-19', proof: null },
    { id: 6, sessionId: 2, awardeeName: 'Rian Hidayat', status: 'Hadir', date: '2026-07-19', proof: 'bukti_rian_2.jpg' },
    { id: 7, sessionId: 3, awardeeName: 'Yulianti', status: 'Pending', date: '2026-08-05', proof: 'bukti_yulianti_3.jpg' },
    { id: 8, sessionId: 3, awardeeName: 'Fulanah Adila', status: 'Belum Mengisi', date: '2026-08-05', proof: null },
    { id: 9, sessionId: 3, awardeeName: 'Rian Hidayat', status: 'Belum Mengisi', date: '2026-08-05', proof: null }
  ]);
  const [selectedManageSessionId, setSelectedManageSessionId] = useState(null);

  // SUPERADMIN DASHBOARD HIERARCHY STATE
  const [saExpandAwardee, setSaExpandAwardee] = useState(false);
  const [saExpandMentor, setSaExpandMentor] = useState(false);
  const [saExpandedUserRoles, setSaExpandedUserRoles] = useState({ awardee: true, mentor: false, superadmin: false });
  const [saExpandedWilayah, setSaExpandedWilayah] = useState({});
  const [saExpandedAttendance, setSaExpandedAttendance] = useState({});
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Selamat Datang!', message: 'Selamat datang di portal YES Elix. Pantau terus jadwal pembinaanmu ya.', date: '2026-07-01', isRead: false, targetRole: 'awardee', targetRegion: 'all' },
    { id: 2, title: 'Pengisian Nilai MA', message: 'Untuk para mentor, mohon segera lengkapi nilai MA untuk awardee wilayah Anda.', date: '2026-07-05', isRead: false, targetRole: 'mentor', targetRegion: 'all' }
  ]);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', targetRole: 'awardee', targetRegion: 'all' });
  const [previewImage, setPreviewImage] = useState(null);
  const [saExpandedMentorWilayah, setSaExpandedMentorWilayah] = useState({});
  const [superadminViewingAwardee, setSuperadminViewingAwardee] = useState(null);
  const [superadminViewingMentor, setSuperadminViewingMentor] = useState(null);

  // SUPERADMIN ELIX ANALYSIS STATE
  const [elixFilterWilayah, setElixFilterWilayah] = useState('all');
  const [elixFilterAwardee, setElixFilterAwardee] = useState('all');
  const [elixExpandScoreCard, setElixExpandScoreCard] = useState(false);

  // MOCK DATA - WILAYAH HIERARCHY FOR SUPERADMIN
  const wilayahData = [
    {
      id: 'w1', name: 'Bogor', mentorName: 'Dr. Ahmad Fauzi, M.Pd.',
      mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      mentorEmail: 'ahmad.fauzi@yes.or.id', mentorPhone: '0812-1234-5678',
      awardees: [
        { id: 'w1a1', name: 'Yulianti', university: 'SMAN 1 Bogor', gpa: '3.82', saScore: 3.55, maScore: 3.32, hasFilledSA: true, hasFilledMA: true, email: 'yulianti@gmail.com', phone: '0812-9876-5432', birthInfo: 'Bogor, 15 Juli 2008', gender: 'Perempuan', address: 'Jl. Pajajaran No. 25, Kota Bogor, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
        { id: 'w1a2', name: 'Fulanah Adila', university: 'SMAN 2 Bogor', gpa: '3.65', saScore: 3.80, maScore: 0.00, hasFilledSA: true, hasFilledMA: false, email: 'fulanah@gmail.com', phone: '0856-1111-2222', birthInfo: 'Bogor, 12 Desember 2008', gender: 'Perempuan', address: 'Jl. Pemuda No. 12, Kota Bogor, Jawa Barat', generation: '5', major: 'IPS', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' },
        { id: 'w1a3', name: 'Rian Hidayat', university: 'SMAN 3 Bogor', gpa: '3.41', saScore: 0.00, maScore: 0.00, hasFilledSA: false, hasFilledMA: false, email: 'rian@gmail.com', phone: '0899-3333-4444', birthInfo: 'Bogor, 3 April 2007', gender: 'Laki-laki', address: 'Jl. Merdeka No. 45, Kota Bogor, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' }
      ]
    },
    {
      id: 'w2', name: 'Jakarta Barat', mentorName: 'Siti Nurhaliza, S.Pd.',
      mentorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
      mentorEmail: 'siti.nurhaliza@yes.or.id', mentorPhone: '0813-5678-9012',
      awardees: [
        { id: 'w2a1', name: 'Aisyah Putri', university: 'SMAN 78 Jakarta', gpa: '3.90', saScore: 3.72, maScore: 3.65, hasFilledSA: true, hasFilledMA: true, email: 'aisyah@gmail.com', phone: '0811-2233-4455', birthInfo: 'Jakarta, 8 Maret 2008', gender: 'Perempuan', address: 'Jl. Kembangan Raya No. 10, Jakarta Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
        { id: 'w2a2', name: 'Budi Santoso', university: 'SMAN 112 Jakarta', gpa: '3.55', saScore: 3.40, maScore: 3.10, hasFilledSA: true, hasFilledMA: true, email: 'budi.s@gmail.com', phone: '0822-6677-8899', birthInfo: 'Jakarta, 25 November 2007', gender: 'Laki-laki', address: 'Jl. Pos Pengumben No. 44, Jakarta Barat', generation: '5', major: 'IPS', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
        { id: 'w2a3', name: 'Dewi Lestari', university: 'SMA Al-Azhar Syifa Budi', gpa: '3.78', saScore: 3.60, maScore: 3.45, hasFilledSA: true, hasFilledMA: true, email: 'dewi.l@gmail.com', phone: '0877-1122-3344', birthInfo: 'Jakarta, 14 Februari 2008', gender: 'Perempuan', address: 'Jl. Pesanggrahan No. 15, Jakarta Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
        { id: 'w2a4', name: 'Farhan Maulana', university: 'SMAN 6 Jakarta', gpa: '3.62', saScore: 3.50, maScore: 3.20, hasFilledSA: true, hasFilledMA: true, email: 'farhan@gmail.com', phone: '0856-9988-7766', birthInfo: 'Tangerang, 5 Juni 2008', gender: 'Laki-laki', address: 'Jl. Meruya Ilir No. 88, Jakarta Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80' },
        { id: 'w2a5', name: 'Sari Rahmawati', university: 'SMAN 33 Jakarta', gpa: '3.88', saScore: 3.85, maScore: 3.70, hasFilledSA: true, hasFilledMA: true, email: 'sari.r@gmail.com', phone: '0812-5544-3322', birthInfo: 'Jakarta, 19 September 2008', gender: 'Perempuan', address: 'Jl. Joglo Raya No. 22, Jakarta Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' }
      ]
    },
    {
      id: 'w3', name: 'Surabaya', mentorName: 'Ir. Bambang Widodo, M.T.',
      mentorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      mentorEmail: 'bambang.w@yes.or.id', mentorPhone: '0821-7890-1234',
      awardees: [
        { id: 'w3a1', name: 'Rizki Pratama', university: 'SMAN 5 Surabaya', gpa: '3.70', saScore: 3.45, maScore: 3.30, hasFilledSA: true, hasFilledMA: true, email: 'rizki.p@gmail.com', phone: '0813-1122-3344', birthInfo: 'Surabaya, 10 Januari 2008', gender: 'Laki-laki', address: 'Jl. Raya Darmo No. 55, Surabaya, Jawa Timur', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80' },
        { id: 'w3a2', name: 'Mega Puspita', university: 'SMAN 1 Surabaya', gpa: '3.92', saScore: 3.90, maScore: 3.80, hasFilledSA: true, hasFilledMA: true, email: 'mega.p@gmail.com', phone: '0856-5566-7788', birthInfo: 'Surabaya, 22 April 2008', gender: 'Perempuan', address: 'Jl. Basuki Rahmat No. 100, Surabaya, Jawa Timur', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80' },
        { id: 'w3a3', name: 'Hendra Wijaya', university: 'SMA Petra Surabaya', gpa: '3.58', saScore: 3.25, maScore: 3.15, hasFilledSA: true, hasFilledMA: true, email: 'hendra.w@gmail.com', phone: '0899-1234-5678', birthInfo: 'Sidoarjo, 7 Agustus 2007', gender: 'Laki-laki', address: 'Jl. Gubeng No. 30, Surabaya, Jawa Timur', generation: '5', major: 'IPS', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80' },
        { id: 'w3a4', name: 'Nur Fitriani', university: 'SMAN 9 Surabaya', gpa: '3.75', saScore: 3.60, maScore: 3.50, hasFilledSA: true, hasFilledMA: true, email: 'nur.f@gmail.com', phone: '0877-9876-5432', birthInfo: 'Surabaya, 30 Mei 2008', gender: 'Perempuan', address: 'Jl. Diponegoro No. 77, Surabaya, Jawa Timur', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80' }
      ]
    },
    {
      id: 'w4', name: 'Bandung', mentorName: 'Prof. Hasan Basri, Ph.D.',
      mentorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80',
      mentorEmail: 'hasan.basri@yes.or.id', mentorPhone: '0812-3456-7890',
      awardees: [
        { id: 'w4a1', name: 'Alya Zahra', university: 'SMAN 3 Bandung', gpa: '3.85', saScore: 3.70, maScore: 3.55, hasFilledSA: true, hasFilledMA: true, email: 'alya.z@gmail.com', phone: '0822-1234-5678', birthInfo: 'Bandung, 2 Oktober 2008', gender: 'Perempuan', address: 'Jl. Dago No. 125, Bandung, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=100&q=80' },
        { id: 'w4a2', name: 'Dimas Arya', university: 'SMAN 5 Bandung', gpa: '3.48', saScore: 3.30, maScore: 3.10, hasFilledSA: true, hasFilledMA: true, email: 'dimas.a@gmail.com', phone: '0813-9876-5432', birthInfo: 'Bandung, 18 Desember 2007', gender: 'Laki-laki', address: 'Jl. Cihampelas No. 50, Bandung, Jawa Barat', generation: '5', major: 'IPS', avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=100&q=80' },
        { id: 'w4a3', name: 'Intan Permata', university: 'SMA BPI 1 Bandung', gpa: '3.95', saScore: 3.88, maScore: 3.75, hasFilledSA: true, hasFilledMA: true, email: 'intan.p@gmail.com', phone: '0856-2233-4455', birthInfo: 'Cimahi, 11 Juni 2008', gender: 'Perempuan', address: 'Jl. Buah Batu No. 88, Bandung, Jawa Barat', generation: '5', major: 'IPA', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=100&q=80' }
      ]
    }
  ];

  const totalAwardeeNasional = wilayahData.reduce((sum, w) => sum + w.awardees.length, 0);
  const totalMentorNasional = wilayahData.length;


  // PORTFOLIO STATE
  const [portfolioItems, setPortfolioItems] = useState([
    { id: 1, title: 'Juara 1 Lomba Karya Tulis Ilmiah Nasional (LKTIN)', category: 'Prestasi', date: '2026-05-12', desc: 'Menulis karya ilmiah bertema inovasi teknologi hijau ramah lingkungan.', fileName: 'sertifikat_juara_lktin.pdf' },
    { id: 2, title: 'Ketua OSIS SMAN 1 Bogor', category: 'Organisasi', date: '2025-10-01', desc: 'Memimpin kepengurusan OSIS periode 2025/2026.', fileName: 'sk_osis_2025.pdf' },
    { id: 3, title: 'Pelatihan Cyber Security & Digital Forensic', category: 'Pelatihan', date: '2026-02-15', desc: 'Sertifikasi kompetensi dasar keamanan siber tingkat menengah.', fileName: 'sertifikat_cybersec.pdf' }
  ]);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortCategory, setNewPortCategory] = useState('Karya Personal');
  const [newPortDate, setNewPortDate] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortFileName, setNewPortFileName] = useState('');
  const [editingPortId, setEditingPortId] = useState(null);
  const [portModalOpen, setPortModalOpen] = useState(false);

  // Scores state dynamically pre-populated with realistic values for all 72 items
  const [saScores, setSaScores] = useState(() => {
    const scores = {};
    defaultStatements.forEach((s, idx) => {
      // Create a realistic mix of scores (mostly 3 and 4, with occasional 2)
      scores[s.id] = (idx % 7 === 0) ? 2 : (idx % 3 === 0) ? 4 : 3;
    });
    return scores;
  });
  
  const [maScores, setMaScores] = useState(() => {
    const initialMap = {};
    const periods = ['p1', 'p2', 'p3'];
    const awardeeIds = ['a1', 'a2', 'a3'];
    periods.forEach((pid, pIdx) => {
      initialMap[pid] = {};
      awardeeIds.forEach((aid, aIdx) => {
        const scores = {};
        defaultStatements.forEach((s, idx) => {
          scores[s.id] = ((idx + aIdx + pIdx) % 5 === 0) ? 2 : ((idx + aIdx + pIdx) % 4 === 0) ? 4 : 3;
        });
        initialMap[pid][aid] = scores;
      });
    });
    return initialMap;
  });

  const periods = [
    { id: 'p1', month: 'Juli', day: '24', label: 'Baseline' },
    { id: 'p2', month: 'Oktober', day: '24', label: 'Mid Review' },
    { id: 'p3', month: 'Desember', day: '24', label: 'End Review' }
  ];

  // Dynamic calculations for ELIX scores
  const calculatedData = useMemo(() => {
    const itemScores = {};
    const gaps = {};
    statements.forEach(s => {
      const sa = saScores[s.id] || 1;
      const ma = ((maScores[selectedPeriod] || {})[selectedAwardeeId] || {})[s.id] || 3;
      // Use dynamic weights configured by Superadmin
      itemScores[s.id] = (saWeight * sa) + (maWeight * ma);
      gaps[s.id] = sa - ma;
    });

    const dimensionScores = {};
    dimensions.forEach(dim => {
      const dimItems = statements.filter(s => s.dimensionId === dim.id);
      if (dimItems.length > 0) {
        const sum = dimItems.reduce((acc, s) => acc + itemScores[s.id], 0);
        dimensionScores[dim.id] = sum / dimItems.length;
      } else {
        dimensionScores[dim.id] = 3.0;
      }
    });

    let weightedSum = 0;
    let totalWeight = 0;
    dimensions.forEach(dim => {
      weightedSum += dimensionScores[dim.id] * dim.weight;
      totalWeight += dim.weight;
    });
    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const elixIndex = (rawScore / 4) * 100;

    let category = 'Emerging Leader';
    if (elixIndex >= 86) category = 'Excellent Leader';
    else if (elixIndex >= 66) category = 'Growing Leader';
    else if (elixIndex >= 46) category = 'Developing Leader';

    return {
      itemScores,
      gaps,
      dimensionScores,
      elixIndex: parseFloat(elixIndex.toFixed(2)),
      category
    };
  }, [saScores, maScores, saWeight, maWeight, dimensions, statements, selectedPeriod, selectedAwardeeId]);

  const radarData = useMemo(() => {
    return dimensions.map(dim => {
      let modifier = 1.0;
      if (selectedPeriod === 'p1') modifier = 0.78; // Baseline
      else if (selectedPeriod === 'p3') modifier = 1.12; // End Review
      else if (selectedPeriod === 'all') modifier = 0.96; // Average
      
      const rawScore = calculatedData.dimensionScores[dim.id] || 0;
      const adjusted = parseFloat((rawScore * modifier).toFixed(2));
      return {
        subject: dim.name.split(' ')[0],
        A: Math.min(4.00, Math.max(1.00, adjusted)),
        fullMark: 4
      };
    });
  }, [dimensions, calculatedData, selectedPeriod]);

  // Adjust header card index & category based on cycle
  const adjustedElixIndex = useMemo(() => {
    let modifier = 1.0;
    if (selectedPeriod === 'p1') modifier = 0.78;
    else if (selectedPeriod === 'p3') modifier = 1.12;
    else if (selectedPeriod === 'all') modifier = 0.96;
    
    const index = Math.min(100, Math.max(25, parseFloat((calculatedData.elixIndex * modifier).toFixed(2))));
    let category = 'Emerging Leader';
    if (index >= 86) category = 'Excellent Leader';
    else if (index >= 66) category = 'Growing Leader';
    else if (index >= 46) category = 'Developing Leader';
    
    return { index, category };
  }, [calculatedData, selectedPeriod]);

  // SUPERADMIN ELIX ANALYSIS CASCADING DATA
  const filteredElixAnalysis = useMemo(() => {
    let filteredAwardees = [];
    
    if (elixFilterWilayah === 'all') {
      wilayahData.forEach(w => filteredAwardees.push(...w.awardees));
    } else {
      const w = wilayahData.find(w => w.id === elixFilterWilayah);
      if (w) {
        if (elixFilterAwardee === 'all') {
          filteredAwardees = w.awardees;
        } else {
          const aw = w.awardees.find(a => a.id === elixFilterAwardee);
          if (aw) filteredAwardees.push(aw);
        }
      }
    }

    if (filteredAwardees.length === 0) {
      return { 
        elixIndex: calculatedData.elixIndex, 
        trend: [
          { siklus: 'Baseline', score: 65 },
          { siklus: 'Mid Review', score: 72 },
          { siklus: 'End Review', score: parseFloat(calculatedData.elixIndex) }
        ], 
        radarData: radarData.map(r => ({ ...r, A: (r.A / 4) * 100 })) // Scale 1-4 to 1-100 for radar
      };
    }

    const avgSa = filteredAwardees.reduce((acc, a) => acc + (a.saScore || 0), 0) / filteredAwardees.length;
    const avgMa = filteredAwardees.reduce((acc, a) => acc + (a.maScore || 0), 0) / filteredAwardees.length;
    
    // Scale 1-4 to 100. If both 0, fallback to a pseudo-random value based on ID length or just use national average
    let overall = (avgSa * saWeight) + (avgMa * maWeight);
    if (overall === 0) overall = parseFloat(calculatedData.elixIndex) / 100 * 4.0; // fallback

    const elixIndex = ((overall / 4.00) * 100).toFixed(2);
    
    const baseline = Math.max(0, elixIndex - (10 + Math.random() * 5));
    const mid = Math.max(0, elixIndex - (3 + Math.random() * 5));
    
    const trend = [
      { siklus: 'Baseline', score: parseFloat(baseline.toFixed(2)) },
      { siklus: 'Mid Review', score: parseFloat(mid.toFixed(2)) },
      { siklus: 'End Review', score: parseFloat(elixIndex) }
    ];

    // Scale radar from 1-4 to 1-100 and apply variation
    const variation = (parseFloat(elixIndex) / 100);
    const dynRadarData = radarData.map(r => {
      let scaledA = (r.A / 4) * 100; // original is 1-4
      scaledA = scaledA * variation; // apply penalty/bonus
      if (scaledA > 100) scaledA = 100;
      return {
        ...r,
        A: parseFloat(scaledA.toFixed(2)),
        fullMark: 100
      };
    });

    return {
      elixIndex,
      trend,
      radarData: dynRadarData,
      isNational: elixFilterWilayah === 'all'
    };
  }, [elixFilterWilayah, elixFilterAwardee, wilayahData, calculatedData, radarData]);

  const handleGoogleLogin = (selectedRole) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const handleAttendanceSubmit = (sessionId, selfie, atmosphere) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'Hadir', selfie: selfie, atmosphere: atmosphere } : s));
    triggerModal('Presensi Berhasil', 'Presensi kehadiran Anda telah terekam dengan selfie dan suasana pembinaan!', 'success');
  };

  const stopVideoStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const startCamera = async (mode) => {
    setCameraError(null);
    try {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode }
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Tidak dapat mengakses kamera. Silakan periksa izin browser atau gunakan tombol Simulasi Kamera.");
    }
  };

  const capturePhoto = (onCaptured) => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCaptured(dataUrl);
      } catch (err) {
        console.error("Capture failed:", err);
        onCaptured("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80");
      }
    }
  };

  const updateDimensionWeight = (id, newWeight) => {
    setDimensions(prev => prev.map(d => d.id === id ? { ...d, weight: parseFloat(newWeight) } : d));
  };

  const updateStatementText = (id, text, isAwardeeText) => {
    setStatements(prev => prev.map(s => s.id === id ? (isAwardeeText ? { ...s, text_awardee: text } : { ...s, text_mentor: text }) : s));
  };

  const currentTheme = darkMode ? 'dark bg-[#0b0f19] text-slate-100' : 'light bg-[#f4f7fa] text-[#0f2942]';

  return {
    dbUser, setDbUser,
    isLoggedIn, setIsLoggedIn, role, setRole, activeTab, setActiveTab, darkMode, setDarkMode, selectedPeriod, setSelectedPeriod, saCycleSelected, setSaCycleSelected, maCycleSelected, setMaCycleSelected, selectedMaAwardeeId, setSelectedMaAwardeeId, isEditingMa, setIsEditingMa, awardeeProfilePic, setAwardeeProfilePic, mentorProfilePic, setMentorProfilePic, saStep, setSaStep, maStep, setMaStep, showOnboarding, setShowOnboarding, onboardingSlide, setOnboardingSlide, sliderVal, setSliderVal, saWeight, setSaWeight, maWeight, setMaWeight, dimensions, setDimensions, statements, setStatements, awardeeProfile, setAwardeeProfile, provinces, setProvinces, regencies, setRegencies, loadingProvinces, setLoadingProvinces, loadingRegencies, setLoadingRegencies, modalOpen, setModalOpen, modalTitle, setModalTitle, modalMessage, setModalMessage, modalType, setModalType, triggerModal, dialogOpen, setDialogOpen, dialogTitle, setDialogTitle, dialogMessage, setDialogMessage, dialogType, setDialogType, dialogInputs, setDialogInputs, dialogOnConfirm, setDialogOnConfirm, dialogOnCancel, setDialogOnCancel, customAlert, customConfirm, customPrompt, handleProvinceChange, mentorRegencies, setMentorRegencies, loadingMentorRegencies, setLoadingMentorRegencies, handleMentorProvinceChange, mentorProfile, setMentorProfile, regionalAwardees, setRegionalAwardees, selectedAwardeeId, setSelectedAwardeeId, viewingAwardeeId, setViewingAwardeeId, regionalAttendance, setRegionalAttendance, coachingSessions, setCoachingSessions, isSessionModalOpen, setIsSessionModalOpen, sessionForm, setSessionForm, sessionScopeFilter, setSessionScopeFilter, userDirectory, setUserDirectory, editingUser, setEditingUser, sessions, setSessions, attendanceModalOpen, setAttendanceModalOpen, attendanceSessionId, setAttendanceSessionId, attendanceStep, setAttendanceStep, selfiePhoto, setSelfiePhoto, atmospherePhoto, setAtmospherePhoto, cameraError, setCameraError, videoStream, setVideoStream, videoRef, newAttendanceProof, setNewAttendanceProof, excuseModalOpen, setExcuseModalOpen, excuseSessionId, setExcuseSessionId, excuseCategory, setExcuseCategory, excuseDetail, setExcuseDetail, excuseProof, setExcuseProof, approvalRecord, setApprovalRecord, expandedSessions, setExpandedSessions, attendanceRecords, setAttendanceRecords, selectedManageSessionId, setSelectedManageSessionId, saExpandAwardee, setSaExpandAwardee, saExpandMentor, setSaExpandMentor, saExpandedUserRoles, setSaExpandedUserRoles, saExpandedWilayah, setSaExpandedWilayah, saExpandedAttendance, setSaExpandedAttendance, notifications, setNotifications, showNotifPopup, setShowNotifPopup, notifForm, setNotifForm, previewImage, setPreviewImage, saExpandedMentorWilayah, setSaExpandedMentorWilayah, superadminViewingAwardee, setSuperadminViewingAwardee, superadminViewingMentor, setSuperadminViewingMentor, elixFilterWilayah, setElixFilterWilayah, elixFilterAwardee, setElixFilterAwardee, elixExpandScoreCard, setElixExpandScoreCard, wilayahData, totalAwardeeNasional, totalMentorNasional, portfolioItems, setPortfolioItems, newPortTitle, setNewPortTitle, newPortCategory, setNewPortCategory, newPortDate, setNewPortDate, newPortDesc, setNewPortDesc, newPortFileName, setNewPortFileName, editingPortId, setEditingPortId, portModalOpen, setPortModalOpen, saScores, setSaScores, maScores, setMaScores, periods, calculatedData, radarData, adjustedElixIndex, filteredElixAnalysis, handleGoogleLogin, handleAttendanceSubmit, stopVideoStream, startCamera, capturePhoto, updateDimensionWeight, updateStatementText, currentTheme, signOut
  };
}
