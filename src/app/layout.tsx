import type { Metadata } from "next";
import "./variables.css";
import "./global.css";
import "./components.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import Toast from "@/src/components/Toast";
import AuthInitializer from "@/src/components/AuthInitializer";
import QueryProvider from "@/src/components/QueryProvider";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthInitializer />
          <Navbar />
          <main id="app-root" style={{ minHeight: '80vh' }}>
            {children}
          </main>
          <Footer />
          <Toast />
        </QueryProvider>
      </body>
    </html>
  );
}
