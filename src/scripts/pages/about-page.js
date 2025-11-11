export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>Tentang Aplikasi Story App</h1>
        <p style="margin-top: 16px;">
          Story App adalah sebuah platform sederhana yang dibuat sebagai 
          proyek submission untuk kelas "Menjadi Front-End Web Developer Expert" di Dicoding.
        </p>
        <p style="margin-top: 16px;">
          Aplikasi ini memungkinkan pengguna untuk berbagi cerita singkat beserta lokasi
          di mana cerita itu terjadi, yang kemudian ditampilkan di peta digital.
        </p>
        
        <h2 style="margin-top: 24px;">Tentang Pembuat</h2>
        <p style="margin-top: 16px;">
          Aplikasi ini dibuat oleh:
        </p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>Nama: [Isi Nama Anda Di Sini]</li>
          <li>Email: [Isi Email Anda Di Sini]</li>
        </ul>
      </section>
    `;
  }

  async afterRender() {
  }
}