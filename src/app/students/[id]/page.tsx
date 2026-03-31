
"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ShieldAlert,
  Clock,
  ArrowLeft,
  Printer,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2,
  Trash2,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDoc, useCollection, useFirestore, useUser } from "@/firebase";
import { doc, collection, query, where, deleteDoc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const studentRef = useMemoFirebase(() => {
    if (!db || !studentId || !user) return null;
    return doc(db, "students", studentId);
  }, [db, studentId, user]);

  const violationsQuery = useMemoFirebase(() => {
    if (!db || !studentId || !user) return null;
    return query(
      collection(db, "violations"), 
      where("studentId", "==", studentId)
    );
  }, [db, studentId, user]);

  const { data: student, loading: sLoading } = useDoc(studentRef);
  const { data: rawViolations = [], loading: vLoading } = useCollection(violationsQuery);

  const violations = useMemo(() => {
    return [...rawViolations].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [rawViolations]);

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteViolation = async (violationId: string, type: string) => {
    if (!db) return;
    
    // SISTEM KONFIRMASI: Memastikan tindakan sengaja dilakukan
    const isConfirmed = window.confirm(
      `KONFIRMASI PENGHAPUSAN\n\n` +
      `Apakah Anda yakin ingin menghapus catatan pelanggaran "${type}"?\n` +
      `Akumulasi poin siswa ini akan berkurang secara permanen.`
    );
    
    if (!isConfirmed) return;

    setIsProcessing(true);
    const docRef = doc(db, "violations", violationId);
    
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Berhasil Dihapus",
          description: "Catatan pelanggaran telah dihapus dari riwayat siswa.",
        });
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsProcessing(false);
        // Safety cleanup untuk pointer events
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = 'auto';
        }
      });
  };

  const totalPoints = violations.reduce((acc, curr) => acc + (curr.points || 0), 0);
  
  const spStatus = {
    level: 0,
    text: "Status Baik",
    color: "bg-green-500",
    description: "Siswa menunjukkan perilaku disiplin."
  };

  if (totalPoints >= 500) {
    spStatus.level = 3;
    spStatus.text = "SP 3 (DO)";
    spStatus.color = "bg-red-700";
    spStatus.description = "Batas maksimal poin terlampaui. Siswa dikembalikan ke orang tua.";
  } else if (totalPoints >= 300) {
    spStatus.level = 2;
    spStatus.text = "Surat Peringatan 2";
    spStatus.color = "bg-red-500";
    spStatus.description = "Akumulasi poin kritis. Diperlukan tindakan serius.";
  } else if (totalPoints >= 100) {
    spStatus.level = 1;
    spStatus.text = "Surat Peringatan 1";
    spStatus.color = "bg-orange-500";
    spStatus.description = "Siswa telah melampaui batas toleransi awal.";
  }

  const progressValue = Math.min((totalPoints / 500) * 100, 100);

  if (userLoading || sLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

  if (!student) {
    return (
      <AppShell>
        <div className="text-center py-20 bg-card rounded-xl border border-dashed">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Siswa tidak ditemukan</h2>
          <p className="text-muted-foreground mb-6">Data siswa mungkin telah dihapus atau ID tidak valid.</p>
          <Link href="/students">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke daftar
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 print:m-0 print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/students">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">{student.name}</h1>
              <p className="text-muted-foreground">Profil kedisiplinan dan rekam jejak poin.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Cetak Profil
            </Button>
            <Link href="/violations/new">
              <Button className="bg-primary">
                Catat Pelanggaran
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-card">
              <div className="h-24 bg-primary relative">
                <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl bg-card border-2 border-card flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-primary/5 rounded-lg flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
              <CardContent className="pt-10 p-6">
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-sm text-muted-foreground">{student.class} • NISN: {student.studentIdNumber}</p>
                
                <div className="mt-8 space-y-4">
                  <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-muted-foreground">Akumulasi Poin</span>
                      <span className="text-2xl font-bold text-primary">{totalPoints} <span className="text-xs font-normal text-muted-foreground">/ 500</span></span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", spStatus.color)} />
                      <span className="text-xs font-bold uppercase tracking-wider">{spStatus.text}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{spStatus.description}</p>
                  </div>

                  {spStatus.level > 0 && (
                    <div className="grid grid-cols-1 gap-2 print:hidden">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Dokumen Peringatan Tersedia:</p>
                      {spStatus.level >= 1 && (
                        <Link href={`/students/${studentId}/sp/1`}>
                          <Button variant="outline" className="w-full justify-start border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
                            <FileText className="mr-2 h-4 w-4" /> Cetak SP 1 (100+ Poin)
                          </Button>
                        </Link>
                      )}
                      {spStatus.level >= 2 && (
                        <Link href={`/students/${studentId}/sp/2`}>
                          <Button variant="outline" className="w-full justify-start border-red-200 text-red-700 bg-red-50 hover:bg-red-100">
                            <FileText className="mr-2 h-4 w-4" /> Cetak SP 2 (300+ Poin)
                          </Button>
                        </Link>
                      )}
                      {spStatus.level >= 3 && (
                        <Link href={`/students/${studentId}/sp/3`}>
                          <Button variant="outline" className="w-full justify-start border-red-700 text-red-700 bg-red-50 hover:bg-red-100">
                            <FileText className="mr-2 h-4 w-4" /> Cetak SP 3 (500+ Poin)
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Info Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jenis Kelamin</span>
                  <span className="font-semibold">{student.gender}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kehadiran Terakhir</span>
                  <span className="font-semibold">Aktif</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-card h-full">
              <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Kronologi Pelanggaran
                </CardTitle>
                <div className="text-xs font-medium text-muted-foreground">
                  Total: {violations.length} Kejadian
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {vLoading ? (
                  <div className="flex justify-center py-20"><Clock className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : violations.length > 0 ? (
                  <div className="space-y-6">
                    {violations.map((v) => (
                      <div key={v.id} className="flex gap-4 p-4 rounded-xl bg-muted/10 border group hover:border-primary/30 transition-colors relative">
                        <div className="shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex flex-col items-center justify-center border border-red-100">
                            <span className="text-lg font-bold">+{v.points || 0}</span>
                            <span className="text-[8px] uppercase font-bold">Poin</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{v.type}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {format(new Date(v.date), "dd/MM/yyyy")}
                              </span>
                              
                              {/* Dropdown Aksi untuk menghapus */}
                              <div className="print:hidden">
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      className="text-destructive font-semibold"
                                      onClick={() => handleDeleteViolation(v.id, v.type)}
                                      disabled={isProcessing}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Hapus Catatan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{v.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-normal py-0">
                              {v.actionTaken || "Teguran"}
                            </Badge>
                            {v.counselorNotes && (
                              <span className="text-[10px] italic text-muted-foreground truncate">
                                "{v.counselorNotes}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                    <h3 className="font-bold text-lg">Catatan Bersih</h3>
                    <p className="text-muted-foreground text-sm">Siswa ini tidak memiliki catatan pelanggaran.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
