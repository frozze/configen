<div align="center">

  <img src="public/icon.svg" width="80" height="80" alt="Configen Logo" />

  <h1>Configen</h1>
  <p><strong>Visual Nginx Config Generator & Linter</strong></p>
  <p>Generate production-ready Nginx configurations through a beautiful UI.<br/>100% client-side. Free. Open-source.</p>

  <p>
    <a href="https://configen.dev">🌐 Live Demo</a> ·
    <a href="#features">Features</a> ·
    <a href="#self-hosting">Self-Hosting</a> ·
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <a href="https://configen.dev"><img src="https://img.shields.io/badge/website-configen.dev-10b981?style=flat-square" alt="Website" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="License" /></a>
    <a href="https://github.com/frozze/Nginx-Config-Generator/stargazers"><img src="https://img.shields.io/github/stars/frozze/Nginx-Config-Generator?style=flat-square&color=yellow" alt="Stars" /></a>
    <a href="https://github.com/frozze/Nginx-Config-Generator/issues"><img src="https://img.shields.io/github/issues/frozze/Nginx-Config-Generator?style=flat-square" alt="Issues" /></a>
  </p>
</div>

---

## ✨ Features

- ⚡ **Real-time config generation** — see changes as you type
- 🔒 **100% client-side** — no data ever leaves your browser
- 🎯 **One-click presets** — Static Site, Reverse Proxy, WordPress, SPA, Load Balancer
- 🔐 **SSL/TLS** — Mozilla presets (Modern / Intermediate / Legacy)
- 🔄 **Reverse proxy** — with WebSocket & real IP support
- ⚖️ **Load balancing** — Round Robin, Least Connections, IP Hash
- 🛡️ **Security headers** & rate limiting
- 📦 **Gzip / Brotli compression**
- 🔍 **Built-in Linter** — 20+ rules to audit your config (security, performance, best practices)
- 📥 **Import existing configs** — paste or upload your `nginx.conf` and edit visually
- 📋 **Copy or download** your config with one click
- 🌗 **Dark / Light theme**
- 📱 **Fully responsive**

## 🚀 Quick Start

```bash
git clone https://github.com/frozze/Nginx-Config-Generator.git
cd Nginx-Config-Generator
npm install
npm run dev
# → http://localhost:3000
```

## 🐳 Self-Hosting with Docker

```bash
git clone https://github.com/frozze/Nginx-Config-Generator.git
cd Nginx-Config-Generator
cp .env.example .env    # configure your env vars
docker compose up -d
# → http://localhost:3000
```

> [!TIP]
> For production, put Configen behind a reverse proxy with SSL. Or better yet — generate that config with Configen itself 😎

## 📐 Presets

| Preset | Use Case | Key Features |
|--------|----------|--------------|
| **Static Site** | HTML/CSS/JS hosting | Gzip, caching, `try_files` |
| **Reverse Proxy** | Node.js / Python / Go | `proxy_pass`, WebSocket, real IP |
| **WordPress** | PHP-FPM + WP | FastCGI, rewrites, security |
| **SPA** | React / Vue / Angular | History mode fallback |
| **Load Balancer** | Multiple backends | Upstream, health checks |

## 🔍 Linter

Configen includes a built-in config linter with **20+ rules** covering:

- 🛡️ **Security** — missing SSL, outdated TLS protocols, open autoindex, rate limiting
- ⚡ **Performance** — Brotli, static caching, `client_max_body_size`
- ✅ **Best Practices** — redirect loops, single-server upstreams, error pages

Each rule has a dedicated [documentation page](https://configen.dev/docs/lint/security-server-tokens) with explanations and fix suggestions.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS 4 |
| Language | TypeScript |
| State | Zustand |
| Syntax Highlighting | Prism.js |
| Auth | Better Auth (GitHub, Google OAuth) |
| Deployment | Docker + Cloudflare Tunnel |

## 📁 Project Structure

```
configen/
├── src/
│   ├── app/                    # Next.js pages & layouts
│   ├── components/
│   │   ├── generator/          # Config form, preview, deploy section
│   │   ├── layout/             # Header, footer, theme toggle
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/
│   │   ├── nginx/              # Core engine (generator, parser, linter, presets)
│   │   └── affiliates.ts       # Affiliate provider definitions
│   └── stores/                 # Zustand state
├── public/                     # Static assets (icons, logos)
├── docker-compose.yml          # Self-hosting setup
├── Dockerfile                  # Multi-stage production build
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Whether it's a bug fix, a new preset, improved config generation, or better docs — every PR helps.

1. Fork the repo
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Licensed under **AGPL-3.0** — see [LICENSE](LICENSE) for details.

You're free to use, modify, and self-host Configen. If you modify it and offer it as a public service, you must open-source your changes.

---

<div align="center">
  <sub>Built with ☕ and Nginx knowledge</sub>
</div>
