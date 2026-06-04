const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Global cached SMTP transporter singleton
let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Verify credentials exist and are NOT default placeholder values
  if (user && pass && 
      user !== 'your_email@gmail.com' && 
      user.trim() !== '' &&
      !user.includes('your_email')) {
    
    console.log("Initializing persistent, pooled SMTP transporter client...");
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: user,
        pass: pass
      },
      connectionTimeout: 3000,   // 3 seconds connection timeout
      greetingTimeout: 3000,     // 3 seconds greeting timeout
      socketTimeout: 5000,       // 5 seconds socket timeout
      pool: true,                // Enable connection pooling
      maxConnections: 5,         // Max 5 simultaneous connections
      maxMessages: 100           // Max 100 messages per connection
    });
    return cachedTransporter;
  }
  return null;
}

/**
 * Standard Email Format Validation Helper
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Robust Email Templates Dictionary
 */
const templates = {
  // 1. ORDER CONFIRMED
  confirmed: (order) => {
    const productsHtml = order.products && Array.isArray(order.products)
      ? order.products.map(p => `
          <tr>
            <td style="padding: 14px 10px; border-bottom: 1px solid #eae6db; text-align: left;">
              <div style="font-size: 13px; font-weight: 600; color: #1a4a35; font-family: Georgia, serif;">${p.name}</div>
              <div style="font-size: 10px; color: #8c8573; text-transform: uppercase; tracking-wider; margin-top: 4px;">Qty: ${p.quantity}</div>
            </td>
            <td style="padding: 14px 10px; border-bottom: 1px solid #eae6db; text-align: right; color: #1a4a35; font-weight: bold; font-size: 13px;">
              ₹${(p.price * p.quantity).toLocaleString()}.00
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="padding: 14px; text-align: center; color: #8c8573;">Boutique Curated Jewelry Selection</td></tr>`;

    return {
      title: 'Order Confirmed',
      preheader: 'Your Molvbriv order has been successfully placed and secured.',
      heading: 'Your Selection is Secured',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          Thank you for choosing **Molvbriv**. We are pleased to confirm that your order has been successfully placed. Our master artisans are now auditing and preparing your curated selection with extreme precision for secure, white-glove logistics.
        </p>
        
        <!-- Summary Box -->
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 24px; margin-bottom: 35px; border-radius: 3px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #4a453a;">
            <tr>
              <td style="padding-bottom: 12px; width: 40%; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Order Number</td>
              <td style="padding-bottom: 12px; color: #1a4a35; font-weight: bold; font-size: 13px;">${order.razorpay_order_id || order.id}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Destination</td>
              <td style="padding-bottom: 12px; color: #4a453a;">
                ${typeof order.shipping_address === 'string' ? order.shipping_address : `
                  ${order.shipping_address?.address || ''}<br/>
                  ${order.shipping_address?.apartment ? order.shipping_address.apartment + '<br/>' : ''}
                  ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pinCode || ''}
                `}
              </td>
            </tr>
            ${order.shipping_address?.billingAddress ? `
            <tr>
              <td style="padding-bottom: 12px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Billing Address</td>
              <td style="padding-bottom: 12px; color: #4a453a;">
                ${order.shipping_address.billingAddress.firstName} ${order.shipping_address.billingAddress.lastName}<br/>
                ${order.shipping_address.billingAddress.address || ''}<br/>
                ${order.shipping_address.billingAddress.apartment ? order.shipping_address.billingAddress.apartment + '<br/>' : ''}
                ${order.shipping_address.billingAddress.city || ''}, ${order.shipping_address.billingAddress.state || ''} - ${order.shipping_address.billingAddress.pinCode || ''}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding-bottom: 12px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Phone</td>
              <td style="padding-bottom: 12px; color: #4a453a;">${order.customer_phone || ''}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Payment Details</td>
              <td style="color: #4a453a; font-weight: 500;">
                ${order.payment_method === 'COD' ? 'Cash on Delivery (Pending)' : 'Secure Online Transaction (Paid)'}
              </td>
            </tr>
          </table>
        </div>

        <!-- Invoice Breakdown -->
        <h3 style="font-family: Georgia, serif; font-weight: normal; color: #1a4a35; font-size: 16px; border-bottom: 1px solid #765931; padding-bottom: 8px; margin-bottom: 15px;">Invoice Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background-color: #faf9f6; border-bottom: 1px solid #eae6db;">
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #8c8573; text-align: left;">Bespoke Piece</th>
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #8c8573; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
            <tr>
              <td style="padding: 16px 10px; font-weight: bold; font-family: Georgia, serif; font-size: 14px; color: #1a4a35; border-top: 1px solid #765931;">Grand Total</td>
              <td style="padding: 16px 10px; text-align: right; font-weight: bold; font-size: 16px; color: #1a4a35; border-top: 1px solid #765931; font-family: Georgia, serif;">
                ₹${parseFloat(order.total_amount || order.total_price).toLocaleString()}.00
              </td>
            </tr>
          </tbody>
        </table>
      `
    };
  },

  // 2. ORDER SHIPPED
  shipped: (order) => {
    const trackingUrl = `https://www.molvbriv.in/track-order?id=${order.razorpay_order_id || order.id}&email=${order.customer_email}`;
    return {
      title: 'Order Dispatched',
      preheader: 'Your Molvbriv masterpiece is on its way via our premium courier partners.',
      heading: 'Your Selection is Dispatched',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          We are delighted to inform you that your curated jewelry has passed our rigorous quality check, was safely packed, and has been dispatched from our Delhi warehouse.
        </p>

        <!-- Shipping Details -->
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 24px; margin-bottom: 35px; border-radius: 3px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #4a453a;">
            <tr>
              <td style="padding-bottom: 12px; width: 40%; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Order ID</td>
              <td style="padding-bottom: 12px; color: #1a4a35; font-weight: bold;">${order.razorpay_order_id || order.id}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Courier Partner</td>
              <td style="padding-bottom: 12px; color: #4a453a; font-weight: bold;">${order.courier_name || 'Shiprocket Courier'}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">AWB / Tracking</td>
              <td style="padding-bottom: 12px; color: #1a4a35; font-family: monospace; font-size: 13px; font-weight: bold;">${order.awb_code || order.tracking_id || 'Pending'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Estimated Arrival</td>
              <td style="color: #1a4a35; font-weight: 600;">3 to 6 Business Days</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px; text-align: center;">
          You can track your package in real-time on our dedicated tracking console.
        </p>
      `,
      action: {
        text: 'Track Shipment Live',
        url: trackingUrl
      }
    };
  },

  // 3. OUT FOR DELIVERY
  out_for_delivery: (order) => {
    const trackingUrl = `https://www.molvbriv.in/track-order?id=${order.razorpay_order_id || order.id}&email=${order.customer_email}`;
    return {
      title: 'Out for Delivery',
      preheader: 'Our secure delivery partner is delivering your Molvbriv selection today.',
      heading: 'Out for Delivery Today',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          Good news! Your Molvbriv curated masterpiece has arrived at your local hub and is **out for delivery today**. Our delivery advisor will deliver your secure package directly to your destination.
        </p>

        <!-- Delivery Address Summary -->
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 20px; margin-bottom: 35px; border-radius: 2px;">
          <div style="font-size: 10px; font-weight: bold; color: #8c8573; text-transform: uppercase; tracking-widest; margin-bottom: 6px;">Delivery Destination</div>
          <div style="font-size: 13px; color: #1a4a35; line-height: 1.4; font-family: Georgia, serif;">
            ${typeof order.shipping_address === 'string' ? order.shipping_address : `
              ${order.shipping_address?.address || ''}<br/>
              ${order.shipping_address?.apartment ? order.shipping_address.apartment + '<br/>' : ''}
              ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pinCode || ''}
            `}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #8c8573; margin-bottom: 30px; font-style: italic;">
          *Please ensure someone is available at the destination to receive and sign for the luxury shipment. For COD orders, please have the exact amount of ₹${parseFloat(order.total_amount || order.total_price).toLocaleString()} ready.
        </p>
      `,
      action: {
        text: 'Track Courier Map',
        url: trackingUrl
      }
    };
  },

  // 4. DELIVERED
  delivered: (order) => {
    return {
      title: 'Timeless Piece Delivered',
      preheader: 'Your Molvbriv curated jewelry has been safely hand-delivered.',
      heading: 'A Lifetime of Timeless Luxury',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          We are pleased to confirm that your **Molvbriv** curated selection has been successfully hand-delivered and received at your destination.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          Every Molvbriv piece is meticulously handcrafted by our master artisans to tell a story of eternal beauty and architectural balance. We hope your selection brings you standard elegance and luxury for years to come.
        </p>
        
        <div style="border-top: 1px solid #eae6db; padding-top: 25px; margin-top: 25px; text-align: center;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8c8573; margin-bottom: 5px;">Secured Delivery Log</p>
          <span style="font-size: 14px; color: #1a4a35; font-family: monospace; font-weight: bold;">AWB #${order.awb_code || order.tracking_id || 'MB-DELIVERED'}</span>
        </div>
      `
    };
  },

  // 5. ORDER CANCELLED
  cancelled: (order) => {
    return {
      title: 'Order Cancelled',
      preheader: 'Confirmation of your Molvbriv order cancellation request.',
      heading: 'Order Cancellation Confirmed',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          This email confirms that your order **${order.razorpay_order_id || order.id}** has been cancelled as requested or due to processing issues.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          If this was a prepaid order, our finance department has initialized the refund transaction. The funds will be credited back to your original payment source account within **5 to 7 business days**.
        </p>
        
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 20px; border-radius: 2px; text-align: center; margin-bottom: 25px;">
          <div style="font-size: 10px; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Cancelled Order Total</div>
          <div style="font-size: 20px; color: #765931; font-family: Georgia, serif; font-weight: bold;">₹${parseFloat(order.total_amount || order.total_price).toLocaleString()}.00</div>
        </div>
      `
    };
  },

  // 6. REFUND PROCESSED
  refund_processed: (order) => {
    return {
      title: 'Refund Processed',
      preheader: 'Refund transaction for your Molvbriv order has been successfully processed.',
      heading: 'Refund Process Complete',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          We have successfully processed the refund for your cancelled order **${order.razorpay_order_id || order.id}**.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          The transaction has been fully settled on our gateway, and the refund amount has been released back to your banking institution. The time for the funds to reflect in your account depends on your bank and typically takes **2 to 5 business days**.
        </p>
        
        <!-- Transaction Table -->
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 24px; border-radius: 3px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #4a453a;">
            <tr>
              <td style="padding-bottom: 10px; width: 40%; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Order Number</td>
              <td style="padding-bottom: 10px; color: #1a4a35; font-weight: bold;">${order.razorpay_order_id || order.id}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Refund Amount</td>
              <td style="padding-bottom: 10px; color: #765931; font-weight: bold; font-size: 13px;">₹${parseFloat(order.total_amount || order.total_price).toLocaleString()}.00</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Refund Method</td>
              <td style="color: #4a453a;">Original Source Payment</td>
            </tr>
          </table>
        </div>
      `
    };
  },

  // 6.5. ORDER RETURNED
  returned: (order) => {
    return {
      title: 'Return Request Initiated',
      preheader: 'Your Molvbriv return request has been recorded and is being processed.',
      heading: 'Return Request Confirmed',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear ${order.customer_name || 'Boutique Patron'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          This email confirms that we have successfully initiated a return request for your order **${order.razorpay_order_id || order.id}**.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          Our client advisory concierge team will contact you shortly to coordinate the secure return pickup details and instructions.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 30px;">
          Upon secure receipt and authentication check of the jewelry piece at our Delhi studio, your refund will be automatically processed back to your original payment method.
        </p>
        
        <!-- Return Details Table -->
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 24px; border-radius: 3px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #4a453a;">
            <tr>
              <td style="padding-bottom: 10px; width: 40%; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Order Number</td>
              <td style="padding-bottom: 10px; color: #1a4a35; font-weight: bold;">${order.razorpay_order_id || order.id}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Return Value</td>
              <td style="padding-bottom: 10px; color: #765931; font-weight: bold; font-size: 13px;">₹${parseFloat(order.total_amount || order.total_price).toLocaleString()}.00</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Status</td>
              <td style="color: #765931; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Return Initiated</td>
            </tr>
          </table>
        </div>
      `
    };
  },

  // 7. NEWSLETTER WELCOME
  newsletter_welcome: (subscriber) => {
    return {
      title: 'Welcome to the MOLVBRIV Circle',
      preheader: 'An exclusive invitation to a world of architectural jewelry precision.',
      heading: 'Welcome to the Circle',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear Patron,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          Thank you for subscribing to **MOLVBRIV**. You have successfully joined our exclusive inner circle of boutique curation.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          As a member of the Circle, you will receive priority access to our master artisans' newest releases, behind-the-scenes glimpses into our design process, and exclusive invitations to private boutique events.
        </p>
        
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 20px; border-radius: 2px; text-align: center; margin-bottom: 25px;">
          <div style="font-size: 10px; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Exclusive Benefits Status</div>
          <div style="font-size: 15px; color: #1a4a35; font-family: Georgia, serif; font-weight: bold;">Standard Gold Access Activated</div>
        </div>
      `
    };
  },

  // 8. NEWSLETTER ADMIN NOTIFICATION
  newsletter_admin: (subscriber) => {
    return {
      title: 'New Subscriber Alert',
      preheader: 'A new patron has joined the MOLVBRIV Circle.',
      heading: 'New Circle Subscriber',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Hello Admin,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          Great news! A new patron has just subscribed to the MOLVBRIV newsletter circle.
        </p>
        
        <div style="background-color: #faf9f6; border: 1px solid #eae6db; padding: 24px; border-radius: 3px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #4a453a;">
            <tr>
              <td style="padding-bottom: 10px; width: 40%; font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Subscriber Email</td>
              <td style="padding-bottom: 10px; color: #1a4a35; font-weight: bold; font-size: 13px;">\${subscriber.email}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #8c8573; text-transform: uppercase; letter-spacing: 0.1em;">Subscription Time</td>
              <td style="color: #4a453a;">\${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
            </tr>
          </table>
        </div>
      `
    };
  },
  // 9. PASSWORD RESET
  password_reset: (data) => {
    return {
      title: 'Password Reset Request',
      preheader: 'Securely reset your MOLVBRIV account password.',
      heading: 'Password Reset Request',
      body: `
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 20px;">Dear Patron,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          We received a request to reset the password for your MOLVBRIV account associated with this email address.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4a453a; margin-bottom: 25px;">
          If you did not make this request, please safely ignore this email. Otherwise, you can securely reset your password by clicking the button below:
        </p>
      `,
      action: {
        text: 'Reset My Password',
        url: data.recoveryLink
      }
    };
  }
};

/**
 * Base Responsive HTML Shell Wrapper
 */
function buildHtmlWrapper(templateContent) {
  const actionButtonHtml = templateContent.action 
    ? `
      <!-- Action Button -->
      <table style="margin: 30px auto; border-collapse: collapse;">
        <tr>
          <td style="background-color: #1a4a35; text-align: center; border-radius: 2px;">
            <a href="${templateContent.action.url}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-family: Helvetica, Arial, sans-serif; font-weight: bold;">
              ${templateContent.action.text}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${templateContent.title}</title>
      <style>
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f7f6f2 !important; }
        * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        div[style*="margin: 16px 0"] { margin: 0 !important; }
        table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
        table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
        img { -ms-interpolation-mode: bicubic; }
        a { text-decoration: none; }
        
        /* Responsive CSS Rules */
        @media screen and (max-width: 600px) {
          .email-container { width: 100% !important; padding: 10px !important; }
          .card-body { padding: 30px 20px !important; }
          .logo-title { font-size: 24px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: Georgia, 'Times New Roman', serif;">
      <!-- Hidden Preheader Text -->
      <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        ${templateContent.preheader}
      </div>

      <center style="width: 100%; background-color: #faf8f5; padding: 40px 0;">
        <table class="email-container" style="width: 600px; margin: 0 auto; border-collapse: collapse; border: 1px solid #eae6db; background-color: #ffffff;">
          
          <!-- Sleek Header Logo -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #fcfcfc;">
              <h1 class="logo-title" style="margin: 0; color: #1a4a35; font-size: 28px; font-weight: normal; letter-spacing: 0.3em; text-transform: uppercase;">MOLVBRIV</h1>
              <p style="margin: 6px 0 0 0; font-size: 9px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #765931;">A Timeless Curator Experience</p>
            </td>
          </tr>

          <!-- Fine Gold Border Accents -->
          <tr>
            <td style="height: 1px; background-color: #765931; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Main Content Card Body -->
          <tr>
            <td class="card-body" style="padding: 50px 40px; text-align: left; background-color: #ffffff;">
              <h2 style="font-family: Georgia, serif; font-weight: normal; color: #1a4a35; font-size: 22px; margin-top: 0; margin-bottom: 25px; letter-spacing: 0.02em;">
                ${templateContent.heading}
              </h2>
              
              <!-- Content Body Injection -->
              ${templateContent.body}
              
              <!-- Action Button Integration -->
              ${actionButtonHtml}
              
              <!-- Signature and Concierge Details -->
              <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eae6db; font-size: 13px; line-height: 1.5; color: #765931;">
                <p style="margin: 0; font-weight: bold;">Molvbriv Curators</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #8c8573;">
                  Client Advisory Concierge: <a href="mailto:${process.env.SUPPORT_EMAIL || 'concierge@molvbriv.in'}" style="color: #1a4a35; text-decoration: underline;">${process.env.SUPPORT_EMAIL || 'concierge@molvbriv.in'}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer Block -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #1a4a35; color: #ffffff; font-size: 11px; font-family: Helvetica, Arial, sans-serif;">
              <p style="margin: 0 0 8px 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.25em; font-weight: bold; color: #d4af37;">MOLVBRIV CURATED LUXURY</p>
              <p style="margin: 0; line-height: 1.6; color: #c3d9cd;">
                © 2026 MOLVBRIV Sourcing. All rights reserved. <br/>
                Every masterpiece is delivered via fully insured, secure logistics.
              </p>
            </td>
          </tr>

        </table>
      </center>
    </body>
    </html>
  `;
}

/**
 * Direct REST API call helper to send emails via Resend Service
 */
async function sendResendRestApi(apiKey, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend REST API error: ${response.statusText} - ${errText}`);
  }

  return await response.json();
}

/**
 * Centralized Transactional Email Sender Layer
 * Handles Resend API, Nodemailer SMTP fallbacks, validation, logs, and retries.
 */
async function sendOrderEmail(order, emailType) {
  const orderId = order.id;
  const recipientEmail = order.customer_email || order.email;
  const fromEmail = process.env.EMAIL_FROM || '"MOLVBRIV Concierge" <orders@molvbriv.in>';

  console.log(`Email request initialized: Type=${emailType}, Order=${orderId}, To=${recipientEmail}`);

  // 1. Email Format Validation
  if (!isValidEmail(recipientEmail)) {
    console.error(`Blocked invalid recipient email: "${recipientEmail}" for order: ${orderId}`);
    return { success: false, error: 'Invalid recipient email' };
  }

  // 2. Duplicate Check Guard (Supabase Log Integration)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: logs, error: checkErr } = await supabase
        .from('email_logs')
        .select('id')
        .eq('order_id', orderId)
        .eq('email_type', emailType)
        .eq('delivery_status', 'sent');

      if (checkErr) throw checkErr;

      if (logs && logs.length > 0) {
        console.log(`Failsafe Duplicate Guard triggered! Email [${emailType}] already sent to ${recipientEmail} for order ${orderId}. Skipping.`);
        return { success: true, skipped: true };
      }
    } catch (dbErr) {
      console.warn(`Supabase duplicate check query failed: ${dbErr.message}. Bypassing failsafe.`);
    }
  }

  // 3. Compile beautiful HTML Template
  const templateBuilder = templates[emailType];
  if (!templateBuilder) {
    console.error(`Invalid email template requested: "${emailType}"`);
    return { success: false, error: 'Invalid template type' };
  }

  const compiledContent = templateBuilder(order);
  const emailHtml = buildHtmlWrapper(compiledContent);
  const subject = `[MOLVBRIV] ${compiledContent.title} - ${order.razorpay_order_id || order.id.substring(0, 8)}`;

  // 4. Log initial 'pending' record into Supabase
  let logRecordId = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: logRow, error: insErr } = await supabase
        .from('email_logs')
        .insert([{
          order_id: orderId,
          recipient_email: recipientEmail,
          email_type: emailType,
          delivery_status: 'pending'
        }])
        .select()
        .single();

      if (insErr) throw insErr;
      logRecordId = logRow.id;
    } catch (dbInsErr) {
      console.error(`Failed to pre-insert email log:`, dbInsErr.message);
    }
  }

  // 5. Exponential Backoff sending retry block (retries up to 3 times)
  const maxRetries = 3;
  let attempt = 0;
  let sentResult = null;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Sending email attempt ${attempt} for order ${orderId}...`);

      if (process.env.RESEND_API_KEY) {
        // Direct Resend API Dispatch
        sentResult = await sendResendRestApi(process.env.RESEND_API_KEY, {
          from: fromEmail,
          to: recipientEmail,
          subject: subject,
          html: emailHtml
        });
        console.log(`Successfully sent email via Resend REST API! Result ID:`, sentResult.id || JSON.stringify(sentResult));
        break;
      } else {
        const transporter = getTransporter();
        if (transporter) {
          sentResult = await transporter.sendMail({
            from: fromEmail,
            to: recipientEmail,
            subject: subject,
            html: emailHtml
          });
          console.log(`Successfully sent email via SMTP Transporter! MessageId:`, sentResult.messageId);
          break;
        } else {
          // Simulation Mode (Local development fallback)
          console.log(`[SIMULATION MODE] Client Email sent successfully!
            TO: ${recipientEmail}
            FROM: ${fromEmail}
            SUBJECT: ${subject}
            TEMPLATE: ${emailType}`);
          sentResult = { simulated: true };
          break;
        }
      }
    } catch (sendErr) {
      lastError = sendErr;
      console.warn(`Email attempt ${attempt} failed: ${sendErr.message}`);
      
      if (attempt < maxRetries) {
        // Wait exponentially: 500ms, 1000ms, 2000ms
        const waitTime = 500 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // 6. Update logs registry state in Supabase
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && logRecordId) {
    try {
      const { error: updErr } = await supabase
        .from('email_logs')
        .update({
          delivery_status: sentResult ? 'sent' : 'failed',
          error_message: sentResult ? null : (lastError?.message || 'Unknown network error')
        })
        .eq('id', logRecordId);

      if (updErr) throw updErr;
      console.log(`Successfully updated email log [${logRecordId}] status to:`, sentResult ? 'sent' : 'failed');
    } catch (dbUpdErr) {
      console.error(`Failed to update email log:`, dbUpdErr.message);
    }
  }

  if (sentResult) {
    return { success: true, result: sentResult };
  } else {
    console.error(`Failed to send order email after ${maxRetries} attempts:`, lastError?.message);
    return { success: false, error: lastError?.message || 'All attempts failed' };
  }
}

/**
 * Transactional Email Sender for Newsletter Subscriptions
 * Sends welcome email to subscriber and notification email to admin.
 */
async function sendNewsletterEmail(subscriber, emailType) {
  const recipientEmail = emailType === 'newsletter_admin' 
    ? (process.env.SUPPORT_EMAIL || 'concierge@molvbriv.in')
    : subscriber.email;
    
  const fromEmail = process.env.EMAIL_FROM || '"MOLVBRIV Concierge" <orders@molvbriv.in>';

  console.log(`Newsletter Email request initialized: Type=${emailType}, To=${recipientEmail}`);

  if (!isValidEmail(recipientEmail)) {
    console.error(`Blocked invalid recipient email for newsletter: "${recipientEmail}"`);
    return { success: false, error: 'Invalid recipient email' };
  }

  const templateBuilder = templates[emailType];
  if (!templateBuilder) {
    console.error(`Invalid newsletter email template requested: "${emailType}"`);
    return { success: false, error: 'Invalid template type' };
  }

  const compiledContent = templateBuilder(subscriber);
  const emailHtml = buildHtmlWrapper(compiledContent);
  const subject = `[MOLVBRIV] ${compiledContent.title}`;

  // Log in Supabase if service key exists
  let logRecordId = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: logRow, error: insErr } = await supabase
        .from('email_logs')
        .insert([{
          order_id: null,
          recipient_email: recipientEmail,
          email_type: emailType,
          delivery_status: 'pending'
        }])
        .select()
        .single();

      if (!insErr) logRecordId = logRow.id;
    } catch (dbInsErr) {
      console.error(`Failed to pre-insert newsletter email log:`, dbInsErr.message);
    }
  }

  const maxRetries = 3;
  let attempt = 0;
  let sentResult = null;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt++;
      if (process.env.RESEND_API_KEY) {
        sentResult = await sendResendRestApi(process.env.RESEND_API_KEY, {
          from: fromEmail,
          to: recipientEmail,
          subject: subject,
          html: emailHtml
        });
        break;
      } else {
        const transporter = getTransporter();
        if (transporter) {
          sentResult = await transporter.sendMail({
            from: fromEmail,
            to: recipientEmail,
            subject: subject,
            html: emailHtml
          });
          break;
        } else {
          console.log(`[SIMULATION NEWSLETTER] Sent successfully to ${recipientEmail}`);
          sentResult = { simulated: true };
          break;
        }
      }
    } catch (sendErr) {
      lastError = sendErr;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && logRecordId) {
    try {
      await supabase
        .from('email_logs')
        .update({
          delivery_status: sentResult ? 'sent' : 'failed',
          error_message: sentResult ? null : (lastError?.message || 'Unknown network error')
        })
        .eq('id', logRecordId);
    } catch (dbUpdErr) {
      console.error(`Failed to update newsletter email log:`, dbUpdErr.message);
    }
  }

  return sentResult ? { success: true } : { success: false, error: lastError?.message };
}

/**
 * Transactional Email Sender for Password Recovery
 */
async function sendRecoveryEmail(email, recoveryLink) {
  const fromEmail = process.env.EMAIL_FROM || '"MOLVBRIV Security" <security@molvbriv.in>';
  
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid recipient email' };
  }

  const templateBuilder = templates.password_reset;
  const compiledContent = templateBuilder({ recoveryLink });
  const emailHtml = buildHtmlWrapper(compiledContent);
  const subject = `[MOLVBRIV] Secure Password Reset`;

  const maxRetries = 3;
  let attempt = 0;
  let sentResult = null;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt++;
      if (process.env.RESEND_API_KEY) {
        sentResult = await sendResendRestApi(process.env.RESEND_API_KEY, {
          from: fromEmail,
          to: email,
          subject: subject,
          html: emailHtml
        });
        break;
      } else {
        const transporter = getTransporter();
        if (transporter) {
          sentResult = await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: subject,
            html: emailHtml
          });
          break;
        } else {
          console.log(`[SIMULATION RECOVERY EMAIL] Sent successfully to ${email}. Link: ${recoveryLink}`);
          sentResult = { simulated: true };
          break;
        }
      }
    } catch (sendErr) {
      lastError = sendErr;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  return sentResult ? { success: true } : { success: false, error: lastError?.message };
}

module.exports = {
  sendOrderEmail,
  sendNewsletterEmail,
  sendRecoveryEmail,
  isValidEmail
};
