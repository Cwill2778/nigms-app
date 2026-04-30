"use client";

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
    /* Force dark rendering — footer is always brand-dark regardless of page theme */
    <footer
      className="w-full mt-auto"
      style={{
        background: "var(--color-navy)",
        borderTop: "2px solid var(--color-navy-bright)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nailedItGeneralMaintenance/Icons/Icon-Default.png"
            alt="Nailed It General Maintenance Solutions"
            style={{ height: "80px", width: "auto" }}
          />
        </div>

        {/* Contact section */}
        <div className="mb-8 text-center">
          <p
            className="text-sm font-semibold uppercase tracking-wide mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "0.1em",
              color: "var(--color-steel-shine)",
            }}
          >
            Point of Contact
          </p>
          <p
            className="text-base font-bold mb-1"
            style={{ color: "var(--color-text-on-navy)" }}
          >
            Charles Willis
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--color-text-on-navy)", opacity: 0.65 }}
          >
            Proudly Serving the Residents of North Georgia
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={PHONE_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors btn-primary"
            >
              <Phone size={15} />
              Call {PHONE}
            </a>

            <a
              href={SMS_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors btn-secondary"
            >
              <Phone size={15} />
              Text {PHONE}
            </a>

            <a
              href={EMAIL_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors btn-secondary"
            >
              <Mail size={15} />
              {EMAIL}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderTop: "1px solid var(--color-navy-bright)" }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--color-text-on-navy)", opacity: 0.6 }}
          >
            &copy; {new Date().getFullYear()} Nailed It General Maintenance Solutions. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors"
                style={{ color: "var(--color-text-on-navy)", opacity: 0.65 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent-orange)";
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-on-navy)";
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "0.65";
                }}
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
