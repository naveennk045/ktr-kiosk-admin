import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('Main.jsx execution started');

try {
  const root = createRoot(document.getElementById('root'));
  console.log('Root created, rendering App...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('Render called');
} catch (e) {
  console.error('Error in main.jsx:', e);
}
