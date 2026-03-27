'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';

async function gql<T = any>(query: string, variables?: any): Promise<T | null> {
    try {
        const res = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });
        const data = await res.json();
        if (data.errors) { console.error('GQL:', data.errors); return null; }
        return data.data
    } catch (e) { console.error(e); return null; }
}

// Schema-ya görə DÜZGÜN field adları:
// ProductFilter: categoryId(ID), searchQuery, onSaleOnly, minPrice, maxPrice, inStockOnly, minRating
// ProductPage:   content, totalElements, totalPages, currentPage, hasNext
const PRODUCTS_QUERY = `
  query GetProducts($page: Int, $size: Int, $filter: ProductFilter) {
    products(page: $page, size: $size, filter: $filter) {
      content {
        id name basePrice effectivePrice isOnSale discountPercentage rating reviewCount
        category { id name slug }
        images { url isPrimary }
      }
      totalElements
      totalPages
      currentPage
      hasNext
    }
  }
`;

// categoryId: ID! — schema-da ID tipidir
const CATEGORIES_QUERY = `query { categories { id name slug } }`;

function addToCart(product: any) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const img = product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url;
    const existing = cart.find((c: any) => c.id === product.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.effectivePrice, image: img, quantity: 1, color: '' });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);
    const img = product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url;

    function handleAdd(e: React.MouseEvent) {
        e.preventDefault();
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    return (
        <div
            style={{ border: '1px solid #f0f0f0', borderRadius: 16, overflow: 'hidden', background: '#fff', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.08)' : 'none' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ height: 200, background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
                    {img ? <Image src={img} alt={product.name} fill style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, color: '#e5e5e5' }}>📦</div>}
                    {(product.discountPercentage ?? 0) > 0 && <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', background: '#0a0a0a', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 5 }}>−{product.discountPercentage}%</span>}
                </div>
                <div style={{ padding: '14px 16px 52px' }}>
                    <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{product.category?.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', marginBottom: 8, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, minHeight: 38 }}>{product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 11, color: s <= Math.round(product.rating || 0) ? '#fbbf24' : '#e5e5e5' }}>★</span>)}
                        {(product.reviewCount || 0) > 0 && <span style={{ fontSize: 11, color: '#a3a3a3', marginLeft: 2 }}>({product.reviewCount})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.8, color: '#0a0a0a' }}>₼{product.effectivePrice?.toLocaleString()}</span>
                        {product.isOnSale && product.basePrice !== product.effectivePrice && <span style={{ fontSize: 13, color: '#d4d4d4', textDecoration: 'line-through' }}>₼{product.basePrice?.toLocaleString()}</span>}
                    </div>
                </div>
            </Link>
            <button onClick={handleAdd}
                    style={{ position: 'absolute', bottom: 14, left: 16, right: 16, padding: '9px', borderRadius: 9, border: 'none', background: added ? '#16a34a' : '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(4px)' }}>
                {added ? '✓ Əlavə edildi' : '+ Səbətə əlavə et'}
            </button>
        </div>
    );
}

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

