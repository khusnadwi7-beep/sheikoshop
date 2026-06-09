const db = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const fmt = n => "Rp" + Number(n || 0).toLocaleString("id-ID");

let products = [];
let orders = [];
let payments = [];
let settings = null;

function show(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.querySelector("#" + id).classList.remove("hidden");

  document.querySelectorAll(".menu a").forEach(a => a.classList.remove("active"));
  event.target.classList.add("active");

  document.querySelector("#pageTitle").textContent = event.target.textContent;
}

async function loadAll() {
  await loadProducts();
  await loadOrders();
  await loadPayments();
  await loadSettings();
  renderDashboard();
}

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return alert("Produk error: " + error.message);
  products = data || [];
  renderProducts();
}

function renderProducts() {
  document.querySelector("#productRows").innerHTML = products.map(p => `
    <tr>
      <td>${p.name}</td>
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
  const id = document.querySelector("#productId").value;

  const payload = {
    name: pname.value,
    price: Number(pprice.value || 0),
    category: pcat.value,
    icon: picon.value || "APP",
    description: pdesc.value,
    short_text: "Akun Premium • Garansi",
    rating: 5,
    sold: 0,
    is_active: true
  };

  let result;
  if (id) {
    result = await db.from("products").update(payload).eq("id", id);
  } else {
    result = await db.from("products").insert(payload);
  }

  if (result.error) return alert(result.error.message);

  resetProductForm();
  await loadProducts();
  alert("Produk berhasil disimpan.");
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  productId.value = p.id;
  pname.value = p.name || "";
  pprice.value = p.price || "";
  pcat.value = p.category || "";
  picon.value = p.icon || "";
  pdesc.value = p.description || "";
}

function resetProductForm() {
  productId.value = "";
  pname.value = "";
  pprice.value = "";
  pcat.value = "";
  picon.value = "";
  pdesc.value = "";
}

async function deleteProduct(id) {
  if (!confirm("Hapus produk ini?")) return;
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadProducts();
}

async function loadOrders() {
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return console.warn(error.message);
  orders = data || [];
  renderOrders();
}

function renderOrders() {
  document.querySelector("#manageOrders").innerHTML = orders.map(o => `
    <div class="card" style="margin-bottom:14px">
      <h3>${o.invoice}</h3>
      <p><b>Produk:</b> ${o.product_name}</p>
      <p><b>Pembeli:</b> ${o.buyer_name}</p>
      <p><b>Kontak:</b> ${o.buyer_contact}</p>
      <p><b>Total:</b> ${fmt(o.price)}</p>
      <p><b>Status:</b> ${o.status}</p>
      ${o.proof_url ? `<p><a class="btn ghost" href="${o.proof_url}" target="_blank">Lihat Bukti</a></p>` : ""}
      <button class="btn" onclick="updateOrder('${o.id}','Selesai')">Approve</button>
      <button class="btn ghost" onclick="updateOrder('${o.id}','Ditolak')">Reject</button>
    </div>
  `).join("");

  document.querySelector("#orderRows").innerHTML = orders.slice(0, 5).map(o => `
    <tr><td>${o.invoice}</td><td>${o.product_name}</td><td>${o.status}</td><td>${fmt(o.price)}</td></tr>
  `).join("");
}

async function updateOrder(id, status) {
  const { error } = await db.from("orders").update({ status }).eq("id", id);
  if (error) return alert(error.message);
  await loadOrders();
}

async function loadPayments() {
  const { data, error } = await db.from("payments").select("*").order("created_at", { ascending: false });
  if (error) return console.warn(error.message);
  payments = data || [];
  renderPayments();
}

function renderPayments() {
  document.querySelector("#paymentRows").innerHTML = payments.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.type}</td>
      <td>${p.account_number || "-"}</td>
      <td>
        <button class="btn ghost" onclick="editPayment('${p.id}')">Edit</button>
        <button class="btn ghost" onclick="deletePayment('${p.id}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

async function savePayment() {
  const id = paymentId.value;

  const payload = {
    name: payName.value,
    type: payType.value,
    account_name: payAccountName.value,
    account_number: payAccountNumber.value,
    description: payDesc.value,
    qris_url: payQris.value,
    is_active: true
  };

  let result;
  if (id) {
    result = await db.from("payments").update(payload).eq("id", id);
  } else {
    result = await db.from("payments").insert(payload);
  }

  if (result.error) return alert(result.error.message);

  paymentId.value = "";
  payName.value = "";
  payAccountName.value = "";
  payAccountNumber.value = "";
  payDesc.value = "";
  payQris.value = "";

  await loadPayments();
  alert("Payment berhasil disimpan.");
}

function editPayment(id) {
  const p = payments.find(x => x.id === id);
  paymentId.value = p.id;
  payName.value = p.name || "";
  payType.value = p.type || "QRIS";
  payAccountName.value = p.account_name || "";
  payAccountNumber.value = p.account_number || "";
  payDesc.value = p.description || "";
  payQris.value = p.qris_url || "";
}

async function deletePayment(id) {
  if (!confirm("Hapus payment ini?")) return;
  const { error } = await db.from("payments").delete().eq("id", id);
  if (error) return alert(error.message);
  await loadPayments();
}

async function loadSettings() {
  const { data } = await db.from("settings").select("*").limit(1).single();
  settings = data;

  if (settings) {
    storeName.value = settings.store_name || "SHEIKOSHOP";
    logoText.value = settings.logo_text || "S";
    heroTitle.value = settings.hero_title || "";
    heroDesc.value = settings.hero_description || "";
    waAdmin.value = settings.whatsapp || "";
  }
}

async function saveSettings() {
  const payload = {
    store_name: storeName.value,
    logo_text: logoText.value,
    hero_title: heroTitle.value,
    hero_description: heroDesc.value,
    whatsapp: waAdmin.value
  };

  let result;

  if (settings?.id) {
    result = await db.from("settings").update(payload).eq("id", settings.id);
  } else {
    result = await db.from("settings").insert(payload);
  }

  if (result.error) return alert(result.error.message);

  await loadSettings();
  alert("Pengaturan berhasil disimpan.");
}

function renderDashboard() {
  totalProduk.textContent = products.length;
  totalOrder.textContent = orders.length;
  pending.textContent = orders.filter(o => o.status === "Menunggu Verifikasi").length;

  const revenueTotal = orders
    .filter(o => o.status === "Selesai")
    .reduce((sum, o) => sum + Number(o.price || 0), 0);

  revenue.textContent = fmt(revenueTotal);
}

document.addEventListener("DOMContentLoaded", loadAll);
