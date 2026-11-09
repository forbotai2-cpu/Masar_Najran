import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import '@fontsource/noto-kufi-arabic/arabic-400.css'
import '@fontsource/noto-kufi-arabic/arabic-500.css'
import '@fontsource/noto-kufi-arabic/arabic-700.css'
import '@fontsource/noto-kufi-arabic/latin-400.css'
import '@fontsource/noto-kufi-arabic/latin-700.css'
import './styles/app.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
