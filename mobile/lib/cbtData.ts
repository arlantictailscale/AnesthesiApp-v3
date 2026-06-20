export interface CBTQuestion {
  id: string
  text: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  correctOption: "A" | "B" | "C" | "D" | "E"
  category: string
  explanation: string
}

export interface CBTPackage {
  id: string
  name: string
  description: string
  questions: CBTQuestion[]
}

export const builtInPackages: CBTPackage[] = [
  {
    id: "pkg1",
    name: "Ujian Dasar Anestesi (Basic)",
    description: "Evaluasi pemahaman tentang eliminasi obat anestesi umum, blockade motorik, dan perlindungan servikal jalan napas.",
    questions: [
      {
        id: "q1",
        text: "Seorang laki-laki berusia 45 tahun dengan riwayat sirosis hepatis Child-Pugh B direncanakan menjalani laparatomi eksplorasi. Terkait pelumpuh otot non-depolarisasi golongan aminosteroid seperti vecuronium, manakah organ eliminasi utama yang bertanggung jawab untuk ekskresi obat ini?",
        options: {
          A: "Ginjal (ekskresi urin primer)",
          B: "Hati (eliminasi bilier)",
          C: "Plasma (hidrolisis esterase)",
          D: "Paru-paru (eliminasi Hofmann)",
          E: "Kelenjar keringat eksokrin",
        },
        correctOption: "B",
        category: "Farmakologi & Fisiologi",
        explanation: "Vecuronium terutama mengalami eliminasi di hati melalui ekskresi bilier (sekitar 40-70%), sedangkan ginjal bertanggung jawab untuk sekitar 20-30% ekskresinya. Pada pasien dengan gangguan fungsi hati, durasi kerja vecuronium dapat memanjang secara signifikan karena penurunan klirens bilier.",
      },
      {
        id: "q3",
        text: "Seorang laki-laki berusia 30 tahun dibawa ke IGD setelah kecelakaan lalu lintas dengan kecurigaan fraktur kolumna servikal tidak stabil. Pasien mengalami gagal napas akut dan memerlukan intubasi darurat. Manakah tindakan perlindungan jalan napas yang paling direkomendasikan saat laringoskopi?",
        options: {
          A: "Head tilt - Chin lift maksimal",
          B: "Manuver jaw thrust tanpa alat bantu tambahan",
          C: "Manual In-Line Stabilization (MILS)",
          D: "Ekstensi leher dengan menaruh bantal tebal di bawah kepala",
          E: "Manuver Sellick dengan tekanan krikoid tinggi",
        },
        correctOption: "C",
        category: "Resusitasi & Critical Care",
        explanation: "Manual In-Line Stabilization (MILS) adalah standar emas saat intubasi pasien dengan suspek cedera servikal tidak stabil. MILS dilakukan oleh asisten untuk menstabilkan leher secara aksial guna meminimalkan gerakan fleksi-ekstensi kolumna servikal saat laringoskopi dilakukan.",
      },
      {
        id: "q4",
        text: "Seorang laki-laki berusia 68 tahun dengan riwayat penyakit jantung koroner menjalani operasi TURP dengan anestesi spinal (SAB). Tiga puluh menit setelah injeksi Bupivacaine hiperbarik 12.5 mg, tekanan darah turun menjadi 82/46 mmHg dan laju nadi turun dari 78x/menit menjadi 42x/menit. Manakah dermatom sensorik terblokir yang menjadi penyebab bradikardia ekstrem pada pasien ini?",
        options: {
          A: "Blokade simpatis setinggi dermatom L1-L2",
          B: "Blokade parasimpatis sakral S2-S4",
          C: "Blokade serabut simpatis akselerator jantung setinggi T1-T4",
          D: "Blokade motorik dermatom T10-T12",
          E: "Efek depresi miokard langsung akibat absorpsi sistemik bupivacaine",
        },
        correctOption: "C",
        category: "Anestesi Umum & Regional",
        explanation: "Bradikardia hebat pada blokade spinal tinggi disebabkan oleh terblokirnya serabut simpatis preganglionik T1-T4 (akselerator jantung). Hal ini menyebabkan dominansi tonus vagal dan penurunan venous return (preload) yang memicu penurunan denyut nadi via refleks Bainbridge.",
      }
    ]
  },
  {
    id: "pkg2",
    name: "Subspesialis Obstetrik & Pediatrik",
    description: "Kumpulan soal-soal khusus penatalaksanaan anestesi kebidanan (obstetri) dan penanganan pasien anak/pediatrik.",
    questions: [
      {
        id: "q2",
        text: "Seorang primigravida berusia 28 tahun usia kehamilan 38 minggu dengan Preeklamsia Berat (PEB) direncanakan menjalani Sectio Caesarea darurat. Pasien telah mendapatkan terapi loading dose Magnesium Sulfat (MgSO4). Manakah mekanisme fisiologis MgSO4 berikut yang dapat memperpanjang efek obat pelumpuh otot non-depolarisasi?",
        options: {
          A: "Meningkatkan sensitivitas reseptor nikotinik pascasinaps",
          B: "Meningkatkan sintesis dan pelepasan asetilkolin di presinaps",
          C: "Menghambat masuknya kalsium pada terminal presinaps sehingga menurunkan pelepasan asetilkolin",
          D: "Mempercepat metabolisme asetilkolinesterase plasma",
          E: "Meningkatkan laju filtrasi glomerulus sehingga mempercepat klirens obat",
        },
        correctOption: "C",
        category: "Anestesi Obstetrik",
        explanation: "Magnesium sulfat (MgSO4) bertindak sebagai antagonis kalsium fisiologis di terminal saraf presinaps neuromuscular junction, yang secara signifikan mengurangi influks kalsium dan pelepasan asetilkolin. Kondisi ini meningkatkan kepekaan motor end-plate dan memperpanjang efek blockade pelumpuh otot depolarisasi maupun nondepolarisasi.",
      },
      {
        id: "q5",
        text: "Seorang anak laki-laki berusia 6 tahun direncanakan menjalani tonsilektomi. Selama induksi inhalasi menggunakan sevoflurane 8% dalam oksigen 100%, pasien tiba-tiba mengalami rigiditas otot maseter yang berat sehingga mulut tidak dapat dibuka sama sekali untuk intubasi. Manakah kecurigaan komplikasi anestesi utama dan tata laksana darurat pertama yang harus disiapkan?",
        options: {
          A: "Laringospasme berat; berikan propofol 2 mg/kg intravena",
          B: "Hipertermia Maligna; hentikan sevoflurane dan segera berikan Dantrolene",
          C: "Kejang mioklonik; berikan Midazolam 0.1 mg/kg intravena",
          D: "Anafilaksis sevoflurane; berikan Epinefrin 10 mcg/kg intravena",
          E: "Spasme maseter transient; ganti anestesi dengan isoflurane",
        },
        correctOption: "B",
        category: "Farmakologi & Fisiologi",
        explanation: "Rigiditas otot maseter (masseter muscle rigidity - MMR) setelah pemberian zat pemicu (halogenated inhalations atau suksinilkolin) adalah tanda peringatan dini yang sangat kuat dari Hipertermia Maligna. Penanganan utamanya melibatkan penghentian total agen pemicu, hiperventilasi O2 100%, dan pemberian Dantrolene.",
      },
      {
        id: "q8",
        text: "Seorang neonatus berusia 3 hari dengan diagnosis atresia duodenum dijadwalkan untuk tindakan duodenoduodenostomi darurat. Manakah dari pernyataan berikut yang menggambarkan perbedaan fisiologis sistem pernapasan neonatus dibanding dewasa?",
        options: {
          A: "Neonatus memiliki compliance paru yang sangat tinggi dan compliance dinding dada rendah",
          B: "Neonatus memiliki fungsional residual capacity (FRC) yang relatif lebih besar dibanding dewasa",
          C: "Neonatus memiliki konsumsi oksigen per unit berat badan 2-3 kali lebih tinggi dibanding dewasa",
          D: "Neonatus bernapas dengan otot interkostal sebagai penggerak utama napas",
          E: "Neonatus memiliki sensitivitas yang sangat rendah terhadap hipoksia dan hiperkapnia",
        },
        correctOption: "C",
        category: "Anestesi Pediatrik",
        explanation: "Konsumsi oksigen neonatus sangat tinggi (sekitar 6-8 mL/kg/menit, dua kali lipat dibanding dewasa) untuk mendukung metabolisme yang cepat. Dikombinasikan dengan kapasitas residu fungsional (FRC) yang rendah, neonatus sangat cepat mengalami desaturasi oksigen (hipoksia) jika terjadi apneu.",
      }
    ]
  }
]
