const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-C3BB687GPZ';
const IS_PROD = import.meta.env.PROD || import.meta.env.VITE_GA_FORCE_LOAD === 'true';

let isInitialized = false;

// Ensure gtag function is defined on the window object
const ensureGtag = () => {
  if (typeof window === 'undefined') return;
  if (!window.dataLayer) {
    window.dataLayer = window.dataLayer || [];
  }
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
};

export const analytics = {
  init() {
    if (isInitialized) return;
    if (!IS_PROD) {
      console.log('[Analytics] MOCKED GA4 INITIALIZATION (Measurement ID:', GA_MEASUREMENT_ID, ')');
      isInitialized = true;
      return;
    }
    
    try {
      ensureGtag();
      
      // Inject Google Tag script asynchronously (Performance Optimization)
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.gtag('js', new Date());
      
      // Config GA4 with debug_mode to show up in Realtime/DebugView
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false, // Prevent duplicate automatic pageviews
        debug_mode: true
      });

      isInitialized = true;
      console.log('[Analytics] GA4 Initialized successfully in Production.');
    } catch (e) {
      console.error('[Analytics] Failed to initialize GA4:', e);
    }
  },

  trackPageView(page) {
    this.init();
    if (!IS_PROD) {
      console.log('[Analytics] MOCKED Page View:', page);
      return;
    }
    ensureGtag();
    window.gtag('event', 'page_view', {
      page_path: page,
      send_to: GA_MEASUREMENT_ID
    });
  },

  trackEvent(eventName, params = {}) {
    this.init();
    if (!IS_PROD) {
      console.log('[Analytics] MOCKED Event:', eventName, params);
      return;
    }
    ensureGtag();
    window.gtag('event', eventName, params);
  },

  // User Authentication Events
  trackLogin(method) {
    this.trackEvent('login', { method });
  },
  
  trackSignup(method) {
    this.trackEvent('sign_up', { method });
  },
  
  trackLogout() {
    this.trackEvent('logout');
  },

  // E-commerce Events
  trackViewItem(item) {
    if (!item) return;
    this.trackEvent('view_item', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: 1
      }]
    });
  },

  trackViewItemList(items, categoryName = 'All Products') {
    if (!items || items.length === 0) return;
    this.trackEvent('view_item_list', {
      item_list_name: categoryName,
      items: items.slice(0, 20).map((item, idx) => ({
        item_id: String(item.id),
        item_name: item.title || item.name,
        price: item.price,
        item_category: item.category || categoryName,
        index: idx + 1
      }))
    });
  },

  trackSearch(searchTerm, items) {
    this.trackEvent('search', {
      search_term: searchTerm,
      items: (items || []).slice(0, 10).map((item, idx) => ({
        item_id: String(item.id),
        item_name: item.title || item.name,
        price: item.price,
        item_category: item.category || 'Jewelry',
        index: idx + 1
      }))
    });
  },

  trackAddToCart(item, quantity = 1) {
    if (!item) return;
    this.trackEvent('add_to_cart', {
      currency: 'INR',
      value: item.price * quantity,
      items: [{
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity
      }]
    });
  },

  trackRemoveFromCart(item, quantity = 1) {
    if (!item) return;
    this.trackEvent('remove_from_cart', {
      currency: 'INR',
      value: item.price * quantity,
      items: [{
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity
      }]
    });
  },

  trackAddToWishlist(item) {
    if (!item) return;
    this.trackEvent('add_to_wishlist', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: String(item.id),
        item_name: item.title || item.name,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: 1
      }]
    });
  },

  trackRemoveFromWishlist(item) {
    if (!item) return;
    this.trackEvent('remove_from_wishlist', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: String(item.id),
        item_name: item.title || item.name,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: 1
      }]
    });
  },

  trackBeginCheckout(cartItems, subtotal) {
    if (!cartItems || cartItems.length === 0) return;
    this.trackEvent('begin_checkout', {
      currency: 'INR',
      value: subtotal,
      items: cartItems.map(item => ({
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: item.quantity
      }))
    });
  },

  trackAddShippingInfo(cartItems, subtotal) {
    if (!cartItems || cartItems.length === 0) return;
    this.trackEvent('add_shipping_info', {
      currency: 'INR',
      value: subtotal,
      shipping_tier: 'Free Delivery',
      items: cartItems.map(item => ({
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: item.quantity
      }))
    });
  },

  trackAddPaymentInfo(cartItems, subtotal, paymentMethod) {
    if (!cartItems || cartItems.length === 0) return;
    this.trackEvent('add_payment_info', {
      currency: 'INR',
      value: subtotal,
      payment_type: paymentMethod,
      items: cartItems.map(item => ({
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        item_category: item.category || 'Jewelry',
        quantity: item.quantity
      }))
    });
  },

  trackPurchase(order) {
    if (!order) return;
    
    // Prevent duplicate tracking
    const orderId = order.razorpay_order_id || order.id;
    const trackingKey = `molvbriv_purchase_tracked_${orderId}`;
    if (sessionStorage.getItem(trackingKey)) {
      console.log('[Analytics] Purchase already tracked for order:', orderId);
      return;
    }
    
    sessionStorage.setItem(trackingKey, 'true');
    
    const products = order.products || [];
    this.trackEvent('purchase', {
      transaction_id: String(orderId),
      value: parseFloat(order.total_amount || order.total_price || 0),
      currency: 'INR',
      tax: parseFloat(order.taxes || 0),
      shipping: 0,
      coupon: order.coupon_code || '',
      items: products.map(item => ({
        item_id: String(item.id),
        item_name: item.name || item.title,
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  // Profile Events
  trackProfileUpdated() {
    this.trackEvent('profile_updated');
  },
  
  trackAddressAdded() {
    this.trackEvent('address_added');
  },
  
  trackAddressUpdated() {
    this.trackEvent('address_updated');
  }
};
