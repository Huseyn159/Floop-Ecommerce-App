'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/navbar';

// ─── GQL — DÜZƏLTMƏ: bütün ID dəyişənləri ID! tipi ilə ────────────────────────
const PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id name description basePrice discountedPrice effectivePrice
      isOnSale discountPercentage rating reviewCount salesCount viewCount status
      category { id name slug }
      images { id url isPrimary sortOrder }
      variants { id size color material priceModifier stockQuantity sku }
    }
  }
`;

// categoryId: ID tipidir!
const RELATED_QUERY = `
  query Related($categoryId: ID, $limit: Int) {
    popularProducts(categoryId: $categoryId, limit: $limit) {
      id name effectivePrice basePrice discountPercentage isOnSale
      category { name }
      images { url isPrimary }
    }
  }
`;

async function gql<T = any>(query: string, variables?: any): Promise<T | null> {
    try {
        const res = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });
        const data = await res.json();
        if (data.errors) {
            console.error('GQL error:', data.errors[0]?.message);
            return null;
        }
        return data.data;
    } catch (e) { console.error(e); return null; }
}

function getPrimaryImage(images: any[]): string | null {
    if (!images?.length) return null;
    return images.find(i => i.isPrimary)?.url || images[0]?.url || null;
}

// ─── Cart — köhnə working logic ────────────────────────────────────────────────
function addToCart(product: any, quantity: number, variant?: any) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const key = `${product.id}-${variant?.id || 'default'}`;
    const existing = cart.find((c: any) => c.key === key);
    const price = variant
        ? (product.effectivePrice + (variant.priceModifier || 0))
        : product.effectivePrice;
    const img = getPrimaryImage(product.images);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            key,
            id: product.id,
            name: product.name,
            price,
            image: img,
            quantity,
            variantId: variant?.id,
            color: variant?.color || '',
            size: variant?.size || '',
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

export default function ProductDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [product, setProduct] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [wishlist, setWishlist] = useState(false);
    const [imgHovered, setImgHovered] = useState(false);

    useEffect(() => {
        if (!id) return;
        gql(PRODUCT_QUERY, { id }).then(d => {
            if (d?.product) {
                setProduct(d.product);
                // categoryId — ID tipinə uyğun olaraq string göndəririk
                gql(RELATED_QUERY, { categoryId: d.product.category?.id, limit: 4 }).then(r => {
                    setRelated((r?.popularProducts || []).filter((p: any) => p.id !== id));
                });
            }
            setLoading(false);
        });
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!product) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>😕</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0a0a0a' }}>Məhsul tapılmadı</div>
            <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Ana səhifəyə qayıt</Link>
        </div>
    );

    const images = product.images || [];
    const sortedImages = [...images].sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    const currentImg = sortedImages[selectedImg]?.url;
    const price = selectedVariant
        ? (product.effectivePrice + (selectedVariant.priceModifier || 0))
        : product.effectivePrice;
    const inStock = selectedVariant ? selectedVariant.stockQuantity > 0 : true;

    const colors = [...new Set(product.variants?.map((v: any) => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variants?.map((v: any) => v.size).filter(Boolean))];

    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'inherit' }}>
            <Navbar />

            {/* Breadcrumb */}
            <div style={{ padding: '14px 40px', display: 'flex', gap: 6, fontSize: 13, color: '#a3a3a3', maxWidth: 1100, margin: '0 auto' }}>
                <Link href="/" style={{ color: '#a3a3a3', textDecoration: 'none' }}>Ana səhifə</Link>
                <span>/</span>
                <Link href={`/products?categoryId=${product.category?.id}`} style={{ color: '#a3a3a3', textDecoration: 'none' }}>{product.category?.name}</Link>
                <span>/</span>
                <span style={{ color: '#0a0a0a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{product.name}</span>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, padding: '20px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>

                {/* ── Images ── */}
                <div>
                    <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 12, position: 'relative', height: 460, background: '#fafafa', cursor: 'zoom-in' }}
                         onMouseEnter={() => setImgHovered(true)}
                         onMouseLeave={() => setImgHovered(false)}
                    >
                        {currentImg ? (
                            <Image src={currentImg} alt={product.name} fill
                                   style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: imgHovered ? 'scale(1.05)' : 'scale(1)' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#e5e5e5' }}>📦</div>
                        )}
                        {product.discountPercentage && (
                            <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 10px', background: '#0a0a0a', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                                −{product.discountPercentage}%
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {sortedImages.length > 1 && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {sortedImages.map((img: any, i: number) => (
                                <button key={i} onClick={() => setSelectedImg(i)}
                                        style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', border: `2px solid ${selectedImg === i ? '#6366f1' : '#f0f0f0'}`, cursor: 'pointer', padding: 0, background: '#fafafa', transition: 'border-color 0.15s', position: 'relative', flexShrink: 0 }}>
                                    <Image src={img.url} alt="" fill style={{ objectFit: 'cover' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Info ── */}
                <div>
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                        {product.category?.name}
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.2, color: '#0a0a0a', marginBottom: 12, lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ color: s <= Math.round(product.rating || 0) ? '#fbbf24' : '#e5e5e5', fontSize: 15 }}>★</span>
                            ))}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{product.rating?.toFixed(1) || '0.0'}</span>
                        <span style={{ fontSize: 13, color: '#a3a3a3' }}>({(product.reviewCount || 0).toLocaleString()} rəy)</span>
                        {product.salesCount > 0 && <span style={{ fontSize: 13, color: '#a3a3a3' }}>· {product.salesCount.toLocaleString()} satış</span>}
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, color: '#0a0a0a' }}>
              ₼{price?.toLocaleString()}
            </span>
                        {product.isOnSale && product.basePrice && product.basePrice !== product.effectivePrice && (
                            <span style={{ fontSize: 18, color: '#d4d4d4', textDecoration: 'line-through' }}>₼{product.basePrice?.toLocaleString()}</span>
                        )}
                        {product.discountPercentage && (
                            <span style={{ padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, borderRadius: 5 }}>
                ₼{((product.basePrice || 0) - (product.effectivePrice || 0)).toFixed(2)} qənaət
              </span>
                        )}
                    </div>

                    {/* Colors */}
                    {colors.length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', marginBottom: 8 }}>
                                Rəng: <span style={{ fontWeight: 600 }}>{selectedVariant?.color || 'Seçin'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {colors.map((c: any) => (
                                    <button key={c} onClick={() => {
                                        const v = product.variants.find((v: any) => v.color === c);
                                        setSelectedVariant(selectedVariant?.color === c ? null : v);
                                    }}
                                            style={{ padding: '6px 16px', borderRadius: 8, border: `1.5px solid ${selectedVariant?.color === c ? '#6366f1' : '#e5e5e5'}`, background: selectedVariant?.color === c ? '#f5f3ff' : '#fff', color: selectedVariant?.color === c ? '#6366f1' : '#525252', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sizes */}
                    {sizes.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', marginBottom: 8 }}>
                                Ölçü: <span style={{ fontWeight: 600 }}>{selectedVariant?.size || 'Seçin'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {sizes.map((s: any) => {
                                    const v = product.variants.find((v: any) => v.size === s);
                                    const outOfStock = v?.stockQuantity === 0;
                                    return (
                                        <button key={s} disabled={outOfStock} onClick={() => setSelectedVariant(selectedVariant?.size === s ? null : v)}
                                                style={{ padding: '6px 16px', borderRadius: 8, border: `1.5px solid ${selectedVariant?.size === s ? '#6366f1' : '#e5e5e5'}`, background: outOfStock ? '#fafafa' : selectedVariant?.size === s ? '#f5f3ff' : '#fff', color: outOfStock ? '#d4d4d4' : selectedVariant?.size === s ? '#6366f1' : '#525252', fontSize: 13, fontWeight: 500, cursor: outOfStock ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textDecoration: outOfStock ? 'line-through' : 'none' }}>
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', marginBottom: 8 }}>Miqdar</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: 9, overflow: 'hidden' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        style={{ width: 38, height: 38, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#525252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ width: 44, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)}
                                        style={{ width: 38, height: 38, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#525252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                            {selectedVariant && (
                                <span style={{ fontSize: 13, color: selectedVariant.stockQuantity > 0 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                  {selectedVariant.stockQuantity > 0 ? `Stokda: ${selectedVariant.stockQuantity}` : 'Stokda yoxdur'}
                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                        <button
                            onClick={() => {
                                addToCart(product, quantity, selectedVariant);
                                setAdded(true);
                                setTimeout(() => setAdded(false), 2000);
                            }}
                            disabled={!inStock}
                            style={{
                                flex: 1, padding: 14, borderRadius: 12, border: 'none',
                                background: !inStock ? '#e5e5e5' : added ? '#16a34a' : '#0a0a0a',
                                color: '#fff', fontSize: 15, fontWeight: 600,
                                cursor: inStock ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {!inStock ? 'Stokda yoxdur' : added ? '✓ Əlavə edildi' : '🛒 Səbətə əlavə et'}
                        </button>
                        <button onClick={() => setWishlist(!wishlist)}
                                style={{ width: 52, height: 52, borderRadius: 12, border: `1.5px solid ${wishlist ? '#fecaca' : '#e5e5e5'}`, background: wishlist ? '#fef2f2' : '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            {wishlist ? '❤️' : '🤍'}
                        </button>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div style={{ padding: 20, background: '#fafafa', borderRadius: 14, marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', marginBottom: 10 }}>Məhsul haqqında</div>
                            <p style={{ fontSize: 14, color: '#525252', lineHeight: 1.7, margin: 0 }}>{product.description}</p>
                        </div>
                    )}

                    {/* Delivery info */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[{ icon: '🚀', text: 'Bakıda 24 saat çatdırılma' }, { icon: '↩', text: '14 gün pulsuz iade' }, { icon: '🔒', text: 'Güvənli ödəniş' }].map(d => (
                            <div key={d.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#737373' }}>
                                <span>{d.icon}</span> {d.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Related products */}
            {related.length > 0 && (
                <div style={{ padding: '0 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 48, marginBottom: 28 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>Oxşar məhsullar</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {related.slice(0, 4).map((p: any) => {
                            const img = p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url;
                            return (
                                <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', background: '#fff' }}
                                         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
                                         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ height: 160, position: 'relative', background: '#fafafa' }}>
                                            {img ? <Image src={img} alt={p.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#e5e5e5' }}>📦</div>}
                                            {p.discountPercentage && <span style={{ position: 'absolute', top: 8, right: 8, padding: '2px 7px', background: '#0a0a0a', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4 }}>−{p.discountPercentage}%</span>}
                                        </div>
                                        <div style={{ padding: 14 }}>
                                            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{p.category?.name}</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{p.name}</div>
                                            <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a' }}>₼{p.effectivePrice?.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}