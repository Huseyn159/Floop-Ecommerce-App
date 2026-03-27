'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getCartCount(): number {
    if (typeof window === 'undefined') return 0;
    try { return JSON.parse(localStorage.getItem('cart') || '[]').reduce((s: number, i: any) => s + (i.quantity || 1), 0); }
    catch { return 0; }
}

export default function Navbar() {
    const router = useRouter();
    const [cartCount, setCartCount] = useState(0);
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCartCount(getCartCount());
        setFirstName(localStorage.getItem('firstName') || '');
        setEmail(localStorage.getItem('userEmail') || '');
        setRole(localStorage.getItem('userRole') || '');

        const onCart = () => setCartCount(getCartCount());
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('cartUpdated', onCart);
        window.addEventListener('scroll', onScroll);
        return () => {
            window.removeEventListener('cartUpdated', onCart);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleLogout() {
        localStorage.clear();
        setUserMenuOpen(false);
        window.location.href = '/';
    }

    const isLoggedIn = !!firstName || !!email;
    const initials = firstName ? firstName[0].toUpperCase() : email ? email[0].toUpperCase() : '?';

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 40px', height: 60,
            background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderBottom: '1px solid #f0f0f0',
            boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.04)' : 'none',
            transition: 'all 0.2s',
        }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>
          floop<span style={{ color: '#6366f1' }}>.</span>
        </span>
            </Link>

            {/* Search */}
            <form
                onSubmit={e => { e.preventDefault(); const v = (e.currentTarget.querySelector('input') as HTMLInputElement).value.trim(); if (v) router.push(`/products?q=${encodeURIComponent(v)}`); }}
                style={{ flex: 1, maxWidth: 440, margin: '0 32px', position: 'relative' }}
            >
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                    type="text"
                    placeholder="Məhsul axtar..."
                    style={{
                        width: '100%', padding: '9px 14px 9px 34px',
                        borderRadius: 9, border: '1px solid #f0f0f0',
                        fontSize: 13.5, fontFamily: 'inherit',
                        background: '#fafafa', outline: 'none', color: '#0a0a0a',
                        transition: 'all 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.07)'; }}
                    onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
                />
            </form>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* Role-based quick links */}
                {role === 'VENDOR' && (
                    <Link href="/vendor/dashboard" style={{
                        padding: '6px 12px', borderRadius: 7,
                        border: '1px solid #e0dcff', background: '#f5f3ff',
                        color: '#6366f1', fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                    }}>
                        Vendor Panel
                    </Link>
                )}
                {role === 'ADMIN' && (
                    <Link href="/admin" style={{
                        padding: '6px 12px', borderRadius: 7,
                        border: '1px solid #e0dcff', background: '#f5f3ff',
                        color: '#6366f1', fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                    }}>
                        Admin Panel
                    </Link>
                )}

                {/* Cart */}
                <Link href="/cart" style={{
                    position: 'relative',
                    padding: '7px 14px', borderRadius: 9,
                    border: '1px solid #f0f0f0', background: '#fff',
                    color: '#0a0a0a', fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0a0a0a'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Səbət
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6,
                            minWidth: 18, height: 18, padding: '0 4px',
                            borderRadius: 9, background: '#6366f1', color: '#fff',
                            fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #fff',
                        }}>
              {cartCount > 99 ? '99+' : cartCount}
            </span>
                    )}
                </Link>

                {/* User menu */}
                {isLoggedIn ? (
                    <div ref={userMenuRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setUserMenuOpen(o => !o)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '5px 10px 5px 5px', borderRadius: 30,
                                border: `1px solid ${userMenuOpen ? '#6366f1' : '#f0f0f0'}`,
                                background: userMenuOpen ? '#f5f3ff' : '#fff',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                        >
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}>
                                {initials}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firstName || email.split('@')[0]}
              </span>
                            <svg style={{ color: '#a3a3a3', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                width: 220, background: '#fff',
                                border: '1px solid #f0f0f0', borderRadius: 14,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                                overflow: 'hidden', zIndex: 400,
                                animation: 'dropIn 0.15s cubic-bezier(0.16,1,0.3,1)',
                            }}>
                                {/* User info header */}
                                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f5f5f5' }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0a', marginBottom: 2 }}>
                                        {firstName || 'İstifadəçi'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#a3a3a3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {email}
                                    </div>
                                    {role && (
                                        <span style={{
                                            display: 'inline-block', marginTop: 6,
                                            padding: '2px 8px', borderRadius: 4,
                                            background: role === 'ADMIN' ? '#fef3c7' : role === 'VENDOR' ? '#f0fdf4' : '#f5f3ff',
                                            color: role === 'ADMIN' ? '#d97706' : role === 'VENDOR' ? '#16a34a' : '#6366f1',
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                      {role === 'ADMIN' ? '⚙ Admin' : role === 'VENDOR' ? '🏪 Vendor' : '👤 Müştəri'}
                    </span>
                                    )}
                                </div>

                                {/* Menu items */}
                                <div style={{ padding: '6px 0' }}>
                                    {[
                                        { href: '/profile', label: '👤 Profil', show: true },
                                        { href: '/orders', label: '📦 Sifarişlərim', show: true },
                                        { href: '/vendor/dashboard', label: '🏪 Vendor Panel', show: role === 'VENDOR' },
                                        { href: '/vendor/apply', label: '🏪 Vendor ol', show: !role || role === 'CUSTOMER' },
                                        { href: '/admin', label: '⚙ Admin Panel', show: role === 'ADMIN' },
                                    ].filter(m => m.show).map(item => (
                                        <Link
                                            key={item.href} href={item.href}
                                            onClick={() => setUserMenuOpen(false)}
                                            style={{
                                                display: 'block', padding: '9px 16px',
                                                fontSize: 13.5, color: '#525252', textDecoration: 'none',
                                                fontWeight: 500, transition: 'all 0.1s',
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; (e.currentTarget as HTMLElement).style.color = '#0a0a0a'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#525252'; }}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px solid #f5f5f5', padding: '6px 0' }}>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: 'block', width: '100%', padding: '9px 16px',
                                            textAlign: 'left', fontSize: 13.5, color: '#ef4444',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        🚪 Çıxış
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                        <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 13, color: '#525252', textDecoration: 'none', fontWeight: 500, transition: 'border-color 0.15s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#0a0a0a'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'}
                        >Giriş et</Link>
                        <Link href="/register" style={{ padding: '7px 14px', borderRadius: 8, background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                            Qeydiyyat →
                        </Link>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </nav>
    );
}