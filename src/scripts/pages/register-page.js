import { register } from '../api.js';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h2>Register Akun Baru</h2>
        <form id="register-form">
          <div>
            <label for="name">Nama:</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password (min. 8 karakter):</label>
            <input type="password" id="password" name="password" minlength="8" required>
          </div>
          <button type="submit">Register</button>
        </form>
        <p id="error-message" style="color: red;"></p>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.querySelector('#register-form');
    const errorMessage = document.querySelector('#error-message');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = '';

      const name = event.target.name.value;
      const email = event.target.email.value;
      const password = event.target.password.value;

      try {
        const result = await register({ name, email, password });
        if (result.error) {
          throw new Error(result.message);
        }

        alert('Registrasi berhasil! Silakan login.');
        window.location.hash = '#/login'; // Arahkan ke halaman login

      } catch (error) {
        errorMessage.textContent = `Registrasi Gagal: ${error.message}`;
      }
    });
  }
}