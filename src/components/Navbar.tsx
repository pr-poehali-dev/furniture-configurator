import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const navLinks = [
  { label: 'Главная', href: '#hero' },
  { label: 'Конструктор', href: '#constructor' },
  { label: 'Каталог', href: '#catalog' },
  { label: 'Материалы', href: '#materials' },
  { label: 'Контакты', href: '#contacts' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-[#E8E0D4] shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16 lg:h-20">
        <button
          onClick={() => handleNav('#hero')}
          className="font-montserrat font-900 text-xl tracking-[0.15em] text-[#1A1A1A] uppercase"
        >
          ARTORA
        </button>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => handleNav(l.href)}
              className="font-montserrat text-xs font-600 uppercase tracking-widest text-[#555] hover:text-[#8B4513] transition-colors duration-200"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => handleNav('#constructor')}
          className="hidden lg:block artora-btn-primary text-xs py-3 px-6"
        >
          Начать сборку
        </button>

        <button
          className="lg:hidden p-2 text-[#1A1A1A]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          <Icon name={menuOpen ? 'X' : 'Menu'} size={24} />
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E8E0D4] px-6 pb-6 pt-4 flex flex-col gap-4">
          {navLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => handleNav(l.href)}
              className="font-montserrat text-sm font-600 uppercase tracking-widest text-left text-[#1A1A1A] py-2 border-b border-[#E8E0D4]"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => handleNav('#constructor')}
            className="artora-btn-primary text-xs py-3 mt-2"
          >
            Начать сборку
          </button>
        </div>
      )}
    </header>
  );
}
