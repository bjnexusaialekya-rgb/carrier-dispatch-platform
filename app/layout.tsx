import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrier Dispatch Express",
  description: "Athlete vehicle transport portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
