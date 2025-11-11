import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';
import App from './pages/app';
import NotificationHelper from './notification-helper';

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Kriteria 3: Mendaftarkan SW
      const swRegistration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered successfully:', swRegistration);

      // Tangani pesan dari SW setelah sync
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'StoriesSynced') {
          console.log('Offline stories synced, refreshing page...');
          window.location.reload(); 
        }
      });

      return swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const swRegistration = await registerServiceWorker();
  
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    swRegistration: swRegistration,
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

if (NotificationHelper.checkAvailability()) {
    const pushToggle = document.querySelector('#push-notification-toggle');
    if (pushToggle && swRegistration) {
      const isSubscribed = await NotificationHelper.isSubscribed(swRegistration);
      pushToggle.checked = isSubscribed;
    }
}
});