# Velix Framework Website

Official website for the Velix v5 framework — built with Velix itself.

## 🚀 Live Site

Visit: [velix.dev](https://velix.dev) *(coming soon)*

## 📦 Tech Stack

- **Framework**: Velix v5.0.7
- **Styling**: Tailwind CSS v4
- **Fonts**: Inter + JetBrains Mono (Google Fonts)
- **Deployment**: Vercel
- **React**: v19

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
website/
├── app/
│   ├── layout.tsx          # Root layout (navbar + footer)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind + custom styles
│   ├── compare/
│   │   └── page.tsx        # Framework comparison
│   └── docs/
│       └── page.tsx        # Documentation
├── public/
│   ├── favicon.webp
│   └── tailwind.css        # Compiled Tailwind
├── server/
│   └── api/
│       └── hello.ts        # Example API route
├── velix.config.ts         # Velix configuration
├── vercel.json             # Vercel deployment config
└── package.json
```

## 🎨 Brand Colors

```css
--color-velix-deep: #0B1120   /* Deep navy background */
--color-velix-dark: #0F172A   /* Dark slate */
--color-velix-accent: #2563EB /* Blue accent */
--color-velix-cyan: #22D3EE   /* Cyan highlight */
--color-velix-glow: #38BDF8   /* Glow effect */
```

## 🌐 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push this repo to GitHub
2. Import project in Vercel dashboard
3. Vercel will auto-detect settings from `vercel.json`
4. Deploy!

### Environment Variables

No environment variables required for basic deployment.

## 📝 Pages

- **`/`** — Landing page with hero, features, code examples, performance stats
- **`/compare`** — Detailed comparison with Next.js, Remix, and Astro
- **`/docs`** — Full documentation with sidebar navigation

## 🔧 Configuration

The site uses Velix's built-in Tailwind CSS plugin. Configuration is in:
- `velix.config.ts` — Framework settings
- `app/globals.css` — Tailwind theme and custom styles

## 📄 License

MIT © Velix Team
