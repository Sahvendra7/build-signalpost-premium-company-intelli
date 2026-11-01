import "./globals.css"
import "./signalpost.css"
import { Geist, Geist_Mono, Source_Serif_4 } from 'next/font/google'
import { WorkspaceProvider } from '@/components/signalpost/workspace'
import { AppShell } from '@/components/signalpost/shell'
const sans = Geist({ subsets:['latin'], variable:'--font-geist' })
const mono = Geist_Mono({ subsets:['latin'], variable:'--font-geist-mono' })
const editorial = Source_Serif_4({ subsets:['latin'], variable:'--font-editorial' })
export const metadata = { title: 'Signalpost — Company Intelligence', description: 'Company intelligence grounded in evidence.' }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${editorial.variable}`}>
        <WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider>
      </body>
    </html>
  )
}
