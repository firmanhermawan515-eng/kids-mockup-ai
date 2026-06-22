import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Mockup Generator V10 Real Mockup",
  description: "Mockup produk anak, thumbnail, video, listing, dan export olshop."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
