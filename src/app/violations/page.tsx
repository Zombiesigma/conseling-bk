
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MoreHorizontal,
  Eye,
  Printer,
  Loader2,
  FileWarning
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";

export default function ViolationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
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
    // Menggunakan query sederhana untuk menghindari error index yang sering muncul sebagai Permission Error
    return collection(db, "violations");
  }, [db, user]);

  const { data: violations = [], loading } = useCollection(violationsQuery);

  const filteredViolations = violations
    .filter(v => 
      (v.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (v.type?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (v.studentClass?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePrint = () => {
    window.print();
  };

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Daftar Pelanggaran</h1>
            <p className="text-muted-foreground">Kelola dan tinjau seluruh catatan pelanggaran siswa.</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" className="flex items-center gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Cetak Data
            </Button>
            <Link href="/violations/new">
              <Button className="bg-primary hover:bg-primary/90">Catat Pelanggaran</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama siswa, kelas, atau jenis pelanggaran..." 
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
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jenis Pelanggaran</TableHead>
                <TableHead>Tindakan</TableHead>
                <TableHead className="text-right print:hidden">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memuat data pelanggaran...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredViolations.length > 0 ? (
                filteredViolations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.date}</TableCell>
                    <TableCell>
                      <Link href={`/students/${v.studentId}`} className="font-semibold text-primary hover:underline">
                        {v.studentName || "Siswa"}
                      </Link>
                    </TableCell>
                    <TableCell>{v.studentClass || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                        {v.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{v.actionTaken || "-"}</span>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/students/${v.studentId}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" /> Lihat Profil Siswa
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileWarning className="w-8 h-8 opacity-20" />
                      <p>Tidak ada data pelanggaran ditemukan.</p>
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
