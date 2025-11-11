import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import NotificationHelper from '../notification-helper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #swRegistration = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#swRegistration = swRegistration;

    this._setupDrawer();
    this.setupNotificationToggle();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      })
    });

    const logoutButton = document.querySelector('#logout-button');
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault(); 
      
      sessionStorage.removeItem('token'); 
      
      alert('Anda telah logout.');
      window.location.hash = '#/login'; 
      this.#navigationDrawer.classList.remove('open'); 

      if (this.#swRegistration && NotificationHelper.checkAvailability()) {
          NotificationHelper.unsubscribe(this.#swRegistration);
          const pushToggle = document.querySelector('#push-notification-toggle');
          if (pushToggle) {
              pushToggle.checked = false;
          }
      }
    });
  }
  _setupNotificationToggle() {
      const pushToggle = document.querySelector('#push-notification-toggle');
      if (!pushToggle || !this.#swRegistration || !NotificationHelper.checkAvailability()) {
          if (pushToggle) pushToggle.style.display = 'none'; 
          return;
      }

      pushToggle.addEventListener('change', async (event) => {
          const isChecked = event.target.checked;
          const token = sessionStorage.getItem('token');
          
          if (!token) {
              alert('Anda harus login untuk mengaktifkan notifikasi.');
              event.target.checked = false;
              return;
          }

          if (isChecked) {
              const subscription = await NotificationHelper.subscribe(this.#swRegistration);
              if (!subscription) {
                  event.target.checked = false; 
              }
          } else {
              const success = await NotificationHelper.unsubscribe(this.#swRegistration);
              if (!success) {
                  event.target.checked = true; 
              }
          }
      });
  }
  
  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url] || routes['/404'];

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      });
    } else {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    }
  }
}

export default App;
