
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Users, 
  LogOut,
  UserRound,
  School,
  LogIn,
  Settings2,
  FileWarning,
  Home,
  Loader2
} from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pelanggaran", href: "/violations", icon: ClipboardList },
  { name: "Catat Baru", href: "/violations/new", icon: PlusCircle },
  { name: "Laporan SP", href: "/sp-reports", icon: FileWarning },
  { name: "Master Aturan", href: "/violations/types", icon: Settings2 },
  { name: "Daftar Siswa", href: "/students", icon: Users },
  { name: "Daftar Guru", href: "/teachers", icon: UserRound },
  { name: "Daftar Kelas", href: "/classes", icon: School },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
  hideLogo?: boolean;
}

export function Sidebar({ className, onItemClick, hideLogo = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const logoUrl = "https://tse4.mm.bing.net/th/id/OIP.gCLYWkaRILGpYmiOCYe8kgAAAA?pid=Api&h=220&P=0";

  return (
    <div className={cn("flex flex-col w-64 border-r bg-card h-full sticky top-0 print:hidden", className)}>
      {!hideLogo && (
        <div className="p-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-lg border bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Image 
                src={logoUrl} 
                alt="JAYA Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">JAYA</h1>
          </Link>
        </div>
      )}
      
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
            </Link>
          );
        })}
        <div className="pt-4 mt-4 border-t opacity-50">
          <Link
            href="/"
            onClick={onItemClick}
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="mr-3 h-5 w-5" />
            Halaman Welcome
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t mt-auto">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-4 bg-muted/30 rounded-lg">
              <Avatar className="w-9 h-9 border-2 border-primary/20">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="bg-accent text-primary font-bold">
                  {user.displayName?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-primary">{user.displayName || "Guru"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors justify-start"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <LogOut className="mr-3 h-5 w-5" />}
                  Keluar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin keluar dari sistem JAYA? Anda perlu login kembali untuk mengakses dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Button 
            variant="default" 
            className="w-full flex items-center justify-start gap-3 shadow-md"
            onClick={() => {
              router.push("/login");
              onItemClick?.();
            }}
          >
            <LogIn className="h-5 w-5" />
            Masuk
          </Button>
        )}
      </div>
    </div>
  );
}
