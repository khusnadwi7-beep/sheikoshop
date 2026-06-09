const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let allProducts = [];
let storeSettings = {};
let paymentSettings = [];

const fmt = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadSettings() {
  const { data, error } = await supabaseClient
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.warn("Settings belum ada:", error.message);
    return;
  }

  storeSettings = data || {};

  document.querySelector("#storeName").textContent =
    storeSettings.store_name || "SHEIKOSHOP";

  document.querySelector("#footerStoreName").textContent =
    storeSettings.store_name || "Sheikoshop";

  document.querySelector("#heroTitle").innerHTML =
    storeSettings.hero_title ||
    "Aplikasi Premium<br>Harga Terbaik, Aman & Terpercaya";

  document.querySelector("#heroDescription").textContent =
    storeSettings.hero_description ||
    "Nikmati berbagai aplikasi premium dengan harga terjangkau, proses cepat, dan aman 100%.";

  const wa = storeSettings.whatsapp || "6281234567890";
  document.querySelector("#whatsappLink").href = `https://wa.me/${wa}`;

  const logo = document.querySelector("#storeLogo");
  if (storeSettings.logo_text) {
    logo.textContent = storeSettings.logo_text;
  }
}

async function loadPayments() {
  const { data, error } = await supabaseClient
    .from("payments")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Payment error:", error.message);
    paymentSettings = [];
    return;
  }

  paymentSettings = data || [];
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    document.querySelector("#products").innerHTML =
      `<div class="card">Gagal mengambil produk: ${escapeHtml(error.message)}</div>`;
    return;
  }

  allProducts = data || [];
  renderCategories();
  renderProducts("Semua");
}

function renderCategories() {
  const el = document.querySelector("#categories");
  if (!el) return;

  const categories = ["Semua", ...new Set(allProducts.map((p) => p.category || "Lainnya"))];

  el.innerHTML = categories
    .map(
      (cat, index) =>
        `<button class="tab ${index === 0 ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
    )
    .join("");

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.category);
    };
  });
}

function renderProducts(category = "Semua", keyword = "") {
  const el = document.querySelector("#products");
  if (!el) return;

  let products = [...allProducts];

  if (category !== "Semua") {
    products = products.filter((p) => (p.category || "Lainnya") === category);
  }

  if (keyword) {
    products = products.filter((p) =>
      `${p.name} ${p.category} ${p.description}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
  }

  if (!products.length) {
    el.innerHTML = `<div class="card">Produk belum tersedia.</div>`;
    return;
  }

  el.innerHTML = products
    .map(
      (p) => `
      <div class="card">
        <div class="productIcon">${escapeHtml(p.icon || "APP")}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <div><span class="stars">★</span> ${p.rating || 5} <span class="muted">(${p.sold || 0})</span></div>
        <div class="muted">${escapeHtml(p.short_text || "Akun Premium • Garansi")}</div>
        <div class="price">${fmt(p.price)} <span class="muted" style="font-size:14px">/ paket</span></div>
        <button class="btn" onclick="openProduct('${p.id}')">Beli Sekarang</button>
      </div>
    `
    )
    .join("");
}

function openProduct(id) {
  const p = allProducts.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.querySelector("#modal").classList.add("show");
  document.querySelector("#modalContent").innerHTML = `
    <button class="btn ghost" onclick="closeModal()">Tutup</button>
    <div class="two">
      <div class="card">
        <div class="productIcon" style="width:140px;height:140px">${escapeHtml(p.icon || "APP")}</div>
        <h1>${escapeHtml(p.name)}</h1>
        <div><span class="stars">★★★★★</span> ${p.rating || 5} (${p.sold || 0} Review)</div>
        <h2>${fmt(p.price)} <span class="muted">/ paket</span></h2>
        <p class="muted">${escapeHtml(p.description || "")}</p>
        <ul>
          <li>Full Premium</li>
          <li>Garansi sesuai deskripsi</li>
          <li>Proses cepat</li>
          <li>Support WhatsApp</li>
        </ul>
        <button class="btn" onclick="checkout('${p.id}')">Beli Sekarang</button>
      </div>

      <div class="card">
        <h3>Informasi Produk</h3>
        <p class="muted">${escapeHtml(p.long_description || p.description || "Produk premium bergaransi.")}</p>
        <hr>
        <h3>Cara Order</h3>
        <p class="muted">Pilih produk → bayar QRIS/transfer → upload bukti → tunggu admin approve.</p>
      </div>
    </div>
  `;
}

function closeModal() {
  document.querySelector("#modal").classList.remove("show");
}

