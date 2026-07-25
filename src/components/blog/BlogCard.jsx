import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BlogCard Component
 * Derived directly from Molvbriv Product Cards (AllProductsPage & HomePage).
 * Inherits exact typography, aspect ratio, hover animations, glassmorphic action overlays, and badges.
 */
export default function BlogCard({ blog }) {
  if (!blog) return null;

  const formattedDate = new Date(blog.published_at || blog.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="group cursor-pointer flex flex-col">
      {/* Image Container matching Product Card aspect-[3/4] & scale-110 hover effect */}
      <div className="relative overflow-hidden mb-5 bg-surface-container-low aspect-[3/4] rounded-sm">
        <Link to={`/blog/${blog.slug}`} className="block w-full h-full">
          {blog.featured_image ? (
            <img
              src={blog.featured_image}
              alt={blog.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-highest text-primary/40 font-manrope font-semibold text-xs tracking-widest uppercase">
              Molvbriv Journal
            </div>
          )}
        </Link>

        {/* Category Badge matching Product Card Tag badge */}
        {blog.category_name && (
          <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black font-bold font-manrope">
            {blog.category_name}
          </div>
        )}

        {/* Glassmorphic Slide-Up Hover Overlay matching Product Card Quick Shop */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
          <Link
            to={`/blog/${blog.slug}`}
            className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest hover:bg-secondary transition-colors font-bold text-center block"
          >
            Read Story
          </Link>
        </div>
      </div>

      {/* Meta Header */}
      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1.5 font-manrope">
        <span>{formattedDate}</span>
        <span>•</span>
        <span className="text-secondary">{blog.reading_time_min || 3} min read</span>
      </div>

      {/* Title matching Product Card title */}
      <h3 className="text-primary font-body font-semibold text-base md:text-lg mb-2 leading-snug group-hover:text-secondary transition-colors line-clamp-2">
        <Link to={`/blog/${blog.slug}`}>
          {blog.title}
        </Link>
      </h3>

      {/* Excerpt */}
      <p className="text-on-surface-variant font-body text-xs md:text-sm leading-relaxed line-clamp-2 mb-4">
        {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>/g, '').slice(0, 120) + '...' : '')}
      </p>

      {/* Footer Author & Read Link */}
      <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between">
        <span className="text-[11px] font-manrope text-primary/80 font-medium">
          {blog.author_name || 'Molvbriv Editorial'}
        </span>

        <Link
          to={`/blog/${blog.slug}`}
          className="inline-block border-b border-secondary pb-0.5 text-secondary tracking-widest uppercase text-[10px] font-bold hover:tracking-[0.2em] transition-all"
        >
          Read Article &rarr;
        </Link>
      </div>
    </article>
  );
}
