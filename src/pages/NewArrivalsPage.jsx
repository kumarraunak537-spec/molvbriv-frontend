import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NewArrivalsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      {/* Adding padding top to account for the fixed navbar */}
      <div className="pt-28 md:pt-24 min-h-screen">
        {/* New Arrivals Grid */}
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface border-t border-black/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">New Arrivals</h2>
                <p className="text-on-surface-variant text-sm md:text-base">The latest curators' picks, fresh from the atelier. Discover pieces that define this season's brilliance.</p>
              </div>
              <Link className="text-secondary uppercase tracking-widest text-xs font-bold hover:mr-2 transition-all" to="/collections">View All Products →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <Link to="/product/aurelia" className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Emerald cut engagement ring" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkJs5HIeHuYH1nssRPfapFZYPw4e_mtWu-Mbtd-wIlnkbJ3sDn-YN8b9s0dW0bn2pJVfdSORn1E1yE-GmewfOE4AZTQMZIQ4WBJ9EKYNvG_b9iuAJ3XuwRt4Us8zew99ZN2P226Vo5CX5b-yGMSAyPflZM9RrdNpatIFfyKMWWfP2srDrQDtr4SwSzDdBKbIYZS5esj9cYhFZiCP3nBzISHMhc_Om4V37KF5L3rwwhCnxEx1rhk5nfBrX90BNpOwpo2Ax2-ctJTNY"/>
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black">New</div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                    <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-primary font-body font-semibold text-sm mb-1">Aurelia Emerald Solitaire</h3>
                  <p className="text-secondary font-manrope text-lg">₹14,200</p>
                </div>
              </Link>
              <Link to="/product/celestial" className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Dainty gold bracelet" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOGyX7cX6Vz4kxa_yK6kva54x2lS5FZP1EnjloCjzkdzmb5q1WYEaayYdKtbbGNZttEQCxHIUcL1vZsy6U4BOjqOoOGcrVJjcDR8tC63U068B2BzHCzv81INr8t_ReFy296OHhpAhFvbSJt_BC5wQi1JDdXev3La8SAJBJCJpEf4JPynLduEoniSeymdbLszm2Nb0fVQX4i_rSx2e1KxHzTSofbw8t-55pq4IT9Jmh0K9xAzkXpx7Q2GuJrT0lHuCl83HDjz3jHms"/>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                    <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-primary font-body font-semibold text-sm mb-1">Celestial Gold Link</h3>
                  <p className="text-secondary font-manrope text-lg">₹4,850</p>
                </div>
              </Link>
              <Link to="/product/twilight" className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Diamond drop earrings" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl3F2iRmy4iXhvCp_Ylcm9V2IRc9IOJo3HWnj6x3YceJT-NZRhMBZrgKIe6aRvNeXCyHg-Uy6oH7Yd2IFB-FRcxt_n-tnFzfzC25xIEU1n3dPLXcEw-v03rF_VeylMCjudW8OVc38IxzJR6XlRw_2qmoiNMFJpfDBGJtno2OkL54lkJb4MIChZqSeu4IUZKHM1f21a4NIarZxy6eaVDXl5CPZYgJCqEUnBw3mCanFetdTqX7iP8bbzM-xf39rZWgq9bR1Nz9vibbI"/>
                  <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 text-[10px] uppercase tracking-tighter">Bestseller</div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                    <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-primary font-body font-semibold text-sm mb-1">Twilight Drop Earrings</h3>
                  <p className="text-secondary font-manrope text-lg">₹22,000</p>
                </div>
              </Link>
              <Link to="/product/oceanic" className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Sapphire pendant necklace" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgwmFsKuYvfp3aLYmtzmUXSg3XAf1ZsZ26JFMGSo1XpUKrNvACy1TB5I2xNLx6vSJy_iXJ5rOE1b1lCVao4afcEQ0hrPUaQSdZXHCBI2LsYw3u81P09raDspP-1KwUfOgP_eHihi4e5mAMQUqfGeAjCqXe4WTWnfn4seR2d_fFPxv78WDQEwWtGOK-O-kZhY04MC0aeXn0Q6aUh31TYM5vZXIbkW-frnGsjAAYyse8805h0cDyJNtq9nHA4Co2nw5FvCWpLjsn9nE"/>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                    <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-primary font-body font-semibold text-sm mb-1">Oceanic Sapphire Bloom</h3>
                  <p className="text-secondary font-manrope text-lg">₹31,500</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
