import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// App
import App from './App.jsx'

// Css
import 'bootstrap/dist/css/bootstrap.css';
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
</BrowserRouter>
)
