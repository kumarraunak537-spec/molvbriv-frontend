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
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
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
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch initial summary & reviews
  useEffect(() => {
    fetchSummary();
    fetchReviews(1, true);
  }, [productId, sort]);

  // Socket.io Real-time connection
  useEffect(() => {
    // Connect to Socket.io backend
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.emit('join_product_room', productId);

    socket.on('review_added', (data) => {
      if (data.productId === productId) {
        setReviews(prev => [data.review, ...prev]);
        setSummary(data.summary);
      }
    });

    socket.on('review_updated', (data) => {
      if (data.productId === productId) {
        setReviews(prev => prev.map(r => r.id === data.review.id ? { ...r, ...data.review } : r));
        setSummary(data.summary);
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
          // If approved, fetch list again to insert
          fetchReviews(1, true);
        } else {
          // If hidden or rejected, filter out
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
      const data = await res.json();
      if (res.ok && data.success) {
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
      const data = await res.json();
      if (res.ok && data.success) {
        if (replace) {
          setReviews(data.reviews);
        } else {
          setReviews(prev => [...prev, ...data.reviews]);
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
        setErrorMsg('Files must be under 10MB.');
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
          title,
          comment,
          media: uploadedMedia
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSuccessMsg('Thank you! Your rating and review was submitted.');
      setTitle('');
      setComment('');
      setMediaFiles([]);
      setRating(5);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Instantly refresh reviews list locally
      fetchReviews(1, true);
      fetchSummary();
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
    if (reason === null) return; // cancelled
    
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
    <div className="mt-16 border-t border-surface-variant/20 pt-16 max-w-4xl mx-auto">
      <h2 className="text-xl md:text-2xl font-manrope text-primary mb-8 font-semibold tracking-wide">
        Ratings & Customer Reviews
      </h2>

      {/* Ratings Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl text-center">
          <div className="text-4xl md:text-5xl font-manrope text-secondary font-bold mb-2">
            {summary.averageRating} <span className="text-sm font-light text-on-surface-variant">/ 5</span>
          </div>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`material-symbols-outlined text-xl ${star <= Math.round(summary.averageRating) ? 'fill-secondary text-secondary' : 'text-outline-variant/40'}`}>
                star
              </span>
            ))}
          </div>
          <div className="text-xs text-on-surface-variant font-light">
            ({summary.totalRatings.toLocaleString()} verified ratings)
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="md:col-span-8 space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const percentage = summary.breakdown[star] || 0;
            return (
              <div key={star} className="flex items-center gap-4 text-xs">
                <span className="w-12 text-on-surface-variant text-right font-medium">{star} Star</span>
                <div className="flex-grow h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-1000 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-on-surface-variant font-light">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Form Section */}
      {user ? (
        <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-surface-container-low rounded-xl mb-12 border border-surface-variant/20 space-y-6">
          <h3 className="font-manrope text-base text-primary font-semibold tracking-wide">Write a Review</h3>
          
          {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-[#1a4a35] font-semibold">{successMsg}</p>}

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-outline font-bold">Select Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  <span className={`material-symbols-outlined text-3xl cursor-pointer ${star <= (hoverRating || rating) ? 'fill-secondary text-secondary' : 'text-outline-variant/40'}`}>
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wider text-outline font-bold">Review Title</label>
            <input
              type="text"
              className="w-full bg-surface border-none focus:ring-1 focus:ring-secondary py-3 px-4 text-sm"
              placeholder="Example: Exquisite craftsmanship, beautiful stones!"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wider text-outline font-bold">Review Details</label>
            <textarea
              rows="4"
              className="w-full bg-surface border-none focus:ring-1 focus:ring-secondary py-3 px-4 text-sm"
              placeholder="Share your experience with the jewelry piece..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            ></textarea>
          </div>

          {/* Media attachment uploads */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-outline font-bold">Add Photo or Video (Max 10MB)</label>
            <div className="flex flex-wrap gap-4 items-center">
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
                className="border border-secondary/30 text-secondary px-5 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-secondary/5 transition-all"
              >
                Attach Files
              </button>

              {mediaFiles.map((file, i) => (
                <div key={i} className="relative w-16 h-16 border rounded overflow-hidden bg-black/5 flex items-center justify-center">
                  {file.type.startsWith('video/') ? (
                    <span className="material-symbols-outlined text-on-surface-variant">movie</span>
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
                    className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white w-full py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors duration-300 disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading & Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <div className="p-6 bg-surface-container-low rounded-xl text-center mb-12 border border-surface-variant/20">
          <p className="text-sm text-on-surface-variant mb-3 font-light">Only verified buyers who are logged in can write reviews.</p>
          <a href="/login" className="text-secondary text-xs uppercase tracking-widest font-bold underline">Login / Register</a>
        </div>
      )}

      {/* Sorting Navigation */}
      <div className="flex justify-between items-center border-b border-surface-variant/20 pb-4 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Customer Feedback</span>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-transparent border-none text-xs text-on-surface-variant focus:ring-0 cursor-pointer"
        >
          <option value="newest">Newest Reviews</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Review Feed */}
      <div className="space-y-6">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-6 bg-surface-container-low rounded-xl border border-surface-variant/10 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`material-symbols-outlined text-sm ${s <= rev.rating ? 'fill-secondary text-secondary' : 'text-outline-variant/40'}`}>
                        star
                      </span>
                    ))}
                  </div>
                  {rev.isVerified && (
                    <span className="text-[10px] bg-secondary-container/20 text-[#1a4a35] px-2 py-0.5 font-bold tracking-wider rounded-sm uppercase">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <h4 className="font-manrope text-sm font-semibold text-primary">{rev.title || 'Rating Only'}</h4>
              </div>
              <span className="text-[10px] text-on-surface-variant/60 font-light">
                {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {rev.comment && (
              <p className="text-xs text-on-surface-variant font-inter leading-relaxed font-light">
                {rev.comment}
              </p>
            )}

            {/* Media Carousel */}
            {rev.media && rev.media.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {rev.media.map((med, i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-24 border rounded overflow-hidden bg-black/5">
                    {med.type === 'video' ? (
                      <video src={med.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={med.url} alt="review media" className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(med.url)} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Like and Report interactions */}
            <div className="flex items-center justify-between border-t border-surface-variant/10 pt-4 text-[10px]">
              <span className="text-on-surface-variant/70 font-light">
                By <span className="font-medium text-primary">{rev.customerName}</span>
              </span>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => handleHelpful(rev.id)}
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary font-medium tracking-wide active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                  Helpful ({rev.helpfulCount || 0})
                </button>
                <button
                  onClick={() => handleReport(rev.id)}
                  className="text-on-surface-variant/50 hover:text-red-600 transition-colors"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoadingReviews && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoadingReviews && reviews.length === 0 && (
          <p className="text-center text-xs text-on-surface-variant/60 italic py-10">No reviews have been written for this piece yet.</p>
        )}

        {/* Load More Button */}
        {!isLoadingReviews && page < totalPages && (
          <button
            onClick={handleLoadMore}
            className="w-full border border-secondary/20 text-secondary py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-secondary/5 transition-colors"
          >
            Load More Reviews
          </button>
        )}
      </div>
    </div>
  );
}
