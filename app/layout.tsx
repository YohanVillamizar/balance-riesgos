import React from 'react';

export const metadata = {
  title: 'Balance de Riesgos',
  description: 'Aplicación para análisis y balance de riesgos financieros',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}