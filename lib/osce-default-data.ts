export interface RubricItem {
  aspect: string
  weight: number
  items: string[]
}

export interface OsceStation {
  id: string
  user_id: string | null
  title: string
  category: string
  duration_minutes: number
  scenario: string
  instructions_participant: string
  instructions_examiner: string
  equipment: string[]
  rubric: RubricItem[]
  created_at?: string
  updated_at?: string
}

export interface OsceAttempt {
  id: string
  user_id: string
  station_id: string
  started_at: string
  completed_at: string
  chat_history: { role: "user" | "assistant" | "system"; content: string }[]
  scores: Record<string, number>
  feedback: string
  total_score: number
  max_score: number
  status: "completed" | "in_progress"
}

export const builtInOsceStations: OsceStation[] = [
  {
    id: "builtin-obstetric-sc-appendicitis",
    user_id: null,
    title: "Anestesia Obstetrik – Sectio Caesarea & Appendiktomi Akut",
    category: "Anestesia Obstetrik",
    duration_minutes: 17,
    scenario: "Seorang perempuan berusia 28 tahun berat badan 75 kg dengan G1P0A0 kehamilan aterm inpartu, letak sungsang, disertai appendicitis akut dengan Tekanan Darah 138/88 mmHg laju nadi 112 x/menit, laju napas 18x/mnt, suhu: 39,2 oC. Pasien akan dilakukan operasi SC cito dan appendiktomi, dengan anestesi spinal.",
    instructions_participant: "- Sebutkan problem potensial dan aktual pada pasien ini!\n- Sebutkan persiapan pasien sebelum tindakan Anestesi!\n- Lakukan peragaan/penjelasan tindakan anestesi spinal pada pasien ini!\n- Sebutkan manajemen nyeri pasca anestesi spinal pada pasien ini!",
    instructions_examiner: "Pastikan identitas peserta ujian. Amati dan berikan skor (0/1/2/3) atas tugas yang dikerjakan peserta ujian serta skor Global Rating sesuai rubrik penilaian.",
    equipment: [
      "Spinal set",
      "Nampan alat",
      "Duk lobang",
      "Spinocain no 25, 26, 27",
      "Bupivacaine",
      "Lidocaine",
      "Sarung tangan steril",
      "Masker",
      "Plester",
      "Antiseptik"
    ],
    rubric: [
      {
        aspect: "Diagnosis dan problem aktual - potensial",
        weight: 2,
        items: [
          "Problem aktual: Kehamilan, hipertermia, nyeri akut",
          "Problem potensial: Mual muntah, aspirasi, hipotensi, bradikardia, high spinal block"
        ]
      },
      {
        aspect: "Rencana tindakan anestesi / Persiapan",
        weight: 1,
        items: [
          "Pasang IV line nomor besar dan lancar",
          "Rehidrasi dengan cairan kristaloid",
          "Puasa / nothing per oral",
          "Turunkan suhu tubuh",
          "Pemberian anti-muntah",
          "Pemberian antibiotik"
        ]
      },
      {
        aspect: "Keterampilan klinis (Spinal Anestesi)",
        weight: 3,
        items: [
          "Pasang monitor standar & cek vital sign",
          "Posisi lateral decubitus kiri / duduk",
          "Landmark L3-L4 (Tuffier line)",
          "Cuci tangan & sarung tangan steril",
          "Aseptik & antiseptik landmark",
          "Infiltrasi anestesi lokal",
          "Penusukan jarum spinal sampai keluar LCS",
          "Masukkan obat bupivacaine perlahan",
          "Pastikan blok spinal Th 4-6 berjalan baik"
        ]
      },
      {
        aspect: "Manajemen nyeri pasca anestesi",
        weight: 3,
        items: [
          "Multimodal analgesi: NSAID, Opioid, Paracetamol"
        ]
      },
      {
        aspect: "Komunikasi dan Perilaku profesional",
        weight: 1,
        items: [
          "Melakukan tindakan hati-hati",
          "Memperhatikan kenyamanan pasien",
          "Melakukan tindakan sesuai prioritas",
          "Menunjukkan rasa hormat kepada pasien",
          "Mengetahui keterbatasan dan melakukan konsultasi jika perlu"
        ]
      }
    ]
  }
]