function paymentOptionsHtml() {
  if (!paymentSettings.length) {
    return `<option value="Manual">Pembayaran Manual</option>`;
  }

  return paymentSettings
    .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
    .join("");
}

function paymentInfoHtml() {
  if (!paymentSettings.length) {
    return `
      <div class="paybox">
        <h3>QRIS / Transfer</h3>
        <div class="qris">QRIS</div>
        <p class="muted">Atur payment dari dashboard admin.</p>
      </div>
    `;
  }

  return paymentSettings
    .map((p) => {
      const qris = p.qris_url
        ? `<img src="${escapeHtml(p.qris_url)}" style="max-width:220px;border-radius:18px">`
        : `<div class="qris">QRIS</div>`;

      return `
        <div class="paybox" style="margin-bottom:14px">
          <h3>${escapeHtml(p.name)}</h3>
          ${p.type === "QRIS" ? qris : ""}
          <p class="muted">${escapeHtml(p.description || "")}</p>
          <b>${escapeHtml(p.account_name || "")}</b>
          <p>${escapeHtml(p.account_number || "")}</p>
        </div>
      `;
    })
    .join("");
}

function checkout(id) {
  const p = allProducts.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.querySelector("#modalContent").innerHTML = `
    <button class="btn ghost" onclick="closeModal()">Tutup</button>
    <h2>Checkout</h2>

    <div class="two">
      <div>
        <div class="paybox">
          <b>Pesanan</b>
          <p>${escapeHtml(p.name)}</p>
          <h2>${fmt(p.price)}</h2>
        </div>

        <div class="field">
          <label>Nama Pembeli</label>
          <input id="buyer" placeholder="Nama kamu">
        </div>

        <div class="field">
          <label>WhatsApp / Email</label>
          <input id="contact" placeholder="0812xxxx / email">
        </div>

        <div class="field">
          <label>Metode Pembayaran</label>
          <select id="method">${paymentOptionsHtml()}</select>
        </div>
      </div>

      <div>
        ${paymentInfoHtml()}

        <div class="field">
          <label>Upload Bukti Pembayaran</label>
          <input id="proof" type="file" accept="image/*">
        </div>

        <button class="btn" onclick="submitOrder('${p.id}')">Kirim Bukti Pembayaran</button>
      </div>
    </div>
  `;
}

async function uploadProof(file) {
  if (!file) return "";

  const fileExt = file.name.split(".").pop();
  const fileName = `proof-${Date.now()}.${fileExt}`;
  const filePath = `payments/${fileName}`;

  const { error } = await supabaseClient.storage
    .from("proofs")
    .upload(filePath, file);

  if (error) {
    alert("Upload bukti gagal: " + error.message);
    return "";
  }

  const { data } = supabaseClient.storage
    .from("proofs")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function submitOrder(id) {
  const p = allProducts.find((x) => String(x.id) === String(id));
  if (!p) return;

  const buyer = document.querySelector("#buyer").value.trim();
  const contact = document.querySelector("#contact").value.trim();
  const method = document.querySelector("#method").value;
  const proofFile = document.querySelector("#proof").files[0];

  if (!buyer || !contact) {
    alert("Nama dan kontak wajib diisi.");
    return;
  }

  const proofUrl = await uploadProof(proofFile);

  const invoice = "INV-" + Date.now();

  const { error } = await supabaseClient.from("orders").insert({
    invoice,
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    buyer_name: buyer,
    buyer_contact: contact,
    payment_method: method,
    proof_url: proofUrl,
    status: "Menunggu Verifikasi"
  });

  if (error) {
    alert("Order gagal dibuat: " + error.message);
    return;
  }

  document.querySelector("#modalContent").innerHTML = `
    <h2>Detail Pesanan</h2>
    <div class="card">
      <h3>${invoice}</h3>
      <div class="pill">Menunggu Verifikasi</div>
      <div class="orderStatus">
        <div class="step">Pesanan dibuat</div>
        <div class="step">Pembayaran menunggu verifikasi admin</div>
        <div class="step">Data akun akan dikirim setelah disetujui</div>
      </div>
      <p class="muted">Simpan nomor invoice ini.</p>
      <button class="btn" onclick="closeModal()">Selesai</button>
    </div>
  `;
}

function setupSearch() {
  const searchInput = document.querySelector("#searchInput");
  const heroSearchInput = document.querySelector("#heroSearchInput");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderProducts("Semua", e.target.value);
    });
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener("input", (e) => {
      renderProducts("Semua", e.target.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await loadPayments();
  await loadProducts();
  setupSearch();
});
