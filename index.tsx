
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Critical Error: ChatBank root element not found.");
}

const root = ReactDOM.createRoot(rootElement);

// وظيفة لإزالة شاشة التحميل بسلاسة
const hideSplashScreen = () => {
  const splash = document.getElementById('km-splash');
  if (splash) {
    splash.classList.add('hidden');
    // إزالة العنصر تماماً من الـ DOM بعد انتهاء الحركة لتفادي حجب اللمس
    setTimeout(() => {
      splash.remove();
    }, 600);
  }
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// استدعاء الإخفاء بعد وقت قصير من الـ render
setTimeout(hideSplashScreen, 1000);
