import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRafiki } from '../../context/RafikiContext';
import { WhatsAppButton } from '../ui/ContactButtons';
import { WhatsAppMessages } from '../../lib/whatsapp';

export const Navbar: React.FC = () => {
  const { pathname, navigate } = useRafiki();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Stays', href: '/stays' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Admin', href: '/admin' },
  ];

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    navigate(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-xs border-b border-[#1A1D1B]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => handleNav(e, '/')}
          className="font-serif text-2xl sm:text-[28px] font-semibold tracking-tight text-[#1A1D1B] whitespace-nowrap shrink-0"
        >
          Rafiki Airbnbs
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A4E48]"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNav(e, item.href)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-[#1A1D1B] border-[#2C4C3E] font-semibold'
                    : 'border-transparent hover:text-[#1A1D1B] hover:border-[#1A1D1B]/30'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WhatsAppButton
              label="Chat on WhatsApp"
              size="sm"
              variant="primary"
              message={WhatsAppMessages.generalInquiry()}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2.5 rounded-lg text-[#1A1D1B] hover:bg-[#F2EFE9] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1A1D1B]/8 bg-[#FBF9F5] px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F2EFE9] text-[#1A1D1B] font-semibold'
                      : 'text-[#4A4E48] hover:bg-[#F2EFE9]/60 hover:text-[#1A1D1B]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-[#1A1D1B]/8">
            <WhatsAppButton
              label="Chat with Rafiki Airbnbs"
              size="md"
              variant="primary"
              className="w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
};
