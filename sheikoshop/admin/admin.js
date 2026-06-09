const db = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const fmt = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

let products = [];
let orders = [];
let payments = [];
let settings = null;

function show(id) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.add("hidden");
  });

  const page = document.querySelector("#" + id);
  if (page) page.classList.remove("hidden");

  document.querySelectorAll(".menu a").forEach((a) => {
    a.classList.remove("active");
  });

  const menu = Array.from(document.querySelectorAll(".menu a")).find((a) => {
    return a.getAttribute("onclick") && a.getAttribute("onclick").includes("'" + id + "'");
  });

  if (menu) {
    menu.classList.add("active");
    const title = document.querySelector("#pageTitle");
    if (title) title.textContent = menu.textContent.trim();
  }
}

async function loadAll() {
  await loadProducts();
  await loadOrders();
  await loadPayments();
  await loadSettings();
  renderDashboard();
}

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Gagal load produk: " + error.message);
    return;
  }

  products = data || [];
  renderProducts();
  renderDashboard();
}

function renderProducts() {
  const el = document.querySelector("#productRows");
  if (!el) return;

  if (!products.length) {
    el.innerHTML = `<tr><td colspan="4">Belum ada produk</td></tr>`;
    return;
  }

  el.innerHTML = products.map((p) => `
    <tr>
      <td>${p.name || "-"}</td>
      <td>${p.category || "-"}</td>
      <td>${fmt(p.price)}</td>
      <td>
        <button class="btn ghost" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn ghost" onclick="deleteProduct('${p.id}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

async function saveProduct() {
  const payload = {
    name: document.querySelector("#pname").value.trim(),
    price: Number(document.querySelector("#pprice").value || 0),
    category: document.querySelector("#pcat").value.trim(),
    icon: document.querySelector("#picon").value.trim() || "APP",
    description: document.querySelector("#pdesc").value.trim(),
    short_text: "Akun Premium • Garansi",
    rating: 5,
    sold: 0,
    is_active: true
  };

  if (!payload.name || !payload.price) {
    alert("Nama dan harga wajib diisi.");
    return;
  }

  const id = document.querySelector("#productId").value;

  const result = id
    ? await db.from("products").update(payload).eq("id", id)
    : await db.from("products").insert(payload);

  if (result.error) {
    alert("Gagal simpan produk: " + result.error.message);
    return;
  }

  resetProductForm();
  await loadProducts();
  alert("Produk berhasil disimpan.");
}

function editProduct(id) {
  const p = products.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.querySelector("#productId").value = p.id;
  document.querySelector("#pname").value = p.name || "";
  document.querySelector("#pprice").value = p.price || "";
  document.querySelector("#pcat").value = p.category || "";
  document.querySelector("#picon").value = p.icon || "";
  document.querySelector("#pdesc").value = p.description || "";

  show("produk");
}

function resetProductForm() {
  document.querySelector("#productId").value = "";
  document.querySelector("#pname").value = "";
  document.querySelector("#pprice").value = "";
  document.querySelector("#pcat").value = "";
  document.querySelector("#picon").value = "";
  document.querySelector("#pdesc").value = "";
}

async function deleteProduct(id) {
  if (!confirm("Hapus produk ini?")) return;

  const { error } = await db.from("products").delete().eq("id", id);

  if (error) {
    alert("Gagal hapus produk: " + error.message);
    return;
  }

  await loadProducts();
}

async function loadOrders() {
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Gagal load order:", error.message);
    orders = [];
    return;
  }

  orders = data || [];
  renderOrders();
  renderDashboard();
}

function renderOrders() {
  const manage = document.querySelector("#manageOrders");
  const rows = document.querySelector("#orderRows");

  if (rows) {
    rows.innerHTML = orders.length
      ? orders.slice(0, 5).map((o) => `
        <tr>
          <td>${o.invoice || "-"}</td>
          <td>${o.product_name || "-"}</td>
          <td>${o.status || "-"}</td>
          <td>${fmt(o.price)}</td>
        </tr>
      `).join("")
      : `<tr><td>Belum ada order</td></tr>`;
  }

  if (manage) {
    manage.innerHTML = orders.length
      ? orders.map((o) => `
        <div class="card" style="margin-bottom:14px">
          <h3>${o.invoice || "-"}</h3>
          <p><b>Produk:</b> ${o.product_name || "-"}</p>
          <p><b>Pembeli:</b> ${o.buyer_name || "-"}</p>
          <p><b>Kontak:</b> ${o.buyer_contact || "-"}</p>
          <p><b>Total:</b> ${fmt(o.price)}</p>
          <p><b>Status:</b> ${o.status || "-"}</p>
          ${o.proof_url ? `<p><a class="btn ghost" href="${o.proof_url}" target="_blank">Lihat Bukti</a></p>` : ""}
          <button class="btn" onclick="updateOrder('${o.id}','Selesai')">Approve</button>
          <button class="btn ghost" onclick="updateOrder('${o.id}','Ditolak')">Reject</button>
        </div>
      `).join("")
      : `<div class="card">Belum ada pesanan.</div>`;
  }
}

async function updateOrder(id, status) {
  const { error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Gagal update order: " + error.message);
    return;
  }

  await loadOrders();
}

async function loadPayments() {
  const { data, error } = await db
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Gagal load payment:", error.message);
    payments = [];
    return;
  }

  payments = data || [];
  renderPayments();
}

function renderPayments() {
  const el = document.querySelector("#paymentRows");
  if (!el) return;

  if (!payments.length) {
    el.innerHTML = `<tr><td colspan="4">Belum ada payment.</td></tr>`;
    return;
  }

  el.innerHTML = payments.map((p) => `
    <tr>
      <td>${p.name || "-"}</td>
      <td>${p.type || "-"}</td>
      <td>${p.account_number || "-"}</td>
      <td>
        <button class="btn ghost" onclick="editPayment('${p.id}')">Edit</button>
        <button class="btn ghost" onclick="deletePayment('${p.id}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

async function savePayment() {
  const id = document.querySelector("#paymentId").value;

  const payload = {
    name: document.querySelector("#payName").value.trim(),
    type: document.querySelector("#payType").value,
    account_name: document.querySelector("#payAccountName").value.trim(),
    account_number: document.querySelector("#payAccountNumber").value.trim(),
    description: document.querySelector("#payDesc").value.trim(),
    qris_url: document.querySelector("#payQris").value.trim(),
    is_active: true
  };

  if (!payload.name) {
    alert("Nama payment wajib diisi.");
    return;
  }

  const result = id
    ? await db.from("payments").update(payload).eq("id", id)
    : await db.from("payments").insert(payload);

  if (result.error) {
    alert("Gagal simpan payment: " + result.error.message);
    return;
  }

  document.querySelector("#paymentId").value = "";
  document.querySelector("#payName").value = "";
  document.querySelector("#payAccountName").value = "";
  document.querySelector("#payAccountNumber").value = "";
  document.querySelector("#payDesc").value = "";
  document.querySelector("#payQris").value = "";

  await loadPayments();
  alert("Payment berhasil disimpan.");
}

function editPayment(id) {
  const p = payments.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.querySelector("#paymentId").value = p.id;
  document.querySelector("#payName").value = p.name || "";
  document.querySelector("#payType").value = p.type || "QRIS";
  document.querySelector("#payAccountName").value = p.account_name || "";
  document.querySelector("#payAccountNumber").value = p.account_number || "";
  document.querySelector("#payDesc").value = p.description || "";
  document.querySelector("#payQris").value = p.qris_url || "";

  show("payment");
}

async function deletePayment(id) {
  if (!confirm("Hapus payment ini?")) return;

  const { error } = await db.from("payments").delete().eq("id", id);

  if (error) {
    alert("Gagal hapus payment: " + error.message);
    return;
  }

  await loadPayments();
}

async function loadSettings() {
  const { data, error } = await db
    .from("settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Gagal load settings:", error.message);
    return;
  }

  settings = data || null;

  if (settings) {
    document.querySelector("#storeName").value = settings.store_name || "SHEIKOSHOP";
    document.querySelector("#logoText").value = settings.logo_text || "S";
    document.querySelector("#heroTitle").value = settings.hero_title || "";
    document.querySelector("#heroDesc").value = settings.hero_description || "";
    document.querySelector("#waAdmin").value = settings.whatsapp || "";
  }
}

async function saveSettings() {
  const payload = {
    store_name: document.querySelector("#storeName").value.trim(),
    logo_text: document.querySelector("#logoText").value.trim() || "S",
    hero_title: document.querySelector("#heroTitle").value.trim(),
    hero_description: document.querySelector("#heroDesc").value.trim(),
    whatsapp: document.querySelector("#waAdmin").value.trim()
  };

  const result = settings?.id
    ? await db.from("settings").update(payload).eq("id", settings.id)
    : await db.from("settings").insert(payload);

  if (result.error) {
    alert("Gagal simpan pengaturan: " + result.error.message);
    return;
  }

  await loadSettings();
  alert("Pengaturan toko berhasil disimpan.");
}

function renderDashboard() {
  const totalProduk = document.querySelector("#totalProduk");
  const totalOrder = document.querySelector("#totalOrder");
  const pending = document.querySelector("#pending");
  const revenue = document.querySelector("#revenue");

  if (totalProduk) totalProduk.textContent = products.length;
  if (totalOrder) totalOrder.textContent = orders.length;
  if (pending) {
    pending.textContent = orders.filter((o) => o.status === "Menunggu Verifikasi").length;
  }

  if (revenue) {
    const total = orders
      .filter((o) => o.status === "Selesai")
      .reduce((sum, o) => sum + Number(o.price || 0), 0);

    revenue.textContent = fmt(total);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAll();
});
