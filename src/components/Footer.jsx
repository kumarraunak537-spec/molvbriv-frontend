import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer({ variant = 'default' }) {
  return (
    <footer className="bg-[#1F3D2B] border-t border-white/5 w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 px-6 md:px-16 py-12 md:py-20 w-full">
        <div className="col-span-1 md:col-span-1">
          <div className="text-lg md:text-3xl font-medium tracking-[0.15em] md:tracking-[0.25em] text-secondary font-serif uppercase mb-6" style={{ textRendering: 'optimizeLegibility' }}>MOLVBRIV</div>
        </div>
        <div className="space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Customer Care</h4>
          <ul className="space-y-4">
            <li><Link to="/blog" className="text-white/60 hover:text-white transition-colors text-sm font-manrope tracking-wide">Journal & Blog</Link></li>
            <li><Link to="/shipping-returns" className="text-white/60 hover:text-white transition-colors text-sm font-manrope tracking-wide">Shipping & Returns</Link></li>
            <li><Link to="/privacy-policy" className="text-white/60 hover:text-white transition-colors text-sm font-manrope tracking-wide">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="text-white/60 hover:text-white transition-colors text-sm font-manrope tracking-wide">Terms of Service</Link></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Contact Us</h4>
          <div className="flex flex-col gap-4">
            <a href="mailto:molvbriv@gmail.com" className="text-secondary hover:text-white transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">mail</span>
              <span className="text-white/60 hover:text-white text-sm font-manrope tracking-wide">molvbriv@gmail.com</span>
            </a>
            <a href="tel:8287203901" className="text-secondary hover:text-white transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">call</span>
              <span className="text-white/60 hover:text-white text-sm font-manrope tracking-wide">8287203901</span>
            </a>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Community</h4>
          <div className="flex gap-4">
            {/* Instagram */}
            <a href="https://www.instagram.com/molvbriv?igsh=eHRlbmF0cmowN3h1" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/share/1C8zsZoi5f/" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            {/* Snapchat */}
            <a href="https://www.snapchat.com/add/molvbriv" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.3 11.54C2.3 11 1 11.5 1 12c0 2 2.62 1.35 4.3 2.1a1 1 0 0 0 1 .73v1.86a2 2 0 0 1-1.34 1.88 1.5 1.5 0 0 0-.82.68c-.28.51 1 .82 1.88.94.34.05.65.23.83.52l.2.34c.16.27.42.45.71.5h8.48c.3-.05.55-.23.71-.5l.2-.34c.18-.29.49-.47.83-.52.88-.12 2.16-.43 1.88-.94a1.5 1.5 0 0 0-.82-.68A2 2 0 0 1 18 16.69v-1.86a1 1 0 0 0 1-.73c1.68-.75 4.3-.1 4.3-2.1 0-.5-1.3-1-3.3-.46-1.07-1.3-1.6-3.8-1.6-3.8A6.87 6.87 0 0 0 12 2a6.87 6.87 0 0 0-6.4 5.74S5.07 10.24 4.3 11.54Z"/></svg>
            </a>
            {/* YouTube */}
            <a href="https://youtube.com/@molvbriv?si=9-AEoYfXC9ScRSKw" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="px-6 md:px-16 py-6 md:py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest">© 2026 Molvbriv</p>
      </div>
    </footer>
  )
}
