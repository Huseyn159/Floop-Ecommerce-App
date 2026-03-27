'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GOOGLE_CLIENT_ID = '481177776448-s0l9g1t365k4jk236ag2psq8flhbvdef.apps.googleusercontent.com';

declare global {
    interface Window {
        google: any;
    }
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);

    // Google credential callback — called when user picks an account
    const handleCredentialResponse = useCallback(async (response: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/oauth2/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message || 'Google ilə giriş uğursuz oldu');
                return;
            }

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken || '');
            localStorage.setItem('userRole', data.role || 'CUSTOMER');
            localStorage.setItem('userEmail', data.email || '');
            localStorage.setItem('firstName', data.firstName || '');

            if (data.role === 'VENDOR') window.location.href = '/vendor/dashboard';
            else if (data.role === 'ADMIN') window.location.href = '/admin';
            else window.location.href = '/';
        } catch {
            setError('Google ilə giriş zamanı xəta baş verdi');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize Google Identity Services
    const initGoogle = useCallback(() => {
        if (!window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        // Render Google's official button inside our container
        const container = document.getElementById('google-btn-container');
        if (container) {
            window.google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 380,
            });
        }

        setGoogleReady(true);
    }, [handleCredentialResponse]);

    // If script was already cached and loaded before useEffect
    useEffect(() => {
        if (window.google?.accounts?.id) {
            initGoogle();
        }
    }, [initGoogle]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message || 'Email və ya şifrə yanlışdır');
                return;
            }

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken || '');
            localStorage.setItem('userRole', data.role || 'CUSTOMER');
            localStorage.setItem('userEmail', data.email || '');
            localStorage.setItem('firstName', data.firstName || '');

            if (data.role === 'VENDOR') window.location.href = '/vendor/dashboard';
            else if (data.role === 'ADMIN') window.location.href = '/admin';
            else window.location.href = '/';
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

    return (
        <>
            {/* afterInteractive: loads after hydration, works in App Router */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={initGoogle}
            />

            <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* Sol panel */}
                <div style={{
                    background: '#0a0a0a', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', padding: 40, position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '20%', left: '10%', width: 400, height: 400,
                        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                        borderRadius: '50%', pointerEvents: 'none',
                    }} />

                    <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}>
              floop<span style={{ color: '#6366f1' }}>.</span>
            </span>
                    </Link>

                    <div>
                        <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
                            Xoş gəlmişsiniz<br />
                            <span style={{
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>yenidən.</span>
                        </div>
                        <p style={{ fontSize: 16, color: '#525252', lineHeight: 1.6, maxWidth: 340 }}>
                            Hesabınıza daxil olun və alış-verişə davam edin.
                        </p>
                    </div>

                    <div style={{ fontSize: 13, color: '#333' }}>© 2026 Floop</div>
                </div>

                {/* Sağ panel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#fff' }}>
                    <div style={{ width: '100%', maxWidth: 380 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.2, color: '#0a0a0a', marginBottom: 8 }}>
                            Giriş et
                        </h1>
                        <p style={{ fontSize: 14.5, color: '#737373', marginBottom: 36 }}>
                            Hesabınız yoxdur?{' '}
                            <Link href="/register" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>
                                Qeydiyyatdan keçin
                            </Link>
                        </p>

                        {/*
              Google renderButton-u bu div-ə render edir.
              Görünüş: Google-un öz stilindəki düymə.
              Script yüklənənə qədər fallback göstəririk.
            */}
                        <div style={{ marginBottom: 24 }}>
                            <div
                                id="google-btn-container"
                                style={{
                                    width: '100%',
                                    minHeight: 44,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    // Google öz iframe-ni render edir bura
                                }}
                            />
                            {/* Script hələ yüklənməyibsə placeholder göstər */}
                            {!googleReady && (
                                <div style={{
                                    width: '100%', padding: '11px 20px', borderRadius: 10,
                                    border: '1px solid #e5e5e5', background: '#fafafa',
                                    fontSize: 14, color: '#a3a3a3', textAlign: 'center',
                                    fontFamily: 'inherit',
                                }}>
                                    Google yüklənir...
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                            <span style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>və ya email ilə</span>
                            <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="siz@example.com"
                                    required
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}>Şifrə</label>
                                    <Link href="#" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                                        Unutmuşam
                                    </Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        style={{ ...inputStyle, paddingRight: 44 }}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3',
                                            fontSize: 16, display: 'flex', alignItems: 'center', padding: 4,
                                        }}
                                    >
                                        {showPassword ? (
                                            // Eye-off icon
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                                                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            // Eye icon
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 8, background: '#fef2f2',
                                    border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16,
                                }}>
                                    {error}
                                </div>
                            )}

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
                                        Giriş edilir...
                                    </>
                                ) : 'Daxil ol →'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}