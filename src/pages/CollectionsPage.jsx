import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'

const allProducts = [
  {
    id: 'aurelia-ring',
    name: 'The Aurelia Ring',
    price: 4200,
    category: 'BESPOKE DIAMOND',
    tag: 'Gold',
    material: '18k Yellow Gold',
    gemstone: 'White Diamond',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop',
    bgColor: 'bg-[#E8E4DC]',
    filterTags: ['gold', 'diamond', 'bridal'],
  },
  {
    id: 'lunar-hoops',
    name: 'Lunar Crescent Hoops',
    price: 1850,
    category: '18K YELLOW GOLD',
    tag: 'Gold',
    material: '18k Yellow Gold',
    gemstone: 'No Gemstone',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&h=600&fit=crop',
    bgColor: 'bg-white',
    filterTags: ['gold', 'everyday'],
  },
  {
    id: 'solace-band',
    name: 'Solace Pave Band',
    price: 2100,
    category: 'ROSE GOLD',
    tag: 'Gold',
    material: '18k Rose Gold',
    gemstone: 'Champagne Diamond',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500&h=600&fit=crop',
    bgColor: 'bg-primary-dark',
    filterTags: ['gold', 'bridal', 'diamond'],
  },
  {
    id: 'ethera-drops',
    name: 'Ethera Drop Earrings',
    price: 3500,
    category: 'BRIDAL COLLECTION',
    tag: 'Bridal',
    material: 'Platinum 950',
    gemstone: 'White Diamond',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=600&fit=crop',
    bgColor: 'bg-black',
    filterTags: ['bridal', 'diamond'],
  },
  {
    id: 'vertex-signet',
    name: 'Vertex Signet',
    price: 2450,
    category: "MEN'S CAPSULE",
    tag: "Men's",
    material: '18k Yellow Gold',
    gemstone: 'No Gemstone',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=600&fit=crop',
    bgColor: 'bg-[#F0EDE5]',
    filterTags: ['mens', 'gold', 'everyday'],
  },
  {
    id: 'infinity-necklace',
    name: 'Infinity Link Necklace',
    price: 5800,
    category: 'ESSENTIAL GOLD',
    tag: 'Gold',
    material: '18k Yellow Gold',
    gemstone: 'No Gemstone',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=600&fit=crop',
    bgColor: 'bg-white',
    filterTags: ['gold', 'everyday'],
  },
]

const categoryTabs = [
  { name: 'Bridal', key: 'bridal', icon: '💍' },
  { name: 'Gold', key: 'gold', icon: '✦' },
  { name: 'Diamond', key: 'diamond', icon: '💎' },
  { name: 'Everyday', key: 'everyday', icon: '☀️' },
  { name: "Men's", key: 'mens', icon: '♛' },
]

