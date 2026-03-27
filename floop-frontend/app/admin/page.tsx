'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function AdminPanel() {
    const [tab, setTab] = useState<'vendors' | 'orders' | 'users'>('vendors');
    const [pendingVendors, setPendingVendors] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (!localStorage.getItem('accessToken') || role !== 'ADMIN') {
            window.location.href = '/';
            return;
        }
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [vendorRes, orderRes] = await Promise.all([
                fetch('/api/vendors/admin/pending', { headers: authHeaders() }),
                fetch('/api/orders/vendor?size=50', { headers: authHeaders() }),
            ]);
            if (vendorRes.ok) setPendingVendors(await vendorRes.json());
            if (orderRes.ok) { const d = await orderRes.json(); setOrders(d.content || []); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function reviewVendor(vendorId: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
        setActionLoading(vendorId);
        try {
            await fetch(`/api/vendors/admin/${vendorId}/review`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ status, rejectionReason: reason }),
            });
            setPendingVendors(prev => prev.filter(v => v.userId !== vendorId));
            setRejectId(null);
            setRejectReason('');
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    }

    async function suspendVendor(vendorId: string) {
        setActionLoading(vendorId);
        try {
            await fetch(`/api/vendors/admin/${vendorId}/suspend`, { method: 'PUT', headers: authHeaders() });
            fetchAll();
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    }

    const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
        PENDING:    { label: 'Gözləyir',    color: '#d97706', bg: '#fef3c7' },
        CONFIRMED:  { label: 'Təsdiqləndi', color: '#059669', bg: '#d1fae5' },
        PROCESSING: { label: 'Hazırlanır',  color: '#6366f1', bg: '#ede9fe' },
        SHIPPED:    { label: 'Göndərildi',  color: '#0284c7', bg: '#e0f2fe' },
        DELIVERED:  { label: 'Çatdırıldı',  color: '#16a34a', bg: '#f0fdf4' },
        CANCELLED:  { label: 'Ləğv edildi', color: '#dc2626', bg: '#fef2f2' },
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'inherit' }}>
            {/* Nav */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 40px', height: 60, background: '#0a0a0a',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}>
              floop<span style={{ color: '#6366f1' }}>.</span>
            </span>
                    </Link>
                    <div style={{ width: 1, height: 18, background: '#333' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#737373' }}>Admin Panel</span>
                </div>
                <button
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #222', background: 'transparent', color: '#737373', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >Çıxış</button>
            </nav>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Gözləyən vendorlar', value: pendingVendors.length, color: '#d97706' },
                        { label: 'Ümumi sifariş', value: orders.length, color: '#6366f1' },
                        { label: 'Aktiv sifarişlər', value: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length, color: '#059669' },
                    ].map(s => (
                        <div key={s.label} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '20px 24px' }}>
                            <div style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{s.label}</div>
                            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1.5, color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', padding: 4, borderRadius: 12, marginBottom: 24, width: 'fit-content' }}>
                    {[
                        { id: 'vendors', label: `Vendor Müraciətləri${pendingVendors.length ? ` (${pendingVendors.length})` : ''}` },
                        { id: 'orders', label: `Sifarişlər (${orders.length})` },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)} style={{
                            padding: '8px 18px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
                            fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                            background: tab === t.id ? '#fff' : 'transparent',
                            color: tab === t.id ? '#0a0a0a' : '#737373',
                            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* Vendor müraciətləri */}
                {tab === 'vendors' && (
                    <div>
                        {pendingVendors.length === 0 ? (
                            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '48px', textAlign: 'center', color: '#a3a3a3', fontSize: 14 }}>
                                Gözləyən vendor müraciəti yoxdur ✓
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {pendingVendors.map((v: any) => (
                                    <div key={v.userId} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                    <div style={{
                                                        width: 42, height: 42, borderRadius: 10,
                                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                                                    }}>{v.storeName?.[0] || 'V'}</div>
                                                    <div>
                                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>{v.storeName}</div>
                                                        <div style={{ fontSize: 12.5, color: '#a3a3a3' }}>{v.storeSlug}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                                    {[
                                                        { label: 'Email', value: v.businessEmail },
                                                        { label: 'Telefon', value: v.businessPhone },
                                                        { label: 'Ünvan', value: v.businessAddress },
                                                    ].map(f => (
                                                        <div key={f.label}>
                                                            <div style={{ fontSize: 11, color: '#a3a3a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{f.label}</div>
                                                            <div style={{ fontSize: 13.5, color: '#0a0a0a', fontWeight: 500 }}>{f.value || '—'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {v.storeDescription && (
                                                    <div style={{ marginTop: 12, fontSize: 13.5, color: '#525252', lineHeight: 1.5 }}>{v.storeDescription}</div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 24 }}>
                                                <button
                                                    onClick={() => reviewVendor(v.userId, 'APPROVED')}
                                                    disabled={actionLoading === v.userId}
                                                    style={{
                                                        padding: '9px 20px', borderRadius: 9, border: 'none',
                                                        background: '#0a0a0a', color: '#fff', fontSize: 13.5, fontWeight: 600,
                                                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                                        opacity: actionLoading === v.userId ? 0.6 : 1,
                                                    }}
                                                >✓ Təsdiq et</button>
                                                <button
                                                    onClick={() => setRejectId(v.userId)}
                                                    disabled={actionLoading === v.userId}
                                                    style={{
                                                        padding: '9px 20px', borderRadius: 9, border: '1px solid #fecaca',
                                                        background: '#fef2f2', color: '#dc2626', fontSize: 13.5, fontWeight: 600,
                                                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                                    }}
                                                >✕ Rədd et</button>
                                            </div>
                                        </div>

                                        {/* Reject modal */}
                                        {rejectId === v.userId && (
                                            <div style={{ marginTop: 16, padding: 16, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Rədd etmə səbəbi</div>
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    placeholder="Səbəbi qeyd edin..."
                                                    rows={2}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', background: '#fff' }}
                                                />
                                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                                    <button
                                                        onClick={() => reviewVendor(v.userId, 'REJECTED', rejectReason)}
                                                        disabled={!rejectReason.trim() || actionLoading === v.userId}
                                                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: rejectReason.trim() ? 1 : 0.5 }}
                                                    >Rədd et</button>
                                                    <button
                                                        onClick={() => { setRejectId(null); setRejectReason(''); }}
                                                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                                                    >Ləğv et</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sifarişlər */}
                {tab === 'orders' && (
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
                        {orders.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: '#a3a3a3', fontSize: 14 }}>Sifariş yoxdur</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    {['Sifariş', 'Müştəri', 'Vendor', 'Məbləğ', 'Status', 'Tarix'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {orders.map((o: any) => {
                                    const s = STATUS_COLORS[o.status] || { label: o.status, color: '#525252', bg: '#f5f5f5' };
                                    return (
                                        <tr key={o.id} style={{ borderBottom: '1px solid #fafafa' }}>
                                            <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#0a0a0a', fontFamily: 'monospace' }}>
                                                {o.id?.slice(0, 8)}...
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#525252', fontFamily: 'monospace' }}>
                                                {o.customerId?.slice(0, 8)}...
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#525252', fontFamily: 'monospace' }}>
                                                {o.vendorId?.slice(0, 8)}...
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>
                                                ₼{o.totalAmount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 12, color: '#a3a3a3' }}>
                                                {new Date(o.createdAt).toLocaleDateString('az')}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}