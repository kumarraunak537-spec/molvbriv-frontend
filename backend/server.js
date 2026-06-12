const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const emailService = require('./emailService');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.razorpay.com", "https://apiv2.shiprocket.in"],
      frameSrc: ["'self'", "https://api.razorpay.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Global API Rate Limiter (maximum of 200 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Sensitive endpoints Rate Limiter (maximum of 10 payment operations per 10 minutes)
const sensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many transaction attempts. Restricting for security purposes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Input Sanitization Helper
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    })[m])
    .replace(/\b(SELECT|UNION|INSERT|DELETE|UPDATE|DROP)\b/gi, '') // Strip SQL command injection attempts
    .replace(/[;`$]/g, ''); // Strip shell command characters (removed ( and ) to prevent URL/text breakage)
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(item => typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item));
    } else if (typeof obj[key] === 'object') {
      obj[key] = sanitizeObject(obj[key]);
    }
  }
  return obj;
}

// Global Sanitization Middleware to defend against XSS/Injection
const sanitizeInputMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};
app.use(sanitizeInputMiddleware);

// Initialize Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SsUdDbfNytrJV9',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Custom Password Reset Endpoint (bypasses Supabase default email limits)
app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email || !emailService.isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error: missing service key.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.molvbriv.in/profile'
      }
    });

    if (error) {
      console.error("Generate recovery link error:", error.message);
      return res.status(200).json({ success: true, message: 'If the email exists, a recovery link was sent.' });
    }

    const recoveryLink = data.properties.action_link;
    const sendResult = await emailService.sendRecoveryEmail(email, recoveryLink);

    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send email via backend emailService');
    }

    res.json({ success: true, message: 'Recovery link sent successfully.' });
  } catch (error) {
    console.error("Password reset endpoint error:", error);
    res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
  }
});


// Initialize Supabase Client (bypasses RLS to write verified payments securely)
const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// RBAC Middleware: Auth & Admin Validation
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access denied. Missing authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // 1. Verify token with Supabase Auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Invalid authentication token.' });
    }

    // 2. Query user profile to verify 'admin' role
    const { data: profile, error: dbErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbErr || !profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden. Access restricted to administrators only.' });
    }

    // Pass validated admin details to req for logging
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Authentication check failure:', error);
    res.status(500).json({ success: false, error: 'Server authentication checkpoint failure.' });
  }
};

// Middleware: Authenticate Standard User
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access denied. Missing authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Invalid authentication token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User authentication check failure:', error);
    res.status(500).json({ success: false, error: 'User authentication checkpoint failure.' });
  }
};

// --- SHIPROCKET SECURE LOGISTICS SERVICES ---
let shiprocketToken = null;
let tokenExpiry = null;
let shiprocketDisabledUntil = null; // Circuit-breaker timestamp to temporarily disable live API calls

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || password === 'YOUR_PASSWORD' || (shiprocketDisabledUntil && Date.now() < shiprocketDisabledUntil)) {
    return 'SIMULATED_TOKEN';
  }

  // Check if token already cached and valid (expires in 24 hours)
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds connection timeout

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Shiprocket auth failed: ${response.statusText} - ${errText}. Temporarily entering Simulation Mode.`);
      shiprocketDisabledUntil = Date.now() + 10 * 60 * 1000; // 10 minutes cooldown
      return 'SIMULATED_TOKEN';
    }

    const data = await response.json();
    shiprocketToken = data.token;
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // Cache for 23 hours
    return shiprocketToken;
  } catch (err) {
    console.error('Error fetching Shiprocket token, temporarily entering Simulation Mode:', err.message);
    shiprocketDisabledUntil = Date.now() + 5 * 60 * 1000; // 5 minutes cooldown on network failure
    return 'SIMULATED_TOKEN';
  }
}

