
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
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
  const { user } = useUser();
  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";
  const backgroundUrl = "https://jurnalsukabumi.com/wp-content/uploads/2025/10/IMG-20251009-WA0012.jpg";
  const schoolImage = PlaceHolderImages.find(img => img.id === "school-preview");

  return (
    <div className="min-h-screen bg-background flex flex-col font-body selection:bg-primary/20">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 group">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors" />
              <div className="relative bg-white rounded-xl p-1.5 border shadow-sm flex items-center justify-center h-full w-full">
                <Image src={logoUrl} alt="JAYA Logo" fill className="object-contain p-1" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl text-primary tracking-tighter">JAYA</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Integrated System</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="default" className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="rounded-full px-6 border-primary/20 hover:bg-primary/5 transition-all text-primary font-semibold">
                  <LogIn className="mr-2 h-4 w-4" /> Masuk Staf
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 px-4 overflow-hidden min-h-[80vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={backgroundUrl} 
            alt="School Background" 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs md:text-sm font-bold mb-4 border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="uppercase tracking-widest text-accent">SMKS PK JAMIYATUL AULAD</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight text-white leading-[1.1] md:leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-2xl">
            Transformasi <br />
            <span className="text-accent italic inline-block relative">
              Kedisiplinan
              <div className="absolute -bottom-2 left-0 w-full h-2 bg-accent/20 rounded-full -rotate-1" />
            </span> <br className="hidden md:block" />
            Masa Depan.
          </h1>
          
          <p className="text-lg md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200 drop-shadow-md">
            Platform manajemen BK terpadu untuk pencatatan, pemantauan, dan pembinaan karakter siswa yang presisi dan transparan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-80 h-16 text-lg rounded-2xl shadow-2xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all font-bold group border-none">
                  Lanjutkan ke Dashboard
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-80 h-16 text-lg rounded-2xl shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold group border-none">
                  Mulai Sekarang
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card relative z-10 border-y shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Fitur Unggulan JAYA</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ShieldCheck}
              title="Keamanan Data"
              description="Sistem autentikasi berlapis memastikan data siswa hanya dapat diakses oleh pihak berwenang."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Analisis Real-time"
              description="Pantau tren kedisiplinan per-kelas atau per-jurusan secara instan melalui dashboard informatif."
              color="bg-primary"
            />
            <FeatureCard 
              icon={FileWarning}
              title="Automasi SP"
              description="Penerbitan Surat Peringatan otomatis berdasarkan ambang batas poin yang telah ditentukan."
              color="bg-accent"
            />
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
              Membangun Integritas <br className="hidden md:block" /> 
              Tanpa Kompromi.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              JAYA diciptakan untuk memudahkan Guru BK dan Wali Kelas dalam menjalankan tugas administratif kedisiplinan, memberikan waktu lebih banyak untuk fokus pada pembinaan karakter siswa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CheckItem text="Transparansi data poin BK" />
              <CheckItem text="Riwayat kronologi akurat" />
              <CheckItem text="Format dokumen resmi" />
              <CheckItem text="Manajemen kelas terpadu" />
            </div>
          </div>
          <div className="flex-1 w-full max-w-2xl relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-90 group-hover:scale-100 transition-transform duration-700" />
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-card">
              <Image 
                src={schoolImage?.imageUrl || "https://assets.pikiran-rakyat.com/crop/0x0:0x0/1200x675/photo/2025/07/21/526973113.jpg"} 
                alt="School Showcase" 
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-1000"
                data-ai-hint="school campus"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="font-bold text-xl">Kampus SMKS PK Jamiyatul Aulad</p>
                  <p className="text-sm opacity-80">Pusat Keunggulan Kedisiplinan & Prestasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Siap Memulai Perubahan?</h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Bergabunglah dengan ekosistem JAYA untuk mewujudkan sekolah yang lebih tertib, aman, dan berkarakter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={user ? "/dashboard" : "/login"}>
                  <Button size="lg" variant="secondary" className="h-16 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-black/10 hover:shadow-black/20 transition-all w-full sm:w-auto">
                    Masuk ke Sistem <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="relative w-8 h-8">
                <Image src={logoUrl} alt="JAYA Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-2xl text-primary tracking-tighter">JAYA</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs">
              Sistem Informasi Kedisiplinan Terintegrasi <br />
              SMKS PK JAMIYATUL AULAD
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-4">Lokasi</h4>
            <p className="text-sm text-muted-foreground">Jalan Empang Raya Nomor 1</p>
            <p className="text-sm text-muted-foreground">Palabuhanratu, Kab. Sukabumi</p>
            <p className="text-sm text-muted-foreground font-bold">Jawa Barat 43364</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-4">Kontak</h4>
            <p className="text-sm text-muted-foreground italic">jamiyyatulauladsmk@yahoo.com</p>
            <p className="text-sm text-muted-foreground">www.smkjaya.sch.id</p>
            <div className="pt-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.3em]">
                &copy; {new Date().getFullYear()} JAYA INTEGRATED SYSTEM
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="p-10 bg-card rounded-[2.5rem] border shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity", color)} />
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner transition-colors", color, "bg-opacity-10 text-primary group-hover:bg-opacity-100 group-hover:text-white")}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-foreground/80">{text}</span>
    </div>
  );
}
