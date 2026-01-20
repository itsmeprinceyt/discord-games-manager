"use client";

import Link from "next/link";

import PageWrapper from "./(components)/PageWrapper";

export default function Home() {
  return (
    <PageWrapper>
      <div className="text-white min-h-screen flex flex-col items-center justify-center">
        Hello
        <div className="flex flex-col items-center justify-center gap-2">
          <Link href="/login" className="bg-stone-700 p-2 rounded-md px-4">
            Login
          </Link>
          <Link href="/sign-up" className="bg-stone-700 p-2 rounded-md px-4">
            Sign up
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
