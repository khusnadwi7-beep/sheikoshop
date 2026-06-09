firebase.initializeApp(window.firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "khusnadwi7@gmail.com";
const DEFAULT_LOGO_URL = "https://i.ibb.co.com/vChVRRVP/logo-full-png.png";

function rupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

function safeText(text) {
  return String(text || "").replace(/[<>&"]/g, c => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;"
  })[c]);
}

function statusPill(status) {
  const s = String(status || "pending").toLowerCase();

  if (s === "paid" || s === "done") {
    return `<span class="pill ok">${safeText(s)}</span>`;
  }

  if (s === "cancel" || s === "cancelled") {
    return `<span class="pill bad">${safeText(s)}</span>`;
  }

  return `<span class="pill">${safeText(s)}</span>`;
}

function setActiveMenu(id) {
  document.querySelectorAll(".menu a").forEach(a => {
    a.classList.remove("active");

    if (a.dataset.page === id) {
      a.classList.add("active");
    }
  });
}

/* ---------- AUTH ---------- */

function show(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");

  setActiveMenu(id);

  document.getElementById("pageTitle").innerText =
    id === "produk" ? "Produk" :
    id === "pesanan" ? "Pesanan" :
    id === "payment" ? "Payment" :
    id === "stok" ? "Stok Akun" :
    id === "review" ? "Review & Testimoni" :
    id === "setting" ? "Pengaturan" : "Dashboard";
}

function loginAdmin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");

  err.innerText = "Memproses login...";

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      if (res.user.email !== ADMIN_EMAIL) {
        auth.signOut();
        err.innerText = "Email ini bukan admin.";
      } else {
        err.innerText = "";
      }
    })
    .catch(e => {
      err.innerText = e.message;
    });
}

function logoutAdmin() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("adminApp").style.display = "grid";

    loadProducts();
    loadPayments();
    loadOrders();
    loadSettings();
    loadAccountStock();
    loadReviews();
    show("dashboard");
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("adminApp").style.display = "none";
  }
});

/* ---------- PRODUK ---------- */

function previewProductImage() {
  const url = document.getElementById("pimageurl").value.trim();
  const preview = document.getElementById("imagePreview");

  if (!preview) return;

  preview.innerHTML = url
    ? `<img src="${safeText(url)}" alt="Preview Produk">`
    : "";
}

function resetProductForm() {
  document.getElementById("productId").value = "";
  document.getElementById("pname").value = "";
  document.getElementById("pprice").value = "";
  document.getElementById("pcat").value = "";
  document.getElementById("pimageurl").value = "";
  document.getElementById("pkeywords").value = "";
  document.getElementById("pdesc").value = "";
  document.getElementById("imagePreview").innerHTML = "";
}

function saveProduct() {
  const id = document.getElementById("productId").value;

  const data = {
    name: document.getElementById("pname").value.trim(),
    price: Number(document.getElementById("pprice").value || 0),
    category: document.getElementById("pcat").value.trim(),
    imageUrl: document.getElementById("pimageurl").value.trim(),
    keywords: document.getElementById("pkeywords").value.trim(),
    description: document.getElementById("pdesc").value.trim(),
    active: true,
    updatedAt: new Date()
  };

  if (!data.name) return alert("Nama produk wajib diisi");
  if (!data.price) return alert("Harga produk wajib diisi");

  const action = id
    ? db.collection("products").doc(id).update(data)
    : db.collection("products").add({
        ...data,
        createdAt: new Date()
      });

  action
    .then(() => {
      alert(id ? "Produk berhasil diupdate" : "Produk berhasil ditambahkan");
      resetProductForm();
    })
    .catch(e => alert(e.message));
}

