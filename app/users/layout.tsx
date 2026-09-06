import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Residents' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
