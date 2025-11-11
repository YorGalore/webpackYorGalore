import { openDB } from 'idb';
import CONFIG from './config';

const CACHE_NAME = 'yorgalore-v1';

const assetsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.css',
  '/favicon.png',
  '/manifest.json',
  '/images/logo.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  '/a0c6cc1401c107b501ef.png', 
  '/8f2c4d11474275fbc161.png', 
];

// IndexedDB Setup for SW
const DB_NAME = 'yorgalore-db';
const STORY_OBJECT_STORE_NAME = 'stories';
const SYNC_OBJECT_STORE_NAME = 'offline-stories';
const PHOTO_OBJECT_STORE_NAME = 'photos';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORY_OBJECT_STORE_NAME)) {
      database.createObjectStore(STORY_OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains(SYNC_OBJECT_STORE_NAME)) {
      database.createObjectStore(SYNC_OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains(PHOTO_OBJECT_STORE_NAME)) {
      database.createObjectStore(PHOTO_OBJECT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

// Helper function untuk mengirim data offline (Kriteria 4 Advanced)
async function sendOfflineStory(storyData) {
  const db = await dbPromise;
  const token = storyData.token;
  const formData = new FormData();
  
  formData.append('description', storyData.description);
  
  if (storyData.lat) {
      formData.append('lat', storyData.lat);
  }
  if (storyData.lon) {
      formData.append('lon', storyData.lon);
  }

  // Ambil Blob foto dari IDB
  let photoBlob;
  if (storyData.photoBlobId) {
      photoBlob = await db.get(PHOTO_OBJECT_STORE_NAME, storyData.photoBlobId);
  }
  
  if (photoBlob) {
      formData.append('photo', photoBlob, 'offline-photo.png'); 
  } else {
      console.error('Photo blob missing for offline story sync:', storyData.id);
      throw new Error('Photo data is missing or corrupted.'); 
  }

  const response = await fetch(CONFIG.BASE_URL + '/stories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to send offline story: ${errorResponse.message}`);
  }

  return response.json();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(assetsToCache))
      .catch((err) => console.error('Failed to cache assets:', err)),
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      }),
    )),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== location.origin && !requestUrl.origin.includes('unpkg.com') && requestUrl.origin !== CONFIG.BASE_URL) {
    return;
  }
  
  // Kriteria 3 Advanced: Stale While Revalidate untuk /stories GET
  if (requestUrl.pathname.endsWith('/v1/stories') && request.method === 'GET' && requestUrl.origin === CONFIG.BASE_URL) {
      event.respondWith(
          caches.open(CACHE_NAME).then(async (cache) => {
              
              const fetchAndCache = async () => {
                  try {
                      const response = await fetch(request);
                      if (response.status === 200) {
                          cache.put(request, response.clone());
                          // Simpan ke IndexedDB juga
                          const storiesResponse = await response.clone().json();
                          if (!storiesResponse.error && storiesResponse.listStory) {
                              const storyIdb = (await dbPromise);
                              const tx = storyIdb.transaction(STORY_OBJECT_STORE_NAME, 'readwrite');
                              const store = tx.objectStore(STORY_OBJECT_STORE_NAME);
                              await store.clear();
                              storiesResponse.listStory.forEach(story => store.put(story));
                              await tx.done;
                          }
                      }
                      return response;
                  } catch (error) {
                      // Fallback ke cache jika network gagal
                      return cache.match(request);
                  }
              };

              const cachedResponse = await cache.match(request);
              
              const fetchPromise = fetchAndCache(); // Lakukan fetch di background

              if (cachedResponse) {
                  return cachedResponse; // Sajikan cache segera (Stale)
              }
              
              return fetchPromise.then(response => {
                  if (response) return response;
                  // Jika cache miss dan network gagal, coba dari IndexedDB (Kriteria 3 Advanced)
                  return dbPromise.then(async (db) => {
                       const stories = await db.getAll(STORY_OBJECT_STORE_NAME);
                       if (stories && stories.length > 0) {
                            const jsonResponse = {
                                 error: false, 
                                 message: "Stories fetched successfully (from IDB offline)", 
                                 listStory: stories 
                            };
                            return new Response(JSON.stringify(jsonResponse), {
                                headers: { 'Content-Type': 'application/json' },
                                status: 200,
                            });
                       }
                       return new Response('Network error and no local data found.', { status: 404 });
                  });
              });
          })
      );
      return;
  }
  
  // Strategi Cache First untuk aset lainnya
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    }),
  );
});

// Kriteria 2 Advanced: Push Notification
self.addEventListener('push', (event) => {
  const notificationData = event.data.json();
  const { title, options } = notificationData;

  // Kriteria 2 Skilled: Tambahkan icon dan data dinamis
  options.icon = '/favicon.png'; 
  options.data = options.data || {};
  
  // Kriteria 2 Advanced: Tambahkan action button
  options.actions = [
    {
      action: 'view-story',
      title: 'Lihat Cerita',
    },
  ];

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  const data = clickedNotification.data || {};
  const storyId = data.storyId || '';
  const url = `#/stories/${storyId}`; 
  const action = event.action;

  if (action === 'view-story' && storyId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        const targetUrl = new URL(url, self.location.origin).href;
        let client = clientList.find((c) => c.url.includes(url));

        if (client) {
          client.focus();
        } else {
          self.clients.openWindow(targetUrl);
        }
      }),
    );
  }
});


// Kriteria 4 Advanced: Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-story') {
    event.waitUntil(
      dbPromise.then(async (db) => {
        const tx = db.transaction([SYNC_OBJECT_STORE_NAME, PHOTO_OBJECT_STORE_NAME], 'readwrite');
        const storyStore = tx.objectStore(SYNC_OBJECT_STORE_NAME);
        const photoStore = tx.objectStore(PHOTO_OBJECT_STORE_NAME);
        const allKeys = await storyStore.getAllKeys();

        const syncPromises = allKeys.map(async (key) => {
          const storyData = await storyStore.get(key);
          if (!storyData) return;

          try {
            console.log(`Attempting to sync story ${key}`);
            const result = await sendOfflineStory(storyData); 
            
            if (!result.error) {
              await storyStore.delete(key);
              await photoStore.delete(storyData.photoBlobId); 
              console.log(`Story ${key} successfully synced and deleted from IDB.`);
            } else {
              console.error(`Story ${key} failed to sync (API error): ${result.message}`);
            }
          } catch (error) {
            console.error(`Story ${key} failed to sync (Network/Fetch error): ${error.message}`);
          }
        });

        await Promise.all(syncPromises);
        await tx.done;

        // Kirim pesan ke client untuk refresh
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'StoriesSynced' });
          });
        });

      }).catch(error => {
        console.error('Error during background sync:', error);
      })
    );
  }
});