import React, { useState } from 'react';

/**
 * SocialShareButtons Component
 * Inherits exact Molvbriv typography and luxury icon styling.
 */
export default function SocialShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Check out this article on Molvbriv Journal';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  return (
    <div className="flex items-center flex-wrap gap-3 py-4 border-y border-black/5 my-8">
      <span className="text-[10px] font-manrope font-bold uppercase tracking-[0.2em] text-primary mr-2">
        Share Story:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="w-9 h-9 rounded-full bg-surface-container-low text-primary hover:bg-secondary hover:text-white flex items-center justify-center transition-colors duration-300"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981z"/>
        </svg>
      </a>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="w-9 h-9 rounded-full bg-surface-container-low text-primary hover:bg-secondary hover:text-white flex items-center justify-center transition-colors duration-300"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="w-9 h-9 rounded-full bg-surface-container-low text-primary hover:bg-secondary hover:text-white flex items-center justify-center transition-colors duration-300"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.808V8z"/>
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="w-9 h-9 rounded-full bg-surface-container-low text-primary hover:bg-secondary hover:text-white flex items-center justify-center transition-colors duration-300"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
        </svg>
      </a>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="px-4 py-2 bg-surface-container-low text-primary text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-secondary hover:text-white transition-colors duration-300 ml-auto cursor-pointer flex items-center gap-1.5"
      >
        {copied ? (
          <>
            <span className="material-symbols-outlined text-sm">done</span>
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">link</span>
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
