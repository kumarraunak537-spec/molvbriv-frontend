# MOLVBRIV Express Backend - Render.com Deployment Guide

Apne Node.js Express backend server ko **Render.com** (ek free aur behad aasan cloud hosting provider) par deploy karne ke liye, neeche diye gaye steps ko step-by-step follow karein.

---

## Step 1: Render.com par Account banayein
1. [Render.com](https://render.com/) par jayein aur "Sign Up" par click karein.
2. Sabse aasan tareeqa hai ki aap **"GitHub"** icon par click karke login karein. *(Isse aapki repositories direct link ho jayengi).*

---

## Step 2: Nayi Web Service banayein
1. Render dashboard mein upar right side mein **"New +"** button par click karein aur **"Web Service"** ko select karein.
2. **"Connect a repository"** section mein aapko apni GitHub repository `molvbriv-frontend` dikhegi. Uske aage **"Connect"** button par click karein.

---

## Step 3: Web Service Configure karein (Sabse Zaroori Step!)
Service settings page par neeche di gayi details ko dhyan se bharein:

* **Name:** `molvbriv-backend` (Ya apni pasand ka koi bhi naam)
* **Region:** Select `Singapore` ya `Mumbai` (India ke customers ke liye ye sabse fast load hoga)
* **Branch:** `main`
* **Root Directory:** **`backend`** *(Behad Zaroori! Kyunki hamara Express code repository ke index par nahi, balki `backend` folder ke andar hai).*
* **Runtime:** `Node`
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Instance Type:** Select **"Free"** (Isme aapko zero payment karni hai)

---

## Step 4: Environment Variables (Secrets) Add karein
Neeche scroll karein aur **"Advanced"** dropdown par click karein, fir **"Add Environment Variable"** button par click karke apni local `backend/.env` file ke parameters ko yahan add karein:

| Key | Value (Example) |
| :--- | :--- |
| `PORT` | `10000` (Render automatic allocate karega, but specify 10000) |
| `RAZORPAY_KEY_ID` | *Aapka live/test Razorpay Key ID* |
| `RAZORPAY_KEY_SECRET` | *Aapka Razorpay Key Secret* |
| `RAZORPAY_WEBHOOK_SECRET` | *Aapka Razorpay Webhook Secret* |
| `SUPABASE_URL` | `https://oiksafoujlduutkcgays.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` *(Supabase custom key bypass ke liye zaroori)* |
| `SHIPROCKET_EMAIL` | `kumarraunak537@gmail.com` |
| `SHIPROCKET_PASSWORD` | `j6bnEG%&O@IhtdD!HWw2*7euJNc8pOE*` |
| `SHIPROCKET_API_KEY` | `j6bnEG%&O@IhtdD!HWw2*7euJNc8pOE*` |
| `SHIPROCKET_PICKUP_LOCATION` | `Home` |
| `SHIPROCKET_PICKUP_PINCODE` | `122505` |

---

## Step 5: Deploy Web Service
1. Sabhi variables daalne ke baad, sabse neeche **"Create Web Service"** par click karein.
2. Render ab aapke code ko fetch karega, `npm install` chalayega aur server ko start karega.
3. 2-3 minute mein console par **"Your service is live 🎉"** likha hua dikhega.
4. Sabse upar left corner mein aapko ek unique HTTPS link dikhega, jaise: `https://molvbriv-backend.onrender.com`

---

## Step 6: Apne Vercel Frontend ko is Backend URL se Connect karein
Ab aapko apne frontend (Vercel) ko is live server ka pata batana hai:

1. [Vercel.com](https://vercel.com/) dashboard mein jayein, apne Project settings mein jayein.
2. **Settings > Environment Variables** tab par jayein.
3. Naya variable add karein:
   * **Key:** `VITE_API_BASE_URL`
   * **Value:** `https://molvbriv-backend.onrender.com` *(Aapka live Render URL)*
4. Save karein aur latest deploy ko **Redeploy** kar dein.

---

### 🎉 Badhai Ho! Aapka Complete Client Checkout + Shiprocket Shipping System ab fully production-ready aur internet par globally live hai!
