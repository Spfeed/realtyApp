import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/palanquin/400.css'
import '@fontsource/palanquin/600.css'
import '@fontsource/palanquin/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