export default function CollectionsPage() {
  const { wishlist, toggleWishlist } = useCart()
  const [sortBy, setSortBy] = useState('newest')
  const [materials, setMaterials] = useState([])
  const [gemstones, setGemstones] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const toggleMaterial = (m) => {
    setMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }
  const toggleGemstone = (g) => {
    setGemstones(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    if (materials.length > 0) {
      result = result.filter(p => materials.includes(p.material))
    }
    if (gemstones.length > 0) {
      result = result.filter(p => gemstones.includes(p.gemstone))
    }

    if (sortBy === 'high') result.sort((a, b) => b.price - a.price)
    else if (sortBy === 'low') result.sort((a, b) => a.price - b.price)

    return result
  }, [sortBy, materials, gemstones])

  const applyFilters = () => {
    setCurrentPage(1)
  }

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />

      {/* Main content */}
      <div className="pt-28 md:pt-32 max-w-[1440px] mx-auto px-5 lg:px-12 pb-6 lg:pb-8">
        
        {/* Simple Text Header (Like New Arrivals) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 md:gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">Our Collections</h2>
            <p className="text-[#424843] text-sm md:text-base font-inter">A selection of rare stones, hand-set in recycled 18k gold. Every piece is a dialogue between nature's chaos and architectural precision.</p>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 mb-6 text-sm font-inter text-primary border border-outline-variant/30 px-4 py-2.5 w-full justify-center"
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10">
          {/* Sidebar */}
          <aside className={`space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Sort By */}
            <div>
              <h3 className="font-inter text-[13px] font-medium text-primary mb-4">Sort By</h3>
              <div className="space-y-3">
                {[
                  { label: 'Newest Curations', value: 'newest' },
                  { label: 'Price: High to Low', value: 'high' },
                  { label: 'Price: Low to High', value: 'low' },
                ].map(opt => (
                  <label key={opt.value} className="cursor-pointer group block">
                    <span className={`font-inter text-[12px] uppercase tracking-widest transition-all duration-300 ${sortBy === opt.value ? 'text-primary font-bold border-b border-primary pb-1' : 'text-[#A0A090] hover:text-primary'}`}>
                      {opt.label}
                    </span>
                    <input type="radio" name="sort" value={opt.value} checked={sortBy === opt.value}
                      onChange={() => setSortBy(opt.value)} className="hidden" />
                  </label>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <h3 className="font-inter text-[13px] font-medium text-primary mb-4">Material</h3>
              <div className="space-y-3">
                {['18k Yellow Gold', '18k Rose Gold', 'Platinum 950'].map(m => (
                  <label key={m} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors
                      ${materials.includes(m) ? 'border-primary bg-primary' : 'border-[#C0B8A8] group-hover:border-primary'}`}>
                      {materials.includes(m) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className={`font-inter text-[12px] ${materials.includes(m) ? 'text-primary font-medium' : 'text-[#A0A090]'}`}>{m}</span>
                    <input type="checkbox" checked={materials.includes(m)}
                      onChange={() => toggleMaterial(m)} className="hidden" />
                  </label>
                ))}
              </div>
            </div>

            {/* Gemstone */}
            <div>
              <h3 className="font-inter text-[13px] font-medium text-primary mb-4">Gemstone</h3>
              <div className="space-y-3">
                {['White Diamond', 'Champagne Diamond', 'No Gemstone'].map(g => (
                  <label key={g} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors
                      ${gemstones.includes(g) ? 'border-primary bg-primary' : 'border-[#C0B8A8] group-hover:border-primary'}`}>
                      {gemstones.includes(g) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className={`font-inter text-[12px] ${gemstones.includes(g) ? 'text-primary font-medium' : 'text-[#A0A090]'}`}>{g}</span>
                    <input type="checkbox" checked={gemstones.includes(g)}
                      onChange={() => toggleGemstone(g)} className="hidden" />
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-primary text-white font-inter text-[10px] uppercase tracking-widest py-3.5 hover:bg-[#1f3d2b] transition-colors"
            >
              APPLY FILTERS
            </button>
          </aside>

          {/* Product Grid */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredProducts.map(product => (
                <Link to={`/product/${product.id}`} key={product.id} className="group">
                  <div className={`relative aspect-[4/5] ${product.bgColor} rounded-lg overflow-hidden`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Heart icon */}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
                      className="absolute top-4 right-4 text-white hover:text-gold transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24"
                        fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                        stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-inter text-[9px] uppercase tracking-[0.15em] text-gold mb-1">{product.category}</p>
                    <h3 className="font-cormorant text-[18px] text-primary-dark italic">{product.name}</h3>
                    <p className="font-inter text-[13px] text-text-muted mt-1">₹{product.price.toLocaleString()}.00</p>
                  </div>
                </Link>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="font-cormorant text-[24px] text-text-muted italic">No pieces match your criteria</p>
                <p className="font-inter text-[12px] text-text-muted mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <button className="font-inter text-[12px] text-text-muted hover:text-primary-dark transition-colors">&lt;</button>
              {[1, 2, 3].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`font-inter text-[12px] w-8 h-8 rounded transition-colors
                    ${currentPage === page ? 'bg-primary-dark text-white' : 'text-text-muted hover:text-primary-dark'}`}
                >
                  {String(page).padStart(2, '0')}
                </button>
              ))}
              <button className="font-inter text-[12px] text-text-muted hover:text-primary-dark transition-colors">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      <Footer variant="collections" />
    </div>
  )
}
