firebase.initializeApp(window.FIREBASE_CONFIG);
const db = firebase.firestore();
let allProducts = [];
let paymentMethods = [];
let settings = {};
const fmt = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const esc = t => String(t || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

async function loadSettings(){
  const snap = await db.collection("settings").doc("main").get();
  settings = snap.exists ? snap.data() : {};
  storeName.textContent = settings.storeName || "SHEIKOSHOP";
  footerStoreName.textContent = settings.storeName || "Sheikoshop";
  storeLogo.textContent = settings.logoText || "S";
  heroTitle.innerHTML = settings.heroTitle || "Aplikasi Premium<br>Harga Terbaik, Aman & Terpercaya";
  heroDescription.textContent = settings.heroDescription || "Nikmati berbagai aplikasi premium dengan harga terjangkau, proses cepat, dan aman 100%.";
  whatsappLink.href = "https://wa.me/" + (settings.whatsapp || "6281234567890");
}
async function loadPayments(){
  const snap = await db.collection("payments").where("active","==",true).get();
  paymentMethods = snap.docs.map(d => ({id:d.id,...d.data()}));
}
async function loadProducts(){
  products.innerHTML = `<div class="card">Memuat produk...</div>`;
  const snap = await db.collection("products").where("active","==",true).get();
  allProducts = snap.docs.map(d => ({id:d.id,...d.data()}));
  renderCategories(); renderProducts("Semua");
}
function renderCategories(){
  const cats = ["Semua", ...new Set(allProducts.map(p => p.category || "Lainnya"))];
  categories.innerHTML = cats.map((c,i)=>`<button class="tab ${i===0?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");renderProducts(btn.dataset.category);});
}
function renderProducts(cat="Semua", keyword=""){
  let ps = [...allProducts];
  if(cat !== "Semua") ps = ps.filter(p => (p.category || "Lainnya") === cat);
  if(keyword) ps = ps.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(keyword.toLowerCase()));
  if(!ps.length){products.innerHTML = `<div class="card">Produk belum tersedia.</div>`; return;}
  products.innerHTML = ps.map(p=>`<div class="card"><div class="productIcon">${esc(p.icon||"APP")}</div><h3>${esc(p.name)}</h3><div><span class="stars">★</span> ${p.rating||5} <span class="muted">(${p.sold||0})</span></div><div class="muted">${esc(p.shortText||"Akun Premium • Garansi")}</div><div class="price">${fmt(p.price)} <span class="muted" style="font-size:14px">/ paket</span></div><button class="btn" onclick="openProduct('${p.id}')">Beli Sekarang</button></div>`).join("");
}
function openProduct(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  modal.classList.add("show");
  modalContent.innerHTML = `<button class="btn ghost" onclick="closeModal()">Tutup</button><div class="two"><div class="card"><div class="productIcon" style="width:140px;height:140px">${esc(p.icon||"APP")}</div><h1>${esc(p.name)}</h1><div><span class="stars">★★★★★</span> ${p.rating||5} (${p.sold||0} Review)</div><h2>${fmt(p.price)}</h2><p class="muted">${esc(p.description||"")}</p><ul><li>Full Premium</li><li>Garansi sesuai deskripsi</li><li>Proses cepat</li><li>Support WhatsApp</li></ul><button class="btn" onclick="checkout('${p.id}')">Beli Sekarang</button></div><div class="card"><h3>Cara Order</h3><p class="muted">Pilih produk → bayar QRIS/transfer → upload bukti via WhatsApp → admin approve.</p></div></div>`;
}
function closeModal(){modal.classList.remove("show")}
function paymentOptions(){return paymentMethods.length ? paymentMethods.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("") : `<option>Manual</option>`;}
function paymentInfo(){return paymentMethods.length ? paymentMethods.map(p=>`<div class="paybox" style="margin-bottom:14px"><h3>${esc(p.name)}</h3>${p.qrisUrl?`<img src="${esc(p.qrisUrl)}" style="max-width:220px;border-radius:18px">`:""}<p class="muted">${esc(p.description||"")}</p><b>${esc(p.accountName||"")}</b><p>${esc(p.accountNumber||"")}</p></div>`).join("") : `<div class="paybox"><h3>Payment belum diatur</h3></div>`;}
function checkout(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  modalContent.innerHTML = `<button class="btn ghost" onclick="closeModal()">Tutup</button><h2>Checkout</h2><div class="two"><div><div class="paybox"><b>Pesanan</b><p>${esc(p.name)}</p><h2>${fmt(p.price)}</h2></div><div class="field"><label>Nama Pembeli</label><input id="buyer"></div><div class="field"><label>WhatsApp / Email</label><input id="contact"></div><div class="field"><label>Metode Pembayaran</label><select id="method">${paymentOptions()}</select></div></div><div>${paymentInfo()}<div class="field"><label>Catatan / link bukti pembayaran</label><input id="proofText" placeholder="Opsional: link foto bukti / catatan"></div><button class="btn" onclick="submitOrder('${p.id}')">Kirim Pesanan</button></div></div>`;
}
async function submitOrder(id){
  const p = allProducts.find(x=>x.id===id); if(!p) return;
  if(!buyer.value.trim() || !contact.value.trim()) return alert("Nama dan kontak wajib diisi.");
  const invoice = "INV-" + Date.now();
  await db.collection("orders").add({invoice, productId:p.id, productName:p.name, price:Number(p.price||0), buyerName:buyer.value.trim(), buyerContact:contact.value.trim(), paymentMethod:method.value, proofText:proofText.value.trim(), status:"Menunggu Verifikasi", createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  modalContent.innerHTML = `<h2>Detail Pesanan</h2><div class="card"><h3>${invoice}</h3><div class="pill">Menunggu Verifikasi</div><p class="muted">Simpan invoice ini. Admin akan verifikasi pembayaran.</p><a class="btn green" target="_blank" href="https://wa.me/${settings.whatsapp||'6281234567890'}?text=${encodeURIComponent('Halo admin, saya sudah order '+invoice)}">Chat Admin</a><button class="btn ghost" onclick="closeModal()">Selesai</button></div>`;
}
function setupSearch(){searchInput?.addEventListener("input",e=>renderProducts("Semua",e.target.value)); heroSearchInput?.addEventListener("input",e=>renderProducts("Semua",e.target.value));}
document.addEventListener("DOMContentLoaded", async()=>{try{await loadSettings(); await loadPayments(); await loadProducts(); setupSearch();}catch(e){products.innerHTML=`<div class="card">Error: ${esc(e.message)}</div>`; console.error(e);}});
