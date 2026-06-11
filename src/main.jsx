import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import EberronCompanion from "./EberronCompanion"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EberronCompanion />
  </StrictMode>
)