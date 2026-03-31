
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, Lock, User as UserIcon, Phone, Contact, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";

const registerSchema = z.object({
  name: z.string().min(3, { message: "Nama lengkap minimal 3 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  confirmPassword: z.string(),
  employeeId: z.string().min(5, { message: "NIP minimal 5 karakter" }),
  subject: z.string().min(2, { message: "Pilih tugas atau wali kelas" }),
  phone: z.string().min(10, { message: "Nomor HP minimal 10 digit" }),
  role: z.enum(["GURU", "BK"], { required_error: "Pilih peran Anda" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protected Route Logic
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Hanya staf terdaftar yang dapat mengakses halaman pendaftaran.",
      });
      router.push("/login");
    }
  }, [user, userLoading, router, toast]);

  const classesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "classes"), orderBy("name", "asc"));
  }, [db]);

  const { data: classes = [] } = useCollection(classesQuery);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      employeeId: "",
      subject: "",
      phone: "",
      role: "GURU",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
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
        title: "Pendaftaran Berhasil",
        description: `Akun untuk ${values.name} telah dibuat.`,
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        variant: "destructive",
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl border-none">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative w-20 h-20 overflow-hidden rounded-2xl border bg-white flex items-center justify-center p-2 shadow-sm">
              <Image 
                src={logoUrl} 
                alt="JAYA Logo"
                fill
                className="object-contain p-3"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Tambah Staf Guru
          </CardTitle>
          <CardDescription>Otorisasi Pendaftaran Akun Staf Baru - JAYA</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Nama Lengkap" className="pl-10" {...field} />
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
                          <Input placeholder="Masukkan NIP" className="pl-10" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Tugas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Guru Mata Pelajaran">Guru Mata Pelajaran</SelectItem>
                          {classes.map(cls => (
                            <SelectItem key={cls.id} value={`Wali Kelas ${cls.name}`}>Wali Kelas {cls.name}</SelectItem>
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
                          <Input placeholder="08xxxxxxxxxx" className="pl-10" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GURU">Guru</SelectItem>
                        <SelectItem value="BK">Guru BK</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Sekolah</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="nama@sekolah.sch.id" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="Min. 6 karakter" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="Ulangi password" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-11 mt-4" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Daftarkan Akun"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full" onClick={() => router.push("/")}>
            Batal dan Kembali
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
