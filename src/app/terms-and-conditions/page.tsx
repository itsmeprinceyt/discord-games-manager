"use client";
import Link from "next/link";
import PageWrapper from "../(components)/PageWrapper";
import { Shield, Ban, Mail, Clock } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-linear-to-b from-stone-950 to-black">
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                Terms and Conditions
              </h1>
              <p className="text-lg text-stone-400 max-w-2xl mx-auto">
                Please read these terms carefully before using Games Manager Pro
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Last Updated: March 8, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Terms Grid */}
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  1
                </span>
                Acceptance of Terms
              </h3>
              <p className="text-stone-400 leading-relaxed pl-8">
                By using Games Manager Pro, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions.
                If you do not agree with any part of these terms, please refrain
                from using our platform.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  2
                </span>
                User Responsibilities
              </h3>
              <div className="pl-8 space-y-4">
                <p className="text-stone-400">
                  As a user of Games Manager Pro, you agree to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-red-500/10 rounded-lg mt-0.5">
                      <Ban className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="text-stone-300">
                      <span className="text-red-400 font-medium">
                        No Sensitive or Harmful Content:
                      </span>{" "}
                      You agree not to post any content that is sexually
                      explicit, violent, hateful, or discriminatory in any notes
                      or input fields throughout the project. Any content that
                      may cause harm or distress will result in immediate
                      account termination.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-red-500/10 rounded-lg mt-0.5">
                      <Ban className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="text-stone-300">
                      <span className="text-red-400 font-medium">
                        No Malicious Links:
                      </span>{" "}
                      Sharing harmful, malicious, or illegal websites through
                      notes is strictly prohibited and will lead to an immediate
                      ban.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-500/10 rounded-lg mt-0.5">
                      <Shield className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-stone-300">
                      <span className="text-green-400 font-medium">
                        Respect and Professionalism:
                      </span>{" "}
                      Games Manager Pro is a platform for professional game
                      management and should remain as such.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  3
                </span>
                User Conduct
              </h3>
              <div className="pl-8">
                <p className="text-stone-400 mb-3">
                  The following activities are strictly prohibited:
                </p>
                <ul className="space-y-2 text-stone-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Using the platform for any illegal or unauthorized purposes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Impersonating others or misrepresenting your identity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Attempting to gain unauthorized access to the platform or
                    other user accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Manipulating game data or exploiting system vulnerabilities
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4 & 5 Combined */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    4
                  </span>
                  Content Moderation
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  We reserve the right to monitor and review all content.
                  Violations may result in content removal and account
                  suspension. Our moderation team actively enforces these
                  guidelines to maintain platform integrity.
                </p>
              </div>

              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    5
                  </span>
                  Account Actions
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  We reserve the right to suspend or terminate accounts engaging
                  in violations, including posting harmful content, sharing
                  misleading information, or engaging in spam behavior.
                </p>
              </div>
            </div>

            {/* Section 6 & 7 Combined */}
            <div className="grid gap-6">
              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    6
                  </span>
                  Privacy & Data
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  Your privacy is important to us. Our Privacy Policy details
                  how we collect, use, and protect your information. We employ
                  industry-standard security measures to safeguard your data.
                </p>
              </div>
            </div>

            {/* Section 8 & 9 Combined */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    7
                  </span>
                  Terms Updates
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  We may update these terms at any time. Changes will be posted
                  here with an updated revision date. Continued use constitutes
                  acceptance of the modified terms.
                </p>
              </div>

              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    8
                  </span>
                  Limitation of Liability
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  Games Manager Pro is not liable for in-game suspensions or
                  indirect damages to your game accounts. Use of the platform is
                  at your own risk, as it is solely intended for managing your
                  game inventory.
                </p>
              </div>
            </div>

            {/* Section 10 - Contact */}
            <div className="bg-linear-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  9
                </span>
                Contact Us
              </h3>
              <div className="pl-8">
                <p className="text-stone-400 mb-4">
                  If you have any questions or concerns regarding these Terms
                  and Conditions, please reach out to us:
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 rounded-lg text-stone-200 transition-colors group"
                >
                  <Mail className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Contact Support</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 p-4 text-center">
            <p className="text-sm text-stone-500">
              By using Games Manager Pro, you acknowledge that you have read and
              understood these terms.
              <br />
              <span className="text-stone-600">
                © 2026 Games Manager Pro. All rights reserved.
              </span>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
