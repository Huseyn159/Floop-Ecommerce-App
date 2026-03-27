'use client';

import { useState } from 'react';
import Link from 'next/link';

function getPasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    return score;
}

function getStrengthColor(password: string, level: number): string {
    const strength = getPasswordStrength(password);
    if (level > strength) return '#f0f0f0';
    if (strength <= 1) return '#fca5a5';
    if (strength <= 2) return '#fcd34d';
    if (strength <= 3) return '#6ee7b7';
    return '#34d399';
}

function getStrengthLabel(password: string): string {
    const s = getPasswordStrength(password);
    if (s <= 1) return 'Zəif';
    if (s <= 2) return 'Orta';
    if (s <= 3) return 'Yaxşı';
    return 'Güclü';
}

export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    function update(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (form.password.length < 8) {
            setError('Şifrə ən az 8 simvol olmalıdır');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Şifrələr uyğun gəlmir');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                }),
            });

            // 200 və ya 201 — uğurlu (backend void qaytarır)
            if (res.ok) {
                setSuccess(true);
                return;
            }

            // Xəta — JSON parse et
            try {
                const data = await res.json();
                setError(data.message || 'Qeydiyyat zamanı xəta baş verdi');
            } catch {
                if (res.status === 409) setError('Bu email artıq qeydiyyatdan keçib');
                else setError('Qeydiyyat zamanı xəta baş verdi');
            }
        } catch {
            setError('Serverlə əlaqə qurulmadı. Yenidən cəhd edin.');
        } finally {
            setLoading(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 9,
        border: '1px solid #e5e5e5', fontSize: 14,
        fontFamily: 'inherit', color: '#0a0a0a',
        outline: 'none', transition: 'border-color 0.15s', background: '#fff',
    };

    if (success) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center', background: '#fafafa',
            }}>
                <div style={{
                    textAlign: 'center', maxWidth: 420, padding: '48px',
                    background: '#fff', border: '1px solid #f0f0f0', borderRadius: 20,
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, margin: '0 auto 20px',
                    }}>✓</div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, marginBottom: 12, color: '#0a0a0a' }}>
                        Qeydiyyat tamamlandı!
                    </h2>
                    <p style={{ fontSize: 15, color: '#737373', lineHeight: 1.6, marginBottom: 28 }}>
                        <strong>{form.email}</strong> ünvanına doğrulama linki göndərdik.
                        Zəhmət olmasa emailinizi yoxlayın.
                    </p>
                    <Link href="/login" style={{
                        display: 'inline-block', padding: '11px 28px',
                        borderRadius: 10, background: '#0a0a0a', color: '#fff',
                        fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}>
                        Giriş et →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Sol panel */}
            <div style={{
                background: '#0a0a0a', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', padding: 40, position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '15%', left: '5%', width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none', animation: 'float 7s ease-in-out infinite',
                }} />

                <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}>
            floop<span style={{ color: '#6366f1' }}>.</span>
          </span>
                </Link>

                <div>
                    <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
                        Qoşulun.<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Pulsuz.</span>
                    </div>
                    <p style={{ fontSize: 16, color: '#525252', lineHeight: 1.6, maxWidth: 340 }}>
                        Minlərlə məhsula çıxış əldə edin. Sifariş verin, izləyin, iade edin.
                    </p>

                    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { icon: '⚡', text: 'Anında qeydiyyat — 30 saniyə' },
                            { icon: '🔒', text: 'Məlumatlarınız tam qorunur' },
                            { icon: '🎁', text: 'İlk sifarişdə 10% endirim' },
                        ].map(b => (
                            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'rgba(99,102,241,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 15, flexShrink: 0,
                                }}>{b.icon}</div>
                                <span style={{ fontSize: 14, color: '#737373' }}>{b.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#333' }}>© 2025 Floop</div>

                <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        `}</style>
            </div>

            {/* Sağ panel */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 40, background: '#fff', overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: 380 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.2, color: '#0a0a0a', marginBottom: 8 }}>
                        Hesab yarat
                    </h1>
                    <p style={{ fontSize: 14.5, color: '#737373', marginBottom: 32 }}>
                        Artıq hesabınız var?{' '}
                        <Link href="/login" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>
                            Daxil olun
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Ad / Soyad */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 5 }}>Ad</label>
                                <input
                                    type="text"
                                    value={form.firstName}
                                    onChange={e => update('firstName', e.target.value)}
                                    placeholder="Huseyn"
                                    required
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 5 }}>Soyad</label>
                                <input
                                    type="text"
                                    value={form.lastName}
                                    onChange={e => update('lastName', e.target.value)}
                                    placeholder="Əliyev"
                                    required
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 5 }}>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => update('email', e.target.value)}
                                placeholder="siz@example.com"
                                required
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                            />
                        </div>

                        {/* Şifrə */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 5 }}>Şifrə</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => update('password', e.target.value)}
                                placeholder="Ən az 8 simvol"
                                required
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                            />
                            {form.password && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: 3, borderRadius: 2,
                                                background: getStrengthColor(form.password, i),
                                                transition: 'background 0.3s',
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#a3a3a3' }}>
                                        Şifrə gücü: <span style={{ fontWeight: 600 }}>{getStrengthLabel(form.password)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Şifrə təsdiq */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 5 }}>
                                Şifrəni təsdiqlə
                            </label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={e => update('confirmPassword', e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    ...inputStyle,
                                    borderColor: form.confirmPassword && form.password !== form.confirmPassword
                                        ? '#fca5a5' : '#e5e5e5',
                                }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => {
                                    e.target.style.borderColor = form.password !== form.confirmPassword && form.confirmPassword
                                        ? '#fca5a5' : '#e5e5e5';
                                }}
                            />
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                                    Şifrələr uyğun gəlmir
                                </div>
                            )}
                        </div>

                        {/* Xəta */}
                        {error && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, background: '#fef2f2',
                                border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: 12, borderRadius: 10, border: 'none',
                                background: loading ? '#a3a3a3' : '#0a0a0a', color: '#fff',
                                fontSize: 14.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {loading ? (
                                <>
                  <span style={{
                      width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                                    Qeydiyyat...
                                </>
                            ) : 'Hesab yarat →'}
                        </button>

                        <p style={{ fontSize: 12, color: '#a3a3a3', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                            Qeydiyyatdan keçməklə{' '}
                            <a href="#" style={{ color: '#6366f1', textDecoration: 'none' }}>İstifadə Şərtləri</a>
                            {' '}və{' '}
                            <a href="#" style={{ color: '#6366f1', textDecoration: 'none' }}>Məxfilik Siyasəti</a>-ni qəbul edirsiniz.
                        </p>
                    </form>
                    <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
                </div>
            </div>
        </div>
    );
}