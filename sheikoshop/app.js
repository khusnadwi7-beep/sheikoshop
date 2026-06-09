firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();

let allProducts = [];
let allPayments = [];
let storeSettings = {};

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
    const image = p.imageUrl
      ? `<img src="${safeText(p.imageUrl)}" alt="${safeText(p.name)}" style="width:100%;height:160px;object-fit:cover;border-radius:18px;margin-bottom:14px;">`
      : `<div style="width:100%;height:160px;border-radius:18px;margin-bottom:14px;background:#111827;display:flex;align-items:center;justify-content:center;font-size:42px;">📦</div>`;

    wrap.innerHTML += `
      <div class="productCard">
        ${image}
        <div class="muted">${safeText(p.category || "Produk")}</div>
        <h3>${safeText(p.name)}</h3>
        <p>${safeText(p.description || "")}</p>
        <div class="price">${rupiah(p.price)}</div>
        <button class="btn" onclick="orderProduct('${p.id}')">Beli Sekarang</button>
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
      <button class="tab ${cat === "Semua" ? "active" : ""}" onclick="filterCategory('${cat}', this)">
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

function orderProduct(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  const modal = document.getElementById("modal");
  const box = document.getElementById("modalContent");

  box.innerHTML = `
    <h2>${safeText(p.name)}</h2>
    <p>${safeText(p.description || "")}</p>
    <h3>${rupiah(p.price)}</h3>

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
  `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function submitOrder(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  const customerName = document.getElementById("buyerName").value.trim();
  const customerWa = document.getElementById("buyerWa").value.trim();

  const paymentSelect = document.getElementById("paymentSelect");
  const paymentId = paymentSelect ? paymentSelect.value : "";
  const payment = allPayments.find(item => item.id === paymentId);

  if (!customerName) return alert("Nama wajib diisi");
  if (!customerWa) return alert("Nomor WhatsApp wajib diisi");
  if (allPayments.length && !paymentId) return alert("Silakan pilih metode pembayaran");

  db.collection("orders").add({
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
  }).then(() => {
    alert("Pesanan berhasil dikirim");
    closeModal();

    if (storeSettings.waAdmin) {
      const paymentText = payment
        ? `%0AMetode Bayar: ${payment.name}%0ATipe: ${payment.type || "-"}%0ANama Rekening: ${payment.accountName || "-"}%0ANomor: ${payment.accountNumber || "-"}`
        : `%0AMetode Bayar: Hubungi Admin`;

      const text =
        `Halo admin Sheikoshop, saya ingin order:%0A%0A` +
        `Produk: ${p.name}%0A` +
        `Harga: ${rupiah(p.price)}%0A` +
        `Nama: ${customerName}%0A` +
        `WA: ${customerWa}` +
        paymentText;

      window.open(
        "https://wa.me/" + storeSettings.waAdmin.replace(/\D/g, "") + "?text=" + text,
        "_blank"
      );
    }
  }).catch(e => alert(e.message));
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadProducts();
  loadPayments();

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
