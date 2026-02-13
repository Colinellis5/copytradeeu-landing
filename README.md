# CopyTradeEU Landing Page

Free daily newsletter tracking US politician stock trades for European investors.

## Quick Setup (5 minutes)

### Step 1: Buttondown (email service)
1. Go to [buttondown.com](https://buttondown.com) and create a free account
2. In Settings → Basics, note your username
3. Open `src/App.jsx` and update line 11 with your username:
   ```
   const BUTTONDOWN_USERNAME = "your-username-here";
   ```

### Step 2: Deploy on Vercel
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New → Project"
4. Select your repository
5. Vercel auto-detects Vite — just click "Deploy"
6. Done! Your site is live at `your-project.vercel.app`

### Step 3: Custom Domain (optional)
1. Buy `copytradeeu.com` from Namecheap, Cloudflare, or any registrar (~€5/year)
2. In Vercel → Project Settings → Domains → Add `copytradeeu.com`
3. Update your domain's DNS as Vercel instructs (usually 2 records)
4. Wait ~10 minutes for it to go live

## Project Structure
```
copytradeeu-landing/
├── index.html          ← SEO meta tags, social sharing
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
├── public/             ← Static assets (add og-image.png here)
└── src/
    ├── main.jsx        ← React entry point
    └── App.jsx         ← The entire landing page + Buttondown integration
```

## Tech Stack
- **React 18** — UI framework
- **Vite** — Build tool (fast, modern)
- **Buttondown** — Email subscription service (free tier: 100 subs)
- **Vercel** — Hosting (free tier: unlimited)

## Cost: €0
Everything runs on free tiers. The only optional cost is a custom domain (~€5/year).
