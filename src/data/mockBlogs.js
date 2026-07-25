/**
 * Default High-Quality E-Commerce Blog Data for Molvbriv Jewellery
 * Serves as fallback and seed content when database is initializing.
 */

export const MOCK_BLOG_CATEGORIES = [
  { id: 'cat-1', name: 'Jewellery Care', slug: 'jewellery-care', description: 'Expert advice on cleaning, storing, and maintaining gold, silver, and gemstone jewellery.' },
  { id: 'cat-2', name: 'Styling & Trends', slug: 'styling-trends', description: 'Curated guides on pairing traditional Jhumkas, necklaces, and contemporary accessories.' },
  { id: 'cat-3', name: 'Craftsmanship', slug: 'craftsmanship', description: 'Behind the scenes into artisan techniques, gemstone selection, and Indian heritage design.' },
  { id: 'cat-4', name: 'Gift Guides', slug: 'gift-guides', description: 'Thoughtful jewellery gifting inspirations for weddings, festivals, and personal milestones.' }
];

export const MOCK_BLOG_TAGS = [
  { id: 'tag-1', name: 'Silver Jewellery', slug: 'silver-jewellery' },
  { id: 'tag-2', name: 'Jhumkas', slug: 'jhumkas' },
  { id: 'tag-3', name: 'Bridal', slug: 'bridal' },
  { id: 'tag-4', name: 'Turquoise', slug: 'turquoise' },
  { id: 'tag-5', name: 'Daily Wear', slug: 'daily-wear' }
];

