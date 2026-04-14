"use client";

import { useState, useEffect, useMemo } from "react";
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
  FileWarning,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  TrendingUp,
  Filter,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ViolationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingViolation, setEditingViolation] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    type: "",
    points: 0,
    description: "",
    actionTaken: ""
  });

  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

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

  const typesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "violationTypes"), orderBy("name", "asc"));
  }, [db, user]);

  const { data: violations = [], loading: vLoading } = useCollection(violationsQuery);
  const { data: students = [] } = useCollection(studentsQuery);
  const { data: violationTypes = [] } = useCollection(typesQuery);

  const classOptions = useMemo(() => {
    const classes = students.map(s => s.class).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [students]);

  const typeOptions = useMemo(() => {
    return violationTypes.map(t => t.name).sort();
  }, [violationTypes]);

  const filteredViolations = useMemo(() => {
    let filtered = [...violations];

    if (searchTerm) {
      filtered = filtered.filter(v => 
        (v.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (v.studentClass?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (v.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass !== "all") {
      filtered = filtered.filter(v => v.studentClass === selectedClass);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(v => v.type === selectedType);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(v => {
        const violationDate = new Date(v.date);
        return violationDate.toString() !== "Invalid Date" && violationDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(v => {
        const violationDate = new Date(v.date);
        return violationDate.toString() !== "Invalid Date" && violationDate <= end;
      });
    }

    return filtered;
  }, [violations, searchTerm, selectedClass, selectedType, startDate, endDate]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedType, startDate, endDate]);

  const totalPoints = useMemo(() => filteredViolations.reduce((acc, v) => acc + (v.points || 0), 0), [filteredViolations]);
  const monthIncidents = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return filteredViolations.filter(v => {
      const d = new Date(v.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [filteredViolations]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const headers = ["Tanggal", "Nama Siswa", "Kelas", "Jenis Pelanggaran", "Poin", "Tindakan", "Deskripsi"];
    const rows = filteredViolations.map(v => [
      v.date || "",
      v.studentName || "",
      v.studentClass || "",
      v.type || "",
      v.points || 0,
      v.actionTaken || "",
      v.description || ""
    ]);

    const escapeCSV = (cell: any) => {
      const str = String(cell || "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Data_Pelanggaran_JAYA_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Berhasil", description: "Laporan CSV telah diunduh." });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = "Rekap Daftar Pelanggaran JAYA";
    const subtitle = `Tanggal: ${new Date().toLocaleDateString("id-ID")} | Total Insiden: ${filteredViolations.length}`;

    doc.setFontSize(16);
    doc.text(title, 40, 50);
    doc.setFontSize(10);
    doc.text(subtitle, 40, 70);

    const headers = [["Tanggal", "Nama Siswa", "Kelas", "Jenis Pelanggaran", "Poin", "Tindakan"]];
    const rows = filteredViolations.map(v => [
      v.date || "-",
      v.studentName || "-",
      v.studentClass || "-",
      v.type || "-",
      `+${v.points || 0}`,
      v.actionTaken || "-"
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 90,
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 4, halign: "left" as const },
      columnStyles: {
        4: { halign: "center" as const },
      },
      margin: { left: 40, right: 40 }
    });

    doc.save(`Rekap_Pelanggaran_JAYA_${new Date().getTime()}.pdf`);
    toast({ title: "Berhasil", description: "Laporan PDF telah diunduh." });
  };

  const handleEditClick = (violation: any) => {
    setEditingViolation(violation);
    setEditForm({
      date: violation.date,
      type: violation.type,
      points: violation.points || 0,
      description: violation.description || "",
      actionTaken: violation.actionTaken || ""
    });
    setIsEditOpen(true);
  };

  const handleUpdateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingViolation) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "violations", editingViolation.id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Berhasil", description: "Data telah diperbarui." });
      setIsEditOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui data." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteViolation = async (id: string) => {
    if (!confirm("Hapus catatan ini secara permanen?")) return;
    if (!db) return;
    try {
      await deleteDoc(doc(db, "violations", id));
      toast({ title: "Dihapus", description: "Catatan pelanggaran telah dihapus." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus data." });
    }
  };

  if (userLoading || vLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary uppercase">DAFTAR PELANGGARAN</h1>
            <p className="text-muted-foreground font-medium">Rekapitulasi seluruh insiden kedisiplinan siswa JAYA.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-white rounded-xl font-bold">
              <Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Ekspor CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-white rounded-xl font-bold">
              <Download className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Ekspor PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white rounded-xl font-bold">
              <Printer className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Cetak</span>
            </Button>
            <Link href="/violations/new">
              <Button size="sm" className="bg-primary shadow-lg font-black rounded-xl">Input Insiden</Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard icon={ShieldAlert} label="Total Insiden" value={filteredViolations.length} color="text-red-600" bg="bg-red-50" />
          <SummaryCard icon={TrendingUp} label="Akumulasi Poin" value={totalPoints} color="text-blue-600" bg="bg-blue-50" />
          <SummaryCard icon={Calendar} label="Insiden Bulan Ini" value={monthIncidents} color="text-emerald-600" bg="bg-emerald-50" />
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-3xl shadow-sm border border-muted/50 print:hidden">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Cari nama, kelas, atau jenis..."
                className="pl-11 h-12 bg-muted/20 border-none focus-visible:ring-primary rounded-2xl text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 bg-muted/20 border-none rounded-2xl text-sm">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classOptions.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 bg-muted/20 border-none rounded-2xl text-sm">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {typeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              {(searchTerm || selectedClass !== "all" || selectedType !== "all" || startDate || endDate) && (
                <Button variant="ghost" onClick={() => { setSearchTerm(""); setSelectedClass("all"); setSelectedType("all"); setStartDate(""); setEndDate(""); }} className="h-12 w-12 p-0 rounded-2xl hover:bg-destructive/10 text-destructive">
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 bg-muted/20 border-none rounded-2xl text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 bg-muted/20 border-none rounded-2xl text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="h-12 rounded-2xl w-full"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Hapus Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-card rounded-3xl shadow-sm border border-muted/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6 py-4">Tanggal</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Siswa</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Kategori</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Poin</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest hidden md:table-cell">Tindakan</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-6 print:hidden">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedViolations.length > 0 ? (
                paginatedViolations.map((v) => (
                  <TableRow key={v.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="text-sm font-bold">{v.date}</div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${v.studentId}`} className="block group/link">
                        <div className="text-sm font-black text-primary group-hover/link:underline">{v.studentName}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{v.studentClass}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        {v.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black text-red-600">
                      +{v.points || 0}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium text-muted-foreground hidden md:table-cell">
                      {v.actionTaken || "-"}
                    </TableCell>
                    <TableCell className="text-right pr-6 print:hidden">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted border opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-none p-1">
                          <DropdownMenuItem asChild className="rounded-lg gap-2 cursor-pointer">
                            <Link href={`/students/${v.studentId}`}>
                              <Eye className="w-4 h-4 text-blue-600" /> Profil Siswa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(v)} className="rounded-lg gap-2 cursor-pointer">
                            <Pencil className="w-4 h-4 text-amber-600" /> Edit Insiden
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteViolation(v.id)} className="rounded-lg gap-2 cursor-pointer text-destructive">
                            <Trash2 className="w-4 h-4" /> Hapus Catatan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <FileWarning className="w-16 h-16 mb-4" />
                      <p className="font-black text-lg uppercase tracking-tighter">Data Tidak Ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5 print:hidden">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Halaman {currentPage} / {totalPages} • {filteredViolations.length} Data
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="rounded-xl h-9 px-4 font-bold border-muted-foreground/20">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="rounded-xl h-9 px-4 font-bold border-muted-foreground/20">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
          <form onSubmit={handleUpdateViolation}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">Edit Insiden</DialogTitle>
              <DialogDescription className="font-medium">Perbarui rincian pelanggaran dan bobot poin.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Tanggal</Label>
                <Input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} required className="h-11 rounded-xl bg-muted/20 border-none" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Jenis Pelanggaran</Label>
                <Select value={editForm.type} onValueChange={(val) => setEditForm({...editForm, type: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Poin</Label>
                <Input type="number" value={editForm.points} onChange={(e) => setEditForm({...editForm, points: parseInt(e.target.value) || 0})} required className="h-11 rounded-xl bg-muted/20 border-none" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Deskripsi</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={3} className="rounded-xl bg-muted/20 border-none resize-none" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Tindakan</Label>
                <Input value={editForm.actionTaken} onChange={(e) => setEditForm({...editForm, actionTaken: e.target.value})} className="h-11 rounded-xl bg-muted/20 border-none" />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t pt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black bg-primary px-8">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm bg-card rounded-[2rem] overflow-hidden group">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{label}</p>
          <h3 className="text-3xl font-black tracking-tighter leading-none">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
