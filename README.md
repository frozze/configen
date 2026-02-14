<!-- Banner image placeholder -->
<div align="center">
  
  <h1>NginxConfig</h1>
  <p><strong>Visual Nginx configuration generator. Free, open-source, runs in your browser.</strong></p>

  <p>
    <a href="https://nginxconfig.io">Live Demo</a> ·
    <a href="#features">Features</a> ·
    <a href="#self-hosting">Self-Hosting</a> ·
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <a href="https://github.com/frozze/Nginx-Config-Generator/stargazers"><img src="https://img.shields.io/github/stars/frozze/Nginx-Config-Generator?style=social" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" /></a>
    <a href="https://github.com/frozze/Nginx-Config-Generator/actions"><img src="https://img.shields.io/github/actions/workflow/status/frozze/Nginx-Config-Generator/ci.yml" /></a>
  </p>
</div>

NginxConfig is a free, open-source tool that helps you build production-ready Nginx configurations through a visual interface. No data leaves your browser — everything is generated client-side. Configure reverse proxies, SSL, load balancing, security headers, and more without memorizing Nginx syntax.

## Features

- ⚡ **Real-time config generation** as you type
- 🔒 **100% client-side** — no data sent to any server
- 🎯 **One-click presets** (Static Site, Reverse Proxy, WordPress, SPA, Load Balancer)
- 🔐 **SSL/TLS configuration** with Mozilla presets (Modern, Intermediate, Legacy)
- 🔄 **Reverse proxy** with WebSocket support
- ⚖️ **Load balancing** (Round Robin, Least Connections, IP Hash)
- 🛡️ **Security headers** & rate limiting
- 📦 **Gzip/Brotli compression** settings
- 📋 **Copy or download** your config with one click
- 🌙 **Dark/Light theme**
- 📱 **Responsive design**
- 🔍 **SEO-optimized** with documentation pages

## Quick Start

```bash
# Clone the repo
git clone https://github.com/frozze/Nginx-Config-Generator.git
cd Nginx-Config-Generator

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Self-Hosting with Docker

```bash
# Clone and build
git clone https://github.com/frozze/Nginx-Config-Generator.git
cd Nginx-Config-Generator

# Run with Docker Compose
docker compose up -d

# App is now running on http://localhost:3000
```

> [!NOTE]
> For production, put it behind a reverse proxy with SSL. See `nginx/nginx.conf` for an example configuration (yes, we generated it with our own tool 😎).

## Presets

| Preset | Use Case | Key Features |
|--------|----------|--------------|
| Static Site | HTML/CSS/JS hosting | Gzip, caching, try_files |
| Reverse Proxy | Node.js/Python/Go app | proxy_pass, WebSocket, real IP |
| WordPress | PHP-FPM + WP | fastcgi, rewrites, security |
| SPA | React/Vue/Angular | History mode fallback |
| Load Balancer | Multiple backends | Upstream, health checks |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| State | Zustand |
| Syntax Highlighting | Shiki / Prism.js |
| Deployment | Docker / Vercel |

## Project Structure

```
nginx-config-generator/
├── src/
│   ├── app/                          # Next.js pages & layouts
│   ├── components/                   # All UI components
│   │   ├── generator/                # Config form, preview, sections
│   │   ├── layout/                   # Header, footer, theme
│   │   └── ui/                       # Reusable UI primitives
│   ├── lib/
│   │   └── nginx/                    # Core engine (generator, validator, presets, types)
│   ├── stores/                       # Zustand state management
│   └── styles/                       # CSS
├── public/                           # Static assets
├── tests/                            # Unit tests for generator/validator
├── docker-compose.yml                # Self-hosting setup
├── Dockerfile
├── nginx/                            # Example production nginx config
└── package.json
```

## Contributing

We welcome contributions! Whether it's a bug fix, new preset, improved config generation, or documentation — every PR helps. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the AGPL-3.0 License — see the [LICENSE](LICENSE) file for details.

You're free to use, modify, and self-host NginxConfig. If you modify it and offer it as a service, you must open-source your changes. See LICENSE for full terms.
