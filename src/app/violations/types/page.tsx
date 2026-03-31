
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  PlusCircle, 
  Loader2, 
  Trash2
} from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ViolationTypesPage() {
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formState, setFormState] = useState({
    name: "",
    points: 0,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const typesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "violationTypes");
  }, [db, user]);

  const { data: violationTypes = [], loading } = useCollection(typesQuery);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formState.name || formState.points < 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Lengkapi nama dan poin pelanggaran." });
      return;
    }

    setIsSubmitting(true);
    addDoc(collection(db, "violationTypes"), {
      ...formState,
      createdAt: new Date().toISOString()
    })
      .then(() => {
        toast({ title: "Berhasil", description: "Jenis pelanggaran ditambahkan." });
        setOpen(false);
        setFormState({ name: "", points: 0 });
      })
      .catch(() => toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan data." }))
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm("Hapus jenis pelanggaran ini?")) return;
    
    try {
      await deleteDoc(doc(db, "violationTypes", id));
      toast({ title: "Dihapus", description: "Data telah dihapus." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus data." });
    }
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Master Jenis Pelanggaran</h1>
            <p className="text-muted-foreground">Kelola kategori aturan dan bobot poin skor kedisiplinan.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary flex-1 md:flex-none">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Jenis Pelanggaran
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddType}>
                  <DialogHeader>
                    <DialogTitle>Tambah Jenis Pelanggaran</DialogTitle>
                    <DialogDescription>Masukkan nama pelanggaran dan poin yang diberikan.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Nama Pelanggaran</Label>
                      <Input 
                        placeholder="Contoh: Merokok di Lingkungan Sekolah" 
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Poin Skor</Label>
                      <Input 
                        type="number" 
                        value={formState.points}
                        onChange={(e) => setFormState({...formState, points: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Jenis Pelanggaran
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nama Pelanggaran</TableHead>
                <TableHead className="w-[150px] text-center">Bobot Poin</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : violationTypes.length > 0 ? (
                violationTypes.sort((a,b) => b.points - a.points).map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 rounded bg-red-50 text-red-700 font-bold border border-red-100">
                        +{type.points}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada jenis pelanggaran. Silakan tambahkan manual.
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
