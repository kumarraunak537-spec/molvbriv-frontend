import React, { useState, useEffect } from 'react';
import { extractHeadings } from '../../utils/blogUtils';

/**
 * TableOfContents Component
 * Derived directly from Molvbriv sidebar filter widgets.
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
    <nav className="bg-surface-container-low p-6 border border-black/5 sticky top-28 mb-8">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/5">
        <span className="material-symbols-outlined text-secondary text-sm">format_list_bulleted</span>
        <h4 className="font-manrope text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
          Table of Contents
        </h4>
      </div>

      <ul className="space-y-2.5 text-xs font-body max-h-[60vh] overflow-y-auto pr-1">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              style={{ paddingLeft: heading.level === 3 ? '0.75rem' : '0rem' }}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => scrollToHeading(e, heading.id)}
                className={`block transition-all duration-300 py-1 border-l-2 pl-3 ${
                  isActive
                    ? 'border-secondary font-bold text-secondary transform translate-x-1'
                    : 'border-transparent text-on-surface-variant hover:text-primary hover:border-black/20'
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
