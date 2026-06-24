import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'CEO Brain — Funil de Vendas Inteligente',
    template: '%s | CEO Brain',
  },
  description: 'Gerencie seu funil de vendas com inteligência. Consulta de CNPJ integrada, automações e relatórios em tempo real.',
  keywords: ['CRM', 'funil de vendas', 'CNPJ', 'automação', 'gestão comercial'],
  authors: [{ name: 'CEO Brain' }],
  openGraph: {
    title: 'CEO Brain — Funil de Vendas Inteligente',
    description: 'CRM com CNPJ integrado por R$ 99/mês',
    url: 'https://ceobrain.com.br',
    siteName: 'CEO Brain',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
