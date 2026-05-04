import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminPage.css';

export default function AdminPage() {
  // Login gate state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('molvbriv_admin_auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const ADMIN_EMAIL = 'admin@molvbriv.in';
  const ADMIN_PASSWORD = 'molvbriv2026';

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    setTimeout(() => {
      if (loginEmail.toLowerCase() === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
        sessionStorage.setItem('molvbriv_admin_auth', 'true');
        setIsAuthenticated(true);
      } else if (loginEmail.toLowerCase() !== ADMIN_EMAIL) {
        setLoginError('Email not recognized.');
      } else {
        setLoginError('Invalid password. Access denied.');
      }
      setIsLoggingIn(false);
    }, 800);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('molvbriv_admin_auth');
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const [activePage, setActivePage] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState('Saved');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [graphMode, setGraphMode] = useState('daily');
  const [orderFilter, setOrderFilter] = useState('all');
  const [customizeFilter, setCustomizeFilter] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('Jhumka');

  const [editingProduct, setEditingProduct] = useState({
    name: 'Polki Jhumka Set',
    price: '1299',
    cat: 'Jhumka',
    material: 'Gold Plated'
  });
  const [activeColor, setActiveColor] = useState(0);

  // Quantities state for Collections page
  const [quantities, setQuantities] = useState({
    p1: 24, p2: 30, p3: 12, p4: 6
  });

  const [newProduct, setNewProduct] = useState({
    title: '', category: '', price: '', material: '', stock: '', description: '', sku: ''
  });

  const handleAddProduct = async (status = 'live') => {
    try {
      const { data, error } = await supabase.from('products').insert([{
        title: newProduct.title,
        category: newProduct.category.toLowerCase(),
        price: parseFloat(newProduct.price) || 0,
        material: newProduct.material,
        stock: parseInt(newProduct.stock) || 0,
        description: newProduct.description,
        sku: newProduct.sku,
        status: status
      }]).select();
      
      if (error) throw error;
      setProductsData([...productsData, data[0]]);
      showToast(status === 'live' ? 'Product published successfully' : 'Saved as draft');
      setNewProduct({ title: '', category: '', price: '', material: '', stock: '', description: '', sku: '' });
      nav('products');
    } catch (err) {
      console.error(err);
      showToast('Error saving product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProductsData(productsData.filter(p => p.id !== id));
      showToast('Product deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      if (!editingProduct.id) return showToast('Cannot update fallback product');
      const { error } = await supabase.from('products').update({
        title: editingProduct.name,
        price: parseFloat(editingProduct.price),
        category: editingProduct.cat.toLowerCase(),
        material: editingProduct.mat
      }).eq('id', editingProduct.id);
      
      if (error) throw error;
      showToast('Product updated successfully');
      setProductsData(productsData.map(p => p.id === editingProduct.id ? {...p, title: editingProduct.name, price: editingProduct.price, category: editingProduct.cat, material: editingProduct.mat } : p));
    } catch (err) {
      console.error(err);
      showToast('Error updating product');
    }
  };

  const [productsData, setProductsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const { data: pData } = await supabase.from('products').select('*');
        if (pData && pData.length > 0) setProductsData(pData);

        const { data: oData } = await supabase.from('orders').select('*');
        if (oData && oData.length > 0) setOrdersData(oData);
      } catch (err) {
        console.warn("Supabase not fully configured yet, using fallback data.");
      }
    }
    loadSupabaseData();
  }, []);

  const titles = {
    dashboard: 'Dashboard',
    products: 'All Products',
    collections: 'Collections',
    add: 'Add Product',
    customize: 'Customize Product',
    orders: 'View Orders'
  };

  const showToast = (msg) => {
    setToastMsg(msg || 'Saved');
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 2400);
  };

  const nav = (page) => {
    setActivePage(page);
  };

  const handleQtyAdj = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta)
    }));
  };

  const getQtyColor = (q) => {
    if (q <= 5) return 'var(--rd)';
    if (q <= 10) return 'var(--am)';
    return 'var(--tx)';
  };

  // SVG Graph logic
  const dailyData = [3, 5, 2, 8, 6, 11, 4, 7, 9, 5, 12, 8, 6, 10];
  const dailyLabels = ['Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20', 'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26'];
  const monthlyData = [18, 25, 32, 21, 38, 44, 29, 51, 36, 42, 55, 48];
  const monthlyLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

  const data = graphMode === 'daily' ? dailyData : monthlyData;
  const labels = graphMode === 'daily' ? dailyLabels : monthlyLabels;
  const max = Math.max(...data);
  const n = data.length;
  const W = 560;
  const H = 150;
  const pad = 10;
  const bpad = 20;
  const step = W / (n - 1);
  const pts = data.map((v, i) => [i * step, H - bpad - (v / max) * (H - pad - bpad)]);

  const areaPath = 'M' + pts.map(([x, y]) => x + ',' + y).join(' L') + ' L' + W + ',' + (H - bpad) + ' L0,' + (H - bpad) + ' Z';
  const linePath = 'M' + pts.map(([x, y]) => x + ',' + y).join(' L');
  const showLabelsIndices = graphMode === 'daily' ? [0, 3, 6, 9, 13] : labels.map((_, i) => i);

  return (
    <div className="admin-root">
      {!isAuthenticated ? (
        /* LOGIN SCREEN */
        <div className="admin-login-overlay">
          <div className="admin-login-card">
            <div className="admin-login-logo">
              <div className="admin-login-brand">MOLVBRIV</div>
              <div className="admin-login-subtitle">ADMIN PANEL</div>
            </div>
            <div className="admin-login-divider"></div>
            <h2 className="admin-login-title">Welcome back</h2>
            <p className="admin-login-desc">Sign in with your admin credentials</p>
            {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-login-field">
                <label className="admin-login-label">EMAIL</label>
                <input
                  type="email"
                  className={`admin-login-input ${loginError && loginError.includes('Email') ? 'error' : ''}`}
                  placeholder="admin@molvbriv.in"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  autoFocus
                />
              </div>
              <div className="admin-login-field">
                <label className="admin-login-label">PASSWORD</label>
                <input
                  type="password"
                  className={`admin-login-input ${loginError && !loginError.includes('Email') ? 'error' : ''}`}
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                />
                {loginError && <div className="admin-login-error">{loginError}</div>}
              </div>
              <button type="submit" className="admin-login-btn" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <span className="admin-login-spinner"></span>
                ) : 'Access Dashboard'}
              </button>
              <div className="admin-login-forgot" onClick={() => { setShowForgotPassword(true); setLoginError(''); }}>
                Forgot password?
              </div>
            </form>
            ) : (
            <div className="admin-login-form">
              <p className="admin-forgot-info">Enter your admin email and we'll send a password reset link.</p>
              <div className="admin-login-field">
                <label className="admin-login-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="admin-login-input"
                  placeholder="admin@molvbriv.in"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {forgotSent ? (
                <div className="admin-forgot-success">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8.5l3 3 7-7"/></svg>
                  <span>Reset link sent to {forgotEmail}</span>
                </div>
              ) : (
                <button className="admin-login-btn" onClick={() => { if (forgotEmail) setForgotSent(true); }}>
                  Send Reset Link
                </button>
              )}
              <div className="admin-login-forgot" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}>
                ← Back to login
              </div>
            </div>
            )}
            <div className="admin-login-footer">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>
              <span>Secured access · molvbriv.in</span>
            </div>
          </div>
        </div>
      ) : (
      <div className="w" style={{ position: 'relative' }}>
        {/* SIDEBAR */}
        <div className="sb">
          <div className="logo">
            <div className="ln">MOLVBRIV</div>
            <div className="lt">ADMIN PANEL</div>
          </div>
          <div className="nav">
            <div className="nl">OVERVIEW</div>
            <div className={`ni ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => nav('dashboard')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
              Dashboard
            </div>

            <div className="nl">CATALOGUE</div>
            <div className={`ni ${activePage === 'products' ? 'active' : ''}`} onClick={() => nav('products')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h8M2 12h5" /></svg>
              All Products
            </div>
            <div className={`ni ${activePage === 'collections' ? 'active' : ''}`} onClick={() => nav('collections')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="9" rx="1" /><rect x="9" y="6" width="6" height="9" rx="1" /><path d="M9 1h3M9 4h5" /></svg>
              Collections
            </div>
            <div className={`ni ${activePage === 'add' ? 'active' : ''}`} onClick={() => nav('add')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 5v6M5 8h6" /></svg>
              Add Product
            </div>
            <div className={`ni ${activePage === 'customize' ? 'active' : ''}`} onClick={() => nav('customize')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l8-8 2 2-8 8H2v-2z" /><path d="M11 3l2 2" /></svg>
              Customize Product
            </div>

            <div className="nl">SALES</div>
            <div className={`ni ${activePage === 'orders' ? 'active' : ''}`} onClick={() => nav('orders')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="3" width="13" height="11" rx="1" /><path d="M5 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M4 8h8M4 11h5" /></svg>
              View Orders
            </div>
          </div>
          <div className="sbf">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="av">M</div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500 }}>Admin</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu)' }}>molvbriv.in</div>
                </div>
              </div>
              <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M6 8h8"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="ct">
          <div className="tb">
            <div className="tt" id="topTitle">{titles[activePage] || 'Dashboard'}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu)', background: 'var(--s2)', border: '1px solid var(--b1)', padding: '5px 10px', borderRadius: '5px' }}>Apr 2026</div>
          </div>
          <div className="mn">

            {/* DASHBOARD */}
            <div className={`pg ${activePage === 'dashboard' ? 'active' : ''}`}>
              <div className="kg">
                <div className="kc"><div className="kl">TOTAL REVENUE</div><div className="kv">48,200</div><div className="ks ku">+12.4% this month</div></div>
                <div className="kc"><div className="kl">PRODUCTS LISTED</div><div className="kv">24</div><div className="ks ku">+3 added this week</div></div>
                <div className="kc"><div className="kl">ORDERS THIS MONTH</div><div className="kv">138</div><div className="ks kd">-4 from last month</div></div>
                <div className="kc"><div className="kl">PENDING DISPATCH</div><div className="kv">7</div><div className="ks" style={{ color: 'var(--mu)' }}>Needs attention</div></div>
              </div>
              <div className="dg">
                <div className="cd">
                  <div className="ch"><div className="ctl">Recent Orders</div><div className="ca" onClick={() => nav('orders')}>View all</div></div>
                  <div className="tr"><div><div className="tm">#MLV-1041 — Priya Sharma</div><div className="ts">Kundan Necklace · Apr 25</div></div><span className="bg bgn">Delivered</span></div>
                  <div className="tr"><div><div className="tm">#MLV-1040 — Ananya R.</div><div className="ts">Polki Jhumka · Apr 24</div></div><span className="bg bga">Shipped</span></div>
                  <div className="tr"><div><div className="tm">#MLV-1039 — Meera V.</div><div className="ts">Rani Haar Set · Apr 23</div></div><span className="bg bgg">Processing</span></div>
                  <div className="tr"><div><div className="tm">#MLV-1038 — Divya K.</div><div className="ts">Pearl Drop Earrings · Apr 22</div></div><span className="bg bgn">Delivered</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="cd">
                    <div className="ch"><div className="ctl">Sales by Category</div></div>
                    <div className="br">
                      <div className="bi"><div className="bl"><span className="bn">Necklace</span><span className="bv">38%</span></div><div className="btr"><div className="bf" style={{ width: '38%' }}></div></div></div>
                      <div className="bi"><div className="bl"><span className="bn">Jhumka</span><span className="bv">29%</span></div><div className="btr"><div className="bf" style={{ width: '29%' }}></div></div></div>
                      <div className="bi"><div className="bl"><span className="bn">Earrings</span><span className="bv">21%</span></div><div className="btr"><div className="bf" style={{ width: '21%' }}></div></div></div>
                      <div className="bi"><div className="bl"><span className="bn">Bangles</span><span className="bv">12%</span></div><div className="btr"><div className="bf" style={{ width: '12%' }}></div></div></div>
                    </div>
                  </div>
                  <div className="cd">
                    <div className="ch"><div className="ctl">Recent Activity</div></div>
                    <div className="al">
                      <div className="ai"><div className="ad"></div><div><div className="at">New product "Chandbali Set" added</div><div className="ati">2 hours ago</div></div></div>
                      <div className="ai"><div className="ad" style={{ background: 'var(--gn)' }}></div><div><div className="at">Order #1041 marked delivered</div><div className="ati">5 hours ago</div></div></div>
                      <div className="ai"><div className="ad" style={{ background: 'var(--am)' }}></div><div><div className="at">Stock low: Floral Studs (2 left)</div><div className="ati">Yesterday</div></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ALL PRODUCTS */}
            <div className={`pg ${activePage === 'products' ? 'active' : ''}`}>
              <div className="ctb">
                <input className="si si-search" type="text" placeholder="Search products by name or SKU..." />
                <select className="si si-sel" style={{ width: '140px' }}>
                  <option>All Categories</option>
                  <option>Jhumka</option><option>Earrings</option><option>Necklace</option><option>Bangles</option><option>Rings</option><option>Maang Tikka</option>
                </select>
                <select className="si si-sel" style={{ width: '110px' }}>
                  <option>All Status</option>
                  <option>Live</option><option>Draft</option><option>Low Stock</option>
                </select>
                <button className="btn btn-p" onClick={() => nav('add')}>+ Add Product</button>
              </div>
              <div className="pt">
                <div className="ph ph5"><span>PRODUCT NAME</span><span>CATEGORY</span><span>PRICE</span><span>STATUS</span><span>ACTIONS</span></div>
                {productsData.length > 0 ? productsData.map(p => (
                  <div key={p.id} className="pr pr5"><div><div className="pn">{p.title}</div><div className="pc">{p.material} · SKU: {p.sku || p.id?.substring(0,8)}</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>{p.category || 'General'}</span><span className="pp">Rs {p.price}</span><span className={`bg ${p.status === 'live' ? 'bgn' : 'bgg'}`}>{p.status}</span><div className="rab"><button className="ab" onClick={() => { setEditingProduct(p); nav('customize'); }}>Edit</button><button className="ab" onClick={() => handleDeleteProduct(p.id)}>Remove</button></div></div>
                )) : (
                  <>
                    <div className="pr pr5"><div><div className="pn">Polki Jhumka Set</div><div className="pc">Gold Plated · SKU: MLV-JHM-001</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span className="pp">Rs 1,299</span><span className="bg bgn">Live</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                    <div className="pr pr5"><div><div className="pn">Kundan Necklace</div><div className="pc">Kundan · SKU: MLV-NCK-002</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Necklace</span><span className="pp">Rs 2,899</span><span className="bg bgn">Live</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                    <div className="pr pr5"><div><div className="pn">Floral Ear Studs</div><div className="pc">Silver · SKU: MLV-EAR-003</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Earrings</span><span className="pp">Rs 649</span><span className="bg bga" style={{ background: 'rgba(224,82,82,.12)', color: 'var(--rd)' }}>Low Stock</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                    <div className="pr pr5"><div><div className="pn">Chandbali Jhumka</div><div className="pc">Antique · SKU: MLV-JHM-004</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span className="pp">Rs 1,599</span><span className="bg bgg">Draft</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                    <div className="pr pr5"><div><div className="pn">Pearl Drop Earrings</div><div className="pc">Pearl · SKU: MLV-EAR-005</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Earrings</span><span className="pp">Rs 899</span><span className="bg bgn">Live</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                    <div className="pr pr5"><div><div className="pn">Rani Haar Set</div><div className="pc">Bridal · SKU: MLV-NCK-006</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Necklace</span><span className="pp">Rs 4,999</span><span className="bg bgn">Live</span><div className="rab"><button className="ab">Edit</button><button className="ab">Remove</button></div></div>
                  </>
                )}
              </div>
            </div>

            {/* COLLECTIONS */}
            <div className={`pg ${activePage === 'collections' ? 'active' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--mu)' }}>Select a collection to manage stock quantities.</div>
                <button className="btn btn-p" onClick={() => showToast('New collection created')}>+ New Collection</button>
              </div>
              <div className="col-grid">
                <div className={`col-card ${selectedCollection === 'Jhumka' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Jhumka')}>
                  <div className="col-name">Jhumka</div>
                  <div className="col-count">4 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '72%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>72 units</span></div>
                </div>
                <div className={`col-card ${selectedCollection === 'Earrings' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Earrings')}>
                  <div className="col-name">Earrings</div>
                  <div className="col-count">5 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '48%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>48 units</span></div>
                </div>
                <div className={`col-card ${selectedCollection === 'Necklace' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Necklace')}>
                  <div className="col-name">Necklace</div>
                  <div className="col-count">3 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '35%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>35 units</span></div>
                </div>
                <div className={`col-card ${selectedCollection === 'Bangles' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Bangles')}>
                  <div className="col-name">Bangles</div>
                  <div className="col-count">2 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '60%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>60 units</span></div>
                </div>
                <div className={`col-card ${selectedCollection === 'Bridal Set' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Bridal Set')}>
                  <div className="col-name">Bridal Set</div>
                  <div className="col-count">2 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '20%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--rd)', fontWeight: 500 }}>8 units</span></div>
                </div>
                <div className={`col-card ${selectedCollection === 'Maang Tikka' ? 'sel' : ''}`} onClick={() => setSelectedCollection('Maang Tikka')}>
                  <div className="col-name">Maang Tikka</div>
                  <div className="col-count">2 products</div>
                  <div className="col-bar"><div className="col-fill" style={{ width: '55%' }}></div></div>
                  <div className="col-stock"><span>Total stock</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>55 units</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }}>{selectedCollection} — Stock Management</div>
                <button className="btn btn-p" onClick={() => showToast('Stock updated successfully')}>Save Stock</button>
              </div>
              <div className="stock-table">
                <div className="sth"><span>PRODUCT</span><span>CATEGORY</span><span>PRICE</span><span>STOCK</span><span>STATUS</span></div>
                <div>
                  <div className="str"><div><div className="pn">Polki Jhumka Set</div><div className="pc">Gold Plated</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>Rs 1,299</span><div className="sq"><button className="sq-btn" onClick={() => handleQtyAdj('p1', -1)}>-</button><span className="sq-val" style={{ color: getQtyColor(quantities.p1) }}>{quantities.p1}</span><button className="sq-btn" onClick={() => handleQtyAdj('p1', 1)}>+</button></div><span className="bg bgn">Live</span></div>
                  <div className="str"><div><div className="pn">Chandbali Jhumka</div><div className="pc">Antique</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>Rs 1,599</span><div className="sq"><button className="sq-btn" onClick={() => handleQtyAdj('p2', -1)}>-</button><span className="sq-val" style={{ color: getQtyColor(quantities.p2) }}>{quantities.p2}</span><button className="sq-btn" onClick={() => handleQtyAdj('p2', 1)}>+</button></div><span className="bg bgn">Live</span></div>
                  <div className="str"><div><div className="pn">Temple Jhumka</div><div className="pc">Oxidised</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>Rs 1,099</span><div className="sq"><button className="sq-btn" onClick={() => handleQtyAdj('p3', -1)}>-</button><span className="sq-val" style={{ color: getQtyColor(quantities.p3) }}>{quantities.p3}</span><button className="sq-btn" onClick={() => handleQtyAdj('p3', 1)}>+</button></div><span className="bg bgg">Draft</span></div>
                  <div className="str"><div><div className="pn">Meenakari Jhumka</div><div className="pc">Meenakari</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>Jhumka</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>Rs 1,349</span><div className="sq"><button className="sq-btn" onClick={() => handleQtyAdj('p4', -1)}>-</button><span className="sq-val" style={{ color: getQtyColor(quantities.p4) }}>{quantities.p4}</span><button className="sq-btn" onClick={() => handleQtyAdj('p4', 1)}>+</button></div><span className="bg bga" style={{ background: 'rgba(224,82,82,.12)', color: 'var(--rd)' }}>Low Stock</span></div>
                </div>
              </div>
            </div>

            {/* ADD PRODUCT */}
            <div className={`pg ${activePage === 'add' ? 'active' : ''}`}>
              <div className="fs"><div className="fst">Basic Information</div>
                <div className="fg2">
                  <div className="fg"><label>PRODUCT NAME</label><input className="fi" type="text" placeholder="e.g. Polki Jhumka Set" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} /></div>
                  <div className="fg"><label>CATEGORY</label><select className="fi" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option value="">Select</option><option>Jhumka</option><option>Earrings</option><option>Necklace</option><option>Bangles</option><option>Rings</option><option>Maang Tikka</option><option>Bridal Set</option></select></div>
                  <div className="fg"><label>SELLING PRICE (Rs)</label><input className="fi" type="number" placeholder="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
                  <div className="fg"><label>COMPARE PRICE (Rs)</label><input className="fi" type="number" placeholder="Optional" /></div>
                  <div className="fg"><label>MATERIAL / FINISH</label><select className="fi" value={newProduct.material} onChange={e => setNewProduct({...newProduct, material: e.target.value})}><option value="">Select</option><option>Gold Plated</option><option>Silver</option><option>Kundan</option><option>Antique</option><option>Pearl</option><option>Meenakari</option><option>Oxidised</option></select></div>
                  <div className="fg"><label>STOCK QUANTITY</label><input className="fi" type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} /></div>
                  <div className="fg full"><label>DESCRIPTION</label><textarea className="fi" placeholder="Design, occasion, weight, size..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea></div>
                </div>
              </div>
              <div className="fs"><div className="fst">Images & Variants</div>
                <div className="uz" style={{ marginBottom: '11px' }}><div className="ul">Click to upload product images</div><div className="uh">JPG, PNG, WEBP · Max 5MB each</div></div>
                <div className="fg2">
                  <div className="fg"><label>AVAILABLE COLORS</label><input className="fi" type="text" placeholder="e.g. Gold, Silver, Rose Gold" /></div>
                  <div className="fg"><label>SKU / PRODUCT CODE</label><input className="fi" type="text" placeholder="e.g. MLV-JHM-001" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} /></div>
                  <div className="fg full"><label>TAGS</label><input className="fi" type="text" placeholder="bridal, festive, traditional, bestseller" /></div>
                </div>
              </div>
              <div className="fa"><button className="btn btn-p" onClick={() => handleAddProduct('live')}>Publish Product</button><button className="btn" onClick={() => handleAddProduct('draft')}>Save as Draft</button></div>
            </div>

            {/* CUSTOMIZE PRODUCT */}
            <div className={`pg ${activePage === 'customize' ? 'active' : ''}`}>
              <div style={{ fontSize: '12px', color: 'var(--mu)', marginBottom: '12px' }}>Select a product to edit its details, colors, images and pricing.</div>
              <div className="ce-top">
                <button className={`cet ${customizeFilter === 'all' ? 'active' : ''}`} onClick={() => setCustomizeFilter('all')}>All</button>
                <button className={`cet ${customizeFilter === 'jhumka' ? 'active' : ''}`} onClick={() => setCustomizeFilter('jhumka')}>Jhumka</button>
                <button className={`cet ${customizeFilter === 'earrings' ? 'active' : ''}`} onClick={() => setCustomizeFilter('earrings')}>Earrings</button>
                <button className={`cet ${customizeFilter === 'necklace' ? 'active' : ''}`} onClick={() => setCustomizeFilter('necklace')}>Necklace</button>
                <button className={`cet ${customizeFilter === 'bangles' ? 'active' : ''}`} onClick={() => setCustomizeFilter('bangles')}>Bangles</button>
              </div>
              <div className="peg">
                {productsData.length > 0 ? productsData.filter(p => customizeFilter === 'all' || p.category === customizeFilter).map(p => (
                  <div key={p.id} className={`pec ${editingProduct.id === p.id ? 'sel' : ''}`} onClick={() => setEditingProduct({ id: p.id, name: p.title, cat: p.category || '', mat: p.material || '', price: p.price })}>
                    <div className="pen">{p.title}</div>
                    <div className="pec2">{(p.category || 'General').charAt(0).toUpperCase() + (p.category || 'General').slice(1)} · {p.material}</div>
                    <div className="pep">Rs {p.price}</div>
                  </div>
                )) : (
                  [
                    { name: 'Polki Jhumka Set', cat: 'jhumka', mat: 'Gold Plated', price: '1299' },
                    { name: 'Kundan Necklace', cat: 'necklace', mat: 'Kundan', price: '2899' },
                    { name: 'Floral Ear Studs', cat: 'earrings', mat: 'Silver', price: '649' },
                    { name: 'Chandbali Jhumka', cat: 'jhumka', mat: 'Antique', price: '1599' },
                    { name: 'Pearl Drop Earrings', cat: 'earrings', mat: 'Pearl', price: '899' },
                    { name: 'Rani Haar Set', cat: 'necklace', mat: 'Bridal', price: '4999' }
                  ].filter(p => customizeFilter === 'all' || p.cat === customizeFilter).map(p => (
                    <div key={p.name} className={`pec ${editingProduct.name === p.name ? 'sel' : ''}`} onClick={() => setEditingProduct(p)}>
                      <div className="pen">{p.name}</div>
                      <div className="pec2">{p.cat.charAt(0).toUpperCase() + p.cat.slice(1)} · {p.mat}</div>
                      <div className="pep">Rs {p.price}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="ep">
                <div className="en">Editing: {editingProduct.name}</div>
                <div className="fg2">
                  <div className="fg"><label>PRODUCT NAME</label><input className="fi" type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
                  <div className="fg"><label>PRICE (Rs)</label><input className="fi" type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} /></div>
                  <div className="fg"><label>CATEGORY</label>
                    <select className="fi" value={editingProduct.cat.charAt(0).toUpperCase() + editingProduct.cat.slice(1)} onChange={(e) => setEditingProduct({ ...editingProduct, cat: e.target.value.toLowerCase() })}>
                      <option>Jhumka</option><option>Earrings</option><option>Necklace</option><option>Bangles</option>
                    </select>
                  </div>
                  <div className="fg"><label>MATERIAL</label>
                    <select className="fi" value={editingProduct.mat} onChange={(e) => setEditingProduct({ ...editingProduct, mat: e.target.value })}>
                      <option>Gold Plated</option><option>Silver</option><option>Kundan</option><option>Antique</option><option>Pearl</option>
                    </select>
                  </div>
                  <div className="fg full"><label>DESCRIPTION</label><textarea className="fi" placeholder="Update product description..."></textarea></div>
                  <div className="fg full"><label>COLOR VARIANTS</label>
                    <div className="clo">
                      {['#C9A84C', '#C0C0C0', '#B76E79', '#1C1C1C', '#8B6914'].map((color, idx) => (
                        <div key={color} className={`cl ${activeColor === idx ? 'active' : ''}`} style={{ background: color }} onClick={() => setActiveColor(idx)}></div>
                      ))}
                    </div>
                  </div>
                  <div className="fg full"><label>PRODUCT IMAGES</label><div className="ig"><div className="isl">+</div><div className="isl">+</div><div className="isl">+</div><div className="isl">+</div></div></div>
                  <div className="fg"><label>STATUS</label><select className="fi"><option>Live</option><option>Draft</option><option>Out of Stock</option></select></div>
                  <div className="fg"><label>STOCK QUANTITY</label><input className="fi" type="number" defaultValue="24" /></div>
                </div>
                <div className="fa" style={{ marginTop: '13px' }}>
                  <button className="btn btn-p" onClick={handleUpdateProduct}>Save Changes</button>
                  <button className="btn">Discard</button>
                </div>
              </div>
            </div>

            {/* VIEW ORDERS */}
            <div className={`pg ${activePage === 'orders' ? 'active' : ''}`}>
              <div className="graph-wrap">
                <div className="graph-head">
                  <div className="ctl">Sales Overview</div>
                  <div className="graph-tabs">
                    <button className={`gt ${graphMode === 'daily' ? 'active' : ''}`} onClick={() => setGraphMode('daily')}>Daily</button>
                    <button className={`gt ${graphMode === 'monthly' ? 'active' : ''}`} onClick={() => setGraphMode('monthly')}>Monthly</button>
                  </div>
                </div>
                <div className="graph-canvas">
                  <svg className="graph-svg" viewBox="0 0 560 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5B6CFF" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#5B6CFF" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#g)" />
                    <path d={linePath} fill="none" stroke="#5B6CFF" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="#5B6CFF" />
                        <text x={x} y={y - 7} textAnchor="middle" fontSize="9" fill="#6B7280">{data[i]}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  {labels.filter((_, i) => showLabelsIndices.includes(i)).map(l => (
                    <span key={l} style={{ fontSize: '10px', color: 'var(--mu)' }}>{l}</span>
                  ))}
                </div>
              </div>
              <div className="o-filter">
                <button className={`of ${orderFilter === 'all' ? 'active' : ''}`} onClick={() => setOrderFilter('all')}>All (12)</button>
                <button className={`of ${orderFilter === 'processing' ? 'active' : ''}`} onClick={() => setOrderFilter('processing')}>Processing (3)</button>
                <button className={`of ${orderFilter === 'shipped' ? 'active' : ''}`} onClick={() => setOrderFilter('shipped')}>Shipped (2)</button>
                <button className={`of ${orderFilter === 'delivered' ? 'active' : ''}`} onClick={() => setOrderFilter('delivered')}>Delivered (7)</button>
              </div>
              <div className="ot">
                <div className="oh"><span>ORDER ID</span><span>CUSTOMER</span><span>PRODUCT</span><span>AMOUNT</span><span>STATUS</span></div>
                {ordersData.length > 0 ? ordersData.filter(o => orderFilter === 'all' || o.status.toLowerCase() === orderFilter).map(o => (
                  <div key={o.id} className="or">
                    <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{o.order_number}</span>
                    <span style={{ color: 'var(--mu)' }}>{o.customer_name}</span>
                    <span style={{ color: 'var(--mu)' }}>{o.product_name}</span>
                    <span style={{ color: 'var(--tx)' }}>Rs {o.total_price}</span>
                    <span className={`bg ${o.status === 'Delivered' ? 'bgn' : (o.status === 'Processing' ? 'bgg' : 'bga')}`}>{o.status}</span>
                  </div>
                )) : (
                  <>
                  {[
                    { id: '#MLV-1041', name: 'Priya Sharma', item: 'Kundan Necklace', amt: 'Rs 2,899', st: 'Delivered', c: 'bgn' },
                    { id: '#MLV-1040', name: 'Ananya R.', item: 'Polki Jhumka', amt: 'Rs 1,299', st: 'Shipped', c: 'bga' },
                    { id: '#MLV-1039', name: 'Meera V.', item: 'Rani Haar Set', amt: 'Rs 4,999', st: 'Processing', c: 'bgg' },
                    { id: '#MLV-1038', name: 'Divya K.', item: 'Pearl Drop Earrings', amt: 'Rs 899', st: 'Delivered', c: 'bgn' },
                    { id: '#MLV-1037', name: 'Ritu M.', item: 'Floral Ear Studs', amt: 'Rs 649', st: 'Delivered', c: 'bgn' },
                    { id: '#MLV-1036', name: 'Sunita P.', item: 'Chandbali Jhumka', amt: 'Rs 1,599', st: 'Processing', c: 'bgg' }
                  ].filter(o => orderFilter === 'all' || o.st.toLowerCase() === orderFilter).map(o => (
                    <div key={o.id} className="or">
                      <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{o.id}</span>
                      <span style={{ color: 'var(--mu)' }}>{o.name}</span>
                      <span style={{ color: 'var(--mu)' }}>{o.item}</span>
                      <span style={{ color: 'var(--tx)' }}>{o.amt}</span>
                      <span className={`bg ${o.c}`}>{o.st}</span>
                    </div>
                  ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
        <div className={`toast ${isToastVisible ? 'show' : ''}`}>
          <div className="td"></div>
          <span>{toastMsg}</span>
        </div>
      </div>
      )}
    </div>
  );
}
