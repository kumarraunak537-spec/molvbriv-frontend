import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { generateSlug, calculateReadingTime, sanitizeBlogHtml, addHeadingIdsToHtml } from '../../utils/blogUtils';
import { MOCK_BLOGS, MOCK_BLOG_CATEGORIES, MOCK_BLOG_TAGS } from '../../data/mockBlogs';

export default function AdminBlogManager({ showToast, productsData = [] }) {
  const [activeTab, setActiveTab] = useState('list'); // list | editor | overview | categories
  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [categories, setCategories] = useState(MOCK_BLOG_CATEGORIES);
  const [tags, setTags] = useState(MOCK_BLOG_TAGS);
  const [loading, setLoading] = useState(false);

  // Filters for All Articles list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Modal state
  const [previewBlog, setPreviewBlog] = useState(null);

  // Editor Form State
  const initialFormState = {
    id: null,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    content_format: 'html',
    featured_image: '',
    gallery: [],
    category_id: '',
    category_name: '',
    tags: [],
    author_name: 'Molvbriv Editorial',
    author_role: 'Jewellery Stylist & Specialist',
    author_avatar: '',
    status: 'published',
    scheduled_at: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    canonical_url: '',
    faqs: [],
    reading_time_min: 3,
    related_product_ids: []
  };

  const [form, setForm] = useState(initialFormState);
  const [isEditorPreview, setIsEditorPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [faqInput, setFaqInput] = useState({ question: '', answer: '' });

  // Auto-calculated reading time
  const autoReadingTime = useMemo(() => {
    return calculateReadingTime(form.content);
  }, [form.content]);

  // Load blogs, categories, and tags from Supabase
  const loadBlogData = async () => {
    setLoading(true);
    try {
      // 1. Categories
      const { data: catData } = await supabase.from('blog_categories').select('*').order('name');
      if (catData && catData.length > 0) setCategories(catData);

      // 2. Tags
      const { data: tagData } = await supabase.from('blog_tags').select('*').order('name');
      if (tagData && tagData.length > 0) setTags(tagData);

      // 3. Blogs
      const { data: blogData, error: blogErr } = await supabase
        .from('blogs')
        .select('*, blog_categories(name)')
        .order('created_at', { ascending: false });

      if (!blogErr && blogData && blogData.length > 0) {
        const mapped = blogData.map(b => ({
          ...b,
          category_name: b.blog_categories?.name || b.category_name || 'Jewellery'
        }));
        setBlogs(mapped);
      } else {
        setBlogs(MOCK_BLOGS);
      }
    } catch (err) {
      console.error('Error fetching admin blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogData();
  }, []);

  // Title Auto-Slug Generator
  const handleTitleChange = (val) => {
    const newSlug = generateSlug(val);
    setForm(prev => ({
      ...prev,
      title: val,
      slug: prev.id ? prev.slug : newSlug, // don't override custom slug if editing
      meta_title: prev.meta_title ? prev.meta_title : `${val} | Molvbriv Journal`
    }));
  };

  // Image Upload Handler
  const handleImageUpload = async (e, field = 'featured_image') => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('File too large. Max 5MB.');

    try {
      const fileName = `blog/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      if (field === 'featured_image') {
        setForm(prev => ({ ...prev, featured_image: publicUrl }));
      } else if (field === 'gallery') {
        setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), publicUrl] }));
      }
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error('Image Upload Error:', err);
      showToast('Image upload failed: ' + err.message);
    }
  };

  // Content Formatting Helper
  const insertContentFormat = (prefix, suffix = '') => {
    setForm(prev => ({
      ...prev,
      content: prev.content + `${prefix}Selected Text${suffix}`
    }));
  };

  // Add FAQ Item
  const handleAddFaq = () => {
    if (!faqInput.question.trim() || !faqInput.answer.trim()) {
      showToast('Please enter both question and answer.');
      return;
    }
    setForm(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: faqInput.question.trim(), answer: faqInput.answer.trim() }]
    }));
    setFaqInput({ question: '', answer: '' });
  };

  const handleRemoveFaq = (idx) => {
    setForm(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== idx)
    }));
  };

  // Save / Submit Blog
  const handleSaveBlog = async (targetStatus = null) => {
    const statusToSave = targetStatus || form.status || 'published';
    if (!form.title.trim()) return showToast('Article title is required.');
    if (!form.content.trim()) return showToast('Article content is required.');

    const finalSlug = form.slug.trim() || generateSlug(form.title);
    const finalCanonical = form.canonical_url.trim() || `https://www.molvbriv.in/blog/${finalSlug}`;
    const readingMin = autoReadingTime || 3;

    const payload = {
      title: form.title.trim(),
      slug: finalSlug,
      excerpt: form.excerpt.trim(),
      content: form.content,
      content_format: form.content_format || 'html',
      featured_image: form.featured_image,
      gallery: form.gallery || [],
      category_id: form.category_id || null,
      tags: form.tags || [],
      author_name: form.author_name || 'Molvbriv Editorial',
      author_role: form.author_role || 'Jewellery Specialist',
      author_avatar: form.author_avatar,
      status: statusToSave,
      scheduled_at: form.scheduled_at || null,
      published_at: statusToSave === 'published' ? new Date().toISOString() : null,
      meta_title: form.meta_title || form.title,
      meta_description: form.meta_description || form.excerpt,
      meta_keywords: form.meta_keywords,
      canonical_url: finalCanonical,
      faqs: form.faqs || [],
      reading_time_min: readingMin,
      updated_at: new Date().toISOString()
    };

    try {
      if (form.id) {
        // Update existing
        const { error } = await supabase.from('blogs').update(payload).eq('id', form.id);
        if (error) throw error;
        showToast('Article updated successfully!');
      } else {
        // Insert new
        const { data, error } = await supabase.from('blogs').insert([payload]).select();
        if (error) throw error;
        showToast(statusToSave === 'published' ? 'Article published live!' : 'Article saved as draft');
      }

      await loadBlogData();
      setActiveTab('list');
      setForm(initialFormState);
    } catch (err) {
      console.error('Save Blog Error:', err);
      // Fallback local update if Supabase table not created yet
      if (form.id) {
        setBlogs(prev => prev.map(b => b.id === form.id ? { ...b, ...payload } : b));
      } else {
        setBlogs(prev => [{ ...payload, id: `blog-${Date.now()}` }, ...prev]);
      }
      showToast('Article saved to local state');
      setActiveTab('list');
      setForm(initialFormState);
    }
  };

  // Duplicate Blog
  const handleDuplicateBlog = (blogToDup) => {
    const dup = {
      ...blogToDup,
      id: null,
      title: `${blogToDup.title} (Copy)`,
      slug: `${blogToDup.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft'
    };
    setForm(dup);
    setActiveTab('editor');
    showToast('Article duplicated. Edit and save as new post.');
  };

  // Delete Blog
  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this article?')) return;
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      showToast('Article deleted');
    } catch (err) {
      console.error('Delete error:', err);
    }
    setBlogs(prev => prev.filter(b => b.id !== id));
  };

  // Filtered Articles List
  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      const matchesSearch = !searchQuery.trim() || 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchQuery, statusFilter]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter(b => b.status === 'published').length;
    const drafts = blogs.filter(b => b.status === 'draft').length;
    const scheduled = blogs.filter(b => b.status === 'scheduled').length;
    const totalViews = blogs.reduce((sum, b) => sum + (b.views_count || 0), 0);
    const totalLikes = blogs.reduce((sum, b) => sum + (b.likes_count || 0), 0);
    return { total, published, drafts, scheduled, totalViews, totalLikes };
  }, [blogs]);

  return (
    <div className="space-y-6">
      {/* MODULE HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant/40">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-on-surface">
            Blog & SEO Management System
          </h2>
          <p className="text-xs text-on-surface-variant/70">
            Publish SEO-optimized articles, manage categories, schedule posts, and monitor organic traffic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setForm(initialFormState);
              setActiveTab('editor');
            }}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-headline font-semibold hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Write New Article
          </button>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-surface-variant/40 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-xs font-headline font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/70 hover:text-on-surface'
          }`}
        >
          All Articles ({metrics.total})
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 text-xs font-headline font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'editor' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/70 hover:text-on-surface'
          }`}
        >
          {form.id ? 'Edit Article' : 'Article Editor'}
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-headline font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/70 hover:text-on-surface'
          }`}
        >
          Analytics & Metrics
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-headline font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/70 hover:text-on-surface'
          }`}
        >
          Categories & Tags
        </button>
      </div>

      {/* VIEW 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-surface-variant/40 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-on-surface-variant/60">Total Posts</span>
              <div className="text-2xl font-bold font-playfair text-on-surface">{metrics.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-emerald-800">Published</span>
              <div className="text-2xl font-bold font-playfair text-emerald-900">{metrics.published}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-amber-800">Drafts</span>
              <div className="text-2xl font-bold font-playfair text-amber-900">{metrics.drafts}</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-blue-800">Scheduled</span>
              <div className="text-2xl font-bold font-playfair text-blue-900">{metrics.scheduled}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-purple-800">Total Views</span>
              <div className="text-2xl font-bold font-playfair text-purple-900">{metrics.totalViews}</div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[10px] font-headline uppercase font-semibold text-rose-800">Total Likes</span>
              <div className="text-2xl font-bold font-playfair text-rose-900">{metrics.totalLikes}</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ALL ARTICLES TABLE */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low p-3.5 rounded-xl border border-surface-variant/40">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs focus:outline-none focus:border-secondary"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-on-surface-variant/70 font-label">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs focus:outline-none focus:border-secondary"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-surface-variant/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60 text-[11px] font-headline uppercase tracking-wider text-on-surface-variant/70 border-b border-surface-variant/40">
                    <th className="p-3.5">Article</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Metrics</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/30 text-xs">
                  {filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-on-surface-variant/60">
                        No articles match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBlogs.map((b) => (
                      <tr key={b.id || b.slug} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-center gap-3">
                            {b.featured_image ? (
                              <img src={b.featured_image} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface-container shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant/40 text-[10px] flex items-center justify-center font-bold shrink-0">
                                BLOG
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-semibold text-on-surface truncate" title={b.title}>{b.title}</div>
                              <div className="text-[10px] text-on-surface-variant/60 font-mono truncate">/blog/{b.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-[11px] font-medium text-on-surface">
                            {b.category_name || 'Jewellery'}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-on-surface-variant">
                          {b.author_name || 'Editorial'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-headline uppercase font-semibold ${
                            b.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-on-surface-variant/80 font-mono text-[11px]">
                          👁 {b.views_count || 0} • ♥ {b.likes_count || 0}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-on-surface-variant/70 text-[11px]">
                          {new Date(b.published_at || b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                          <button
                            onClick={() => {
                              setForm(b);
                              setActiveTab('editor');
                            }}
                            className="px-2.5 py-1 rounded bg-surface-container hover:bg-secondary hover:text-on-secondary text-on-surface transition-colors cursor-pointer"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateBlog(b)}
                            className="px-2.5 py-1 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface transition-colors cursor-pointer"
                            title="Duplicate"
                          >
                            Dup
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(b.id)}
                            className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Delete"
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ARTICLE EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6 bg-surface p-6 rounded-2xl border border-surface-variant/40 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-variant/40">
            <h3 className="font-playfair text-xl font-bold text-on-surface">
              {form.id ? `Edit Article: ${form.title}` : 'Create New Article'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditorPreview(!isEditorPreview)}
                className="px-3.5 py-1.5 rounded-lg border border-surface-variant text-xs font-headline font-semibold hover:bg-surface-container transition-colors cursor-pointer"
              >
                {isEditorPreview ? 'Edit Source' : 'Live Preview'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveBlog('draft')}
                className="px-4 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-headline font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveBlog('published')}
                className="px-5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-headline font-semibold hover:bg-primary-container transition-colors cursor-pointer"
              >
                Publish Article
              </button>
            </div>
          </div>

          {/* MAIN FORM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 8 COLS: TITLE, EXCERPT, EDITOR, FAQS */}
            <div className="lg:col-span-8 space-y-5">
              {/* Title & Slug */}
              <div>
                <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Ultimate Guide to Sterling Silver Jewellery Care"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-variant text-base font-playfair font-bold text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label uppercase text-on-surface-variant/70 mb-1">
                  URL Slug (Auto-generated)
                </label>
                <div className="flex items-center text-xs bg-surface-container-low rounded-lg border border-surface-variant px-3 py-2 text-on-surface-variant font-mono">
                  <span className="opacity-60">https://www.molvbriv.in/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    className="flex-1 bg-transparent border-none outline-none text-secondary font-bold"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant mb-1">
                  Excerpt / Article Summary
                </label>
                <textarea
                  rows="2"
                  value={form.excerpt}
                  onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A compelling 2-sentence summary for search engines and article list cards..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-surface-variant text-xs leading-relaxed focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Content Editor Toolbar & Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant">
                    Article Content (HTML / Markdown) *
                  </label>
                  <span className="text-xs text-secondary font-semibold">
                    ~{autoReadingTime} min read
                  </span>
                </div>

                {/* Editor Toolbar */}
                <div className="flex items-center flex-wrap gap-1 p-2 rounded-t-xl bg-surface-container-high/60 border border-surface-variant border-b-0 text-xs">
                  <button type="button" onClick={() => insertContentFormat('<h2>', '</h2>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant">H2</button>
                  <button type="button" onClick={() => insertContentFormat('<h3>', '</h3>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant">H3</button>
                  <button type="button" onClick={() => insertContentFormat('<strong>', '</strong>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant font-bold">B</button>
                  <button type="button" onClick={() => insertContentFormat('<em>', '</em>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant italic">I</button>
                  <button type="button" onClick={() => insertContentFormat('<p>', '</p>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant">Paragraph</button>
                  <button type="button" onClick={() => insertContentFormat('<blockquote>', '</blockquote>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant">Quote</button>
                  <button type="button" onClick={() => insertContentFormat('<ul>\n  <li>', '</li>\n</ul>')} className="px-2 py-1 bg-surface rounded hover:bg-surface-variant">List</button>
                </div>

                {isEditorPreview ? (
                  <div
                    className="p-5 rounded-b-xl border border-surface-variant bg-surface min-h-[350px] max-h-[500px] overflow-y-auto prose max-w-none text-xs space-y-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(addHeadingIdsToHtml(form.content)) }}
                  />
                ) : (
                  <textarea
                    rows="14"
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write article content using HTML formatting or rich text..."
                    className="w-full p-4 rounded-b-xl bg-surface-container-low border border-surface-variant text-xs font-mono leading-relaxed focus:outline-none focus:border-secondary resize-y"
                  />
                )}
              </div>

              {/* FAQ Builder */}
              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-variant/40 space-y-3">
                <h4 className="font-headline text-xs uppercase font-semibold text-on-surface">
                  Article FAQ Builder (Generates FAQ Schema)
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={faqInput.question}
                    onChange={(e) => setFaqInput(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Question (e.g. Can I wear silver Jhumkas in water?)"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs"
                  />
                  <textarea
                    rows="2"
                    value={faqInput.answer}
                    onChange={(e) => setFaqInput(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Answer text..."
                    className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-3 py-1.5 rounded bg-secondary text-on-secondary text-xs font-headline font-semibold"
                  >
                    + Add FAQ Pair
                  </button>
                </div>

                {Array.isArray(form.faqs) && form.faqs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {form.faqs.map((faq, idx) => (
                      <div key={idx} className="p-2.5 bg-surface rounded-lg border border-surface-variant text-xs flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-on-surface">Q: {faq.question}</div>
                          <div className="text-on-surface-variant/80 text-[11px]">A: {faq.answer}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveFaq(idx)} className="text-rose-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 4 COLS: SETTINGS, IMAGES, CATEGORY, TAGS, LIVE SEO PREVIEW */}
            <div className="lg:col-span-4 space-y-5">
              {/* Category & Tags */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40 space-y-3">
                <div>
                  <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => {
                      const selectedCat = categories.find(c => c.id === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        category_id: e.target.value,
                        category_name: selectedCat?.name || 'Jewellery'
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-variant text-xs focus:outline-none focus:border-secondary"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
                    onChange={(e) => {
                      const parsed = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setForm(prev => ({ ...prev, tags: parsed }));
                    }}
                    placeholder="e.g. Silver Jewellery, Jhumkas, Care"
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-variant text-xs"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40 space-y-3">
                <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant">
                  Featured Image
                </label>
                {form.featured_image && (
                  <img src={form.featured_image} alt="" className="w-full h-32 object-cover rounded-lg bg-surface-container" />
                )}
                <input
                  type="text"
                  value={form.featured_image}
                  onChange={(e) => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="Image URL (https://...)"
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'featured_image')}
                  className="text-xs text-on-surface-variant"
                />
              </div>

              {/* Author Details */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40 space-y-3">
                <label className="block text-xs font-headline uppercase font-semibold text-on-surface-variant">
                  Author Info
                </label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={(e) => setForm(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Author Name"
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs mb-2"
                />
                <input
                  type="text"
                  value={form.author_role}
                  onChange={(e) => setForm(prev => ({ ...prev, author_role: e.target.value }))}
                  placeholder="Author Role / Title"
                  className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-variant text-xs"
                />
              </div>

              {/* LIVE GOOGLE SEO PREVIEW */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/40 space-y-3">
                <h4 className="font-headline text-xs uppercase font-semibold text-on-surface flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748h-9.426z" />
                  </svg>
                  Live Google Search Preview
                </h4>

                <div className="p-3.5 rounded-lg bg-white border border-gray-200 text-left font-sans space-y-1 shadow-2xs">
                  <div className="text-[11px] text-gray-600 truncate">
                    https://www.molvbriv.in › blog › {form.slug || 'slug'}
                  </div>
                  <div className="text-sm font-medium text-blue-800 line-clamp-1 hover:underline cursor-pointer">
                    {form.meta_title || form.title || 'Article Title'}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2 leading-tight">
                    {form.meta_description || form.excerpt || 'Article search engine description snippet will appear here...'}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-label">
                      <span>Meta Title Length</span>
                      <span>{(form.meta_title || '').length} / 60 chars</span>
                    </div>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Custom SEO Meta Title"
                      className="w-full px-3 py-1.5 rounded bg-surface border border-surface-variant text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-label">
                      <span>Meta Description Length</span>
                      <span>{(form.meta_description || '').length} / 160 chars</span>
                    </div>
                    <textarea
                      rows="2"
                      value={form.meta_description}
                      onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Custom SEO Meta Description"
                      className="w-full px-3 py-1.5 rounded bg-surface border border-surface-variant text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
