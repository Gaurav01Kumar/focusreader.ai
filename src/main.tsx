import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { Provider } from 'react-redux';

import { ToastContainer } from "react-toastify";
import { store } from './redux/store.ts';


createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <BrowserRouter>
      <ToastContainer />
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>

  </StrictMode>
);