
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowLeft, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

export default function LoginPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!userLoading && user) {
      router.push("/dashboard");
    }
  }, [user, userLoading, router]);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Berhasil Masuk",
        description: "Selamat datang kembali di JAYA!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "Terjadi kesalahan saat login.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Email atau password salah.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Kredensial tidak valid.";
      }
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";
  const backgroundUrl = "https://jurnalsukabumi.com/wp-content/uploads/2025/10/IMG-20251009-WA0012.jpg";

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
      {/* GLOBAL BACKGROUND IMAGE - UNIFIED FOR BOTH SIDES */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="School Background" 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Tombol Kembali (Floating) */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-white hover:text-white bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-all shadow-lg">
          <ArrowLeft className="h-4 w-4" /> 
          <span className="hidden sm:inline">Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Sisi Kiri: Branding (Hanya Desktop) */}
      <div className="hidden md:flex md:w-1/2 relative z-10 flex-col items-center justify-center text-white p-8">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-left duration-700">
          <div className="relative w-32 h-32 mx-auto bg-white rounded-3xl p-4 shadow-2xl">
            <Image 
              src={logoUrl} 
              alt="JAYA Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter uppercase drop-shadow-lg">JAYA</h1>
            <p className="text-xl font-medium text-white/90 max-w-sm mx-auto leading-tight drop-shadow-md">
              SMKS PK JAMIYATUL AULAD <br />
              <span className="text-accent font-bold">KEDISIPLINAN TERINTEGRASI</span>
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-8">
            <div className="h-1 w-12 bg-white/40 rounded-full" />
            <School className="w-5 h-5 text-accent" />
            <div className="h-1 w-12 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white overflow-hidden animate-in fade-in slide-in-from-right duration-700">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="md:hidden flex justify-center mb-4">
              <div className="relative w-16 h-16 bg-white rounded-2xl p-2 shadow-md border">
                <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">Masuk ke JAYA</CardTitle>
            <CardDescription className="text-base font-medium">Silakan gunakan akun staf Anda</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold">Email Sekolah</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="nama@sekolah.sch.id" 
                            className="pl-10 h-12 border-muted hover:border-primary focus:border-primary transition-colors bg-muted/10" 
                            {...field} 
                          />
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
                      <FormLabel className="text-foreground/80 font-semibold">Kata Sandi</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 h-12 border-muted hover:border-primary focus:border-primary transition-colors bg-muted/10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-base font-bold mt-4 shadow-lg hover:bg-primary/90 transition-all" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mencoba Masuk...
                    </>
                  ) : (
                    "MASUK SEKARANG"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 bg-muted/30 pt-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 leading-relaxed">
                Akses terbatas untuk Tenaga Pendidik & Staf Kependidikan <br /> SMKS PK JAMIYATUL AULAD
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
