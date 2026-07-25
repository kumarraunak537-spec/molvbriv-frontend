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
import { MOCK_BLOGS } from '../data/mockBlogs';
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

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      window.scrollTo(0, 0);

      try {
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
          currentArticle = MOCK_BLOGS.find(b => b.slug === slug) || MOCK_BLOGS[0];
        }

        setBlog(currentArticle);
        setLikeCount(currentArticle.likes_count || 0);

        // Update Molvbriv global SEO
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
            "url": canonicalUrl
          }
        });

        // Fetch prev/next & related
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

        const related = blogList.filter(b => b.slug !== currentArticle.slug).slice(0, 3);
        setRelatedArticles(related);
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
          <p className="text-sm text-on-surface-variant">The requested story could not be found.</p>
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
  const readingTime = blog.reading_time_min || calculateReadingTime(rawContent);
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

        {/* FEATURED IMAGE BANNER */}
        {blog.featured_image && (
          <div className="mb-12 max-w-5xl mx-auto">
            <div className="aspect-[16/9] bg-surface-container-low overflow-hidden rounded-sm shadow-md">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover"
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
                [&>blockquote]:border-l-2 [&>blockquote]:border-secondary [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:italic [&>blockquote]:bg-surface-container-low"
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
