import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * BlogComments Component
 * Inherits exact Molvbriv typography, inputs, buttons, and card borders.
 */
export default function BlogComments({ blogId }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchComments() {
      if (!blogId) return;
      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('blog_id', blogId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setComments(data);
        }
      } catch (err) {
        console.error('Error fetching blog comments:', err);
      }
    }

    fetchComments();
  }, [blogId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !commentText.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const newComment = {
        blog_id: blogId,
        author_name: name.trim(),
        author_email: email.trim(),
        comment: commentText.trim(),
        status: 'approved'
      };

      const { data, error } = await supabase.from('blog_comments').insert([newComment]).select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setComments(prev => [data[0], ...prev]);
      } else {
        setComments(prev => [{ ...newComment, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
      }

      setSubmitted(true);
      setCommentText('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Comment Submit Error:', err);
      setErrorMsg('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-12 pt-8 border-t border-black/5">
      <h3 className="font-manrope text-xl md:text-2xl text-primary mb-6">
        Reader Discussion ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-low p-6 border border-black/5 mb-8 space-y-4">
        <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">
          Share Your Perspective
        </span>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {submitted && (
          <div className="p-3 bg-[#1F3D2B]/10 text-primary text-xs border border-primary/20 flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-sm">done</span>
            <span>Thank you! Your comment has been published.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-manrope uppercase tracking-widest text-primary font-bold mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-surface border border-black/10 py-3 px-4 text-xs text-primary focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-manrope uppercase tracking-widest text-primary font-bold mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-surface border border-black/10 py-3 px-4 text-xs text-primary focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-manrope uppercase tracking-widest text-primary font-bold mb-1">
            Comment *
          </label>
          <textarea
            rows="3"
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full bg-surface border border-black/10 py-3 px-4 text-xs text-primary focus:ring-1 focus:ring-secondary focus:outline-none resize-y"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors duration-500 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-xs text-on-surface-variant italic">
            Be the first to share your thoughts on this story.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-4 bg-surface-container-low border border-black/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-manrope font-semibold text-xs text-primary">{c.author_name}</span>
                <span className="text-[10px] text-on-surface-variant font-manrope">
                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed whitespace-pre-line">
                {c.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
