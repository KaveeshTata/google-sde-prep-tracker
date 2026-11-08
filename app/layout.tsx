import './globals.css';
export const metadata = { title: 'SWE Prep OS', description: 'Personal SWE interview preparation tracker' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }