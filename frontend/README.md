# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Development: Configure API Base URL (Codespaces)

When running frontend in GitHub Codespaces, do not use `127.0.0.1` as the API base URL — use the public forwarded URL.

1. In Codespaces, open the `Ports` tab and make sure port `8000` (backend) is set to `Public`.
2. Copy the forwarded address, e.g. `https://<codespace-id>-8000.app.github.dev`.
3. Create a file at `frontend/.env` (already included in this repo) and set:

```
VITE_API_BASE=https://<codespace-id>-8000.app.github.dev
```

Note: You don't have to set `VITE_API_BASE` if you prefer; the frontend will now attempt to detect the backend address automatically by swapping `-5173` → `-8000` in the frontend host. In Codespaces this usually means `https://<id>-5173.app.github.dev` -> `https://<id>-8000.app.github.dev`.

4. Restart the frontend dev server; Vite exposes this env variable to the client.

Start dev servers:
```bash
# backend (in /workspaces/SCEAP2.0/backend)
poetry run uvicorn main:app --reload --port 8000

# frontend (in /workspaces/SCEAP2.0/frontend)
npm run dev -- --host 0.0.0.0 --port 5173
```

Now open the public forwarded frontend URL and click `Run Cable Sizing Engine`. You should see the visualization and metrics update.

If you still see `Network Error`, check the browser console for the `API` log showing the base URL in use and the network tab for the request to `/cable/size`.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
