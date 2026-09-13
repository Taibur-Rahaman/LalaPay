import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LalaPay',
  description: 'Simple payment links with bKash and Nagad.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
