const defaultDimensionsList = [
  { id: 'd1', name: 'Academic Readiness', weight: 0.25, color: '#0284c7', bg: 'bg-sky-500/10', text: 'text-sky-600' },
  { id: 'd2', name: 'Islamic Character', weight: 0.25, color: '#059669', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  { id: 'd3', name: 'Quranic Development', weight: 0.15, color: '#7c3aed', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  { id: 'd4', name: 'Self Mastery', weight: 0.15, color: '#e11d48', bg: 'bg-rose-500/10', text: 'text-rose-600' },
  { id: 'd5', name: 'Social Impact Leadership', weight: 0.20, color: '#d97706', bg: 'bg-amber-500/10', text: 'text-amber-600' }
];

const defaultStatements = [
  // Dimensi 1: Academic Readiness (d1)
  { id: 's1', aspect: 'Academic Performance', code: 'AP1', text_awardee: 'Saya mampu menjaga capaian akademik sesuai standar yang ditetapkan sekolah', text_mentor: 'Awardee mampu menjaga capaian akademik sesuai standar yang ditetapkan sekolah', dimensionId: 'd1' },
  { id: 's2', aspect: 'Academic Performance', code: 'AP2', text_awardee: 'Saya berikhtiar meningkatkan prestasi akademik dari waktu ke waktu', text_mentor: 'Awardee berikhtiar meningkatkan prestasi akademik dari waktu ke waktu', dimensionId: 'd1' },
  { id: 's3', aspect: 'Academic Performance', code: 'AP3', text_awardee: 'Saya memiliki kebiasaan belajar yang teratur dan disiplin', text_mentor: 'Awardee memiliki kebiasaan belajar yang teratur dan disiplin', dimensionId: 'd1' },
  { id: 's4', aspect: 'Academic Performance', code: 'AP4', text_awardee: 'Saya mampu menyelesaikan tugas dan tanggung jawab akademik dengan baik', text_mentor: 'Awardee mampu menyelesaikan tugas dan tanggung jawab akademik dengan baik', dimensionId: 'd1' },
  { id: 's5', aspect: 'Campus Planning & Admission', code: 'CPA1', text_awardee: 'Saya memiliki gambaran yang jelas mengenai cita-cita pendidikan dan karier masa depan', text_mentor: 'Awardee memiliki gambaran yang jelas mengenai cita-cita pendidikan dan karier masa depan', dimensionId: 'd1' },
  { id: 's6', aspect: 'Campus Planning & Admission', code: 'CPA2', text_awardee: 'Saya telah menentukan jurusan dan kampus yang ingin saya tuju', text_mentor: 'Awardee telah menentukan jurusan dan kampus yang ingin saya tuju', dimensionId: 'd1' },
  { id: 's7', aspect: 'Campus Planning & Admission', code: 'CPA3', text_awardee: 'Saya memiliki strategi dan rencana yang jelas untuk masuk ke kampus tujuan', text_mentor: 'Awardee memiliki strategi dan rencana yang jelas untuk masuk ke kampus tujuan', dimensionId: 'd1' },
  { id: 's8', aspect: 'Campus Planning & Admission', code: 'CPA4', text_awardee: 'Saya secara aktif mempersiapkan diri menghadapi seleksi masuk perguruan tinggi', text_mentor: 'Awardee secara aktif mempersiapkan diri menghadapi seleksi masuk perguruan tinggi', dimensionId: 'd1' },
  { id: 's9', aspect: 'Scholarship Readiness', code: 'SR1', text_awardee: 'Saya memahami berbagai peluang beasiswa yang tersedia (KIPK, lainnya) untuk mendukung pendidikan saya', text_mentor: 'Awardee memahami berbagai peluang beasiswa yang tersedia (KIPK, lainnya) untuk mendukung pendidikan saya', dimensionId: 'd1' },
  { id: 's10', aspect: 'Scholarship Readiness', code: 'SR2', text_awardee: 'Saya mampu menyiapkan dokumen beasiswa secara mandiri', text_mentor: 'Awardee mampu menyiapkan dokumen beasiswa secara mandiri', dimensionId: 'd1' },
  { id: 's11', aspect: 'Scholarship Readiness', code: 'SR3', text_awardee: 'Saya secara aktif mencari dan mengikuti program beasiswa yang sesuai', text_mentor: 'Awardee secara aktif mencari dan mengikuti program beasiswa yang sesuai', dimensionId: 'd1' },
  { id: 's12', aspect: 'Scholarship Readiness', code: 'SR4', text_awardee: 'Saya menunjukkan kesiapan untuk memperoleh dukungan pembiayaan pendidikan melalui beasiswa', text_mentor: 'Awardee menunjukkan kesiapan untuk memperoleh dukungan pembiayaan pendidikan melalui beasiswa', dimensionId: 'd1' },

  // Dimensi 2: Islamic Character (d2)
  { id: 's13', aspect: 'Ketaatan Ibadah', code: 'KI1', text_awardee: 'Saya menjaga pelaksanaan shalat wajib secara tertib dan tepat waktu (5 waktu)', text_mentor: 'Awardee menjaga pelaksanaan shalat wajib secara tertib dan tepat waktu (5 waktu)', dimensionId: 'd2' },
  { id: 's14', aspect: 'Ketaatan Ibadah', code: 'KI2', text_awardee: 'Saya membiasakan dzikir dan doa dalam kehidupan sehari-hari', text_mentor: 'Awardee membiasakan dzikir dan doa dalam kehidupan sehari-hari', dimensionId: 'd2' },
  { id: 's15', aspect: 'Ketaatan Ibadah', code: 'KI3', text_awardee: 'Saya melaksanakan ibadah sunnah (shaum, dhuha, tahajjud) sebagai bagian dari penguatan keimanan', text_mentor: 'Awardee melaksanakan ibadah sunnah (shaum, dhuha, tahajjud) sebagai bagian dari penguatan keimanan', dimensionId: 'd2' },
  { id: 's16', aspect: 'Ketaatan Ibadah', code: 'KI4', text_awardee: 'Saya berusaha menjadikan ibadah sebagai kebutuhan dan sumber kekuatan hidup', text_mentor: 'Awardee berusaha menjadikan ibadah sebagai kebutuhan dan sumber kekuatan hidup', dimensionId: 'd2' },
  { id: 's17', aspect: 'Birrul Walidain', code: 'BW1', text_awardee: 'Saya menunjukkan sikap hormat dan santun kepada orang tua', text_mentor: 'Awardee menunjukkan sikap hormat dan santun kepada orang tua', dimensionId: 'd2' },
  { id: 's18', aspect: 'Birrul Walidain', code: 'BW2', text_awardee: 'Saya membantu orang tua dalam berbagai pekerjaan dan kebutuhan keluarga', text_mentor: 'Awardee membantu orang tua dalam berbagai pekerjaan dan kebutuhan keluarga', dimensionId: 'd2' },
  { id: 's19', aspect: 'Birrul Walidain', code: 'BW3', text_awardee: 'Saya berusaha membahagiakan dan membanggakan orang tua melalui perilaku saya', text_mentor: 'Awardee berusaha membahagiakan dan membanggakan orang tua melalui perilaku saya', dimensionId: 'd2' },
  { id: 's20', aspect: 'Birrul Walidain', code: 'BW4', text_awardee: 'Saya senantiasa mendoakan kedua orang tua', text_mentor: 'Awardee senantiasa mendoakan kedua orang tua', dimensionId: 'd2' },
  { id: 's21', aspect: 'Adab Penuntut Ilmu', code: 'API1', text_awardee: 'Saya menunjukkan kesungguhan dalam menuntut ilmu', text_mentor: 'Awardee menunjukkan kesungguhan dalam menuntut ilmu', dimensionId: 'd2' },
  { id: 's22', aspect: 'Adab Penuntut Ilmu', code: 'API2', text_awardee: 'Saya menghormati guru, mentor, dan orang yang mengajarkan ilmu kepada saya', text_mentor: 'Awardee menghormati guru, mentor, dan orang yang mengajarkan ilmu kepada saya', dimensionId: 'd2' },
  { id: 's23', aspect: 'Adab Penuntut Ilmu', code: 'API3', text_awardee: 'Saya membiasakan diri untuk mengulang dan memperdalam pelajaran secara mandiri', text_mentor: 'Awardee membiasakan diri untuk mengulang dan memperdalam pelajaran secara mandiri', dimensionId: 'd2' },
  { id: 's24', aspect: 'Adab Penuntut Ilmu', code: 'API4', text_awardee: 'Saya menjaga adab dan etika dalam proses belajar', text_mentor: 'Awardee menjaga adab dan etika dalam proses belajar', dimensionId: 'd2' },
  { id: 's25', aspect: 'Integritas Moral', code: 'IM1', text_awardee: 'Saya menjaga kejujuran dalam hati, pikiran, perkataan dan perbuatan', text_mentor: 'Awardee menjaga kejujuran dalam hati, pikiran, perkataan dan perbuatan', dimensionId: 'd2' },
  { id: 's26', aspect: 'Integritas Moral', code: 'IM2', text_awardee: 'Saya berusaha menepati janji dan amanah yang diberikan kepada saya', text_mentor: 'Awardee berusaha menepati janji dan amanah yang diberikan kepada saya', dimensionId: 'd2' },
  { id: 's27', aspect: 'Integritas Moral', code: 'IM3', text_awardee: 'Saya menghindari perilaku yang bertentangan dengan nilai agama dan norma sosial', text_mentor: 'Awardee menghindari perilaku yang bertentangan dengan nilai agama dan norma sosial', dimensionId: 'd2' },
  { id: 's28', aspect: 'Integritas Moral', code: 'IM4', text_awardee: 'Saya berani mengakui kesalahan dan memperbaikinya', text_mentor: 'Awardee berani mengakui kesalahan dan memperbaikinya', dimensionId: 'd2' },

  // Dimensi 3: Quranic Development (d3)
  { id: 's29', aspect: 'Quran Literacy', code: 'QL1', text_awardee: 'Saya mampu membaca Al-Qur\'an dengan baik dan benar', text_mentor: 'Awardee mampu membaca Al-Qur\'an dengan baik dan benar', dimensionId: 'd3' },
  { id: 's30', aspect: 'Quran Literacy', code: 'QL2', text_awardee: 'Saya terus memperbaiki kualitas bacaan Al-Qur\'an sesuai kaidah tajwid', text_mentor: 'Awardee terus memperbaiki kualitas bacaan Al-Qur\'an sesuai kaidah tajwid', dimensionId: 'd3' },
  { id: 's31', aspect: 'Quran Literacy', code: 'QL3', text_awardee: 'Saya memiliki kemampuan dasar membaca dan menulis huruf Arab', text_mentor: 'Awardee memiliki kemampuan dasar membaca dan menulis huruf Arab', dimensionId: 'd3' },
  { id: 's32', aspect: 'Tilawah & Tahfidz', code: 'TT1', text_awardee: 'Saya memiliki kebiasaan membaca Al-Qur\'an setiap hari', text_mentor: 'Awardee memiliki kebiasaan membaca Al-Qur\'an setiap hari', dimensionId: 'd3' },
  { id: 's33', aspect: 'Tilawah & Tahfidz', code: 'TT2', text_awardee: 'Saya memiliki target hafalan Al-Qur\'an yang jelas dan terukur', text_mentor: 'Awardee memiliki target hafalan Al-Qur\'an yang jelas dan terukur', dimensionId: 'd3' },
  { id: 's34', aspect: 'Tilawah & Tahfidz', code: 'TT3', text_awardee: 'Saya melakukan murojaah hafalan secara rutin', text_mentor: 'Awardee melakukan murojaah hafalan secara rutin', dimensionId: 'd3' },
  { id: 's35', aspect: 'Tilawah & Tahfidz', code: 'TT4', text_awardee: 'Saya menunjukkan perkembangan hafalan Al-Qur\'an dari waktu ke waktu', text_mentor: 'Awardee menunjukkan perkembangan hafalan Al-Qur\'an dari waktu ke waktu', dimensionId: 'd3' },
  { id: 's36', aspect: 'Tadabbur & Implementasi', code: 'TI1', text_awardee: 'Saya berusaha memahami makna dari ayat-ayat Al-Qur\'an yang saya baca', text_mentor: 'Awardee berusaha memahami makna dari ayat-ayat Al-Qur\'an yang saya baca', dimensionId: 'd3' },
  { id: 's37', aspect: 'Tadabbur & Implementasi', code: 'TI2', text_awardee: 'Saya melakukan refleksi terhadap pesan-pesan Al-Qur\'an dalam kehidupan sehari-hari', text_mentor: 'Awardee melakukan refleksi terhadap pesan-pesan Al-Qur\'an dalam kehidupan sehari-hari', dimensionId: 'd3' },
  { id: 's38', aspect: 'Tadabbur & Implementasi', code: 'TI3', text_awardee: 'Saya berupaya menerapkan nilai-nilai Al-Qur\'an dalam perilaku dan keputusan hidup', text_mentor: 'Awardee berupaya menerapkan nilai-nilai Al-Qur\'an dalam perilaku dan keputusan hidup', dimensionId: 'd3' },

  // Dimensi 4: Self Mastery (d4)
  { id: 's39', aspect: 'Self Awareness', code: 'SA1', text_awardee: 'Saya mengenali potensi, kekuatan, dan kelebihan diri saya', text_mentor: 'Awardee mengenali potensi, kekuatan, dan kelebihan diri saya', dimensionId: 'd4' },
  { id: 's40', aspect: 'Self Awareness', code: 'SA2', text_awardee: 'Saya memahami kelemahan dan area yang perlu saya kembangkan', text_mentor: 'Awardee memahami kelemahan dan area yang perlu saya kembangkan', dimensionId: 'd4' },
  { id: 's41', aspect: 'Self Awareness', code: 'SA3', text_awardee: 'Saya memiliki tujuan hidup dan arah pengembangan diri yang jelas', text_mentor: 'Awardee memiliki tujuan hidup dan arah pengembangan diri yang jelas', dimensionId: 'd4' },
  { id: 's42', aspect: 'Personal Development Planning', code: 'PDP1', text_awardee: 'Saya memiliki Individual Development Plan (IDP) yang jelas', text_mentor: 'Awardee memiliki Individual Development Plan (IDP) yang jelas', dimensionId: 'd4' },
  { id: 's43', aspect: 'Personal Development Planning', code: 'PDP2', text_awardee: 'Saya menjalani target pengembangan diri yang telah saya susun', text_mentor: 'Awardee menjalani target pengembangan diri yang telah saya susun', dimensionId: 'd4' },
  { id: 's44', aspect: 'Personal Development Planning', code: 'PDP3', text_awardee: 'Saya melakukan evaluasi dan perbaikan terhadap perkembangan diri saya secara berkala', text_mentor: 'Awardee melakukan evaluasi dan perbaikan terhadap perkembangan diri saya secara berkala', dimensionId: 'd4' },
  { id: 's45', aspect: 'Learning Agility', code: 'LA1', text_awardee: 'Saya memiliki kebiasaan membaca dan belajar secara mandiri', text_mentor: 'Awardee memiliki kebiasaan membaca dan belajar secara mandiri', dimensionId: 'd4' },
  { id: 's46', aspect: 'Learning Agility', code: 'LA2', text_awardee: 'Saya menggunakan metode belajar yang efektif untuk meningkatkan kemampuan diri', text_mentor: 'Awardee menggunakan metode belajar yang efektif untuk meningkatkan kemampuan diri', dimensionId: 'd4' },
  { id: 's47', aspect: 'Learning Agility', code: 'LA3', text_awardee: 'Saya aktif mencari peluang untuk mengembangkan pengetahuan dan keterampilan baru', text_mentor: 'Awardee aktif mencari peluang untuk mengembangkan pengetahuan dan keterampilan baru', dimensionId: 'd4' },
  { id: 's48', aspect: 'Learning Agility', code: 'LA4', text_awardee: 'Saya mampu mengubah pembelajaran menjadi karya atau prestasi nyata', text_mentor: 'Awardee mampu mengubah pembelajaran menjadi karya atau prestasi nyata', dimensionId: 'd4' },
  { id: 's49', aspect: 'Financial Literacy', code: 'FL1', text_awardee: 'Saya memahami cara mengelola uang secara bijak', text_mentor: 'Awardee memahami cara mengelola uang secara bijak', dimensionId: 'd4' },
  { id: 's50', aspect: 'Financial Literacy', code: 'FL2', text_awardee: 'Saya mampu membedakan kebutuhan dan keinginan', text_mentor: 'Awardee mampu membedakan kebutuhan dan keinginan', dimensionId: 'd4' },
  { id: 's51', aspect: 'Financial Literacy', code: 'FL3', text_awardee: 'Saya memiliki kebiasaan menabung dan mengelola keuangan pribadi', text_mentor: 'Awardee memiliki kebiasaan menabung dan mengelola keuangan pribadi', dimensionId: 'd4' },

  // Dimensi 5: Social Impact Leadership (d5)
  { id: 's52', aspect: 'Communication', code: 'COM1', text_awardee: 'Saya berani bertanya untuk memperoleh pemahaman yang lebih baik', text_mentor: 'Awardee berani bertanya untuk memperoleh pemahaman yang lebih baik', dimensionId: 'd5' },
  { id: 's53', aspect: 'Communication', code: 'COM2', text_awardee: 'Saya mampu menyampaikan pendapat dan ide secara jelas', text_mentor: 'Awardee mampu menyampaikan pendapat dan ide secara jelas', dimensionId: 'd5' },
  { id: 's54', aspect: 'Communication', code: 'COM3', text_awardee: 'Saya percaya diri berbicara di depan kelompok atau publik', text_mentor: 'Awardee percaya diri berbicara di depan kelompok atau publik', dimensionId: 'd5' },
  { id: 's55', aspect: 'Communication', code: 'COM4', text_awardee: 'Saya mampu berkomunikasi secara efektif dan santun dengan berbagai pihak', text_mentor: 'Awardee mampu berkomunikasi secara efektif dan santun dengan berbagai pihak', dimensionId: 'd5' }
];
export { defaultDimensionsList, defaultStatements };
