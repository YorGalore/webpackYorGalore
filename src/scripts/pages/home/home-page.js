import * as L from 'leaflet';
import { getAllStories } from '../../api.js';
import { showFormattedDate } from '../../utils.js'; 
import StoryIdb from '../../idb-helper.js';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default class HomePage {
  async render() {
    return `
      <section class="container">
        <h1>Peta Cerita</h1>
        <div class="story-controls">
          <input type="text" id="story-search" placeholder="Cari cerita (nama atau deskripsi)..." aria-label="Cari cerita">
        </div>
        <div id="map" style="height: 450px; width: 100%; margin-bottom: 20px;"></div>
        <h2>Daftar Cerita</h2>
        <div id="story-list" class="story-list"></div>
      </section>
    `;
  }

  _displayStories(stories) {
      const storyListContainer = document.querySelector('#story-list');
      const mapElement = document.querySelector('#map');
      
      if (!storyListContainer || !mapElement) return;

      storyListContainer.innerHTML = '';
      
      // Hapus peta lama jika ada untuk inisialisasi ulang
      if (mapElement.hasAttribute('_leaflet_id')) {
          mapElement.innerHTML = '';
      }
      
      const map = L.map('map').setView([-2.5489, 118.0149], 5); 

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      stories.forEach(story => {
        const storyElement = document.createElement('article');
        storyElement.classList.add('story-item');
        
        const photoUrl = story.photoUrl || (story.photoBlobId ? 'placeholder.png' : 'fallback-image.png');
        
        storyElement.innerHTML = `
          <img src="${photoUrl}" alt="Cerita oleh ${story.name}">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <small>${showFormattedDate(story.createdAt)}</small>
          <a href="#/stories/${story.id}" class="story-detail-link">Lihat Detail</a> 
        `;
        storyListContainer.appendChild(storyElement);

        if (story.lat && story.lon) {
          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`
              <img src="${photoUrl}" alt="Cerita oleh ${story.name}" style="width:100%">
              <b>${story.name}</b><br>
              ${story.description.substring(0, 50)}...
              <br><a href="#/stories/${story.id}">Lihat Detail</a>
            `);
        }
      });
  }

  async afterRender() {
    const storiesResponse = await getAllStories();
    let cachedStories = [];

    try {
        const storiesResponse = await getAllStories(); // SW handles SWR caching
        if (storiesResponse.error) {
            throw new Error(storiesResponse.message);
        }
        cachedStories = storiesResponse.listStory;
        
        // Cache data API ke IDB (Kriteria 4 Basic)
        StoryIdb.putStories(cachedStories); 

    } catch (error) {
      console.warn('Gagal mengambil data dari API, mencoba dari IndexedDB:', error.message);
      if (error.message === 'Missing token') {
        alert('Anda harus login terlebih dahulu.');
        window.location.hash = '#/login';
        return; 
      }
      
      // Kriteria 3 Advanced: Fallback ke IndexedDB
      cachedStories = await StoryIdb.getStories();
      if (cachedStories.length === 0) {
          alert('Anda offline dan tidak ada data yang tersimpan secara lokal.');
          return;
      }
      
      alert(`Menampilkan ${cachedStories.length} cerita dari mode offline.`);
    }
    
    // Ambil cerita yang antri untuk sync (opsional, untuk tampilan langsung)
    const offlineSyncStories = await StoryIdb.getOfflineStoriesForSync();
    
    // Gabungkan cerita yang sudah di-cache dengan yang sedang antri sync
    let allStories = [...cachedStories.filter(s => !s.id.startsWith('offline-')), ...offlineSyncStories];
    
    this._displayStories(allStories);
    
    // Kriteria 4 Skilled: Implementasi Pencarian
    storySearchInput.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        const filteredStories = allStories.filter(story => 
            (story.name && story.name.toLowerCase().includes(query)) ||
            (story.description && story.description.toLowerCase().includes(query))
        );
        this._displayStories(filteredStories);
    });
  }
}

    if (storiesResponse.error) {
      if (storiesResponse.message === 'Missing token') {
        alert('Anda harus login terlebih dahulu.');
      }
      return; 
    }

    const stories = storiesResponse.listStory;
    const map = L.map('map').setView([-2.5489, 118.0149], 5); // Center Indonesia

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const storyListContainer = document.querySelector('#story-list');
    storyListContainer.innerHTML = '';

    stories.forEach(story => {
      const storyElement = document.createElement('article');
      storyElement.classList.add('story-item');
      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Cerita oleh ${story.name}">
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <small>${showFormattedDate(story.createdAt)}</small>
      `;
      storyListContainer.appendChild(storyElement);

      if (story.lat && story.lon) {
        L.marker([story.lat, story.lon])
          .addTo(map)
          .bindPopup(`
            <img src="${story.photoUrl}" alt="Cerita oleh ${story.name}" style="width:100%">
            <b>${story.name}</b><br>
            ${story.description.substring(0, 50)}...
          `);
      }
    });