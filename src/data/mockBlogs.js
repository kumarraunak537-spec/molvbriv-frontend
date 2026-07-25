/**
 * Authentic Molvbriv E-Commerce Blog Data
 * Exclusively built using real Molvbriv catalog items and Supabase storage images.
 * Zero stock photos. Zero dummy placeholders.
 */

export const MOCK_BLOG_CATEGORIES = [
  { id: 'cat-1', name: 'Jhumka Care', slug: 'jhumka-care', description: 'Expert maintenance advice for sterling silver, oxidised metal, and natural turquoise stone Jhumkas.' },
  { id: 'cat-2', name: 'Festive Styling', slug: 'festive-styling', description: 'Curated styling guides pairing traditional Maharani Jhumkas and oxidised peacock motifs with ethnic wear.' },
  { id: 'cat-3', name: 'Heritage Craftsmanship', slug: 'heritage-craftsmanship', description: 'Inside Molvbriv artisan techniques, floral enamel detailing, and dome carving.' },
  { id: 'cat-4', name: 'Gift Guides', slug: 'gift-guides', description: 'Thoughtful jewellery gifting inspirations for weddings, festivals, and personal milestones.' }
];

export const MOCK_BLOG_TAGS = [
  { id: 'tag-1', name: 'Turquoise Silver', slug: 'turquoise-silver' },
  { id: 'tag-2', name: 'Oxidised Jhumkas', slug: 'oxidised-jhumkas' },
  { id: 'tag-3', name: 'Maharani Green', slug: 'maharani-green' },
  { id: 'tag-4', name: 'Ruby Red', slug: 'ruby-red' },
  { id: 'tag-5', name: 'Pearl Drops', slug: 'pearl-drops' }
];

