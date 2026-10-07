import './globals.css';
export const metadata = { title: 'AGR LeadHunter' };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></head><body>{children}</body></html>;
}
