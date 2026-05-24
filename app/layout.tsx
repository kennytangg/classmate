import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono, Outfit, Lora } from 'next/font/google'
import { ThemeProvider } from 'components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'
import 'katex/dist/katex.min.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'ClassMate - Collaborative Learning Platform',
  description: 'Connect, learn, and grow together with students worldwide.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} ${outfit.variable} ${lora.variable} font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
