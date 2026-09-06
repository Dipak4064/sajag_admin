import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/admin-shell';

export const metadata: Metadata = {
  title: { default: 'Command Center', template: '%s · SAJAG Ops' },
  description: 'Kathmandu Metropolitan Disaster Operations & Command Center',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="aurora-bg min-h-screen font-sans text-slate-100 antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
