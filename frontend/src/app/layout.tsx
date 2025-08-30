import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'EventVerse',
  description: 'Blockchain-powered event ticketing platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/assets/botImage.png" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
