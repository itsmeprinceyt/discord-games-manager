"use client";
import Link from "next/link";
import PageWrapper from "../(components)/PageWrapper";
import { Mail, Clock, Fingerprint, Key } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-linear-to-b from-stone-950 to-black">
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                Privacy Policy
              </h1>
              <p className="text-lg text-stone-400 max-w-2xl mx-auto">
                How we collect, use, and protect your information at Games
                Manager Pro
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
          {/* Summary Card */}
          <div className="bg-linear-to-br from-blue-500/5 via-blue-500/10 to-blue-500/15 border border-stone-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Our Commitment to Privacy
                </h2>
                <p className="text-stone-400 leading-relaxed">
                  At Games Manager Pro, we believe in minimal data collection.
                  We only collect what&apos;s absolutely necessary to provide
                  and secure our service. This policy explains exactly what we
                  collect and why.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Grid */}
          <div className="space-y-6">
            {/* Section 1 - Information We Collect */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  1
                </span>
                Information We Collect
              </h3>
              <div className="pl-8 space-y-4">
                <p className="text-stone-400">
                  We collect only the following information:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-blue-500/10 rounded-lg mt-0.5">
                      <Mail className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-stone-300">
                      <span className="text-blue-400 font-medium block mb-1">
                        Email Address
                      </span>
                      <span className="text-stone-400 text-sm">
                        Collected to verify user authenticity and for
                        account-related communications. We use this to ensure
                        each user is genuine and to provide account recovery
                        options.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-purple-500/10 rounded-lg mt-0.5">
                      <Fingerprint className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-stone-300">
                      <span className="text-purple-400 font-medium block mb-1">
                        IP Address
                      </span>
                      <span className="text-stone-400 text-sm">
                        Collected temporarily for rate limiting purposes only.
                        This helps us prevent abuse and ensure fair usage of our
                        platform. IP addresses are not permanently stored or
                        used for tracking.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-500/10 rounded-lg mt-0.5">
                      <Key className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-stone-300">
                      <span className="text-green-400 font-medium block mb-1">
                        Password (Hashed)
                      </span>
                      <span className="text-stone-400 text-sm">
                        Your password is securely hashed using industry-standard
                        encryption. We never store plain-text passwords. The
                        hashed version is used solely for authentication
                        purposes.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2 - How We Use Your Information */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  2
                </span>
                How We Use Your Information
              </h3>
              <div className="pl-8">
                <ul className="space-y-3 text-stone-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-2" />
                    <span>
                      <span className="text-blue-400">Email:</span> Used for
                      account verification, important updates, and support
                      communications
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-purple-400 rounded-full mt-2" />
                    <span>
                      <span className="text-purple-400">IP Address:</span> Used
                      temporarily for rate limiting to prevent API abuse and
                      spam
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full mt-2" />
                    <span>
                      <span className="text-green-400">Hashed Password:</span>{" "}
                      Used exclusively for secure authentication
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3 - What We DON'T Collect */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  3
                </span>
                What We DON&apos;T Collect
              </h3>
              <div className="pl-8">
                <p className="text-stone-400 mb-3">We do not collect:</p>
                <ul className="space-y-2 text-stone-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Real names or personal identifiers (beyond email)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Physical addresses or location data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Payment information or credit card details
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Browsing history or tracking cookies
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Device information or analytics data
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4 - Data Protection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    4
                  </span>
                  Data Security
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  Passwords are securely hashed before storage. IP addresses are
                  only temporarily processed for rate limiting and not
                  persistently logged. We implement industry-standard security
                  measures to protect your email and hashed credentials.
                </p>
              </div>

              <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                    5
                  </span>
                  Data Retention
                </h3>
                <p className="text-stone-400 leading-relaxed pl-8">
                  Email and hashed passwords are stored for as long as your
                  account remains active. IP address data is only retained
                  temporarily for rate limiting purposes and not stored
                  long-term.
                </p>
              </div>
            </div>

            {/* Section 6 - Your Rights */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  6
                </span>
                Your Rights
              </h3>
              <div className="pl-8">
                <p className="text-stone-400 mb-3">You have the right to:</p>
                <ul className="space-y-2 text-stone-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Request access to your stored email and account data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Request deletion of your account and associated data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-stone-600 rounded-full" />
                    Update your email address at any time
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 7 - Third Parties */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  7
                </span>
                Third-Party Sharing
              </h3>
              <p className="text-stone-400 leading-relaxed pl-8">
                We do not sell, trade, or transfer your information to third
                parties. Your email and hashed password are used solely for
                platform functionality and are never shared with external
                services.
              </p>
            </div>

            {/* Section 8 - Changes to Policy */}
            <div className="bg-black/40 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  8
                </span>
                Changes to This Policy
              </h3>
              <p className="text-stone-400 leading-relaxed pl-8">
                If we make changes to this privacy policy, we will update the
                &quot;Last Updated&quot; date at the top of this page. Given our
                minimal data collection approach, significant changes are
                unlikely.
              </p>
            </div>

            {/* Section 9 - Contact */}
            <div className="bg-linear-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 border border-stone-800 rounded-xl p-6 hover:border-stone-700 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">
                  9
                </span>
                Contact Us
              </h3>
              <div className="pl-8">
                <p className="text-stone-400 mb-4">
                  If you have any questions about our Privacy Policy or the data
                  we hold about you:
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
            <p className="text-sm text-stone-600">
              © 2026 Games Manager Pro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
