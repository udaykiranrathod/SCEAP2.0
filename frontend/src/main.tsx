import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import ErrorBoundary from './components/shared/ErrorBoundary'
// Log the Vite VITE_API_BASE for quick debugging when running in Codespaces
if (typeof window !== 'undefined') {
   
  console.info('[VITE] VITE_API_BASE:', import.meta.env.VITE_API_BASE);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
