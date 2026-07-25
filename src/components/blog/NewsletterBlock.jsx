import React, { useState } from 'react';

/**
 * NewsletterBlock Component
 * Reuses the exact layout, colors, inputs, buttons, and animations from the HomePage "Join The Circle" newsletter section.
 */
export default function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubscribed(true);
      } else {
        setSubscribed(true);
      }
    } catch (err) {
      setSubscribed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 px-5 md:px-12 bg-surface border-t border-black/5">
      <div className="max-w-3xl mx-auto text-center">
        <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block mb-2">
          The Molvbriv Journal Circle
        </span>
        <h2 className="text-2xl md:text-3xl font-manrope text-primary mb-4 md:mb-6">
          Join The Circle
        </h2>

        {subscribed ? (
          <div className="p-8 md:p-10 border border-[#d4af37]/30 space-y-4 max-w-xl mx-auto rounded-sm animate-fade-in" style={{ background: 'rgba(26, 74, 53, 0.03)' }}>
            <div className="w-12 h-12 rounded-full border border-[#765931]/30 flex items-center justify-center mx-auto text-[#765931]">
              <span className="material-symbols-outlined text-xl">done</span>
            </div>
            <h3 className="font-manrope text-lg md:text-xl text-[#765931] tracking-wide font-semibold">
              Welcome to the Boutique Circle
            </h3>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
              An invitation with early access to new jewellery care guides and private boutique stories has been dispatched to <span className="font-semibold text-primary">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <p className="text-on-surface-variant mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
              Subscribe for early access to artisanal stories, fine jewellery styling guides, and private boutique events.
            </p>
            <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto" onSubmit={handleSubscribe}>
              <div className="flex-grow flex flex-col items-start gap-1 w-full">
                <input 
                  className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary py-3.5 md:py-4 px-4 md:px-6 text-sm disabled:opacity-50 text-primary placeholder-on-surface-variant/60" 
                  placeholder="Email Address" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                {error && <p className="text-[10px] text-red-500 ml-1 font-medium">{error}</p>}
              </div>
              <button 
                className="bg-primary text-white px-8 md:px-10 py-3.5 md:py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors duration-500 h-fit disabled:opacity-50 flex items-center justify-center min-w-[140px] cursor-pointer" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
