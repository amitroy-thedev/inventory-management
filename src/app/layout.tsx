import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Inventory Control Management System',
  description: 'Inventory Control DBMS project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
