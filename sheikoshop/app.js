firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();
let allProducts = [];
let paymentSettings = [];
const fmt = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const esc = t => String(t || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

async function loadSettings(){
  const snap = await db.collection("store_settings").limit(1).get();
  if(snap.empty) return;
  const s = snap.docs[0].data();
  document.getElementById("storeName").textContent = s.store_name || "SHEIKOSHOP";
  document.getElementById("footerStoreName").textContent = s.store_name || "Sheikoshop";
  document.getElementById("heroTitle").innerHTML = s.hero_title || "Aplikasi Premium<br>Harga Terbaik, Aman & Terpercaya";
  document.getElementById("heroDescription").textContent = s.hero_description || "Nikmati berbagai aplikasi premium dengan harga terjangkau, proses cepat, dan aman 100%.";
  document.getElementById("whatsappLink").href = "https://wa.me/" + (s.whatsapp || "6281234567890");
  document.getElementById("storeLogo").textContent = s.logo_text || "S";
}

async function loadPayments(){
  const snap = await db.collection("payments").get();
  paymentSettings = snap.docs.map(d => ({id:d.id,...d.data()})).filter(p => p.is_active !== false);
}

async function loadProducts(){
  const snap = await db.collection("products").get();
  allProducts = snap.docs.map(d => ({id:d.id,...d.data()})).filter(p => p.is_active !== false);
  renderCategories(); renderProducts("Semua");
}

function renderCategories(){
  const el = document.getElementById("categories");
  const cats = ["Semua", ...new Set(allProducts.map(p => p.category || "Lainnya"))];
  el.innerHTML = cats.map((c,i)=>`<button class="tab ${i===0?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");renderProducts(btn.dataset.category);});
}

function renderProducts(category="Semua", keyword=""){
  const el = document.getElementById("products");
  let ps = allProducts.filter(p => category === "Semua" || (p.category || "Lainnya") === category);
  if(keyword) ps = ps.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(keyword.toLowerCase()));
  if(!ps.length){ el.innerHTML = `<div class="card">Produk belum tersedia.</div>`; return; }
  el.innerHTML = ps.map(p=>`<div class="card"><div class="productIcon">${esc(p.icon || "APP")}</div><h3>${esc(p.name)}</h3><div><span class="stars">★</span> ${p.rating || 5} <span class="muted">(${p.sold || 0})</span></div><div class="muted">${esc(p.short_text || "Akun Premium • Garansi")}</div><div class="price">${fmt(p.price)} <span class="muted" style="font-size:14px">/ paket</span></div><button class="btn" onclick="openProduct('${p.id}')">Beli Sekarang</button></div>`).join("");
}

window.openProduct = function(id){
  const p = allProducts.find(x => x.id === id); if(!p) return;
  document.getElementById("modal").classList.add("show");
  document.getElementById("modalContent").innerHTML = `<button class="btn ghost" onclick="closeModal()">Tutup</button><div class="two"><div class="card"><div class="productIcon" style="width:140px;height:140px">${esc(p.icon || "APP")}</div><h1>${esc(p.name)}</h1><div><span class="stars">★★★★★</span> ${p.rating || 5} (${p.sold || 0} Review)</div><h2>${fmt(p.price)} <span class="muted">/ paket</span></h2><p class="muted">${esc(p.description || "")}</p><ul><li>Full Premium</li><li>Garansi sesuai deskripsi</li><li>Proses cepat</li><li>Support WhatsApp</li></ul><button class="btn" onclick="checkout('${p.id}')">Beli Sekarang</button></div><div class="card"><h3>Cara Order</h3><p class="muted">Pilih produk → bayar QRIS/transfer → upload bukti via WhatsApp → tunggu admin approve.</p></div></div>`;
};
window.closeModal = () => document.getElementById("modal").classList.remove("show");

function paymentOptions(){ return paymentSettings.length ? paymentSettings.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("") : `<option>Manual</option>`; }
function paymentInfo(){ return paymentSettings.length ? paymentSettings.map(p=>`<div class="paybox" style="margin-bottom:14px"><h3>${esc(p.name)}</h3>${p.qris_url ? `<img src="${esc(p.qris_url)}" style="max-width:220px;border-radius:18px">` : `<div class="qris">QRIS</div>`}<p class="muted">${esc(p.description || "")}</p><b>${esc(p.account_name || "")}</b><p>${esc(p.account_number || "")}</p></div>`).join("") : `<div class="paybox"><h3>Payment</h3><div class="qris">QRIS</div><p class="muted">Atur payment dari dashboard admin.</p></div>`; }

window.checkout = function(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  document.getElementById("modalContent").innerHTML = `<button class="btn ghost" onclick="closeModal()">Tutup</button><h2>Checkout</h2><div class="two"><div><div class="paybox"><b>Pesanan</b><p>${esc(p.name)}</p><h2>${fmt(p.price)}</h2></div><div class="field"><label>Nama Pembeli</label><input id="buyer" placeholder="Nama kamu"></div><div class="field"><label>WhatsApp / Email</label><input id="contact" placeholder="0812xxxx / email"></div><div class="field"><label>Metode Pembayaran</label><select id="method">${paymentOptions()}</select></div></div><div>${paymentInfo()}<button class="btn" onclick="submitOrder('${p.id}')">Kirim Pesanan</button></div></div>`;
};

window.submitOrder = async function(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  const buyer = document.getElementById("buyer").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const method = document.getElementById("method").value;
  if(!buyer || !contact) return alert("Nama dan kontak wajib diisi.");
  const invoice = "INV-" + Date.now();
  await db.collection("orders").add({ invoice, product_id:p.id, product_name:p.name, price:Number(p.price||0), buyer_name:buyer, buyer_contact:contact, payment_method:method, status:"Menunggu Verifikasi", created_at:new Date().toISOString() });
  document.getElementById("modalContent").innerHTML = `<h2>Detail Pesanan</h2><div class="card"><h3>${invoice}</h3><div class="pill">Menunggu Verifikasi</div><p class="muted">Simpan nomor invoice ini. Kirim bukti pembayaran ke admin WhatsApp.</p><button class="btn" onclick="closeModal()">Selesai</button></div>`;
};

function setupSearch(){ ["searchInput","heroSearchInput"].forEach(id=>{const el=document.getElementById(id); if(el) el.addEventListener("input", e=>renderProducts("Semua", e.target.value));}); }
document.addEventListener("DOMContentLoaded", async()=>{ await loadSettings(); await loadPayments(); await loadProducts(); setupSearch(); });
