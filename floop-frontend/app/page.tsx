'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/navbar';

// ─── GQL helper ───────────────────────────────────────────────────────────────
async function gql<T = any>(query: string, variables?: any): Promise<T | null> {
    try {
        const res = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });
        const data = await res.json();
        if (data.errors) { console.error('GQL errors:', data.errors); return null; }
        return data.data;
    } catch (e) { console.error('GQL fetch error:', e); return null; }
}

const PRODUCT_FIELDS = `
  id name basePrice effectivePrice isOnSale discountPercentage rating reviewCount salesCount
  category { id name slug }
  images { url isPrimary }
`;

// Schema-ya görə: popularProducts(categoryId: ID, limit: Int)
// flashSaleProducts qaytarır: [Product!]!
const HOME_QUERY = `
  query HomeData {
    popularProducts(limit: 8) { ${PRODUCT_FIELDS} }
    trendingProducts(limit: 8) { ${PRODUCT_FIELDS} }
    flashSaleProducts { ${PRODUCT_FIELDS} }
    categories { id name slug }
  }
`;

// ─── Cart ─────────────────────────────────────────────────────────────────────
function addToCart(product: any) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const img = product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url || null;
    const key = product.id;
    const existing = cart.find((c: any) => c.id === key);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.effectivePrice,
            image: img,
            quantity: 1,
            color: '',
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

function getPrimaryImage(images: any[]): string | null {
    if (!images?.length) return null;
    return images.find(i => i.isPrimary)?.url || images[0]?.url || null;
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);
    const img = getPrimaryImage(product.images);

    function handleAdd(e: React.MouseEvent) {
        e.preventDefault();
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    return (
        <div
            style={{
                border: '1px solid #f0f0f0', borderRadius: 16,
                overflow: 'hidden', background: '#fff',
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                transform: hovered ? 'translateY(-4px)' : 'none',
                boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.08)' : 'none',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                {/* Image */}
                <div style={{ height: 200, background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
                    {img ? (
                        <Image src={img} alt={product.name} fill
                               style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, color: '#e5e5e5' }}>📦</div>
                    )}
                    {(product.discountPercentage ?? 0) > 0 && (
                        <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', background: '#0a0a0a', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 5, letterSpacing: 0.2 }}>
              −{product.discountPercentage}%
            </span>
                    )}
                    {product.isOnSale && (product.discountPercentage ?? 0) === 0 && (
                        <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4 }}>
              Sale
            </span>
                    )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px 52px' }}>
                    <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                        {product.category?.name}
                    </div>
                    <div style={{
                        fontSize: 14, fontWeight: 600, color: '#0a0a0a', marginBottom: 8, lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, minHeight: 38,
                    }}>
                        {product.name}
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} style={{ fontSize: 11, color: s <= Math.round(product.rating || 0) ? '#fbbf24' : '#e5e5e5' }}>★</span>
                        ))}
                        {(product.reviewCount || 0) > 0 && (
                            <span style={{ fontSize: 11.5, color: '#a3a3a3', marginLeft: 2 }}>({product.reviewCount})</span>
                        )}
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>
              ₼{product.effectivePrice?.toLocaleString()}
            </span>
                        {product.isOnSale && product.basePrice && product.basePrice !== product.effectivePrice && (
                            <span style={{ fontSize: 13, color: '#d4d4d4', textDecoration: 'line-through' }}>
                ₼{product.basePrice?.toLocaleString()}
              </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Add button — appears on hover */}
            <button
                onClick={handleAdd}
                style={{
                    position: 'absolute', bottom: 14, left: 16, right: 16,
                    padding: '9px', borderRadius: 9, border: 'none',
                    background: added ? '#16a34a' : '#0a0a0a',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                }}
            >
                {added ? '✓ Əlavə edildi' : '+ Səbətə əlavə et'}
            </button>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ height: 200, background: 'linear-gradient(90deg,#f5f5f5 25%,#ececec 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ padding: 16 }}>
                <div style={{ height: 10, background: '#f5f5f5', borderRadius: 4, width: '35%', marginBottom: 10 }} />
                <div style={{ height: 14, background: '#f5f5f5', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 14, background: '#f5f5f5', borderRadius: 4, width: '65%', marginBottom: 14 }} />
                <div style={{ height: 20, background: '#f5f5f5', borderRadius: 4, width: '40%' }} />
            </div>
        </div>
    );
}

