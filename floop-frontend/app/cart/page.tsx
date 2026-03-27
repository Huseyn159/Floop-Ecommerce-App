'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function getCart(): any[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart(cart: any[]) {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [checkingOut, setCheckingOut] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setCart(getCart());
        const handler = () => setCart(getCart());
        window.addEventListener('cartUpdated', handler);
        return () => window.removeEventListener('cartUpdated', handler);
    }, []);

    function updateQty(id: string, color: string, delta: number) {
        const updated = cart.map(item => {
            if (item.id === id && item.color === color) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean);
        saveCart(updated);
        setCart(updated);
    }

    function removeItem(id: string, color: string) {
        const updated = cart.filter(item => !(item.id === id && item.color === color));
        saveCart(updated);
        setCart(updated);
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery = subtotal >= 50 ? 0 : 5;
    const total = subtotal + delivery;

    async function handleCheckout() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        setCheckingOut(true);
        setError('');
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                    })),
                    shippingAddress: 'Nizami küçəsi 10',
                    shippingCity: 'Bakı',
                    shippingCountry: 'Azərbaycan',
                    shippingZipCode: 'AZ1000',
                    currency: 'AZN',
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setError(d.message || 'Sifariş zamanı xəta baş verdi');
                return;
            }
            saveCart([]);
            setCart([]);
            setOrderSuccess(true);
        } catch {
            setError('Serverlə əlaqə qurulmadı');
        } finally {
            setCheckingOut(false);
        }
    }

    if (orderSuccess) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', maxWidth: 420, padding: 48, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4',
                        border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 32, margin: '0 auto 20px',
                    }}>✓</div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, marginBottom: 12, color: '#0a0a0a' }}>
                        Sifarişiniz qəbul edildi!
                    </h2>
                    <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.6, marginBottom: 28 }}>
                        Sifarişiniz işlənir. Tezliklə email bildirişi alacaqsınız.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <Link href="/" style={{
                            padding: '11px 24px', borderRadius: 10, background: '#0a0a0a',
                            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        }}>Ana səhifəyə →</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div style={{ minHeight: '100vh', background: '#fff' }}>
                <nav style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 40px', height: 60, borderBottom: '1px solid #f0f0f0',
                }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>
              floop<span style={{ color: '#6366f1' }}>.</span>
            </span>
                    </Link>
                </nav>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, marginBottom: 12, color: '#0a0a0a' }}>Səbətiniz boşdur</h2>
                    <p style={{ fontSize: 15, color: '#737373', marginBottom: 28 }}>Məhsulları kəşf edin və səbətinizə əlavə edin</p>
                    <Link href="/" style={{
                        padding: '12px 28px', borderRadius: 10, background: '#0a0a0a',
                        color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}>Alış-verişə başla →</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', height: 60, borderBottom: '1px solid #f0f0f0',
                position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)', zIndex: 100,
            }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>
            floop<span style={{ color: '#6366f1' }}>.</span>
          </span>
                </Link>
                <span style={{ fontSize: 14, color: '#737373' }}>{cart.length} məhsul</span>
            </nav>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>

                {/* Cart items */}
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a', marginBottom: 28 }}>
                        Səbətim
                    </h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {cart.map((item, i) => (
                            <div key={`${item.id}-${item.color}-${i}`} style={{
                                display: 'flex', gap: 16, padding: 20,
                                border: '1px solid #f0f0f0', borderRadius: 16, background: '#fff',
                                transition: 'border-color 0.15s',
                            }}
                                 onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5'}
                                 onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'}
                            >
                                <div style={{ width: 88, height: 88, borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#fafafa', flexShrink: 0 }}>
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a', marginBottom: 4 }}>{item.name}</div>
                                    {item.color && <div style={{ fontSize: 12.5, color: '#a3a3a3', marginBottom: 10 }}>Rəng: {item.color}</div>}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                            <button onClick={() => updateQty(item.id, item.color, -1)} style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#525252' }}>−</button>
                                            <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, item.color, 1)} style={{ width: 32, height: 32, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#525252' }}>+</button>
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>
                                            ₼{(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(item.id, item.color)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4d4d4', fontSize: 18, alignSelf: 'flex-start', padding: 0, transition: 'color 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#d4d4d4'}
                                >✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 20, padding: 28, position: 'sticky', top: 80 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 24 }}>Sifariş xülasəsi</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#525252' }}>
                                <span>Ara cəm ({cart.reduce((s, i) => s + i.quantity, 0)} məhsul)</span>
                                <span style={{ fontWeight: 600, color: '#0a0a0a' }}>₼{subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#525252' }}>
                                <span>Çatdırılma</span>
                                <span style={{ fontWeight: 600, color: delivery === 0 ? '#16a34a' : '#0a0a0a' }}>
                  {delivery === 0 ? 'Pulsuz' : `₼${delivery}`}
                </span>
                            </div>
                            {delivery > 0 && (
                                <div style={{ fontSize: 12, color: '#a3a3a3', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                    ₼{(50 - subtotal).toFixed(2)} dəyərində məhsul əlavə edin — pulsuz çatdırılma qazanın
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>Cəm</span>
                            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a' }}>₼{total.toLocaleString()}</span>
                        </div>

                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={checkingOut}
                            style={{
                                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                                background: checkingOut ? '#a3a3a3' : '#0a0a0a', color: '#fff',
                                fontSize: 15, fontWeight: 600, cursor: checkingOut ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                marginBottom: 12,
                            }}
                        >
                            {checkingOut ? (
                                <>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Sifariş verilir...
                                </>
                            ) : 'Sifariş ver →'}
                        </button>

                        <Link href="/" style={{
                            display: 'block', textAlign: 'center', fontSize: 13.5, color: '#737373',
                            textDecoration: 'none', fontWeight: 500,
                        }}>← Alış-verişə davam et</Link>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                            {['🔒 Güvənli ödəniş', '↩ 14 gün iade'].map(t => (
                                <span key={t} style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
        </div>
    );
}