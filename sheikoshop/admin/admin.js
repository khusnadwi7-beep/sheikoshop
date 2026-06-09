firebase.initializeApp(window.firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "khusnadwi7@gmail.com";

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

/* ---------- AUTH ---------- */

function show(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".menu a").forEach(a => a.classList.remove("active"));
  document.getElementById("pageTitle").innerText =
    id === "produk" ? "Produk" :
    id === "pesanan" ? "Pesanan" :
    id === "payment" ? "Payment" :
    id === "stok" ? "Stok Akun" :
    id === "setting" ? "Pengaturan Toko" : "Dashboard";
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
    .catch(e => err.innerText = e.message);
}

function logoutAdmin() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("adminApp").style.display = "flex";

    loadProducts();
    loadPayments();
    loadOrders();
    loadSettings();
    loadAccountStock();
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("adminApp").style.display = "none";
  }
});

/* ---------- PRODUK ---------- */

function resetProductForm() {
  document.getElementById("productId").value = "";
  document.getElementById("pname").value = "";
  document.getElementById("pprice").value = "";
  document.getElementById("pcat").value = "";
  document.getElementById("pimageurl").value = "";
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
    description: document.getElementById("pdesc").value.trim(),
    active: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!data.name) return alert("Nama produk wajib diisi");
  if (!data.price) return alert("Harga produk wajib diisi");

  const action = id
    ? db.collection("products").doc(id).update(data)
    : db.collection("products").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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

    rows.innerHTML = "";
    if (stockProduct) stockProduct.innerHTML = `<option value="">-- Pilih Produk --</option>`;

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
        ? `<img src="${safeText(p.imageUrl)}" style="width:55px;height:55px;object-fit:cover;border-radius:12px">`
        : `<div style="width:55px;height:55px;border-radius:12px;background:#111827;display:flex;align-items:center;justify-content:center">📦</div>`;

      rows.innerHTML += `
        <tr>
          <td>${img}</td>
          <td>${safeText(p.name || "-")}</td>
          <td>${safeText(p.category || "-")}</td>
          <td>${rupiah(p.price)}</td>
          <td>
            <button class="btn ghost" onclick="editProduct('${doc.id}')">Edit</button>
            <button class="btn ghost" onclick="deleteProduct('${doc.id}')">Hapus</button>
          </td>
        </tr>
      `;
    });

    document.getElementById("totalProduk").innerText = snapshot.size;
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
    document.getElementById("pdesc").value = p.description || "";
    document.getElementById("imagePreview").innerHTML = p.imageUrl
      ? `<img src="${safeText(p.imageUrl)}" style="width:130px;height:130px;object-fit:cover;border-radius:16px">`
      : "";
    show("produk");
  });
}

function deleteProduct(id) {
  if (!confirm("Yakin hapus produk ini?")) return;
  db.collection("products").doc(id).delete();
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
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Stok akun berhasil ditambahkan");
    document.getElementById("stockEmail").value = "";
    document.getElementById("stockPassword").value = "";
  }).catch(e => alert(e.message));
}

function loadAccountStock() {
  db.collection("account_stock")
    .where("status", "==", "available")
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
            <td>${safeText(s.status || "-")}</td>
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
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function markStockSold(id) {
  db.collection("account_stock").doc(id).update({
    status: "sold",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function deleteAccountStock(id) {
  if (!confirm("Yakin hapus stok akun ini?")) return;
  db.collection("account_stock").doc(id).delete();
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
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!data.name) return alert("Nama payment wajib diisi");

  const action = id
    ? db.collection("payments").doc(id).update(data)
    : db.collection("payments").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    rows.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      rows.innerHTML += `
        <tr>
          <td>${safeText(p.name || "-")}</td>
          <td>${safeText(p.type || "-")}</td>
          <td>${safeText(p.accountNumber || "-")}</td>
          <td><button class="btn ghost" onclick="deletePayment('${doc.id}')">Hapus</button></td>
        </tr>
      `;
    });
  });
}

function deletePayment(id) {
  if (!confirm("Yakin hapus payment ini?")) return;
  db.collection("payments").doc(id).delete();
}

/* ---------- SETTINGS ---------- */

