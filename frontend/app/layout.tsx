import type { Metadata } from "next";

import "./globals.css";

import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";

export const metadata: Metadata = {
  title: "Al Merak Review & Approval Portal",
  description: "Role-based proposal review and approval system for Al Merak.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
