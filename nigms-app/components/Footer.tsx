import Link from "next/link";
import { Phone, Mail } from "lucide-react";

const legalLinks = [
  { href: "/legal/arbitration", label: "Arbitration Agreement" },
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/data-use", label: "How We Use Your Data" },
];

const PHONE = "(706) 844-8059";
const PHONE_HREF = "tel:+17068448059";
const SMS_HREF = "sms:+17068448059";
const EMAIL = "charles@naileditpropertysolutions.com";
const EMAIL_HREF = `mailto:${EMAIL}`;

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Contact section */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
            Point of Contact
          </p>
          <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Charles Willis
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Proudly Serving the Residents of North Georgia
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {/* Call */}
            <a
              href={PHONE_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              <Phone size={15} />
              Call {PHONE}
            </a>

            {/* Text */}
            <a
              href={SMS_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              <Phone size={15} />
              Text {PHONE}
            </a>

            {/* Email */}
            <a
              href={EMAIL_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              <Mail size={15} />
              {EMAIL}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Nailed It General Maintenance Solutions. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

      </div>
    </footer>
  );
}
