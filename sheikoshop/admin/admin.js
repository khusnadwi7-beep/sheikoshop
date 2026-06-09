import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);

window.loginAdmin = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login berhasil");
    location.reload();
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
};

window.logoutAdmin = async function () {
  await signOut(auth);
  location.reload();
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.innerHTML = `
      <h1>Dashboard Admin Sheikoshop</h1>
      <p>Login sebagai: ${user.email}</p>
      <button onclick="logoutAdmin()">Logout</button>
      <hr>
      <h2>Admin berhasil login</h2>
      <p>Langkah berikutnya: aktifkan fitur produk, payment, order.</p>
    `;
  }
});
