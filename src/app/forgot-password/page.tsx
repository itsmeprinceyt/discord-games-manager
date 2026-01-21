"use client";
import Link from "next/link";
import PageWrapper from "../(components)/PageWrapper";

export default function ForgotPassowrd() {
  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-extralight mb-6">
            If you&apos;ve forgotten your password, please contact us and we’ll help
            you reset it.
          </p>

          <Link
            href="/contact"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-full transition-colors"
          >
            Contact Me
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