function loadProducts() {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const rows = document.getElementById("productRows");
    const stockProduct = document.getElementById("stockProduct");

    if (!rows) return;

    rows.innerHTML = "";

    if (stockProduct) {
      stockProduct.innerHTML = `<option value="">-- Pilih Produk --</option>`;
    }

    snapshot.forEach(doc => {
      const p = doc.data();

      if (stockProduct) {
        stockProduct.innerHTML += `
          <option value="${doc.id}" data-name="${safeText(p.name || "")}">
            ${safeText(p.name || "-")}
          </option>
        `;
      }

      const img = p.imageUrl
        ? `<img src="${safeText(p.imageUrl)}" style="width:56px;height:56px;object-fit:cover;border-radius:14px;border:1px solid #253047">`
        : `<div style="width:56px;height:56px;border-radius:14px;background:#111827;display:flex;align-items:center;justify-content:center">📦</div>`;

      rows.innerHTML += `
        <tr>
          <td>${img}</td>
          <td>
            <b>${safeText(p.name || "-")}</b>
            <br>
            <span class="muted">${safeText(p.description || "").slice(0, 55)}</span>
          </td>
          <td>${safeText(p.category || "-")}</td>
          <td>${rupiah(p.price)}</td>
          <td>
            <button class="btn ghost" onclick="editProduct('${doc.id}')">Edit</button>
            <button class="btn ghost" onclick="deleteProduct('${doc.id}')">Hapus</button>
          </td>
        </tr>
      `;
    });

    const totalProduk = document.getElementById("totalProduk");
    if (totalProduk) totalProduk.innerText = snapshot.size;
  });
}

function editProduct(id) {
  db.collection("products").doc(id).get().then(doc => {
    if (!doc.exists) return;

    const p = doc.data();

    document.getElementById("productId").value = doc.id;
    document.getElementById("pname").value = p.name || "";
    document.getElementById("pprice").value = p.price || "";
    document.getElementById("pcat").value = p.category || "";
    document.getElementById("pimageurl").value = p.imageUrl || "";
    document.getElementById("pkeywords").value = p.keywords || p.keyword || p.tags || "";
    document.getElementById("pdesc").value = p.description || "";

    document.getElementById("imagePreview").innerHTML = p.imageUrl
      ? `<img src="${safeText(p.imageUrl)}" alt="Preview Produk">`
      : "";

    show("produk");
  });
}

function deleteProduct(id) {
  if (!confirm("Yakin hapus produk ini?")) return;

  db.collection("products").doc(id).delete()
    .then(() => alert("Produk berhasil dihapus"))
    .catch(e => alert(e.message));
}

/* ---------- STOK AKUN ---------- */

function saveAccountStock() {
  const productSelect = document.getElementById("stockProduct");
  const productId = productSelect.value;
  const productName = productSelect.options[productSelect.selectedIndex]
    ? productSelect.options[productSelect.selectedIndex].text
    : "";

  const email = document.getElementById("stockEmail").value.trim();
  const password = document.getElementById("stockPassword").value.trim();

  if (!productId) return alert("Pilih produk terlebih dahulu");
  if (!email) return alert("Email akun wajib diisi");
  if (!password) return alert("Password akun wajib diisi");

  db.collection("account_stock").add({
    productId,
    productName,
    email,
    password,
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  }).then(() => {
    alert("Stok akun berhasil ditambahkan");
    document.getElementById("stockEmail").value = "";
    document.getElementById("stockPassword").value = "";
  }).catch(e => alert(e.message));
}

function loadAccountStock() {
  db.collection("account_stock")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      const rows = document.getElementById("stockRows");
      if (!rows) return;

      rows.innerHTML = "";

      if (snapshot.empty) {
        rows.innerHTML = `<tr><td colspan="5">Belum ada stok akun.</td></tr>`;
        return;
      }

      snapshot.forEach(doc => {
        const s = doc.data();

        rows.innerHTML += `
          <tr>
            <td>${safeText(s.productName || "-")}</td>
            <td>${safeText(s.email || "-")}</td>
            <td>${safeText(s.password || "-")}</td>
            <td>${statusPill(s.status || "-")}</td>
            <td>
              <button class="btn ghost" onclick="markStockAvailable('${doc.id}')">Available</button>
              <button class="btn ghost" onclick="markStockSold('${doc.id}')">Sold</button>
              <button class="btn ghost" onclick="deleteAccountStock('${doc.id}')">Hapus</button>
            </td>
          </tr>
        `;
      });
    });
}

