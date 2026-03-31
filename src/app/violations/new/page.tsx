
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ViolationForm } from "@/components/violations/violation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";

export default function NewViolationPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Catat Pelanggaran Baru</h1>
          <p className="text-muted-foreground">Lengkapi formulir di bawah ini untuk mendokumentasikan pelanggaran siswa.</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Formulir Insiden
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ViolationForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
