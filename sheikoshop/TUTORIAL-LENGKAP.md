# Tutorial Lengkap Sheikoshop

Ini adalah website statis untuk jualan aplikasi premium dengan 2 halaman utama:

- Website pembeli: `index.html`
- Dashboard admin: `admin/index.html`

Website ini bisa langsung online gratis di Cloudflare Pages. Data demo disimpan di browser menggunakan `localStorage`, jadi cocok untuk demo/MVP awal. Untuk transaksi besar, gunakan database seperti Supabase.

---

## 1. Isi Folder

```
sheikoshop/
├── index.html              # Halaman toko utama
├── styles.css              # Tampilan website toko
├── app.js                  # Logic produk, checkout, order
├── admin/
│   ├── index.html          # Dashboard admin
│   ├── admin.css           # Tampilan dashboard admin
│   └── admin.js            # Logic dashboard admin
├── assets/
│   └── reference.png       # Gambar referensi desain
├── package.json            # Metadata project
└── TUTORIAL-LENGKAP.md     # File tutorial ini
```

---

## 2. Cara Membuka di Laptop

1. Extract file ZIP.
2. Buka folder `sheikoshop`.
3. Klik dua kali file `index.html`.
4. Untuk dashboard admin, buka folder `admin`, lalu klik `index.html`.

Alamat saat online nanti:

```
https://domainkamu.com
https://domainkamu.com/admin
```

---

## 3. Cara Mengubah Nama Toko

Nama toko sudah diubah menjadi **Sheikoshop**.

Kalau ingin mengubah lagi, buka file berikut:

- `index.html`
- `admin/index.html`

Cari:

```
SHEIKOSHOP
Sheikoshop
```

Ganti sesuai nama toko baru.

---

## 4. Cara Mengubah Produk

Buka file:

```
app.js
```

Cari bagian:

```js
const seedProducts = [
```

Contoh data produk:

```js
{id:1,name:'Canva Pro',cat:'Desain',price:25000,rating:4.9,sold:245,icon:'Canva',desc:'Full premium, akun private, garansi 30 hari, proses 1-5 menit.'}
```

Penjelasan:

- `id`: nomor unik produk
- `name`: nama produk
- `cat`: kategori
- `price`: harga tanpa titik/koma
- `rating`: rating produk
- `sold`: jumlah terjual/review
- `icon`: teks logo pendek
- `desc`: deskripsi produk

Contoh menambah produk:

```js
{id:9,name:'Wink Premium',cat:'Desain',price:22000,rating:4.8,sold:50,icon:'W',desc:'Aplikasi editing premium, proses cepat dan bergaransi.'}
```

Jangan lupa beri koma antar produk.

---

## 5. Cara Mengubah Nomor WhatsApp

Buka file:

```
index.html
```

Cari:

```html
https://wa.me/6281234567890
```

Ganti dengan nomor kamu.

Contoh nomor asli:

```
085123456789
```

Ubah menjadi:

```
6285123456789
```

Maka linknya:

```html
https://wa.me/6285123456789
```

---

## 6. Cara Mengubah Rekening Transfer

Buka file:

```
app.js
```

Cari:

```text
BCA 123456789 a/n Sheikoshop
```

Ganti menjadi rekening kamu, contoh:

```text
BCA 1234567890 a/n Nama Kamu
BRI 9876543210 a/n Nama Kamu
DANA 085123456789
```

Untuk dashboard admin, buka:

```
admin/index.html
```

Cari bagian rekening dan ganti juga.

---

## 7. Cara Mengganti QRIS

Versi ini memakai kotak QRIS demo. Untuk memakai gambar QRIS asli:

1. Masukkan file QRIS ke folder `assets`.
2. Beri nama misalnya `qris.png`.
3. Buka `app.js`.
4. Cari bagian:

```html
<div class="qris">QRIS</div>
```

Ganti menjadi:

```html
<img src="assets/qris.png" class="qrisImg" alt="QRIS Sheikoshop">
```

5. Buka `styles.css`, tambahkan:

```css
.qrisImg{width:220px;max-width:100%;display:block;margin:15px auto;border-radius:14px;background:white;padding:10px}
```

