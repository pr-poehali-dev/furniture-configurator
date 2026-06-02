import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useCart } from '@/context/CartContext';
import { BACKEND } from '@/lib/backend';

export default function CartDrawer() {
  const { items, count, total, open, setOpen, remove, setQty, clear } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [sending, setSending] = useState(false);

  const close = () => {
    setOpen(false);
    setTimeout(() => setStep('cart'), 300);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || sending) return;
    setSending(true);
    const orderText = items.map((i) => `${i.title} ×${i.qty} — ${(i.price * i.qty).toLocaleString('ru')} ₽`).join('; ');
    try {
      await fetch(BACKEND.leads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'order',
          name: form.name,
          phone: form.phone,
          message: `Заказ: ${orderText}. Адрес: ${form.address || '—'}`,
          price: total,
        }),
      });
    } catch {
      /* ignore */
    } finally {
      setSending(false);
      setStep('done');
      clear();
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-[60]" onClick={close} />}
      <div
        className={`fixed top-0 right-0 h-full w-[calc(100vw-2rem)] sm:w-[420px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E8E0D4]">
          <h3 className="font-montserrat font-700 text-[#1A1A1A] uppercase tracking-widest text-sm flex items-center gap-2">
            <Icon name="ShoppingBag" size={18} className="text-[#A0784A]" />
            {step === 'checkout' ? 'Оформление' : step === 'done' ? 'Готово' : `Корзина · ${count}`}
          </h3>
          <button onClick={close} className="text-[#999] hover:text-[#1A1A1A]">
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'done' ? (
            <div className="text-center p-8 pt-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F0F7F0] flex items-center justify-center rounded-full">
                <Icon name="Check" size={30} className="text-green-600" />
              </div>
              <h4 className="font-montserrat font-700 text-[#1A1A1A] text-lg">Заказ принят!</h4>
              <p className="font-opensans text-[#888] text-sm mt-2">
                Менеджер свяжется с вами в течение 30 минут для подтверждения и оплаты.
              </p>
              <button onClick={close} className="mt-6 artora-btn-primary">Вернуться в магазин</button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-8 pt-20">
              <Icon name="ShoppingCart" size={36} className="text-[#D2B48C] mx-auto mb-3" />
              <p className="font-montserrat font-700 text-[#999] uppercase tracking-widest text-sm">Корзина пуста</p>
              <button onClick={close} className="mt-5 font-montserrat text-xs uppercase tracking-widest text-[#8B4513] hover:text-[#1A1A1A]">
                Перейти в каталог
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="p-4 space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 border border-[#E8E0D4] p-3">
                  <img src={i.img} alt={i.title} className="w-16 h-16 object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-montserrat font-700 text-[#1A1A1A] text-xs leading-snug">{i.title}</p>
                    <p className="font-montserrat font-900 text-[#1A1A1A] text-sm mt-1">{(i.price * i.qty).toLocaleString('ru')} ₽</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setQty(i.id, i.qty - 1)} className="w-6 h-6 border border-[#E8E0D4] flex items-center justify-center hover:border-[#A0784A]">
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="font-montserrat font-700 text-sm w-6 text-center">{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} className="w-6 h-6 border border-[#E8E0D4] flex items-center justify-center hover:border-[#A0784A]">
                        <Icon name="Plus" size={12} />
                      </button>
                      <button onClick={() => remove(i.id)} className="ml-auto text-[#bbb] hover:text-[#8B4513]">
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ваше имя"
                className="w-full border border-[#E8E0D4] px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A]"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Телефон"
                type="tel"
                className="w-full border border-[#E8E0D4] px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A]"
              />
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Адрес доставки (необязательно)"
                className="w-full border border-[#E8E0D4] px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A]"
              />
              <div className="bg-[#F7F3EC] p-3 text-xs font-opensans text-[#666] flex items-start gap-2">
                <Icon name="ShieldCheck" size={15} className="text-[#A0784A] mt-0.5 flex-shrink-0" />
                Оплата при подтверждении заказа: онлайн-картой, наличными или в рассрочку.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step !== 'done' && (
          <div className="border-t border-[#E8E0D4] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-montserrat text-xs uppercase tracking-widest text-[#999]">Итого</span>
              <span className="font-montserrat font-900 text-[#1A1A1A] text-xl">{total.toLocaleString('ru')} ₽</span>
            </div>
            {step === 'cart' ? (
              <button onClick={() => setStep('checkout')} className="w-full artora-btn-primary flex items-center justify-center gap-2">
                Оформить заказ
                <Icon name="ArrowRight" size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={submit}
                  disabled={!form.name.trim() || !form.phone.trim() || sending}
                  className="w-full artora-btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {sending ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="CreditCard" size={16} />}
                  {sending ? 'Отправка...' : 'Подтвердить заказ'}
                </button>
                <button onClick={() => setStep('cart')} className="w-full font-montserrat text-xs uppercase tracking-widest text-[#999] hover:text-[#1A1A1A] py-1">
                  Назад в корзину
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
