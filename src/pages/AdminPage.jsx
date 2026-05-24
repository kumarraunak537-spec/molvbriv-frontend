import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminPage.css';

export default function AdminPage() {
  // Login gate state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState({ name: '', email: '' });

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile?.role === 'admin') {
          setIsAuthenticated(true);
          setAdminUser({
            name: session.user.email.split('@')[0],
            email: session.user.email
          });
        }
      }
      setAuthChecked(true);
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error('Admin Auth Error:', error);
        setLoginError(error.message || 'Invalid email or password.');
        setIsLoggingIn(false);
        return;
      }

      const user = data.user;
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Fallback: If no profile exists but it's the primary admin email, create it
      if (profileError && profileError.code === 'PGRST116' && user.email === 'roy839693@gmail.com') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, email: user.email, role: 'admin' }])
          .select()
          .single();
        
        if (!createError) {
          profile = newProfile;
          profileError = null;
        }
      }

      if (profileError) {
        console.error('Admin Profile Fetch Error:', profileError);
        await supabase.auth.signOut();
        setLoginError(`Access denied: Profile error (${profileError.message}).`);
      } else if (profile?.role === 'admin') {
        setIsAuthenticated(true);
        setAdminUser({
          name: user.email.split('@')[0],
          email: user.email
        });
      } else {
        await supabase.auth.signOut();
        setLoginError(`Access denied: You do not have admin privileges.`);
      }
    } catch (err) {
      console.error('Admin Login Try/Catch Error:', err);
      setLoginError(err.message || 'Something went wrong. Try again.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const [activePage, setActivePage] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState('Saved');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [graphMode, setGraphMode] = useState('daily');
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [customizeFilter, setCustomizeFilter] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('Jhumka');

  const [editingProduct, setEditingProduct] = useState(null);
  const [activeColor, setActiveColor] = useState(0);

  // Quantities state for Collections page
  const [quantities, setQuantities] = useState({});

  const [newProduct, setNewProduct] = useState({
    title: '', category: '', price: '', comparePrice: '', material: '', stock: '', description: '', sku: ''
  });
  const [productImages, setProductImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleProductImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingImages(true);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { showToast('File too large: ' + file.name); continue; }
      if (!file.type.startsWith('image/')) { showToast('Not an image: ' + file.name); continue; }
      try {
        const fileName = `products/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) { showToast('Upload failed: ' + error.message); continue; }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        uploaded.push(urlData.publicUrl);
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    }
    if (uploaded.length > 0) {
      setProductImages(prev => [...prev, ...uploaded]);
      showToast(uploaded.length + ' image(s) uploaded');
    }
    setIsUploadingImages(false);
    e.target.value = '';
  };

  const handleAddProduct = async (status = 'live') => {
    try {
      if (!newProduct.title) return showToast('Product name is required');
      
      // Auto-generate slug from title
      const slug = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      
      const productData = {
        title: newProduct.title,
        slug: slug,
        category: newProduct.category.toLowerCase(),
        price: parseFloat(newProduct.price) || 0,
        compare_price: parseFloat(newProduct.comparePrice) || null,
        material: newProduct.material,
        stock: parseInt(newProduct.stock) || 0,
        description: newProduct.description,
        sku: newProduct.sku || null,
        status: status,
        images: productImages.length > 0 ? productImages : []
      };
      
      const { data, error } = await supabase.from('products').insert([productData]).select();
      
      if (error) throw error;
      setProductsData([...productsData, data[0]]);
      showToast(status === 'live' ? 'Product published successfully' : 'Saved as draft');
      setNewProduct({ title: '', category: '', price: '', comparePrice: '', material: '', stock: '', description: '', sku: '' });
      setProductImages([]);
      nav('products');
    } catch (err) {
      console.error('Product Add Error:', err);
      window.alert('PUBLISH ERROR:\n' + (err.message || JSON.stringify(err)) + '\n\nCode: ' + (err.code || 'N/A') + '\nDetails: ' + (err.details || 'N/A') + '\nHint: ' + (err.hint || 'N/A'));
      showToast('Error: ' + (err.message || 'Failed to save product'));
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
      if (!editingProduct.id) return showToast('Cannot update product: Missing ID');
      const { error } = await supabase.from('products').update({
        title: editingProduct.title || editingProduct.name, // Handle both name/title mapping
        price: parseFloat(editingProduct.price),
        compare_price: parseFloat(editingProduct.compare_price) || null,
        category: editingProduct.category || editingProduct.cat,
        material: editingProduct.material || editingProduct.mat,
      }).eq('id', editingProduct.id);
      
      if (error) throw error;
      showToast('Product updated');
      setEditingProduct(null);
      // Refresh data
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProductsData(data);
    } catch (err) {
      console.error(err);
      showToast('Error updating product');
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ 
        order_status: newStatus, 
        status: newStatus.toLowerCase() 
      }).eq('id', id);
      if (error) throw error;
      setOrdersData(prev => prev.map(o => o.id === id ? { ...o, order_status: newStatus, status: newStatus } : o));
      showToast(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [isLogisticsLoading, setIsLogisticsLoading] = useState(false);
  const [logisticsError, setLogisticsError] = useState('');
  const [liveTrackingInfo, setLiveTrackingInfo] = useState(null);
  const [showLogisticsHistory, setShowLogisticsHistory] = useState(false);

  useEffect(() => {
    setLiveTrackingInfo(null);
    setShowLogisticsHistory(false);
    setLogisticsError('');
  }, [selectedAdminOrder?.id]);

  const handleInitializeShipment = async (orderId) => {
    setIsLogisticsLoading(true);
    setLogisticsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/shiprocket/create-shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize shipment on Shiprocket');
      }
      showToast('Shipment created successfully!');
      setSelectedAdminOrder(data.order);
      setOrdersData(prev => prev.map(o => o.id === orderId ? data.order : o));
    } catch (err) {
      console.error(err);
      setLogisticsError(err.message || 'Fulfillment request failed.');
      showToast('Fulfillment failed');
    } finally {
      setIsLogisticsLoading(false);
    }
  };

  const handleTrackShipment = async (awbCode) => {
    setIsLogisticsLoading(true);
    setLogisticsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/shiprocket/track/${awbCode}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to query live tracking updates');
      }
      setLiveTrackingInfo(data);
      setShowLogisticsHistory(true);
      showToast('Tracking data synced!');
    } catch (err) {
      console.error(err);
      setLogisticsError(err.message || 'Tracking query failed.');
      showToast('Tracking query failed');
    } finally {
      setIsLogisticsLoading(false);
    }
  };

  const handleCancelShipment = async (orderId, shiprocketOrderId) => {
    setIsLogisticsLoading(true);
    setLogisticsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/shiprocket/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, shiprocketOrderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel shipment');
      }
      showToast('Shipment cancelled successfully!');
      setSelectedAdminOrder(data.order);
      setOrdersData(prev => prev.map(o => o.id === orderId ? data.order : o));
      setLiveTrackingInfo(null);
      setShowLogisticsHistory(false);
    } catch (err) {
      console.error(err);
      setLogisticsError(err.message || 'Cancellation request failed.');
      showToast('Cancellation failed');
    } finally {
      setIsLogisticsLoading(false);
    }
  };

  const [productsData, setProductsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const { data: pData, error: pErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProductsData(pData);
        if (pErr) throw pErr;

        const { data: oData, error: oErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrdersData(oData);
        if (oErr) throw oErr;

        const { data: sData } = await supabase.from('site_settings').select('value').eq('key', 'favicon_url').single();
        if (sData) setFaviconUrl(sData.value);
      } catch (err) {
        console.error("Error loading data:", err.message);
      }
    }

    let subscription;
    if (isAuthenticated) {
      loadSupabaseData();

      // Realtime listener for order modifications (anti-delay, realtime refresh)
      subscription = supabase
        .channel('admin-realtime-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
          console.log('Realtime Order Event received:', payload);
          const { data: newOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (newOrders) setOrdersData(newOrders);
          showToast('Live orders updated');
        })
        .subscribe();
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('File too large. Max 2MB.');
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) return showToast('Please upload a valid image file.');

    setIsUploadingFavicon(true);
    try {
      const fileName = `favicon-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('product-images').upload(`assets/${fileName}`, file);
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(`assets/${fileName}`);
      const url = publicUrlData.publicUrl + '?v=' + Date.now();
      
      const { error: dbError } = await supabase.from('site_settings').upsert({ key: 'favicon_url', value: url });
      if (dbError) throw dbError;

      setFaviconUrl(url);
      showToast('Favicon updated successfully');
    } catch (err) {
      console.error('Favicon Upload Error:', err);
      window.alert('ERROR: ' + err.message + '\n\nDetails: ' + JSON.stringify(err));
      if (err.message && err.message.includes('relation "public.site_settings" does not exist')) {
        showToast('Error: Create site_settings table in Supabase first!');
      } else {
        showToast('Error: ' + (err.message || 'Failed to upload'));
      }
    }
    setIsUploadingFavicon(false);
  };

  const titles = {
    dashboard: 'Dashboard',
    products: 'All Products',
    collections: 'Collections',
    add: 'Add Product',
    customize: 'Customize Product',
    orders: 'View Orders',
    settings: 'Website Settings'
  };

  const showToast = (msg) => {
    setToastMsg(msg || 'Saved');
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 2400);
  };

  const nav = (page) => {
    setActivePage(page);
  };

  const handleQtyAdj = async (id, delta) => {
    const currentQty = productsData.find(p => p.id === id)?.stock || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    try {
      const { error } = await supabase.from('products').update({ stock: newQty }).eq('id', id);
      if (error) throw error;
      
      setProductsData(prev => prev.map(p => p.id === id ? { ...p, stock: newQty } : p));
      showToast(`Stock updated to ${newQty}`);
    } catch (err) {
      console.error("Stock update error:", err.message);
      showToast('Failed to update stock');
    }
  };

  const getQtyColor = (q) => {
    if (q <= 5) return 'var(--rd)';
    if (q <= 10) return 'var(--am)';
    return 'var(--tx)';
  };

  // SVG Graph logic - uses real orders data when available
  const dailyData = ordersData.length > 0 ? [ordersData.length] : [0];
  const dailyLabels = ['Today'];
  const monthlyData = [0];
  const monthlyLabels = ['This Month'];

  const data = graphMode === 'daily' ? dailyData : monthlyData;
  const labels = graphMode === 'daily' ? dailyLabels : monthlyLabels;
  const max = Math.max(...data, 1);
  const n = Math.max(data.length, 1);
  const W = 560;
  const H = 150;
  const pad = 10;
  const bpad = 20;
  const step = n > 1 ? W / (n - 1) : W;
  const pts = data.map((v, i) => [n > 1 ? i * step : W / 2, H - bpad - (v / max) * (H - pad - bpad)]);

  const areaPath = 'M' + pts.map(([x, y]) => x + ',' + y).join(' L') + ' L' + W + ',' + (H - bpad) + ' L0,' + (H - bpad) + ' Z';
  const linePath = 'M' + pts.map(([x, y]) => x + ',' + y).join(' L');
  const showLabelsIndices = labels.map((_, i) => i);

  const filteredOrders = ordersData.filter(o => {
    const matchesSearch = 
      (o.razorpay_order_id || o.id || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.customer_email || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.customer_phone || '').includes(orderSearchQuery) ||
      (o.payment_id || '').toLowerCase().includes(orderSearchQuery.toLowerCase());

    const statusVal = o.order_status || o.status || 'Pending';
    const matchesStatus = orderStatusFilter === 'all' || statusVal.toLowerCase() === orderStatusFilter.toLowerCase();

    const payVal = o.payment_status || 'Pending';
    const matchesPayment = orderPaymentFilter === 'all' || payVal.toLowerCase() === orderPaymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="admin-root">
      {!authChecked ? (
        <div className="admin-login-overlay">
          <div className="admin-login-spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></div>
        </div>
      ) : !isAuthenticated ? (
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
                <button className="admin-login-btn" onClick={async () => { 
                  if (forgotEmail) {
                    await supabase.auth.resetPasswordForEmail(forgotEmail);
                    setForgotSent(true);
                  }
                }}>
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
            
            <div className="nl">SYSTEM</div>
            <div className={`ni ${activePage === 'settings' ? 'active' : ''}`} onClick={() => nav('settings')}>
              <svg className="nic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M14 8h-1m-1 3.5l1 1M11.5 14v-1M4.5 14v-1M2 8h1M3 4.5l-1-1M8 2v1M13 4.5l-1-1M4.5 3l-1-1" /></svg>
              Settings
            </div>
          </div>
          <div className="sbf">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="av">{(adminUser.name || 'A').charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500 }}>{adminUser.name || 'Admin'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu)' }}>{adminUser.email || 'molvbriv.in'}</div>
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

            <div className={`pg ${activePage === 'dashboard' ? 'active' : ''}`}>
              <div className="kg">
                <div className="kc"><div className="kl">TOTAL REVENUE</div><div className="kv">{ordersData.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0).toLocaleString()}</div><div className="ks ku">From {ordersData.length} orders</div></div>
                <div className="kc"><div className="kl">PRODUCTS LISTED</div><div className="kv">{productsData.length}</div><div className="ks ku">Active in catalogue</div></div>
                <div className="kc"><div className="kl">TOTAL ORDERS</div><div className="kv">{ordersData.length}</div><div className="ks" style={{ color: 'var(--mu)' }}>All time</div></div>
                <div className="kc"><div className="kl">PENDING DISPATCH</div><div className="kv">{ordersData.filter(o => o.status === 'Processing').length}</div><div className="ks" style={{ color: 'var(--mu)' }}>{ordersData.filter(o => o.status === 'Processing').length > 0 ? 'Needs attention' : 'All clear'}</div></div>
              </div>
              <div className="dg">
                <div className="cd">
                  <div className="ch"><div className="ctl">Recent Orders</div><div className="ca" onClick={() => nav('orders')}>View all</div></div>
                  {ordersData.length > 0 ? ordersData.slice(0, 4).map(o => (
                    <div key={o.id} className="tr"><div><div className="tm">{o.order_number} — {o.customer_name}</div><div className="ts">{o.product_name}</div></div><span className={`bg ${o.status === 'Delivered' ? 'bgn' : (o.status === 'Processing' ? 'bgg' : 'bga')}`}>{o.status}</span></div>
                  )) : (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No orders yet</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="cd">
                    <div className="ch"><div className="ctl">Products by Category</div></div>
                    <div className="br">
                      {productsData.length > 0 ? [...new Set(productsData.map(p => p.category))].map(cat => {
                        const count = productsData.filter(p => p.category === cat).length;
                        const pct = Math.round((count / productsData.length) * 100);
                        return (
                          <div key={cat} className="bi"><div className="bl"><span className="bn">{(cat || 'Other').charAt(0).toUpperCase() + (cat || 'Other').slice(1)}</span><span className="bv">{pct}%</span></div><div className="btr"><div className="bf" style={{ width: pct + '%' }}></div></div></div>
                        );
                      }) : (
                        <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No products yet</div>
                      )}
                    </div>
                  </div>
                  <div className="cd">
                    <div className="ch"><div className="ctl">Quick Stats</div></div>
                    <div className="al">
                      <div className="ai"><div className="ad"></div><div><div className="at">{productsData.length} products in catalogue</div><div className="ati">Total listed</div></div></div>
                      <div className="ai"><div className="ad" style={{ background: 'var(--gn)' }}></div><div><div className="at">{ordersData.filter(o => o.status === 'Delivered').length} orders delivered</div><div className="ati">Completed</div></div></div>
                      <div className="ai"><div className="ad" style={{ background: 'var(--am)' }}></div><div><div className="at">{ordersData.filter(o => o.status === 'Shipped').length} orders in transit</div><div className="ati">Shipped</div></div></div>
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
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No products yet. Click "+ Add Product" to get started.</div>
                )}
              </div>
            </div>

            <div className={`pg ${activePage === 'collections' ? 'active' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--mu)' }}>Select a collection to manage stock quantities.</div>
                <button className="btn btn-p" onClick={() => showToast('New collection created')}>+ New Collection</button>
              </div>
              <div className="col-grid">
                {[...new Set(productsData.map(p => p.category))].map(cat => {
                  const catProducts = productsData.filter(p => p.category === cat);
                  const totalStock = catProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                  return (
                    <div key={cat} className={`col-card ${selectedCollection === cat ? 'sel' : ''}`} onClick={() => setSelectedCollection(cat)}>
                      <div className="col-name">{(cat || 'Other').charAt(0).toUpperCase() + (cat || 'Other').slice(1)}</div>
                      <div className="col-count">{catProducts.length} products</div>
                      <div className="col-bar"><div className="col-fill" style={{ width: Math.min(totalStock, 100) + '%' }}></div></div>
                      <div className="col-stock"><span>Total stock</span><span style={{ color: totalStock < 10 ? 'var(--rd)' : 'var(--tx)', fontWeight: 500 }}>{totalStock} units</span></div>
                    </div>
                  );
                })}
                {productsData.length === 0 && <div style={{ gridColumn: '1/-1', padding: '30px', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No collections yet. Add products first.</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }}>{selectedCollection ? (selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)) : 'Select a collection'} — Stock Management</div>
                <button className="btn btn-p" onClick={() => showToast('Stock updated successfully')}>Save Stock</button>
              </div>
              <div className="stock-table">
                <div className="sth"><span>PRODUCT</span><span>CATEGORY</span><span>PRICE</span><span>STOCK</span><span>STATUS</span></div>
                <div>
                  {productsData.filter(p => p.category === selectedCollection).map(p => (
                    <div key={p.id} className="str"><div><div className="pn">{p.title}</div><div className="pc">{p.material}</div></div><span style={{ color: 'var(--mu)', fontSize: '12px' }}>{(p.category || '').charAt(0).toUpperCase() + (p.category || '').slice(1)}</span><span style={{ color: 'var(--tx)', fontWeight: 500 }}>Rs {p.price}</span><div className="sq"><button className="sq-btn" onClick={() => handleQtyAdj(p.id, -1)}>-</button><span className="sq-val" style={{ color: getQtyColor(quantities[p.id] ?? p.stock ?? 0) }}>{quantities[p.id] ?? p.stock ?? 0}</span><button className="sq-btn" onClick={() => handleQtyAdj(p.id, 1)}>+</button></div><span className={`bg ${p.status === 'live' ? 'bgn' : 'bgg'}`}>{p.status}</span></div>
                  ))}
                  {productsData.filter(p => p.category === selectedCollection).length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No products in this collection</div>}
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
                  <div className="fg"><label>COMPARE PRICE (Rs)</label><input className="fi" type="number" placeholder="Optional" value={newProduct.comparePrice} onChange={e => setNewProduct({...newProduct, comparePrice: e.target.value})} /></div>
                  <div className="fg"><label>MATERIAL / FINISH</label><select className="fi" value={newProduct.material} onChange={e => setNewProduct({...newProduct, material: e.target.value})}><option value="">Select</option><option>Gold Plated</option><option>Silver</option><option>Kundan</option><option>Antique</option><option>Pearl</option><option>Meenakari</option><option>Oxidised</option><option>Alloy</option></select></div>
                  <div className="fg"><label>STOCK QUANTITY</label><input className="fi" type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} /></div>
                  <div className="fg full"><label>DESCRIPTION</label><textarea className="fi" placeholder="Design, occasion, weight, size..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea></div>
                </div>
              </div>
              <div className="fs"><div className="fst">Images & Variants</div>
                <input type="file" id="productImageUpload" accept="image/*" multiple style={{ display: 'none' }} onChange={handleProductImageUpload} />
                <label htmlFor="productImageUpload" className="uz" style={{ marginBottom: '11px', cursor: 'pointer', display: 'block' }}>
                  {isUploadingImages ? (
                    <div className="ul">Uploading...</div>
                  ) : (
                    <><div className="ul">Click to upload product images</div><div className="uh">JPG, PNG, WEBP · Max 5MB each</div></>
                  )}
                </label>
                {productImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {productImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--b1)' }}>
                        <img src={img} alt={`Product ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div key={p.id} className={`pec ${editingProduct?.id === p.id ? 'sel' : ''}`} onClick={() => setEditingProduct({ id: p.id, name: p.title, cat: p.category || '', mat: p.material || '', price: p.price, compare_price: p.compare_price })}>
                    <div className="pen">{p.title}</div>
                    <div className="pec2">{(p.category || 'General').charAt(0).toUpperCase() + (p.category || 'General').slice(1)} · {p.material}</div>
                    <div className="pep">Rs {p.price}</div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1/-1', padding: '30px', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No products to customize. Add products first.</div>
                )}
              </div>

              {editingProduct ? (
                <div className="ep">
                  <div className="en">Editing: {editingProduct.name}</div>
                  <div className="fg2">
                    <div className="fg"><label>PRODUCT NAME</label><input className="fi" type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
                    <div className="fg"><label>PRICE (Rs)</label><input className="fi" type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} /></div>
                    <div className="fg"><label>COMPARE PRICE (Rs)</label><input className="fi" type="number" placeholder="Optional" value={editingProduct.compare_price || ''} onChange={(e) => setEditingProduct({ ...editingProduct, compare_price: e.target.value })} /></div>
                    <div className="fg"><label>CATEGORY</label>
                      <select className="fi" value={(editingProduct.cat || 'General').charAt(0).toUpperCase() + (editingProduct.cat || 'General').slice(1)} onChange={(e) => setEditingProduct({ ...editingProduct, cat: e.target.value.toLowerCase() })}>
                        <option>Jhumka</option><option>Earrings</option><option>Necklace</option><option>Bangles</option><option>General</option>
                      </select>
                    </div>
                    <div className="fg"><label>MATERIAL</label>
                      <select className="fi" value={editingProduct.mat || ''} onChange={(e) => setEditingProduct({ ...editingProduct, mat: e.target.value })}>
                        <option value="">Select Material</option><option>Gold Plated</option><option>Silver</option><option>Kundan</option><option>Antique</option><option>Pearl</option><option>Alloy</option>
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
                    <div className="fg"><label>STOCK QUANTITY</label><input className="fi" type="number" defaultValue="0" /></div>
                  </div>
                  <div className="fa" style={{ marginTop: '13px' }}>
                    <button className="btn btn-p" onClick={handleUpdateProduct}>Save Changes</button>
                    <button className="btn" onClick={() => setEditingProduct(null)}>Discard</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>
                  Click on a product above to customize its details.
                </div>
              )}
            </div>

            {/* VIEW ORDERS */}
            <div className={`pg ${activePage === 'orders' ? 'active' : ''}`}>
              {/* Sales Overview Graph */}
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

              {/* Advanced Sourcing & Orders Toolbar */}
              <div className="ctb" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <input 
                  className="si si-search" 
                  type="text" 
                  placeholder="Search orders by customer name, email, phone, or order ID..." 
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                />
                
                {/* Status Filter */}
                <select 
                  className="si si-sel" 
                  style={{ width: '150px' }} 
                  value={orderStatusFilter} 
                  onChange={e => setOrderStatusFilter(e.target.value)}
                >
                  <option value="all">All Order Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Payment Status Filter */}
                <select 
                  className="si si-sel" 
                  style={{ width: '150px' }} 
                  value={orderPaymentFilter} 
                  onChange={e => setOrderPaymentFilter(e.target.value)}
                >
                  <option value="all">All Payments</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Complete Visibility Orders List */}
              <div className="ot">
                <div className="oh" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1fr 1fr 1.2fr 90px', padding: '9px 15px' }}>
                  <span>ORDER ID</span>
                  <span>DATE & TIME</span>
                  <span>CUSTOMER</span>
                  <span>AMOUNT</span>
                  <span>METHOD</span>
                  <span>PAYMENT</span>
                  <span>STATUS</span>
                </div>
                {filteredOrders.length > 0 ? filteredOrders.map(o => {
                  const statusVal = o.order_status || o.status || 'Pending';
                  const payStatus = o.payment_status || 'Pending';
                  return (
                    <div 
                      key={o.id} 
                      className="or" 
                      style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1fr 1fr 1.2fr 90px', padding: '12px 15px', cursor: 'pointer' }}
                      onClick={() => setSelectedAdminOrder(o)}
                    >
                      <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{o.razorpay_order_id || o.id?.substring(0, 13)}</span>
                      <span style={{ color: 'var(--mu)', fontSize: '11px' }}>{new Date(o.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: 'var(--tx)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name}</div>
                        <div style={{ color: 'var(--mu)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_email}</div>
                      </div>
                      <span style={{ color: 'var(--tx)', fontWeight: 500 }}>₹{parseFloat(o.total_amount || o.total_price || 0).toLocaleString()}</span>
                      <span style={{ color: 'var(--mu)' }}>{o.payment_method}</span>
                      <span className={`bg ${payStatus === 'Paid' ? 'bgn' : (payStatus === 'Failed' ? 'kd' : 'bga')}`} style={{ alignSelf: 'center', justifySelf: 'start' }}>
                        {payStatus}
                      </span>
                      <span className={`bg ${statusVal === 'Delivered' ? 'bgn' : (statusVal === 'Processing' ? 'bgg' : (statusVal === 'Cancelled' ? 'kd' : 'bga'))}`} style={{ alignSelf: 'center', justifySelf: 'start' }}>
                        {statusVal}
                      </span>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--mu)', fontSize: '12px' }}>No orders found matching the filter query.</div>
                )}
              </div>

              {/* Clean Sourcing Order Details Modal Overlay */}
              {selectedAdminOrder && (
                <div 
                  className="admin-login-overlay" 
                  style={{ background: 'rgba(11,13,17,0.85)', backdropFilter: 'blur(8px)', padding: '20px' }}
                  onClick={() => setSelectedAdminOrder(null)}
                >
                  <div 
                    className="admin-login-card" 
                    style={{ width: '650px', maxWidth: '100%', padding: '28px 30px', maxHeight: '90vh', overflowY: 'auto' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <div>
                        <h2 className="admin-login-title" style={{ textAlign: 'left', fontSize: '20px' }}>Order Details</h2>
                        <p style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '2px' }}>
                          Placed on: {new Date(selectedAdminOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedAdminOrder(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: '24px' }}
                      >
                        ×
                      </button>
                    </div>

                    <div className="admin-login-divider" style={{ marginBottom: '18px' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '12px' }}>
                      {/* Customer info */}
                      <div>
                        <h3 style={{ color: 'var(--ac)', textTransform: 'uppercase', fontSize: '10px', tracking: '1px', marginBottom: '6px', fontWeight: 600 }}>Customer Contact</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--s2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--b1)' }}>
                          <div><span style={{ color: 'var(--mu)' }}>Name:</span> <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{selectedAdminOrder.customer_name}</span></div>
                          <div><span style={{ color: 'var(--mu)' }}>Phone:</span> <span style={{ color: 'var(--tx)' }}>{selectedAdminOrder.customer_phone}</span></div>
                          <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--mu)' }}>Email:</span> <span style={{ color: 'var(--tx)' }}>{selectedAdminOrder.customer_email}</span></div>
                        </div>
                      </div>

                      {/* Shipping Destination */}
                      <div>
                        <h3 style={{ color: 'var(--ac)', textTransform: 'uppercase', fontSize: '10px', tracking: '1px', marginBottom: '6px', fontWeight: 600 }}>Shipping Destination</h3>
                        <div style={{ background: 'var(--s2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--b1)', color: 'var(--tx)', lineHeight: '1.5' }}>
                          {typeof selectedAdminOrder.shipping_address === 'string' ? selectedAdminOrder.shipping_address : (
                            <>
                              <div>{selectedAdminOrder.shipping_address?.address}</div>
                              {selectedAdminOrder.shipping_address?.apartment && <div>{selectedAdminOrder.shipping_address.apartment}</div>}
                              <div>{selectedAdminOrder.shipping_address?.city}, {selectedAdminOrder.shipping_address?.state} - {selectedAdminOrder.shipping_address?.pinCode}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Products detail */}
                      <div>
                        <h3 style={{ color: 'var(--ac)', textTransform: 'uppercase', fontSize: '10px', tracking: '1px', marginBottom: '6px', fontWeight: 600 }}>Sourcing Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedAdminOrder.products && Array.isArray(selectedAdminOrder.products) && selectedAdminOrder.products.map((prod, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--s2)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--b1)' }}>
                              <img src={prod.image} alt={prod.name} style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--tx)', fontWeight: 500 }}>{prod.name}</div>
                                <div style={{ color: 'var(--mu)', fontSize: '10px' }}>Rate: ₹{parseFloat(prod.price).toLocaleString()} · Qty: {prod.quantity}</div>
                              </div>
                              <div style={{ color: 'var(--tx)', fontWeight: 600 }}>₹{parseFloat(prod.price * prod.quantity).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment details */}
                      <div>
                        <h3 style={{ color: 'var(--ac)', textTransform: 'uppercase', fontSize: '10px', tracking: '1px', marginBottom: '6px', fontWeight: 600 }}>Payment Credentials</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--s2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--b1)' }}>
                          <div><span style={{ color: 'var(--mu)' }}>Method:</span> <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{selectedAdminOrder.payment_method}</span></div>
                          <div><span style={{ color: 'var(--mu)' }}>Status:</span> <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{selectedAdminOrder.payment_status}</span></div>
                          <div><span style={{ color: 'var(--mu)' }}>Payment ID:</span> <span style={{ color: 'var(--tx)', fontFamily: 'monospace', fontSize: '10px' }}>{selectedAdminOrder.payment_id || 'N/A'}</span></div>
                          <div><span style={{ color: 'var(--mu)' }}>Razorpay Order ID:</span> <span style={{ color: 'var(--tx)', fontFamily: 'monospace', fontSize: '10px' }}>{selectedAdminOrder.razorpay_order_id || 'N/A'}</span></div>
                        </div>
                      </div>

                      {/* Shiprocket Logistics Panel */}
                      <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '16px', marginTop: '4px' }}>
                        <h3 style={{ color: 'var(--ac)', textTransform: 'uppercase', fontSize: '11px', tracking: '1px', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                          Shiprocket Logistics Panel
                        </h3>

                        {logisticsError && (
                          <div style={{ color: 'var(--rd)', fontSize: '11px', background: 'rgba(224,82,82,0.06)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(224,82,82,0.2)', marginBottom: '10px' }}>
                            {logisticsError}
                          </div>
                        )}

                        {!selectedAdminOrder.shipment_id ? (
                          <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '6px', border: '1px dashed var(--ac)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--mu)', fontSize: '11px', margin: 0 }}>This order has not been registered on Shiprocket logistics yet.</p>
                            <button
                              className="btn btn-p"
                              disabled={isLogisticsLoading}
                              onClick={() => handleInitializeShipment(selectedAdminOrder.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '11px', background: 'var(--ac)', color: '#000', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              {isLogisticsLoading ? (
                                <span className="admin-login-spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: '#000' }}></span>
                              ) : 'Initialize Shiprocket Shipment'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--s2)', padding: '14px', borderRadius: '6px', border: '1px solid var(--b1)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                              <div><span style={{ color: 'var(--mu)' }}>Shipment Status:</span> <span style={{ color: 'var(--ac)', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>{selectedAdminOrder.shipment_status || 'Packed'}</span></div>
                              <div><span style={{ color: 'var(--mu)' }}>Courier:</span> <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{selectedAdminOrder.courier_name || 'Delhivery'}</span></div>
                              <div><span style={{ color: 'var(--mu)' }}>AWB Code:</span> <span style={{ color: 'var(--tx)', fontFamily: 'monospace', fontSize: '11px' }}>{selectedAdminOrder.awb_code || 'N/A'}</span></div>
                              <div><span style={{ color: 'var(--mu)' }}>Shipment ID:</span> <span style={{ color: 'var(--tx)', fontFamily: 'monospace', fontSize: '11px' }}>{selectedAdminOrder.shipment_id}</span></div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--b1)', paddingTop: '10px', marginTop: '4px' }}>
                              {selectedAdminOrder.shipping_label_url ? (
                                <a
                                  href={selectedAdminOrder.shipping_label_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn"
                                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px', textDecoration: 'none', textAlign: 'center', color: 'var(--tx)', border: '1px solid var(--b2)', background: 'var(--s3)' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                  Print Label
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="btn"
                                  style={{ flex: 1, fontSize: '11px', padding: '6px 12px', opacity: 0.5, cursor: 'not-allowed' }}
                                >
                                  Label Pending
                                </button>
                              )}

                              <button
                                className="btn btn-p"
                                disabled={isLogisticsLoading}
                                onClick={() => handleTrackShipment(selectedAdminOrder.awb_code)}
                                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px', background: 'var(--ac)', color: '#000', fontWeight: 600, border: 'none' }}
                              >
                                {isLogisticsLoading ? 'Syncing...' : 'Track Delivery'}
                              </button>

                              <button
                                className="btn"
                                disabled={isLogisticsLoading}
                                onClick={() => {
                                  if (window.confirm('WARNING: Are you sure you want to cancel this Shiprocket shipment? This action resets logistic records.')) {
                                    handleCancelShipment(selectedAdminOrder.id, selectedAdminOrder.shiprocket_order_id);
                                  }
                                }}
                                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px', borderColor: 'var(--rd)', color: 'var(--rd)', background: 'rgba(224,82,82,0.06)' }}
                              >
                                Cancel Shipment
                              </button>
                            </div>

                            {/* Detailed Live Tracking Timeline inside Panel */}
                            {showLogisticsHistory && liveTrackingInfo && (
                              <div style={{ background: 'var(--s3)', border: '1px solid var(--b2)', borderRadius: '4px', padding: '10px', marginTop: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--b1)', paddingBottom: '4px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '10px', color: 'var(--ac)', fontWeight: 700, textTransform: 'uppercase' }}>Live Checkpoint Tracking</span>
                                  <span style={{ fontSize: '9px', color: 'var(--mu)' }}>{liveTrackingInfo.simulated ? 'Simulated API' : 'Shiprocket live'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {liveTrackingInfo.tracking_history && liveTrackingInfo.tracking_history.map((hist, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--ac)', paddingLeft: '8px', position: 'relative' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ac)', position: 'absolute', left: '-3.5px', top: '4px' }}></div>
                                      <div>
                                        <div style={{ fontSize: '11px', color: 'var(--tx)', fontWeight: 500 }}>{hist.status} - <span style={{ fontSize: '10px', color: 'var(--mu)' }}>{hist.location}</span></div>
                                        <div style={{ fontSize: '10px', color: 'var(--mu)', fontStyle: 'italic' }}>{hist.activity}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: 'monospace' }}>{new Date(hist.date).toLocaleString()}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Interactive order status controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--b1)', paddingTop: '16px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--tx)', fontWeight: 600 }}>Update Status:</span>
                          <select 
                            value={selectedAdminOrder.order_status || selectedAdminOrder.status || 'Pending'} 
                            onChange={(e) => {
                              updateOrderStatus(selectedAdminOrder.id, e.target.value);
                              setSelectedAdminOrder(prev => ({ ...prev, order_status: e.target.value, status: e.target.value }));
                            }}
                            className="si si-sel"
                            style={{ width: '160px', background: 'var(--s3)', borderColor: 'var(--b2)' }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            className="btn" 
                            style={{ flex: 1, borderColor: 'var(--rd)', color: 'var(--rd)', background: 'rgba(224,82,82,0.06)' }}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                updateOrderStatus(selectedAdminOrder.id, 'Cancelled');
                                setSelectedAdminOrder(prev => ({ ...prev, order_status: 'Cancelled', status: 'Cancelled' }));
                              }
                            }}
                          >
                            Cancel Order
                          </button>
                          <button 
                            className="btn btn-p" 
                            style={{ flex: 1 }}
                            onClick={() => setSelectedAdminOrder(null)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            <div className={`pg ${activePage === 'settings' ? 'active' : ''}`}>
              <div className="cd" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="ch"><div className="ctl">Favicon Settings</div></div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginTop: '16px' }}>
                  <div style={{ width: '120px', height: '120px', background: 'var(--s2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--b1)' }}>
                    {faviconUrl ? <img src={faviconUrl} alt="Favicon preview" style={{ maxWidth: '64px', maxHeight: '64px' }} /> : <span style={{color: 'var(--mu)', fontSize: '12px'}}>No Favicon</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--tx)', marginBottom: '8px' }}>Upload a new favicon</p>
                    <p style={{ fontSize: '12px', color: 'var(--mu)', marginBottom: '16px' }}>This icon appears in browser tabs and bookmarks. Supports JPG, PNG, WEBP, ICO.</p>
                    <input type="file" id="faviconUpload" accept="image/*,.ico" style={{ display: 'none' }} onChange={handleFaviconUpload} />
                    <label htmlFor="faviconUpload" className="btn btn-p" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px' }}>
                      {isUploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                    </label>
                  </div>
                </div>
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
