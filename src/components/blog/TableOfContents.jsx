import React, { useState, useEffect } from 'react';
import { extractHeadings } from '../../utils/blogUtils';

/**
 * TableOfContents Component
 * Renders interactive sticky table of contents outline with active heading highlighting during page scroll.
 */
export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (content) {
      const extracted = extractHeadings(content);
      setHeadings(extracted);
      if (extracted.length > 0) {
        setActiveId(extracted[0].id);
      }
    }
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter(Boolean);

      const scrollPosition = window.scrollY + 140;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop <= scrollPosition) {
          setActiveId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <nav className="bg-surface-container-low/80 backdrop-blur-xs p-5 rounded-xl border border-surface-variant/50 sticky top-28 mb-8">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-surface-variant/40">
        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
        </svg>
        <h4 className="font-headline text-xs uppercase tracking-widest font-bold text-on-surface">
          Table of Contents
        </h4>
      </div>

      <ul className="space-y-2 text-xs font-body max-h-[60vh] overflow-y-auto pr-1">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              style={{ paddingLeft: heading.level === 3 ? '1rem' : '0rem' }}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => scrollToHeading(e, heading.id)}
                className={`block transition-all duration-200 py-1 border-l-2 pl-2.5 ${
                  isActive
                    ? 'border-secondary font-semibold text-secondary transform translate-x-1'
                    : 'border-transparent text-on-surface-variant/70 hover:text-on-surface hover:border-surface-variant'
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
