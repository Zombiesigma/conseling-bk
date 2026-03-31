
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, ShieldAlert, Hash, Search, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/hooks/use-memo-firebase";

const formSchema = z.object({
  studentId: z.string({
    required_error: "Silakan pilih siswa.",
  }),
  date: z.date({
    required_error: "Silakan pilih tanggal kejadian.",
  }),
  type: z.string({
    required_error: "Silakan pilih jenis pelanggaran.",
  }),
  points: z.number().min(0),
  description: z.string().min(10, {
    message: "Deskripsi harus minimal 10 karakter.",
  }),
  counselorNotes: z.string().optional(),
  actionTaken: z.string().optional(),
});

export function ViolationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const [searchStudent, setSearchStudent] = useState("");
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  
  const [searchType, setSearchType] = useState("");
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "students");
  }, [db, user]);

  const violationTypesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "violationTypes");
  }, [db, user]);

  const { data: students = [], loading: sLoading } = useCollection(studentsQuery);
  const { data: violationTypes = [], loading: tLoading } = useCollection(violationTypesQuery);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      (s.name || "").toLowerCase().includes(searchStudent.toLowerCase()) || 
      (s.class || "").toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.studentIdNumber || "").includes(searchStudent)
    );
  }, [students, searchStudent]);

  const filteredViolationTypes = useMemo(() => {
    return violationTypes.filter(t => 
      (t.name || "").toLowerCase().includes(searchType.toLowerCase())
    );
  }, [violationTypes, searchType]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      counselorNotes: "",
      actionTaken: "Teguran Lisan",
      points: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db) return;

    const selectedStudent = students.find(s => s.id === values.studentId);
    
    const violationData = {
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      studentName: selectedStudent?.name || "",
      studentClass: selectedStudent?.class || "",
      categories: [values.type],
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "violations"), violationData);
      toast({
        title: "Berhasil",
        description: "Data pelanggaran siswa telah disimpan.",
      });
      router.push("/violations");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan saat menyimpan data.",
      });
    }
  }

  const handleCategoryChange = (val: string) => {
    form.setValue("type", val);
    const matched = violationTypes.find(c => c.name === val);
    if (matched) {
      form.setValue("points", matched.points);
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Siswa Terlibat</FormLabel>
                  <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full h-11 justify-between text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {field.value
                              ? students.find((student) => student.id === field.value)?.name
                              : "Pilih Nama Siswa"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Ketik nama atau kelas..."
                            className="h-11 border-none focus-visible:ring-0 px-0 bg-transparent"
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-72">
                          <div className="p-1">
                            {sLoading ? (
                              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
                              </div>
                            ) : filteredStudents.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground font-medium">
                                Siswa tidak ditemukan.
                              </div>
                            ) : (
                              filteredStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-primary/5 transition-colors",
                                    field.value === student.id && "bg-primary/10 text-primary"
                                  )}
                                  onClick={() => {
                                    form.setValue("studentId", student.id);
                                    setStudentPopoverOpen(false);
                                    setSearchStudent("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === student.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold">{student.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                      Kelas: {student.class} • NISN: {student.studentIdNumber}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mb-1">Tanggal Kejadian</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full h-11 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kronologi/Deskripsi Kejadian</FormLabel>
                <FormControl>
                  <Textarea placeholder="Jelaskan detail kejadian pelanggaran..." className="min-h-[120px] text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-col">
                  <FormLabel>Kategori Aturan Sekolah</FormLabel>
                  <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full h-11 justify-between text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {field.value || "Pilih Aturan yang Dilanggar"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Ketik nama pelanggaran..."
                            className="h-11 border-none focus-visible:ring-0 px-0 bg-transparent"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-72">
                          <div className="p-1">
                            {tLoading ? (
                              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
                              </div>
                            ) : filteredViolationTypes.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground font-medium">
                                Jenis pelanggaran tidak ditemukan.
                              </div>
                            ) : (
                              filteredViolationTypes.map((type) => (
                                <div
                                  key={type.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-primary/5 transition-colors",
                                    field.value === type.name && "bg-primary/10 text-primary"
                                  )}
                                  onClick={() => {
                                    handleCategoryChange(type.name);
                                    setTypePopoverOpen(false);
                                    setSearchType("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === type.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold">{type.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                      Poin: +{type.points}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bobot Poin</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-10 h-11" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="actionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tindakan Langsung</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih tindakan yang diberikan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Teguran Lisan">Teguran Lisan</SelectItem>
                      <SelectItem value="Peringatan Tertulis">Peringatan Tertulis</SelectItem>
                      <SelectItem value="Pemanggilan Orang Tua">Pemanggilan Orang Tua</SelectItem>
                      <SelectItem value="Skorsing">Skorsing</SelectItem>
                      <SelectItem value="Tugas Pembinaan">Tugas Pembinaan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="counselorNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan BK (Internal)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Catatan tambahan untuk bimbingan..." className="text-sm h-11 md:h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 pt-4 border-t">
            <Button variant="ghost" type="button" onClick={() => router.back()} className="w-full sm:w-auto">Batal</Button>
            <Button type="submit" disabled={students.length === 0 || tLoading} className="w-full sm:w-auto h-11 sm:h-10 shadow-lg">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Simpan Pelanggaran
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
