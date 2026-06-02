import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { label: 'Главная', href: '#hero' },
  { label: 'Конструктор', href: '#constructor' },
  { label: 'ИИ-подбор', href: '#room-ai' },
  { label: 'Каталог', href: '#catalog' },
  { label: 'Материалы', href: '#materials' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Контакты', href: '#contacts' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + href);
      return;
    }
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
          className="font-montserrat font-900 text-xl tracking-[0.12em] text-[#1A1A1A]"
        >
          ARTORA<span className="text-[#A0784A]">-ai</span>
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="relative p-2.5 text-[#1A1A1A] hover:text-[#8B4513] transition-colors"
            aria-label="Корзина"
          >
            <Icon name="ShoppingBag" size={22} />
            {count > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-[#8B4513] text-white rounded-full text-[10px] font-montserrat font-700 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNav('#catalog')}
            className="hidden lg:block artora-btn-primary text-xs py-3 px-6"
          >
            В каталог
          </button>

          <button
            className="lg:hidden p-2 text-[#1A1A1A]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            <Icon name={menuOpen ? 'X' : 'Menu'} size={24} />
          </button>
        </div>
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
            onClick={() => handleNav('#catalog')}
            className="artora-btn-primary text-xs py-3 mt-2"
          >
            В каталог
          </button>
        </div>
      )}
    </header>
  );
}