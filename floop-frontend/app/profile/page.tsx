'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function authHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

type Tab = 'profile' | 'addresses' | 'notifications';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 9,
    border: '1px solid #e5e5e5', fontSize: 14,
    fontFamily: 'inherit', color: '#0a0a0a',
    outline: 'none', transition: 'border-color 0.15s', background: '#fff',
};

function Field({ label, value, onChange, placeholder, type = 'text', readOnly = false }: any) {
    return (
        <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>{label}</label>
            <input
                type={type} value={value} onChange={e => onChange?.(e.target.value)}
                placeholder={placeholder} readOnly={readOnly}
                style={{ ...inputStyle, background: readOnly ? '#fafafa' : '#fff', color: readOnly ? '#a3a3a3' : '#0a0a0a' }}
                onFocus={e => !readOnly && (e.target.style.borderColor = '#6366f1')}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
        </div>
    );
}

function Spinner() {
    return (
        <>
            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
    );
}

// ============ ADDRESS MODAL ============
function AddressModal({ onClose, onSave, initial }: { onClose: () => void; onSave: (data: any) => Promise<void>; initial?: any }) {
    const [form, setForm] = useState({
        title: initial?.title || '',
        fullName: initial?.fullName || '',
        phoneNumber: initial?.phoneNumber || '',
        country: initial?.country || 'Azərbaycan',
        city: initial?.city || '',
        district: initial?.district || '',
        addressLine: initial?.addressLine || '',
        zipCode: initial?.zipCode || '',
        isDefault: initial?.isDefault || false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try { await onSave(form); onClose(); }
        catch (err: any) { setError(err.message || 'Xəta baş verdi'); }
        finally { setSaving(false); }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>
                        {initial ? 'Ünvanı düzəlt' : 'Yeni ünvan əlavə et'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a3a3a3', lineHeight: 1 }}>✕</button>
                </div>

                <form onSubmit={submit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Title */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 8 }}>Ünvan növü</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['Ev', 'İş', 'Digər'].map(t => (
                                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, title: t }))}
                                            style={{ padding: '7px 18px', borderRadius: 8, border: `1.5px solid ${form.title === t ? '#6366f1' : '#e5e5e5'}`, background: form.title === t ? '#f5f3ff' : '#fff', color: form.title === t ? '#6366f1' : '#525252', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {t === 'Ev' ? '🏠' : t === 'İş' ? '🏢' : '📍'} {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="Ad Soyad" value={form.fullName} onChange={(v: string) => setForm(p => ({ ...p, fullName: v }))} placeholder="Huseyn Əliyev" />
                            <Field label="Telefon" value={form.phoneNumber} onChange={(v: string) => setForm(p => ({ ...p, phoneNumber: v }))} placeholder="+994501234567" type="tel" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="Ölkə" value={form.country} onChange={(v: string) => setForm(p => ({ ...p, country: v }))} placeholder="Azərbaycan" />
                            <Field label="Şəhər" value={form.city} onChange={(v: string) => setForm(p => ({ ...p, city: v }))} placeholder="Bakı" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="Rayon" value={form.district} onChange={(v: string) => setForm(p => ({ ...p, district: v }))} placeholder="Nərimanov" />
                            <Field label="Poçt kodu" value={form.zipCode} onChange={(v: string) => setForm(p => ({ ...p, zipCode: v }))} placeholder="AZ1000" />
                        </div>

                        <Field label="Ünvan" value={form.addressLine} onChange={(v: string) => setForm(p => ({ ...p, addressLine: v }))} placeholder="Nizami küçəsi 10, mənzil 5" />

                        {/* Default toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <div onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
                                 style={{ width: 40, height: 22, borderRadius: 11, background: form.isDefault ? '#6366f1' : '#e5e5e5', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                <div style={{ position: 'absolute', top: 2, left: form.isDefault ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                            </div>
                            <span style={{ fontSize: 13.5, color: '#525252', fontWeight: 500 }}>Əsas ünvan kimi təyin et</span>
                        </label>

                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <button type="submit" disabled={saving || !form.title || !form.fullName || !form.city || !form.addressLine}
                                    style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!form.title || !form.fullName || !form.city || !form.addressLine) ? 0.5 : 1 }}>
                                {saving ? <><Spinner /> Saxlanılır...</> : 'Saxla'}
                            </button>
                            <button type="button" onClick={onClose}
                                    style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Ləğv et
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============ MAIN PAGE ============
export default function ProfilePage() {
    const [tab, setTab] = useState<Tab>('profile');
    const [profile, setProfile] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editAddress, setEditAddress] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        firstName: '', lastName: '', phoneNumber: '', bio: '',
        emailNotifications: true, pushNotifications: true,
        language: 'az', currency: 'AZN',
    });

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) { window.location.href = '/login'; return; }
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [pRes, aRes] = await Promise.all([
                fetch('/api/users/me', { headers: authHeaders() }),
                fetch('/api/users/me/addresses', { headers: authHeaders() }),
            ]);
            if (pRes.ok) {
                const p = await pRes.json();
                setProfile(p);
                setForm({
                    firstName: p.firstName || '',
                    lastName: p.lastName || '',
                    phoneNumber: p.phoneNumber || '',
                    bio: p.bio || '',
                    emailNotifications: p.emailNotifications ?? true,
                    pushNotifications: p.pushNotifications ?? true,
                    language: p.language || 'az',
                    currency: p.currency || 'AZN',
                });
            }
            if (aRes.ok) setAddresses(await aRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(''); setSaved(false);
        try {
            const res = await fetch('/api/users/me', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(form) });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                localStorage.setItem('firstName', updated.firstName || '');
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else {
                const d = await res.json().catch(() => ({}));
                setError(d.message || 'Xəta baş verdi');
            }
        } catch { setError('Serverlə əlaqə qurulmadı'); }
        finally { setSaving(false); }
    }

    async function addAddress(data: any) {
        const res = await fetch('/api/users/me/addresses', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Xəta baş verdi'); }
        await fetchAll();
    }

    async function updateAddress(addressId: string, data: any) {
        const res = await fetch(`/api/users/me/addresses/${addressId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Xəta baş verdi'); }
        await fetchAll();
    }

    async function deleteAddress(addressId: string) {
        setDeletingId(addressId);
        try {
            await fetch(`/api/users/me/addresses/${addressId}`, { method: 'DELETE', headers: authHeaders() });
            setAddresses(prev => prev.filter(a => a.id !== addressId));
        } catch (e) { console.error(e); }
        finally { setDeletingId(null); }
    }

    async function setDefaultAddress(addressId: string) {
        try {
            await fetch(`/api/users/me/addresses/${addressId}/default`, { method: 'PATCH', headers: authHeaders() });
            await fetchAll();
        } catch (e) { console.error(e); }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, color: '#a3a3a3' }}>Yüklənir...</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase() || '?';

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'inherit' }}>
            {/* Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/orders" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, color: '#525252', textDecoration: 'none', fontWeight: 500 }}>📦 Sifarişlərim</Link>
                    <Link href="/cart" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13, color: '#525252', textDecoration: 'none', fontWeight: 500 }}>🛒 Səbət</Link>
                </div>
            </nav>

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>

                    {/* Sidebar */}
                    <div style={{ height: 'fit-content' }}>
                        {/* Avatar card */}
                        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 12 }}>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 auto 12px' }}>
                                {initials}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{profile?.firstName} {profile?.lastName}</div>
                            <div style={{ fontSize: 12.5, color: '#a3a3a3', marginBottom: 10 }}>{profile?.email}</div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: '#f0f9ff', color: '#0284c7' }}>
                👤 Müştəri
              </span>
                        </div>

                        {/* Nav */}
                        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { id: 'profile', label: '👤 Profil məlumatları' },
                                { id: 'addresses', label: `📍 Ünvanlarım${addresses.length ? ` (${addresses.length})` : ''}` },
                                { id: 'notifications', label: '🔔 Bildirişlər' },
                            ].map(item => (
                                <button key={item.id} onClick={() => setTab(item.id as Tab)}
                                        style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: tab === item.id ? '#f5f3ff' : 'transparent', color: tab === item.id ? '#6366f1' : '#525252', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' }}>
                                    {item.label}
                                </button>
                            ))}
                            <div style={{ height: 1, background: '#f5f5f5', margin: '4px 0' }} />
                            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                                    style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: '#ef4444', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                                🚪 Çıxış
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        {/* ===== PROFILE TAB ===== */}
                        {tab === 'profile' && (
                            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 28 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 24 }}>Şəxsi məlumatlar</h2>
                                <form onSubmit={handleSaveProfile}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Field label="Ad" value={form.firstName} onChange={(v: string) => setForm(p => ({ ...p, firstName: v }))} placeholder="Huseyn" />
                                            <Field label="Soyad" value={form.lastName} onChange={(v: string) => setForm(p => ({ ...p, lastName: v }))} placeholder="Əliyev" />
                                        </div>
                                        <Field label="Email" value={profile?.email || ''} readOnly placeholder="siz@example.com" />
                                        <Field label="Telefon" value={form.phoneNumber} onChange={(v: string) => setForm(p => ({ ...p, phoneNumber: v }))} placeholder="+994501234567" type="tel" />
                                        <div>
                                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Bio</label>
                                            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Özünüz haqqında qısa məlumat..." rows={3}
                                                      style={{ ...inputStyle, resize: 'vertical' as any }}
                                                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                                                      onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Dil</label>
                                                <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                                                        style={{ ...inputStyle }}>
                                                    <option value="az">🇦🇿 Azərbaycan</option>
                                                    <option value="en">🇬🇧 English</option>
                                                    <option value="tr">🇹🇷 Türkçe</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Valyuta</label>
                                                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                                                        style={{ ...inputStyle }}>
                                                    <option value="AZN">₼ AZN</option>
                                                    <option value="USD">$ USD</option>
                                                    <option value="EUR">€ EUR</option>
                                                </select>
                                            </div>
                                        </div>

                                        {error && (
                                            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <button type="submit" disabled={saving}
                                                    style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: saving ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {saving ? <><Spinner /> Saxlanılır...</> : 'Dəyişiklikləri saxla'}
                                            </button>
                                            {saved && <span style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 500 }}>✓ Saxlanıldı</span>}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ===== ADDRESSES TAB ===== */}
                        {tab === 'addresses' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>Ünvanlarım</h2>
                                    {addresses.length < 5 && (
                                        <button onClick={() => { setEditAddress(null); setShowModal(true); }}
                                                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            + Yeni ünvan
                                        </button>
                                    )}
                                </div>

                                {addresses.length === 0 ? (
                                    <div style={{ background: '#fff', border: '2px dashed #e5e5e5', borderRadius: 16, padding: '48px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Hələ ünvan əlavə edilməyib</div>
                                        <div style={{ fontSize: 13.5, color: '#a3a3a3', marginBottom: 20 }}>Çatdırılma üçün ünvan əlavə edin</div>
                                        <button onClick={() => { setEditAddress(null); setShowModal(true); }}
                                                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                            + Ünvan əlavə et
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {addresses.map((addr: any) => (
                                            <div key={addr.id} style={{ background: '#fff', border: `1.5px solid ${addr.isDefault ? '#c7d2fe' : '#f0f0f0'}`, borderRadius: 16, padding: 20, transition: 'border-color 0.15s', position: 'relative' }}>
                                                {addr.isDefault && (
                                                    <span style={{ position: 'absolute', top: 14, right: 14, padding: '2px 10px', borderRadius: 5, background: '#ede9fe', color: '#6366f1', fontSize: 11.5, fontWeight: 600 }}>Əsas ünvan</span>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: addr.isDefault ? '#ede9fe' : '#fafafa', border: `1px solid ${addr.isDefault ? '#c7d2fe' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                                        {addr.title === 'Ev' ? '🏠' : addr.title === 'İş' ? '🏢' : '📍'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{addr.title}</div>
                                                        <div style={{ fontSize: 13.5, color: '#525252', marginBottom: 2 }}>{addr.fullName} · {addr.phoneNumber}</div>
                                                        <div style={{ fontSize: 13, color: '#a3a3a3' }}>{addr.addressLine}, {addr.district}, {addr.city}, {addr.country}{addr.zipCode ? ` ${addr.zipCode}` : ''}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f5f5f5' }}>
                                                    <button onClick={() => { setEditAddress(addr); setShowModal(true); }}
                                                            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        ✏️ Düzəlt
                                                    </button>
                                                    {!addr.isDefault && (
                                                        <button onClick={() => setDefaultAddress(addr.id)}
                                                                style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e0dcff', background: '#f5f3ff', color: '#6366f1', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                            ★ Əsas et
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteAddress(addr.id)} disabled={deletingId === addr.id}
                                                            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                                                        {deletingId === addr.id ? '...' : '🗑 Sil'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {addresses.length >= 5 && (
                                            <div style={{ padding: '12px 16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                                                Maksimum 5 ünvan əlavə edə bilərsiniz.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== NOTIFICATIONS TAB ===== */}
                        {tab === 'notifications' && (
                            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 28 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 24 }}>Bildiriş tənzimləmələri</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {[
                                        { key: 'emailNotifications', label: 'Email bildirişləri', desc: 'Sifarişlər, kampaniyalar və yeniliklər haqqında email alın' },
                                        { key: 'pushNotifications', label: 'Push bildirişlər', desc: 'Brauzerdən anlıq bildirişlər alın' },
                                    ].map((item, i) => (
                                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderBottom: i === 0 ? '1px solid #f5f5f5' : 'none' }}>
                                            <div>
                                                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0a', marginBottom: 3 }}>{item.label}</div>
                                                <div style={{ fontSize: 13, color: '#a3a3a3' }}>{item.desc}</div>
                                            </div>
                                            <div onClick={() => setForm(p => ({ ...p, [item.key]: !(p as any)[item.key] }))}
                                                 style={{ width: 44, height: 24, borderRadius: 12, background: (form as any)[item.key] ? '#6366f1' : '#e5e5e5', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                                                <div style={{ position: 'absolute', top: 2, left: (form as any)[item.key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleSaveProfile} disabled={saving}
                                        style={{ marginTop: 24, padding: '11px 28px', borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {saving ? <><Spinner /> Saxlanılır...</> : 'Dəyişiklikləri saxla'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            {showModal && (
                <AddressModal
                    onClose={() => { setShowModal(false); setEditAddress(null); }}
                    onSave={editAddress ? (data) => updateAddress(editAddress.id, data) : addAddress}
                    initial={editAddress}
                />
            )}

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}