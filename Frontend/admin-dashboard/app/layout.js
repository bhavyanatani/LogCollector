import './globals.css';

export const metadata = {
  title: 'LogCollector Admin Analytics',
  description: 'Production observability and monitoring dashboard for microservices logs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
