'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}
function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:    { label: 'Gözləyir',    color: '#d97706', bg: '#fef3c7' },
    CONFIRMED:  { label: 'Təsdiqləndi', color: '#059669', bg: '#d1fae5' },
    PROCESSING: { label: 'Hazırlanır',  color: '#6366f1', bg: '#ede9fe' },
    SHIPPED:    { label: 'Göndərildi',  color: '#0284c7', bg: '#e0f2fe' },
    DELIVERED:  { label: 'Çatdırıldı',  color: '#16a34a', bg: '#f0fdf4' },
    CANCELLED:  { label: 'Ləğv edildi', color: '#dc2626', bg: '#fef2f2' },
};

const IS: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 9,
    border: '1px solid #e5e5e5', fontSize: 14,
    fontFamily: 'inherit', color: '#0a0a0a',
    outline: 'none', transition: 'border-color 0.15s', background: '#fff',
};
const LS: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 };

function Spin() {
    return <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />;
}
function Err({ msg }: { msg: string }) {
    return <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{msg}</div>;
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
function ImgUpload({ productId, onUploaded }: { productId: string; onUploaded: (url: string, publicId: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef<HTMLInputElement>(null);

    async function handle(file: File) {
        if (!file.type.startsWith('image/')) { setError('Yalnız şəkil'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Maks 5MB'); return; }
        setError(''); setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('productId', productId);
            const res = await fetch('/api/products/images/upload-only', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: fd,
            });
            if (!res.ok) { setError('Yükləmə uğursuz'); return; }
            const data = await res.json();
            onUploaded(data.url, data.publicId || '');
        } catch { setError('Xəta baş verdi'); }
        finally { setUploading(false); }
    }

    return (
        <div>
            <div onClick={() => !uploading && ref.current?.click()}
                 onDragOver={e => e.preventDefault()}
                 onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
                 style={{ border: `2px dashed ${error ? '#fca5a5' : '#e5e5e5'}`, borderRadius: 12, padding: 16, textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', background: '#fafafa', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 onMouseEnter={e => !uploading && ((e.currentTarget as HTMLElement).style.borderColor = '#6366f1')}
                 onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = error ? '#fca5a5' : '#e5e5e5'}
            >
                {uploading ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 22, height: 22, border: '2px solid #e5e5e5', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 12, color: '#a3a3a3' }}>Yüklənir...</div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>+</div>
                        <div style={{ fontSize: 12, color: '#737373' }}>Şəkil əlavə et</div>
                        <div style={{ fontSize: 11, color: '#a3a3a3' }}>5MB · JPG PNG WebP</div>
                    </div>
                )}
            </div>
            {error && <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 3 }}>{error}</div>}
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
        </div>
    );
}

// ─── Add Product Form (3 step) ─────────────────────────────────────────────────
interface Variant { size: string; color: string; material: string; stockQuantity: number; sku: string; priceModifier: number; }
interface UploadedImage { url: string; publicId: string; }

