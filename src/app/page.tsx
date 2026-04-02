"use client";

import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Users,
  FileWarning,
  LogIn,
  ChevronRight,
  School,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
  const { user } = useUser();
  const logoUrl =
    "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";
  const backgroundUrl =
    "https://jurnalsukabumi.com/wp-content/uploads/2025/10/IMG-20251009-WA0012.jpg";
  const schoolImage = PlaceHolderImages.find(
    (img) => img.id === "school-preview"
  );

  // efek random biar gak kaku (opsional)
  const randomGradient = "from-black/70 via-black/50 to-background";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation - lebih sederhana */}
      <nav className="border-b bg-white/90 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src={logoUrl}
                alt="JAYA Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-xl text-primary">JAYA</span>
              <span className="text-[10px] text-muted-foreground ml-1">
               
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full px-4"
                >
                  Dashboard <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary/30 text-primary"
                >
                  <LogIn className="mr-1 h-3 w-3" /> Masuk Staf
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - tanpa animasi berlebihan */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 overflow-hidden">
        {/* Background Image dengan overlay lebih gelap */}
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundUrl}
            alt="School Background"
            fill
            className="object-cover"
            priority
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b ${randomGradient}`}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            <span className="text-yellow-300">●</span> SMKS PK JAMIYATUL AULAD
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
            Transformasi <br />
            <span className="text-yellow-300 italic">Kedisiplinan</span> <br />
            Masa Depan.
          </h1>

          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto px-2">
            Catat, pantau, dan bina karakter siswa dengan sistem BK terpadu
            yang gampang dipakai dan transparan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-64 h-12 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
                >
                  Lanjut ke Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-64 h-12 rounded-xl bg-primary text-white font-bold"
                >
                  Mulai Sekarang
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid - lebih sederhana, tanpa efek blur berlebihan */}
      <section className="py-16 bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Fitur Andalan JAYA
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-2 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <ShieldCheck className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Keamanan Data</h3>
              <p className="text-gray-600 text-sm">
                Login aman, data siswa cuma bisa diakses oleh guru BK dan wali
                kelas.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <BarChart3 className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Analisis Real-time</h3>
              <p className="text-gray-600 text-sm">
                Lihat tren pelanggaran per kelas atau per jurusan langsung dari
                dashboard.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <FileWarning className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Automasi SP</h3>
              <p className="text-gray-600 text-sm">
                Surat peringatan terbit otomatis kalau poin siswa sudah
                melebihi batas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section - lebih sederhana, tanpa efek blur besar */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl font-bold leading-tight">
              Membangun Integritas <br /> Tanpa Ribet.
            </h2>
            <p className="text-gray-600 leading-relaxed">
              JAYA dirancang biar guru BK dan wali kelas nggak pusing ngurus
              administrasi. Fokus aja ke pembinaan karakter siswa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Data poin transparan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Riwayat lengkap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Dokumen resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Manajemen kelas terpadu</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border">
              <Image
                src={
                  schoolImage?.imageUrl ||
                  "https://assets.pikiran-rakyat.com/crop/0x0:0x0/1200x675/photo/2025/07/21/526973113.jpg"
                }
                alt="Gedung sekolah"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white font-semibold">
                  SMKS PK Jamiyatul Aulad
                </p>
                <p className="text-white/80 text-xs">
                  Pusat Keunggulan Berbasis Pesantren
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - tanpa efek blur besar */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-primary rounded-3xl p-10 text-center text-white shadow-lg">
            <h2 className="text-3xl font-bold">Siap Mulai?</h2>
            <p className="text-white/90 mt-2 max-w-md mx-auto">
              Gabung sekarang dan bawa sekolahmu jadi lebih tertib & berkarakter.
            </p>
            <div className="mt-6">
              <Link href={user ? "/dashboard" : "/login"}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-xl font-semibold"
                >
                  Masuk ke Sistem <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - sederhana */}
      <footer className="bg-gray-100 border-t py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="relative w-6 h-6">
                <Image src={logoUrl} alt="JAYA Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-xl text-primary">JAYA</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sistem Informasi Kedisiplinan <br />
              SMKS PK JAMIYATUL AULAD
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-primary">
              Lokasi
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Jalan Empang Raya No.1 <br />
              Palabuhanratu, Sukabumi <br />
              Jawa Barat 43364
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-primary">
              Kontak
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              jamiyyatulauladsmk@yahoo.com <br />
              www.smkjaya.sch.id
            </p>
            <p className="text-[10px] text-gray-400 mt-4">
              © {new Date().getFullYear()} JAYA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
