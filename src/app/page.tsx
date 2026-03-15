"use client";

import Link from "next/link";
import Image from "next/image";
import PageWrapper from "./(components)/PageWrapper";
import { BLUE_Button, BLUE_Text } from "../utils/CSS/Button.util";

export default function MinimalHero() {
  return (
    <PageWrapper>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Glow Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Blue glow */}
          <div className="absolute w-105 h-105 bg-blue-500/30 blur-[140px] rounded-full animate-[pulse_12s_ease-in-out_infinite]" />

          {/* Yellow glow */}
          <div className="absolute w-75 h-75 bg-yellow-400/30 blur-[120px] rounded-full translate-x-24 translate-y-10 animate-[pulse_18s_ease-in-out_infinite]" />
        </div>

        {/* Content */}
        <div className="relative text-center px-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative w-30 sm:w-37.5 md:w-45 lg:w-55 xl:w-65 aspect-square">
              {/* subtle glow behind logo */}
              <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-125 animate-[pulse_30s_ease-in-out_infinite]" />

              <Image
                src="/logo/logo3.svg"
                alt="Games Manager Pro Logo"
                fill
                className="object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.55)]"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl text-white mb-4 tracking-tight">
            Games Manager <span className={`${BLUE_Text} font-light`}>Pro</span>
          </h1>

          {/* Subtitle */}
          <p className="text-stone-400 mb-8 text-sm md:text-base">
            Manage all your gaming accounts in one place.
          </p>

          {/* CTA */}
          <Link
            href="/login"
            className={`inline-block px-7 py-3 text-sm font-medium text-white ${BLUE_Button} rounded-full transition-all hover:scale-105 active:scale-95`}
          >
            Get Started
          </Link>
        </div>
      </div>

      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-7xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-stone-400 text-xl sm:text-2xl border-b border-white/30 pb-4 inline-block">
              Watch the project explanation
            </h2>

            {/* Bigger video container - using full width with max-w-6xl */}
            <div className="relative aspect-video w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                src="https://www.youtube.com/embed/eDXwfjrHNUI?si=SmoCJpJf9J8WSMkT"
                title="Project Explanation Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
