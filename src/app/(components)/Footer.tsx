import Link from "next/link";
import { RepoLink, YouTubeLink } from "../../utils/Website/Contact.util";
import { BLUE_Text_Hover } from "../../utils/CSS/Button.util";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-stone-800 bg-black mt-auto">
      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-stone-400 text-sm">
              © {currentYear} Games Manager Pro. All rights reserved.
            </p>
            <p className="text-stone-500 text-xs mt-1">
              Manage your game collection and activity effortlessly
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {/*<Link
              href="/privacy"
              className={`text-stone-400 ${BLUE_Text_Hover} transition-colors`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className={`text-stone-400 ${BLUE_Text_Hover} transition-colors`}
            >
              Terms of Service
            </Link>
            */}
            <Link
              href="/contact"
              className={`text-stone-400 ${BLUE_Text_Hover} transition-colors`}
            >
              Contact
            </Link>
            <Link
              href={YouTubeLink}
              className={`text-stone-400 ${BLUE_Text_Hover} transition-colors`}
            >
              YouTube
            </Link>
            <Link
              href={RepoLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-stone-400 ${BLUE_Text_Hover} transition-colors`}
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
