import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/blog/SEOHead';
import TableOfContents from '../components/blog/TableOfContents';
import SocialShareButtons from '../components/blog/SocialShareButtons';
import RelatedProducts from '../components/blog/RelatedProducts';
import BlogComments from '../components/blog/BlogComments';
import BlogCard from '../components/blog/BlogCard';
import NewsletterBlock from '../components/blog/NewsletterBlock';
import { supabase } from '../supabaseClient';
import { MOCK_BLOGS } from '../data/mockBlogs';
import { addHeadingIdsToHtml, sanitizeBlogHtml, calculateReadingTime } from '../utils/blogUtils';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [prevBlog, setPrevBlog] = useState(null);
  const [nextBlog, setNextBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [viewsCounted, setViewsCounted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      window.scrollTo(0, 0);

      try {
        // 1. Fetch main article by slug
        let currentArticle = null;
        const { data, error } = await supabase
          .from('blogs')
          .select('*, blog_categories(name)')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          currentArticle = {
            ...data,
            category_name: data.blog_categories?.name || data.category_name || 'Jewellery Guide'
          };
        } else {
          // Fallback to mock data
          currentArticle = MOCK_BLOGS.find(b => b.slug === slug) || MOCK_BLOGS[0];
        }

        setBlog(currentArticle);
        setLikeCount(currentArticle.likes_count || 0);

        // 2. Fetch all published blogs to calculate prev/next & related
        const { data: allBlogs } = await supabase
          .from('blogs')
          .select('id, title, slug, featured_image, category_name, created_at, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        const blogList = (allBlogs && allBlogs.length > 0) ? allBlogs : MOCK_BLOGS;
        const currentIndex = blogList.findIndex(b => b.slug === currentArticle.slug);

        if (currentIndex !== -1) {
          setPrevBlog(currentIndex > 0 ? blogList[currentIndex - 1] : null);
          setNextBlog(currentIndex < blogList.length - 1 ? blogList[currentIndex + 1] : null);
        }

        // Related articles by category
        const related = blogList.filter(b => b.slug !== currentArticle.slug).slice(0, 2);
        setRelatedArticles(related);

        // 3. Record View Count (async background)
        if (!viewsCounted && currentArticle.id) {
          supabase.rpc('increment_blog_views', { blog_id_param: currentArticle.id }).catch(() => {});
          setViewsCounted(true);
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        const fallback = MOCK_BLOGS.find(b => b.slug === slug) || MOCK_BLOGS[0];
        setBlog(fallback);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked || !blog) return;
    setLikeCount(prev => prev + 1);
    setHasLiked(true);

    try {
      if (blog.id) {
        await supabase
          .from('blogs')
          .update({ likes_count: (blog.likes_count || 0) + 1 })
          .eq('id', blog.id);
      }
    } catch (err) {
      console.error('Like increment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between font-body">
        <Navbar />
        <div className="h-screen w-full flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <p className="text-xs text-on-surface-variant/70 font-headline">Loading Journal Story...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between font-body">
        <Navbar />
        <div className="max-w-md mx-auto my-32 text-center space-y-4 px-4">
          <h2 className="font-playfair text-3xl font-bold text-on-surface">Article Not Found</h2>
          <p className="text-sm text-on-surface-variant/80">The requested story could not be found or has been moved.</p>
          <Link to="/blog" className="inline-block px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-headline font-semibold">
            Return to Journal Hub
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Process HTML content with Heading IDs and XSS sanitization
  const rawContent = blog.content || '';
  const processedHtml = sanitizeBlogHtml(addHeadingIdsToHtml(rawContent));
  const readingTime = blog.reading_time_min || calculateReadingTime(rawContent);
  const formattedDate = new Date(blog.published_at || blog.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body">
      <SEOHead blog={blog} />

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* BREADCRUMB NAVIGATION */}
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <ol className="flex items-center flex-wrap text-xs text-on-surface-variant/70 gap-2 font-label">
            <li>
              <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/blog" className="hover:text-secondary transition-colors">Journal</Link>
            </li>
            {blog.category_name && (
              <>
                <li>/</li>
                <li>
                  <Link to={`/blog?category=${encodeURIComponent(blog.category_name)}`} className="hover:text-secondary transition-colors">
                    {blog.category_name}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-on-surface font-medium truncate max-w-[200px] sm:max-w-xs">
              {blog.title}
            </li>
          </ol>
        </nav>

        {/* ARTICLE HEADER HERO */}
        <header className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="flex items-center gap-3">
            {blog.category_name && (
              <span className="bg-secondary/15 text-secondary text-xs font-headline uppercase tracking-widest font-semibold px-3 py-1 rounded-full">
                {blog.category_name}
              </span>
            )}
            <span className="text-xs text-on-surface-variant/70 font-label">
              {formattedDate} • {readingTime} min read
            </span>
          </div>

          <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface leading-tight tracking-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="font-body text-base md:text-lg text-on-surface-variant/80 leading-relaxed font-light">
              {blog.excerpt}
            </p>
          )}

          {/* AUTHOR & ENGAGEMENT HEADER BAR */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40">
            <div className="flex items-center gap-3">
              {blog.author_avatar ? (
                <img src={blog.author_avatar} alt={blog.author_name} className="w-10 h-10 rounded-full object-cover border border-surface-variant" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center">
                  {(blog.author_name || 'M').charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs font-headline font-bold text-on-surface">{blog.author_name || 'Molvbriv Editorial'}</div>
                <div className="text-[11px] text-on-surface-variant/70">{blog.author_role || 'Jewellery Stylist & Specialist'}</div>
              </div>
            </div>

            {/* Like Counter Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold border transition-all cursor-pointer ${
                hasLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-surface border-surface-variant text-on-surface-variant hover:border-secondary'
              }`}
            >
              <svg className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likeCount} Likes</span>
            </button>
          </div>
        </header>

        {/* FEATURED IMAGE BANNER */}
        {blog.featured_image && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 my-6">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-surface-container">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        )}

        {/* MAIN BODY & STICKY TOC LAYOUT */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <TableOfContents content={rawContent} />
          </aside>

          {/* Center Main Article Content */}
          <article className="lg:col-span-8 order-1 lg:order-2 space-y-6">
            {/* HTML Article Content */}
            <div
              className="prose prose-lg max-w-none text-on-surface-variant font-body leading-relaxed space-y-5
                [&>h2]:font-playfair [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:font-bold [&>h2]:text-on-surface [&>h2]:pt-6 [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-surface-variant/40
                [&>h3]:font-playfair [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-on-surface [&>h3]:pt-4
                [&>p]:text-base [&>p]:leading-8 [&>p]:text-on-surface-variant/90
                [&>strong]:text-on-surface [&>strong]:font-semibold
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2
                [&>blockquote]:border-l-4 [&>blockquote]:border-secondary [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:italic [&>blockquote]:bg-surface-container-low [&>blockquote]:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

            {/* TAGS FOOTER PILLS */}
            {Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-6 border-t border-surface-variant/40">
                <span className="text-xs font-headline font-semibold text-on-surface-variant/70">Tagged in:</span>
                {blog.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 rounded-full bg-surface-container text-xs font-label text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* SOCIAL SHARE BUTTONS */}
            <SocialShareButtons title={blog.title} url={blog.canonical_url} />

            {/* FAQ ACCORDION SECTION (If post contains FAQs) */}
            {Array.isArray(blog.faqs) && blog.faqs.length > 0 && (
              <section className="my-10 p-6 rounded-2xl bg-surface-container-low/70 border border-surface-variant/50">
                <h3 className="font-playfair text-2xl font-bold text-on-surface mb-4">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {blog.faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div key={idx} className="bg-surface rounded-xl border border-surface-variant/40 overflow-hidden">
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between font-headline font-semibold text-sm text-on-surface hover:text-secondary transition-colors cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-xs font-body text-on-surface-variant/80 leading-relaxed border-t border-surface-variant/30 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* RELATED PRODUCTS IN ARTICLE */}
            <RelatedProducts productIds={blog.related_product_ids} categoryName={blog.category_name} />

            {/* PREVIOUS / NEXT ARTICLE NAVIGATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8 border-t border-surface-variant/50">
              {prevBlog ? (
                <Link
                  to={`/blog/${prevBlog.slug}`}
                  className="p-4 rounded-xl bg-surface border border-surface-variant/40 hover:border-secondary transition-all group flex flex-col"
                >
                  <span className="text-[10px] font-headline uppercase font-semibold text-on-surface-variant/60 mb-1">
                    &larr; Previous Article
                  </span>
                  <span className="font-headline font-semibold text-xs text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                    {prevBlog.title}
                  </span>
                </Link>
              ) : <div />}

              {nextBlog ? (
                <Link
                  to={`/blog/${nextBlog.slug}`}
                  className="p-4 rounded-xl bg-surface border border-surface-variant/40 hover:border-secondary transition-all group flex flex-col text-right sm:ml-auto w-full"
                >
                  <span className="text-[10px] font-headline uppercase font-semibold text-on-surface-variant/60 mb-1">
                    Next Article &rarr;
                  </span>
                  <span className="font-headline font-semibold text-xs text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                    {nextBlog.title}
                  </span>
                </Link>
              ) : <div />}
            </div>

            {/* READER COMMENTS SECTION */}
            <BlogComments blogId={blog.id} />
          </article>
        </div>

        {/* RELATED ARTICLES RECOMMENDATION GRID */}
        {relatedArticles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-surface-variant/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-headline font-semibold uppercase tracking-widest text-secondary">
                  More Stories
                </span>
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-on-surface">
                  You Might Also Enjoy
                </h3>
              </div>
              <Link to="/blog" className="text-xs font-headline font-semibold text-secondary hover:text-tertiary">
                Explore All Stories &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relBlog) => (
                <BlogCard key={relBlog.id || relBlog.slug} blog={relBlog} />
              ))}
            </div>
          </section>
        )}

        {/* NEWSLETTER CAPTURE */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterBlock />
        </div>
      </main>

      <Footer />
    </div>
  );
}
