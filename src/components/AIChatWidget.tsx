import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';

type Msg = { role: 'user' | 'assistant'; content: string };

const WELCOME: Msg = {
  role: 'assistant',
  content: 'Здравствуйте! Я Артур, консультант ARTORA. Помогу подобрать мебель мечты. Расскажите, что вы ищете — стол, стеллаж, тумбу?',
};

const QUICK = ['Хочу обеденный стол', 'Нужен стеллаж в гостиную', 'Подберите тумбу у кровати'];

function getSessionId() {
  try {
    let id = localStorage.getItem('artora_chat_session');
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('artora_chat_session', id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(BACKEND.aiChat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          messages: next.filter((m) => m !== WELCOME || next.indexOf(m) !== 0),
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: 'Извините, не удалось ответить. Попробуйте ещё раз или позвоните нам.' }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Ошибка соединения. Проверьте интернет и попробуйте снова.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1A1A1A] text-white flex items-center justify-center shadow-2xl hover:bg-[#8B4513] transition-all duration-300 hover:scale-105"
        aria-label="Чат с ИИ-консультантом"
      >
        <Icon name={open ? 'X' : 'MessageCircle'} size={24} />
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A0784A] rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[540px] max-h-[75vh] bg-white shadow-2xl flex flex-col animate-scale-in border border-[#E8E0D4]">
          {/* Header */}
          <div className="bg-[#1A1A1A] text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#A0784A] flex items-center justify-center">
              <Icon name="Bot" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-montserrat font-700 text-sm">Артур · ИИ-консультант</p>
              <p className="font-opensans text-[#A0784A] text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                на связи
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAF8]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm font-opensans leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1A1A1A] text-white rounded-l-xl rounded-tr-xl'
                      : 'bg-white border border-[#E8E0D4] text-[#1A1A1A] rounded-r-xl rounded-tl-xl'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E8E0D4] px-4 py-3 rounded-r-xl rounded-tl-xl flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 bg-[#A0784A] rounded-full animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-2 pt-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left font-opensans text-xs text-[#8B4513] border border-[#E8E0D4] bg-white px-3 py-2 hover:border-[#A0784A] hover:bg-[#FAFAF8] transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#E8E0D4] bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Напишите сообщение..."
              className="flex-1 border border-[#E8E0D4] px-3 py-2.5 font-opensans text-sm focus:outline-none focus:border-[#1A1A1A] transition"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-[#1A1A1A] text-white w-11 flex items-center justify-center hover:bg-[#8B4513] disabled:opacity-40 transition"
              aria-label="Отправить"
            >
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}