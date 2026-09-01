import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { RealtimeProvider } from "@/context/RealtimeContext";
import ClientOnlyWidgets from "@/components/ClientOnlyWidgets";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C21875",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lashtweezerslounge.com"),
  title: {
    default: "Lash Tweezers Lounge | Premium Eyelash Tweezers & Barber Shears",
    template: "%s | Lash Tweezers Lounge"
  },
  description: "Manufacturer and global exporter of handcrafted eyelash extension tweezers, Japanese 440C barber shears, cuticle nippers, manicure sets, and salon grooming instruments in Sialkot, Pakistan.",
  keywords: [
    "lash tweezers",
    "eyelash extension tweezers",
    "volume lash tweezers",
    "isolation tweezers",
    "fiber tip tweezers",
    "barber shears",
    "hair cutting scissors",
    "Japanese 440C shears",
    "cuticle nippers",
    "manicure instruments",
    "safety razors",
    "OEM beauty instruments Sialkot",
    "wholesale lash tweezers manufacturer"
  ],
  authors: [{ name: "Lash Tweezers Lounge", url: "https://lashtweezerslounge.com" }],
  creator: "Lash Tweezers Lounge",
  publisher: "Lash Tweezers Lounge",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lashtweezerslounge.com",
    siteName: "Lash Tweezers Lounge",
    title: "Lash Tweezers Lounge | Precision Beauty & Salon Instruments",
    description: "Export-grade handcrafted volume lash tweezers, Japanese 440C barber shears, cuticle nippers, and wholesale beauty kits.",
    images: [
      {
        url: "/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg",
        width: 1200,
        height: 630,
        alt: "Lash Tweezers Lounge Handcrafted Instruments"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Lash Tweezers Lounge | Handcrafted Beauty Instruments",
    description: "Precision lash extension tweezers and professional barber shears direct from manufacturer.",
    images: ["/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://lashtweezerslounge.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://lashtweezerslounge.com/#organization",
        "name": "Lash Tweezers Lounge",
        "url": "https://lashtweezerslounge.com",
        "logo": "https://lashtweezerslounge.com/icon.png",
        "sameAs": [
          "https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+92-334-8012580",
          "contactType": "customer service",
          "areaServed": "Global",
          "availableLanguage": ["English", "Urdu"]
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "King99 Street Block No.99 Wajid Town, Dhattal Stop",
          "addressLocality": "Sialkot",
          "postalCode": "51310",
          "addressCountry": "PK"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://lashtweezerslounge.com/#website",
        "url": "https://lashtweezerslounge.com",
        "name": "Lash Tweezers Lounge",
        "publisher": {
          "@id": "https://lashtweezerslounge.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://lashtweezerslounge.com/shop?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Store",
        "@id": "https://lashtweezerslounge.com/#store",
        "name": "Lash Tweezers Lounge",
        "image": "https://lashtweezerslounge.com/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg",
        "telephone": "+92-334-8012580",
        "priceRange": "Rs. 300 - Rs. 15000",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "King99 Street Block No.99 Wajid Town, Dhattal Stop",
          "addressLocality": "Sialkot",
          "addressRegion": "Punjab",
          "postalCode": "51310",
          "addressCountry": "PK"
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-800 pb-16 md:pb-0">
        <RealtimeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <ClientOnlyWidgets />
            </CartProvider>
          </AuthProvider>
        </RealtimeProvider>
      </body>
    </html>
  );
}