function saveSettings() {
  const data = {
    storeName: document.getElementById("storeName").value.trim(),
    logoText: document.getElementById("logoText").value.trim(),
    heroTitle: document.getElementById("heroTitle").value.trim(),
    heroDescription: document.getElementById("heroDesc").value.trim(),
    waAdmin: document.getElementById("waAdmin").value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("store_settings").doc("main").set(data, { merge: true })
    .then(() => alert("Pengaturan berhasil disimpan"))
    .catch(e => alert(e.message));
}

function loadSettings() {
  db.collection("store_settings").doc("main").get().then(doc => {
    if (!doc.exists) return;

    const s = doc.data();
    document.getElementById("storeName").value = s.storeName || "";
    document.getElementById("logoText").value = s.logoText || "";
    document.getElementById("heroTitle").value = s.heroTitle || "";
    document.getElementById("heroDesc").value = s.heroDescription || "";
    document.getElementById("waAdmin").value = s.waAdmin || "";
  });
}

/* ---------- ORDERS ---------- */

function loadOrders() {
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const manage = document.getElementById("manageOrders");
    const recent = document.getElementById("orderRows");

    manage.innerHTML = "";
    recent.innerHTML = "";

    let total = 0;
    let pending = 0;
    let revenue = 0;

    snapshot.forEach(doc => {
      const o = doc.data();
      total++;

      if ((o.status || "pending") === "pending") pending++;

      if ((o.status || "") === "paid" || (o.status || "") === "done") {
        revenue += Number(o.total || 0);
      }

      recent.innerHTML += `
        <tr>
          <td>${safeText(o.customerName || "-")}</td>
          <td>${safeText(o.productName || "-")}</td>
          <td>${rupiah(o.total)}</td>
          <td>${safeText(o.status || "pending")}</td>
        </tr>
      `;

      manage.innerHTML += `
        <div class="card" style="margin-bottom:12px">
          <b>${safeText(o.customerName || "Customer")}</b><br>
          Email User: ${safeText(o.userEmail || "-")}<br>
          WA: ${safeText(o.customerWa || "-")}<br>
          Produk: ${safeText(o.productName || "-")}<br>
          Total: ${rupiah(o.total)}<br>
          Payment: ${safeText(o.paymentName || "-")}<br>
          Status: ${safeText(o.status || "pending")}<br>

          ${
            o.accountEmail
              ? `<br><b>Akun Dikirim:</b><br>Email: ${safeText(o.accountEmail)}<br>Password: ${safeText(o.accountPassword || "-")}<br>`
              : `<br><b>Akun Dikirim:</b> Belum ada<br>`
          }

          <br>
          <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','pending')">Pending</button>
          <button class="btn ghost" onclick="confirmOrderPaid('${doc.id}')">Paid + Kirim Akun</button>
          <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','done')">Done</button>
          <button class="btn ghost" onclick="deleteOrder('${doc.id}')">Hapus</button>
        </div>
      `;
    });

    document.getElementById("totalOrder").innerText = total;
    document.getElementById("pending").innerText = pending;
    document.getElementById("revenue").innerText = rupiah(revenue);
  });
}

function updateOrderStatus(id, status) {
  db.collection("orders").doc(id).update({
    status,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(e => alert(e.message));
}

/* ---------- KONFIRMASI PEMBAYARAN & KIRIM AKUN ---------- */

function confirmOrderPaid(orderId) {
  const orderRef = db.collection("orders").doc(orderId);

  db.runTransaction(async transaction => {
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) throw new Error("Order tidak ditemukan");

    const order = orderDoc.data();

    if (order.accountStockId) {
      transaction.update(orderRef, {
        status: "paid",
        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return "Order sudah punya akun. Status diubah ke paid.";
    }

    const stockQuery = db.collection("account_stock")
      .where("productId", "==", order.productId)
      .where("status", "==", "available")
      .limit(1);

    const stockSnapshot = await transaction.get(stockQuery);

    if (stockSnapshot.empty) throw new Error("Stok akun untuk produk ini habis");

    const stockDoc = stockSnapshot.docs[0];
    const stockRef = stockDoc.ref;
    const stock = stockDoc.data();

    transaction.update(stockRef, {
      status: "sold",
      orderId,
      soldAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    transaction.update(orderRef, {
      status: "paid",
      accountStockId: stockDoc.id,
      accountEmail: stock.email || "",
      accountPassword: stock.password || "",
      paidAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return "Pembayaran dikonfirmasi dan akun berhasil dikirim ke order.";
  }).then(msg => alert(msg))
    .catch(e => alert(e.message));
}

function deleteOrder(id) {
  if (!confirm("Yakin hapus pesanan?")) return;
  db.collection("orders").doc(id).delete();
}