function markStockAvailable(id) {
  db.collection("account_stock").doc(id).update({
    status: "available",
    soldAt: firebase.firestore.FieldValue.delete(),
    orderId: firebase.firestore.FieldValue.delete(),
    updatedAt: new Date()
  }).catch(e => alert(e.message));
}

function markStockSold(id) {
  db.collection("account_stock").doc(id).update({
    status: "sold",
    updatedAt: new Date()
  }).catch(e => alert(e.message));
}

function deleteAccountStock(id) {
  if (!confirm("Yakin hapus stok akun ini?")) return;

  db.collection("account_stock").doc(id).delete()
    .then(() => alert("Stok akun berhasil dihapus"))
    .catch(e => alert(e.message));
}

/* ---------- PAYMENT ---------- */

function savePayment() {
  const id = document.getElementById("paymentId").value;

  const data = {
    name: document.getElementById("payName").value.trim(),
    type: document.getElementById("payType").value,
    accountName: document.getElementById("payAccountName").value.trim(),
    accountNumber: document.getElementById("payAccountNumber").value.trim(),
    description: document.getElementById("payDesc").value.trim(),
    qrisUrl: document.getElementById("payQris").value.trim(),
    active: true,
    updatedAt: new Date()
  };

  if (!data.name) return alert("Nama payment wajib diisi");

  const action = id
    ? db.collection("payments").doc(id).update(data)
    : db.collection("payments").add({
        ...data,
        createdAt: new Date()
      });

  action.then(() => {
    alert("Payment berhasil disimpan");
    document.getElementById("paymentId").value = "";
    document.getElementById("payName").value = "";
    document.getElementById("payAccountName").value = "";
    document.getElementById("payAccountNumber").value = "";
    document.getElementById("payDesc").value = "";
    document.getElementById("payQris").value = "";
  }).catch(e => alert(e.message));
}

function loadPayments() {
  db.collection("payments").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const rows = document.getElementById("paymentRows");
    if (!rows) return;

    rows.innerHTML = "";

    if (snapshot.empty) {
      rows.innerHTML = `<tr><td colspan="4">Belum ada payment.</td></tr>`;
      return;
    }

    snapshot.forEach(doc => {
      const p = doc.data();

      rows.innerHTML += `
        <tr>
          <td>${safeText(p.name || "-")}</td>
          <td>${safeText(p.type || "-")}</td>
          <td>${safeText(p.accountNumber || "-")}</td>
          <td>
            <button class="btn ghost" onclick="editPayment('${doc.id}')">Edit</button>
            <button class="btn ghost" onclick="deletePayment('${doc.id}')">Hapus</button>
          </td>
        </tr>
      `;
    });
  });
}

function editPayment(id) {
  db.collection("payments").doc(id).get().then(doc => {
    if (!doc.exists) return;

    const p = doc.data();

    document.getElementById("paymentId").value = doc.id;
    document.getElementById("payName").value = p.name || "";
    document.getElementById("payType").value = p.type || "QRIS";
    document.getElementById("payAccountName").value = p.accountName || "";
    document.getElementById("payAccountNumber").value = p.accountNumber || "";
    document.getElementById("payDesc").value = p.description || "";
    document.getElementById("payQris").value = p.qrisUrl || "";

    show("payment");
  });
}

function deletePayment(id) {
  if (!confirm("Yakin hapus payment ini?")) return;

  db.collection("payments").doc(id).delete()
    .then(() => alert("Payment berhasil dihapus"))
    .catch(e => alert(e.message));
}

/* ---------- SETTINGS ---------- */

