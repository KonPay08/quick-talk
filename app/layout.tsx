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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        {/* Header */}
        <header
          className="sticky top-0 z-50"
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
        <main className="max-w-lg mx-auto px-5 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
