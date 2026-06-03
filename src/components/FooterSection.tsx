import Icon from '@/components/ui/icon';

const navLinks = [
  { label: 'Главная', href: '#hero' },
  { label: 'ИИ-подбор', href: '#room-ai' },
  { label: 'Каталог', href: '#catalog' },
  { label: 'Материалы', href: '#materials' },
  { label: 'Контакты', href: '#contacts' },
];

export default function FooterSection() {
  const handleNav = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="font-montserrat font-900 text-2xl tracking-[0.12em] mb-4">
              ARTORA<span className="text-[#A0784A]">-ai</span>
            </div>
            <p className="font-opensans text-white/50 text-sm leading-relaxed max-w-xs">
              Интернет-магазин мебели с 3D-просмотром, примеркой в интерьере и ИИ-продавцом.
              Экоматериалы, точные размеры, доставка по всей России.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { icon: 'MessageCircle', label: 'Telegram' },
                { icon: 'Instagram', label: 'Instagram' },
                { icon: 'Youtube', label: 'YouTube' },
              ].map((s) => (
                <button
                  key={s.label}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-[#A0784A] hover:bg-[#A0784A] transition-all duration-200 text-white/60 hover:text-white"
                  title={s.label}
                >
                  <Icon name={s.icon} size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="font-montserrat font-700 text-[10px] uppercase tracking-widest text-[#A0784A] mb-4">
              Разделы
            </p>
            <ul className="flex flex-col gap-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <button
                    onClick={() => handleNav(l.href)}
                    className="font-opensans text-white/60 text-sm hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <p className="font-montserrat font-700 text-[10px] uppercase tracking-widest text-[#A0784A] mb-4">
              Контакты
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Icon name="Phone" size={14} className="text-[#A0784A] mt-0.5 flex-shrink-0" />
                <span className="font-opensans text-white/70 text-sm">+7 (800) 100-10-10</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="Mail" size={14} className="text-[#A0784A] mt-0.5 flex-shrink-0" />
                <span className="font-opensans text-white/70 text-sm">hello@artora-ai.ru</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="MapPin" size={14} className="text-[#A0784A] mt-0.5 flex-shrink-0" />
                <span className="font-opensans text-white/70 text-sm">Москва, ул. Мебельная, 15</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-opensans text-white/30 text-xs">
            © 2024 Artora-ai. Все права защищены.
          </p>
          <div className="flex gap-6">
            <button className="font-opensans text-white/30 text-xs hover:text-white/60 transition-colors">
              Политика конфиденциальности
            </button>
            <button className="font-opensans text-white/30 text-xs hover:text-white/60 transition-colors">
              Оферта
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}