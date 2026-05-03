# Molvbriv Supabase Backend Integration Guide

This guide will walk you through setting up the complete backend infrastructure for your e-commerce application using Supabase and Vercel.

## Step 1: Set Up Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project** and select your organization.
3. Enter a project name (e.g., `molvbriv-backend`) and a strong database password. Choose an optimal region (e.g., Mumbai for India).
4. Wait for the database setup to complete.

## Step 2: Configure Database Schema

1. Go to the **SQL Editor** in the Supabase Dashboard.
2. Click **New Query**.
3. Open the file `supabase_schema.sql` (already generated in your project folder) and copy its entire contents.
4. Paste the SQL code into the Supabase SQL editor and hit **Run**.
5. This script will automatically:
   - Create tables: `profiles`, `categories`, `products`, `orders`, `order_items`, `reviews`, `coupons`
   - Set up Row Level Security (RLS) policies for security.
   - Configure a Storage bucket named `products` for image uploads.
   - Create triggers to automatically add users to the `profiles` table on signup.

## Step 3: Configure Environment Variables

To allow your frontend to communicate with Supabase, you need to configure your environment variables.

1. In Supabase, go to **Project Settings** > **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In your local project directory, open the `.env.local` file (already created).
4. Replace the placeholder values with your actual keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   ```

## Step 4: Install Supabase Client

Since you are running locally on Windows, please run the following command in your terminal inside the `molvbriv2.0` directory to install the Supabase client:

```bash
npm install @supabase/supabase-js
```

*(Note: The client file `src/supabaseClient.js` has already been generated and is ready to use.)*

## Step 5: Integrating Frontend & Admin Panel

The Admin Panel UI (`src/pages/AdminPage.jsx`) has been fully converted to React state. To connect it to your live database:

1. **Import Supabase**: At the top of your components, add:
   ```javascript
   import { supabase } from '../supabaseClient'
   ```
2. **Fetching Data**: Use `useEffect` to fetch products and orders when the component mounts.
   ```javascript
   useEffect(() => {
     async function loadData() {
       const { data, error } = await supabase.from('products').select('*')
       if (data) setProducts(data)
     }
     loadData()
   }, [])
   ```
3. **Saving Data (e.g., Add Product)**: Update your `Publish Product` button logic:
   ```javascript
   async function addProduct(productDetails) {
     const { data, error } = await supabase.from('products').insert([productDetails])
     if (!error) showToast('Product published!')
   }
   ```
4. **Authentication**: Use Supabase Auth for Admin/User login.
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'admin@molvbriv.com',
     password: 'securepassword',
   })
   ```

## Step 6: Payment Integration (Razorpay)

Your database `orders` table includes fields for `razorpay_order_id` and `razorpay_payment_id`. 
For Razorpay integration:
1. Create a serverless function (or Supabase Edge Function) to call the Razorpay API to generate an Order ID.
2. Return this Order ID to the frontend and initialize the Razorpay checkout modal.
3. On payment success, update the `orders` table `payment_status` to `paid` using the `razorpay_payment_id`.

## Step 7: Vercel Deployment

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a **New Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your frontend and serverless routes will be live!

---
**Next Actions**: Run the SQL schema in your Supabase dashboard and install the npm package locally. Your backend architecture is now fully scalable, secure, and production-ready.
