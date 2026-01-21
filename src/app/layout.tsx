import "./globals.css";

import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { SessionProviderNextAuth } from "./(components)/SessionProvider";

import HomePageHeartbeat from "../hooks/HeartBeat";
import Navbar from "./(components)/Navbar";

export const metadata: Metadata = {
  title: "Games Manager Pro | ItsMe Prince",
  description:
    "A personal web application through which you can manage your games accounts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviderNextAuth>
          <Suspense fallback={<div>loading ...</div>}>
            <HomePageHeartbeat />
            <Navbar />
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
          </Suspense>
        </SessionProviderNextAuth>
      </body>
    </html>
  );
}
