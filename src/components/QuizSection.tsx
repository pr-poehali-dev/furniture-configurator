import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';

const steps = [
  {
    key: 'room',
    title: 'Для какой комнаты подбираем мебель?',
    options: [
      { id: 'living', label: 'Гостиная', icon: 'Sofa' },
      { id: 'kitchen', label: 'Кухня', icon: 'ChefHat' },
      { id: 'bedroom', label: 'Спальня', icon: 'BedDouble' },
      { id: 'office', label: 'Кабинет / офис', icon: 'Briefcase' },
    ],
  },
  {
    key: 'item',
    title: 'Какой предмет интересует?',
    options: [
      { id: 'table', label: 'Стол', icon: 'Table' },
      { id: 'chair', label: 'Стул', icon: 'Armchair' },
      { id: 'sofa', label: 'Диван', icon: 'Sofa' },
      { id: 'other', label: 'Другое / не решил', icon: 'HelpCircle' },
    ],
  },
  {
    key: 'budget',
    title: 'Ориентировочный бюджет?',
    options: [
      { id: 'b1', label: 'до 20 000 ₽', icon: 'Wallet' },
      { id: 'b2', label: '20–40 000 ₽', icon: 'Wallet' },
      { id: 'b3', label: '40–80 000 ₽', icon: 'Wallet' },
      { id: 'b4', label: 'от 80 000 ₽', icon: 'Wallet' },
    ],
  },
];

export default function QuizSection() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lead, setLead] = useState({ name: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const total = steps.length + 1;
  const progress = Math.round((Math.min(step, steps.length) / total) * 100) + (done ? 100 - Math.round((steps.length / total) * 100) : 0);

  const pick = (key: string, id: string) => {
    setAnswers((a) => ({ ...a, [key]: id }));
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!lead.name.trim() || !lead.phone.trim() || sending) return;
    setSending(true);
    try {
      await fetch(BACKEND.leads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'quiz', name: lead.name, phone: lead.phone, config: answers }),
      });
    } catch {
      /* ignore */
    } finally {
      setDone(true);
      setSending(false);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setLead({ name: '', phone: '' });
    setDone(false);
  };

  return (
    <section id="quiz" className="py-24 lg:py-32 bg-[#F7F3EC]">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-10">
          <span className="section-label text-[#8B4513]">Подбор за 1 минуту</span>
          <h2 className="section-title text-3xl lg:text-4xl mt-3">
            Не знаете, с чего начать?
          </h2>
          <p className="font-opensans text-[#888] text-sm mt-3 max-w-md mx-auto">
            Ответьте на 3 вопроса — подберём идеальный вариант и пришлём расчёт с подарком.
          </p>
        </div>

        <div className="bg-white border border-[#E8E0D4] p-8 lg:p-10">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between font-montserrat text-[10px] uppercase tracking-widest text-[#999] mb-2">
              <span>Шаг {Math.min(step + 1, total)} из {total}</span>
              <span>{done ? 100 : Math.round((step / total) * 100)}%</span>
            </div>
            <div className="h-1 bg-[#E8E0D4]">
              <div
                className="h-full bg-[#A0784A] transition-all duration-400"
                style={{ width: `${done ? 100 : Math.round((step / total) * 100)}%` }}
              />
            </div>
          </div>

          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#2A3A2A] flex items-center justify-center rounded-full">
                <Icon name="Check" size={28} className="text-green-400" />
              </div>
              <h3 className="font-montserrat font-700 text-[#1A1A1A] text-xl">Спасибо! Заявка принята</h3>
              <p className="font-opensans text-[#888] text-sm mt-2">
                Дизайнер свяжется с вами в течение 30 минут и подберёт лучший вариант с персональной скидкой.
              </p>
              <button onClick={restart} className="mt-6 font-montserrat text-xs uppercase tracking-widest text-[#8B4513] hover:text-[#1A1A1A] transition-colors">
                Пройти заново
              </button>
            </div>
          ) : step < steps.length ? (
            <div>
              <h3 className="font-montserrat font-700 text-[#1A1A1A] text-lg mb-6">{steps[step].title}</h3>
              <div className="grid grid-cols-2 gap-3">
                {steps[step].options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => pick(steps[step].key, o.id)}
                    className="flex items-center gap-3 p-4 border border-[#E8E0D4] hover:border-[#A0784A] hover:bg-[#FAF7F1] transition-all text-left group"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-[#F7F3EC] group-hover:bg-[#A0784A] transition-colors">
                      <Icon name={o.icon} fallback="Circle" size={18} className="text-[#A0784A] group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-montserrat font-600 text-sm text-[#1A1A1A]">{o.label}</span>
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-6 flex items-center gap-1 font-montserrat text-xs uppercase tracking-widest text-[#999] hover:text-[#1A1A1A] transition-colors"
                >
                  <Icon name="ChevronLeft" size={14} />
                  Назад
                </button>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-montserrat font-700 text-[#1A1A1A] text-lg mb-2">Куда прислать подбор?</h3>
              <p className="font-opensans text-[#888] text-sm mb-6">
                Оставьте контакты — пришлём готовые варианты и закрепим скидку 10% на ваш заказ.
              </p>
              <div className="flex flex-col gap-3">
                <input
                  value={lead.name}
                  onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                  placeholder="Ваше имя"
                  className="border border-[#E8E0D4] px-4 py-3 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A0784A] transition placeholder:text-[#bbb]"
                />
                <input
                  value={lead.phone}
                  onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))}
                  placeholder="Телефон"
                  type="tel"
                  className="border border-[#E8E0D4] px-4 py-3 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A0784A] transition placeholder:text-[#bbb]"
                />
                <button
                  onClick={submit}
                  disabled={!lead.name.trim() || !lead.phone.trim() || sending}
                  className="bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-40 disabled:cursor-not-allowed text-white font-montserrat font-700 uppercase tracking-widest text-xs py-4 transition flex items-center justify-center gap-2"
                >
                  {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Gift" size={14} />}
                  {sending ? 'Отправка...' : 'Получить подбор и скидку 10%'}
                </button>
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center justify-center gap-1 font-montserrat text-xs uppercase tracking-widest text-[#999] hover:text-[#1A1A1A] transition-colors"
                >
                  <Icon name="ChevronLeft" size={14} />
                  Назад
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}