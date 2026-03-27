'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
    PENDING:    { label: 'Gözləyir',    color: '#d97706', bg: '#fef3c7', icon: '⏳', step: 1 },
    CONFIRMED:  { label: 'Təsdiqləndi', color: '#059669', bg: '#d1fae5', icon: '✓',  step: 2 },
    PROCESSING: { label: 'Hazırlanır',  color: '#6366f1', bg: '#ede9fe', icon: '📦', step: 3 },
    SHIPPED:    { label: 'Göndərildi',  color: '#0284c7', bg: '#e0f2fe', icon: '🚚', step: 4 },
    DELIVERED:  { label: 'Çatdırıldı',  color: '#16a34a', bg: '#f0fdf4', icon: '✅', step: 5 },
    CANCELLED:  { label: 'Ləğv edildi', color: '#dc2626', bg: '#fef2f2', icon: '✕',  step: 0 },
    REFUNDED:   { label: 'İade edildi', color: '#7c3aed', bg: '#ede9fe', icon: '↩',  step: 0 },
};

function OrderProgress({ status }: { status: string }) {
    const steps = ['Gözləyir', 'Təsdiqləndi', 'Hazırlanır', 'Göndərildi', 'Çatdırıldı'];
    const current = STATUS[status]?.step || 0;
    if (current === 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            {steps.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: i + 1 <= current ? '#6366f1' : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: i + 1 <= current ? '#fff' : '#a3a3a3',
                            margin: '0 auto',
                        }}>
                            {i + 1 <= current ? '✓' : i + 1}
                        </div>
                        <div style={{ fontSize: 9.5, color: i + 1 <= current ? '#6366f1' : '#a3a3a3', fontWeight: 500, marginTop: 4, whiteSpace: 'nowrap' }}>{s}</div>
                    </div>
                    {i < steps.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i + 1 < current ? '#6366f1' : '#f0f0f0', margin: '0 4px', marginBottom: 16, transition: 'background 0.3s' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) { window.location.href = '/login'; return; }
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/orders/my?page=0&size=50', { headers: authHeaders() });
            if (res.ok) { const d = await res.json(); setOrders(d.content || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function cancelOrder(orderId: string) {
        setCancelling(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/cancel?reason=Müştəri tərəfindən ləğv edildi`, { method: 'PATCH', headers: authHeaders() });
            if (res.ok) fetchOrders();
        } catch (e) { console.error(e); }
        finally { setCancelling(null); }
    }

    const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'inherit' }}>
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/profile" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, color: '#525252', textDecoration: 'none', fontWeight: 500 }}>👤 Profil</Link>
                    <Link href="/cart" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, color: '#525252', textDecoration: 'none', fontWeight: 500 }}>🛒 Səbət</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 40px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a' }}>
                        Sifarişlərim
                    </h1>
                    <span style={{ fontSize: 13, color: '#a3a3a3' }}>{orders.length} sifariş</span>
                </div>

                {/* Filter tabs */}
                {orders.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', padding: 4, borderRadius: 12, marginBottom: 24, width: 'fit-content', overflowX: 'auto' }}>
                        {[
                            { id: 'ALL', label: 'Hamısı' },
                            { id: 'PENDING', label: 'Gözləyir' },
                            { id: 'CONFIRMED', label: 'Təsdiqləndi' },
                            { id: 'SHIPPED', label: 'Göndərildi' },
                            { id: 'DELIVERED', label: 'Çatdırıldı' },
                            { id: 'CANCELLED', label: 'Ləğv' },
                        ].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                                    style={{ padding: '7px 14px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? '#0a0a0a' : '#737373', boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>
                            {filter === 'ALL' ? 'Hələ sifariş verməmisiniz' : 'Bu kateqoriyada sifariş yoxdur'}
                        </div>
                        <div style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 24 }}>İlk sifarişinizi verin!</div>
                        <Link href="/" style={{ padding: '11px 24px', borderRadius: 10, background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                            Alış-verişə başla →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((o: any) => {
                            const s = STATUS[o.status] || { label: o.status, color: '#525252', bg: '#f5f5f5', icon: '?', step: 0 };
                            const isOpen = selected === o.id;

                            return (
                                <div key={o.id} style={{ background: '#fff', border: `1.5px solid ${isOpen ? '#e0dcff' : '#f0f0f0'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                                    {/* Header */}
                                    <div style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                                         onClick={() => setSelected(isOpen ? null : o.id)}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                            {s.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>
                          Sifariş #{o.id?.slice(0, 8).toUpperCase()}
                        </span>
                                                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                                            </div>
                                            <div style={{ fontSize: 12.5, color: '#a3a3a3' }}>
                                                {new Date(o.createdAt).toLocaleDateString('az', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>₼{o.totalAmount?.toLocaleString()}</div>
                                            {o.items && <div style={{ fontSize: 12, color: '#a3a3a3' }}>{o.items.length} məhsul</div>}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#a3a3a3', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</div>
                                    </div>

                                    {/* Progress */}
                                    {o.status !== 'CANCELLED' && o.status !== 'REFUNDED' && (
                                        <div style={{ padding: '0 20px' }}>
                                            <OrderProgress status={o.status} />
                                        </div>
                                    )}

                                    {/* Detail */}
                                    {isOpen && (
                                        <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #f5f5f5' }}>
                                            {/* Info grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                                                {[
                                                    { label: 'Çatdırılma ünvanı', value: `${o.shippingAddress}, ${o.shippingCity}, ${o.shippingCountry}` },
                                                    { label: 'Ödəniş', value: o.paymentId ? `#${o.paymentId.slice(0, 8)}` : 'Gözləyir' },
                                                    { label: 'İzləmə nömrəsi', value: o.trackingNumber || '—' },
                                                ].map(f => (
                                                    <div key={f.label} style={{ background: '#fafafa', borderRadius: 10, padding: '12px 14px' }}>
                                                        <div style={{ fontSize: 11, color: '#a3a3a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                                                        <div style={{ fontSize: 13.5, color: '#0a0a0a', fontWeight: 500, lineHeight: 1.4 }}>{f.value}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Items */}
                                            {o.items && o.items.length > 0 && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Məhsullar</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {o.items.map((item: any) => (
                                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fafafa', borderRadius: 9 }}>
                                                                <div>
                                                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0a' }}>{item.productName || 'Məhsul'}</div>
                                                                    {item.variantInfo && <div style={{ fontSize: 12, color: '#a3a3a3' }}>{item.variantInfo}</div>}
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0a0a0a' }}>₼{item.totalPrice?.toLocaleString()}</div>
                                                                    <div style={{ fontSize: 12, color: '#a3a3a3' }}>₼{item.unitPrice} × {item.quantity}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {['PENDING', 'CONFIRMED'].includes(o.status) && (
                                                    <button onClick={() => cancelOrder(o.id)} disabled={cancelling === o.id}
                                                            style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        {cancelling === o.id ? 'Ləğv edilir...' : '✕ Sifarişi ləğv et'}
                                                    </button>
                                                )}
                                                {o.status === 'DELIVERED' && (
                                                    <button style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        ⭐ Rəy yaz
                                                    </button>
                                                )}
                                            </div>

                                            {o.cancellationReason && (
                                                <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 13, color: '#dc2626' }}>
                                                    Ləğv səbəbi: {o.cancellationReason}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}