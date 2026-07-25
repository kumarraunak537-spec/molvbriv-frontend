import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * BlogComments Component
 * Interactive comments section with comment listing, user submission, and validation.
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
        status: 'approved' // Default auto-approve for seamless UX
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
    <section className="my-12 pt-8 border-t border-surface-variant/50">
      <h3 className="font-playfair text-2xl font-bold text-on-surface mb-6">
        Discussion & Reader Thoughts ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-low p-6 rounded-xl border border-surface-variant/40 mb-8 space-y-4">
        <h4 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wider">
          Leave a Comment
        </h4>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {submitted && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Thank you! Your comment has been published.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">
              Email * (Will not be published)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-label uppercase tracking-wider text-on-surface-variant mb-1">
            Comment *
          </label>
          <textarea
            rows="3"
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts or ask a question about this article..."
            className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-y"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-headline font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Posting Comment...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-on-surface-variant/70 italic">
            Be the first to share your thoughts on this article!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-surface border border-surface-variant/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-headline font-semibold text-sm text-on-surface">{c.author_name}</span>
                <span className="text-xs text-on-surface-variant/60 font-label">
                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant/90 font-body leading-relaxed whitespace-pre-line">
                {c.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
