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

function jsString(text) {
  return JSON.stringify(String(text || ""));
}

function waNumber() {
  return String(storeSettings.waAdmin || "").replace(/\D/g, "");
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("show");
  modal.style.display = "none";
}

function openModal(html) {
  const modal = document.getElementById("modal");
  document.getElementById("modalContent").innerHTML = html;
  modal.style.display = "flex";
  modal.classList.add("show");
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function activateOrderStep(btn) {
  document.querySelectorAll(".stepCard").forEach(item => {
    item.classList.remove("active");
  });

  btn.classList.add("active");
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
    <p class="muted">Buat akun untuk checkout, melihat pesanan, dan memberi rating.</p>

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
    <p class="muted">Masuk untuk checkout dan melihat akun premium di Pesanan Saya.</p>

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
      const link = "https://wa.me/" + waNumber();

      const whatsappLink = document.getElementById("whatsappLink");
      const floatingWa = document.getElementById("floatingWa");

      if (whatsappLink) whatsappLink.href = link;
      if (floatingWa) floatingWa.href = link;
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
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!products.length) {
    wrap.innerHTML = `<p class="muted">Produk tidak ditemukan.</p>`;
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
        <div class="muted">${safeText(p.category || "Produk Premium")}</div>
        <h3>${safeText(p.name)}</h3>
        <p>${safeText(p.description || "")}</p>
        <p class="muted">Stok tersedia: ${stock}</p>
        <div class="price">${rupiah(p.price)}</div>
        <button class="btn" onclick="addToCart('${p.id}')" ${disabled}>Tambah Keranjang</button>
        <button class="btn ghost" onclick="orderProduct('${p.id}')" ${disabled}>Beli Sekarang</button>
      </div>
    `;
  });
}

function renderCategories(products) {
  const categories = document.getElementById("categories");
  if (!categories) return;

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
  const q = normalizeText(keyword);

  if (!q) {
    renderProducts(allProducts);
    return;
  }

  const words = q.split(" ").filter(Boolean);

  const result = allProducts.filter(p => {
    const productText = normalizeText([
      p.name,
      p.category,
      p.description,
      p.type,
      p.brand,
      p.keyword,
      p.keywords,
      p.tags
    ].join(" "));

    return words.every(word => productText.includes(word));
  });

  renderProducts(result);
}

function renderPaymentOptions() {
  if (!allPayments.length) {
    return `
      <div class="paymentBox">
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
    <div class="paymentBox">
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
            <div class="paymentBox">
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
  if (!p) return alert("Produk tidak ditemukan");

  const stock = productStocks[p.id] || 0;
  if (stock <= 0) return alert("Stok produk habis");

  openModal(`
    <h2>${safeText(p.name)}</h2>
    <p class="muted">${safeText(p.description || "")}</p>
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
  if (!p) return alert("Produk tidak ditemukan");

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
    reviewSubmitted: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(orderRef => {
    alert("Pesanan berhasil dibuat. Silakan lakukan pembayaran lalu kirim bukti transfer.");

    closeModal();

    if (storeSettings.waAdmin) {
      const paymentText = payment
        ? `\nMetode Bayar: ${payment.name}\nTipe: ${payment.type || "-"}\nNama Rekening: ${payment.accountName || "-"}\nNomor: ${payment.accountNumber || "-"}`
        : `\nMetode Bayar: Hubungi Admin`;

      const text =
        `Halo admin SheikoShop, saya ingin order:\n\n` +
        `Order ID: ${orderRef.id}\n` +
        `Produk: ${p.name}\n` +
        `Harga: ${rupiah(p.price)}\n` +
        `Nama: ${customerName}\n` +
        `Email: ${currentUser.email}\n` +
        `WA: ${customerWa}` +
        paymentText +
        `\n\nSaya akan kirim bukti transfer setelah pembayaran.`;

      window.open(
        "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(text),
        "_blank"
      );
    }
  }).catch(e => alert(e.message));
}

function makeProofTransferLink(order) {
  if (!storeSettings.waAdmin) return "";

  const text =
    `Halo Admin SheikoShop, saya ingin mengirim bukti transfer.\n\n` +
    `Order ID: ${order.id}\n` +
    `Produk: ${order.productName || "-"}\n` +
    `Total: ${rupiah(order.total)}\n` +
    `Nama: ${order.customerName || "-"}\n` +
    `Email: ${order.userEmail || "-"}\n\n` +
    `Saya lampirkan bukti transfer di chat ini.`;

  return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(text);
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
          const proofLink = makeProofTransferLink(order);

          html += `
            <div class="orderDetailCard">
              <div class="orderHeader">
                <h3>Detail Pesanan</h3>
                <span class="orderBadge ${isPaid ? "success" : "warning"}">
                  ${isPaid ? "Selesai" : "Menunggu Pembayaran"}
                </span>
              </div>

              <div class="orderIdBox">
                <small>Order ID</small>
                <b>#${safeText(order.id)}</b>
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
                    <small>Silakan transfer sesuai metode pembayaran</small>
                  </div>

                  <div class="step ${isPaid ? "active" : ""}">
                    <b>Pembayaran Diverifikasi</b>
                    <small>${isPaid ? "Pembayaran sudah dikonfirmasi admin" : "Menunggu konfirmasi admin"}</small>
                  </div>

                  <div class="step ${isPaid ? "active" : ""}">
                    <b>Akun Premium Terkirim</b>
                    <small>${isPaid ? "Akun sudah tersedia" : "Akun akan muncul setelah konfirmasi"}</small>
                  </div>
                </div>

                ${
                  !isPaid && proofLink
                    ? `
                      <a class="btn green" target="_blank" href="${proofLink}">
                        📸 Kirim Bukti Transfer
                      </a>
                    `
                    : ""
                }
              </div>

              <div class="orderSection">
                <h4>Informasi Produk</h4>

                <div class="productInfo">
                  <div class="miniIcon">${safeText((order.productName || "P").charAt(0))}</div>
                  <div>
                    <b>${safeText(order.productName || "-")}</b>
                    <p>${rupiah(order.total)}</p>
                  </div>
                </div>
              </div>

              <div class="orderSection">
                <h4>Metode Pembayaran</h4>
                <p class="muted">
                  ${safeText(order.paymentName || "Hubungi Admin")}
                  ${order.paymentType ? " - " + safeText(order.paymentType) : ""}
                </p>
                ${
                  order.paymentAccountNumber
                    ? `<p><b>${safeText(order.paymentAccountNumber)}</b><br><span class="muted">${safeText(order.paymentAccountName || "")}</span></p>`
                    : ""
                }
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
                        <button class="btn" onclick="copyText(${jsString(order.accountPassword || "")})">Salin</button>
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

              ${
                isPaid
                  ? `
                    <div class="orderSection">
                      <div class="reviewActionBox">
                        <h4>Bagaimana pengalaman kamu?</h4>
                        <p class="muted">Berikan rating agar pembeli lain semakin yakin.</p>
                        ${
                          order.reviewSubmitted
                            ? `<button class="btn ghost" disabled>✅ Testimoni Sudah Dikirim</button>`
                            : `<button class="btn" onclick="showReviewForm(${jsString(order.id)}, ${jsString(order.productName || "")})">⭐ Beri Rating & Testimoni</button>`
                        }
                      </div>
                    </div>
                  `
                  : ""
              }
            </div>
          `;
        });
      }

      html += `<button class="btn ghost" onclick="closeModal()">Tutup</button>`;
      openModal(html);
    })
    .catch(e => alert(e.message));
}

function showReviewForm(orderId, productName) {
  if (!requireLogin()) return;

  openModal(`
    <h2>Rating & Testimoni</h2>
    <p class="muted">Review kamu akan tampil di halaman testimoni SheikoShop.</p>

    <div class="paymentBox">
      <b>${safeText(productName)}</b>
      <p class="muted">Order ID: ${safeText(orderId)}</p>
    </div>

    <div class="field">
      <label>Rating</label>
      <select id="reviewRating">
        <option value="5">⭐⭐⭐⭐⭐ - Sangat Puas</option>
        <option value="4">⭐⭐⭐⭐ - Puas</option>
        <option value="3">⭐⭐⭐ - Cukup</option>
        <option value="2">⭐⭐ - Kurang</option>
        <option value="1">⭐ - Tidak Puas</option>
      </select>
    </div>

    <div class="field">
      <label>Testimoni</label>
      <textarea id="reviewText" placeholder="Tulis pengalaman kamu setelah membeli..."></textarea>
    </div>

    <button class="btn" onclick="submitReview(${jsString(orderId)}, ${jsString(productName)})">
      Kirim Testimoni
    </button>

    <button class="btn ghost" onclick="showMyOrders()">Kembali</button>
  `);
}

function submitReview(orderId, productName) {
  if (!requireLogin()) return;

  const rating = Number(document.getElementById("reviewRating").value);
  const review = document.getElementById("reviewText").value.trim();

  if (!review) return alert("Testimoni wajib diisi");

  db.collection("orders").doc(orderId).get()
    .then(doc => {
      if (!doc.exists) throw new Error("Pesanan tidak ditemukan");

      const order = doc.data();

      if (order.userId !== currentUser.uid) {
        throw new Error("Kamu tidak memiliki akses ke pesanan ini");
      }

      if (!(order.status === "paid" || order.status === "done")) {
        throw new Error("Testimoni hanya bisa diberikan setelah pesanan selesai");
      }

      if (order.reviewSubmitted) {
        throw new Error("Testimoni untuk pesanan ini sudah dikirim");
      }

      return db.collection("testimonials").add({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        orderId,
        productName,
        rating,
        review,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      return db.collection("orders").doc(orderId).update({
        reviewSubmitted: true,
        reviewRating: rating,
        reviewText: review,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Terima kasih. Testimoni berhasil dikirim.");
      showMyOrders();
    })
    .catch(e => alert(e.message));
}

function loadTestimonials() {
  const wrap = document.getElementById("testimonialList");
  if (!wrap) return;

  db.collection("testimonials")
    .where("active", "==", true)
    .limit(6)
    .onSnapshot(snapshot => {
      wrap.innerHTML = "";

      if (snapshot.empty) {
        wrap.innerHTML = `
          <div class="testimonialCard">
            <div class="testimonialStars">⭐⭐⭐⭐⭐</div>
            <p>Belum ada testimoni. Jadilah pembeli pertama yang memberi rating.</p>
            <b>SheikoShop</b>
          </div>
        `;
        return;
      }

      const testimonials = [];

      snapshot.forEach(doc => {
        testimonials.push({
          id: doc.id,
          ...doc.data()
        });
      });

      testimonials.sort((a, b) => {
        const da = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
        const dbb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
        return dbb - da;
      });

      testimonials.forEach(t => {
        const rating = Math.max(1, Math.min(5, Number(t.rating || 5)));

        wrap.innerHTML += `
          <div class="testimonialCard">
            <div class="testimonialStars">${"⭐".repeat(rating)}</div>
            <p>${safeText(t.review || "")}</p>
            <br>
            <b>${safeText(t.productName || "Produk Premium")}</b>
            <p class="muted">${safeText(t.userEmail || "Pembeli SheikoShop")}</p>
          </div>
        `;
      });
    });
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
  loadTestimonials();
  updateAuthMenu();

  const searchInput = document.getElementById("searchInput");
  const heroSearchInput = document.getElementById("heroSearchInput");

  if (searchInput) {
    searchInput.addEventListener("input", e => searchProducts(e.target.value));
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener("input", e => searchProducts(e.target.value));
  }

  const modal = document.getElementById("modal");

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target.id === "modal") closeModal();
    });
  }
});
