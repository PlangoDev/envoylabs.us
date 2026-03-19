export const metadata = {
  title: 'EnvoyLabs',
  description: 'Next-generation platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
