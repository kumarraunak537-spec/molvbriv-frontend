import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BlogCard Component
 * Displays individual blog post items in editorial grid layout with image, category, reading time, author, date, and hover animations.
 */
export default function BlogCard({ blog }) {
  if (!blog) return null;

  const formattedDate = new Date(blog.published_at || blog.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-surface-variant/60 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      {/* Featured Image Container */}
      <Link to={`/blog/${blog.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-container-high">
        {blog.featured_image ? (
          <img
            src={blog.featured_image}
            alt={blog.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-container/10 text-primary/40 font-headline font-semibold">
            MOLVBRIV JOURNAL
          </div>
        )}
        {blog.category_name && (
          <span className="absolute top-3 left-3 bg-primary text-on-primary text-[11px] font-headline uppercase tracking-wider font-semibold px-3 py-1 rounded-full shadow-sm">
            {blog.category_name}
          </span>
        )}
      </Link>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <div className="flex items-center text-xs text-on-surface-variant/70 gap-3 mb-3 font-label">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {blog.reading_time_min || 3} min read
          </span>
        </div>

        <h3 className="font-playfair text-xl font-bold text-on-surface group-hover:text-secondary transition-colors duration-200 line-clamp-2 mb-2 leading-snug">
          <Link to={`/blog/${blog.slug}`}>
            {blog.title}
          </Link>
        </h3>

        <p className="font-body text-sm text-on-surface-variant/80 line-clamp-3 mb-6 flex-1 leading-relaxed">
          {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>/g, '').slice(0, 140) + '...' : '')}
        </p>

        {/* Footer Author Badge & Read More Link */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40 mt-auto">
          <div className="flex items-center gap-2.5">
            {blog.author_avatar ? (
              <img src={blog.author_avatar} alt={blog.author_name} className="w-7 h-7 rounded-full object-cover border border-surface-variant" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-secondary/20 text-secondary text-xs flex items-center justify-center font-bold">
                {(blog.author_name || 'M').charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-on-surface">{blog.author_name || 'Molvbriv Editorial'}</span>
          </div>

          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-xs font-headline font-semibold text-secondary group-hover:text-tertiary transition-colors gap-1"
          >
            Read Article
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