function AddProductForm({ categories, onSuccess }: { categories: any[]; onSuccess: () => void }) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [form, setForm] = useState({ name: '', description: '', basePrice: '', categoryId: '' });
    const [variants, setVariants] = useState<Variant[]>([]);
    const [addingVariant, setAddingVariant] = useState(false);
    const [variantForm, setVariantForm] = useState<Variant>({ size: '', color: '', material: '', stockQuantity: 0, sku: '', priceModifier: 0 });
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [primaryIdx, setPrimaryIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    function genSku() {
        const prefix = form.name.replace(/\s+/g, '-').toUpperCase().slice(0, 8);
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        setVariantForm(p => ({ ...p, sku: `${prefix}-${suffix}` }));
    }

    async function createProduct(e: React.FormEvent) {
        e.preventDefault(); setError('');
        if (!form.name.trim()) { setError('Məhsul adı tələb olunur'); return; }
        if (!form.categoryId) { setError('Kateqoriya seçin'); return; }
        if (!form.basePrice || parseFloat(form.basePrice) <= 0) { setError('Düzgün qiymət'); return; }

        setLoading(true);
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    query: `mutation CreateProduct($input: ProductInput!) {
            createProduct(input: $input) { id name }
          }`,
                    variables: {
                        input: {
                            name: form.name.trim(),
                            description: form.description.trim() || null,
                            basePrice: parseFloat(form.basePrice),
                            categoryId: form.categoryId,
                            variants: variants.length > 0 ? variants.map(v => ({
                                size: v.size || null,
                                color: v.color || null,
                                material: v.material || null,
                                priceModifier: v.priceModifier || 0,
                                stockQuantity: v.stockQuantity,
                                sku: v.sku,
                            })) : null,
                        },
                    },
                }),
            });
            const data = await res.json();
            if (data.errors) { setError(data.errors[0]?.message || 'Xəta'); return; }
            setCreatedId(data.data.createProduct.id);
            setStep(3);
        } catch { setError('Serverlə əlaqə qurulmadı'); }
        finally { setLoading(false); }
    }

    async function saveImages() {
        if (!createdId) return;
        setLoading(true); setError('');
        try {
            for (let i = 0; i < images.length; i++) {
                await fetch('/graphql', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        query: `mutation AddImg($productId: ID!, $url: String!, $publicId: String, $isPrimary: Boolean) {
              addProductImage(productId: $productId, url: $url, publicId: $publicId, isPrimary: $isPrimary) { id url }
            }`,
                        variables: { productId: createdId, url: images[i].url, publicId: images[i].publicId, isPrimary: i === primaryIdx },
                    }),
                });
            }
            setDone(true);
            setTimeout(() => {
                setDone(false); setStep(1);
                setForm({ name: '', description: '', basePrice: '', categoryId: '' });
                setVariants([]); setCreatedId(null); setImages([]); setPrimaryIdx(0);
                onSuccess();
            }, 2000);
        } catch { setError('Şəkillər saxlanılarkən xəta'); }
        finally { setLoading(false); }
    }

    if (done) return (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>Məhsul uğurla əlavə edildi!</div>
        </div>
    );

    const steps = ['Əsas məlumatlar', 'Variantlar', 'Şəkillər'];

    return (
        <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 24 }}>Yeni məhsul</h2>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                {steps.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: i + 1 <= step ? '#6366f1' : '#e5e5e5', color: i + 1 <= step ? '#fff' : '#a3a3a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                {i + 1 < step ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: i + 1 === step ? '#0a0a0a' : '#a3a3a3', whiteSpace: 'nowrap' }}>{s}</span>
                        </div>
                        {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i + 1 < step ? '#6366f1' : '#e5e5e5', margin: '0 12px' }} />}
                    </div>
                ))}
            </div>

            {/* Step 1 — Əsas məlumatlar */}
            {step === 1 && (
                <form onSubmit={createProduct}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={LS}>Məhsul adı *</label>
                            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="iPhone 16 Pro Max" style={IS}
                                   onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                        </div>
                        <div>
                            <label style={LS}>Kateqoriya *</label>
                            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={IS}>
                                <option value="">Kateqoriya seçin...</option>
                                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={LS}>Əsas qiymət (₼) *</label>
                            <input type="number" step="0.01" min="0.01" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} placeholder="999.99" style={IS}
                                   onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                        </div>
                        <div>
                            <label style={LS}>Açıqlama</label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Məhsul haqqında ətraflı məlumat..." rows={3}
                                      style={{ ...IS, resize: 'vertical' as any }}
                                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                        </div>
                        {error && <Err msg={error} />}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" onClick={() => { setError(''); setStep(2); }}
                                    style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Variant əlavə et (isteğe bağlı) →
                            </button>
                            <button type="submit" disabled={loading}
                                    style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: loading ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {loading ? <><Spin /> Yaradılır...</> : 'Variantsız davam et →'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Step 2 — Variantlar */}
            {step === 2 && (
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13.5, color: '#737373', marginBottom: 16 }}>
                            Variantlar məhsulun rəng, ölçü kimi fərqli versiyalarıdır. Hər varianta ayrı stok sayı verilir.
                        </div>

                        {/* Variant list */}
                        {variants.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                {variants.map((v, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>
                                                {[v.color, v.size, v.material].filter(Boolean).join(' / ') || 'Standart'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#a3a3a3' }}>SKU: {v.sku} · Stok: {v.stockQuantity}{v.priceModifier ? ` · +₼${v.priceModifier}` : ''}</div>
                                        </div>
                                        <button onClick={() => setVariants(p => p.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add variant form */}
                        {addingVariant ? (
                            <div style={{ background: '#f8f7ff', border: '1px solid #e0dcff', borderRadius: 14, padding: 20, marginBottom: 12 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 16 }}>Yeni variant</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={LS}>Rəng</label>
                                        <input type="text" value={variantForm.color} onChange={e => setVariantForm(p => ({ ...p, color: e.target.value }))} placeholder="Qara, Ağ..." style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                    <div>
                                        <label style={LS}>Ölçü</label>
                                        <input type="text" value={variantForm.size} onChange={e => setVariantForm(p => ({ ...p, size: e.target.value }))} placeholder="S, M, L, XL, 42..." style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                    <div>
                                        <label style={LS}>Material</label>
                                        <input type="text" value={variantForm.material} onChange={e => setVariantForm(p => ({ ...p, material: e.target.value }))} placeholder="Pambıq, Dəri..." style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                    <div>
                                        <label style={LS}>Stok sayı *</label>
                                        <input type="number" min="0" value={variantForm.stockQuantity} onChange={e => setVariantForm(p => ({ ...p, stockQuantity: parseInt(e.target.value) || 0 }))} placeholder="100" style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                    <div>
                                        <label style={LS}>Qiymət fərqi (₼)</label>
                                        <input type="number" step="0.01" value={variantForm.priceModifier} onChange={e => setVariantForm(p => ({ ...p, priceModifier: parseFloat(e.target.value) || 0 }))} placeholder="0 (əsas qiymətə əlavə)" style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <label style={LS}>SKU *</label>
                                            <button type="button" onClick={genSku} style={{ fontSize: 11.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Auto-generate</button>
                                        </div>
                                        <input type="text" value={variantForm.sku} onChange={e => setVariantForm(p => ({ ...p, sku: e.target.value }))} placeholder="PROD-ABC-123" style={IS}
                                               onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button"
                                            onClick={() => {
                                                if (!variantForm.sku.trim()) return;
                                                setVariants(p => [...p, { ...variantForm }]);
                                                setVariantForm({ size: '', color: '', material: '', stockQuantity: 0, sku: '', priceModifier: 0 });
                                                setAddingVariant(false);
                                            }}
                                            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ✓ Variant əlavə et
                                    </button>
                                    <button type="button" onClick={() => setAddingVariant(false)}
                                            style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Ləğv et
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setAddingVariant(true)}
                                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px dashed #e5e5e5', background: 'transparent', color: '#737373', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 4 }}>
                                + Variant əlavə et
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => setStep(1)}
                                style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Geri</button>
                        <button type="button" onClick={createProduct} disabled={loading}
                                style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: loading ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {loading ? <><Spin /> Yaradılır...</> : `Məhsul yarat${variants.length > 0 ? ` (${variants.length} variant)` : ''} →`}
                        </button>
                    </div>
                    {error && <div style={{ marginTop: 12 }}><Err msg={error} /></div>}
                </div>
            )}

            {/* Step 3 — Şəkillər */}
            {step === 3 && createdId && (
                <div>
                    <div style={{ fontSize: 13.5, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                        ✓ Məhsul yaradıldı! İndi şəkillər əlavə edin.
                    </div>
                    <p style={{ fontSize: 13, color: '#737373', marginBottom: 16 }}>Əsas şəkli seçmək üçün şəkilə klikləyin. Maks 6 şəkil.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                        {images.map((img, i) => (
                            <div key={i} onClick={() => setPrimaryIdx(i)}
                                 style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === primaryIdx ? '#6366f1' : '#f0f0f0'}`, cursor: 'pointer' }}>
                                <Image src={img.url} alt="" fill style={{ objectFit: 'cover' }} />
                                {i === primaryIdx && <div style={{ position: 'absolute', top: 5, left: 5, background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>ƏSAS</div>}
                                <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); if (primaryIdx >= images.length - 1) setPrimaryIdx(0); }}
                                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>
                        ))}
                        {images.length < 6 && (
                            <ImgUpload productId={createdId} onUploaded={(url, publicId) => setImages(p => [...p, { url, publicId }])} />
                        )}
                    </div>

                    {error && <div style={{ marginBottom: 12 }}><Err msg={error} /></div>}
                    <button onClick={saveImages} disabled={loading}
                            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: loading ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {loading ? <><Spin /> Saxlanılır...</> : images.length > 0 ? `${images.length} şəkil saxla və bitir →` : 'Şəkilsiz tamamla →'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function VendorDashboard() {
    const [store, setStore] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'orders' | 'add'>('overview');

    useEffect(() => {
        if (!getToken() || localStorage.getItem('userRole') !== 'VENDOR') { window.location.href = '/login'; return; }
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [storeRes, ordersRes, catRes] = await Promise.all([
                fetch('/api/vendors/me', { headers: authHeaders() }),
                fetch('/api/orders/vendor?page=0&size=50', { headers: authHeaders() }),
                fetch('/graphql', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ query: '{ categories { id name } }' }) }),
            ]);
            if (storeRes.ok) setStore(await storeRes.json());
            if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.content || []); }
            if (catRes.ok) { const d = await catRes.json(); setCategories(d.data?.categories || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function updateOrderStatus(orderId: string, status: string) {
        try {
            await fetch(`/api/orders/${orderId}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
            fetchAll();
        } catch (e) { console.error(e); }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const stats = [
        { label: 'Ümumi satış', value: store?.totalSales || 0 },
        { label: 'Balans', value: `₼${(store?.balance || 0).toLocaleString()}` },
        { label: 'Aktiv sifarişlər', value: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length },
        { label: 'Reytinq', value: store?.rating ? `${store.rating}★` : '—' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'inherit' }}>
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                    </Link>
                    <div style={{ width: 1, height: 18, background: '#f0f0f0' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>Vendor Panel</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: store?.status === 'APPROVED' ? '#f0fdf4' : '#fef3c7', color: store?.status === 'APPROVED' ? '#16a34a' : '#d97706', border: `1px solid ${store?.status === 'APPROVED' ? '#bbf7d0' : '#fde68a'}` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {store?.status === 'APPROVED' ? 'Aktiv' : 'Gözləyir'}
          </span>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fff', fontSize: 13, color: '#737373', cursor: 'pointer', fontFamily: 'inherit' }}>Çıxış</button>
                </div>
            </nav>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 40px' }}>
                {store && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>
                            {store.storeName?.[0] || 'V'}
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>{store.storeName}</div>
                            <div style={{ fontSize: 13, color: '#a3a3a3' }}>floop.az/store/{store.storeSlug}</div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                    {stats.map(s => (
                        <div key={s.label} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '18px 20px' }}>
                            <div style={{ fontSize: 11.5, color: '#a3a3a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', padding: 4, borderRadius: 12, marginBottom: 24, width: 'fit-content' }}>
                    {[
                        { id: 'overview', label: 'Ümumi baxış' },
                        { id: 'orders', label: `Sifarişlər (${orders.length})` },
                        { id: 'add', label: '+ Məhsul əlavə et' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)}
                                style={{ padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#0a0a0a' : '#737373', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 16 }}>Son sifarişlər</h3>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#a3a3a3', fontSize: 14 }}>Hələ sifariş yoxdur</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {orders.slice(0, 5).map((o: any) => {
                                    const s = STATUS_LABELS[o.status] || { label: o.status, color: '#525252', bg: '#f5f5f5' };
                                    return (
                                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #f5f5f5', borderRadius: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>#{o.id?.slice(0, 8).toUpperCase()}</div>
                                                <div style={{ fontSize: 12, color: '#a3a3a3' }}>{new Date(o.createdAt).toLocaleDateString('az')}</div>
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 700 }}>₼{o.totalAmount?.toLocaleString()}</div>
                                            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}


                {tab === 'orders' && (
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
                        {orders.length === 0 ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#a3a3a3', fontSize: 14 }}>Hələ sifariş yoxdur</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    {['Sifariş', 'Məbləğ', 'Status', 'Tarix', 'Əməliyyat'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {orders.map((o: any) => {
                                    const s = STATUS_LABELS[o.status] || { label: o.status, color: '#525252', bg: '#f5f5f5' };
                                    return (
                                        <tr key={o.id} style={{ borderBottom: '1px solid #fafafa' }}>
                                            <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>#{o.id?.slice(0, 8).toUpperCase()}</td>
                                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700 }}>₼{o.totalAmount?.toLocaleString()}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#a3a3a3' }}>{new Date(o.createdAt).toLocaleDateString('az')}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                {o.status === 'CONFIRMED' && (
                                                    <button onClick={() => updateOrderStatus(o.id, 'PROCESSING')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#525252' }}>Hazırlığa başla</button>
                                                )}
                                                {o.status === 'PROCESSING' && (
                                                    <button onClick={() => updateOrderStatus(o.id, 'SHIPPED')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#525252' }}>Göndər</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {tab === 'add' && (
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 28 }}>
                        <AddProductForm categories={categories} onSuccess={() => { setTab('overview'); fetchAll(); }} />
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}