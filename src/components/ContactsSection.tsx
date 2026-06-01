import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function ContactsSection() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contacts" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <span className="section-label">Свяжитесь с нами</span>
            <h2 className="section-title text-4xl lg:text-5xl mt-3 mb-8">
              Контакты
            </h2>

            <div className="space-y-6 mb-10">
              {[
                { icon: 'Phone', label: 'Телефон', value: '+7 (800) 100-10-10', sub: 'Бесплатно по России' },
                { icon: 'Mail', label: 'Email', value: 'hello@artora.ru', sub: 'Ответим в течение часа' },
                { icon: 'MapPin', label: 'Адрес', value: 'Москва, ул. Мебельная, 15', sub: 'Пн–Сб: 10:00–19:00' },
              ].map((c) => (
                <div key={c.label} className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-[#E8E0D4] flex items-center justify-center flex-shrink-0">
                    <Icon name={c.icon} size={18} className="text-[#A0784A]" />
                  </div>
                  <div>
                    <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999]">{c.label}</p>
                    <p className="font-montserrat font-700 text-[#1A1A1A] text-sm mt-0.5">{c.value}</p>
                    <p className="font-opensans text-[#999] text-xs mt-0.5">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div>
              <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-3">Соцсети</p>
              <div className="flex gap-3">
                {[
                  { icon: 'MessageCircle', label: 'Telegram' },
                  { icon: 'Instagram', label: 'Instagram' },
                  { icon: 'Youtube', label: 'YouTube' },
                ].map((s) => (
                  <button
                    key={s.label}
                    className="w-10 h-10 border-2 border-[#E8E0D4] flex items-center justify-center hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#888] transition-all duration-200"
                    title={s.label}
                  >
                    <Icon name={s.icon} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-[#FAFAF8] p-8 border border-[#E8E0D4]">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCheck" size={28} className="text-[#D2B48C]" />
                </div>
                <h3 className="font-montserrat font-800 text-xl text-[#1A1A1A] mb-2">Отправлено!</h3>
                <p className="font-opensans text-[#888] text-sm">
                  Мы получили вашу заявку и свяжемся с вами в ближайшее время.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }); }}
                  className="mt-6 artora-btn-outline text-xs"
                >
                  Отправить ещё
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-montserrat font-800 text-xl text-[#1A1A1A] mb-6 uppercase tracking-wide">
                  Отправить запрос
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] block mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-[#E8E0D4] bg-white px-4 py-3 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                      placeholder="Иван Петров"
                    />
                  </div>
                  <div>
                    <label className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] block mb-1">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-[#E8E0D4] bg-white px-4 py-3 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>
                  <div>
                    <label className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] block mb-1">
                      Сообщение
                    </label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full border border-[#E8E0D4] bg-white px-4 py-3 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
                      placeholder="Опишите, что вас интересует..."
                    />
                  </div>
                  <button type="submit" className="artora-btn-primary flex items-center justify-center gap-2">
                    <Icon name="Send" size={14} />
                    Отправить заявку
                  </button>
                  <p className="font-opensans text-[#bbb] text-[11px] text-center">
                    Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
