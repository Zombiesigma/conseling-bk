"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { School, Users, UserCog, Loader2, PlusCircle, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

const TINGKAT_OPTIONS = ["X", "XI", "XII"];
const JURUSAN_OPTIONS = ["RPL 1", "RPL 2", "LP", "DPB", "DKV", "TKRO"];

export default function ClassesListPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [formState, setFormState] = useState({
    tingkat: "",
    jurusan: "",
    homeroomTeacherId: "none",
  });

  const [editFormState, setEditFormState] = useState({
    tingkat: "",
    jurusan: "",
    homeroomTeacherId: "none",
  });

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "classes");
  }, [db, user]);

  const teachersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "teachers");
  }, [db, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "students");
  }, [db, user]);

  const { data: classes = [], loading: cLoading } = useCollection(classesQuery);
  const { data: teachers = [] } = useCollection(teachersQuery);
  const { data: students = [], loading: sLoading } = useCollection(studentsQuery);

  // Fungsi untuk mengecek apakah kelas sudah ada (untuk penambahan)
  const isClassExists = async (tingkat: string, jurusan: string, excludeId?: string) => {
    if (!db) return false;
    const className = `${tingkat} ${jurusan}`;
    const q = query(collection(db, "classes"), where("name", "==", className));
    const snapshot = await getDocs(q);
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return !snapshot.empty;
  };

  // Urutkan kelas berdasarkan tingkat (X, XI, XII) dan jurusan sesuai urutan
  const sortedClasses = useMemo(() => {
    const orderTingkat: Record<string, number> = { X: 1, XI: 2, XII: 3 };
    const orderJurusan: Record<string, number> = {
      "RPL 1": 1,
      "RPL 2": 2,
      "LP": 3,
      "DPB": 4,
      "DKV": 5,
      "TKRO": 6,
    };

    return [...classes].sort((a, b) => {
      const [aTingkat, ...aJurusanParts] = a.name.split(' ');
      const aJurusan = aJurusanParts.join(' ');
      const [bTingkat, ...bJurusanParts] = b.name.split(' ');
      const bJurusan = bJurusanParts.join(' ');

      const tingkatDiff = (orderTingkat[aTingkat] || 99) - (orderTingkat[bTingkat] || 99);
      if (tingkatDiff !== 0) return tingkatDiff;

      return (orderJurusan[aJurusan] || 99) - (orderJurusan[bJurusan] || 99);
    });
  }, [classes]);

  const getTeacherName = (id: string) => {
    if (!id || id === "none") return "Belum ditentukan";
    return teachers.find(t => t.id === id)?.name || "Belum ditentukan";
  };

  const getStudentCount = (className: string) => {
    return students.filter(s => s.class === className).length;
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!db) return;
    if (!formState.tingkat || !formState.jurusan) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi tingkat dan jurusan kelas." });
      return;
    }

    // Cek duplikasi
    const exists = await isClassExists(formState.tingkat, formState.jurusan);
    if (exists) {
      setErrorMessage(`Kelas ${formState.tingkat} ${formState.jurusan} sudah ada. Tidak boleh menambahkan duplikat.`);
      return;
    }

    setIsSubmitting(true);
    const className = `${formState.tingkat} ${formState.jurusan}`;
    const newClass = {
      name: className,
      homeroomTeacherId: formState.homeroomTeacherId === "none" ? "" : formState.homeroomTeacherId,
      createdAt: new Date().toISOString()
    };
    
    addDoc(collection(db, "classes"), newClass)
      .then(() => {
        toast({ title: "Berhasil", description: `Kelas ${className} telah ditambahkan.` });
        setOpen(false);
        setFormState({ tingkat: "", jurusan: "", homeroomTeacherId: "none" });
        setErrorMessage("");
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: 'classes',
          operation: 'create',
          requestResourceData: newClass,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menambahkan kelas." });
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleEditClick = (cls: any) => {
    setSelectedClass(cls);
    const parts = (cls.name || "").split(" ");
    const tingkat = parts[0] || "";
    const jurusan = parts.slice(1).join(" ") || "";
    
    setEditFormState({
      tingkat: tingkat,
      jurusan: jurusan,
      homeroomTeacherId: cls.homeroomTeacherId || "none"
    });
    setErrorMessage("");
    setEditOpen(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!db || !selectedClass) return;

    if (!editFormState.tingkat || !editFormState.jurusan) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi tingkat dan jurusan kelas." });
      return;
    }

    // Cek duplikasi, kecuali untuk kelas yang sedang diedit
    const exists = await isClassExists(editFormState.tingkat, editFormState.jurusan, selectedClass.id);
    if (exists) {
      setErrorMessage(`Kelas ${editFormState.tingkat} ${editFormState.jurusan} sudah ada. Tidak boleh mengubah ke nama yang sudah ada.`);
      return;
    }

    setIsSubmitting(true);
    const className = `${editFormState.tingkat} ${editFormState.jurusan}`;
    const updateData = {
      name: className,
      homeroomTeacherId: editFormState.homeroomTeacherId === "none" ? "" : editFormState.homeroomTeacherId,
      updatedAt: new Date().toISOString()
    };

    updateDoc(doc(db, "classes", selectedClass.id), updateData)
      .then(() => {
        toast({ title: "Berhasil", description: `Data kelas ${className} telah diperbarui.` });
        setEditOpen(false);
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: `classes/${selectedClass.id}`,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat memperbarui kelas." });
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (!db) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kelas ${name}? Siswa yang terdaftar di kelas ini akan tetap ada tetapi tidak memiliki kelas.`)) return;

    setIsSubmitting(true);
    const docRef = doc(db, "classes", id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Dihapus", description: `Kelas ${name} telah dihapus.` });
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus kelas." });
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Daftar Kelas</h1>
            <p className="text-muted-foreground">Manajemen kelas dan penugasan wali kelas.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Kelas</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddClass}>
                <DialogHeader>
                  <DialogTitle>Tambah Kelas Baru</DialogTitle>
                  <DialogDescription>Pilih tingkat dan jurusan untuk membuat kelas baru.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tingkat</Label>
                      <Select value={formState.tingkat} onValueChange={(val) => setFormState({...formState, tingkat: val})}>
                        <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent>{TINGKAT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Jurusan</Label>
                      <Select value={formState.jurusan} onValueChange={(val) => setFormState({...formState, jurusan: val})}>
                        <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent>{JURUSAN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Wali Kelas (Opsional)</Label>
                    <Select value={formState.homeroomTeacherId} onValueChange={(val) => setFormState({...formState, homeroomTeacherId: val})}>
                      <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kosongkan Terlebih Dahulu</SelectItem>
                        {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {errorMessage && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setErrorMessage(""); }}>Batal</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Kelas</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary"><School className="w-6 h-6" /></div>
              <div><p className="text-sm text-muted-foreground font-medium">Total Kelas</p><h3 className="text-2xl font-bold">{cLoading ? "..." : classes.length}</h3></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-accent/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10 text-accent-foreground"><Users className="w-6 h-6" /></div>
              <div><p className="text-sm text-muted-foreground font-medium">Total Siswa Terdaftar</p><h3 className="text-2xl font-bold">{sLoading ? "..." : students.length}</h3></div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[200px]">Nama Kelas</TableHead>
                <TableHead>Wali Kelas</TableHead>
                <TableHead className="text-center">Jumlah Siswa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cLoading || sLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><div className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat data kelas...</div></TableCell></TableRow>
              ) : sortedClasses.length > 0 ? (
                sortedClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-bold text-primary">
                      <Link 
                        href={`/students?class=${encodeURIComponent(cls.name)}`} 
                        className="hover:underline flex items-center gap-1 group"
                        title="Klik untuk melihat siswa di kelas ini"
                      >
                        {cls.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </Link>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-2"><UserCog className="w-4 h-4 text-muted-foreground" /><span className={!cls.homeroomTeacherId ? "italic text-muted-foreground" : ""}>{getTeacherName(cls.homeroomTeacherId)}</span></div></TableCell>
                    <TableCell className="text-center font-semibold">
                      <Link 
                        href={`/students?class=${encodeURIComponent(cls.name)}`}
                        className="hover:text-primary transition-colors"
                      >
                        {getStudentCount(cls.name)} Siswa
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(cls)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClass(cls.id, cls.name)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Belum ada data kelas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateClass}>
            <DialogHeader>
              <DialogTitle>Edit Informasi Kelas</DialogTitle>
              <DialogDescription>Perbarui tingkat, jurusan, atau wali kelas.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tingkat</Label>
                  <Select value={editFormState.tingkat} onValueChange={(val) => setEditFormState({...editFormState, tingkat: val})}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{TINGKAT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Jurusan</Label>
                  <Select value={editFormState.jurusan} onValueChange={(val) => setEditFormState({...editFormState, jurusan: val})}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{JURUSAN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Wali Kelas</Label>
                <Select value={editFormState.homeroomTeacherId} onValueChange={(val) => setEditFormState({...editFormState, homeroomTeacherId: val})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali Kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum Ditentukan</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {errorMessage && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setErrorMessage(""); }}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}