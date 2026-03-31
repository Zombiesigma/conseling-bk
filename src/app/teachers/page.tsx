
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  UserRound, 
  Phone,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  Contact,
  School,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser, useAuth } from "@/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const teacherSchema = z.object({
  name: z.string().min(3, { message: "Nama lengkap minimal 3 karakter" }),
  employeeId: z.string().min(5, { message: "NIP minimal 5 karakter" }),
  subject: z.string().min(2, { message: "Pilih tugas kelas atau mata pelajaran" }),
  phone: z.string().min(10, { message: "Nomor HP minimal 10 digit" }),
  role: z.enum(["GURU", "BK", "ADMIN"], { required_error: "Pilih peran" }),
});

const registerSchema = teacherSchema.extend({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

export default function TeachersListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      employeeId: "",
      subject: "",
      phone: "",
      role: "GURU",
    },
  });

  const editForm = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      employeeId: "",
      subject: "",
      phone: "",
      role: "GURU",
    },
  });

  const teachersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "teachers"), orderBy("name", "asc"));
  }, [db, user]);

  const classesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "classes"), orderBy("name", "asc"));
  }, [db, user]);

  const { data: teachers = [], loading: tLoading } = useCollection(teachersQuery);
  const { data: classes = [], loading: cLoading } = useCollection(classesQuery);

  const filteredTeachers = teachers.filter(t => 
    (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.employeeId || "").includes(searchTerm)
  );

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    if (!auth || !db) return;
    
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;
      
      await updateProfile(newUser, {
        displayName: values.name
      });

      const teacherData = {
        name: values.name,
        employeeId: values.employeeId,
        subject: values.subject,
        phone: values.phone,
        isCounselor: values.role === "BK",
        role: values.role,
        email: values.email,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "teachers", newUser.uid), teacherData);
      
      toast({
        title: "Berhasil",
        description: `Akun Guru ${values.name} telah dibuat.`,
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat membuat akun.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (teacher: any) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      name: teacher.name,
      employeeId: teacher.employeeId,
      subject: teacher.subject,
      phone: teacher.phone,
      role: teacher.role || (teacher.isCounselor ? "BK" : "GURU"),
    });
    setEditOpen(true);
  };

  const handleUpdate = async (values: z.infer<typeof teacherSchema>) => {
    if (!db || !selectedTeacher) return;

    setIsSubmitting(true);
    updateDoc(doc(db, "teachers", selectedTeacher.id), {
      ...values,
      isCounselor: values.role === "BK",
      updatedAt: new Date().toISOString()
    })
      .then(() => {
        toast({
          title: "Berhasil",
          description: `Data guru ${values.name} telah diperbarui.`,
        });
        setEditOpen(false);
        setSelectedTeacher(null);
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: `teachers/${selectedTeacher.id}`,
          operation: 'update',
          requestResourceData: values,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (teacher: any) => {
    if (!db) return;
    
    const isConfirmed = window.confirm(
      `HAPUS DATA GURU: ${teacher.name}?\n\n` +
      `Tindakan ini akan menghapus profil dari sistem.`
    );

    if (!isConfirmed) return;

    setIsSubmitting(true);
    const docRef = doc(db, "teachers", teacher.id);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Profil Dihapus",
          description: `Data profil ${teacher.name} berhasil dihapus.`,
        });
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Daftar Guru</h1>
            <p className="text-muted-foreground">Informasi tenaga pendidik dan wali kelas JAYA.</p>
          </div>

          <Dialog open={open} onOpenChange={(val) => { if(!isSubmitting) setOpen(val); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-lg" disabled={isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Guru Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrasi Akun Guru</DialogTitle>
                <DialogDescription>
                  Daftarkan akun guru atau staf bimbingan konseling baru.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nama Lengkap" className="pl-10 h-11" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Contact className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="NIP Guru" className="pl-10 h-11" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tugas / Wali Kelas</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <div className="relative">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <SelectTrigger className="pl-10 h-11">
                                  <SelectValue placeholder={cLoading ? "Memuat..." : "Pilih Kelas"} />
                                </SelectTrigger>
                              </div>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Guru Mata Pelajaran">Guru Mata Pelajaran</SelectItem>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={`Wali Kelas ${cls.name}`}>
                                  Wali Kelas {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor HP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="08..." className="pl-10 h-11" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peran</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Pilih Peran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GURU">Guru Mata Pelajaran</SelectItem>
                            <SelectItem value="BK">Guru BK</SelectItem>
                            <SelectItem value="ADMIN">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Sekolah</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="email@sch.id" className="pl-10 h-11" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password Akun</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Min. 6 Karakter" className="pl-10 h-11" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Batal</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Daftarkan Guru
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card p-4 rounded-xl shadow-sm border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari guru berdasarkan nama, NIP, atau tugas..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {tLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="border hover:border-primary/50 shadow-sm overflow-hidden hover:shadow-md transition-all bg-card group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <UserRound className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg truncate pr-2">{teacher.name}</h3>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(teacher)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Guru
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive font-semibold" onSelect={() => handleDelete(teacher)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus Guru
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                          {teacher.subject}
                        </Badge>
                        {teacher.role === "ADMIN" && (
                          <Badge className="bg-primary text-white border-none text-[10px] flex gap-1 items-center">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </Badge>
                        )}
                        {(teacher.isCounselor || teacher.role === "BK") && (
                          <Badge className="bg-blue-600 text-white border-none text-[10px]">Guru BK</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <IdentificationCard className="w-3.5 h-3.5" />
                          <span>NIP: {teacher.employeeId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{teacher.phone}</span>
                        </div>
                        {teacher.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{teacher.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Guru</DialogTitle>
            <DialogDescription>Perbarui informasi profil guru atau staf.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Nama Lengkap" className="pl-10 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Contact className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="NIP Guru" className="pl-10 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tugas / Wali Kelas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <SelectTrigger className="pl-10 h-11">
                              <SelectValue placeholder="Pilih Kelas" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Guru Mata Pelajaran">Guru Mata Pelajaran</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={`Wali Kelas ${cls.name}`}>
                              Wali Kelas {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor HP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="08..." className="pl-10 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih Peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GURU">Guru Mata Pelajaran</SelectItem>
                        <SelectItem value="BK">Guru BK</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function IdentificationCard({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <path d="M7 9h2" />
      <path d="M7 12h5" />
      <path d="M7 15h4" />
      <circle cx="16" cy="12" r="2" />
    </svg>
  );
}
