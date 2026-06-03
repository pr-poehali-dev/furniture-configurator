import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';

type Role = 'manager' | 'marketer' | 'seller';
type Msg = { role: 'user' | 'assistant'; content: string };
type Stats = { productsActive: number; leadsNew: number; leadsWeek: number; avgPrice: number };

const ROLES: { id: Role; name: string; icon: string; desc: string; hint: string }[] = [
  { id: 'manager', name: 'Менеджер проекта', icon: 'ClipboardList', desc: 'Контроль процесса и задач', hint: 'Что мне сделать сегодня в первую очередь?' },
  { id: 'marketer', name: 'Маркетолог', icon: 'TrendingUp', desc: 'Идеи для роста продаж', hint: 'Предложи акцию на этой неделе' },
  { id: 'seller', name: 'Продавец', icon: 'HandCoins', desc: 'Скрипты и допродажи', hint: 'Как дожать клиентов из новых заявок?' },
];

export default function AdminAssistants({ token }: { token: string }) {
  const [role, setRole] = useState<Role>('manager');
  const [chats, setChats] = useState<Record<Role, Msg[]>>({ manager: [], marketer: [], seller: [] });
  const [stats, setStats] = useState<Stats | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const headers = token ? { 'Content-Type': 'application/json', 'X-Admin-Token': token } : { 'Content-Type': 'application/json' };
  const messages = chats[role];
  const current = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question: string) => {
    if (loading) return;
    setError('');
    const history = chats[role];
    const newHistory: Msg[] = question ? [...history, { role: 'user', content: question }] : history;
    if (question) setChats((c) => ({ ...c, [role]: newHistory }));
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(BACKEND.aiAssistants, {
        method: 'POST', headers,
        body: JSON.stringify({ role, question, messages: history.slice(-8) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка ИИ'); return; }
      if (data.stats) setStats(data.stats);
      setChats((c) => ({ ...c, [role]: [...newHistory, { role: 'assistant', content: data.reply }] }));
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Новых заявок', value: stats.leadsNew, icon: 'Inbox' },
            { label: 'Заявок за неделю', value: stats.leadsWeek, icon: 'CalendarDays' },
            { label: 'Товаров на сайте', value: stats.productsActive, icon: 'Package' },
            { label: 'Средний чек, ₽', value: stats.avgPrice.toLocaleString('ru'), icon: 'Wallet' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#E8E0D4] p-4">
              <Icon name={s.icon} size={16} className="text-[#A0784A] mb-2" />
              <p className="font-montserrat font-900 text-[#1A1A1A] text-xl">{s.value}</p>
              <p className="font-opensans text-[#999] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role switch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`flex items-center gap-3 p-4 border text-left transition ${
              role === r.id ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E8E0D4] text-[#1A1A1A] hover:border-[#A0784A]'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${role === r.id ? 'bg-[#A0784A]' : 'bg-[#F0E8DC]'}`}>
              <Icon name={r.icon} size={18} className={role === r.id ? 'text-white' : 'text-[#A0784A]'} />
            </div>
            <div>
              <p className="font-montserrat font-700 text-sm">{r.name}</p>
              <p className={`font-opensans text-xs ${role === r.id ? 'text-white/60' : 'text-[#999]'}`}>{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 font-opensans text-sm">{error}</div>}

      {/* Chat */}
      <div className="bg-white border border-[#E8E0D4] flex flex-col" style={{ height: '480px' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-[#F0E8DC] flex items-center justify-center mb-3">
                <Icon name={current.icon} size={24} className="text-[#A0784A]" />
              </div>
              <p className="font-montserrat font-700 text-[#1A1A1A]">{current.name}</p>
              <p className="font-opensans text-[#999] text-sm mt-1 max-w-sm">{current.desc}. Нажмите «Сделать анализ» или задайте вопрос.</p>
              <button onClick={() => ask('')} className="mt-5 artora-btn-primary inline-flex items-center gap-2 text-xs">
                <Icon name="Sparkles" size={14} /> Сделать анализ
              </button>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 text-sm font-opensans whitespace-pre-wrap leading-relaxed ${
                m.role === 'user' ? 'bg-[#1A1A1A] text-white rounded-l-xl rounded-tr-xl' : 'bg-[#FAF7F1] border border-[#E8E0D4] text-[#1A1A1A] rounded-r-xl rounded-tl-xl'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#FAF7F1] border border-[#E8E0D4] px-4 py-3 rounded-r-xl rounded-tl-xl flex items-center gap-2">
                <Icon name="Loader" size={15} className="text-[#A0784A] animate-spin" />
                <span className="font-opensans text-[#999] text-sm">Анализирую данные...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#E8E0D4] p-3 flex gap-2">
          {messages.length > 0 && (
            <button onClick={() => ask('')} disabled={loading} title="Обновить анализ" className="px-3 border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] disabled:opacity-50 transition flex items-center">
              <Icon name="Sparkles" size={16} />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && ask(input.trim())}
            placeholder={current.hint}
            className="flex-1 border border-[#E8E0D4] px-4 py-2.5 font-opensans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A0784A] transition placeholder:text-[#bbb]"
          />
          <button onClick={() => input.trim() && ask(input.trim())} disabled={loading || !input.trim()} className="bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-40 text-white px-5 transition flex items-center justify-center">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
