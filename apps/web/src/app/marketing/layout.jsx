import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { Moon, Sun, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Footer } from '../../components/layout/Footer';

export default function MarketingLayout() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/integrations', label: 'Integrations' },
    { to: '/case-studies', label: 'Case Studies' },
    { to: '/blog', label: 'Blog' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-semibold text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-white">
              U
            </div>
            Unified PMS
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              to="/app"
              className="hidden h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90 sm:inline-flex"
            >
              Get Started
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
