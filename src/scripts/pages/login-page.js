import { login } from '../api.js';

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h2>Login</h2>
        <form id="login-form">
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" minlength="8" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <p id="error-message" style="color: red;"></p>
      </section>
    `;
  }

  async afterRender() {
    const loginForm = document.querySelector('#login-form');
    const errorMessage = document.querySelector('#error-message');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = '';

      const email = event.target.email.value;
      const password = event.target.password.value;

      try {
        const result = await login({ email, password });
        if (result.error) {
          throw new Error(result.message);
        }

        // Simpan token ke sessionStorage
        sessionStorage.setItem('token', result.loginResult.token);
        
        // Redirect ke halaman utama
        alert('Login Berhasil!');
        window.location.hash = '#/';

      } catch (error) {
        errorMessage.textContent = `Login Gagal: ${error.message}`;
      }
    });
  }
}