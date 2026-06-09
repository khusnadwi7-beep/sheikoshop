const supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
let allProducts = [];
let storeSettings = {};
let paymentSettings = [];
const fmt = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const esc = (t = "") => String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

async function loadSettings(){
  const {data,error}=await supabaseClient.from("store_settings").select("*").limit(1).maybeSingle();
  if(error){console.warn(error.message);return;}
  storeSettings=data||{};
  storeName.textContent=storeSettings.store_name||"SHEIKOSHOP";
  footerStoreName.textContent=storeSettings.store_name||"Sheikoshop";
  heroTitle.innerHTML=storeSettings.hero_title||"Aplikasi Premium<br>Harga Terbaik, Aman & Terpercaya";
  heroDescription.textContent=storeSettings.hero_description||"Nikmati berbagai aplikasi premium dengan harga terjangkau, proses cepat, dan aman 100%.";
  whatsappLink.href=`https://wa.me/${storeSettings.whatsapp||"6281234567890"}`;
  if(storeSettings.logo_text) storeLogo.textContent=storeSettings.logo_text;
}
async function loadPayments(){
  const {data,error}=await supabaseClient.from("payment_methods").select("*").eq("is_active",true).order("created_at",{ascending:true});
  if(error){console.warn(error.message);paymentSettings=[];return;}
  paymentSettings=data||[];
}
async function loadProducts(){
  const {data,error}=await supabaseClient.from("products").select("*").eq("is_active",true).order("created_at",{ascending:false});
  if(error){products.innerHTML=`<div class="card">Gagal mengambil produk: ${esc(error.message)}</div>`;return;}
  allProducts=data||[]; renderCategories(); renderProducts("Semua");
}
function renderCategories(){
  const cats=["Semua",...new Set(allProducts.map(p=>p.category||"Lainnya"))];
  categories.innerHTML=cats.map((c,i)=>`<button class="tab ${i===0?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.category);});
}
function renderProducts(category="Semua",keyword=""){
  let ps=[...allProducts];
  if(category!=="Semua") ps=ps.filter(p=>(p.category||"Lainnya")===category);
  if(keyword) ps=ps.filter(p=>`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(keyword.toLowerCase()));
  products.innerHTML=ps.length?ps.map(p=>`<div class="card"><div class="productIcon">${esc(p.icon||"APP")}</div><h3>${esc(p.name)}</h3><div><span class="stars">★</span> ${p.rating||5} <span class="muted">(${p.sold||0})</span></div><div class="muted">${esc(p.short_text||"Akun Premium • Garansi")}</div><div class="price">${fmt(p.price)} <span class="muted" style="font-size:14px">/ paket</span></div><button class="btn" onclick="openProduct('${p.id}')">Beli Sekarang</button></div>`).join(""):`<div class="card">Produk belum tersedia.</div>`;
}
function openProduct(id){
  const p=allProducts.find(x=>String(x.id)===String(id)); if(!p)return;
  modal.classList.add("show");
  modalContent.innerHTML=`<button class="btn ghost" onclick="closeModal()">Tutup</button><div class="two"><div class="card"><div class="productIcon" style="width:140px;height:140px">${esc(p.icon||"APP")}</div><h1>${esc(p.name)}</h1><div><span class="stars">★★★★★</span> ${p.rating||5} (${p.sold||0} Review)</div><h2>${fmt(p.price)} <span class="muted">/ paket</span></h2><p class="muted">${esc(p.description||"")}</p><ul><li>Full Premium</li><li>Garansi sesuai deskripsi</li><li>Proses cepat</li><li>Support WhatsApp</li></ul><button class="btn" onclick="checkout('${p.id}')">Beli Sekarang</button></div><div class="card"><h3>Informasi Produk</h3><p class="muted">${esc(p.long_description||p.description||"Produk premium bergaransi.")}</p><hr><h3>Cara Order</h3><p class="muted">Pilih produk → bayar QRIS/transfer → upload bukti → tunggu admin approve.</p></div></div>`;
}
function closeModal(){modal.classList.remove("show");}
function paymentOptionsHtml(){return paymentSettings.length?paymentSettings.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join(""):`<option value="Manual">Pembayaran Manual</option>`;}
function paymentInfoHtml(){
  if(!paymentSettings.length)return `<div class="paybox"><h3>QRIS / Transfer</h3><div class="qris">QRIS</div><p class="muted">Atur payment dari dashboard admin.</p></div>`;
  return paymentSettings.map(p=>`<div class="paybox" style="margin-bottom:14px"><h3>${esc(p.name)}</h3>${p.type==="QRIS"?(p.qris_url?`<img src="${esc(p.qris_url)}" style="max-width:220px;border-radius:18px">`:`<div class="qris">QRIS</div>`):""}<p class="muted">${esc(p.description||"")}</p><b>${esc(p.account_name||"")}</b><p>${esc(p.account_number||"")}</p></div>`).join("");
}
function checkout(id){
 const p=allProducts.find(x=>String(x.id)===String(id)); if(!p)return;
 modalContent.innerHTML=`<button class="btn ghost" onclick="closeModal()">Tutup</button><h2>Checkout</h2><div class="two"><div><div class="paybox"><b>Pesanan</b><p>${esc(p.name)}</p><h2>${fmt(p.price)}</h2></div><div class="field"><label>Nama Pembeli</label><input id="buyer" placeholder="Nama kamu"></div><div class="field"><label>WhatsApp / Email</label><input id="contact" placeholder="0812xxxx / email"></div><div class="field"><label>Metode Pembayaran</label><select id="method">${paymentOptionsHtml()}</select></div></div><div>${paymentInfoHtml()}<div class="field"><label>Upload Bukti Pembayaran</label><input id="proof" type="file" accept="image/*"></div><button class="btn" onclick="submitOrder('${p.id}')">Kirim Bukti Pembayaran</button></div></div>`;
}
async function uploadProof(file){
 if(!file)return ""; const ext=file.name.split(".").pop(); const path=`payments/proof-${Date.now()}.${ext}`;
 const {error}=await supabaseClient.storage.from("proofs").upload(path,file); if(error){alert("Upload bukti gagal: "+error.message); return "";}
 return supabaseClient.storage.from("proofs").getPublicUrl(path).data.publicUrl;
}
async function submitOrder(id){
 const p=allProducts.find(x=>String(x.id)===String(id)); if(!p)return;
 const buyer=document.querySelector("#buyer").value.trim(), contact=document.querySelector("#contact").value.trim(), method=document.querySelector("#method").value, proofFile=document.querySelector("#proof").files[0];
 if(!buyer||!contact)return alert("Nama dan kontak wajib diisi.");
 const proofUrl=await uploadProof(proofFile), invoice="INV-"+Date.now();
 const {error}=await supabaseClient.from("orders").insert({invoice,product_id:p.id,product_name:p.name,price:p.price,buyer_name:buyer,buyer_contact:contact,payment_method:method,proof_url:proofUrl,status:"Menunggu Verifikasi"});
 if(error)return alert("Order gagal dibuat: "+error.message);
 modalContent.innerHTML=`<h2>Detail Pesanan</h2><div class="card"><h3>${invoice}</h3><div class="pill">Menunggu Verifikasi</div><div class="orderStatus"><div class="step">Pesanan dibuat</div><div class="step">Pembayaran menunggu verifikasi admin</div><div class="step">Data akun akan dikirim setelah disetujui</div></div><p class="muted">Simpan nomor invoice ini.</p><button class="btn" onclick="closeModal()">Selesai</button></div>`;
}
function setupSearch(){searchInput?.addEventListener("input",e=>renderProducts("Semua",e.target.value));heroSearchInput?.addEventListener("input",e=>renderProducts("Semua",e.target.value));}
document.addEventListener("DOMContentLoaded",async()=>{await loadSettings();await loadPayments();await loadProducts();setupSearch();});
