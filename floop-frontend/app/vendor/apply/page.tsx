'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    };
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: '1px solid #e5e5e5', fontSize: 14,
    fontFamily: 'inherit', color: '#0a0a0a',
    outline: 'none', transition: 'border-color 0.15s', background: '#fff',
};

function Field({ label, value, onChange, placeholder, type = 'text', prefix, hint, error }: any) {
    return (
        <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {prefix && (
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#a3a3a3', pointerEvents: 'none', zIndex: 1 }}>{prefix}</div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{ ...inputStyle, paddingLeft: prefix ? `${prefix.length * 8 + 16}px` : '14px', borderColor: error ? '#fca5a5' : '#e5e5e5' }}
                    onFocus={e => e.target.style.borderColor = error ? '#fca5a5' : '#6366f1'}
                    onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#e5e5e5'}
                />
            </div>
            {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>}
            {hint && !error && <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 4 }}>{hint}</div>}
        </div>
    );
}

export default function VendorApplyPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);
    const [existingStore, setExistingStore] = useState<any>(null);
    const [checking, setChecking] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        storeName: '',
        storeSlug: '',
        storeDescription: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
    });

    useEffect(() => {
        if (!getToken()) { window.location.href = '/login'; return; }
        checkExisting();
    }, []);

    async function checkExisting() {
        try {
            const res = await fetch('/api/vendors/me', { headers: authHeaders() });
            if (res.ok) setExistingStore(await res.json());
        } catch {}
        finally { setChecking(false); }
    }

    function update(field: string, value: string) {
        setForm(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
        if (field === 'storeName') {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
            setForm(p => ({ ...p, storeName: value, storeSlug: slug }));
            if (errors.storeSlug) setErrors(p => ({ ...p, storeSlug: '' }));
        }
    }

    function validateStep(s: number): boolean {
        const newErrors: Record<string, string> = {};
        if (s === 1) {
            if (!form.storeName.trim()) newErrors.storeName = 'Mağaza adı tələb olunur';
            if (!form.storeSlug.trim()) newErrors.storeSlug = 'Mağaza linki tələb olunur';
            else if (!/^[a-z0-9-]+$/.test(form.storeSlug)) newErrors.storeSlug = 'Yalnız kiçik hərf, rəqəm və tire';
            if (!form.storeDescription.trim()) newErrors.storeDescription = 'Açıqlama tələb olunur';
            else if (form.storeDescription.trim().length < 20) newErrors.storeDescription = 'Ən az 20 simvol';
        }
        if (s === 2) {
            if (!form.businessEmail.trim()) newErrors.businessEmail = 'Email tələb olunur';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) newErrors.businessEmail = 'Düzgün email daxil edin';
            if (!form.businessPhone.trim()) newErrors.businessPhone = 'Telefon tələb olunur';
            if (!form.businessAddress.trim()) newErrors.businessAddress = 'Ünvan tələb olunur';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function nextStep(e: React.FormEvent) {
        e.preventDefault();
        if (!validateStep(step)) return;
        setStep(s => s + 1);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/vendors/apply', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setSuccess(true);
            } else {
                const d = await res.json().catch(() => ({}));
                setSubmitError(d.message || `Xəta baş verdi (${res.status})`);
            }
        } catch {
            setSubmitError('Serverlə əlaqə qurulmadı');
        } finally {
            setLoading(false);
        }
    }

    if (checking) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    // Artıq mağaza var
    if (existingStore) {
        const STATUS: Record<string, { label: string; color: string; bg: string; desc: string; icon: string }> = {
            PENDING:     { label: 'Gözləyir',     color: '#d97706', bg: '#fef3c7', icon: '⏳', desc: 'Müraciətiniz admin tərəfindən yoxlanılır. 1-2 iş günü çəkir.' },
            APPROVED:    { label: 'Aktiv',         color: '#059669', bg: '#d1fae5', icon: '✅', desc: 'Mağazanız aktiv. Məhsul əlavə etməyə başlaya bilərsiniz.' },
            REJECTED:    { label: 'Rədd edildi',   color: '#dc2626', bg: '#fef2f2', icon: '❌', desc: 'Müraciətiniz rədd edildi.' },
            SUSPENDED:   { label: 'Dayandırıldı',  color: '#dc2626', bg: '#fef2f2', icon: '🚫', desc: 'Mağazanız müvəqqəti dayandırılıb.' },
            DEACTIVATED: { label: 'Deaktiv',       color: '#737373', bg: '#f5f5f5', icon: '⭕', desc: 'Mağazanız deaktiv vəziyyətdədir.' },
        };
        const s = STATUS[existingStore.status] || STATUS.PENDING;

        return (
            <div style={{ minHeight: '100vh', background: '#fafafa' }}>
                <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                    </Link>
                </nav>
                <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px' }}>
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20, padding: 36 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 700 }}>
                                {existingStore.storeName?.[0] || 'M'}
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>{existingStore.storeName}</div>
                                <div style={{ fontSize: 13, color: '#a3a3a3' }}>floop.az/store/{existingStore.storeSlug}</div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 18px', background: s.bg, borderRadius: 12, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 22 }}>{s.icon}</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontSize: 13, color: s.color, opacity: 0.8, lineHeight: 1.5 }}>{s.desc}</div>
                                {existingStore.rejectionReason && (
                                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: '#dc2626' }}>Səbəb: {existingStore.rejectionReason}</div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                            {[
                                { label: 'Satış', value: existingStore.totalSales || 0 },
                                { label: 'Məhsul', value: existingStore.totalProducts || 0 },
                                { label: 'Reytinq', value: existingStore.rating ? `${existingStore.rating}★` : '—' },
                            ].map(stat => (
                                <div key={stat.label} style={{ background: '#fafafa', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: '#0a0a0a' }}>{stat.value}</div>
                                    <div style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {existingStore.status === 'APPROVED' && (
                            <Link href="/vendor/dashboard" style={{ display: 'block', textAlign: 'center', padding: 13, borderRadius: 10, background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                                Vendor Panelə keç →
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (success) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
            <div style={{ textAlign: 'center', maxWidth: 440, padding: 48, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>✓</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, marginBottom: 12, color: '#0a0a0a' }}>Müraciətiniz qəbul edildi!</h2>
                <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.6, marginBottom: 28 }}>
                    Müraciətiniz adminə göndərildi. 1-2 iş günü ərzində nəticəni email vasitəsilə bildirəcəyik.
                </p>
                <Link href="/" style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 10, background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                    Ana səhifəyə qayıt
                </Link>
            </div>
        </div>
    );

    const steps = ['Mağaza məlumatları', 'Əlaqə məlumatları', 'Nəzərdən keçir'];

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                </Link>
            </nav>

            <div style={{ maxWidth: 600, margin: '48px auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #e0dcff', fontSize: 12.5, fontWeight: 500, color: '#6366f1', marginBottom: 16 }}>
                        🏪 Vendor Müraciəti
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1.5, color: '#0a0a0a', marginBottom: 10 }}>Öz mağazanı aç</h1>
                    <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.6 }}>Minlərlə müştəriyə çatın. Pulsuz qeydiyyat, asan idarəetmə.</p>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
                    {steps.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: i + 1 <= step ? '#6366f1' : '#e5e5e5', color: i + 1 <= step ? '#fff' : '#a3a3a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, transition: 'all 0.3s' }}>
                                    {i + 1 < step ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: i + 1 === step ? '#0a0a0a' : '#a3a3a3', whiteSpace: 'nowrap' }}>{s}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ flex: 1, height: 1, background: i + 1 < step ? '#6366f1' : '#e5e5e5', margin: '0 12px', transition: 'background 0.3s' }} />
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20, padding: 32 }}>

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={nextStep}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 20 }}>Mağaza məlumatları</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Field label="Mağaza adı" value={form.storeName} onChange={(v: string) => update('storeName', v)} placeholder="məs. Tech Store Bakı" error={errors.storeName} />
                                <Field label="Mağaza linki" value={form.storeSlug} onChange={(v: string) => update('storeSlug', v)} placeholder="tech-store-baku" prefix="floop.az/store/" hint="Yalnız kiçik hərf, rəqəm və tire" error={errors.storeSlug} />
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Mağaza haqqında</label>
                                    <textarea value={form.storeDescription} onChange={e => { update('storeDescription', e.target.value); }} placeholder="Mağazanız, satdığınız məhsullar haqqında ətraflı yazın..." rows={4}
                                              style={{ ...inputStyle, resize: 'vertical' as any, borderColor: errors.storeDescription ? '#fca5a5' : '#e5e5e5' }}
                                              onFocus={e => e.target.style.borderColor = '#6366f1'}
                                              onBlur={e => e.target.style.borderColor = errors.storeDescription ? '#fca5a5' : '#e5e5e5'}
                                    />
                                    {errors.storeDescription && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.storeDescription}</div>}
                                </div>
                                <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Növbəti →
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={nextStep}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 20 }}>Əlaqə məlumatları</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Field label="Biznes email" value={form.businessEmail} onChange={(v: string) => update('businessEmail', v)} placeholder="magaza@example.com" type="email" error={errors.businessEmail} />
                                <Field label="Biznes telefon" value={form.businessPhone} onChange={(v: string) => update('businessPhone', v)} placeholder="+994501234567" type="tel" error={errors.businessPhone} />
                                <Field label="Biznes ünvanı" value={form.businessAddress} onChange={(v: string) => update('businessAddress', v)} placeholder="Bakı, Nərimanov, Nizami küç. 10" error={errors.businessAddress} />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button type="button" onClick={() => setStep(1)} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ← Geri
                                    </button>
                                    <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Növbəti →
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a', marginBottom: 20 }}>Nəzərdən keçirin</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                {[
                                    {
                                        title: 'Mağaza məlumatları',
                                        fields: [
                                            { label: 'Mağaza adı', value: form.storeName },
                                            { label: 'Link', value: `floop.az/store/${form.storeSlug}` },
                                            { label: 'Açıqlama', value: form.storeDescription },
                                        ],
                                    },
                                    {
                                        title: 'Əlaqə məlumatları',
                                        fields: [
                                            { label: 'Email', value: form.businessEmail },
                                            { label: 'Telefon', value: form.businessPhone },
                                            { label: 'Ünvan', value: form.businessAddress },
                                        ],
                                    },
                                ].map(section => (
                                    <div key={section.title} style={{ background: '#fafafa', borderRadius: 12, padding: 16 }}>
                                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>{section.title}</div>
                                        {section.fields.map(f => (
                                            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 13.5, color: '#737373' }}>{f.label}</span>
                                                <span style={{ fontSize: 13.5, color: '#0a0a0a', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                <div style={{ padding: '12px 16px', background: '#f5f3ff', border: '1px solid #e0dcff', borderRadius: 10, fontSize: 13, color: '#525252', lineHeight: 1.5 }}>
                                    Müraciəti göndərməklə floop-un satıcı şərtlərini qəbul etmiş olursunuz.
                                </div>
                            </div>

                            {submitError && (
                                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                                    {submitError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setStep(2)} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e5e5e5', background: '#fff', color: '#525252', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ← Geri
                                </button>
                                <button type="submit" disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: loading ? '#a3a3a3' : '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {loading ? (
                                        <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Göndərilir...</>
                                    ) : 'Müraciəti göndər →'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Benefits */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
                    {[
                        { icon: '💰', title: 'Pulsuz başlayın', desc: 'Qeydiyyat ödənişsizdir' },
                        { icon: '📊', title: 'Real-time analitika', desc: 'Satış statistikası' },
                        { icon: '🚀', title: 'Sürətli təsdiq', desc: '1-2 iş günü' },
                    ].map(b => (
                        <div key={b.title} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', marginBottom: 2 }}>{b.title}</div>
                            <div style={{ fontSize: 12, color: '#a3a3a3' }}>{b.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}