// ─── Inner (uses useSearchParams) ─────────────────────────────────────────────
function ProductsInner() {
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
    // categoryId schema-da ID tipidir — string olaraq göndərmək kifayətdir,
    // amma GraphQL variable type-ı ID olmalıdır (aşağıda düzəldilib)
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
    const [onSaleOnly, setOnSaleOnly] = useState(searchParams.get('onSaleOnly') === 'true');
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        gql(CATEGORIES_QUERY).then(d => setCategories(d?.categories || []));
    }, []);

    const loadProducts = useCallback(async () => {
        setLoading(true);

        // Schema-ya görə DÜZGÜN filter field adları
        const filter: Record<string, any> = {};
        if (selectedCategory) filter.categoryId = selectedCategory;   // ID type — string değər göndər
        if (debouncedSearch) filter.searchQuery = debouncedSearch;     // searchQuery (search deyil!)
        if (onSaleOnly) filter.onSaleOnly = true;                      // onSaleOnly (isOnSale deyil!)
        if (minPrice > 0) filter.minPrice = minPrice;
        if (maxPrice < 5000) filter.maxPrice = maxPrice;

        const d = await gql(PRODUCTS_QUERY, {
            page,
            size: 12,
            filter: Object.keys(filter).length ? filter : undefined,
        });

        if (d?.products) {
            setProducts(d.products.content || []);
            setTotalPages(d.products.totalPages || 0);
            setTotalElements(d.products.totalElements || 0);
        }
        setLoading(false);
    }, [selectedCategory, debouncedSearch, onSaleOnly, minPrice, maxPrice, page]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const hasFilters = !!(selectedCategory || search || onSaleOnly || minPrice > 0 || maxPrice < 5000);

    function clearFilters() {
        setSearch(''); setSelectedCategory(''); setOnSaleOnly(false);
        setMinPrice(0); setMaxPrice(5000); setPage(0);
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <Navbar />

            <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>

                {/* ── Sidebar ── */}
                <div style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, overflow: 'hidden', transition: 'all 0.25s', paddingTop: 28, paddingRight: sidebarOpen ? 24 : 0 }}>
                    <div style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: sidebarOpen ? 'auto' : 'none' }}>

                        {/* Categories */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Kateqoriya</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button onClick={() => { setSelectedCategory(''); setPage(0); }}
                                        style={{ padding: '8px 12px', borderRadius: 8, border: 'none', textAlign: 'left', background: !selectedCategory ? '#f5f3ff' : 'transparent', color: !selectedCategory ? '#6366f1' : '#525252', fontSize: 13.5, fontWeight: !selectedCategory ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                    Bütün kateqoriyalar
                                </button>
                                {categories.map((cat: any) => (
                                    <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
                                            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', textAlign: 'left', background: selectedCategory === cat.id ? '#f5f3ff' : 'transparent', color: selectedCategory === cat.id ? '#6366f1' : '#525252', fontSize: 13.5, fontWeight: selectedCategory === cat.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Qiymət (₼)</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, color: '#525252', fontWeight: 500 }}>₼{minPrice}</span>
                                <span style={{ fontSize: 13, color: '#525252', fontWeight: 500 }}>₼{maxPrice === 5000 ? '5000+' : maxPrice}</span>
                            </div>
                            <input type="range" min={0} max={5000} step={10} value={minPrice}
                                   onChange={e => { setMinPrice(Math.min(+e.target.value, maxPrice - 10)); setPage(0); }}
                                   style={{ width: '100%', accentColor: '#6366f1', marginBottom: 8 }} />
                            <input type="range" min={0} max={5000} step={10} value={maxPrice}
                                   onChange={e => { setMaxPrice(Math.max(+e.target.value, minPrice + 10)); setPage(0); }}
                                   style={{ width: '100%', accentColor: '#6366f1' }} />
                        </div>

                        {/* On Sale */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Endirim</div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <div onClick={() => { setOnSaleOnly(!onSaleOnly); setPage(0); }}
                                     style={{ width: 38, height: 22, borderRadius: 11, background: onSaleOnly ? '#6366f1' : '#e5e5e5', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', top: 2, left: onSaleOnly ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                </div>
                                <span style={{ fontSize: 13.5, color: '#525252' }}>Yalnız endirimli</span>
                            </label>
                        </div>

                        {hasFilters && (
                            <button onClick={clearFilters}
                                    style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Filterləri sıfırla
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Main content ── */}
                <div style={{ flex: 1, paddingTop: 28, paddingBottom: 80 }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={() => setSidebarOpen(!sidebarOpen)}
                                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#525252', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                                {sidebarOpen ? 'Filtri gizlət' : 'Filter'}
                            </button>
                            {!loading && (
                                <span style={{ fontSize: 14, color: '#737373' }}>
                  <strong style={{ color: '#0a0a0a' }}>{totalElements.toLocaleString()}</strong> məhsul tapıldı
                </span>
                            )}
                        </div>
                    </div>

                    {/* Active filter chips */}
                    {hasFilters && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                            {selectedCategory && (
                                <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #e0dcff', color: '#6366f1', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {categories.find(c => c.id === selectedCategory)?.name}
                                    <button onClick={() => { setSelectedCategory(''); setPage(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
                            )}
                            {search && (
                                <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #e0dcff', color: '#6366f1', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  "{search}"
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
                            )}
                            {onSaleOnly && (
                                <span style={{ padding: '4px 12px', borderRadius: 20, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Endirimli
                  <button onClick={() => setOnSaleOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
                            )}
                        </div>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {Array(12).fill(0).map((_, i) => <Skeleton key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>Məhsul tapılmadı</div>
                            <div style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 24 }}>Axtarış şərtlərini dəyişdirin</div>
                            {hasFilters && <button onClick={clearFilters} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Filterləri sıfırla</button>}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {products.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40 }}>
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #f0f0f0', background: '#fff', fontSize: 13.5, cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? '#d4d4d4' : '#525252', fontFamily: 'inherit' }}>← Əvvəlki</button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const n = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
                                return (
                                    <button key={n} onClick={() => setPage(n)}
                                            style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${page === n ? '#6366f1' : '#f0f0f0'}`, background: page === n ? '#6366f1' : '#fff', color: page === n ? '#fff' : '#525252', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        {n + 1}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                    style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #f0f0f0', background: '#fff', fontSize: 13.5, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? '#d4d4d4' : '#525252', fontFamily: 'inherit' }}>Növbəti →</button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
            <ProductsInner />
        </Suspense>
    );
}