
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { AppShell } from "@/components/layout/app-shell";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, FileWarning, Search, Printer } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function SPReportsPage() {
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "students");
  }, [db, user]);

  const violationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "violations");
  }, [db, user]);

  const { data: students = [], loading: sLoading } = useCollection(studentsQuery);
  const { data: violations = [], loading: vLoading } = useCollection(violationsQuery);

  const studentsWithPoints = students.map(student => {
    const studentViolations = violations.filter(v => v.studentId === student.id);
    const totalPoints = studentViolations.reduce((acc, curr) => acc + (curr.points || 0), 0);
    
    let spLevel = 0;
    let spText = "Normal";
    let color = "bg-muted text-muted-foreground";

    if (totalPoints >= 500) {
      spLevel = 3;
      spText = "SP 3 (DO)";
      color = "bg-red-700 text-white hover:bg-red-800";
    } else if (totalPoints >= 300) {
      spLevel = 2;
      spText = "SP 2";
      color = "bg-red-500 text-white hover:bg-red-600";
    } else if (totalPoints >= 100) {
      spLevel = 1;
      spText = "SP 1";
      color = "bg-orange-500 text-white hover:bg-orange-600";
    }

    return {
      ...student,
      totalPoints,
      spLevel,
      spText,
      color
    };
  });

  const spRecipients = studentsWithPoints.filter(s => 
    s.spLevel > 0 && 
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.class?.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.totalPoints - a.totalPoints);

  if (userLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Laporan Surat Peringatan</h1>
            <p className="text-muted-foreground">Monitoring siswa yang melampaui ambang batas poin kedisiplinan.</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total SP 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {studentsWithPoints.filter(s => s.spLevel === 1).length} Siswa
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total SP 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                {studentsWithPoints.filter(s => s.spLevel === 2).length} Siswa
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-100 border-red-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Total SP 3 (DO)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-950">
                {studentsWithPoints.filter(s => s.spLevel === 3).length} Siswa
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card p-4 rounded-xl shadow-sm border print:hidden">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari siswa penerima SP..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Total Poin</TableHead>
                <TableHead className="text-center">Status Terbit</TableHead>
                <TableHead className="text-right print:hidden">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sLoading || vLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat data laporan...
                  </TableCell>
                </TableRow>
              ) : spRecipients.length > 0 ? (
                spRecipients.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold text-primary">
                      <Link href={`/students/${student.id}`} className="hover:underline">
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">
                      {student.totalPoints}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={student.color}>
                        {student.spText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        <Link href={`/students/${student.id}/sp/${student.spLevel}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            Lihat Surat
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileWarning className="w-8 h-8 opacity-20" />
                      <p>Tidak ada siswa yang mencapai ambang batas SP saat ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
