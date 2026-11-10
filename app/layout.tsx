import './globals.css';
export const metadata = { title: 'Interview Quest', description: 'Gamified interview-readiness tracker' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }