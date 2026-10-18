import "./globals.css"
import "./signalpost.css"
import { Geist, Geist_Mono, Source_Serif_4 } from 'next/font/google'
import { WorkspaceProvider } from '@/components/signalpost/workspace'
import { AppShell } from '@/components/signalpost/shell'
const sans = Geist({ subsets:['latin'], variable:'--font-geist' })
const mono = Geist_Mono({ subsets:['latin'], variable:'--font-geist-mono' })
const editorial = Source_Serif_4({ subsets:['latin'], variable:'--font-editorial' })
export const metadata = { title: 'Signalpost — Company Intelligence', description: 'Company intelligence grounded in evidence.', icons: { icon: 'https://keystone.jboxai.com/project-assets/ldgsfom8rk1binqhqdldgwx3/vkbqv7chk8zzc3s754vhl9cy/cad54c9ea410338d82dab051329739a322957cd550e3baee4e76bbdd71ad5c44/cad54c9ea410338d.svg' } }

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
