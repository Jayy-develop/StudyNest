import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Hayabusa AI — Your Academic Life, Smarter with AI",
  description:
    "Platform pendamping akademik mahasiswa all-in-one: materi kuliah, RAG AI assistant, kuis, jadwal, tugas, dan study planner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased dark">
      <body className="min-h-full bg-[#070b18] font-sans text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