async function createShiprocketOrder(order) {
  const token = await getShiprocketToken();
  
  if (token === 'SIMULATED_TOKEN') {
    const courierNames = ['Delhivery', 'BlueDart', 'Ecom Express', 'Xpressbees'];
    const assignedCourier = courierNames[Math.floor(Math.random() * courierNames.length)];
    const awb = `MB-AWB-${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    
    return {
      success: true,
      simulated: true,
      shiprocket_order_id: `SR-ORD-${Math.floor(Date.now() / 1000)}`,
      shipment_id: `SR-SHP-${Math.floor(Date.now() / 1000)}`,
      awb_code: awb,
      courier_name: assignedCourier,
      tracking_id: awb,
      shipping_label_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      shipment_status: 'Packed',
      shipment_history: [
        { status: 'Order Placed', activity: 'Boutique order recorded successfully.', location: 'Maison Delhi', date: new Date().toISOString() },
        { status: 'Packed', activity: 'Timeless jewel audited, secured in protective case and packed.', location: 'Maison Delhi', date: new Date(Date.now() + 60000).toISOString() }
      ]
    };
  }

  try {
    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
    
    // Map shipping name safely
    const nameParts = (order.customer_name || 'Client Boutique').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Map shipping address safely
    const addr = order.shipping_address || {};
    
    let streetAddress = addr.address;
    if (!streetAddress) {
      streetAddress = [
        addr.flatNumber,
        addr.street,
        addr.landmark,
        addr.area
      ].filter(Boolean).join(', ');
    }
    if (!streetAddress || streetAddress.trim().length < 6) {
      streetAddress = 'Boutique Sourcing';
    }

    const city = addr.city || 'Delhi';
    const pinCode = addr.pinCode || '110001';
    const state = addr.state || 'Delhi';

    // Map billing address details dynamically
    const hasBilling = addr.billingAddress && Object.keys(addr.billingAddress).length > 0;
    const billAddr = hasBilling ? addr.billingAddress : addr;
    
    const bNameParts = (billAddr.fullName || order.customer_name || 'Client Boutique').trim().split(/\s+/);
    const bFirstName = bNameParts[0] || 'Client';
    const bLastName = bNameParts.slice(1).join(' ') || '.';

    let bStreetAddress = billAddr.address;
    if (!bStreetAddress) {
      bStreetAddress = [
        billAddr.flatNumber,
        billAddr.street,
        billAddr.landmark,
        billAddr.area
      ].filter(Boolean).join(', ');
    }
    if (!bStreetAddress || bStreetAddress.trim().length < 6) {
      bStreetAddress = streetAddress;
    }

    const bEmail = hasBilling ? (billAddr.email || order.customer_email) : (order.customer_email || 'concierge@molvbriv.in');
    const bPhone = hasBilling ? (billAddr.phone || order.customer_phone) : (order.customer_phone || '9999999999');
    
    // Map order items safely
    const items = (order.products || []).map(p => ({
      name: p.name || 'Boutique Selection',
      sku: p.sku || `SKU-${p.id ? p.id.substring(0, 8).toUpperCase() : Math.floor(Math.random()*900000)}`,
      units: parseInt(p.quantity || 1),
      selling_price: parseFloat(p.price || order.total_amount || 0).toString()
    }));

    const shiprocketOrderPayload = {
      order_id: order.razorpay_order_id || `MB-ORD-${order.id.substring(0, 8)}`,
      order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: pickupLocation,
      
      // Billing Details
      billing_customer_name: bFirstName,
      billing_last_name: bLastName,
      billing_address: bStreetAddress,
      billing_address_2: billAddr.apartment || '',
      billing_city: billAddr.city || city,
      billing_pincode: billAddr.pinCode || pinCode,
      billing_state: billAddr.state || state,
      billing_country: 'India',
      billing_email: bEmail,
      billing_phone: bPhone,
      
      // Shipping Details
      shipping_is_billing: !hasBilling,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: streetAddress,
      shipping_address_2: addr.apartment || '',
      shipping_city: addr.city || city,
      shipping_pincode: addr.pinCode || pinCode,
      shipping_state: addr.state || state,
      shipping_country: 'India',
      shipping_email: order.customer_email || bEmail,
      shipping_phone: order.customer_phone || bPhone,
      
      order_items: items,
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: parseFloat(order.total_amount || order.total_price),
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5
    };

    console.log('Sending order payload to Shiprocket:', JSON.stringify(shiprocketOrderPayload));

    // A. CREATE ADHOC ORDER
    const createController = new AbortController();
    const createTimeout = setTimeout(() => createController.abort(), 5000);

    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shiprocketOrderPayload),
      signal: createController.signal
    });
    clearTimeout(createTimeout);

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Shiprocket order creation failed: ${createRes.statusText} - ${errText}`);
    }

    const createData = await createRes.json();
    if (!createData || !createData.order_id) {
      const errMsg = createData.message || JSON.stringify(createData);
      throw new Error(`Shiprocket order creation failed: ${errMsg}`);
    }

    const shiprocketOrderId = createData.order_id;
    const shipmentId = createData.shipment_id;

    console.log(`Shiprocket order created successfully. Order ID: ${shiprocketOrderId}, Shipment ID: ${shipmentId}`);

    let awbCode = '';
    let courierName = 'Shiprocket Courier';
    let trackingId = '';
    let labelUrl = '';

    // B. GENERATE AWB & ASSIGN COURIER (Auto assignment)
    try {
      const awbController = new AbortController();
      const awbTimeout = setTimeout(() => awbController.abort(), 5000);
      
      const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: shipmentId }),
        signal: awbController.signal
      });
      clearTimeout(awbTimeout);

      if (awbRes.ok) {
        const awbData = await awbRes.json();
        if (awbData.status === 200 && awbData.response && awbData.response.data) {
          const awbDetails = awbData.response.data;
          awbCode = awbDetails.awb_code || '';
          courierName = awbDetails.courier_name || 'Shiprocket Courier';
          trackingId = awbDetails.awb_code || '';
          console.log(`AWB code generated successfully: ${awbCode} via ${courierName}`);
        } else {
          console.warn('AWB generation response was not successful:', JSON.stringify(awbData));
        }
      } else {
        const awbErrText = await awbRes.text();
        console.error(`AWB assignment failed: ${awbRes.statusText} - ${awbErrText}`);
      }
    } catch (awbErr) {
      console.error('Error assigning AWB:', awbErr);
    }

    // C. GENERATE SHIPPING LABEL
    try {
      const labelController = new AbortController();
      const labelTimeout = setTimeout(() => labelController.abort(), 5000);
      
      const labelRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: [shipmentId] }),
        signal: labelController.signal
      });
      clearTimeout(labelTimeout);

      if (labelRes.ok) {
        const labelData = await labelRes.json();
        labelUrl = labelData.label_url || '';
        console.log(`Shipping label generated successfully: ${labelUrl}`);
      } else {
        const labelErrText = await labelRes.text();
        console.error(`Shipping label generation failed: ${labelRes.statusText} - ${labelErrText}`);
      }
    } catch (labelErr) {
      console.error('Error generating shipping label:', labelErr);
    }

    return {
      success: true,
      simulated: false,
      shiprocket_order_id: shiprocketOrderId.toString(),
      shipment_id: shipmentId.toString(),
      awb_code: awbCode,
      courier_name: courierName,
      tracking_id: trackingId,
      shipping_label_url: labelUrl,
      shipment_status: 'Packed',
      shipment_history: [
        { status: 'Order Placed', activity: 'Boutique order recorded successfully.', location: 'Maison Delhi', date: new Date().toISOString() },
        { status: 'Packed', activity: 'Shipment created and scheduled for dispatch.', location: 'Maison Delhi', date: new Date().toISOString() }
      ]
    };
  } catch (error) {
    console.error('Error in createShiprocketOrder:', error);
    throw error;
  }
}

