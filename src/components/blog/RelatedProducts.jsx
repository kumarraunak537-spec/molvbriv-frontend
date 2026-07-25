import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';

/**
 * RelatedProducts Component
 * Displays shop products referenced inside or related to the blog article.
 */
export default function RelatedProducts({ productIds = [], categoryName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadRelatedProducts() {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*').eq('status', 'live');

        if (productIds && productIds.length > 0) {
          query = query.in('id', productIds);
        } else if (categoryName) {
          query = query.ilike('category', `%${categoryName}%`).limit(3);
        } else {
          query = query.order('created_at', { ascending: false }).limit(3);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setProducts(data);
        } else {
          // Fallback fetch if specific filter returned empty
          const { data: fallbackData } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'live')
            .limit(3);
          if (fallbackData) setProducts(fallbackData);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRelatedProducts();
  }, [productIds, categoryName]);

  if (loading || products.length === 0) return null;

  return (
    <section className="my-12 p-6 md:p-8 bg-surface-container-low/70 rounded-2xl border border-surface-variant/50">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-surface-variant/40">
        <div>
          <span className="text-xs font-headline font-semibold uppercase tracking-widest text-secondary">
            Featured In This Article
          </span>
          <h3 className="font-playfair text-2xl font-bold text-on-surface mt-1">
            Shop Related Jewellery
          </h3>
        </div>
        <Link
          to="/all-products"
          className="text-xs font-headline font-semibold text-secondary hover:text-tertiary flex items-center gap-1"
        >
          View Collection &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const imgUrl = Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400';

          return (
            <div
              key={product.id}
              className="bg-surface rounded-xl overflow-hidden border border-surface-variant/40 hover:border-secondary/50 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-surface-container">
                <img
                  src={imgUrl}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                />
              </Link>

              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-headline font-semibold text-sm text-on-surface line-clamp-1 mb-1">
                  <Link to={`/product/${product.id}`} className="hover:text-secondary transition-colors">
                    {product.title}
                  </Link>
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-headline font-bold text-sm text-primary">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                  {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                    <span className="text-xs text-on-surface-variant/60 line-through">
                      ₹{Number(product.compare_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 text-center py-2 px-3 rounded-lg border border-primary text-primary text-xs font-headline font-semibold hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="py-2 px-3 rounded-lg bg-secondary text-on-secondary text-xs font-headline font-semibold hover:bg-tertiary transition-colors flex items-center justify-center"
                    title="Add to Cart"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
