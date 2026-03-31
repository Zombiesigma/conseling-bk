
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  PlusCircle,
  Loader2,
  History,
  Zap,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const violationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "violations"), orderBy("date", "desc"), limit(5));
  }, [db, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "students");
  }, [db, user]);

  const { data: violations = [], loading: vLoading } = useCollection(violationsQuery);
  const { data: students = [], loading: sLoading } = useCollection(studentsQuery);

  const stats = [
    { 
      name: "Total Insiden", 
      value: vLoading ? "..." : violations.length, 
      icon: ShieldAlert, 
      color: "text-red-600", 
      bg: "bg-red-50",
      description: "Pelanggaran tercatat"
    },
    { 
      name: "Siswa Bermasalah", 
      value: vLoading ? "..." : Array.from(new Set(violations.map(v => v.studentId))).length, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      description: "Individu terpantau"
    },
    { 
      name: "Total Siswa", 
      value: sLoading ? "..." : students.length, 
      icon: GraduationCap, 
      color: "text-primary", 
      bg: "bg-primary/5",
      description: "Siswa terdaftar"
    },
    { 
      name: "Status Sistem", 
      value: "Aktif", 
      icon: Zap, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      description: "Terhubung Cloud"
    },
  ];

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-primary">DASHBOARD UTAMA</h1>
            <p className="text-muted-foreground font-medium">
              Selamat datang kembali, <span className="text-foreground font-bold">{user.displayName || user.email}</span>.
            </p>
          </div>
          <Link href="/violations/new">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg px-6 py-6 rounded-xl font-bold transition-all hover:scale-105">
              <PlusCircle className="mr-2 h-5 w-5" />
              CATAT PELANGGARAN
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-card group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.name}</p>
                    <h3 className="text-2xl font-black mt-0.5">{stat.value}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Aktivitas Terbaru</CardTitle>
              </div>
              <Link href="/violations" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                LIHAT SEMUA <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {(vLoading || sLoading) ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : violations.length > 0 ? (
                  violations.map((v) => (
                    <div key={v.id} className="flex items-start justify-between p-5 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/20 shadow-sm">
                          {v.studentName ? v.studentName[0].toUpperCase() : "?"}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-foreground truncate">{v.studentName || "Siswa"}</p>
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 uppercase bg-muted/50 border-none text-muted-foreground font-bold">
                              {v.studentClass}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 italic">
                            "{v.description}"
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            <span>{v.date}</span>
                            <span>•</span>
                            <span className="text-primary/70">{v.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 ml-4">
                        <Badge variant="outline" className="border-red-200 text-red-600 font-black text-[10px] bg-red-50 px-1.5 py-0">
                          +{v.points || 0} PTS
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-medium italic">
                    Belum ada data aktivitas terbaru.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Aksi Cepat</h3>
            <div className="grid grid-cols-1 gap-4">
              <QuickActionCard 
                href="/violations/new" 
                title="Input Pelanggaran" 
                description="Catat insiden baru hari ini" 
                icon={PlusCircle} 
                color="bg-red-600"
              />
              <QuickActionCard 
                href="/students" 
                title="Manajemen Siswa" 
                description="Cek riwayat per-individu" 
                icon={Users} 
                color="bg-blue-600"
              />
              <QuickActionCard 
                href="/sp-reports" 
                title="Monitor SP" 
                description="Status ambang batas poin" 
                icon={ShieldAlert} 
                color="bg-amber-600"
              />
              <QuickActionCard 
                href="/classes" 
                title="Data Kelas" 
                description="Rekapitulasi per-ruangan" 
                icon={GraduationCap} 
                color="bg-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function QuickActionCard({ href, title, description, icon: Icon, color }: any) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-transparent shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
        <div className={cn("p-3 rounded-xl text-white shadow-lg shadow-black/5 transition-transform group-hover:scale-110", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight uppercase">{title}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
    </Link>
  );
}