async function cancelShiprocketOrder(shiprocketOrderId) {
  const token = await getShiprocketToken();
  if (token === 'SIMULATED_TOKEN') {
    return { success: true, simulated: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds cancel timeout
    
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: [parseInt(shiprocketOrderId)] }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to cancel Shiprocket order: ${response.statusText} - ${errText}`);
    }

    return { success: true, simulated: false };
  } catch (err) {
    console.error('Error cancelling Shiprocket order:', err);
    throw err;
  }
}

const MAX_FULFILLMENT_RETRIES = 5;
const RETRY_BACKOFFS = [5000, 30000, 300000, 1800000]; // 5s, 30s, 5m, 30m

async function autoFulfillShipment(orderId, attempt = 1) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  console.log(`[Shiprocket Sync] Attempt ${attempt}/${MAX_FULFILLMENT_RETRIES} for order: ${orderId}`);

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error(`[Shiprocket Sync] Failed to load order ${orderId} for auto-fulfillment:`, error);
      return;
    }

    // Duplicate prevention: skip if already synced or has shipment ID
    if (order.shiprocket_sync_status === 'Created' || order.shipment_id) {
      console.log(`[Shiprocket Sync] Shipment already created/synced for order: ${orderId}. Skipping.`);
      return;
    }

    // Update status to Pending on first attempt
    if (attempt === 1) {
      await supabase
        .from('orders')
        .update({
          shiprocket_sync_status: 'Pending',
          shiprocket_sync_error: null
        })
        .eq('id', orderId);
    }

    // Call Shiprocket order creation API
    const shiprocketDetails = await createShiprocketOrder(order);

    // Save details in Supabase
    const { error: updErr } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: shiprocketDetails.shiprocket_order_id,
        shipment_id: shiprocketDetails.shipment_id,
        awb_code: shiprocketDetails.awb_code,
        courier_name: shiprocketDetails.courier_name,
        tracking_id: shiprocketDetails.tracking_id,
        shipping_label_url: shiprocketDetails.shipping_label_url,
        shipment_status: shiprocketDetails.shipment_status,
        shipment_history: shiprocketDetails.shipment_history,
        order_status: 'Processing',
        status: 'processing',
        shiprocket_sync_status: 'Created',
        shiprocket_sync_error: null
      })
      .eq('id', orderId);

    if (updErr) {
      throw new Error(`DB update failed: ${updErr.message}`);
    }

    console.log(`[Shiprocket Sync] Success for order ${orderId}. Shipment ID: ${shiprocketDetails.shipment_id}`);

    // Update SQLite local order status compatibility
    db.run("UPDATE orders SET status = ? WHERE id = ? OR order_number = ?", ['Processing', orderId, order.razorpay_order_id], (dbErr) => {
      if (dbErr) console.error('[Shiprocket Sync] SQLite order status sync failed:', dbErr);
    });

  } catch (err) {
    const errorMsg = err.message || JSON.stringify(err);
    console.error(`[Shiprocket Sync] Attempt ${attempt} failed for order ${orderId}: ${errorMsg}`);

    // Update DB with failed status and error details
    await supabase
      .from('orders')
      .update({
        shiprocket_sync_status: 'Failed',
        shiprocket_sync_error: errorMsg
      })
      .eq('id', orderId);

    // Terminal check: validation errors (422), auth issues, or max attempts reached
    const isValidationError = errorMsg.toLowerCase().includes('validation') || errorMsg.includes('422');
    const isAuthError = errorMsg.toLowerCase().includes('auth') || errorMsg.toLowerCase().includes('authentication') || errorMsg.includes('unauthorized');
    const isTerminal = isValidationError || isAuthError || attempt >= MAX_FULFILLMENT_RETRIES;

    if (!isTerminal) {
      const delay = RETRY_BACKOFFS[attempt - 1] || 30000;
      console.log(`[Shiprocket Sync] Queueing retry attempt ${attempt + 1} in ${delay / 1000}s for order ${orderId}`);
      setTimeout(() => {
        autoFulfillShipment(orderId, attempt + 1).catch(retryErr => {
          console.error(`[Shiprocket Sync] Uncaught error in retry schedule:`, retryErr);
        });
      }, delay);
    } else {
      console.error(`[Shiprocket Sync] Terminal state reached for order ${orderId}. Retries stopped.`);
    }
  }
}

// Nodemailer confirmation email utility
// Centralized transactional email dispatcher wrapper
async function sendConfirmationEmail(order) {
  try {
    await emailService.sendOrderEmail(order, 'confirmed');
  } catch (err) {
    console.error('Error sending confirmation email:', err);
  }
}

// --- SECURE PAYMENT & WEBHOOK ENDPOINTS ---

// 1. Create Razorpay Order and pre-create 'Pending' order in Supabase
app.post('/api/payments/create-order', sensitiveLimiter, async (req, res, next) => {
  const { amount, currency, checkoutDetails } = req.body;
  
  try {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid checkout amount.' });
    }

    const orderNumber = `MB-${Math.floor(Date.now() / 1000)}`;
    let razorpayOrder = null;

    if (process.env.RAZORPAY_KEY_SECRET) {
      const options = {
        amount: Math.round(amount * 100), // in paise
        currency: currency || 'INR',
        receipt: orderNumber
      };
      razorpayOrder = await razorpay.orders.create(options);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, error: 'Razorpay keys are unconfigured on live server.' });
      }
      console.log('Razorpay Secret key is missing. Simulating Razorpay order creation.');
      razorpayOrder = {
        id: `order_sim_${Math.random().toString(36).substring(2, 11)}`,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        receipt: orderNumber,
        status: 'created'
      };
    }

    // Pre-create the order in Supabase (anti-loss safety guard)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: checkoutDetails.userId || null,
          customer_name: checkoutDetails.customerName,
          customer_email: checkoutDetails.customerEmail,
          customer_phone: checkoutDetails.customerPhone,
          shipping_address: checkoutDetails.shippingAddress,
          products: checkoutDetails.products,
          quantity: checkoutDetails.quantity,
          total_price: parseFloat(amount),
          total_amount: parseFloat(amount),
          razorpay_order_id: razorpayOrder.id,
          payment_method: 'Online',
          payment_status: 'pending',
          order_status: 'Pending',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase pre-order insertion error:', error.message);
      } else {
        console.log('Audited pending order in Supabase:', data.id);
      }
    }

    res.json({ success: true, razorpayOrder });
  } catch (error) {
    next(error);
  }
});

// 2. Verify payment signatures and commit orders
app.post('/api/payments/verify', sensitiveLimiter, async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutDetails } = req.body;

  try {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, error: 'Missing transaction identifiers.' });
    }

    let verified = false;

    if (process.env.RAZORPAY_KEY_SECRET) {
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generated_signature === razorpay_signature) {
        verified = true;
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, error: 'Razorpay keys are unconfigured on live server.' });
      }
      console.log('Razorpay Key Secret missing. Simulating signature verification success.');
      verified = true;
    }

    if (!verified) {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            order_status: 'Cancelled',
            status: 'cancelled',
            payment_id: razorpay_payment_id || 'Verification Failed'
          })
          .eq('razorpay_order_id', razorpay_order_id);
      }
      return res.status(400).json({ success: false, error: 'Payment signature mismatch. Unverified transaction.' });
    }

    let orderRecord = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Check if duplicate callback (order already paid)
      const { data: existing } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();

      if (existing && existing.payment_status === 'Paid') {
        return res.json({ success: true, order: existing });
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'Paid',
          status: 'processing',
          payment_id: razorpay_payment_id,
          razorpay_payment_id: razorpay_payment_id
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .select()
        .single();

      if (error || !data) {
        // Fallback create order if somehow missed
        const { data: newOrder, error: insErr } = await supabase
          .from('orders')
          .insert([{
            user_id: checkoutDetails.userId || null,
            customer_name: checkoutDetails.customerName,
            customer_email: checkoutDetails.customerEmail,
            customer_phone: checkoutDetails.customerPhone,
            shipping_address: checkoutDetails.shippingAddress,
            products: checkoutDetails.products,
            quantity: checkoutDetails.quantity,
            total_price: parseFloat(checkoutDetails.amount),
            total_amount: parseFloat(checkoutDetails.amount),
            razorpay_order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            razorpay_payment_id: razorpay_payment_id,
            payment_method: 'Online',
            payment_status: 'paid',
            order_status: 'Paid',
            status: 'processing'
          }])
          .select()
          .single();
        if (insErr) throw insErr;
        orderRecord = newOrder;
      } else {
        orderRecord = data;
      }
    } else {
      orderRecord = {
        id: `sim_ord_${Math.floor(Math.random() * 900000 + 100000)}`,
        customer_name: checkoutDetails.customerName,
        customer_email: checkoutDetails.customerEmail,
        customer_phone: checkoutDetails.customerPhone,
        shipping_address: checkoutDetails.shippingAddress,
        products: checkoutDetails.products,
        total_amount: checkoutDetails.amount,
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        payment_method: 'Online',
        payment_status: 'Paid',
        order_status: 'Paid'
      };
    }

    // Defer background notifications and fulfillment to execute AFTER the HTTP response is sent
    setImmediate(() => {
      sendConfirmationEmail(orderRecord).catch(err => console.error('Error sending confirmation email:', err));
      autoFulfillShipment(orderRecord.id).catch(err => console.error('Error in autoFulfillShipment Prepaid:', err));
    });

    res.json({ success: true, order: orderRecord });
  } catch (error) {
    next(error);
  }
});

// 3. Cash on Delivery checkout
app.post('/api/payments/cod', sensitiveLimiter, async (req, res, next) => {
  const { checkoutDetails } = req.body;
  
  try {
    if (!checkoutDetails || !checkoutDetails.amount || parseFloat(checkoutDetails.amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid checkout request.' });
    }

    const orderNumber = `MB-COD-${Math.floor(Date.now() / 1000)}`;
    let orderRecord = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: checkoutDetails.userId || null,
          customer_name: checkoutDetails.customerName,
          customer_email: checkoutDetails.customerEmail,
          customer_phone: checkoutDetails.customerPhone,
          shipping_address: checkoutDetails.shippingAddress,
          products: checkoutDetails.products,
          quantity: checkoutDetails.quantity,
          total_price: parseFloat(checkoutDetails.amount),
          total_amount: parseFloat(checkoutDetails.amount),
          razorpay_order_id: orderNumber,
          payment_id: 'COD',
          razorpay_payment_id: 'COD',
          payment_method: 'COD',
          payment_status: 'pending',
          order_status: 'Pending',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      orderRecord = data;
    } else {
      orderRecord = {
        id: `sim_ord_cod_${Math.floor(Math.random() * 900000 + 100000)}`,
        customer_name: checkoutDetails.customerName,
        customer_email: checkoutDetails.customerEmail,
        customer_phone: checkoutDetails.customerPhone,
        shipping_address: checkoutDetails.shippingAddress,
        products: checkoutDetails.products,
        total_amount: checkoutDetails.amount,
        payment_id: 'COD',
        razorpay_order_id: orderNumber,
        payment_method: 'COD',
        payment_status: 'Pending',
        order_status: 'Pending'
      };
    }

    // Defer background notifications and fulfillment to execute AFTER the HTTP response is sent
    setImmediate(() => {
      sendConfirmationEmail(orderRecord).catch(err => console.error('Error sending confirmation email:', err));
      autoFulfillShipment(orderRecord.id).catch(err => console.error('Error in autoFulfillShipment COD:', err));
    });

    res.json({ success: true, order: orderRecord });
  } catch (error) {
    console.error('COD order creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to place order' });
  }
});

// 4. Webhook support for async payment status sync
app.post('/api/payments/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    if (signature && webhookSecret) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(req.rawBody || JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.error('Webhook signature mismatch');
        return res.status(400).json({ success: false, error: 'Signature mismatch' });
      }
    }

    // Acknowledge webhook immediately to prevent Razorpay from timing out
    res.status(200).json({ status: 'ok' });

    // Process asynchronously
    const event = req.body.event;
    console.log('Razorpay Webhook event received:', event);

    (async () => {
      try {
        if (event === 'payment.captured' || event === 'payment.failed') {
          const paymentEntity = req.body.payload.payment.entity;
          const razorpayOrderId = paymentEntity.order_id;
          const razorpayPaymentId = paymentEntity.id;
          const isPaid = event === 'payment.captured';

          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { data: existing } = await supabase
              .from('orders')
              .select('*')
              .eq('razorpay_order_id', razorpayOrderId)
              .maybeSingle();

            if (existing && existing.payment_status?.toLowerCase() !== 'paid') {
              const { data: updated } = await supabase
                .from('orders')
                .update({
                  payment_status: isPaid ? 'paid' : 'failed',
                  order_status: isPaid ? 'Paid' : 'Failed',
                  status: isPaid ? 'processing' : 'cancelled',
                  payment_id: razorpayPaymentId,
                  razorpay_payment_id: razorpayPaymentId
                })
                .eq('razorpay_order_id', razorpayOrderId)
                .select()
                .single();

              if (isPaid && updated) {
                setImmediate(() => {
                  sendConfirmationEmail(updated).catch(err => console.error('Email error:', err));
                  autoFulfillShipment(updated.id).catch(err => console.error('Error in autoFulfillShipment Webhook:', err));
                });
              }
            }
          }
        } else if (event === 'refund.processed') {
          const refundEntity = req.body.payload.refund.entity;
          const razorpayPaymentId = refundEntity.payment_id;

          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { data: updatedOrder, error } = await supabase
              .from('orders')
              .update({
                order_status: 'Cancelled',
                status: 'cancelled',
                payment_status: 'failed'
              })
              .eq('payment_id', razorpayPaymentId)
              .select()
              .single();

            if (!error && updatedOrder) {
              emailService.sendOrderEmail(updatedOrder, 'refund_processed').catch(err => console.error('Error sending refund email:', err));
            }
          }
        }
      } catch (innerErr) {
        console.error('Async webhook processing error:', innerErr);
      }
    })();

  } catch (error) {
    console.error('Webhook initialization error:', error);
    if (!res.headersSent) {
      res.status(200).json({ success: true, note: 'Error caught, ignoring for webhook' });
    }
  }
});

// --- CUSTOMER ORDER SERVICES: CANCEL & RETURN ---

app.post('/api/orders/:id/cancel', authenticateUser, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this order.' });
    }

    const cancellableStatuses = ['pending', 'paid', 'processing'];
    if (!cancellableStatuses.includes(order.order_status?.toLowerCase())) {
      return res.status(400).json({ success: false, error: `Order cannot be cancelled in '${order.order_status}' status.` });
    }

    const { data: updated, error: updErr } = await supabase
      .from('orders')
      .update({
        order_status: 'Cancelled',
        status: 'cancelled',
        payment_status: order.payment_status === 'paid' ? 'refunded' : order.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updErr) throw updErr;

    // Defer background email and logistics cancellations
    setImmediate(() => {
      emailService.sendOrderEmail(updated, 'cancelled').catch(emailErr => {
        console.error('Background error sending cancellation email:', emailErr);
      });

      if (order.shiprocket_order_id) {
        cancelShiprocketOrder(order.shiprocket_order_id).catch(srErr => {
          console.error('Background error cancelling Shiprocket order:', srErr);
        });
      }
    });

    res.json({ success: true, message: 'Order cancelled successfully.', order: updated });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

app.post('/api/orders/:id/return', authenticateUser, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this order.' });
    }

    if (order.order_status?.toLowerCase() !== 'delivered') {
      return res.status(400).json({ success: false, error: 'Only delivered orders can be returned.' });
    }

    const { data: updated, error: updErr } = await supabase
      .from('orders')
      .update({
        order_status: 'Returned',
        status: 'returned',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updErr) throw updErr;

    // Defer background email notification
    setImmediate(() => {
      emailService.sendOrderEmail(updated, 'returned').catch(emailErr => {
        console.error('Background error sending return confirmation email:', emailErr);
      });
    });

    res.json({ success: true, message: 'Order return request processed successfully.', order: updated });
  } catch (err) {
    console.error('Return order error:', err);
    res.status(500).json({ success: false, error: 'Failed to return order.' });
  }
});

// 5. Newsletter Subscription Endpoint
app.post('/api/subscribe', sensitiveLimiter, async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email || !emailService.isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const subscriber = { email: email.trim().toLowerCase() };

    // A. Insert in Supabase 'subscribers' table if service role key exists
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { error: insErr } = await supabase
          .from('subscribers')
          .insert([{ email: subscriber.email }]);

        if (insErr) {
          if (insErr.code === '23505') {
            console.log(`Subscriber email "${email}" already registered in Supabase.`);
          } else {
            console.error('Supabase subscriber insertion error:', insErr.message);
          }
        } else {
          console.log(`Audited subscriber in Supabase: ${subscriber.email}`);
        }
      } catch (dbErr) {
        console.error('Supabase subscribers table insert failure:', dbErr.message);
      }
    }

    // B. Insert in local SQLite database 'subscribers' table
    try {
      db.run(`INSERT INTO subscribers (email) VALUES (?)`, [subscriber.email], (err) => {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            console.log(`Subscriber email "${email}" already registered in SQLite.`);
          } else {
            console.error('SQLite subscribers insertion error:', err.message);
          }
        } else {
          console.log(`Audited subscriber in SQLite: ${subscriber.email}`);
        }
      });
    } catch (sqlErr) {
      console.error('SQLite subscribers insert failure:', sqlErr.message);
    }

    // Defer newsletter email dispatches
    setImmediate(() => {
      emailService.sendNewsletterEmail(subscriber, 'newsletter_welcome')
        .catch(err => console.error('Error sending newsletter welcome email:', err));

      emailService.sendNewsletterEmail(subscriber, 'newsletter_admin')
        .catch(err => console.error('Error sending newsletter admin notification email:', err));
    });

    res.json({ success: true, message: 'Welcome to the Boutique Circle! Check your email for details.' });
  } catch (error) {
    next(error);
  }
});

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Tables
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        material TEXT,
        stock INTEGER,
        status TEXT,
        image TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT,
        customer_name TEXT,
        product_name TEXT,
        amount REAL,
        status TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Seed initial data if empty
      db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
          console.log('Seeding initial products...');
          const insertStmt = db.prepare("INSERT INTO products (name, price, category, material, stock, status) VALUES (?, ?, ?, ?, ?, ?)");
          insertStmt.run('Polki Jhumka Set', 1299, 'Jhumka', 'Gold Plated', 24, 'Live');
          insertStmt.run('Kundan Necklace', 2899, 'Necklace', 'Kundan', 10, 'Live');
          insertStmt.run('Floral Ear Studs', 649, 'Earrings', 'Silver', 2, 'Low Stock');
          insertStmt.run('Chandbali Jhumka', 1599, 'Jhumka', 'Antique', 30, 'Draft');
          insertStmt.finalize();
        }
      });

      db.get("SELECT count(*) as count FROM orders", (err, row) => {
        if (row && row.count === 0) {
          console.log('Seeding initial orders...');
          const insertStmt = db.prepare("INSERT INTO orders (order_number, customer_name, product_name, amount, status) VALUES (?, ?, ?, ?, ?)");
          insertStmt.run('#MLV-1041', 'Priya Sharma', 'Kundan Necklace', 2899, 'Delivered');
          insertStmt.run('#MLV-1040', 'Ananya R.', 'Polki Jhumka', 1299, 'Shipped');
          insertStmt.run('#MLV-1039', 'Meera V.', 'Rani Haar Set', 4999, 'Processing');
          insertStmt.finalize();
        }
      });
    });
  }
});

// --- API ROUTES ---

// GET all products (Publicly accessible)
app.get('/api/products', (req, res, next) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// POST new product (Admin protected)
app.post('/api/products', authenticateAdmin, (req, res, next) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "INSERT INTO products (name, price, category, material, stock, status) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [name, price, category, material, stock, status], function(err) {
    if (err) return next(err);
    res.json({ id: this.lastID, name, price, category, material, stock, status });
  });
});

// PUT update product (Admin protected)
app.put('/api/products/:id', authenticateAdmin, (req, res, next) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "UPDATE products SET name = ?, price = ?, category = ?, material = ?, stock = ?, status = ? WHERE id = ?";
  db.run(sql, [name, price, category, material, stock, status, req.params.id], function(err) {
    if (err) return next(err);
    res.json({ updated: this.changes });
  });
});

// DELETE product (Admin protected)
app.delete('/api/products/:id', authenticateAdmin, (req, res, next) => {
  db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
    if (err) return next(err);
    res.json({ deleted: this.changes });
  });
});

// GET all orders (Admin protected)
app.get('/api/orders', authenticateAdmin, (req, res, next) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Update order status (Admin protected)
// Update order status and trigger transactional email (Admin protected)
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res, next) => {
  const { status } = req.body;
  const orderId = req.params.id;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    // 1. Update status in Supabase
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        order_status: status,
        status: status.toLowerCase()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found in database' });
    }

    // 2. Trigger status-specific emails
    let emailType = null;
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'shipped') {
      emailType = 'shipped';
    } else if (statusLower === 'out for delivery' || statusLower === 'out_for_delivery') {
      emailType = 'out_for_delivery';
    } else if (statusLower === 'delivered') {
      emailType = 'delivered';
    } else if (statusLower === 'cancelled') {
      emailType = 'cancelled';
    } else if (statusLower === 'returned') {
      emailType = 'returned';
    } else if (statusLower === 'refunded' || statusLower === 'refund_processed') {
      emailType = 'refund_processed';
    } else if (statusLower === 'processing' || statusLower === 'paid') {
      emailType = 'confirmed';
    }

    if (emailType) {
      emailService.sendOrderEmail(updatedOrder, emailType).catch(err => console.error(`Error sending ${emailType} email:`, err));
    }

    // Update local SQLite order status for compatibility
    db.run("UPDATE orders SET status = ? WHERE order_number = ? OR id = ?", [status, updatedOrder.razorpay_order_id, orderId], (err) => {
      if (err) console.error('SQLite order status sync failed:', err);
    });

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
});

// --- SHIPROCKET SYSTEM CONTROLLER ENDPOINTS ---

// A. Manual/Trigger Shipment Creation Dashboard (Admin protected)
app.post('/api/shiprocket/create-shipment', authenticateAdmin, async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, error: 'orderId is required' });
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found in database' });
    }

    if (order.shipment_id) {
      return res.status(400).json({ success: false, error: 'Shipment already initialized for this order' });
    }

    const shiprocketDetails = await createShiprocketOrder(order);

    const { data: updatedOrder, error: updErr } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: shiprocketDetails.shiprocket_order_id,
        shipment_id: shiprocketDetails.shipment_id,
        awb_code: shiprocketDetails.awb_code,
        courier_name: shiprocketDetails.courier_name,
        tracking_id: shiprocketDetails.tracking_id,
        shipping_label_url: shiprocketDetails.shipping_label_url,
        shipment_status: shiprocketDetails.shipment_status,
        shipment_history: shiprocketDetails.shipment_history,
        order_status: 'Processing',
        status: 'processing',
        shiprocket_sync_status: 'Created',
        shiprocket_sync_error: null
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updErr) throw updErr;

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    const errorMsg = err.message || JSON.stringify(err);
    try {
      await supabase
        .from('orders')
        .update({
          shiprocket_sync_status: 'Failed',
          shiprocket_sync_error: errorMsg
        })
        .eq('id', orderId);
    } catch (dbErr) {
      console.error('Failed to update manual failure status in database:', dbErr);
    }
    next(err);
  }
});

// B. Live AWB Checkpoint Tracking Endpoint
app.get('/api/shiprocket/track/:awb_code', async (req, res) => {
  const { awb_code } = req.params;
  const token = await getShiprocketToken();

  if (token === 'SIMULATED_TOKEN' || awb_code.startsWith('MB-AWB-')) {
    // Return mock updates simulated in timeline
    return res.json({
      success: true,
      simulated: true,
      awb: awb_code,
      shipment_status: 'Shipped',
      tracking_history: [
        { status: 'Order Placed', activity: 'Boutique order recorded successfully.', location: 'Maison Delhi', date: new Date(Date.now() - 3600000 * 4).toISOString() },
        { status: 'Packed', activity: 'Timeless jewel audited, secured in protective case and packed.', location: 'Maison Delhi', date: new Date(Date.now() - 3600000 * 3).toISOString() },
        { status: 'Shipped', activity: 'Dispatched via secure secure transit partners.', location: 'Maison Delhi', date: new Date(Date.now() - 3600000 * 2).toISOString() }
      ]
    });
  }

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb_code}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Tracking query failed: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const trackingData = data.tracking_data || {};
    const shipmentTrack = trackingData.shipment_track || [];
    const activities = trackingData.shipment_track_activities || [];

    // Map Shiprocket activities to common boutique layout
    const history = activities.map(act => ({
      status: act.status || 'In Transit',
      activity: act.activity || 'Package moving through hub.',
      location: act.location || 'Hub',
      date: act.date || new Date().toISOString()
    }));

    const latestStatus = shipmentTrack[0]?.current_status || 'Processing';

    res.json({
      success: true,
      simulated: false,
      awb: awb_code,
      shipment_status: latestStatus,
      tracking_history: history.length > 0 ? history : [
        { status: 'Packed', activity: 'Shipment handed over to courier.', location: 'Delhi Warehouse', date: new Date().toISOString() }
      ]
    });
  } catch (err) {
    console.error('Error tracking shipment:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to query live tracking details' });
  }
});

// C. Cancel Shipment Dashboard Control (Admin protected)
app.post('/api/shiprocket/cancel', authenticateAdmin, async (req, res, next) => {
  const { orderId, shiprocketOrderId } = req.body;

  try {
    if (shiprocketOrderId) {
      await cancelShiprocketOrder(shiprocketOrderId);
    }

    // Reset columns in database so that admins can re-initialize if needed
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: null,
        shipment_id: null,
        awb_code: null,
        courier_name: null,
        tracking_id: null,
        shipping_label_url: null,
        shipment_status: 'Pending',
        shipment_history: [],
        order_status: 'Pending',
        status: 'pending'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
});

// E. Courier Serviceability Check (Publicly accessible)
app.get('/api/shiprocket/serviceability', async (req, res, next) => {
  const { delivery_postcode, pickup_postcode } = req.query;
  const deliveryPostcode = delivery_postcode || '110001';
  const pickupPostcode = pickup_postcode || process.env.SHIPROCKET_PICKUP_PINCODE || '110001';
  
  const token = await getShiprocketToken();
  if (token === 'SIMULATED_TOKEN') {
    return res.json({
      success: true,
      simulated: true,
      data: {
        company_name: 'Delhivery Private Limited',
        rate: 85.00,
        delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        etd: '3 Days',
        cod: 1
      }
    });
  }

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=0.5&cod=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Serviceability check failed: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    res.json({ success: true, simulated: false, data: data.data || data });
  } catch (err) {
    next(err);
  }
});

// F. Generate Invoice Link (Admin protected)
app.post('/api/shiprocket/invoice', authenticateAdmin, async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, error: 'orderId is required' });
  }

  const token = await getShiprocketToken();
  if (token === 'SIMULATED_TOKEN') {
    return res.json({
      success: true,
      simulated: true,
      invoice_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order || !order.shiprocket_order_id) {
      return res.status(404).json({ success: false, error: 'Order or Shiprocket Order ID not found' });
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/print/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: [parseInt(order.shiprocket_order_id)] })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Invoice generation failed: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    res.json({ success: true, simulated: false, invoice_url: data.invoice_url || '' });
  } catch (err) {
    next(err);
  }
});

// D. Shiprocket Webhook Receiver (Push Realtime updates to Supabase)
app.post('/api/shiprocket/webhook', async (req, res) => {
  const token = req.headers['x-shiprocket-webhook-token'];
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

  if (expectedToken && token !== expectedToken) {
    console.warn('Unauthorized Shiprocket webhook callback attempt.');
    return res.status(401).json({ success: false, error: 'Unauthorized signature' });
  }

  const { awb, current_status, current_status_id, scans } = req.body;
  console.log(`Received Shiprocket Webhook: AWB=${awb}, Status=${current_status}`);

  if (!awb) {
    return res.status(400).json({ success: false, error: 'AWB is required' });
  }

  try {
    // Map status numeric IDs or strings to packed/shipped/delivered
    let shipmentStatus = 'Shipped';
    const statusLower = (current_status || '').toLowerCase();
    
    if (statusLower.includes('delivered')) {
      shipmentStatus = 'Delivered';
    } else if (statusLower.includes('out for delivery') || statusLower.includes('out_for_delivery')) {
      shipmentStatus = 'Out for Delivery';
    } else if (statusLower.includes('shipped') || statusLower.includes('in transit') || statusLower.includes('in_transit')) {
      shipmentStatus = 'Shipped';
    } else if (statusLower.includes('packed') || statusLower.includes('ready')) {
      shipmentStatus = 'Packed';
    }

    // Map scans to history array
    const scanHistory = (scans || []).map(s => ({
      status: s.status || 'In Transit',
      activity: s.activity || 'Scanned at terminal.',
      location: s.location || 'Courier Hub',
      date: s.date || new Date().toISOString()
    }));

    // Update database
    // Update database
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        shipment_status: shipmentStatus,
        shipment_history: scanHistory,
        order_status: shipmentStatus,
        status: shipmentStatus.toLowerCase()
      })
      .eq('awb_code', awb)
      .select()
      .single();

    if (error) throw error;

    if (updatedOrder) {
      // Trigger status-specific emails
      let emailType = null;
      if (shipmentStatus === 'Shipped') {
        emailType = 'shipped';
      } else if (shipmentStatus === 'Out for Delivery') {
        emailType = 'out_for_delivery';
      } else if (shipmentStatus === 'Delivered') {
        emailType = 'delivered';
      }

      if (emailType) {
        emailService.sendOrderEmail(updatedOrder, emailType).catch(err => console.error(`Error sending ${emailType} email:`, err));
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error handling Shiprocket webhook:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to calculate rating summary for a product
async function getProductRatingSummary(productId) {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');

  if (error) {
    console.error('Error calculating rating summary:', error);
    return { averageRating: 0, totalRatings: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const totalRatings = reviews.length;
  if (totalRatings === 0) {
    return { averageRating: 0, totalRatings: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = parseFloat((sum / totalRatings).toFixed(1));

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (counts[r.rating] !== undefined) {
      counts[r.rating]++;
    }
  });

  const breakdown = {};
  for (let star = 1; star <= 5; star++) {
    breakdown[star] = Math.round((counts[star] / totalRatings) * 100);
  }

  return { averageRating, totalRatings, breakdown };
}

// --- PRODUCT RATINGS & REVIEWS ENDPOINTS ---

// Rate Limiters for review submissions (max 5 per 15 mins per IP to prevent spam)
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many reviews submitted. Please wait 15 minutes.' }
});

// 1. Submit Rating & Review
app.post('/api/reviews', authenticateUser, reviewLimiter, async (req, res) => {
  const { productId, rating, title, comment, media } = req.body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Product ID and a valid rating (1-5) are required.' });
  }

  try {
    // Check if user has already reviewed this product
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .single();

    if (existingReview) {
      return res.status(400).json({ success: false, error: 'You have already rated/reviewed this product.' });
    }

    // Verified purchase check
    const { data: orders, error: oErr } = await supabase
      .from('orders')
      .select('products, status, order_status, payment_status')
      .eq('user_id', req.user.id);

    if (oErr) {
      console.error('Error checking user orders:', oErr);
    }

    let isVerified = false;
    if (orders && orders.length > 0) {
      isVerified = orders.some(order => {
        const isCompleted = 
          (order.order_status?.toLowerCase() === 'delivered') ||
          (order.status?.toLowerCase() === 'delivered') ||
          (order.payment_status?.toLowerCase() === 'paid');

        if (!isCompleted) return false;

        const productsList = Array.isArray(order.products) ? order.products : [];
        return productsList.some(p => p.id === productId);
      });
    }

    if (!isVerified) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only verified buyers who have received this product can leave a rating or review.' 
      });
    }

    // Get user's profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', req.user.id)
      .single();

    const customerName = profile?.name || req.user.email.split('@')[0];

    // Insert Review
    const { data: newReview, error: insertErr } = await supabase
      .from('reviews')
      .insert([{
        user_id: req.user.id,
        product_id: productId,
        rating: parseInt(rating),
        title: title ? sanitizeString(title) : null,
        comment: comment ? sanitizeString(comment) : null,
        customer_name: customerName,
        is_verified: true,
        status: 'approved' // Automatically approved to go live
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Handle Media uploads if any
    if (media && Array.isArray(media) && media.length > 0) {
      const mediaRows = media.map(m => ({
        review_id: newReview.id,
        media_url: m.media_url,
        media_type: m.media_type
      }));

      const { error: mediaErr } = await supabase
        .from('review_media')
        .insert(mediaRows);

      if (mediaErr) {
        console.error('Error inserting review media:', mediaErr);
      }
    }

    // Compute updated ratings summary
    const summary = await getProductRatingSummary(productId);

    // Map review response format
    const responseReview = {
      id: newReview.id,
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      customerName: newReview.customer_name || customerName,
      customerEmail: req.user.email,
      avatarUrl: profile?.avatar_url || null,
      isVerified: newReview.is_verified,
      createdAt: newReview.created_at,
      media: media || [],
      helpfulCount: 0,
      unhelpfulCount: 0
    };

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${productId}`).emit('review_added', {
        productId,
        review: responseReview,
        summary
      });
    }

    res.status(201).json({ success: true, review: responseReview, summary });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Edit Review
