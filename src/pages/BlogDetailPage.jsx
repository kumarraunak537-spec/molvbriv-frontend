import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { addHeadingIdsToHtml, sanitizeBlogHtml, calculateReadingTime } from '../utils/blogUtils';
import { updateSEO } from '../utils/seo';

export default function BlogDetailPage() {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [prevBlog, setPrevBlog] = useState(null);
  const [nextBlog, setNextBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Generate or retrieve persistent Session ID for deduplicated views & likes
  const getSessionId = () => {
    let sid = localStorage.getItem('molvbriv_user_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('molvbriv_user_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    async function loadArticleAndTrack() {
      setLoading(true);
      window.scrollTo(0, 0);

      try {
        const sessionId = getSessionId();

        // 1. Fetch Blog Post from Supabase DB
        const { data, error } = await supabase
          .from('blogs')
          .select('*, blog_categories(name)')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          console.error('Blog not found in database:', error);
          setBlog(null);
          setLoading(false);
          return;
        }

        const currentArticle = {
          ...data,
          category_name: data.blog_categories?.name || data.category_name || 'Jewellery Story'
        };

        setBlog(currentArticle);
        setLikeCount(currentArticle.likes_count || 0);

        // Check if user has already liked this article in DB / localStorage
        const likedKey = `molvbriv_liked_${currentArticle.id || slug}`;
        if (localStorage.getItem(likedKey)) {
          setHasLiked(true);
        }

        // 2. Track Unique View in Database (24-hour deduplication window)
        const viewKey = `molvbriv_viewed_${currentArticle.id || slug}`;
        const lastViewed = localStorage.getItem(viewKey);
        const now = Date.now();

        if (!lastViewed || (now - parseInt(lastViewed, 10)) > 24 * 60 * 60 * 1000) {
          localStorage.setItem(viewKey, now.toString());

          // Record view in DB
          try {
            await supabase.from('blog_views').insert([{
              blog_id: String(currentArticle.id || slug),
              session_id: sessionId
            }]);

            // Increment views count in database
            const newViews = (currentArticle.views_count || 0) + 1;
            await supabase
              .from('blogs')
              .update({ views_count: newViews })
              .eq('id', currentArticle.id);
          } catch (vErr) {
            console.warn('View tracking notice:', vErr);
          }
        }

        // 3. Update Molvbriv Global SEO & JSON-LD Schemas
        const canonicalUrl = `${window.location.origin}/blog/${currentArticle.slug}`;
        updateSEO({
          title: `${currentArticle.title} — Molvbriv Journal`,
          description: currentArticle.meta_description || currentArticle.excerpt,
          canonicalUrl,
          ogType: "article",
          ogImage: currentArticle.featured_image,
          schema: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": currentArticle.title,
            "description": currentArticle.excerpt,
            "url": canonicalUrl,
            "datePublished": currentArticle.published_at || currentArticle.created_at,
            "author": {
              "@type": "Person",
              "name": currentArticle.author_name || "Molvbriv Editorial"
            }
          }
        });

        // 4. Fetch Previous / Next & Related Articles from DB
        const { data: allBlogs } = await supabase
          .from('blogs')
          .select('id, title, slug, featured_image, category_name, created_at, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (allBlogs && allBlogs.length > 0) {
          const currentIndex = allBlogs.findIndex(b => b.slug === currentArticle.slug);
          if (currentIndex !== -1) {
            setPrevBlog(currentIndex > 0 ? allBlogs[currentIndex - 1] : null);
            setNextBlog(currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null);
          }
          const related = allBlogs.filter(b => b.slug !== currentArticle.slug).slice(0, 3);
          setRelatedArticles(related);
        }
      } catch (err) {
        console.error('Error loading article:', err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }

    loadArticleAndTrack();
  }, [slug]);

  // Handle Like Increment in Database
  const handleLike = async () => {
    if (hasLiked || !blog) return;
    const sessionId = getSessionId();
    const blogIdentifier = String(blog.id || slug);

    setLikeCount(prev => prev + 1);
    setHasLiked(true);
    localStorage.setItem(`molvbriv_liked_${blogIdentifier}`, 'true');

    try {
      // Record like in DB
      await supabase.from('blog_likes').insert([{
        blog_id: blogIdentifier,
        session_id: sessionId
      }]);

      // Increment likes count on blog in DB
      if (blog.id) {
        const newLikes = (blog.likes_count || 0) + 1;
        await supabase
          .from('blogs')
          .update({ likes_count: newLikes })
          .eq('id', blog.id);
      }
    } catch (err) {
      console.warn('Like DB sync notice:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-surface min-h-screen font-body">
        <Navbar />
        <div className="pt-40 text-center space-y-4 max-w-md mx-auto px-4">
          <h2 className="text-2xl font-manrope text-primary">Article Not Found</h2>
          <p className="text-sm text-on-surface-variant">The requested story could not be found in our database.</p>
          <Link to="/blog" className="inline-block bg-primary text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold">
            Return to Journal Hub
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const rawContent = blog.content || '';
  const processedHtml = sanitizeBlogHtml(addHeadingIdsToHtml(rawContent));
  const readingTime = calculateReadingTime(rawContent);
  const formattedDate = new Date(blog.published_at || blog.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body antialiased">
      <SEOHead blog={blog} />

      <Navbar />

      <main className="pt-24 md:pt-32 pb-16 max-w-7xl mx-auto px-5 md:px-12">
        {/* BREADCRUMB NAVIGATION */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center flex-wrap text-xs text-on-surface-variant font-body gap-2">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/blog" className="hover:text-primary transition-colors">Journal</Link></li>
            {blog.category_name && (
              <>
                <li>/</li>
                <li>
                  <Link to={`/blog?category=${encodeURIComponent(blog.category_name)}`} className="hover:text-primary transition-colors">
                    {blog.category_name}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-primary font-medium truncate max-w-[200px] sm:max-w-xs">
              {blog.title}
            </li>
          </ol>
        </nav>

        {/* HEADER HERO */}
        <header className="max-w-4xl mx-auto text-center space-y-4 mb-10">
          <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">
            {blog.category_name || 'MOLVBRIV JOURNAL'}
          </span>

          <h1 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-on-surface-variant font-body leading-relaxed text-sm md:text-base max-w-2xl mx-auto">
              {blog.excerpt}
            </p>
          )}

          {/* AUTHOR & DATE META */}
          <div className="flex items-center justify-center gap-4 text-xs font-manrope text-primary pt-4 border-t border-black/5 max-w-md mx-auto">
            <span className="font-semibold">{blog.author_name || 'Molvbriv Editorial'}</span>
            <span>•</span>
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="text-secondary font-semibold">{readingTime} min read</span>

            <button
              onClick={handleLike}
              className={`ml-2 px-3 py-1 text-[10px] uppercase font-bold tracking-wider border transition-colors cursor-pointer ${
                hasLiked ? 'bg-secondary text-white border-secondary' : 'bg-surface border-black/10 text-primary hover:border-secondary'
              }`}
            >
              ♥ {likeCount}
            </button>
          </div>
        </header>

        {/* FEATURED IMAGE BANNER - Complete Uncropped Display */}
        {blog.featured_image && (
          <div className="mb-12 max-w-4xl mx-auto flex justify-center">
            <div className="bg-surface-container-low p-3 md:p-6 rounded-sm shadow-sm border border-black/5 w-full flex items-center justify-center">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-sm"
              />
            </div>
          </div>
        )}

        {/* MAIN BODY & STICKY TOC LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto mb-16">
          {/* Left Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <TableOfContents content={rawContent} />
          </aside>

          {/* Center Main Article Content */}
          <article className="lg:col-span-8 order-1 lg:order-2 space-y-8">
            <div
              className="prose prose-lg max-w-none text-on-surface-variant font-body leading-relaxed space-y-6
                [&>h2]:font-manrope [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:text-primary [&>h2]:pt-6 [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-black/5
                [&>h3]:font-manrope [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-primary [&>h3]:pt-4
                [&>p]:text-sm [&>p]:md:text-base [&>p]:leading-relaxed [&>p]:text-on-surface-variant
                [&>strong]:text-primary [&>strong]:font-semibold
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2
                [&>blockquote]:border-l-2 [&>blockquote]:border-secondary [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:italic [&>blockquote]:bg-surface-container-low
                [&_img]:max-w-full [&_img]:max-h-[65vh] [&_img]:w-auto [&_img]:h-auto [&_img]:mx-auto [&_img]:object-contain [&_img]:rounded-sm"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

            {/* TAGS FOOTER PILLS */}
            {Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-6 border-t border-black/5">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mr-1">
                  Topics:
                </span>
                {blog.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant font-bold hover:bg-secondary hover:text-white transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* SOCIAL SHARE BUTTONS */}
            <SocialShareButtons title={blog.title} url={blog.canonical_url} />

            {/* FAQ ACCORDION SECTION */}
            {Array.isArray(blog.faqs) && blog.faqs.length > 0 && (
              <section className="my-10 p-6 md:p-8 bg-surface-container-low border border-black/5">
                <h3 className="text-xl md:text-2xl font-manrope text-primary mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {blog.faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div key={idx} className="bg-surface border border-black/5 overflow-hidden">
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between font-manrope font-semibold text-sm text-primary hover:text-secondary transition-colors cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-xs font-body text-on-surface-variant leading-relaxed border-t border-black/5 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* PREVIOUS / NEXT ARTICLE NAVIGATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8 border-t border-black/5">
              {prevBlog ? (
                <Link
                  to={`/blog/${prevBlog.slug}`}
                  className="p-4 bg-surface-container-low border border-black/5 hover:border-secondary transition-all group flex flex-col"
                >
                  <span className="text-[10px] font-headline uppercase font-bold text-secondary mb-1">
                    &larr; Previous Story
                  </span>
                  <span className="font-manrope font-semibold text-xs text-primary group-hover:text-secondary transition-colors line-clamp-1">
                    {prevBlog.title}
                  </span>
                </Link>
              ) : <div />}

              {nextBlog ? (
                <Link
                  to={`/blog/${nextBlog.slug}`}
                  className="p-4 bg-surface-container-low border border-black/5 hover:border-secondary transition-all group flex flex-col text-right sm:ml-auto w-full"
                >
                  <span className="text-[10px] font-headline uppercase font-bold text-secondary mb-1">
                    Next Story &rarr;
                  </span>
                  <span className="font-manrope font-semibold text-xs text-primary group-hover:text-secondary transition-colors line-clamp-1">
                    {nextBlog.title}
                  </span>
                </Link>
              ) : <div />}
            </div>

            {/* READER COMMENTS SECTION */}
            <BlogComments blogId={blog.id} />
          </article>
        </div>

        {/* RELATED PRODUCTS IN STORY */}
        <RelatedProducts productIds={blog.related_product_ids} categoryName={blog.category_name} />

        {/* RELATED ARTICLES RECOMMENDATION GRID */}
        {relatedArticles.length > 0 && (
          <section className="py-12 md:py-20 border-t border-black/5 bg-surface">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
              <div>
                <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block mb-2">
                  More Stories
                </span>
                <h2 className="text-2xl md:text-3xl font-manrope text-primary">
                  You Might Also Enjoy
                </h2>
              </div>
              <Link to="/blog" className="inline-block border-b border-secondary pb-1 text-secondary tracking-widest uppercase text-xs hover:tracking-[0.2em] transition-all font-semibold">
                Explore All Stories &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {relatedArticles.map((relBlog) => (
                <BlogCard key={relBlog.id || relBlog.slug} blog={relBlog} />
              ))}
            </div>
          </section>
        )}

        {/* NEWSLETTER */}
        <NewsletterBlock />
      </main>

      <Footer />
    </div>
  );
}
