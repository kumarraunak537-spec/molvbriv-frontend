import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/blog/SEOHead';
import BlogCard from '../components/blog/BlogCard';
import NewsletterBlock from '../components/blog/NewsletterBlock';
import { supabase } from '../supabaseClient';
import { MOCK_BLOGS, MOCK_BLOG_TAGS } from '../data/mockBlogs';
import { updateSEO } from '../utils/seo';

export default function BlogListPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [tags, setTags] = useState(MOCK_BLOG_TAGS);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 6;

  // Sync URL query params on mount & location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagParam = params.get('tag') || 'all';
    const searchParam = params.get('search') || '';

    setSelectedTag(tagParam);
    setSearchQuery(searchParam);
  }, [location.search]);

  useEffect(() => {
    window.scrollTo(0, 0);
    updateSEO({
      title: "Molvbriv Journal — Stories of Heritage & Fine Craftsmanship",
      description: "Explore curated jewellery styling advice, sterling silver care guides, and behind-the-scenes artisan craftsmanship stories from Molvbriv.",
      canonicalUrl: "https://www.molvbriv.in/blog",
      schema: {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Molvbriv Journal",
        "description": "Stories of Heritage & Fine Craftsmanship",
        "url": "https://www.molvbriv.in/blog"
      }
    });
  }, []);

  // Load published blogs from Supabase
  useEffect(() => {
    async function fetchBlogData() {
      setLoading(true);
      try {
        const { data: tagData } = await supabase.from('blog_tags').select('*').order('name');
        if (tagData && tagData.length > 0) setTags(tagData);

        const { data: blogData, error: blogErr } = await supabase
          .from('blogs')
          .select('*, blog_categories(name)')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (!blogErr && blogData && blogData.length > 0) {
          const mappedBlogs = blogData.map(b => ({
            ...b,
            category_name: b.blog_categories?.name || b.category_name || 'Jewellery'
          }));
          setBlogs(mappedBlogs);
        } else {
          setBlogs(MOCK_BLOGS);
        }
      } catch (err) {
        console.error('Error loading blog data from Supabase:', err);
        setBlogs(MOCK_BLOGS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogData();
  }, []);

  // Filtered & Searched Blogs computation
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const tagMatch = selectedTag === 'all' || 
        (Array.isArray(blog.tags) && blog.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

      const searchMatch = !searchQuery.trim() || 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (blog.content && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(blog.tags) && blog.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return tagMatch && searchMatch;
    });
  }, [blogs, selectedTag, searchQuery]);

  // Featured Blog Post (first featured post or first article)
  const featuredBlog = useMemo(() => {
    return blogs.find(b => b.is_featured) || blogs[0];
  }, [blogs]);

  // Paginated articles
  const totalPages = Math.ceil(filteredBlogs.length / POSTS_PER_PAGE) || 1;
  const paginatedBlogs = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredBlogs.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  const updateFilters = (newTag, newSearch) => {
    const params = new URLSearchParams();
    if (newTag && newTag !== 'all') params.set('tag', newTag);
    if (newSearch && newSearch.trim()) params.set('search', newSearch.trim());
    
    navigate({ search: params.toString() });
    setCurrentPage(1);
  };

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <SEOHead
        customTitle="Molvbriv Journal — Stories of Heritage & Fine Craftsmanship"
        customDescription="Discover expert guides on cleaning sterling silver jewellery, traditional Jhumka styling, and artisan jewellery craftsmanship."
        canonicalUrl="https://www.molvbriv.in/blog"
      />

      <Navbar />

      <div className="pt-24 md:pt-24 min-h-screen">
        {/* HERO SECTION matching Molvbriv Header Style */}
        <section className="py-16 md:py-24 px-5 md:px-12 bg-surface border-b border-black/5">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">
              MOLVBRIV JOURNAL
            </span>
            <h1 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">
              Stories of Heritage & Fine Craftsmanship
            </h1>
            <p className="text-on-surface-variant font-body leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
              Explore curated styling advice, timeless silver maintenance guides, and behind-the-scenes glimpses into our artisanal jewellery process.
            </p>

            {/* SEARCH INPUT matching HomePage Input Style */}
            <div className="max-w-xl mx-auto pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateFilters(selectedTag, searchQuery);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    updateFilters(selectedTag, e.target.value);
                  }}
                  placeholder="Search journal stories..."
                  className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary py-3.5 md:py-4 px-6 pr-12 text-sm text-primary placeholder-on-surface-variant/60"
                />
                <button
                  type="submit"
                  className="absolute right-4 text-primary opacity-60 hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FEATURED CAMPAIGN SERIES */}
        {currentPage === 1 && !searchQuery && selectedTag === 'all' && featuredBlog && (
          <section className="bg-surface-container-low py-16 md:py-24 px-5 md:px-12 overflow-hidden border-b border-black/5">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
                {/* Left Text */}
                <div className="md:col-span-5 space-y-8">
                  <div className="space-y-4">
                    <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold">
                      Featured Story
                    </span>
                    <h2 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">
                      {featuredBlog.title}
                    </h2>
                    <p className="text-on-surface-variant font-body leading-relaxed max-w-sm text-sm">
                      {featuredBlog.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-manrope text-primary">
                    <span className="font-semibold">{featuredBlog.author_name || 'Molvbriv Editorial'}</span>
                    <span>•</span>
                    <span className="text-secondary font-semibold">{featuredBlog.reading_time_min || 4} min read</span>
                  </div>

                  <Link
                    to={`/blog/${featuredBlog.slug}`}
                    className="inline-block border-b border-secondary pb-1 text-secondary tracking-widest uppercase text-xs hover:tracking-[0.2em] transition-all font-semibold"
                  >
                    Read Full Campaign Story &rarr;
                  </Link>
                </div>

                {/* Right Asymmetric Image Showcase */}
                <div className="md:col-span-7 relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 pt-8">
                      <img
                        loading="lazy"
                        className="w-full aspect-[4/5] object-cover rounded-sm shadow-md"
                        alt={featuredBlog.title}
                        src={featuredBlog.featured_image || '/hero-poster.jpg'}
                      />
                      <div className="p-6 bg-surface-container-highest border border-black/5">
                        <span className="font-manrope italic text-primary text-xs md:text-sm block">
                          "{featuredBlog.excerpt?.slice(0, 90)}..."
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <img
                        loading="lazy"
                        className="w-full aspect-[4/6] object-cover shadow-xl rounded-sm"
                        alt="Editorial Detail"
                        src={featuredBlog.gallery?.[0] || featuredBlog.featured_image}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MAIN ARTICLES CONTAINER */}
        <section className="py-12 md:py-20 px-5 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            {/* SECTION HEADER & TOPIC FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-black/5">
              <div>
                <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block mb-1">
                  Editorial Collection
                </span>
                <h2 className="text-2xl md:text-3xl font-manrope text-primary">
                  All Stories
                </h2>
              </div>

              {/* Tag Filters */}
              {tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mr-1">
                    Topics:
                  </span>
                  {tags.map((t) => {
                    const isActive = selectedTag.toLowerCase() === t.slug.toLowerCase() || selectedTag.toLowerCase() === t.name.toLowerCase();
                    return (
                      <button
                        key={t.id || t.slug}
                        onClick={() => updateFilters(isActive ? 'all' : t.slug, searchQuery)}
                        className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all cursor-pointer font-bold ${
                          isActive
                            ? 'bg-secondary text-white'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary/20'
                        }`}
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ARTICLES GRID */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : paginatedBlogs.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-sm border border-dashed border-black/10">
                <p className="text-on-surface-variant italic mb-4">
                  No stories found matching your filter criteria.
                </p>
                <button
                  onClick={() => updateFilters('all', '')}
                  className="bg-primary text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {paginatedBlogs.map((blog) => (
                  <BlogCard key={blog.id || blog.slug} blog={blog} />
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16 pt-8 border-t border-black/5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-6 py-3 bg-surface-container-low text-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                >
                  &larr; Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 text-xs font-manrope font-bold transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-6 py-3 bg-surface-container-low text-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </section>

        {/* NEWSLETTER */}
        <NewsletterBlock />
      </div>

      <Footer />
    </div>
  );
}
