import './globals.css'

export const metadata = {
  title: 'Hello World App',
  description: 'A simple Next.js hello world application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}