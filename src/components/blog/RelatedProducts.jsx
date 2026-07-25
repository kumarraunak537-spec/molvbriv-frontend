import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useCart } from '../../context/CartContext';

/**
 * RelatedProducts Component
 * Derived directly from AllProductsPage product grid.
 */
export default function RelatedProducts({ productIds = [], categoryName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRelatedProducts() {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*').eq('status', 'live');

        if (productIds && productIds.length > 0) {
          query = query.in('id', productIds);
        } else if (categoryName) {
          query = query.ilike('category', `%${categoryName}%`).limit(4);
        } else {
          query = query.order('created_at', { ascending: false }).limit(4);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setProducts(data);
        } else {
          const { data: fallbackData } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'live')
            .limit(4);
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

  const handleQuickShop = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      description: product.description || '',
      image: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop',
    });
    navigate('/cart');
  };

  if (loading || products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-t border-black/5 bg-surface">
      <div className="max-w-7xl mx-auto px-5 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div>
            <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block mb-2">
              Featured In Story
            </span>
            <h2 className="text-2xl md:text-3xl font-manrope text-primary">
              Shop Related Pieces
            </h2>
          </div>
          <Link
            to="/all-products"
            className="inline-block border-b border-secondary pb-1 text-secondary tracking-widest uppercase text-xs hover:tracking-[0.2em] transition-all font-semibold"
          >
            Explore Catalogue &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => {
            const imgUrl = Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop';

            return (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                  <Link to={`/product/${product.id}`}>
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={product.title}
                      src={imgUrl}
                    />
                  </Link>
                  {product.tags && product.tags.length > 0 && (
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black font-bold font-manrope">
                      {product.tags[0]}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                    <button
                      onClick={(e) => handleQuickShop(e, product)}
                      className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest hover:bg-[#765931] transition-colors font-bold cursor-pointer"
                    >
                      Quick Shop
                    </button>
                  </div>
                </div>

                <Link to={`/product/${product.id}`} className="text-center block">
                  <h3 className="text-primary font-body font-semibold text-sm mb-1 group-hover:text-secondary transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-secondary font-manrope text-lg">
                      ₹{Number(product.price || 0).toLocaleString()}
                    </p>
                    {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                      <p className="text-on-surface-variant font-manrope text-sm line-through opacity-60">
                        ₹{Number(product.compare_price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
