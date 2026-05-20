import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./variables.css";
import "./global.css";
import "./components.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import Toast from "@/src/components/Toast";
import AuthInitializer from "@/src/components/AuthInitializer";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  weight: ['400', '700', '900']
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});

export const metadata: Metadata = {
  title: "GiziKita — Program Makan Bergizi Gratis",
  description: "Platform digital transparansi dan logistik Program Makan Bergizi Gratis Nasional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        <AuthInitializer />
        <Navbar />
        <main id="app-root" style={{ minHeight: '80vh' }}>
          {children}
        </main>
        <Footer />
        <Toast />
      </body>
    </html>
  );
}