function saveSettings() {
  const logoUrlInput = document.getElementById("logoUrl");

  const data = {
    storeName: document.getElementById("storeName").value.trim(),
    logoText: document.getElementById("logoText").value.trim(),
    logoUrl: logoUrlInput ? logoUrlInput.value.trim() : DEFAULT_LOGO_URL,
    heroTitle: document.getElementById("heroTitle").value.trim(),
    heroDescription: document.getElementById("heroDesc").value.trim(),
    waAdmin: document.getElementById("waAdmin").value.trim(),
    updatedAt: new Date()
  };

  db.collection("store_settings").doc("main").set(data, { merge: true })
    .then(() => alert("Pengaturan berhasil disimpan"))
    .catch(e => alert(e.message));
}

function loadSettings() {
  db.collection("store_settings").doc("main").get().then(doc => {
    const s = doc.exists ? doc.data() : {};

    document.getElementById("storeName").value = s.storeName || "SHEIKOSHOP";
    document.getElementById("logoText").value = s.logoText || "S";
    document.getElementById("heroTitle").value = s.heroTitle || "";
    document.getElementById("heroDesc").value = s.heroDescription || "";
    document.getElementById("waAdmin").value = s.waAdmin || "";

    const logoUrl = document.getElementById("logoUrl");
    if (logoUrl) {
      logoUrl.value = s.logoUrl || DEFAULT_LOGO_URL;
    }
  });
}

/* ---------- ORDERS ---------- */

function loadOrders() {
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const manage = document.getElementById("manageOrders");
    const recent = document.getElementById("orderRows");
    const topProducts = document.getElementById("topProducts");

    if (!manage || !recent) return;

    manage.innerHTML = "";
    recent.innerHTML = "";

    let total = 0;
    let pending = 0;
    let revenue = 0;
    const productMap = {};

    if (snapshot.empty) {
      recent.innerHTML = `<tr><td colspan="4">Belum ada pesanan.</td></tr>`;
      manage.innerHTML = `<p class="muted">Belum ada pesanan.</p>`;
    }

    snapshot.forEach(doc => {
      const o = doc.data();
      total++;

      const status = o.status || "pending";

      if (status === "pending") pending++;

      if (status === "paid" || status === "done") {
        revenue += Number(o.total || 0);
      }

      const pname = o.productName || "Produk";
      productMap[pname] = (productMap[pname] || 0) + 1;

      recent.innerHTML += `
        <tr>
          <td>
            <b>${safeText(o.customerName || "Customer")}</b>
            <br>
            <span class="muted">${safeText(o.userEmail || "-")}</span>
          </td>
          <td>${safeText(o.productName || "-")}</td>
          <td>${rupiah(o.total)}</td>
          <td>${statusPill(status)}</td>
        </tr>
      `;

      manage.innerHTML += `
        <div class="orderCard">
          <div class="orderCardTop">
            <div>
              <h3>${safeText(o.customerName || "Customer")}</h3>
              <span class="muted">#${safeText(doc.id)}</span>
            </div>
            ${statusPill(status)}
          </div>

          <div class="orderMeta">
            <div>Email User: <b>${safeText(o.userEmail || "-")}</b></div>
            <div>WhatsApp: <b>${safeText(o.customerWa || "-")}</b></div>
            <div>Produk: <b>${safeText(o.productName || "-")}</b></div>
            <div>Total: <b>${rupiah(o.total)}</b></div>
            <div>Payment: <b>${safeText(o.paymentName || "-")}</b></div>
            <div>
              Akun:
              ${
                o.accountEmail
                  ? `<b>${safeText(o.accountEmail)}</b> / <b>${safeText(o.accountPassword || "-")}</b>`
                  : `<span class="muted">Belum dikirim</span>`
              }
            </div>
          </div>

          <div class="orderActions">
            <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','pending')">Pending</button>
            <button class="btn green" onclick="confirmOrderPaid('${doc.id}')">Paid + Kirim Akun</button>
            <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','done')">Done</button>
            <button class="btn red" onclick="deleteOrder('${doc.id}')">Hapus</button>
          </div>
        </div>
      `;
    });

    document.getElementById("totalOrder").innerText = total;
    document.getElementById("pending").innerText = pending;
    document.getElementById("revenue").innerText = rupiah(revenue);

    if (topProducts) {
      const sorted = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (!sorted.length) {
        topProducts.innerHTML = `<p class="muted">Belum ada data.</p>`;
      } else {
        topProducts.innerHTML = sorted.map((item, index) => `
          <div class="topItem">
            <div>
              <b>${index + 1}. ${safeText(item[0])}</b>
              <br>
              <span>Terjual ${item[1]}</span>
            </div>
          </div>
        `).join("");
      }
    }
  });
}

