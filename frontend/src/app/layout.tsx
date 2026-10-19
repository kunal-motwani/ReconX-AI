import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DesignSystemProvider } from '@/context/DesignSystemContext';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts';

export const metadata: Metadata = {
  title: 'ReconX AI — Autonomous Financial Reconciliation & FinOps Terminal',
  description:
    'HyperBloom Edition: Tactile multi-agent financial reconciliation, 5-factor vector matching, accessible FinOps ergonomics, and cryptographic SOX 404 compliance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-yellow-400 min-h-screen">
        <DesignSystemProvider>
          <AuthProvider>
            {children}
            <CommandPalette />
            <KeyboardShortcuts />
          </AuthProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
