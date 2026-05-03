# Molvbriv Deployment & Custom Domain Guide

Apni Molvbriv e-commerce website ko internet par live karne aur custom domain (jaise `www.molvbriv.com`) ke sath connect karne ke liye, neeche diye gaye steps ko dhyan se follow karein.

## Phase 1: Code ko GitHub par upload karna (Zaroori Step)

Vercel par smoothly deploy karne ke liye sabse pehle apne code ko GitHub par rakhna hoga.

1. **GitHub par Account banayein:** Agar nahi hai toh [github.com](https://github.com/) par account banayein.
2. **Nayi Repository banayein:** GitHub par "New Repository" par click karein aur naam dein `molvbriv-frontend`.
3. **Apne PC mein terminal (VS Code) open karein aur ye commands likhein:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Molvbriv"
   git branch -M main
   git remote add origin https://github.com/AAPKA_USERNAME/molvbriv-frontend.git
   git push -u origin main
   ```
   *(Aapka code ab internet par secure ho gaya hai).*

---

## Phase 2: Vercel par Deploy karna (Free Hosting)

1. [Vercel.com](https://vercel.com/) par jayein aur "Continue with GitHub" se login karein.
2. Dashboard par **"Add New" > "Project"** par click karein.
3. GitHub ki list mein aapko `molvbriv-frontend` dikhega. Uske aage **"Import"** par click karein.
4. **Environment Variables:**
   - Deploy button dabane se pehle, "Environment Variables" section open karein.
   - Apni `.env.local` file ke keys wahan daalein (Jaise: `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY`).
5. **Deploy** par click karein.
   - 1-2 minute mein Vercel aapko ek live link de dega (jaise `molvbriv-frontend.vercel.app`). Aapki website ab internet par live hai! 🎉

---

## Phase 3: Custom Domain lagana (e.g., molvbriv.com)

Ab aap us free `.vercel.app` link ko apne professional domain se replace karenge.

1. Vercel dashboard mein, apne Project par click karein.
2. Upar **"Settings"** tab mein jayein.
3. Left menu se **"Domains"** par click karein.
4. Apna domain naam likhein (e.g., `molvbriv.com` ya `www.molvbriv.com`) aur **"Add"** par click karein.
5. Vercel aapko kuch **DNS Records** dikhayega. Ye us company ki website par daalne hain jahan se aapne domain kharida hai (jaise GoDaddy, Hostinger, Namecheap).

**Domain Provider (GoDaddy/Hostinger) ke DNS settings mein kya karna hai:**

* **Agar aap `www.molvbriv.com` use kar rahe hain:**
  * Type: `CNAME`
  * Name/Host: `www`
  * Value/Target: `cname.vercel-dns.com`

* **Agar aap bina `www` ke `molvbriv.com` use kar rahe hain (A Record):**
  * Type: `A`
  * Name/Host: `@`
  * Value/Points to: `76.76.21.21` (Ye Vercel ka IP address hai jo screen par dikhega)

**Final Step:**
Jaise hi aap apne Domain Provider mein ye records save karenge, 10-15 minute baad Vercel par wapas check karein. Wahan Status **"Valid"** dikhega (Blue tick mark) aur SSL Certificate (HTTPS/Tala) automatically activate ho jayega.

Aapki Luxury E-commerce website ab puri duniya ke samne aapke professional domain par LIVE hai!
