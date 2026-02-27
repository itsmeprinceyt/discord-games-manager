import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { SessionProviderNextAuth } from "./(components)/SessionProvider";

import HomePageHeartbeat from "../hooks/HeartBeat";
import ClientNavbarWrapper from "./(components)/DynamicNavbar";
import Footer from "./(components)/Footer";
import LoaderFullscreen from "./(components)/LoaderFullscreen";

export const metadata: Metadata = {
  metadataBase: new URL("https://games-manager-pro.vercel.app/"),
  title:
    "Games Manager Pro | Manage All Your Game Accounts in One Place | Itsme Prince",
  description:
    "Games Manager Pro is a personal web app that helps you securely manage, organize, and track all your gaming accounts in one place. Built by ItsMe Prince for gamers who want clean and simple account management.",

  keywords: [
    "Games Manager Pro",
    "game account manager",
    "gaming account organizer",
    "manage game accounts online",
    "gaming dashboard",
    "game account tracker",
    "secure game account storage",
    "ItsMe Prince projects",
    "personal gaming tools",
    "indie developer tools",
  ],

  authors: [{ name: "ItsMe Prince (Mohd Uvaish)" }],
  creator: "ItsMe Prince",
  publisher: "ItsMe Prince",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://games-manager-pro.vercel.app/",
  },
  icons: {
    icon: "/logo/logo3.svg",
    apple: "/logo/logo3.svg",
  },
  openGraph: {
    title: "Games Manager Pro — Smart Game Account Manager",
    description:
      "Organize and manage all your gaming accounts in one place with Games Manager Pro. A fast, secure, and minimal web app built for gamers.",
    url: "https://games-manager-pro.vercel.app/",
    siteName: "Games Manager Pro",
    images: [
      {
        url: "/logo/logo3.svg",
        width: 1200,
        height: 630,
        alt: "Games Manager Pro",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Games Manager Pro — Smart Game Account Manager",
    description:
      "A clean and secure web app to manage all your gaming accounts in one place. Built by ItsMe Prince.",
    creator: "@ItsMePrince",
    images: ["/logo/logo3.svg"],
  },

  category: "technology",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="select-none">
        <SessionProviderNextAuth>
          <Suspense fallback={<LoaderFullscreen text={"Games Manager Pro"} />}>
            <HomePageHeartbeat />
            <ClientNavbarWrapper />
            {children}
            <Toaster
              position="bottom-left"
              toastOptions={{
                style: {
                  fontSize: "14px",
                  background: "black",
                  color: "white",
                },
              }}
            />
            <Footer />
          </Suspense>
        </SessionProviderNextAuth>
      </body>
    </html>
  );
}
