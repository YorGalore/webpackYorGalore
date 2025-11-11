import { openDB } from 'idb';

const DB_NAME = 'yorgalore-db';
const DB_VERSION = 1;
const STORY_OBJECT_STORE_NAME = 'stories';
const SYNC_OBJECT_STORE_NAME = 'offline-stories';
const PHOTO_OBJECT_STORE_NAME = 'photos';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORY_OBJECT_STORE_NAME)) {
      database.createObjectStore(STORY_OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains(SYNC_OBJECT_STORE_NAME)) {
      database.createObjectStore(SYNC_OBJECT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
    if (!database.objectStoreNames.contains(PHOTO_OBJECT_STORE_NAME)) {
      database.createObjectStore(PHOTO_OBJECT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const StoryIdb = {
  // --- Kriteria 3/4: Caching Cerita ---
  async getStories() {
    return (await dbPromise).getAll(STORY_OBJECT_STORE_NAME);
  },

  async putStories(stories) {
    const db = await dbPromise;
    const tx = db.transaction(STORY_OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORY_OBJECT_STORE_NAME);
    
    await store.clear(); 
    
    const putPromises = stories.map(story => store.put(story));
    await Promise.all(putPromises);
    return tx.done;
  },
  
  // --- Kriteria 4 Advanced: Offline Create / Background Sync ---
  async saveOfflineStory({ description, lat, lon, photo }) {
    const db = await dbPromise;

    // 1. Simpan Blob foto
    let photoId;
    const photoTx = db.transaction(PHOTO_OBJECT_STORE_NAME, 'readwrite');
    photoId = await photoTx.objectStore(PHOTO_OBJECT_STORE_NAME).add(photo);
    await photoTx.done;
    
    // 2. Simpan metadata cerita dengan referensi foto
    const storyData = { 
      id: `offline-${Date.now()}`, 
      token: sessionStorage.getItem('token'),
      description,
      lat,
      lon,
      photoBlobId: photoId,
      createdAt: new Date().toISOString(),
      name: 'Offline User',
    };
    
    const syncTx = db.transaction(SYNC_OBJECT_STORE_NAME, 'readwrite');
    await syncTx.objectStore(SYNC_OBJECT_STORE_NAME).add(storyData);
    await syncTx.done;
    
    // Daftarkan Background Sync
    if ('sync' in navigator) {
      await navigator.serviceWorker.ready;
      await navigator.sync.register('sync-new-story');
      console.log('Background sync registered for new story.');
    }
    
    return storyData;
  },

  async getOfflineStoriesForSync() {
    const db = await dbPromise;
    const syncStories = await db.getAll(SYNC_OBJECT_STORE_NAME);
    return syncStories;
  },
  
  async deleteOfflineStoryAndPhoto(storyId, photoBlobId) {
    const db = await dbPromise;
    const syncTx = db.transaction(SYNC_OBJECT_STORE_NAME, 'readwrite');
    await syncTx.objectStore(SYNC_OBJECT_STORE_NAME).delete(storyId);
    await syncTx.done;
    
    if (photoBlobId) {
        const photoTx = db.transaction(PHOTO_OBJECT_STORE_NAME, 'readwrite');
        await photoTx.objectStore(PHOTO_OBJECT_STORE_NAME).delete(photoBlobId);
        await photoTx.done;
    }
  }
};

export default StoryIdb;