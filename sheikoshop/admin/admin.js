firebase.initializeApp(window.firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "khusnadwi7@gmail.com";

function rupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

function show(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.getElementById("pageTitle").innerText =
    id === "produk" ? "Produk" :
    id === "pesanan" ? "Pesanan" :
    id === "payment" ? "Payment" :
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
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("adminApp").style.display = "none";
  }
});

/* PRODUK */

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
    rows.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      const img = p.imageUrl
        ? `<img src="${p.imageUrl}" style="width:55px;height:55px;object-fit:cover;border-radius:12px">`
        : `<div style="width:55px;height:55px;border-radius:12px;background:#111827;display:flex;align-items:center;justify-content:center">📦</div>`;

      rows.innerHTML += `
        <tr>
          <td>${img}</td>
          <td>${p.name || "-"}</td>
          <td>${p.category || "-"}</td>
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
      ? `<img src="${p.imageUrl}" style="width:130px;height:130px;object-fit:cover;border-radius:16px">`
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

/* PAYMENT */

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

  action.then(() => alert("Payment berhasil disimpan"))
    .catch(e => alert(e.message));
}

function loadPayments() {
  db.collection("payments").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const rows = document.getElementById("paymentRows");
    rows.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      rows.innerHTML += `
        <tr>
          <td>${p.name || "-"}</td>
          <td>${p.type || "-"}</td>
          <td>${p.accountNumber || "-"}</td>
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

/* SETTINGS */

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

/* ORDERS */

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
      revenue += Number(o.total || 0);

      recent.innerHTML += `
        <tr>
          <td>${o.customerName || "-"}</td>
          <td>${o.productName || "-"}</td>
          <td>${rupiah(o.total)}</td>
          <td>${o.status || "pending"}</td>
        </tr>
      `;

      manage.innerHTML += `
        <div class="card" style="margin-bottom:12px">
          <b>${o.customerName || "Customer"}</b><br>
          Produk: ${o.productName || "-"}<br>
          Total: ${rupiah(o.total)}<br>
          Status: ${o.status || "pending"}<br><br>
          <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','pending')">Pending</button>
          <button class="btn ghost" onclick="updateOrderStatus('${doc.id}','paid')">Paid</button>
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
  });
}

function deleteOrder(id) {
  if (!confirm("Yakin hapus pesanan?")) return;
  db.collection("orders").doc(id).delete();
}
