firebase.initializeApp(window.firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let allProducts = [];
let allPayments = [];
let storeSettings = {};
let currentUser = null;
let productStocks = {};

function rupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

function safeText(text) {
  return String(text || "").replace(/[<>&"]/g, function(c) {
    return {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;"
    }[c];
  });
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modal").style.display = "flex";
}

function requireLogin() {
  if (!currentUser) {
    alert("Silakan login atau daftar terlebih dahulu sebelum membeli.");
    showLogin();
    return false;
  }

  return true;
}

function updateAuthMenu() {
  const loginMenu = document.getElementById("loginMenu");
  const registerMenu = document.getElementById("registerMenu");
  const logoutMenu = document.getElementById("logoutMenu");

  if (!loginMenu) return;

  if (currentUser) {
    loginMenu.style.display = "none";
    registerMenu.style.display = "none";
    logoutMenu.style.display = "inline-block";
  } else {
    loginMenu.style.display = "inline-block";
    registerMenu.style.display = "inline-block";
    logoutMenu.style.display = "none";
  }
}

auth.onAuthStateChanged(user => {
  currentUser = user;
  updateAuthMenu();
});

function showRegister() {
  openModal(`
    <h2>Daftar Pembeli</h2>

    <div class="field">
      <label>Email</label>
      <input id="registerEmail" type="email" placeholder="email@gmail.com">
    </div>

    <div class="field">
      <label>Password</label>
      <input id="registerPassword" type="password" placeholder="Minimal 6 karakter">
    </div>

    <button class="btn" onclick="registerUser()">Daftar</button>
    <button class="btn ghost" onclick="showLogin()">Sudah punya akun? Login</button>
    <button class="btn ghost" onclick="closeModal()">Tutup</button>
  `);
}

function registerUser() {
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!email) return alert("Email wajib diisi");
  if (!password) return alert("Password wajib diisi");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Daftar berhasil.");
      closeModal();
    })
    .catch(e => alert(e.message));
}

function showLogin() {
  openModal(`
    <h2>Login Pembeli</h2>

    <div class="field">
      <label>Email</label>
      <input id="loginEmail" type="email" placeholder="email@gmail.com">
    </div>

    <div class="field">
      <label>Password</label>
      <input id="loginPassword" type="password" placeholder="Password">
    </div>

    <button class="btn" onclick="loginUser()">Login</button>
    <button class="btn ghost" onclick="showRegister()">Belum punya akun? Daftar</button>
    <button class="btn ghost" onclick="closeModal()">Tutup</button>
  `);
}

function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email) return alert("Email wajib diisi");
  if (!password) return alert("Password wajib diisi");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login berhasil.");
      closeModal();
    })
    .catch(e => alert(e.message));
}

function logoutUser() {
  auth.signOut()
    .then(() => alert("Logout berhasil."))
    .catch(e => alert(e.message));
}

function loadSettings() {
  db.collection("store_settings").doc("main").onSnapshot(doc => {
    if (!doc.exists) return;

    storeSettings = doc.data();

    if (storeSettings.storeName) {
      document.getElementById("storeName").innerText = storeSettings.storeName;
      document.getElementById("footerStoreName").innerText = storeSettings.storeName;
    }

    if (storeSettings.logoText) {
      document.getElementById("storeLogo").innerText = storeSettings.logoText;
    }

    if (storeSettings.heroTitle) {
      document.getElementById("heroTitle").innerHTML =
        safeText(storeSettings.heroTitle).replace(/\n/g, "<br>");
    }

    if (storeSettings.heroDescription) {
      document.getElementById("heroDescription").innerText =
        storeSettings.heroDescription;
    }

    if (storeSettings.waAdmin) {
      document.getElementById("whatsappLink").href =
        "https://wa.me/" + storeSettings.waAdmin.replace(/\D/g, "");
    }
  });
}

