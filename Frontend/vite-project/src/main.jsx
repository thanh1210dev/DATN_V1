import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "bootstrap/dist/css/bootstrap.min.css"

// Add global protection for className.indexOf error
document.addEventListener('DOMContentLoaded', function() {
  // Monkey patch Event prototype to protect against className.indexOf errors
  const originalStopPropagation = Event.prototype.stopPropagation;
  Event.prototype.stopPropagation = function() {
    // Safe access to className
    if (this.target && this.target.className !== undefined) {
      // Skip SVGElement which has className as a getter-only property
      if (!(this.target instanceof SVGElement)) {
        // Ensure className is a string
        if (typeof this.target.className !== 'string') {
          // Convert to string or empty string if it's an object
          this.target.className = String(this.target.className || '');
        }
      }
    }
    return originalStopPropagation.apply(this, arguments);
  };
  
  // Add protection for all event handlers
  document.body.addEventListener('click', function(e) {
    if (e.target && e.target.className !== undefined && 
        !(e.target instanceof SVGElement) && typeof e.target.className !== 'string') {
      e.target.className = String(e.target.className || '');
    }
  }, true);
  
  document.body.addEventListener('dblclick', function(e) {
    if (e.target && e.target.className !== undefined && 
        !(e.target instanceof SVGElement) && typeof e.target.className !== 'string') {
      e.target.className = String(e.target.className || '');
    }
  }, true);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)