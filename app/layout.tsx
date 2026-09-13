import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'LalaPay — Payment Links', template: '%s · LalaPay' },
  description: 'Fast, simple payment links for Bangladesh businesses with bKash and Nagad.',
  applicationName: 'LalaPay',
  keywords: ['LalaPay', 'payment link', 'bKash', 'Nagad', 'Bangladesh payments'],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
