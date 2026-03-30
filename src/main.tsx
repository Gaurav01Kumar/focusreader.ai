import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { ToastContainer } from "react-toastify";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <ToastContainer />
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);