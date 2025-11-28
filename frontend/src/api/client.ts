// frontend/src/api/client.ts
import axios from 'axios';

// Prefer Vite env variable VITE_API_BASE when present (e.g. in Codespaces or CI)
// If not present, derive the backend public URL from the current window location,
// which helps in Codespaces where the frontend is at <id>-5173.app.github.dev and
// the backend is at <id>-8000.app.github.dev. Finally, fall back to the example.
const envBase = import.meta.env.VITE_API_BASE;
const defaultExample = 'https://literate-doodle-55wwqxwrv5xfx5-8000.app.github.dev';

function deriveBaseFromWindow(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const host = window.location.hostname; // e.g. <id>-5173.app.github.dev
    // Try common Codespaces pattern of -5173 -> -8000
    if (host.includes('-5173.')) {
      return `https://${host.replace('-5173.', '-8000.')}`;
    }
    if (host.includes('-5173')) {
      return `https://${host.replace('-5173', '-8000')}`;
    }
    // If hostname is `localhost` or similar, keep default fallback
    return null;
  } catch {
    return null;
  }
}

// In dev, use a relative `/api` path so Vite's dev server can proxy requests to the backend
// and avoid CORS issues in environments like Codespaces. In production or when VITE_API_BASE
// is provided, prefer the explicit base URL.
const baseURL = import.meta.env.DEV ? '/api' : envBase ?? deriveBaseFromWindow() ?? defaultExample;

if (typeof window !== 'undefined') {
   
  console.info('[API] Using baseURL:', baseURL, import.meta.env.DEV ? '(dev: /api proxy)' : (envBase ? '(from VITE_API_BASE)' : '(derived)'));
}

export const api = axios.create({ baseURL, timeout: 30000 });
