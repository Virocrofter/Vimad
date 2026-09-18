import type { JSX } from 'react';
import { Link } from 'react-router-dom';

export function Footer(): JSX.Element {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Unified PMS</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Modern property management for hotels that want to grow.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>
                  <Link to="/features" className="hover:text-text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/alternative/opera-5" className="hover:text-text-primary">
                    OPERA 5 Alternative
                  </Link>
                </li>
                <li>
                  <Link to="/alternative/hilton-onq" className="hover:text-text-primary">
                    Hilton OnQ Alternative
                  </Link>
                </li>
                <li>
                  <Link to="/alternative/cloudbeds" className="hover:text-text-primary">
                    Cloudbeds Alternative
                  </Link>
                </li>
              </ul>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/demo" className="hover:text-text-primary">
                  Request Demo
                </Link>
              </li>
              <li>
                <span className="hover:text-text-primary cursor-pointer">About</span>
              </li>
              <li>
                <span className="hover:text-text-primary cursor-pointer">Contact</span>
              </li>
              <li>
                <Link to="/partners" className="hover:text-text-primary">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>
                <Link to="/privacy" className="hover:text-text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className="hover:text-text-primary">
                  GDPR
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-text-muted">
          © 2026 Unified PMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
