
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: {
    default: 'JAYA - SMKS PK JAMIYATUL AULAD',
    template: '%s | JAYA'
  },
  description: 'Sistem Informasi Kedisiplinan Terintegrasi (JAYA) SMKS PK JAMIYATUL AULAD Palabuhanratu. Platform manajemen BK modern untuk pencatatan poin, pemantauan karakter, dan transparansi kedisiplinan siswa.',
  keywords: [
    'SMKS PK Jamiyatul Aulad', 
    'JAYA', 
    'Sistem BK', 
    'Poin Pelanggaran Siswa', 
    'Palabuhanratu', 
    'Sukabumi', 
    'Kedisiplinan Sekolah',
    'Manajemen Karakter Siswa'
  ],
  authors: [{ name: 'SMKS PK Jamiyatul Aulad' }],
  creator: 'Tim IT SMKS PK Jamiyatul Aulad',
  publisher: 'SMKS PK Jamiyatul Aulad',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'JAYA - Sistem Kedisiplinan Terintegrasi',
    description: 'Transformasi kedisiplinan masa depan di SMKS PK JAMIYATUL AULAD.',
    url: 'https://smkjaya.sch.id',
    siteName: 'JAYA SMKS PK Jamiyatul Aulad',
    images: [
      {
        url: 'https://jurnalsukabumi.com/wp-content/uploads/2025/10/IMG-20251009-WA0012.jpg',
        width: 1200,
        height: 630,
        alt: 'JAYA SMKS PK Jamiyatul Aulad',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
