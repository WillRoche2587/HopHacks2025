import type { Metadata } from 'next'
import { Space_Grotesk, DM_Sans } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ImpactGauge - Community Impact Assessment Platform',
  description: 'Comprehensive platform for charitable event planning, optimization, and community impact prediction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} font-sans min-h-screen bg-background text-foreground`}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
