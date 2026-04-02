
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert,
  Users,
  Calendar,
  ChevronRight,
  PlusCircle,
  Loader2,
  History,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  Clock,
  FileText,
  Award,
  Download,
  RefreshCw,
  School,
  ArrowUpRight,
  Target
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser } from "@/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

// Helper to format date for chart
const getMonthName = (date: Date) => {
  return date.toLocaleString("id-ID", { month: "short", year: "numeric" });
};

const COLORS = ['#1e40af', '#0891b2', '#0d9488', '#4f46e5', '#7c3aed', '#db2777'];

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
    return query(collection(db, "violations"), orderBy("date", "desc"));
  }, [db, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "students");
  }, [db, user]);

  const recentViolationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "violations"), orderBy("date", "desc"), limit(6));
  }, [db, user]);

  const { data: allViolations = [], loading: vLoading } = useCollection(violationsQuery);
  const { data: students = [], loading: sLoading } = useCollection(studentsQuery);
  const { data: recentViolations = [] } = useCollection(recentViolationsQuery);

  // Compute monthly violations
  const monthlyViolations = useMemo(() => {
    if (!allViolations.length) return [];
    const months: { [key: string]: number } = {};
    allViolations.forEach((v) => {
      if (v.date) {
        const date = new Date(v.date);
        const monthKey = getMonthName(date);
        months[monthKey] = (months[monthKey] || 0) + 1;
      }
    });
    return Object.entries(months)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-6);
  }, [allViolations]);

  // Compute violations per class
  const classBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allViolations.forEach((v) => {
      const cls = v.studentClass || "Tanpa Kelas";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allViolations]);

  // Compute top offenders
  const topOffenders = useMemo(() => {
    const pointsMap = new Map();
    allViolations.forEach((v) => {
      const studentId = v.studentId;
      if (studentId) {
        const points = v.points || 0;
        pointsMap.set(studentId, (pointsMap.get(studentId) || 0) + points);
      }
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return Array.from(pointsMap.entries())
      .map(([id, totalPoints]) => ({
        id,
        name: studentMap.get(id)?.name || "Tidak diketahui",
        class: studentMap.get(id)?.class || "-",
        totalPoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5);
  }, [allViolations, students]);

  // Stats
  const totalViolations = allViolations.length;
  const totalStudents = students.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayViolations = allViolations.filter((v) => v.date === today).length;
  const highRiskCount = topOffenders.filter(s => s.totalPoints >= 100).length;

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
      <div className="space-y-8 pb-10">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-primary uppercase">
              Dashboard <span className="text-foreground">JAYA</span>
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem aktif untuk <span className="text-foreground font-bold">{user.displayName || user.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="rounded-xl font-bold bg-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Link href="/violations/new">
              <Button className="bg-primary hover:bg-primary/90 shadow-xl px-6 rounded-xl font-black transition-all hover:scale-[1.02] active:scale-95">
                <PlusCircle className="mr-2 h-5 w-5" />
                INPUT PELANGGARAN
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Insiden" 
            value={totalViolations} 
            icon={ShieldAlert} 
            color="text-red-600" 
            bg="bg-red-50" 
            description="Semua catatan"
          />
          <StatCard 
            title="Pelanggaran Hari Ini" 
            value={todayViolations} 
            icon={Calendar} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            description="Input 24 jam terakhir"
          />
          <StatCard 
            title="Siswa Terdaftar" 
            value={totalStudents} 
            icon={GraduationCap} 
            color="text-emerald-600" 
            bg="bg-emerald-50" 
            description="Total database siswa"
          />
          <StatCard 
            title="Siswa Kritis (SP)" 
            value={highRiskCount} 
            icon={AlertTriangle} 
            color="text-amber-600" 
            bg="bg-amber-50" 
            description="Poin melampaui 100+"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Activity List */}
          <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 bg-muted/20 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <History className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  Aktivitas Terbaru
                </CardTitle>
              </div>
              <Link href="/violations">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary group">
                  LIHAT SEMUA <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {vLoading || sLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground opacity-20" />
                  </div>
                ) : recentViolations.length > 0 ? (
                  recentViolations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-5 hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center font-black text-primary shrink-0 border border-primary/10">
                          {v.studentName ? v.studentName[0].toUpperCase() : "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-black text-sm text-foreground truncate">{v.studentName}</p>
                            <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 border-none bg-muted/60">
                              {v.studentClass}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 italic mb-1">
                            "{v.description}"
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {v.date}</span>
                            <span className="text-primary/70">{v.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs">
                          +{v.points || 0}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-muted-foreground font-medium italic">
                    Belum ada data aktivitas tersedia.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & High Risk */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] px-2">Aksi Cepat</h3>
            <div className="grid grid-cols-1 gap-4">
              <ActionItem 
                href="/violations/new" 
                title="Input Insiden" 
                desc="Catat pelanggaran baru" 
                icon={PlusCircle} 
                color="bg-red-600" 
              />
              <ActionItem 
                href="/students" 
                title="Cari Siswa" 
                desc="Cek riwayat per-individu" 
                icon={Users} 
                color="bg-blue-600" 
              />
              <ActionItem 
                href="/sp-reports" 
                title="Monitor SP" 
                desc="Status ambang batas poin" 
                icon={Target} 
                color="bg-amber-600" 
              />
              <ActionItem 
                href="/classes" 
                title="Data Kelas" 
                desc="Rekapitulasi per-ruangan" 
                icon={School} 
                color="bg-emerald-600" 
              />
            </div>

            {/* High Risk Card */}
            <Card className="border-none bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/10 text-white border-none font-bold uppercase tracking-widest text-[9px]">
                    Atensi Utama
                  </Badge>
                  <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-lg font-black leading-tight">BUTUH TINDAKAN</h4>
                  <p className="text-xs text-white/60 font-medium">Siswa dengan poin tertinggi hari ini</p>
                </div>
                <div className="space-y-2">
                  {topOffenders.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-xl">
                      <span className="font-bold truncate max-w-[120px]">{s.name}</span>
                      <span className="font-black text-amber-400">{s.totalPoints} PTS</span>
                    </div>
                  ))}
                </div>
                <Link href="/sp-reports" className="block pt-2">
                  <Button variant="outline" className="w-full h-10 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10 font-bold text-xs uppercase">
                    Proses Sekarang
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart: Monthly Trends */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Tren Bulanan</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-bold">Terakhir 6 Bulan</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                {monthlyViolations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyViolations}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700}}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="total" fill="#1e40af" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                    Belum ada data untuk ditampilkan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart: Class Breakdown */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Target className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Pelanggaran per Kelas</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 font-bold">Top 5 Fokus</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                {classBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700}}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {classBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                    Belum ada data untuk ditampilkan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, description }: any) {
  return (
    <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden group hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500", bg)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">{title}</p>
            <h3 className="text-3xl font-black tracking-tighter leading-none">{value}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItem({ href, title, desc, icon: Icon, color }: any) {
  return (
    <Link href={href} className="group">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-transparent shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
        <div className={cn("p-3 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight uppercase leading-none mb-1">{title}</p>
          <p className="text-[10px] text-muted-foreground font-bold tracking-wide">{desc}</p>
        </div>
        <ArrowUpRight className="ml-auto w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
      </div>
    </Link>
  );
}
