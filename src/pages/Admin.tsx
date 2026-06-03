import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminAssistants from '@/components/admin/AdminAssistants';

const FURNITURE_LABELS: Record<string, string> = { table: 'Стол', shelf: 'Стеллаж', nightstand: 'Тумба' };
const MATERIAL_LABELS: Record<string, string> = { oak: 'Дуб', walnut: 'Орех', white: 'Белый лак' };
const SIZE_LABELS: Record<string, string> = { s: '80×60', m: '120×75', l: '160×90' };
const HARDWARE_LABELS: Record<string, string> = { none: 'без ручек', h1: 'латунь', h2: 'мат. железо', h3: 'дерево' };

type Lead = {
  id: number;
  source: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  config: Record<string, string> | null;
  price: number | null;
  status: string;
  emailed: boolean;
  created_at: string | null;
};

type Chat = {
  id: number;
  session_id: string;
  messages: { role: string; content: string }[];
  created_at: string | null;
  updated_at: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function configStr(c: Lead['config']) {
  if (!c) return '—';
  const parts = [
    FURNITURE_LABELS[c.furniture] || c.furniture,
    MATERIAL_LABELS[c.material] || c.material,
    SIZE_LABELS[c.size] ? `${SIZE_LABELS[c.size]} см` : c.size,
    HARDWARE_LABELS[c.hardware] || c.hardware,
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('artora_admin_token') || '');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'products' | 'assistants' | 'leads' | 'chats'>('products');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [counts, setCounts] = useState({ leads: 0, chats: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openChat, setOpenChat] = useState<Chat | null>(null);

  const load = useCallback(async (t: string, which: 'leads' | 'chats') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND.admin}?tab=${which}`, {
        headers: t ? { 'X-Admin-Token': t } : {},
      });
      if (res.status === 401) {
        setError('Неверный токен доступа');
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка загрузки');
        return;
      }
      setCounts({ leads: data.leads_count ?? 0, chats: data.chats_count ?? 0 });
      if (which === 'leads') setLeads(data.leads || []);
      else setChats(data.chats || []);
      setAuthed(true);
      localStorage.setItem('artora_admin_token', t);
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && (tab === 'leads' || tab === 'chats')) load(token, tab);
  }, [tab]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="font-montserrat font-900 text-white text-2xl tracking-[0.15em] uppercase text-center mb-2">
            ARTORA
          </div>
          <p className="font-opensans text-white/40 text-xs text-center uppercase tracking-widest mb-8">Панель управления</p>
          <div className="bg-[#242424] p-8">
            <label className="font-montserrat text-[10px] uppercase tracking-widest text-white/50 block mb-2">
              Токен доступа
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(token, 'leads')}
              placeholder="Введите токен"
              className="w-full bg-white/5 border border-[#333] text-white px-4 py-3 font-opensans text-sm focus:outline-none focus:border-[#A0784A] transition mb-4 placeholder:text-white/30"
            />
            {error && <p className="font-opensans text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={() => load(token, 'leads')}
              disabled={loading}
              className="w-full bg-[#A0784A] hover:bg-[#8B4513] text-white font-montserrat font-700 uppercase tracking-widest text-xs py-3.5 transition flex items-center justify-center gap-2"
            >
              {loading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="LogIn" size={14} />}
              Войти
            </button>
            <p className="font-opensans text-white/30 text-[11px] text-center mt-4">
              Если токен не задан в настройках — оставьте поле пустым
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-montserrat font-900 text-lg tracking-[0.15em] uppercase">ARTORA</span>
            <span className="font-opensans text-white/40 text-xs uppercase tracking-widest">Админ-панель</span>
          </div>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem('artora_admin_token'); }}
            className="font-montserrat text-[10px] uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1.5 transition"
          >
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition ${
              tab === 'products' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
            }`}
          >
            <Icon name="Package" size={15} />
            Товары
          </button>
          <button
            onClick={() => setTab('assistants')}
            className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition ${
              tab === 'assistants' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
            }`}
          >
            <Icon name="Bot" size={15} />
            ИИ-помощники
          </button>
          <button
            onClick={() => setTab('leads')}
            className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition ${
              tab === 'leads' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
            }`}
          >
            <Icon name="Inbox" size={15} />
            Заявки
            <span className={`px-2 py-0.5 text-[10px] ${tab === 'leads' ? 'bg-[#A0784A]' : 'bg-[#E8E0D4] text-[#666]'}`}>{counts.leads}</span>
          </button>
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center gap-2 px-5 py-3 font-montserrat font-700 text-[11px] uppercase tracking-widest border transition ${
              tab === 'chats' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E8E0D4] text-[#666] hover:border-[#A0784A]'
            }`}
          >
            <Icon name="MessagesSquare" size={15} />
            Переписки
            <span className={`px-2 py-0.5 text-[10px] ${tab === 'chats' ? 'bg-[#A0784A]' : 'bg-[#E8E0D4] text-[#666]'}`}>{counts.chats}</span>
          </button>
          {(tab === 'leads' || tab === 'chats') && (
            <button
              onClick={() => load(token, tab)}
              className="ml-auto px-4 py-3 border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] transition flex items-center gap-2 font-montserrat text-[11px] uppercase tracking-widest"
            >
              <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 font-opensans text-sm">{error}</div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && <AdminProducts token={token} />}

        {/* ASSISTANTS */}
        {tab === 'assistants' && <AdminAssistants token={token} />}

        {/* LEADS */}
        {tab === 'leads' && (
          <div className="bg-white border border-[#E8E0D4] overflow-x-auto">
            {leads.length === 0 ? (
              <div className="py-20 text-center">
                <Icon name="Inbox" size={32} className="text-[#D2B48C] mx-auto mb-3" />
                <p className="font-montserrat text-[#999] uppercase tracking-widest text-sm">Заявок пока нет</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8E0D4] bg-[#FAFAF8]">
                    {['Дата', 'Источник', 'Имя', 'Телефон', 'Конфигурация', 'Цена', 'Почта'].map((h) => (
                      <th key={h} className="font-montserrat font-700 text-[10px] uppercase tracking-widest text-[#999] px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8] transition">
                      <td className="px-4 py-3 font-opensans text-xs text-[#666] whitespace-nowrap">{fmtDate(l.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="font-montserrat text-[10px] uppercase tracking-wide bg-[#F0E8DC] text-[#8B4513] px-2 py-1">
                          {l.source === 'constructor' ? 'Конструктор' : l.source === 'contacts' ? 'Контакты' : l.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-opensans text-sm text-[#1A1A1A] font-600">{l.name || '—'}</td>
                      <td className="px-4 py-3 font-opensans text-sm text-[#1A1A1A] whitespace-nowrap">{l.phone || '—'}</td>
                      <td className="px-4 py-3 font-opensans text-xs text-[#666] max-w-xs">{configStr(l.config)}</td>
                      <td className="px-4 py-3 font-montserrat font-700 text-sm text-[#1A1A1A] whitespace-nowrap">
                        {l.price ? `${l.price.toLocaleString('ru')} ₽` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Icon name={l.emailed ? 'MailCheck' : 'MailX'} size={16} className={l.emailed ? 'text-green-500' : 'text-[#ccc]'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CHATS */}
        {tab === 'chats' && (
          <div className="grid gap-3">
            {chats.length === 0 ? (
              <div className="bg-white border border-[#E8E0D4] py-20 text-center">
                <Icon name="MessagesSquare" size={32} className="text-[#D2B48C] mx-auto mb-3" />
                <p className="font-montserrat text-[#999] uppercase tracking-widest text-sm">Переписок пока нет</p>
              </div>
            ) : (
              chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setOpenChat(c)}
                  className="bg-white border border-[#E8E0D4] p-4 text-left hover:border-[#A0784A] transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-[#F0E8DC] flex items-center justify-center flex-shrink-0">
                      <Icon name="MessageCircle" size={18} className="text-[#8B4513]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-montserrat font-700 text-sm text-[#1A1A1A]">Диалог #{c.id}</p>
                      <p className="font-opensans text-xs text-[#999] truncate max-w-md">
                        {c.messages.find((m) => m.role === 'user')?.content || 'Без сообщений'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-opensans text-[11px] text-[#999]">{fmtDate(c.updated_at)}</p>
                    <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#A0784A] mt-1">{c.messages.length} сообщ.</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat modal */}
      {openChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpenChat(null)}>
          <div className="bg-white w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
              <span className="font-montserrat font-700 text-sm">Диалог #{openChat.id}</span>
              <button onClick={() => setOpenChat(null)} aria-label="Закрыть"><Icon name="X" size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAF8]">
              {openChat.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 text-sm font-opensans ${
                    m.role === 'user' ? 'bg-[#1A1A1A] text-white rounded-l-xl rounded-tr-xl' : 'bg-white border border-[#E8E0D4] text-[#1A1A1A] rounded-r-xl rounded-tl-xl'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}