// ─── Flash Sale Card ──────────────────────────────────────────────────────────
function FlashCard({ product }: { product: any }) {
    const [added, setAdded] = useState(false);
    const img = getPrimaryImage(product.images);

    return (
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', overflow: 'hidden', transition: 'all 0.2s' }}
                 onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
                 onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
                <div style={{ width: 96, minHeight: 96, background: '#1a1a1a', position: 'relative', flexShrink: 0 }}>
                    {img ? <Image src={img} alt={product.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.3 }}>📦</div>}
                </div>
                <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', marginBottom: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>₼{product.effectivePrice?.toLocaleString()}</span>
                        {product.basePrice && product.basePrice !== product.effectivePrice && <span style={{ fontSize: 12, color: '#a3a3a3', textDecoration: 'line-through' }}>₼{product.basePrice?.toLocaleString()}</span>}
                    </div>
                    {(product.discountPercentage ?? 0) > 0 && <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 7px', borderRadius: 4, background: 'rgba(220,38,38,0.12)', fontSize: 11, fontWeight: 700, color: '#dc2626' }}>-{product.discountPercentage}%</span>}
                </div>
            </div>
        </Link>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a', marginBottom: subtitle ? 4 : 0 }}>{title}</h2>
                {subtitle && <p style={{ fontSize: 13.5, color: '#737373', margin: 0 }}>{subtitle}</p>}
            </div>
            <Link href={href} style={{ fontSize: 13.5, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                Hamısına bax →
            </Link>
        </div>
    );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
    const [data, setData] = useState<any>({
        popularProducts: [],
        trendingProducts: [],
        flashSaleProducts: [],
        categories: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        gql(HOME_QUERY).then(d => {
            if (d) setData(d);
            setLoading(false);
        });
    }, []);

    const Grid = ({ products }: { products: any[] }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {loading
                ? Array(8).fill(0).map((_, i) => <Skeleton key={i} />)
                : products.map(p => <ProductCard key={p.id} product={p} />)
            }
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <Navbar />

            {/* ── Hero ──────────────────────────────────────────────────────────── */}
            <div style={{ background: '#0a0a0a', padding: '72px 40px 80px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 560, height: 560, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-25%', left: '-5%', width: 440, height: 440, background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
                    {/* Badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12.5, fontWeight: 500, color: '#a5b4fc', marginBottom: 28 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
                        Azərbaycanın ən böyük marketplace-i
                    </div>

                    <h1 style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3.5, lineHeight: 1.02, color: '#fff', marginBottom: 20, maxWidth: 640 }}>
                        Hər şeyi<br />
                        <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bir yerdə tap.
            </span>
                    </h1>

                    <p style={{ fontSize: 17, color: '#737373', lineHeight: 1.6, maxWidth: 480, marginBottom: 36 }}>
                        Minlərlə məhsul, yüzlərlə vendor. Sürətli çatdırılma, güvənli ödəniş.
                    </p>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Link href="/products" style={{ padding: '13px 28px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 14.5, fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(99,102,241,0.4)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)'; }}
                        >
                            Alış-verişə başla →
                        </Link>
                        <Link href="/vendor/apply" style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: '#a3a3a3', fontSize: 14.5, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#a3a3a3'; }}
                        >
                            🏪 Vendor ol
                        </Link>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 40, marginTop: 52, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {[{ v: '50K+', l: 'Məhsul' }, { v: '1K+', l: 'Vendor' }, { v: '100K+', l: 'Müştəri' }, { v: '24h', l: 'Çatdırılma' }].map(s => (
                            <div key={s.l}>
                                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, color: '#fff' }}>{s.v}</div>
                                <div style={{ fontSize: 12.5, color: '#525252', marginTop: 2 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 40px' }}>

                {/* ── Categories ────────────────────────────────────────────────── */}
                {data.categories.length > 0 && (
                    <div style={{ marginTop: 52, marginBottom: 52 }}>
                        <SectionHeader title="Kateqoriyalar" href="/products" />
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {data.categories.map((cat: any) => (
                                <Link key={cat.id} href={`/products?categoryId=${cat.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ padding: '9px 18px', borderRadius: 50, border: '1px solid #f0f0f0', background: '#fff', fontSize: 13.5, fontWeight: 500, color: '#525252', cursor: 'pointer', transition: 'all 0.15s' }}
                                         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                                         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; (e.currentTarget as HTMLElement).style.color = '#525252'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                                    >
                                        {cat.name}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Flash Sale ────────────────────────────────────────────────── */}
                {data.flashSaleProducts.length > 0 && (
                    <div style={{ marginBottom: 56 }}>
                        <div style={{ background: '#0a0a0a', borderRadius: 20, padding: '28px 28px 24px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-30%', right: '20%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ padding: '5px 12px', borderRadius: 7, background: '#dc2626', fontSize: 12.5, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>⚡ FLASH SALE</span>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.6, color: '#fff' }}>Məhdud vaxt endirimi</div>
                                        <div style={{ fontSize: 12.5, color: '#525252', marginTop: 1 }}>Tükənməmişdən əvvəl tələsin</div>
                                    </div>
                                </div>
                                <Link href="/products?onSaleOnly=true" style={{ fontSize: 13, color: '#a3a3a3', textDecoration: 'none', fontWeight: 500 }}>Hamısı →</Link>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, position: 'relative' }}>
                                {data.flashSaleProducts.slice(0, 6).map((p: any) => <FlashCard key={p.id} product={p} />)}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Popular Products ───────────────────────────────────────────── */}
                <div style={{ marginBottom: 56 }}>
                    <SectionHeader title="Populyar Məhsullar" subtitle="Ən çox satılan məhsullar" href="/products?sort=popular" />
                    <Grid products={data.popularProducts} />
                </div>

                {/* ── Vendor Banner ─────────────────────────────────────────────── */}
                <div style={{ marginBottom: 56, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: 20, padding: '36px 40px', border: '1px solid #e0dcff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '15%', top: '-20%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🏪 Vendor Proqramı</div>
                        <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a', marginBottom: 8 }}>Öz mağazanı aç</h3>
                        <p style={{ fontSize: 14, color: '#525252', maxWidth: 380, lineHeight: 1.6, margin: 0 }}>100,000+ müştəriyə çatın. Pulsuz qeydiyyat, asan idarəetmə, real-time analitika.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
                        {[{ v: 'Pulsuz', l: 'Qeydiyyat' }, { v: '1-2 gün', l: 'Təsdiq' }, { v: '%0', l: 'İlk ay' }].map(s => (
                            <div key={s.l} style={{ textAlign: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#6366f1', letterSpacing: -0.5 }}>{s.v}</div>
                                <div style={{ fontSize: 11.5, color: '#737373', marginTop: 2 }}>{s.l}</div>
                            </div>
                        ))}
                        <Link href="/vendor/apply" style={{ padding: '12px 22px', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(99,102,241,0.3)', marginLeft: 4 }}>
                            Başla →
                        </Link>
                    </div>
                </div>

                {/* ── Trending Products ─────────────────────────────────────────── */}
                <div style={{ marginBottom: 80 }}>
                    <SectionHeader title="Trend Məhsullar" subtitle="Bu həftə ən çox baxılan" href="/products?sort=trending" />
                    <Grid products={data.trendingProducts} />
                </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '40px', background: '#fafafa' }}>
                <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#0a0a0a' }}>floop<span style={{ color: '#6366f1' }}>.</span></span>
                    <div style={{ display: 'flex', gap: 24 }}>
                        {[{ l: 'Məhsullar', h: '/products' }, { l: 'Vendor ol', h: '/vendor/apply' }, { l: 'Sifarişlər', h: '/orders' }, { l: 'Profil', h: '/profile' }].map(link => (
                            <Link key={link.l} href={link.h} style={{ fontSize: 13.5, color: '#737373', textDecoration: 'none', fontWeight: 500 }}>{link.l}</Link>
                        ))}
                    </div>
                    <span style={{ fontSize: 13, color: '#a3a3a3' }}>© 2026 Floop</span>
                </div>
            </div>

            <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
      `}</style>
        </div>
    );
}