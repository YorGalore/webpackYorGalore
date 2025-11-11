import { subscribeNotification, unsubscribeNotification } from './api';
import CONFIG from './config';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationHelper = {
  checkAvailability() {
    return ('serviceWorker' in navigator && 'PushManager' in window);
  },

  async isSubscribed(swRegistration) {
    const subscription = await swRegistration.pushManager.getSubscription();
    return !!subscription;
  },

  async subscribe(swRegistration) {
    if (!this.checkAvailability()) {
      console.error('Push notification is not supported.');
      return null;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Anda harus login untuk mengaktifkan notifikasi.');
        return null;
    }

    try {
      const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const response = await subscribeNotification(subscription.toJSON());

      if (response.error) {
        throw new Error(response.message);
      }

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notification:', error);
      alert(`Gagal berlangganan notifikasi: ${error.message}`);
      // Unsubscribe locally if API failed
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
          subscription.unsubscribe();
      }
      return null;
    }
  },

  async unsubscribe(swRegistration) {
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
      try {
        const response = await unsubscribeNotification(subscription.endpoint);

        if (response.error) {
          throw new Error(response.message);
        }

        const successfulUnsubscribe = await subscription.unsubscribe();

        if (!successfulUnsubscribe) {
          throw new Error('Unsubscribe failed locally.');
        }

        console.log('Push unsubscribe successful.');
        return true;
      } catch (error) {
        console.error('Failed to unsubscribe from push notification:', error);
        alert(`Gagal berhenti berlangganan notifikasi: ${error.message}`);
        return false;
      }
    }
    return true; 
  },
};

export default NotificationHelper;