---

## 8. Cara Order Berjalan

Alur pembeli:

1. Pembeli pilih produk.
2. Klik `Beli Sekarang`.
3. Isi nama dan WhatsApp/email.
4. Pilih QRIS / transfer bank.
5. Upload bukti pembayaran.
6. Klik `Kirim Bukti Pembayaran`.
7. Order masuk ke dashboard admin.

Alur admin:

1. Buka `/admin`.
2. Masuk menu `Pesanan`.
3. Pilih order pending.
4. Klik `Approve`.
5. Status order berubah menjadi selesai.

Catatan: karena ini versi statis, upload bukti belum benar-benar masuk server. Untuk upload bukti asli online, perlu ditambah Supabase Storage/Firebase.

---

## 9. Cara Deploy ke GitHub

1. Login ke GitHub.
2. Klik `New repository`.
3. Nama repository: `sheikoshop`.
4. Pilih `Public` atau `Private`.
5. Klik `Create repository`.
6. Klik `Add file` > `Upload files`.
7. Upload semua isi folder `sheikoshop`.
8. Klik `Commit changes`.

Yang harus terlihat di GitHub:

```
index.html
styles.css
app.js
admin/
assets/
package.json
```

Jangan hanya upload file ZIP.

---

## 10. Cara Deploy ke Cloudflare Pages

1. Login ke Cloudflare.
2. Buka `Workers & Pages`.
3. Klik `Create` / `Create application`.
4. Pilih `Pages`.
5. Pilih `Connect to Git`.
6. Hubungkan ke GitHub.
7. Pilih repository `sheikoshop`.
8. Pada konfigurasi build isi:

```
Framework preset: None
Build command: kosongkan
Build output directory: /
Root directory: /
```

9. Klik `Save and Deploy`.

Cloudflare Pages memang mendukung deploy dari GitHub/GitLab, jadi setiap kamu push/update file di GitHub, Cloudflare bisa membuat deployment baru otomatis.

---

## 11. Cara Hubungkan Domain

Karena domain kamu sudah ada di Cloudflare:

1. Masuk Cloudflare.
2. Buka `Workers & Pages`.
3. Pilih project `sheikoshop`.
4. Buka tab `Custom domains`.
5. Klik `Set up a domain`.
6. Masukkan domain kamu, contoh:

```
sheikoshop.com
```

atau:

```
www.sheikoshop.com
```

7. Klik `Continue`.
8. Ikuti instruksi sampai aktif.

Dokumentasi Cloudflare menyebut custom domain ditambahkan dari Workers & Pages > Pages project > Custom domains > Set up a domain.

---

## 12. Cara Update Website Setelah Online

Kalau ingin mengubah produk, harga, WhatsApp, atau rekening:

1. Edit file di laptop.
2. Upload ulang file yang berubah ke GitHub.
3. Cloudflare akan deploy otomatis.
4. Tunggu 1–3 menit.
5. Refresh website.

---

## 13. Kekurangan Versi Statis Ini

Versi ini sudah bagus untuk demo dan awal jualan, tapi ada batasan:

- Order tersimpan di browser, bukan database online.
- Upload bukti belum tersimpan ke server.
- Login admin belum aman seperti aplikasi produksi.
- Kalau beda perangkat, data order tidak otomatis sama.

Untuk versi produksi, perlu upgrade ke:

- Supabase database
- Supabase Auth untuk admin
- Supabase Storage untuk bukti transfer
- Tabel orders, products, reviews, accounts
- Role admin
- Payment gateway QRIS otomatis seperti Midtrans/Xendit/Tripay

---

## 14. Checklist Sebelum Online

- [ ] Nama toko sudah benar: Sheikoshop
- [ ] Nomor WhatsApp sudah diganti
- [ ] Rekening sudah diganti
- [ ] QRIS sudah diganti
- [ ] Produk dan harga sudah diganti
- [ ] Domain sudah diarahkan ke Cloudflare Pages
- [ ] Halaman `/admin` bisa dibuka
- [ ] Tombol beli dan checkout bisa jalan

