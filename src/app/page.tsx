"use client";
import Link from "next/link";
import PageWrapper from "./(components)/PageWrapper";

export default function MinimalHero() {
  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl text-white mb-6">
            Games Manager{" "}
            <span className="text-blue-800 font-extralight">Pro</span>
          </h1>

          <Link
            href="/register"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