function updateOrderStatus(id, status) {
  db.collection("orders").doc(id).update({
    status,
    updatedAt: new Date()
  }).catch(e => alert(e.message));
}

function confirmOrderPaid(orderId) {
  const orderRef = db.collection("orders").doc(orderId);

  orderRef.get().then(orderDoc => {
    if (!orderDoc.exists) {
      throw new Error("Order tidak ditemukan");
    }

    const order = orderDoc.data();

    if (order.accountStockId) {
      return orderRef.update({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date()
      }).then(() => "Order sudah punya akun. Status diubah ke paid.");
    }

    return db.collection("account_stock")
      .where("productId", "==", order.productId)
      .where("status", "==", "available")
      .limit(1)
      .get()
      .then(stockSnapshot => {
        if (stockSnapshot.empty) {
          throw new Error("Stok akun untuk produk ini habis");
        }

        const stockDoc = stockSnapshot.docs[0];
        const stock = stockDoc.data();

        const batch = db.batch();

        batch.update(stockDoc.ref, {
          status: "sold",
          orderId: orderId,
          soldAt: new Date(),
          updatedAt: new Date()
        });

        batch.update(orderRef, {
          status: "paid",
          accountStockId: stockDoc.id,
          accountEmail: stock.email || "",
          accountPassword: stock.password || "",
          paidAt: new Date(),
          updatedAt: new Date()
        });

        return batch.commit().then(() => {
          return "Pembayaran dikonfirmasi dan akun berhasil dikirim ke order.";
        });
      });
  }).then(msg => {
    alert(msg);
  }).catch(e => {
    alert(e.message);
  });
}

function deleteOrder(id) {
  if (!confirm("Yakin hapus pesanan?")) return;

  db.collection("orders").doc(id).delete()
    .then(() => alert("Pesanan berhasil dihapus"))
    .catch(e => alert(e.message));
}

/* ---------- REVIEWS ---------- */

function loadReviews() {
  const wrap = document.getElementById("reviewRows");
  if (!wrap) return;

  db.collection("testimonials")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      wrap.innerHTML = "";

      if (snapshot.empty) {
        wrap.innerHTML = `<p class="muted">Belum ada review.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const r = doc.data();
        const rating = Math.max(1, Math.min(5, Number(r.rating || 5)));

        wrap.innerHTML += `
          <div class="reviewCard">
            <div class="reviewStars">${"★".repeat(rating)}</div>
            <h3>${safeText(r.productName || "Produk")}</h3>
            <p>${safeText(r.review || "")}</p>
            <span class="muted">${safeText(r.userEmail || "-")}</span>

            <div class="orderActions">
              ${
                r.active === false
                  ? `<button class="btn green" onclick="setReviewActive('${doc.id}', true)">Tampilkan</button>`
                  : `<button class="btn ghost" onclick="setReviewActive('${doc.id}', false)">Sembunyikan</button>`
              }
              <button class="btn red" onclick="deleteReview('${doc.id}')">Hapus</button>
            </div>
          </div>
        `;
      });
    });
}

function setReviewActive(id, active) {
  db.collection("testimonials").doc(id).update({
    active,
    updatedAt: new Date()
  }).catch(e => alert(e.message));
}

function deleteReview(id) {
  if (!confirm("Yakin hapus review ini?")) return;

  db.collection("testimonials").doc(id).delete()
    .then(() => alert("Review berhasil dihapus"))
    .catch(e => alert(e.message));
}
