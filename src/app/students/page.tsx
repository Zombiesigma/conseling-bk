"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  User,
  GraduationCap,
  Loader2,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  FileUp,
  CheckCircle2,
  Filter,
  School,
  FileDown,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser } from "@/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { useToast } from "@/hooks/use-toast";
import { extractStudentsFromPdf } from "@/ai/flows/extract-students-from-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Import jsPDF dan autoTable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function StudentsListContent() {
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("class") || "";
  const [searchTerm, setSearchTerm] = useState(initialClass);
  const [classFilter, setClassFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Import Massal State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState<any[]>([]);
  const [importError, setImportError] = useState<string>("");

  const [formState, setFormState] = useState({
    name: "",
    className: "",
    studentIdNumber: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
  });

  const [editFormState, setEditFormState] = useState({
    name: "",
    className: "",
    studentIdNumber: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
  });

  useEffect(() => {
    if (initialClass) {
      setSearchTerm(initialClass);
      setClassFilter("all");
    }
  }, [initialClass]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "students"), orderBy("name", "asc"));
  }, [db, user]);

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "classes"), orderBy("name", "asc"));
  }, [db, user]);

  const { data: students = [], loading: dataLoading } = useCollection(studentsQuery);
  const { data: classes = [] } = useCollection(classesQuery);

  const classOptions = useMemo(() => {
    const classesFromStudents = students.map((s) => s.class).filter(Boolean);
    return [...new Set(classesFromStudents)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.class || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.studentIdNumber || "").includes(searchTerm)
      );
    }

    if (classFilter !== "all") {
      filtered = filtered.filter((s) => s.class === classFilter);
    }

    return filtered;
  }, [students, searchTerm, classFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, classFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Data Siswa SMKS Jamiyyatul Aulad", 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistem Informasi JAYA`, 14, 27);
    doc.setFontSize(9);
    doc.text(`Tanggal Cetak: ${currentDate}`, 14, 34);

    const tableData = filteredStudents.map((student) => [
      student.name || "-",
      student.studentIdNumber || "-",
      student.class || "-",
      student.gender || "-",
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Nama Siswa", "NISN", "Kelas", "Jenis Kelamin"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      bodyStyles: { fontSize: 10 },
    });

    doc.save(`Data_Siswa_JAYA_${new Date().getTime()}.pdf`);
    toast({ title: "Berhasil", description: `${filteredStudents.length} data siswa telah diekspor.` });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    const studentData = {
      name: formState.name,
      class: formState.className,
      studentIdNumber: formState.studentIdNumber,
      gender: formState.gender,
      createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, "students"), studentData)
      .then(() => {
        toast({ title: "Berhasil", description: `Siswa ${formState.name} telah ditambahkan.` });
        setOpen(false);
        setFormState({ name: "", className: "", studentIdNumber: "", gender: "Laki-laki" });
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportError("");
    }
  };

  const handleProcessImport = async () => {
    if (!importFile) return;

    setIsExtracting(true);
    setImportError("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const result = await extractStudentsFromPdf({ pdfDataUri: base64 });
          if (result && result.students && result.students.length > 0) {
            setExtractedStudents(result.students);
          } else {
            setImportError("Tidak ada data siswa yang terbaca. Coba file lain.");
          }
        } catch (err) {
          setImportError("Gagal memproses dokumen. Pastikan file adalah PDF yang jelas.");
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(importFile);
    } catch (err) {
      setImportError("Gagal membaca file.");
      setIsExtracting(false);
    }
  };

  const handleSaveImportedStudents = async () => {
    if (!db || extractedStudents.length === 0) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);

    extractedStudents.forEach((s) => {
      const docRef = doc(collection(db, "students"));
      batch.set(docRef, {
        name: s.name,
        studentIdNumber: s.studentIdNumber,
        gender: s.gender || "Laki-laki",
        class: s.class || "Tidak Terdeteksi",
        createdAt: new Date().toISOString(),
      });
    });

    try {
      await batch.commit();
      toast({ title: "Berhasil", description: `${extractedStudents.length} siswa berhasil diimpor otomatis sesuai kelas masing-masing.` });
      setImportOpen(false);
      setExtractedStudents([]);
      setImportFile(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan data ke database." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setEditFormState({
      name: student.name,
      className: student.class,
      studentIdNumber: student.studentIdNumber,
      gender: student.gender,
    });
    setEditOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedStudent) return;

    setIsSubmitting(true);
    const updateData = {
      name: editFormState.name,
      class: editFormState.className,
      studentIdNumber: editFormState.studentIdNumber,
      gender: editFormState.gender,
      updatedAt: new Date().toISOString(),
    };

    updateDoc(doc(db, "students", selectedStudent.id), updateData)
      .then(() => {
        toast({ title: "Berhasil", description: "Data siswa telah diperbarui." });
        setEditOpen(false);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (!db) return;
    if (!window.confirm(`Hapus data siswa ${name}?`)) return;

    deleteDoc(doc(db, "students", id)).then(() => {
      toast({ title: "Dihapus", description: `Data siswa ${name} telah dihapus.` });
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">MANAJEMEN SISWA</h1>
          <p className="text-muted-foreground text-sm md:text-base">Kelola basis data siswa JAYA secara massal dan efisien.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-white hover:bg-muted">
            <FileDown className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Ekspor PDF</span>
          </Button>
          
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-primary text-primary hover:bg-primary/5">
                <FileUp className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Import Massal AI</span>
                <span className="sm:hidden">Import AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl">
              <DialogHeader>
                <DialogTitle>Import Siswa Massal Otomatis</DialogTitle>
                <DialogDescription>AI akan mendeteksi Nama, NISN, Gender, dan Kelas secara otomatis dari dokumen Anda.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {extractedStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 md:p-10 bg-muted/10">
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-sm font-bold mb-1 text-center">Unggah PDF Daftar Siswa</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-6 text-center max-w-xs leading-relaxed">
                      Pastikan dokumen berisi kolom Nama, NISN, dan Kelas agar AI dapat mengenali data dengan tepat.
                    </p>
                    <Input 
                      type="file" 
                      accept="application/pdf,image/*" 
                      className="max-w-[280px] mb-4 cursor-pointer text-xs" 
                      onChange={handleFileChange}
                    />
                    {importFile && (
                      <Button onClick={handleProcessImport} disabled={isExtracting} className="w-full max-w-[280px] h-11 font-bold">
                        {isExtracting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menganalisis...</> : "Mulai Ekstraksi AI"}
                      </Button>
                    )}
                    {importError && <p className="text-xs text-destructive mt-4 font-bold bg-destructive/5 p-2 rounded">{importError}</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Hasil Ekstraksi AI</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          Berhasil mengenali {extractedStudents.length} data siswa
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setExtractedStudents([])} className="text-[10px] h-8 font-bold border">Ganti File</Button>
                    </div>
                    
                    <div className="border rounded-xl bg-muted/5 overflow-hidden">
                      <div className="grid grid-cols-4 bg-muted/20 p-3 text-[9px] font-black uppercase tracking-[0.2em] border-b text-muted-foreground">
                        <span>Nama</span>
                        <span>NISN</span>
                        <span>Kelas</span>
                        <span>Gender</span>
                      </div>
                      <ScrollArea className="h-[250px] md:h-[350px]">
                        <div className="divide-y divide-muted/30">
                          {extractedStudents.map((s, idx) => (
                            <div key={idx} className="grid grid-cols-4 p-3 text-[10px] items-center hover:bg-white transition-colors group">
                              <span className="font-black truncate pr-2 group-hover:text-primary transition-colors">{s.name}</span>
                              <span className="text-muted-foreground font-mono">{s.studentIdNumber}</span>
                              <div className="pr-1"><Badge variant="outline" className="text-[8px] px-1.5 h-4 bg-primary/5 text-primary border-primary/20">{s.class}</Badge></div>
                              <span className="text-muted-foreground">{s.gender}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                        Data kelas telah terdeteksi secara otomatis. Klik <strong>Simpan Semua</strong> untuk mendaftarkan {extractedStudents.length} siswa ini ke dalam database JAYA.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setImportOpen(false)} disabled={isSubmitting} className="flex-1 sm:flex-none">Batal</Button>
                {extractedStudents.length > 0 && (
                  <Button onClick={handleSaveImportedStudents} disabled={isSubmitting} className="bg-primary shadow-xl flex-1 sm:flex-none font-bold">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : `Simpan ${extractedStudents.length} Data`}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary shadow-lg font-bold">
                <UserPlus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Tambah Siswa</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] rounded-xl">
              <form onSubmit={handleAddStudent}>
                <DialogHeader>
                  <DialogTitle>Tambah Siswa Baru</DialogTitle>
                  <DialogDescription>Lengkapi informasi identitas siswa di bawah ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</Label>
                    <Input required placeholder="Masukkan nama siswa" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">NISN</Label>
                    <Input required placeholder="10 digit NISN" value={formState.studentIdNumber} onChange={(e) => setFormState({ ...formState, studentIdNumber: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kelas</Label>
                      <Select value={formState.className} onValueChange={(val) => setFormState({ ...formState, className: val })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                      <Select value={formState.gender} onValueChange={(val: any) => setFormState({ ...formState, gender: val })}>
                        <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto font-bold">
                    {isSubmitting ? "Menyimpan..." : "Simpan Data Siswa"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard 
          icon={User} 
          label="Total Siswa" 
          value={students.length} 
          color="bg-primary/5 text-primary" 
          iconBg="bg-primary/10" 
        />
        <SummaryCard 
          icon={School} 
          label="Total Kelas" 
          value={classOptions.length} 
          color="bg-accent/5 text-accent-foreground" 
          iconBg="bg-accent/10" 
        />
        <SummaryCard 
          icon={Filter} 
          label="Hasil Filter" 
          value={filteredStudents.length} 
          color="bg-muted/50 text-muted-foreground" 
          iconBg="bg-muted" 
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-muted/50 print:hidden">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input
              placeholder="Cari nama atau NISN siswa..."
              className="pl-11 h-12 bg-muted/20 border-none focus-visible:ring-primary rounded-xl text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-muted/20 border-none rounded-xl text-sm">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classOptions.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || classFilter !== "all") && (
              <Button variant="ghost" onClick={() => { setSearchTerm(""); setClassFilter("all"); }} className="h-12 w-12 p-0 rounded-xl hover:bg-destructive/10 text-destructive">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      {dataLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  onEdit={handleEditClick} 
                  onDelete={handleDeleteStudent} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted/50">
                <Search className="w-16 h-16 text-muted-foreground/10 mb-4" />
                <p className="text-muted-foreground font-bold tracking-tight">Data tidak ditemukan.</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Gunakan kata kunci atau filter lain.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-muted/50">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center sm:text-left">
                Halaman <span className="text-primary">{currentPage}</span> / {totalPages} • Total <span className="text-primary">{filteredStudents.length}</span> Siswa
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="rounded-xl h-10 px-4 font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="rounded-xl h-10 px-4 font-bold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] rounded-xl">
          <form onSubmit={handleUpdateStudent}>
            <DialogHeader>
              <DialogTitle>Edit Data Siswa</DialogTitle>
              <DialogDescription>Perbarui informasi identitas siswa pilihan Anda.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</Label>
                <Input required value={editFormState.name} onChange={(e) => setEditFormState({ ...editFormState, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">NISN</Label>
                <Input required value={editFormState.studentIdNumber} onChange={(e) => setEditFormState({ ...editFormState, studentIdNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kelas</Label>
                  <Select value={editFormState.className} onValueChange={(val) => setEditFormState({ ...editFormState, className: val })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                  <Select value={editFormState.gender} onValueChange={(val: any) => setEditFormState({ ...editFormState, gender: val })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, iconBg, className }: any) {
  return (
    <Card className={cn("border-none shadow-none overflow-hidden", color, className)}>
      <CardContent className="p-6 flex items-center gap-5">
        <div className={cn("p-4 rounded-2xl shadow-sm", iconBg)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{label}</p>
          <p className="text-3xl font-black leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentCard({ student, onEdit, onDelete }: { student: any; onEdit: (s: any) => void; onDelete: (id: string, name: string) => void }) {
  return (
    <Card className="group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all border shadow-sm bg-card overflow-hidden rounded-[2rem] relative">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted border opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-none">
                <DropdownMenuItem onClick={() => onEdit(student)} className="gap-2 font-medium">
                  <Pencil className="h-4 w-4 text-blue-600" /> Edit Biodata
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive gap-2 font-medium" onClick={() => onDelete(student.id, student.name)}>
                  <Trash2 className="h-4 w-4" /> Hapus Siswa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-3">
            <div className="min-w-0">
              <h3 className="font-black text-sm md:text-base truncate uppercase tracking-tight group-hover:text-primary transition-colors">
                {student.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase mt-1">
                <GraduationCap className="w-3.5 h-3.5" /> 
                <span>Kelas {student.class}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="bg-muted text-[9px] font-black tracking-widest text-muted-foreground px-2 py-0.5 border-none">
                NISN: {student.studentIdNumber}
              </Badge>
              <Badge variant="outline" className="text-[9px] font-black px-2 py-0.5 uppercase border-muted/50">
                {student.gender}
              </Badge>
            </div>
          </div>
        </div>

        <Link 
          href={`/students/${student.id}`} 
          className="flex items-center justify-center gap-2 border-t bg-muted/20 p-4 text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-[0.2em] group/link"
        >
          Lihat Profil Lengkap
          <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function StudentsListPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <StudentsListContent />
      </Suspense>
    </AppShell>
  );
}