app.put('/api/reviews/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, media } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Valid rating (1-5) is required.' });
  }

  try {
    // Verify owner
    const { data: review, error: getErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    if (review.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You are not authorized to edit this review.' });
    }

    // Update review
    const { data: updatedReview, error: updateErr } = await supabase
      .from('reviews')
      .update({
        rating: parseInt(rating),
        title: title ? sanitizeString(title) : null,
        comment: comment ? sanitizeString(comment) : null,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Handle Media updates
    if (media && Array.isArray(media)) {
      // Clear old media
      await supabase.from('review_media').delete().eq('review_id', id);

      if (media.length > 0) {
        const mediaRows = media.map(m => ({
          review_id: id,
          media_url: m.media_url,
          media_type: m.media_type
        }));
        await supabase.from('review_media').insert(mediaRows);
      }
    }

    const summary = await getProductRatingSummary(review.product_id);

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${review.product_id}`).emit('review_updated', {
        productId: review.product_id,
        review: updatedReview,
        summary
      });
    }

    res.json({ success: true, review: updatedReview, summary });
  } catch (err) {
    console.error('Error editing review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Delete Review (Owner or Admin)
app.delete('/api/reviews/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: review, error: getErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (getErr || !review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (review.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this review.' });
    }

    const { error: deleteErr } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    const summary = await getProductRatingSummary(review.product_id);

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${review.product_id}`).emit('review_deleted', {
        productId: review.product_id,
        reviewId: id,
        summary
      });
    }

    res.json({ success: true, message: 'Review deleted successfully.', summary });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Paginated Product Reviews
app.get('/api/reviews/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'newest';
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('reviews')
      .select(`
        id, rating, title, comment, customer_name, is_verified, is_featured, created_at,
        profiles (name, avatar_url, email)
      `, { count: 'exact' })
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (sort === 'highest') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'lowest') {
      query = query.order('rating', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: reviews, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    if (!reviews || reviews.length === 0) {
      return res.json({ success: true, reviews: [], totalReviews: 0, totalPages: 0 });
    }

    const reviewIds = reviews.map(r => r.id);

    // Fetch media and helpful votes
    const { data: media } = await supabase
      .from('review_media')
      .select('*')
      .in('review_id', reviewIds);

    const { data: likes } = await supabase
      .from('review_likes')
      .select('*')
      .in('review_id', reviewIds);

    const mappedReviews = reviews.map(r => {
      const reviewMedia = media ? media.filter(m => m.review_id === r.id) : [];
      const reviewLikes = likes ? likes.filter(l => l.review_id === r.id) : [];
      
      const helpfulCount = reviewLikes.filter(l => l.is_helpful).length;
      const unhelpfulCount = reviewLikes.filter(l => !l.is_helpful).length;

      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.customer_name || (r.profiles ? r.profiles.name : 'Verified Buyer'),
        customerEmail: r.profiles ? r.profiles.email : null,
        avatarUrl: r.profiles ? r.profiles.avatar_url : null,
        isVerified: r.is_verified,
        isFeatured: r.is_featured,
        createdAt: r.created_at,
        media: reviewMedia.map(m => ({ url: m.media_url, type: m.media_type })),
        helpfulCount,
        unhelpfulCount
      };
    });

    if (sort === 'helpful') {
      mappedReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    res.json({
      success: true,
      reviews: mappedReviews,
      totalReviews: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Product Rating Summary
app.get('/api/reviews/summary/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const summary = await getProductRatingSummary(productId);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Error getting rating summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Toggle Helpful / Like Vote
app.post('/api/reviews/:id/helpful', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { isHelpful = true } = req.body;

  try {
    // Check if user already liked it
    const { data: existingLike } = await supabase
      .from('review_likes')
      .select('*')
      .eq('review_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existingLike) {
      if (existingLike.is_helpful === isHelpful) {
        // Toggle off (remove vote)
        await supabase.from('review_likes').delete().eq('id', existingLike.id);
      } else {
        // Update vote
        await supabase.from('review_likes').update({ is_helpful: isHelpful }).eq('id', existingLike.id);
      }
    } else {
      // Add new vote
      await supabase.from('review_likes').insert([{
        review_id: id,
        user_id: req.user.id,
        is_helpful: isHelpful
      }]);
    }

    // Emit live helpful counts update
    const { data: review } = await supabase.from('reviews').select('product_id').eq('id', id).single();
    const { data: likes } = await supabase.from('review_likes').select('*').eq('review_id', id);
    const helpfulCount = likes ? likes.filter(l => l.is_helpful).length : 0;

    const io = req.app.get('io');
    if (io && review) {
      io.to(`product_${review.product_id}`).emit('review_likes_updated', {
        reviewId: id,
        helpfulCount
      });
    }

    res.json({ success: true, helpfulCount });
  } catch (err) {
    console.error('Error toggling helpful vote:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Report Review
app.post('/api/reviews/:id/report', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const { error } = await supabase
      .from('review_reports')
      .insert([{
        review_id: id,
        user_id: req.user.id,
        reason: reason ? sanitizeString(reason) : 'Inappropriate content'
      }]);

    if (error && error.code !== '23505') throw error; // Ignore duplicates error (23505)

    res.json({ success: true, message: 'Review reported successfully.' });
  } catch (err) {
    console.error('Error reporting review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN REVIEW MANAGEMENT ENDPOINTS ---

// 8. Admin: List All Reviews with Filters
app.get('/api/admin/reviews', authenticateAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const rating = req.query.rating;
  const status = req.query.status;
  const verified = req.query.verified;
  const search = req.query.search;
  const productId = req.query.productId;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('reviews')
      .select(`
        id, rating, title, comment, customer_name, is_verified, status, is_featured, created_at, product_id,
        products (title),
        profiles (email)
      `, { count: 'exact' });

    if (rating) query = query.eq('rating', parseInt(rating));
    if (status) query = query.eq('status', status);
    if (verified) query = query.eq('is_verified', verified === 'true');
    if (productId && productId !== 'all') query = query.eq('product_id', productId);
    
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,comment.ilike.%${search}%,title.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: reviews, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.id,
        productId: r.product_id,
        productName: r.products ? r.products.title : 'Deleted Product',
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.customer_name,
        customerEmail: r.profiles ? r.profiles.email : null,
        isVerified: r.is_verified,
        isFeatured: r.is_featured,
        status: r.status,
        createdAt: r.created_at
      })),
      totalReviews: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Admin reviews query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin: Moderate Review Status (Approve / Reject)
app.put('/api/admin/reviews/:id/status', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid moderation status.' });
  }

  try {
    const { data: review, error: getErr } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', id)
      .single();

    if (getErr || !review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    const { data: updatedReview, error: updateErr } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    const summary = await getProductRatingSummary(review.product_id);

    // Emit live update
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${review.product_id}`).emit('review_moderated', {
        productId: review.product_id,
        reviewId: id,
        status,
        summary
      });
    }

    res.json({ success: true, review: updatedReview, summary });
  } catch (err) {
    console.error('Admin review status update error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9b. Admin: Toggle Review Featured Status
app.put('/api/admin/reviews/:id/featured', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    const { data: review, error: getErr } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', id)
      .single();

    if (getErr || !review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    const { data: updatedReview, error: updateErr } = await supabase
      .from('reviews')
      .update({ is_featured: !!isFeatured })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Emit live update
    const io = req.app.get('io');
    if (io) {
      io.to(`product_${review.product_id}`).emit('review_updated', {
        productId: review.product_id,
        review: {
          id: updatedReview.id,
          rating: updatedReview.rating,
          title: updatedReview.title,
          comment: updatedReview.comment,
          customer_name: updatedReview.customer_name,
          is_verified: updatedReview.is_verified,
          is_featured: updatedReview.is_featured,
          created_at: updatedReview.created_at
        }
      });
    }

    res.json({ success: true, review: updatedReview });
  } catch (err) {
    console.error('Admin review featured toggle error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Admin: Review Statistics Dashboard
app.get('/api/admin/reviews/stats', authenticateAdmin, async (req, res) => {
  try {
    const { data: allReviews, error } = await supabase
      .from('reviews')
      .select('rating, status, is_verified');

    if (error) throw error;

    const { data: reports } = await supabase.from('review_reports').select('id');

    const total = allReviews.length;
    const approved = allReviews.filter(r => r.status === 'approved').length;
    const pending = allReviews.filter(r => r.status === 'pending').length;
    const rejected = allReviews.filter(r => r.status === 'rejected').length;
    const verified = allReviews.filter(r => r.is_verified).length;

    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;

    res.json({
      success: true,
      stats: {
        totalReviews: total,
        approvedReviews: approved,
        pendingReviews: pending,
        rejectedReviews: rejected,
        verifiedReviews: verified,
        averageRating: avg,
        reportedReviews: reports ? reports.length : 0
      }
    });
  } catch (err) {
    console.error('Admin review stats fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Secure Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled System Error:', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const responseError = isProduction 
    ? 'Internal system error occurred. Please contact customer support.' 
    : err.message || 'Unknown internal error';
    
  res.status(err.status || 500).json({
    success: false,
    error: responseError
  });
});

// Start Server & Bind Socket.io
const server = app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_product_room', (productId) => {
    socket.join(`product_${productId}`);
  });

  socket.on('leave_product_room', (productId) => {
    socket.leave(`product_${productId}`);
  });
});
