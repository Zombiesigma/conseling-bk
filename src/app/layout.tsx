
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: 'JAYA - SMKS PK JAMIYATUL AULAD',
  description: 'Sistem Pencatatan Pelanggaran Siswa - SMKS PK JAMIYATUL AULAD',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
        {/* Safety Script to prevent Pointer Events Lock (Freeze UI) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.attributeName === 'style' && document.body.style.pointerEvents === 'none') {
                    // Check if any Radix/Shadcn overlay is actually open
                    const hasOverlay = document.querySelector('[data-state="open"]');
                    if (!hasOverlay) {
                      document.body.style.pointerEvents = 'auto';
                    }
                  }
                });
              });
              observer.observe(document.body, { attributes: true });
            })();
          `
        }} />
      </body>
    </html>
  );
}
