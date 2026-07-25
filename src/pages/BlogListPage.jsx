import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/blog/SEOHead';
import BlogCard from '../components/blog/BlogCard';
import NewsletterBlock from '../components/blog/NewsletterBlock';
import { supabase } from '../supabaseClient';
import { MOCK_BLOGS, MOCK_BLOG_CATEGORIES, MOCK_BLOG_TAGS } from '../data/mockBlogs';

export default function BlogListPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [categories, setCategories] = useState(MOCK_BLOG_CATEGORIES);
  const [tags, setTags] = useState(MOCK_BLOG_TAGS);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 6;

  // Sync URL query params on mount & location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category') || 'all';
    const tagParam = params.get('tag') || 'all';
    const searchParam = params.get('search') || '';

    setSelectedCategory(catParam);
    setSelectedTag(tagParam);
    setSearchQuery(searchParam);
  }, [location.search]);

  // Load published blogs from Supabase
  useEffect(() => {
    async function fetchBlogData() {
      setLoading(true);
      try {
        // 1. Fetch Categories
        const { data: catData } = await supabase.from('blog_categories').select('*').order('name');
        if (catData && catData.length > 0) setCategories(catData);

        // 2. Fetch Tags
        const { data: tagData } = await supabase.from('blog_tags').select('*').order('name');
        if (tagData && tagData.length > 0) setTags(tagData);

        // 3. Fetch Published Blogs
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
          // Fallback to defaults if DB tables not populated yet
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
      // Category filter
      const categoryMatch = selectedCategory === 'all' || 
        (blog.category_name && blog.category_name.toLowerCase() === selectedCategory.toLowerCase()) ||
        (blog.category_id && blog.category_id === selectedCategory);

      // Tag filter
      const tagMatch = selectedTag === 'all' || 
        (Array.isArray(blog.tags) && blog.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

      // Search query filter
      const searchMatch = !searchQuery.trim() || 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (blog.content && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(blog.tags) && blog.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return categoryMatch && tagMatch && searchMatch;
    });
  }, [blogs, selectedCategory, selectedTag, searchQuery]);

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

  const updateFilters = (newCat, newTag, newSearch) => {
    const params = new URLSearchParams();
    if (newCat && newCat !== 'all') params.set('category', newCat);
    if (newTag && newTag !== 'all') params.set('tag', newTag);
    if (newSearch && newSearch.trim()) params.set('search', newSearch.trim());
    
    navigate({ search: params.toString() });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body">
      <SEOHead
        customTitle="Molvbriv Journal | Fine Jewellery Care, Styling & Artisan Heritage"
        customDescription="Discover expert guides on cleaning sterling silver jewellery, traditional Jhumka styling, and artisan jewellery craftsmanship."
        canonicalUrl="https://www.molvbriv.in/blog"
      />

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-surface-container-low via-background to-background py-12 md:py-16 border-b border-surface-variant/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="text-xs font-headline font-semibold uppercase tracking-widest text-secondary">
              MOLVBRIV JOURNAL
            </span>
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-on-surface tracking-tight">
              Stories of Heritage & Fine Craftsmanship
            </h1>
            <p className="font-body text-sm md:text-base text-on-surface-variant/80 max-w-2xl mx-auto leading-relaxed">
              Explore curated styling advice, timeless silver maintenance guides, and behind-the-scenes glimpses into our artisanal jewellery process.
            </p>

            {/* SEARCH BAR */}
            <div className="max-w-xl mx-auto pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateFilters(selectedCategory, selectedTag, searchQuery);
                }}
                className="relative flex items-center"
              >
                <svg
                  className="w-5 h-5 absolute left-4 text-on-surface-variant/60 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    updateFilters(selectedCategory, selectedTag, e.target.value);
                  }}
                  placeholder="Search articles by keyword, topic, or tag..."
                  className="w-full pl-12 pr-10 py-3.5 rounded-full bg-surface border border-surface-variant/70 text-sm shadow-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => updateFilters(selectedCategory, selectedTag, '')}
                    className="absolute right-4 text-on-surface-variant/60 hover:text-on-surface"
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* FEATURED BANNER (Only on page 1 when no strict search filter active) */}
          {currentPage === 1 && !searchQuery && selectedCategory === 'all' && selectedTag === 'all' && featuredBlog && (
            <div className="mb-12 rounded-2xl overflow-hidden bg-surface border border-surface-variant/60 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0 group">
              <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-surface-container">
                <img
                  src={featuredBlog.featured_image}
                  alt={featuredBlog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 bg-secondary text-on-secondary text-xs font-headline font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full">
                  Featured Story
                </span>
              </div>

              <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-center bg-surface">
                <div className="text-xs text-on-surface-variant/70 font-label flex items-center gap-2 mb-2">
                  <span className="text-secondary font-semibold uppercase">{featuredBlog.category_name || 'Guide'}</span>
                  <span>•</span>
                  <span>{featuredBlog.reading_time_min || 4} min read</span>
                </div>

                <h2 className="font-playfair text-2xl md:text-3xl font-bold text-on-surface group-hover:text-secondary transition-colors mb-4">
                  <Link to={`/blog/${featuredBlog.slug}`}>
                    {featuredBlog.title}
                  </Link>
                </h2>

                <p className="font-body text-sm text-on-surface-variant/80 line-clamp-3 mb-6 leading-relaxed">
                  {featuredBlog.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40 mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">
                      {(featuredBlog.author_name || 'M').charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-on-surface">{featuredBlog.author_name}</div>
                      <div className="text-[10px] text-on-surface-variant/60">{featuredBlog.author_role}</div>
                    </div>
                  </div>

                  <Link
                    to={`/blog/${featuredBlog.slug}`}
                    className="inline-flex items-center text-xs font-headline font-semibold px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors"
                  >
                    Read Story &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TABS & TAG PILLS */}
          <div className="space-y-4 mb-10 pb-6 border-b border-surface-variant/40">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => updateFilters('all', selectedTag, searchQuery)}
                className={`px-4 py-2 rounded-full text-xs font-headline font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase() || selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => updateFilters(cat.slug, selectedTag, searchQuery)}
                    className={`px-4 py-2 rounded-full text-xs font-headline font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Tag Pills */}
            {tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <span className="text-xs font-headline font-semibold text-on-surface-variant/60 mr-1">
                  Topics:
                </span>
                {tags.map((t) => {
                  const isActive = selectedTag.toLowerCase() === t.slug.toLowerCase() || selectedTag.toLowerCase() === t.name.toLowerCase();
                  return (
                    <button
                      key={t.id || t.slug}
                      onClick={() => updateFilters(selectedCategory, isActive ? 'all' : t.slug, searchQuery)}
                      className={`px-3 py-1 rounded-md text-[11px] font-label transition-all cursor-pointer ${
                        isActive
                          ? 'bg-secondary text-on-secondary font-semibold'
                          : 'bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ARTICLES GRID & SIDEBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Articles List */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-on-surface-variant/70">Loading articles...</p>
                </div>
              ) : paginatedBlogs.length === 0 ? (
                <div className="py-16 text-center bg-surface-container-low rounded-2xl border border-surface-variant/50 p-8 space-y-4">
                  <svg className="w-12 h-12 text-on-surface-variant/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="font-playfair text-xl font-bold text-on-surface">No Articles Found</h3>
                  <p className="text-xs text-on-surface-variant/70 max-w-sm mx-auto">
                    We couldn't find any stories matching your filter. Try adjusting your search query or choosing another topic.
                  </p>
                  <button
                    onClick={() => updateFilters('all', 'all', '')}
                    className="px-4 py-2 rounded-full bg-secondary text-on-secondary text-xs font-headline font-semibold hover:bg-tertiary transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedBlogs.map((blog) => (
                    <BlogCard key={blog.id || blog.slug} blog={blog} />
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-surface-variant/40">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3.5 py-2 rounded-lg border border-surface-variant text-xs font-headline font-semibold hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    &larr; Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-xs font-headline font-semibold transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-primary text-on-primary'
                          : 'hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3.5 py-2 rounded-lg border border-surface-variant text-xs font-headline font-semibold hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Popular Articles Widget */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-variant/50 space-y-4">
                <h4 className="font-playfair text-lg font-bold text-on-surface pb-2 border-b border-surface-variant/40">
                  Popular Reads
                </h4>
                <div className="space-y-4">
                  {blogs.slice(0, 3).map((popularBlog, idx) => (
                    <Link
                      key={popularBlog.id || idx}
                      to={`/blog/${popularBlog.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      <span className="font-playfair text-2xl font-bold text-secondary/40 group-hover:text-secondary transition-colors">
                        0{idx + 1}
                      </span>
                      <div>
                        <h5 className="font-headline font-semibold text-xs text-on-surface group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                          {popularBlog.title}
                        </h5>
                        <span className="text-[10px] text-on-surface-variant/60 font-label">
                          {popularBlog.reading_time_min || 3} min read
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Block in Sidebar */}
              <div className="bg-primary text-on-primary p-6 rounded-2xl space-y-3">
                <h4 className="font-playfair text-lg font-bold">Stay Inspired</h4>
                <p className="text-xs text-surface-variant/80 leading-relaxed">
                  Subscribe to receive new jewellery care guides & luxury styling tips directly in your inbox.
                </p>
                <Link
                  to="#newsletter"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className="block text-center py-2.5 px-4 rounded-xl bg-secondary text-on-secondary font-headline text-xs font-semibold hover:bg-tertiary transition-colors"
                >
                  Subscribe Now
                </Link>
              </div>
            </aside>
          </div>

          {/* NEWSLETTER BANNER */}
          <NewsletterBlock />
        </div>
      </main>

      <Footer />
    </div>
  );
}
