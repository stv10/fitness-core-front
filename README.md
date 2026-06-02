# Fitness Core - Frontend

This is the frontend Progressive Web App (PWA) for Fitness Core, built using React, Vite, and TypeScript.

---

## Getting Started

### Local Setup
1. Ensure Node.js (v20+) is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.template` to `.env`:
   ```bash
   cp .env.template .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
To build the application and compile the service worker:
```bash
npm run build
```
This generates a production-ready `dist` folder.

---

## PWA & Service Worker
The PWA configuration is managed in `vite.config.ts` using `vite-plugin-pwa`.
- In development, the service worker is disabled by default to make HMR debugging easier.
- In production builds (`npm run build`), the plugin registers a service worker (`sw.js`) that caches all static assets (`.js`, `.css`, `.html`, `.png`, etc.) for offline usage.

---

## Secret Protection Guidelines
1. All client-side env variables must be prefixed with `VITE_` (e.g., `VITE_API_URL`).
2. Never commit `.env` or configuration files containing real URLs or API keys to Github.
3. Document any new environment variables in `.env.template`.

---

## Documentation & Changelog Rules

All changes to the frontend must be documented in the Changelog section below.

### Changelog

All notable changes to this project will be documented in this section.

#### [Unreleased]
- No unreleased changes yet.

#### [0.0.1] - 2026-06-02
##### Added
- `feat(core)` Initial React app setup with Vite and TypeScript.
- `feat(pwa)` Enabled and configured Progressive Web App (PWA) with Service Worker and manifest metadata.
- `feat(ui)` Created a premium dark mode dashboard using custom CSS tokens and glassmorphism.
- `feat(api)` Integrated connection checks to backend `/api/ping`.
- `feat(workout)` Added interactive state simulation for logging workouts.

---

## License

This project is **proprietary** and all rights are reserved. It is public for code review and demonstration purposes only. See the [LICENSE](file:///D:/repos/fitness-core/frontend/LICENSE) file for more details.

