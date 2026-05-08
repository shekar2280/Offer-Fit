import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AnalysisProvider } from "@/lib/context/analysis-context";
import { QueryProvider } from "@/components/providers/query-provider";
import { WorkspaceUIProvider } from "@/lib/context/workspace-ui-context";
import { TransitionShell } from "@/components/layout/transition-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description: "Advanced career intelligence and resume optimization engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#020202] text-white antialiased`}>
        <QueryProvider>
          <AnalysisProvider>
            <WorkspaceUIProvider>
              <TransitionShell>
                {children}
              </TransitionShell>
            </WorkspaceUIProvider>
          </AnalysisProvider>
        </QueryProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          closeButton
          richColors
          toastOptions={{
            style: {
              background: 'rgba(8, 8, 8, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1.25rem',
            }
          }}
        />
      </body>
    </html>
  );
}
