
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  User, 
  ArrowRight,
  GraduationCap,
  Loader2,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  Printer,
  X,
  FileUp,
  FileText,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
import { Badge } from "@/components/ui/badge";

function StudentsListContent() {
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("class") || "";
  const [searchTerm, setSearchTerm] = useState(initialClass);
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Import State
  const [importClass, setImportClass] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedStudents, setExtractedStudents] = useState<any[]>([]);

  const [formState, setFormState] = useState({
    name: "",
    className: "",
    studentIdNumber: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan"
  });

  const [editFormState, setEditFormState] = useState({
    name: "",
    className: "",
    studentIdNumber: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan"
  });

  useEffect(() => {
    if (initialClass) {
      setSearchTerm(initialClass);
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

  const filteredStudents = students.filter(s => 
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.class || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentIdNumber || "").includes(searchTerm)
  );

  const handlePrint = () => {
    window.print();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    router.replace("/students");
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    if (!formState.name || !formState.className || !formState.studentIdNumber) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi semua data siswa." });
      return;
    }
    
    setIsSubmitting(true);
    const studentData = {
      name: formState.name,
      class: formState.className,
      studentIdNumber: formState.studentIdNumber,
      gender: formState.gender,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(db, "students"), studentData)
      .then(() => {
        toast({ title: "Berhasil", description: `Siswa ${formState.name} telah ditambahkan.` });
        setOpen(false);
        setFormState({ name: "", className: "", studentIdNumber: "", gender: "Laki-laki" });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: 'students',
          operation: 'create',
          requestResourceData: studentData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setEditFormState({
      name: student.name,
      className: student.class,
      studentIdNumber: student.studentIdNumber,
      gender: student.gender
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
      updatedAt: new Date().toISOString()
    };

    updateDoc(doc(db, "students", selectedStudent.id), updateData)
      .then(() => {
        toast({ title: "Berhasil", description: "Data siswa telah diperbarui." });
        setEditOpen(false);
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: `students/${selectedStudent.id}`,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (!db) return;
    if (!window.confirm(`Hapus data siswa ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setIsSubmitting(true);
    const docRef = doc(db, "students", id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Dihapus", description: `Data siswa ${name} telah dihapus.` });
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  // Import PDF Logic
  const handleExtractPdf = async () => {
    if (!importFile || !importClass) {
      toast({ variant: "destructive", title: "Gagal", description: "Pilih kelas dan unggah file PDF." });
      return;
    }

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const result = await extractStudentsFromPdf({ pdfDataUri: dataUri });
        setExtractedStudents(result.students);
        setIsExtracting(false);
      };
      reader.readAsDataURL(importFile);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Gagal mengekstrak data dari PDF." });
      setIsExtracting(false);
    }
  };

  const handleSaveImportedStudents = async () => {
    if (!db || extractedStudents.length === 0 || !importClass) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const studentCollection = collection(db, "students");
      const createdAt = new Date().toISOString();

      extractedStudents.forEach((student) => {
        const newDocRef = doc(studentCollection);
        batch.set(newDocRef, {
          ...student,
          class: importClass,
          createdAt
        });
      });

      await batch.commit();
      toast({ title: "Berhasil", description: `${extractedStudents.length} siswa telah diimport ke kelas ${importClass}.` });
      setImportOpen(false);
      setExtractedStudents([]);
      setImportFile(null);
      setImportClass("");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data import." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Daftar Siswa</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola profil dan riwayat pelanggaran siswa JAYA.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 md:flex-none">
            <Printer className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Cetak</span>
          </Button>
          
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5 flex-1 md:flex-none">
                <FileUp className="mr-2 h-4 w-4" /> Import
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Import Siswa via PDF
                </DialogTitle>
                <DialogDescription>
                  Gunakan AI untuk mengekstrak daftar siswa dari dokumen PDF.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label>1. Pilih Kelas Tujuan</Label>
                  <Select value={importClass} onValueChange={setImportClass}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>2. Unggah Dokumen PDF</Label>
                  <div className="border-2 border-dashed rounded-xl p-4 md:p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    {importFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        <p className="font-semibold text-xs md:text-sm truncate max-w-full px-2">{importFile.name}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">Klik untuk mengganti file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileUp className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                        <p className="text-xs md:text-sm text-muted-foreground">Pilih atau Seret File PDF</p>
                      </div>
                    )}
                  </div>
                </div>

                {extractedStudents.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="flex justify-between items-center text-xs md:text-sm">
                      <span>3. Hasil Ekstraksi ({extractedStudents.length} Siswa)</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">Siap Simpan</Badge>
                    </Label>
                    <div className="border rounded-lg max-h-[200px] overflow-y-auto bg-muted/10 divide-y">
                      {extractedStudents.map((s, idx) => (
                        <div key={idx} className="p-3 text-xs flex justify-between items-center">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold truncate">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">NISN: {s.studentIdNumber}</p>
                          </div>
                          <Badge variant="ghost" className="text-[10px] shrink-0">{s.gender}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => { setExtractedStudents([]); setImportFile(null); }} className="w-full sm:w-auto">Reset</Button>
                {extractedStudents.length > 0 ? (
                  <Button className="bg-primary w-full sm:w-auto" onClick={handleSaveImportedStudents} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Simpan Data
                  </Button>
                ) : (
                  <Button 
                    className="bg-primary w-full sm:w-auto" 
                    onClick={handleExtractPdf} 
                    disabled={isExtracting || !importFile || !importClass}
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ekstraksi...
                      </>
                    ) : (
                      "Proses AI"
                    )}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 flex-1 md:flex-none">
                <UserPlus className="mr-2 h-4 w-4" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[425px]">
              <form onSubmit={handleAddStudent}>
                <DialogHeader>
                  <DialogTitle>Tambah Siswa Baru</DialogTitle>
                  <DialogDescription>Lengkapi data lengkap siswa.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" required value={formState.name} onChange={(e) => setFormState({...formState, name: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nisn">NISN</Label>
                    <Input id="nisn" required value={formState.studentIdNumber} onChange={(e) => setFormState({...formState, studentIdNumber: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Pilih Kelas</Label>
                    <Select value={formState.className} onValueChange={(val) => setFormState({...formState, className: val})}>
                      <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                      <SelectContent>
                        {classes.length > 0 ? classes.map(cls => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>) : <SelectItem value="none" disabled>Belum ada data kelas</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select value={formState.gender} onValueChange={(val: any) => setFormState({...formState, gender: val})}>
                      <SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border print:hidden">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama, kelas, atau NISN..." 
            className="pl-10 pr-10 w-full" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <Card key={student.id} className="hover:border-primary transition-all group border shadow-sm overflow-hidden bg-card print:border-none print:shadow-none">
                <CardContent className="p-0">
                  <div className="p-4 md:p-6 flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><User className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base md:text-lg truncate">{student.name}</h3>
                        <div className="print:hidden shrink-0">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEditClick(student)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Data
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive font-semibold" onSelect={() => handleDeleteStudent(student.id, student.name)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-2"><GraduationCap className="w-3 h-3 md:w-4 md:h-4" /><span>{student.class}</span></div>
                        <div className="flex items-center gap-2"><span className="font-medium text-[9px] md:text-[10px] bg-muted px-1.5 py-0.5 rounded">NISN</span><span className="truncate">{student.studentIdNumber}</span></div>
                      </div>
                    </div>
                  </div>
                  <Link href={`/students/${student.id}`} className="print:hidden">
                    <div className="bg-muted/30 p-2 md:p-3 px-4 md:px-6 flex justify-between items-center text-[10px] md:text-xs border-t hover:bg-primary/5 transition-colors cursor-pointer">
                      <span className="text-primary font-medium">Lihat riwayat lengkap</span>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 md:py-20 text-center bg-card rounded-xl border border-dashed mx-4 md:mx-0">
              <User className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-xs md:text-sm text-muted-foreground px-4">Tidak ada siswa yang ditemukan.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]">
          <form onSubmit={handleUpdateStudent}>
            <DialogHeader>
              <DialogTitle>Edit Data Siswa</DialogTitle>
              <DialogDescription>Perbarui informasi siswa.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input id="edit-name" required value={editFormState.name} onChange={(e) => setEditFormState({...editFormState, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nisn">NISN</Label>
                <Input id="edit-nisn" required value={editFormState.studentIdNumber} onChange={(e) => setEditFormState({...editFormState, studentIdNumber: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Pilih Kelas</Label>
                <Select value={editFormState.className} onValueChange={(val) => setEditFormState({...editFormState, className: val})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-gender">Jenis Kelamin</Label>
                <Select value={editFormState.gender} onValueChange={(val: any) => setEditFormState({...editFormState, gender: val})}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="w-full sm:w-auto">Batal</Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentsListPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <StudentsListContent />
      </Suspense>
    </AppShell>
  );
}
