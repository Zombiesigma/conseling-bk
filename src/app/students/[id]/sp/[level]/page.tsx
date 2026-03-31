
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { Loader2, Printer, ArrowLeft, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================================
// Tipe data
// ============================================================================
type Level = "1" | "2" | "3";

// ============================================================================
// Komponen Utama
// ============================================================================
export default function SuratPeringatanPage({ params }: { params: Promise<{ id: string; level: string }> }) {
  const { id: studentId, level: rawLevel } = use(params);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [today, setToday] = useState("");

  // Validasi level (hanya 1, 2, 3)
  const isValidLevel = (level: string): level is Level => ["1", "2", "3"].includes(level);
  
  // Redirect jika belum login
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
    setToday(format(new Date(), "dd MMMM yyyy", { locale: localeId }));
  }, [user, userLoading, router]);

  const studentRef = useMemoFirebase(() => {
    if (!db || !studentId || !user) return null;
    return doc(db, "students", studentId);
  }, [db, studentId, user]);

  const { data: student, loading: sLoading, error: studentError } = useDoc(studentRef);

  if (!isValidLevel(rawLevel)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Parameter Tidak Valid</h2>
          <p className="text-red-600">Tingkat surat peringatan harus 1, 2, atau 3.</p>
        </div>
      </div>
    );
  }
  const level = rawLevel as Level;

  if (userLoading || sLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Data Bermasalah</h2>
          <p className="text-yellow-600">Siswa tidak ditemukan atau terjadi kesalahan data.</p>
          <Button asChild className="mt-4">
            <Link href="/students">Kembali ke Daftar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const school = {
    yayasan: "YAYASAN PERGURUAN ISLAM JAM'IYYATUL AULAD PALABUHANRATU",
    name: "SMKS JAMIYATUL AULAD",
    accreditation: "TERAKREDITASI - A",
    competencies: "KOMPETENSI KEAHLIAN: RPL - LP - TKR - DPB - DKV",
    nss: "402020623111",
    nis: "402111",
    npsn: "69752367",
    address: "Jalan Empang Raya Nomor 1 Palabuhanratu 43364 Kabupaten Sukabumi",
  };
  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";

  return (
    <div className="min-h-screen bg-neutral-100 p-4 print:bg-white print:p-0">
      {/* Control Panel */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/students/${studentId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Profil
          </Button>
        </Link>
        <div className="flex gap-3">
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center">
            Pratinjau SP-{level}
          </span>
          <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 shadow-md gap-2">
            <Printer className="h-4 w-4" /> Cetak Sekarang
          </Button>
        </div>
      </div>

      {/* Konten Surat - A4 Exact */}
      <article className="a4-page mx-auto bg-white shadow-2xl print:shadow-none print:border-none relative flex flex-col overflow-hidden">
        
        {/* Dekorasi Grafis Kop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/90 clip-path-triangle print:bg-primary" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
        
        <div className="p-[12mm] flex flex-col h-full">
          {/* Header / Kop */}
          <div className="flex items-start gap-4 mb-2">
            <div className="relative w-24 h-24 shrink-0">
              <Image src={logoUrl} alt="Logo" fill className="object-contain" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-tight mb-0.5">{school.yayasan}</h4>
              <h1 className="text-2xl font-black text-primary leading-none mb-1 tracking-tighter">{school.name}</h1>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold bg-neutral-800 text-white px-1.5 py-0.5 rounded">{school.accreditation}</span>
                <span className="text-[10px] font-bold uppercase text-neutral-700">{school.competencies}</span>
              </div>
              <p className="text-[9px] font-semibold text-neutral-500 mb-0.5">NSS: {school.nss} | NIS: {school.nis} | NPSN: {school.npsn}</p>
              <p className="text-[9px] font-medium italic text-neutral-400 border-t border-neutral-100 pt-1">{school.address}</p>
            </div>
          </div>

          <div className="h-[3px] bg-neutral-800 mb-[1px]" />
          <div className="h-[1px] bg-neutral-400 mb-6" />

          {/* Metadata & Tanggal */}
          <div className="flex justify-between items-start mb-6 text-[12px] font-serif">
            <div className="space-y-1">
              <div className="grid grid-cols-[80px_10px_1fr]">
                <span>Nomor</span><span>:</span><span className="font-bold">421.5 / {level} / SMK.S-JA / {new Date().getFullYear()}</span>
              </div>
              <div className="grid grid-cols-[80px_10px_1fr]">
                <span>Lampiran</span><span>:</span><span>-</span>
              </div>
              <div className="grid grid-cols-[80px_10px_1fr]">
                <span>Perihal</span><span>:</span><span className="font-bold underline uppercase tracking-wide">Surat Peringatan {level}</span>
              </div>
            </div>
            <div className="text-right">
              <p>Sukabumi, {today}</p>
            </div>
          </div>

          {/* Alamat Tujuan */}
          <div className="mb-6 text-[12px] font-serif leading-relaxed">
            <p className="font-bold">Kepada Yth.</p>
            <p className="font-bold">Orangtua / Wali Murid dari {student.name}</p>
            <p>di</p>
            <p className="ml-6 font-medium italic">Tempat</p>
          </div>

          {/* Isi Surat */}
          <div className="space-y-4 text-[13px] font-serif leading-relaxed flex-grow">
            <p className="italic font-semibold">Assalamu'alaikum warahmatullahi wabarakatuhu</p>
            
            <p className="text-justify">
              Dengan hormat, melalui surat ini pihak sekolah menyampaikan <strong>Surat Peringatan ke-{level} (SP-{level})</strong> kepada anak Bapak/Ibu, dengan identitas sebagai berikut:
            </p>

            <div className="ml-8 space-y-1 py-2 px-4 bg-neutral-50 border-l-4 border-primary/20">
              <div className="grid grid-cols-[140px_15px_1fr]">
                <span>Nama Lengkap</span><span>:</span><span className="font-bold uppercase tracking-wide">{student.name}</span>
              </div>
              <div className="grid grid-cols-[140px_15px_1fr]">
                <span>NISN / Kelas</span><span>:</span><span>{student.studentIdNumber} / <strong>{student.class}</strong></span>
              </div>
            </div>

            <p className="text-justify">
              Penerbitan surat ini didasari oleh akumulasi poin pelanggaran kedisiplinan yang telah melampaui ambang batas toleransi sekolah sebagaimana tercatat pada sistem informasi <strong>JAYA</strong>.
            </p>

            <div className="space-y-2">
              <p>Sehubungan dengan hal tersebut, kami menghimbau Bapak/Ibu untuk:</p>
              <ul className="list-decimal ml-10 space-y-1 font-medium">
                <li>Melakukan pembinaan intensif secara internal di lingkungan keluarga.</li>
                {level === "3" ? (
                  <li className="text-red-700 font-bold underline bg-red-50 p-1">
                    DIWAJIBKAN hadir ke sekolah untuk menemui Guru BK/Kepala Sekolah pada hari kerja berikutnya.
                  </li>
                ) : (
                  <li>Berkoordinasi aktif dengan Wali Kelas atau Guru Bimbingan Konseling (BK).</li>
                )}
                {level === "3" && (
                  <li className="font-bold text-red-800">
                    Siswa terancam dikembalikan secara permanen kepada orang tua jika tidak ada tindak lanjut segera.
                  </li>
                )}
              </ul>
            </div>

            <p className="text-justify pt-2">Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami haturkan terima kasih.</p>
            
            <p className="italic font-semibold">Wassalamu'alaikum warahmatullahi wabarakatuhu</p>
          </div>

          {/* Tanda Tangan */}
          <div className="mt-8 flex justify-end text-[13px] font-serif">
            <div className="text-center w-72 space-y-16">
              <div>
                <p>Kepala SMKS Jamiyatul Aulad</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold underline decoration-2 uppercase text-sm">Andriyana, S.Pd.I</p>
                <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">NRKS. 19023L013020241174472</p>
              </div>
            </div>
          </div>

          {/* Footer Clean */}
          <div className="mt-auto pt-6 flex justify-between items-center text-[10px] text-neutral-400 font-sans border-t border-neutral-100">
            <div className="flex gap-6 italic">
              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> jamiyyatulauladsmk@yahoo.com</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> www.smkjaya.sch.id</span>
            </div>
            <div className="font-bold uppercase tracking-widest opacity-30">Dokumen Resmi Sekolah</div>
          </div>
        </div>

        {/* Bar Bawah */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/90 print:bg-primary" />
      </article>

      <style jsx global>{`
        .a4-page {
          width: 210mm;
          height: 297mm;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body { 
            background: white !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .a4-page {
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            box-shadow: none !important;
          }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
