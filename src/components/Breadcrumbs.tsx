import Icon from '@/components/ui/icon';

const CRUMBS = [
  { label: 'Главная', href: '#hero' },
  { label: 'Конструктор мебели', href: '#constructor' },
  { label: 'Каталог', href: '#catalog' },
  { label: 'Материалы', href: '#materials' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Контакты', href: '#contacts' },
];

const SITE = 'https://artora-ai.ru/';

export default function Breadcrumbs() {
  const handleNav = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: CRUMBS.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${SITE}${c.href}`,
    })),
  };

  return (
    <nav aria-label="Хлебные крошки" className="bg-[#F7F3EC] border-b border-[#E8E0D4]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ol className="flex flex-wrap items-center gap-1 py-3 font-montserrat text-[11px] uppercase tracking-widest">
          {CRUMBS.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1">
              {i === 0 ? (
                <button
                  onClick={() => handleNav(c.href)}
                  className="flex items-center gap-1 text-[#8B4513] hover:text-[#1A1A1A] transition-colors"
                >
                  <Icon name="Home" size={13} />
                  {c.label}
                </button>
              ) : (
                <button
                  onClick={() => handleNav(c.href)}
                  className="text-[#888] hover:text-[#8B4513] transition-colors"
                >
                  {c.label}
                </button>
              )}
              {i < CRUMBS.length - 1 && <Icon name="ChevronRight" size={13} className="text-[#C4B59E]" />}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}