export const MOCK_BLOGS = [
  {
    id: 'blog-1',
    title: 'The Ultimate Guide to Cleaning & Maintaining Sterling Silver Jewellery',
    slug: 'how-to-clean-silver-jewellery',
    excerpt: 'Discover professional secrets to preserve the radiant shine of your silver earrings and necklaces without damaging delicate stone settings.',
    content: `
      <h2>Why Does Sterling Silver Tarnish Over Time?</h2>
      <p>Sterling silver is composed of 92.5% pure silver alloyed with 7.5% other metals—usually copper—to impart strength and longevity. Exposure to air, humidity, skin oils, and household items causes silver to react with hydrogen sulfide in the air, creating a natural layer of tarnish (silver sulfide).</p>
      
      <p>Understanding how tarnish develops is the first step toward keeping your <strong>Molvbriv handcrafted silver jewellery</strong> looking as breathtaking as the day you received it.</p>

      <h2>Step-by-Step Gentle Cleaning Method at Home</h2>
      <p>Follow these safe, chemical-free steps for routine care:</p>
      
      <h3>1. Warm Water & Mild Dish Soap Solution</h3>
      <p>Mix a few drops of mild, phosphate-free dish soap into a bowl of lukewarm water. Soak your silver pieces for 5 to 10 minutes. Use a soft microfibre cloth or an ultra-soft toothbrush to clean intricate carved motifs like traditional Jhumkas.</p>

      <h3>2. The Microfibre Polishing Technique</h3>
      <p>Always dry silver thoroughly with a lint-free lintless microfibre cloth. Avoid paper towels as wood fibers can leave microscopic scratches on polished surfaces.</p>

      <h2>What to Avoid: Common Silver Cleaning Mistakes</h2>
      <p>Never use harsh abrasive chemical cleaners, toothpaste, or baking soda paste on oxidised silver pieces or jewellery embedded with natural gemstones like turquoise or pearls, as this can permanently strip protective coatings and dull gemstone brilliance.</p>

      <h2>Proper Storage to Prevent Future Tarnishing</h2>
      <p>Store each piece of jewellery separately in anti-tarnish pouches or airtight zip bags. Keep your collection in a cool, dark, dry drawer away from bathroom humidity and direct sunlight.</p>
    `,
    content_format: 'html',
    featured_image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'
    ],
    category_id: 'cat-1',
    category_name: 'Jewellery Care',
    tags: ['Silver Jewellery', 'Daily Wear', 'Jewellery Care'],
    author_name: 'Molvbriv Editorial',
    author_role: 'Master Craftsman & Stylist',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status: 'published',
    published_at: '2026-07-20T10:00:00.000Z',
    meta_title: 'How to Clean Sterling Silver Jewellery: Complete Care Guide | Molvbriv',
    meta_description: 'Learn how to clean and polish sterling silver jewellery at home safely. Step-by-step instructions for preserving silver shine and preventing tarnish.',
    meta_keywords: 'clean silver jewellery, sterling silver care, prevent tarnish, silver polish, molvbriv silver',
    canonical_url: 'https://www.molvbriv.in/blog/how-to-clean-silver-jewellery',
    reading_time_min: 4,
    views_count: 342,
    likes_count: 89,
    is_featured: true,
    faqs: [
      {
        question: 'Can I wear sterling silver in the shower?',
        answer: 'While pure water does not damage silver, tap water contains chlorine and minerals that accelerate tarnishing. We recommend removing silver jewellery before showering.'
      },
      {
        question: 'How often should I clean my silver Jhumkas?',
        answer: 'We recommend wiping them with a soft microfibre polishing cloth after every wear and deep cleaning with mild soap water once a month.'
      }
    ]
  },
  {
    id: 'blog-2',
    title: '5 Timeless Ways to Style Statement Jhumkas for Festivals & Everyday Wear',
    slug: '5-timeless-ways-to-style-statement-jhumkas',
    excerpt: 'From handcrafted Royal Turquoise motifs to minimal oxidized silver drops, elevate your wardrobe with versatile Jhumka styling techniques.',
    content: `
      <h2>The Reemergence of Heritage Jhumkas in Modern Fashion</h2>
      <p>Jhumkas are not merely traditional Indian earrings—they are sculptural masterpieces that transcend generations. Whether styled with an elegant handloom Saree or a structured linen blazer, statement Jhumkas frame the face with instant royal charm.</p>

      <h2>1. The Indo-Western Fusion: Blazer & Oxidised Silver Jhumkas</h2>
      <p>Pairing oversized oxidised silver Jhumkas with a monochromatic solid blazer creates a striking balance between contemporary corporate aesthetic and traditional Indian soul.</p>

      <h2>2. Festive Elegance with Silk Sarees</h2>
      <p>For weddings and festive pujas, choose intricate dome Jhumkas adorned with turquoise or freshwater pearls. Let your hair rest in an elegant low bun to keep all focus on the chandelier ear drops.</p>

      <h2>3. Minimalist Daily Glamour</h2>
      <p>Opt for medium-sized lightweight dome Jhumkas paired with a simple cotton Kurti or white linen shirt for effortlessly chic everyday sophistication.</p>
    `,
    content_format: 'html',
    featured_image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=1200',
    gallery: [],
    category_id: 'cat-2',
    category_name: 'Styling & Trends',
    tags: ['Jhumkas', 'Styling', 'Bridal', 'Silver Jewellery'],
    author_name: 'Ananya Sharma',
    author_role: 'Senior Fashion Director',
    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    status: 'published',
    published_at: '2026-07-18T14:30:00.000Z',
    meta_title: '5 Ways to Style Statement Jhumkas for Any Occasion | Molvbriv',
    meta_description: 'Discover how to pair traditional & modern Jhumkas with sarees, blazers, and western outfits for a sophisticated look.',
    meta_keywords: 'style jhumkas, traditional earrings, fusion fashion, silver jhumkas, molvbriv style guide',
    canonical_url: 'https://www.molvbriv.in/blog/5-timeless-ways-to-style-statement-jhumkas',
    reading_time_min: 3,
    views_count: 512,
    likes_count: 142,
    is_featured: false,
    faqs: [
      {
        question: 'Are heavy Jhumkas comfortable for all-day events?',
        answer: 'Our Molvbriv Jhumka collection is ergonomically crafted using hollow dome construction to minimize ear lobe strain while maintaining full visual grandeur.'
      }
    ]
  }
];
