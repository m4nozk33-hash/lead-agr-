import './globals.css';
import CnpjAutofill from './CnpjAutofill';

export const metadata = { title: 'AGR LeadHunter' };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <CnpjAutofill />
        {children}
      </body>
    </html>
  );
}
