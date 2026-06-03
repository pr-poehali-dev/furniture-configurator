import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { BACKEND } from '@/lib/backend';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_MATERIALS,
  PRODUCT_STYLES,
  PRODUCT_BADGES,
  type Product,
} from '@/data/catalog';

const EMPTY: Product = {
  id: 0, title: '', price: 0, category: 'tables', style: 'Скандинавский',
  material: 'Дуб', img: '', badge: '', eco: false, desc: '', isActive: true, sortOrder: 0,
};

const catLabel = (id: string) => PRODUCT_CATEGORIES.find((c) => c.id === id)?.label || id;

export default function AdminProducts({ token }: { token: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = token ? { 'Content-Type': 'application/json', 'X-Admin-Token': token } : { 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND.products}?all=1`, { headers: token ? { 'X-Admin-Token': token } : {} });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); return; }
      setItems(data.products || []);
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing || saving) return;
    if (!editing.title.trim()) { setError('Укажите название товара'); return; }
    setSaving(true);
    setError('');
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch(BACKEND.products, { method, headers, body: JSON.stringify(editing) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Не удалось сохранить'); return; }
      setEditing(null);
      load();
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return;
    try {
      await fetch(BACKEND.products, { method: 'DELETE', headers, body: JSON.stringify({ id }) });
      load();
    } catch {
      setError('Ошибка сети');
    }
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      setError('');
      try {
        const res = await fetch(BACKEND.products, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'upload', image: reader.result }),
        });
        const data = await res.json();
        if (data.url) setEditing((p) => p ? { ...p, img: data.url } : p);
        else setError(data.error || 'Не удалось загрузить фото');
      } catch {
        setError('Ошибка загрузки фото');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const upd = (patch: Partial<Product>) => setEditing((p) => p ? { ...p, ...patch } : p);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="font-opensans text-[#999] text-sm">
          Всего товаров: <span className="font-montserrat font-700 text-[#1A1A1A]">{items.length}</span>
        </p>
        <div className="flex gap-2">
          <button onClick={load} className="px-4 py-2.5 border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] transition flex items-center gap-2 font-montserrat text-[11px] uppercase tracking-widest">
            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} /> Обновить
          </button>
          <button onClick={() => { setEditing({ ...EMPTY }); setError(''); }} className="px-4 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#8B4513] transition flex items-center gap-2 font-montserrat font-700 text-[11px] uppercase tracking-widest">
            <Icon name="Plus" size={14} /> Добавить товар
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 font-opensans text-sm">{error}</div>}

      {loading ? (
        <div className="py-20 text-center">
          <Icon name="Loader" size={28} className="text-[#A0784A] mx-auto animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E8E0D4] py-20 text-center">
          <Icon name="Package" size={32} className="text-[#D2B48C] mx-auto mb-3" />
          <p className="font-montserrat text-[#999] uppercase tracking-widest text-sm mb-4">Товаров пока нет</p>
          <button onClick={() => setEditing({ ...EMPTY })} className="artora-btn-primary inline-flex items-center gap-2 text-xs">
            <Icon name="Plus" size={14} /> Добавить первый товар
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className={`bg-white border ${p.isActive ? 'border-[#E8E0D4]' : 'border-dashed border-[#D2B48C] opacity-70'} flex flex-col`}>
              <div className="relative h-40 bg-[#F7F3EC]">
                {p.img ? (
                  <img src={p.img} alt={p.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center"><Icon name="ImageOff" size={26} className="text-[#D2B48C]" /></div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {p.badge && <span className="bg-white text-[#1A1A1A] font-montserrat font-700 text-[9px] uppercase px-2 py-0.5">{p.badge}</span>}
                  {p.eco && <span className="bg-[#4CAF50] text-white font-montserrat font-700 text-[9px] uppercase px-2 py-0.5">Эко</span>}
                  {!p.isActive && <span className="bg-[#999] text-white font-montserrat font-700 text-[9px] uppercase px-2 py-0.5">Скрыт</span>}
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="font-montserrat text-[9px] uppercase tracking-widest text-[#A0784A] mb-1">{catLabel(p.category)} · {p.material}</p>
                <h3 className="font-montserrat font-700 text-[#1A1A1A] text-sm leading-tight mb-1">{p.title}</h3>
                <p className="font-montserrat font-900 text-[#1A1A1A] text-sm mb-3">{p.price.toLocaleString('ru')} ₽</p>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => { setEditing(p); setError(''); }} className="flex-1 border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] py-2 font-montserrat font-700 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition">
                    <Icon name="Pencil" size={12} /> Изменить
                  </button>
                  <button onClick={() => remove(p.id)} className="border border-[#E8E0D4] text-[#C0392B] hover:border-[#C0392B] px-3 py-2 transition" aria-label="Удалить">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
              <span className="font-montserrat font-700 text-sm">{editing.id ? 'Редактировать товар' : 'Новый товар'}</span>
              <button onClick={() => setEditing(null)} aria-label="Закрыть"><Icon name="X" size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Фото */}
              <div>
                <label className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] block mb-2">Фото товара</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 bg-[#F7F3EC] border border-[#E8E0D4] flex items-center justify-center overflow-hidden shrink-0">
                    {editing.img ? <img src={editing.img} alt="" className="w-full h-full object-cover" /> : <Icon name="ImagePlus" size={22} className="text-[#D2B48C]" />}
                  </div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="border border-[#E8E0D4] hover:border-[#A0784A] px-4 py-2.5 font-montserrat font-700 text-[10px] uppercase tracking-widest text-[#666] flex items-center gap-2 transition">
                    {uploading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
                    {uploading ? 'Загрузка...' : 'Загрузить фото'}
                  </button>
                </div>
              </div>

              <Field label="Название">
                <input value={editing.title} onChange={(e) => upd({ title: e.target.value })} className="adm-input" placeholder="Например: Обеденный стол «Нордик»" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Цена, ₽">
                  <input type="number" value={editing.price || ''} onChange={(e) => upd({ price: Number(e.target.value) })} className="adm-input" />
                </Field>
                <Field label="Старая цена, ₽">
                  <input type="number" value={editing.oldPrice || ''} onChange={(e) => upd({ oldPrice: e.target.value ? Number(e.target.value) : undefined })} className="adm-input" placeholder="—" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Категория">
                  <select value={editing.category} onChange={(e) => upd({ category: e.target.value })} className="adm-input">
                    {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Материал">
                  <select value={editing.material} onChange={(e) => upd({ material: e.target.value })} className="adm-input">
                    {PRODUCT_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Стиль">
                  <select value={editing.style} onChange={(e) => upd({ style: e.target.value })} className="adm-input">
                    {PRODUCT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Бейдж">
                  <select value={editing.badge || ''} onChange={(e) => upd({ badge: e.target.value })} className="adm-input">
                    {PRODUCT_BADGES.map((b) => <option key={b} value={b}>{b || 'Без бейджа'}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Описание">
                <textarea value={editing.desc} onChange={(e) => upd({ desc: e.target.value })} rows={3} className="adm-input resize-none" placeholder="Короткое описание товара" />
              </Field>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.eco} onChange={(e) => upd({ eco: e.target.checked })} className="accent-[#4CAF50] w-4 h-4" />
                  <span className="font-opensans text-sm text-[#555]">Эко-товар</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => upd({ isActive: e.target.checked })} className="accent-[#A0784A] w-4 h-4" />
                  <span className="font-opensans text-sm text-[#555]">Показывать на сайте</span>
                </label>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#A0784A] hover:bg-[#8B4513] disabled:opacity-50 text-white font-montserrat font-700 uppercase tracking-widest text-xs py-3.5 transition flex items-center justify-center gap-2">
                {saving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                Сохранить
              </button>
              <button onClick={() => setEditing(null)} className="px-6 border border-[#E8E0D4] text-[#666] hover:border-[#A0784A] font-montserrat font-700 uppercase tracking-widest text-xs transition">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-montserrat text-[10px] uppercase tracking-widest text-[#999] block mb-2">{label}</label>
      {children}
    </div>
  );
}