function loadProducts() {
  db.collection("products").where("active", "==", true).onSnapshot(snapshot => {
    allProducts = [];

    snapshot.forEach(doc => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    renderProducts(allProducts);
    renderCategories(allProducts);
  });
}

function loadAccountStocks() {
  db.collection("account_stock")
    .where("status", "==", "available")
    .onSnapshot(snapshot => {
      productStocks = {};

      snapshot.forEach(doc => {
        const s = doc.data();

        if (!s.productId) return;

        if (!productStocks[s.productId]) {
          productStocks[s.productId] = 0;
        }

        productStocks[s.productId]++;
      });

      renderProducts(allProducts);
    });
}

function loadPayments() {
  db.collection("payments").where("active", "==", true).onSnapshot(snapshot => {
    allPayments = [];

    snapshot.forEach(doc => {
      allPayments.push({
        id: doc.id,
        ...doc.data()
      });
    });
  });
}

function renderProducts(products) {
  const wrap = document.getElementById("products");
  wrap.innerHTML = "";

  if (!products.length) {
    wrap.innerHTML = `<p class="muted">Produk belum tersedia.</p>`;
    return;
  }

  products.forEach(p => {
    const stock = productStocks[p.id] || 0;
    const disabled = stock <= 0 ? "disabled" : "";

    const image = p.imageUrl
      ? `<img src="${safeText(p.imageUrl)}" alt="${safeText(p.name)}" style="width:100%;height:160px;object-fit:cover;border-radius:18px;margin-bottom:14px;">`
      : `<div style="width:100%;height:160px;border-radius:18px;margin-bottom:14px;background:#111827;display:flex;align-items:center;justify-content:center;font-size:42px;">📦</div>`;

    wrap.innerHTML += `
      <div class="productCard">
        ${image}
        <div class="muted">${safeText(p.category || "Produk")}</div>
        <h3>${safeText(p.name)}</h3>
        <p>${safeText(p.description || "")}</p>
        <p class="muted">Stok: ${stock}</p>
        <div class="price">${rupiah(p.price)}</div>
        <button class="btn" onclick="addToCart('${p.id}')" ${disabled}>Tambah Keranjang</button>
        <button class="btn ghost" onclick="orderProduct('${p.id}')" ${disabled}>Beli Sekarang</button>
      </div>
    `;
  });
}

function renderCategories(products) {
  const categories = document.getElementById("categories");
  const list = ["Semua", ...new Set(products.map(p => p.category).filter(Boolean))];

  categories.innerHTML = "";

  list.forEach(cat => {
    categories.innerHTML += `
      <button class="tab ${cat === "Semua" ? "active" : ""}" onclick="filterCategory('${safeText(cat)}', this)">
        ${safeText(cat)}
      </button>
    `;
  });
}

function filterCategory(category, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");

  if (category === "Semua") {
    renderProducts(allProducts);
  } else {
    renderProducts(allProducts.filter(p => p.category === category));
  }
}

function searchProducts(keyword) {
  const q = keyword.toLowerCase();

  const result = allProducts.filter(p =>
    String(p.name || "").toLowerCase().includes(q) ||
    String(p.category || "").toLowerCase().includes(q) ||
    String(p.description || "").toLowerCase().includes(q)
  );

  renderProducts(result);
}

function renderPaymentOptions() {
  if (!allPayments.length) {
    return `
      <div class="paymentBox" style="padding:12px;border:1px solid #333;border-radius:14px;margin:12px 0;">
        <b>Metode Pembayaran belum tersedia</b>
        <p class="muted">Silakan hubungi admin via WhatsApp.</p>
      </div>
    `;
  }

  let html = `
    <div class="field">
      <label>Pilih Metode Pembayaran</label>
      <select id="paymentSelect" onchange="showPaymentDetail()">
        <option value="">-- Pilih Pembayaran --</option>
  `;

  allPayments.forEach(pay => {
    html += `<option value="${pay.id}">${safeText(pay.name)} - ${safeText(pay.type || "")}</option>`;
  });

  html += `
      </select>
    </div>
    <div id="paymentDetail"></div>
  `;

  return html;
}

function showPaymentDetail() {
  const paymentId = document.getElementById("paymentSelect").value;
  const detail = document.getElementById("paymentDetail");

  if (!paymentId) {
    detail.innerHTML = "";
    return;
  }

  const pay = allPayments.find(item => item.id === paymentId);
  if (!pay) return;

  detail.innerHTML = `
    <div class="paymentBox" style="padding:14px;border:1px solid #333;border-radius:14px;margin:12px 0;">
      <h3>${safeText(pay.name)}</h3>
      <p><b>Tipe:</b> ${safeText(pay.type || "-")}</p>
      <p><b>Nama Rekening:</b> ${safeText(pay.accountName || "-")}</p>
      <p><b>Nomor:</b> ${safeText(pay.accountNumber || "-")}</p>
      <p>${safeText(pay.description || "")}</p>

      ${
        pay.qrisUrl
          ? `<img src="${safeText(pay.qrisUrl)}" alt="QRIS" style="width:100%;max-width:260px;border-radius:16px;margin-top:10px;">`
          : ""
      }
    </div>
  `;
}

function addToCart(id) {
  if (!requireLogin()) return;

  const p = allProducts.find(item => item.id === id);
  if (!p) return alert("Produk tidak ditemukan");

  const stock = productStocks[p.id] || 0;
  if (stock <= 0) return alert("Stok produk habis");

  db.collection("carts").add({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    productId: p.id,
    productName: p.name,
    productPrice: Number(p.price || 0),
    productImage: p.imageUrl || "",
    qty: 1,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Produk berhasil masuk keranjang");
  }).catch(e => alert(e.message));
}

function showCart() {
  if (!requireLogin()) return;

  db.collection("carts")
    .where("userId", "==", currentUser.uid)
    .get()
    .then(snapshot => {
      let html = `<h2>Keranjang Saya</h2>`;

      if (snapshot.empty) {
        html += `<p class="muted">Keranjang masih kosong.</p>`;
      } else {
        snapshot.forEach(doc => {
          const item = doc.data();

          html += `
            <div class="paymentBox" style="padding:14px;border:1px solid #333;border-radius:14px;margin:12px 0;">
              <h3>${safeText(item.productName)}</h3>
              <p>Harga: ${rupiah(item.productPrice)}</p>
              <button class="btn" onclick="orderProduct('${item.productId}')">Checkout</button>
              <button class="btn ghost" onclick="removeCartItem('${doc.id}')">Hapus</button>
            </div>
          `;
        });
      }

      html += `<button class="btn ghost" onclick="closeModal()">Tutup</button>`;
      openModal(html);
    })
    .catch(e => alert(e.message));
}

function removeCartItem(cartId) {
  db.collection("carts").doc(cartId).delete()
    .then(() => {
      alert("Produk dihapus dari keranjang");
      showCart();
    })
    .catch(e => alert(e.message));
}

function orderProduct(id) {
  if (!requireLogin()) return;

  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  const stock = productStocks[p.id] || 0;
  if (stock <= 0) return alert("Stok produk habis");

  openModal(`
    <h2>${safeText(p.name)}</h2>
    <p>${safeText(p.description || "")}</p>
    <h3>${rupiah(p.price)}</h3>
    <p class="muted">Stok tersedia: ${stock}</p>

    <div class="field">
      <label>Email Akun Pembeli</label>
      <input value="${safeText(currentUser.email)}" disabled>
    </div>

    <div class="field">
      <label>Nama Pembeli</label>
      <input id="buyerName" placeholder="Nama kamu">
    </div>

    <div class="field">
      <label>Nomor WhatsApp</label>
      <input id="buyerWa" placeholder="08xxxxxxxxxx">
    </div>

    ${renderPaymentOptions()}

    <button class="btn" onclick="submitOrder('${p.id}')">Kirim Pesanan</button>
    <button class="btn ghost" onclick="closeModal()">Tutup</button>
  `);
}

function submitOrder(id) {
  if (!requireLogin()) return;

  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  const stock = productStocks[p.id] || 0;
  if (stock <= 0) return alert("Stok produk habis");

  const customerName = document.getElementById("buyerName").value.trim();
  const customerWa = document.getElementById("buyerWa").value.trim();

  const paymentSelect = document.getElementById("paymentSelect");
  const paymentId = paymentSelect ? paymentSelect.value : "";
  const payment = allPayments.find(item => item.id === paymentId);

  if (!customerName) return alert("Nama wajib diisi");
  if (!customerWa) return alert("Nomor WhatsApp wajib diisi");
  if (allPayments.length && !paymentId) return alert("Silakan pilih metode pembayaran");

  db.collection("orders").add({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    customerName,
    customerWa,
    productId: p.id,
    productName: p.name,
    total: Number(p.price || 0),
    paymentId: payment ? payment.id : "",
    paymentName: payment ? payment.name : "",
    paymentType: payment ? payment.type : "",
    paymentAccountName: payment ? payment.accountName : "",
    paymentAccountNumber: payment ? payment.accountNumber : "",
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(orderRef => {
    alert("Pesanan berhasil dibuat. Silakan lakukan pembayaran.");

    closeModal();

    if (storeSettings.waAdmin) {
      const paymentText = payment
        ? `%0AMetode Bayar: ${payment.name}%0ATipe: ${payment.type || "-"}%0ANama Rekening: ${payment.accountName || "-"}%0ANomor: ${payment.accountNumber || "-"}`
        : `%0AMetode Bayar: Hubungi Admin`;

      const text =
        `Halo admin Sheikoshop, saya ingin order:%0A%0A` +
        `Order ID: ${orderRef.id}%0A` +
        `Produk: ${p.name}%0A` +
        `Harga: ${rupiah(p.price)}%0A` +
        `Nama: ${customerName}%0A` +
        `Email: ${currentUser.email}%0A` +
        `WA: ${customerWa}` +
        paymentText;

      window.open(
        "https://wa.me/" + storeSettings.waAdmin.replace(/\D/g, "") + "?text=" + text,
        "_blank"
      );
    }
  }).catch(e => alert(e.message));
}

function showMyOrders() {
  if (!requireLogin()) return;

  db.collection("orders")
    .where("userId", "==", currentUser.uid)
    .get()
    .then(snapshot => {
      let html = `<h2>Pesanan Saya</h2>`;

      if (snapshot.empty) {
        html += `<p class="muted">Belum ada pesanan.</p>`;
      } else {
        const orders = [];

        snapshot.forEach(doc => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });

        orders.sort((a, b) => {
          const da = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
          const dbb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
          return dbb - da;
        });

        orders.forEach(order => {
          const isPaid = order.status === "paid" || order.status === "done";

          html += `
            <div class="orderDetailCard">
              <div class="orderHeader">
                <h3>Detail Pesanan</h3>
                <span class="orderBadge ${isPaid ? "success" : "warning"}">
                  ${isPaid ? "Selesai" : "Menunggu"}
                </span>
              </div>

              <div class="orderIdBox">
                <small>Order ID</small>
                <b>#${order.id}</b>
              </div>

              <div class="orderSection">
                <h4>Status Pesanan</h4>

                <div class="timeline">
                  <div class="step active">
                    <b>Pesanan Dibuat</b>
                    <small>Pesanan berhasil dibuat</small>
                  </div>

                  <div class="step active">
                    <b>Menunggu Pembayaran</b>
                    <small>Silakan lakukan pembayaran</small>
                  </div>

                  <div class="step ${isPaid ? "active" : ""}">
                    <b>Pembayaran Diverifikasi</b>
                    <small>${isPaid ? "Pembayaran sudah dikonfirmasi admin" : "Menunggu konfirmasi admin"}</small>
                  </div>

                  <div class="step ${isPaid ? "active" : ""}">
                    <b>Pesanan Selesai</b>
                    <small>${isPaid ? "Akun sudah dikirim" : "Akun belum dikirim"}</small>
                  </div>
                </div>
              </div>

              <div class="orderSection">
                <h4>Informasi Produk</h4>

                <div class="productInfo">
                  <div class="miniIcon">${safeText((order.productName || "P").charAt(0))}</div>
                  <div>
                    <b>${safeText(order.productName || "-")}</b>
                    <p>${rupiah(order.total)} / bulan</p>
                  </div>
                </div>
              </div>

              <div class="orderSection">
                <h4>Informasi Akun</h4>

                ${
                  order.accountEmail
                    ? `
                      <label>Email</label>
                      <div class="accountBox">${safeText(order.accountEmail)}</div>

                      <label>Password</label>
                      <div class="passwordRow">
                        <div class="accountBox">••••••••••••</div>
                        <button class="btn" onclick="copyText('${safeText(order.accountPassword || "")}')">Salin</button>
                      </div>

                      <p class="warningBox">
                        Harap simpan informasi akun dengan aman dan jangan bagikan ke orang lain.
                      </p>
                    `
                    : `
                      <p class="muted">
                        Akun akan muncul setelah pembayaran dikonfirmasi admin.
                      </p>
                    `
                }
              </div>
            </div>
          `;
        });
      }

      html += `<button class="btn ghost" onclick="closeModal()">Tutup</button>`;
      openModal(html);
    })
    .catch(e => alert(e.message));
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert("Berhasil disalin"))
    .catch(() => alert("Gagal menyalin"));
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadProducts();
  loadAccountStocks();
  loadPayments();
  updateAuthMenu();

  const searchInput = document.getElementById("searchInput");
  const heroSearchInput = document.getElementById("heroSearchInput");

  if (searchInput) {
    searchInput.addEventListener("input", e => searchProducts(e.target.value));
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener("input", e => searchProducts(e.target.value));
  }

  document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") closeModal();
  });
});
