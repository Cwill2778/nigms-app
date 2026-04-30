import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Headings: Montserrat — bold, heavy-duty brand identity (Requirement 1.2)
const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

// Body: Inter — clean, highly legible modern sans (Requirement 1.2)
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Nailed It General Maintenance Solutions",
  description: "Professional handyman and general maintenance services.",
  icons: {
    icon: "/nailedItGeneralMaintenance/Web and Apps/favicon/favicon-128.png",
    shortcut: "/nailedItGeneralMaintenance/Web and Apps/favicon/favicon-128.png",
    apple: "/nailedItGeneralMaintenance/Web and Apps/favicon/favicon-180.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
