import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'; // 🟢 ADD THIS LINE
import './index.css'
import App from './App.jsx'

// Replace with your actual Client ID
const GOOGLE_CLIENT_ID = "731583654109-ljb1knd5rrhjvv3ipgriq66mr4qum457.apps.googleusercontent.com"; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)