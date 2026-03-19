import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Talk",
  description: "音声・テキストで素早く翻訳し、自分だけのフレーズ集を作成",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#042b48" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a7fb5" media="(prefers-color-scheme: dark)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
        {/* Header */}
        <header
          className="shrink-0"
          style={{
            background: "var(--color-primary)",
          }}
        >
          <div className="max-w-lg mx-auto px-5 py-3">
            <h1
              style={{
                fontFamily: "'Pacifico', cursive",
                fontSize: "1.5rem",
                color: "white",
              }}
            >
              Quick Talk
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-hidden max-w-lg mx-auto px-5 py-6 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
