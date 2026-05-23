const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SsUdDbfNytrJV9',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Initialize Supabase Client (bypasses RLS to write verified payments securely)
const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing in backend .env file. Order storage will fall back to local simulations.');
}

// Nodemailer confirmation email utility
async function sendConfirmationEmail(order) {
  const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
  let transporter;

  if (isSmtpConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('SMTP credentials not configured. Simulated email invoice successfully sent to client:', order.customer_email);
    return;
  }

  const productsListHtml = order.products && Array.isArray(order.products) 
    ? order.products.map(p => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: bold; color: #1a4a35;">${p.name}</div>
            <div style="font-size: 11px; color: #888;">Qty: ${p.quantity}</div>
          </td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f0f0f0; color: #333;">
            ₹${(p.price * p.quantity).toLocaleString()}
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="2" style="padding: 12px;">Standard Boutique Selection</td></tr>`;

  const emailHtml = `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; background-color: #faf8f5; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0dcd3;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1a4a35; font-size: 28px; font-weight: normal; letter-spacing: 0.25em; text-transform: uppercase; margin: 0;">MOLVBRIV</h1>
        <p style="font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #765931; margin-top: 5px;">A Timeless Curator Experience</p>
      </div>

      <div style="background-color: #ffffff; padding: 40px; border-radius: 2px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <h2 style="font-weight: normal; color: #1a4a35; margin-top: 0; font-size: 20px;">Order Confirmation</h2>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">Dear ${order.customer_name || 'Valued Client'},</p>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">Thank you for your boutique order. We are preparing your curated masterpiece for secure white-glove transit.</p>

        <div style="margin: 30px 0; border: 1px solid #f0ece3; padding: 20px; background-color: #fcfcfc;">
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Order Number</div>
          <div style="font-size: 16px; color: #1a4a35; font-weight: bold; margin-bottom: 16px;">${order.razorpay_order_id || order.id}</div>
          
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Shipping Destination</div>
          <div style="font-size: 13px; color: #555; line-height: 1.4; margin-bottom: 16px;">
            ${typeof order.shipping_address === 'string' ? order.shipping_address : `
              ${order.shipping_address?.address || ''}<br/>
              ${order.shipping_address?.apartment ? order.shipping_address.apartment + '<br/>' : ''}
              ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pinCode || ''}
            `}
          </div>

          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Payment Method</div>
          <div style="font-size: 13px; color: #555;">${order.payment_method === 'COD' ? 'Cash on Delivery (Pending)' : 'Online Payment (Secure)'}</div>
        </div>

        <h3 style="font-weight: normal; color: #1a4a35; border-bottom: 1px solid #e0dcd3; padding-bottom: 8px; font-size: 16px;">Invoice Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #fafafa; border-bottom: 1px solid #eaeaea;">
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #1a4a35;">Bespoke Product</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; color: #1a4a35;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${productsListHtml}
            <tr>
              <td style="padding: 12px; font-weight: bold; border-top: 1px solid #e0dcd3; color: #1a4a35;">Grand Total</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #e0dcd3; color: #1a4a35; font-size: 16px;">
                ₹${parseFloat(order.total_amount || order.total_price).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px;">
          <a href="https://molvbriv.vercel.app/track-order?id=${order.razorpay_order_id || order.id}&email=${order.customer_email}" 
             style="background-color: #1a4a35; color: #ffffff; text-decoration: none; padding: 15px 30px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: bold; display: inline-block; border-radius: 2px;">
            Track Your Masterpiece
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; color: #888; font-size: 11px;">
        <p>MOLVBRIV Curated Luxury Jewelry</p>
        <p style="font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;">This is an automated invoice. Do not reply to this mail.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"MOLVBRIV Concierge" <concierge@molvbriv.in>',
    to: order.customer_email,
    subject: `Your MOLVBRIV Order Confirmation [${order.razorpay_order_id || order.id}]`,
    html: emailHtml
  });
}

// --- SECURE PAYMENT & WEBHOOK ENDPOINTS ---

// 1. Create Razorpay Order and pre-create 'Pending' order in Supabase
app.post('/api/payments/create-order', async (req, res) => {
  const { amount, currency, checkoutDetails } = req.body;
  
  try {
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
          payment_status: 'Pending',
          order_status: 'Pending',
          status: 'Pending'
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
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to initialize payment' });
  }
});

// 2. Verify payment signatures and commit orders
app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutDetails } = req.body;

  try {
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
      console.log('Razorpay Key Secret missing. Simulating signature verification success.');
      verified = true;
    }

    if (!verified) {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Failed',
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
          payment_status: 'Paid',
          order_status: 'Paid',
          status: 'paid',
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
            payment_status: 'Paid',
            order_status: 'Paid',
            status: 'paid'
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

    sendConfirmationEmail(orderRecord).catch(err => console.error('Error sending confirmation email:', err));

    res.json({ success: true, order: orderRecord });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ success: false, error: error.message || 'Payment verification failed' });
  }
});

// 3. Cash on Delivery checkout
app.post('/api/payments/cod', async (req, res) => {
  const { checkoutDetails } = req.body;
  
  try {
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
          payment_status: 'Pending',
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

    sendConfirmationEmail(orderRecord).catch(err => console.error('Error sending confirmation email:', err));

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
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.error('Webhook signature mismatch');
        return res.status(400).json({ success: false, error: 'Signature mismatch' });
      }
    }

    const event = req.body.event;
    console.log('Razorpay Webhook event received:', event);

    if (event === 'payment.captured' || event === 'payment.failed') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const status = event === 'payment.captured' ? 'Paid' : 'Failed';

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: existing } = await supabase
          .from('orders')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        if (existing && existing.payment_status !== 'Paid') {
          const { data: updated } = await supabase
            .from('orders')
            .update({
              payment_status: status,
              order_status: status === 'Paid' ? 'Paid' : 'Failed',
              status: status === 'Paid' ? 'paid' : 'failed',
              payment_id: razorpayPaymentId,
              razorpay_payment_id: razorpayPaymentId
            })
            .eq('razorpay_order_id', razorpayOrderId)
            .select()
            .single();

          if (status === 'Paid' && updated) {
            sendConfirmationEmail(updated).catch(err => console.error('Email error:', err));
          }
        }
      }
    } else if (event === 'refund.processed') {
      const refundEntity = req.body.payload.refund.entity;
      const razorpayPaymentId = refundEntity.payment_id;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase
          .from('orders')
          .update({
            order_status: 'Cancelled',
            status: 'cancelled',
            payment_status: 'Failed'
          })
          .eq('payment_id', razorpayPaymentId);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: error.message });
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

// GET all products
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST new product
app.post('/api/products', (req, res) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "INSERT INTO products (name, price, category, material, stock, status) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [name, price, category, material, stock, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, price, category, material, stock, status });
  });
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const { name, price, category, material, stock, status } = req.body;
  const sql = "UPDATE products SET name = ?, price = ?, category = ?, material = ?, stock = ?, status = ? WHERE id = ?";
  db.run(sql, [name, price, category, material, stock, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
