import './globals.css';

export const metadata = {
  title: 'Cloud Agnostic Control Plane (CACP)',
  description: 'Unified intelligence layer that aggregates fragmented business data across SaaS tools, databases, and messaging applications.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
