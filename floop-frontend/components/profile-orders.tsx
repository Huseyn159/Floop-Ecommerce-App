'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ===================== PROFILE PAGE =====================
export function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', bio: '' });

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) { window.location.href = '/login'; return; }
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch('/api/users/me', { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setForm({ firstName: data.firstName || '', lastName: data.lastName || '', phoneNumber: data.phoneNumber || '', bio: data.bio || '' });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/users/me', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(form) });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); await fetchProfile(); }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    }

    if (loading) return <LoadingScreen />;

    return (
        <PageLayout title="Profilim">
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
                {/* Sidebar */}
                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 24, height: 'fit-content' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 auto 12px',
                        }}>
                            {profile?.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>{profile?.firstName} {profile?.lastName}</div>
                        <div style={{ fontSize: 13, color: '#a3a3a3' }}>{profile?.email}</div>
                    </div>
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                            { href: '/profile', label: '👤 Profil məlumatları', active: true },
                            { href: '/orders', label: '📦 Sifarişlərim' },
                            { href: '/wishlist', label: '❤️ İstək siyahısı' },
                        ].map(l => (
                            <Link key={l.href} href={l.href} style={{
                                padding: '9px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 500,
                                color: l.active ? '#6366f1' : '#525252', textDecoration: 'none',
                                background: l.active ? '#f5f3ff' : 'transparent', transition: 'all 0.15s',
                            }}>{l.label}</Link>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 28 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 24 }}>Profil məlumatları</h2>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <FormField label="Ad" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} placeholder="Huseyn" />
                            <FormField label="Soyad" value={form.lastName} onChange={v => setForm(p => ({ ...p, lastName: v }))} placeholder="Əliyev" />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <FormField label="Telefon" value={form.phoneNumber} onChange={v => setForm(p => ({ ...p, phoneNumber: v }))} placeholder="+994501234567" type="tel" />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Bio</label>
                            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Özünüz haqqında..." rows={3}
                                      style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', color: '#0a0a0a', outline: 'none', resize: 'vertical' }}
                                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                                      onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: saving ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {saving ? 'Saxlanılır...' : 'Dəyişiklikləri saxla'}
                            </button>
                            {saved && <span style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 500 }}>✓ Saxlanıldı</span>}
                        </div>
                    </form>
                </div>
            </div>
        </PageLayout>
    );
}

// ===================== ORDERS PAGE =====================
export function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) { window.location.href = '/login'; return; }
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/orders/my', { headers: authHeaders() });
            if (res.ok) { const d = await res.json(); setOrders(d.content || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function cancelOrder(orderId: string) {
        setCancelling(orderId);
        try {
            await fetch(`/api/orders/${orderId}/cancel?reason=Müştəri tərəfindən ləğv edildi`, { method: 'PATCH', headers: authHeaders() });
            fetchOrders();
        } catch (e) { console.error(e); }
        finally { setCancelling(null); }
    }

    const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        PENDING:    { label: 'Gözləyir',    color: '#d97706', bg: '#fef3c7', icon: '⏳' },
        CONFIRMED:  { label: 'Təsdiqləndi', color: '#059669', bg: '#d1fae5', icon: '✓' },
        PROCESSING: { label: 'Hazırlanır',  color: '#6366f1', bg: '#ede9fe', icon: '📦' },
        SHIPPED:    { label: 'Göndərildi',  color: '#0284c7', bg: '#e0f2fe', icon: '🚚' },
        DELIVERED:  { label: 'Çatdırıldı',  color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
        CANCELLED:  { label: 'Ləğv edildi', color: '#dc2626', bg: '#fef2f2', icon: '✕' },
    };

    if (loading) return <LoadingScreen />;

    return (
        <PageLayout title="Sifarişlərim">
            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>Hələ sifariş verməmisiniz</div>
                    <div style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 24 }}>İlk sifarişinizi verin!</div>
                    <Link href="/" style={{ padding: '11px 24px', borderRadius: 10, background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                        Alış-verişə başla →
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orders.map((o: any) => {
                        const s = STATUS[o.status] || { label: o.status, color: '#525252', bg: '#f5f5f5', icon: '?' };
                        return (
                            <div key={o.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
                                 onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5'}
                                 onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'}
                                 onClick={() => setSelected(selected?.id === o.id ? null : o)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>Sifariş #{o.id?.slice(0, 8)}</div>
                                            <div style={{ fontSize: 12.5, color: '#a3a3a3' }}>{new Date(o.createdAt).toLocaleDateString('az', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>₼{o.totalAmount?.toLocaleString()}</div>
                                        <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                                        {['PENDING', 'CONFIRMED'].includes(o.status) && (
                                            <button
                                                onClick={e => { e.stopPropagation(); cancelOrder(o.id); }}
                                                disabled={cancelling === o.id}
                                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                                            >{cancelling === o.id ? '...' : 'Ləğv et'}</button>
                                        )}
                                    </div>
                                </div>

                                {selected?.id === o.id && (
                                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f5f5f5' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                                            {[
                                                { label: 'Çatdırılma ünvanı', value: `${o.shippingAddress}, ${o.shippingCity}` },
                                                { label: 'Ödəniş ID', value: o.paymentId || '—' },
                                                { label: 'İzləmə nömrəsi', value: o.trackingNumber || '—' },
                                            ].map(f => (
                                                <div key={f.label}>
                                                    <div style={{ fontSize: 11.5, color: '#a3a3a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{f.label}</div>
                                                    <div style={{ fontSize: 13.5, color: '#0a0a0a', fontWeight: 500 }}>{f.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {o.items && o.items.length > 0 && (
                                            <div style={{ background: '#fafafa', borderRadius: 10, padding: 14 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Məhsullar</div>
                                                {o.items.map((item: any) => (
                                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#525252', marginBottom: 6 }}>
                                                        <span>{item.productName || 'Məhsul'} × {item.quantity}</span>
                                                        <span style={{ fontWeight: 600, color: '#0a0a0a' }}>₼{item.totalPrice?.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </PageLayout>
    );
}

// ===================== SHARED COMPONENTS =====================
function PageLayout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', height: 60, background: '#fff',
                borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
            }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>
            floop<span style={{ color: '#6366f1' }}>.</span>
          </span>
                </Link>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link href="/cart" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, color: '#525252', textDecoration: 'none' }}>🛒 Səbət</Link>
                </div>
            </nav>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 40px' }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a', marginBottom: 28 }}>{title}</h1>
                {children}
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: any) {
    return (
        <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                   style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit', color: '#0a0a0a', outline: 'none', transition: 'border-color 0.15s' }}
                   onFocus={e => e.target.style.borderColor = '#6366f1'}
                   onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
        </div>
    );
}

function LoadingScreen() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}