export const MOCK_BLOGS = [
  {
    id: 'blog-1',
    title: 'The Art of Caring for Royal Turquoise Stone & Silver Jhumka Earrings',
    slug: 'how-to-clean-silver-jhumkas',
    excerpt: 'Discover professional care techniques to preserve the vibrant stone hue and oxidised silver detailing of your Royal Turquoise Jhumka Earrings.',
    content: `
      <h2>Preserving the Heritage Shine of Your Royal Turquoise Jhumkas</h2>
      <p>Our <a href="/product/0e880e4f-2bd4-4f9f-a0f4-1ea7ea9e35f5"><strong>Royal Turquoise Stone Traditional Jhumka Earrings</strong></a> are handcrafted using traditional silver casing and natural turquoise stone settings. Due to the porous nature of genuine turquoise stones, improper cleaning can alter their natural sea-blue brilliance over time.</p>
      
      <p>Whether you wear your Jhumkas for festive celebrations or family gatherings, regular gentle maintenance keeps the oxidized metal motifs sharp and pristine.</p>

      <h2>Step-by-Step Gentle Care Routine</h2>
      <p>Follow these safe steps tailored specifically for Molvbriv silver and gemstone earrings:</p>
      
      <h3>1. Dry Microfibre Polishing</h3>
      <p>After each wear, wipe your <a href="/product/0e880e4f-2bd4-4f9f-a0f4-1ea7ea9e35f5">Royal Turquoise Jhumkas</a> with a clean, lint-free microfibre cloth. This removes natural skin oils and atmospheric dust without stripping the intentional antiqued oxidized finish.</p>

      <h3>2. Avoiding Moisture & Perfume Contact</h3>
      <p>Always apply perfumes, hairsprays, and cosmetics before putting on your Jhumkas. Direct contact with alcohol-based sprays can cause natural stones like turquoise and pearls to dull.</p>

      <h2>Storing Your Molvbriv Jewellery Collection</h2>
      <p>Store each piece in individual padded pouches to prevent delicate silver drops from scratching. Pair your turquoise Jhumkas with our matching <a href="/product/d825a687-3063-46ab-88ea-383687eec0db"><strong>Sky Blue Floral Silver Jhumka Earrings</strong></a> for a complete heritage suite.</p>
    `,
    content_format: 'html',
    featured_image: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1777981835884-1777366024052.png',
    gallery: [
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1777981835884-1777366024052.png',
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782759882444-1777193539782.png'
    ],
    category_id: 'cat-1',
    category_name: 'Jhumka Care',
    tags: ['Turquoise Silver', 'Oxidised Jhumkas', 'Jhumka Care'],
    author_name: 'Molvbriv Concierge',
    author_role: 'Master Jewellery Specialist',
    author_avatar: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1777981835884-1777366024052.png',
    status: 'published',
    published_at: '2026-07-22T10:00:00.000Z',
    meta_title: 'How to Clean Royal Turquoise Silver Jhumka Earrings | Molvbriv',
    meta_description: 'Learn how to care for Royal Turquoise Stone Traditional Jhumka Earrings. Essential silver polish guidelines and gemstone storage tips.',
    meta_keywords: 'royal turquoise jhumka, clean silver jhumkas, turquoise jewellery care, molvbriv silver',
    canonical_url: 'https://www.molvbriv.in/blog/how-to-clean-silver-jhumkas',
    reading_time_min: 4,
    views_count: 420,
    likes_count: 112,
    is_featured: true,
    related_product_ids: [
      '0e880e4f-2bd4-4f9f-a0f4-1ea7ea9e35f5',
      'd825a687-3063-46ab-88ea-383687eec0db',
      '24662665-eaf6-4be2-9db8-da93978527e6'
    ],
    faqs: [
      {
        question: 'Can I submerge natural turquoise Jhumkas in water?',
        answer: 'We recommend avoiding full water immersion for natural turquoise stones as water can soften stone pores. Gently wipe with a soft microfibre cloth.'
      },
      {
        question: 'Does the oxidised black coating wash off?',
        answer: 'Our oxidized finish is electro-bonded for long-lasting antique character. Avoid harsh chemical cleaners to preserve the contrast.'
      }
    ]
  },
  {
    id: 'blog-2',
    title: 'Styling Black Mirror Oxidised & Peacock Silver Jhumkis for Modern Festivities',
    slug: 'styling-black-mirror-oxidised-peacock-jhumkis',
    excerpt: 'From Black Mirror Oxidised domes to intricate Peacock carvings, learn how to pair dark silver statement earrings with Indo-Western ensembles.',
    content: `
      <h2>The Bold Appeal of Oxidised Black Silver Jewellery</h2>
      <p>Dark oxidised silver creates a striking contrast against contemporary silk and linen attire. Our <a href="/product/24662665-eaf6-4be2-9db8-da93978527e6"><strong>Black Mirror Oxidised Jhumka Earring</strong></a> features reflective central glass detailing framed by delicate ghungroo dangles.</p>

      <h2>1. The Indo-Western Fusion: Black Mirror Jhumkas with Blazer Sets</h2>
      <p>Pairing the <a href="/product/24662665-eaf6-4be2-9db8-da93978527e6">Black Mirror Oxidised Jhumka</a> with a sharp black or ivory linen blazer creates a refined corporate-festive look suitable for evening galas.</p>

      <h2>2. Traditional Charm with Peacock Motifs</h2>
      <p>For wedding functions and pujas, the <a href="/product/3da048a0-c5bd-46b0-967f-ff0d7dd9fee4"><strong>Oxidised Floral Peacock Silver Jhumki</strong></a> brings royal heritage motifs to life. Hand-carved peacock feathers frame the earlobe while lightweight silver bells sway gently with every movement.</p>
    `,
    content_format: 'html',
    featured_image: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782761848629-1777195831548.png',
    gallery: [
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782761848629-1777195831548.png',
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782763834450-1777198686822.png'
    ],
    category_id: 'cat-2',
    category_name: 'Festive Styling',
    tags: ['Oxidised Jhumkas', 'Peacock Motifs', 'Black Mirror Silver'],
    author_name: 'Ananya Sharma',
    author_role: 'Molvbriv Stylist',
    author_avatar: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782761848629-1777195831548.png',
    status: 'published',
    published_at: '2026-07-20T14:30:00.000Z',
    meta_title: 'Styling Black Mirror Oxidised & Peacock Jhumkas | Molvbriv',
    meta_description: 'Discover how to style Black Mirror Oxidised Jhumkas and Peacock Silver Jhumkis for festive and everyday fusion wear.',
    meta_keywords: 'black mirror jhumka, oxidised peacock jhumki, silver styling, molvbriv style',
    canonical_url: 'https://www.molvbriv.in/blog/styling-black-mirror-oxidised-peacock-jhumkis',
    reading_time_min: 3,
    views_count: 580,
    likes_count: 164,
    is_featured: false,
    related_product_ids: [
      '24662665-eaf6-4be2-9db8-da93978527e6',
      '3da048a0-c5bd-46b0-967f-ff0d7dd9fee4',
      '69d9c1d9-a0f7-4dd1-bb8f-d12f616565f3'
    ],
    faqs: [
      {
        question: 'Are heavy dome Jhumkas comfortable for long events?',
        answer: 'Our Molvbriv Jhumka collections are engineered using hollow dome architecture to ensure lightweight comfort during long evening celebrations.'
      }
    ]
  },
  {
    id: 'blog-3',
    title: 'Mint Green & Ruby Red: Pastel vs Jewel Tone Silver Jhumkas for Festive Occasions',
    slug: 'mint-green-ruby-red-silver-jhumka-guide',
    excerpt: 'Explore how to select between Mint Green Aurora Crystal Jhumkas and vibrant Ruby Red Silver drops for weddings and festive wear.',
    content: `
      <h2>Choosing the Right Color Palette for Your Festive Wardrobe</h2>
      <p>Gemstone hues define the tone of your traditional saree or lehenga. Pastel lovers adore the translucent radiance of our <a href="/product/d72a17c7-9a89-4182-85c1-d6cc57be469e"><strong>Mint Green Floral Aurora Crystal Silver Jhumka</strong></a>, while classic red enthusiasts gravitate toward the regal <a href="/product/caa8663e-9c3a-4240-8cf9-90b3356ee629"><strong>Ruby Red Silver Jhumka Earrings</strong></a>.</p>

      <h2>1. The Mint Green Aurora Crystal Charm</h2>
      <p>Featuring hand-cut aurora crystal petals and mint green enamel accents, the <a href="/product/d72a17c7-9a89-4182-85c1-d6cc57be469e">Mint Green Floral Jhumka</a> brings fresh botanical elegance to daytime haldi and mehendi ceremonies.</p>

      <h2>2. The Regal Maharani Ruby Red Statement</h2>
      <p>For evening receptions, deep crimson ruby stones set in silver filigree bring timeless royal drama. Pair the <a href="/product/caa8663e-9c3a-4240-8cf9-90b3356ee629">Ruby Red Jhumka</a> with gold-accented Kanjeevaram silks or velvet dupattas.</p>
    `,
    content_format: 'html',
    featured_image: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782763096022-1777368867489.png',
    gallery: [
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782763096022-1777368867489.png',
      'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782760883318-1777179628977.png'
    ],
    category_id: 'cat-3',
    category_name: 'Heritage Craftsmanship',
    tags: ['Mint Green', 'Ruby Red', 'Crystal Jhumkas'],
    author_name: 'Molvbriv Editorial',
    author_role: 'Gemstone & Enamel Curator',
    author_avatar: 'https://oiksafoujlduutkcgays.supabase.co/storage/v1/object/public/product-images/products/1782763096022-1777368867489.png',
    status: 'published',
    published_at: '2026-07-19T09:00:00.000Z',
    meta_title: 'Mint Green & Ruby Red Silver Jhumkas Guide | Molvbriv',
    meta_description: 'Compare Mint Green Floral Aurora Crystal Jhumkas and Ruby Red Silver Jhumka Earrings. Find the perfect festive jewellery match.',
    meta_keywords: 'mint green jhumka, ruby red silver jhumka, crystal jhumka, molvbriv gemstone',
    canonical_url: 'https://www.molvbriv.in/blog/mint-green-ruby-red-silver-jhumka-guide',
    reading_time_min: 4,
    views_count: 390,
    likes_count: 98,
    is_featured: false,
    related_product_ids: [
      'd72a17c7-9a89-4182-85c1-d6cc57be469e',
      'caa8663e-9c3a-4240-8cf9-90b3356ee629',
      '44901c74-cdc5-43ab-8f18-0147c6dda941'
    ],
    faqs: [
      {
        question: 'Are the crystals real glass or synthetic?',
        answer: 'We utilize precision-faceted aurora optical crystals set in sterling silver mounts to capture high light refraction.'
      }
    ]
  }
];
