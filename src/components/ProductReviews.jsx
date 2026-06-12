import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../supabaseClient';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalRatings: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [sort, setSort] = useState('newest');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [modalAnimate, setModalAnimate] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User auth state
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://molvbriv-frontend.onrender.com';

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser) {
        setCustomEmail(sessionUser.email || '');
        // Fetch profile name
        supabase
          .from('profiles')
          .select('name')
          .eq('id', sessionUser.id)
          .single()
          .then(({ data }) => {
            if (data?.name) setCustomName(data.name);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser) {
        setCustomEmail(sessionUser.email || '');
        supabase
          .from('profiles')
          .select('name')
          .eq('id', sessionUser.id)
          .single()
          .then(({ data }) => {
            if (data?.name) setCustomName(data.name);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle modal body scroll locking & animation triggers
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
      // Trigger scaling animation after a microtick
      const t = setTimeout(() => setModalAnimate(true), 50);
      return () => clearTimeout(t);
    } else {
      document.body.style.overflow = '';
      setModalAnimate(false);
    }
  }, [showForm]);

  // Fetch initial summary & reviews
  useEffect(() => {
    fetchSummary();
    fetchReviews(1, true);
  }, [productId, sort]);

  // Socket.io Real-time connection
  useEffect(() => {
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.emit('join_product_room', productId);

    socket.on('review_added', (data) => {
      if (data.productId === productId) {
        setReviews(prev => {
          // Prevent duplicates in real-time stream
          if (prev.some(r => r.id === data.review.id)) return prev;
          return [data.review, ...prev];
        });
        setSummary(data.summary);
      }
    });

    socket.on('review_updated', (data) => {
      if (data.productId === productId) {
        setReviews(prev => prev.map(r => r.id === data.review.id ? { ...r, ...data.review } : r));
        if (data.summary) setSummary(data.summary);
      }
    });

    socket.on('review_deleted', (data) => {
      if (data.productId === productId) {
        setReviews(prev => prev.filter(r => r.id !== data.reviewId));
        setSummary(data.summary);
      }
    });

    socket.on('review_moderated', (data) => {
      if (data.productId === productId) {
        if (data.status === 'approved') {
          fetchReviews(1, true);
        } else {
          setReviews(prev => prev.filter(r => r.id !== data.reviewId));
        }
        setSummary(data.summary);
      }
    });

    socket.on('review_likes_updated', (data) => {
      setReviews(prev => prev.map(r => r.id === data.reviewId ? { ...r, helpfulCount: data.helpfulCount } : r));
    });

    return () => {
      if (socket) {
        socket.emit('leave_product_room', productId);
        socket.disconnect();
      }
    };
  }, [productId]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/summary/product/${productId}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching rating summary:', err);
    }
  };

  const fetchReviews = async (pageNumber, replace = false) => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}?page=${pageNumber}&limit=5&sort=${sort}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        if (replace) {
          setReviews(data.reviews);
        } else {
          setReviews(prev => {
            // Prevent duplicates
            const existingIds = new Set(prev.map(r => r.id));
            const newReviews = data.reviews.filter(r => !existingIds.has(r.id));
            return [...prev, ...newReviews];
          });
        }
        setTotalPages(data.totalPages);
        setPage(pageNumber);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchReviews(page + 1);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    setErrorMsg('');

    for (let file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Each file must be under 10MB.');
        continue;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setErrorMsg('Only image and video attachments are supported.');
        continue;
      }
      validFiles.push(file);
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Please login to submit a review.');
        setIsSubmitting(false);
        return;
      }

      if (!customName.trim()) {
        setErrorMsg('Please enter your name.');
        setIsSubmitting(false);
        return;
      }

      // 1. Upload media to Supabase Storage
      const uploadedMedia = [];
      for (let file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `reviews/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(fileName, file);

        if (uploadError) throw new Error('Attachment upload failed: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(fileName);
        uploadedMedia.push({
          media_url: urlData.publicUrl,
          media_type: file.type.startsWith('video/') ? 'video' : 'image'
        });
      }

      // 2. Submit Review to Backend
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          media: uploadedMedia,
          customerName: customName.trim(),
          customerEmail: customEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSuccessMsg('Thank you! Your rating and review was submitted successfully.');
      setTitle('');
      setComment('');
      setMediaFiles([]);
      setRating(5);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Instantly refresh reviews list locally
      fetchReviews(1, true);
      fetchSummary();
      
      // Close modal after a brief delay
      setTimeout(() => {
        setShowForm(false);
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to upvote reviews.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r));
      }
    } catch (err) {
      console.error('Error toggling helpful status:', err);
    }
  };

  const handleReport = async (reviewId) => {
    const reason = prompt('Please specify the reason for reporting this review (spam, abuse, inappropriate, etc.):');
    if (reason === null) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to report reviews.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Review reported. Thank you for keeping our boutique safe.');
      }
    } catch (err) {
      console.error('Error reporting review:', err);
    }
  };

  return (
    <section className="mt-20 border-t border-surface-variant/20 pt-16 max-w-4xl mx-auto px-4">
      
      {/* Luxury Customer Reviews Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-manrope font-bold text-primary tracking-wide">
          Client Reviews
        </h2>
        <p className="text-xs md:text-sm font-manrope font-light text-on-surface-variant/60 uppercase tracking-[0.25em] mt-2.5">
          See what our clients have to say
        </p>
      </div>

      {/* Ratings Breakdown Grid Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-8 bg-surface-container-low/50 border border-surface-variant/10 rounded-2xl mb-12 shadow-sm">
        
        {/* Left Column: Average Ratings & Stars */}
        <div className="md:col-span-4 flex flex-col items-center text-center md:border-r border-surface-variant/20 md:pr-8 py-2">
          <div className="text-5xl font-manrope text-secondary font-bold leading-none">
            {summary.averageRating}
          </div>
          <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-semibold mt-1">out of 5 stars</span>
          <div className="flex gap-1 my-3 text-secondary">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`material-symbols-outlined text-lg ${star <= Math.round(summary.averageRating) ? 'fill-secondary text-secondary' : 'text-outline-variant/30'}`}>
                star
              </span>
            ))}
          </div>
          <div className="text-xs text-on-surface-variant/70 font-manrope font-medium">
            Based on {summary.totalRatings.toLocaleString()} verified ratings
          </div>
        </div>

        {/* Middle Column: Breakdown Bars */}
        <div className="md:col-span-5 w-full space-y-2 py-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const percentage = summary.breakdown[star] || 0;
            return (
              <div key={star} className="flex items-center gap-3.5 text-xs font-manrope">
                <span className="w-12 text-on-surface-variant text-right font-medium">{star} Star</span>
                <div className="flex-grow h-1 bg-surface-container-highest/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-10 text-on-surface-variant/80 text-left font-light">{percentage}%</span>
              </div>
            );
          })}
        </div>

        {/* Right Column: Write a Review Button */}
        <div className="md:col-span-3 flex justify-center py-2 md:pl-4">
          {user ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="group flex items-center justify-between gap-4 bg-primary text-on-primary pl-6 pr-4 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary hover:shadow-lg transition-all duration-300"
            >
              <span>Write a Review</span>
              <span className="w-6 h-6 rounded-full bg-on-primary/10 flex items-center justify-center group-hover:bg-on-primary/20 transition-colors">
                <span className="material-symbols-outlined text-[10px] text-on-primary fill-none">chevron_right</span>
              </span>
            </button>
          ) : (
            <div className="text-center p-4 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest">
              <p className="text-xs text-on-surface-variant/70 font-light mb-3">Login to share your thoughts.</p>
              <a href="/login" className="inline-block bg-secondary text-on-secondary px-5 py-2 text-[9px] uppercase tracking-widest font-bold hover:bg-primary transition-colors">
                Login / Register
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Sorting / Header Navigation */}
      <div className="flex justify-between items-center border-b border-surface-variant/15 pb-4 mb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
          Customer Feedback ({reviews.length})
        </span>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-transparent border-none text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-[0.1em] focus:ring-0 cursor-pointer py-0"
        >
          <option value="newest">Newest Reviews</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Review Feed Cards */}
      <div className="space-y-6">
        {reviews.map((rev) => {
          const firstLetter = (rev.customerName ? rev.customerName[0] : 'V').toUpperCase();
          const maskedEmail = rev.customerEmail ? (() => {
            const parts = rev.customerEmail.split('@');
            if (parts.length !== 2) return rev.customerEmail;
            const [local, domain] = parts;
            return local.length <= 3
              ? `${local[0]}***@${domain}`
              : `${local.substring(0, 3)}***@${domain}`;
          })() : null;

          return (
            <div key={rev.id} className={`p-6 md:p-8 bg-surface-container-lowest border rounded-2xl flex flex-col gap-4 shadow-sm relative transition-all duration-300 hover:shadow-md ${rev.isFeatured ? 'border-secondary/35 bg-secondary-container/5' : 'border-surface-variant/10'}`}>
              
              {/* Featured Badge */}
              {rev.isFeatured && (
                <span className="absolute -top-2.5 left-6 bg-secondary text-on-secondary text-[8px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full shadow-sm">
                  Featured Review
                </span>
              )}

              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-variant/10">
                <div className="flex items-center gap-3">
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-manrope font-semibold text-xs border border-secondary/15 shadow-inner shrink-0">
                    {firstLetter}
                  </div>
                  {/* Name and badge */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-manrope text-xs font-semibold text-primary">{rev.customerName || 'Verified Buyer'}</span>
                      {rev.isVerified && (
                        <span className="text-[7.5px] bg-[#1a4a35]/10 text-[#1a4a35] px-2 py-0.5 font-bold tracking-wider rounded-sm uppercase">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    {maskedEmail && (
                      <span className="text-[9.5px] text-on-surface-variant/50 font-mono mt-0.5">
                        {maskedEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating stars & Date */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-0.5 text-secondary">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`material-symbols-outlined text-xs ${s <= rev.rating ? 'fill-secondary text-secondary' : 'text-outline-variant/30'}`}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/40 font-manrope font-light uppercase tracking-wider">
                    {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                {rev.title && <h4 className="font-manrope text-sm font-semibold text-primary">{rev.title}</h4>}
                {rev.comment && (
                  <p className="text-xs md:text-sm text-on-surface-variant/80 font-manrope leading-relaxed font-light whitespace-pre-line">
                    {rev.comment}
                  </p>
                )}
              </div>

              {/* Media Carousel */}
              {rev.media && rev.media.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                  {rev.media.map((med, i) => (
                    <div key={i} className="flex-shrink-0 w-20 h-20 border border-surface-variant/20 rounded-lg overflow-hidden bg-black/5 group cursor-zoom-in relative">
                      {med.type === 'video' ? (
                        <video src={med.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={med.url} alt="review media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onClick={() => window.open(med.url)} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Likes & Report panel */}
              <div className="flex items-center justify-end border-t border-surface-variant/10 pt-3.5 text-[9px]">
                <div className="flex gap-5 items-center font-manrope">
                  <button
                    onClick={() => handleHelpful(rev.id)}
                    className="flex items-center gap-1.5 text-on-surface-variant/70 hover:text-secondary font-semibold tracking-wider uppercase active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-xs">thumb_up</span>
                    Helpful ({rev.helpfulCount || 0})
                  </button>
                  <button
                    onClick={() => handleReport(rev.id)}
                    className="text-on-surface-variant/40 hover:text-red-600 transition-colors uppercase tracking-wider font-light"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isLoadingReviews && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoadingReviews && reviews.length === 0 && (
          <p className="text-center text-xs text-on-surface-variant/50 italic py-10 font-manrope font-light">
            No reviews have been written for this piece yet.
          </p>
        )}

        {/* Load More Button */}
        {!isLoadingReviews && page < totalPages && (
          <button
            onClick={handleLoadMore}
            className="w-full border border-secondary/20 text-secondary py-3 text-[9px] uppercase tracking-widest font-bold hover:bg-secondary/5 hover:border-secondary transition-all rounded-sm font-manrope"
          >
            Load More Reviews
          </button>
        )}
      </div>

      {/* Write Review Modal Popup Overlay */}
      {showForm && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0d11]/80 backdrop-blur-md transition-opacity duration-300 ${modalAnimate ? 'opacity-100' : 'opacity-0'}`}>
          <div 
            className={`bg-surface max-w-xl w-full rounded-[28px] border border-outline-variant/15 shadow-[0_24px_60px_-15px_rgba(8,39,23,0.35),_0_0_1px_rgba(8,39,23,0.2)] overflow-hidden transform transition-all duration-300 relative flex flex-col max-h-[90vh] ${modalAnimate ? 'scale-100' : 'scale-95'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Inner scrollable area to prevent scrollbar from breaking corners */}
            <div className="overflow-y-auto p-6 md:p-8 flex-grow flex flex-col min-h-0 relative">
              
              {/* Close button */}
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-5 right-5 text-on-surface-variant/60 hover:text-primary transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

            {/* Modal Header */}
            <div className="text-center mb-6 border-b border-surface-variant/10 pb-4">
              <h3 className="font-manrope text-2xl font-bold text-primary">Share Your Thoughts</h3>
              <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-light mt-1">Review your jewelry purchase</p>
            </div>

            {errorMsg && <p className="text-xs text-red-500 font-semibold mb-4 bg-red-50/50 p-3 rounded-lg border border-red-100">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-[#1a4a35] font-semibold mb-4 bg-[#1a4a35]/5 p-3 rounded-lg border border-[#1a4a35]/10">{successMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Star Rating select box */}
              <div className="bg-surface-container-low/60 p-4 rounded-xl border border-surface-variant/5 text-center space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-outline font-bold">Rate your experience</label>
                <div className="flex gap-2.5 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <span className={`material-symbols-outlined text-3xl cursor-pointer transition-all ${star <= (hoverRating || rating) ? 'fill-secondary text-secondary scale-110' : 'text-outline-variant/30 hover:scale-105'}`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Headline input */}
              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-widest text-outline font-bold">Add a Headline</label>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary py-3 px-4 text-xs font-manrope rounded-lg transition-all"
                  placeholder="e.g. Exquisite craftsmanship, beautiful stones!"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Review Comment textarea */}
              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-widest text-outline font-bold">Write a Review</label>
                <textarea
                  rows="4"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary py-3 px-4 text-xs font-manrope rounded-lg transition-all"
                  placeholder="Share details of your experience with the jewelry piece..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                ></textarea>
              </div>

              {/* User Name & Email inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-widest text-outline font-bold">Your Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary py-3 px-4 text-xs font-manrope rounded-lg transition-all"
                    placeholder="e.g. Eleanor Vance"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-widest text-outline font-bold">Your Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-secondary focus:ring-1 focus:ring-secondary py-3 px-4 text-xs font-manrope rounded-lg transition-all opacity-80"
                    placeholder="e.g. eleanor@vance.com"
                    value={customEmail}
                    disabled={user !== null} // Disable for authenticated users to ensure security
                    onChange={e => setCustomEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Media upload area */}
              <div className="space-y-2">
                <label className="block text-[9px] uppercase tracking-widest text-outline font-bold">Add Media (Photos & Videos)</label>
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/20 rounded-xl w-full py-6 bg-surface-container-low hover:bg-surface-container-high hover:border-secondary/30 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary text-2xl mb-1.5">upload_file</span>
                    <span className="text-[10px] text-primary uppercase tracking-widest font-bold">Attach Files</span>
                    <span className="text-[8px] text-on-surface-variant/40 lowercase tracking-wider mt-0.5">Upload images and videos (max 10MB each)</span>
                  </button>

                  {/* Attachment previews */}
                  {mediaFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {mediaFiles.map((file, i) => (
                        <div key={i} className="relative w-14 h-14 border border-surface-variant/20 rounded-lg overflow-hidden bg-black/5 flex items-center justify-center shadow-sm">
                          {file.type.startsWith('video/') ? (
                            <span className="material-symbols-outlined text-on-surface-variant text-base">movie</span>
                          ) : (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="upload preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / Send button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full flex items-center justify-between gap-4 bg-primary text-on-primary pl-6 pr-4 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary disabled:opacity-55 transition-all duration-300 mt-2 shadow-lg"
              >
                <span>{isSubmitting ? 'Uploading & Sending...' : 'Send'}</span>
                <span className="w-6 h-6 rounded-full bg-on-primary/10 flex items-center justify-center group-hover:bg-on-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-[10px] text-on-primary fill-none">chevron_right</span>
                </span>
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
