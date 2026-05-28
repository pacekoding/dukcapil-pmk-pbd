// app/(website)/layout.tsx

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* PUBLIC NAVBAR */}
      <Navbar />

      {/* CONTENT */}
      <main className="flex-1">{children}</main>

      {/* PUBLIC FOOTER */}
      <Footer />
    </>
  );
}
