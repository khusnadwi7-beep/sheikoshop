firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let products = [], payments = [], orders = [], settingsId = null;
const fmt = n => "Rp" + Number(n || 0).toLocaleString("id-ID");

window.loginAdmin = async function(){
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  try { await auth.signInWithEmailAndPassword(email, password); }
  catch(err){ document.getElementById("loginError").textContent = "Login gagal: " + err.message; }
};
window.logoutAdmin = async function(){ await auth.signOut(); };

auth.onAuthStateChanged(async user => {
  if(user){ document.getElementById("loginPage").style.display="none"; document.getElementById("adminApp").style.display="flex"; await loadAll(); }
  else { document.getElementById("loginPage").style.display="block"; document.getElementById("adminApp").style.display="none"; }
});

window.show = function(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  const page = document.getElementById(id); if(page) page.classList.remove("hidden");
  document.querySelectorAll(".menu a").forEach(a=>a.classList.remove("active"));
  const menu = Array.from(document.querySelectorAll(".menu a")).find(a=>a.getAttribute("onclick") && a.getAttribute("onclick").includes("'"+id+"'"));
  if(menu){ menu.classList.add("active"); document.getElementById("pageTitle").textContent = menu.textContent.trim(); }
};

async function loadAll(){ await loadProducts(); await loadPayments(); await loadOrders(); await loadSettings(); renderDashboard(); }
async function loadProducts(){ const snap = await db.collection("products").get(); products = snap.docs.map(d=>({id:d.id,...d.data()})); renderProducts(); }
function renderProducts(){ const el=document.getElementById("productRows"); if(!el)return; el.innerHTML = products.length ? products.map(p=>`<tr><td>${p.name||"-"}</td><td>${p.category||"-"}</td><td>${fmt(p.price)}</td><td><button class="btn ghost" onclick="editProduct('${p.id}')">Edit</button><button class="btn ghost" onclick="deleteProduct('${p.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="4">Belum ada produk.</td></tr>`; }
window.saveProduct = async function(){
  const id=document.getElementById("productId").value;
  const payload={name:document.getElementById("pname").value.trim(), price:Number(document.getElementById("pprice").value||0), category:document.getElementById("pcat").value.trim(), icon:document.getElementById("picon").value.trim()||"APP", description:document.getElementById("pdesc").value.trim(), short_text:"Akun Premium • Garansi", rating:5, sold:0, is_active:true, updated_at:new Date().toISOString()};
  if(!payload.name || !payload.price) return alert("Nama dan harga wajib diisi.");
  if(id) await db.collection("products").doc(id).update(payload); else { payload.created_at = new Date().toISOString(); await db.collection("products").add(payload); }
  resetProductForm(); await loadProducts(); renderDashboard(); alert("Produk berhasil disimpan.");
};
window.editProduct = function(id){ const p=products.find(x=>x.id===id); if(!p)return; productId.value=p.id; pname.value=p.name||""; pprice.value=p.price||""; pcat.value=p.category||""; picon.value=p.icon||""; pdesc.value=p.description||""; show("produk"); };
window.resetProductForm = function(){ productId.value=""; pname.value=""; pprice.value=""; pcat.value=""; picon.value=""; pdesc.value=""; };
window.deleteProduct = async function(id){ if(!confirm("Hapus produk ini?"))return; await db.collection("products").doc(id).delete(); await loadProducts(); renderDashboard(); };

async function loadPayments(){ const snap=await db.collection("payments").get(); payments=snap.docs.map(d=>({id:d.id,...d.data()})); renderPayments(); }
function renderPayments(){ const el=document.getElementById("paymentRows"); if(!el)return; el.innerHTML = payments.length ? payments.map(p=>`<tr><td>${p.name||"-"}</td><td>${p.type||"-"}</td><td>${p.account_number||"-"}</td><td><button class="btn ghost" onclick="editPayment('${p.id}')">Edit</button><button class="btn ghost" onclick="deletePayment('${p.id}')">Hapus</button></td></tr>`).join("") : `<tr><td colspan="4">Belum ada payment.</td></tr>`; }
window.savePayment = async function(){
  const id=paymentId.value;
  const payload={name:payName.value.trim(), type:payType.value, account_name:payAccountName.value.trim(), account_number:payAccountNumber.value.trim(), description:payDesc.value.trim(), qris_url:payQris.value.trim(), is_active:true, updated_at:new Date().toISOString()};
  if(!payload.name)return alert("Nama payment wajib diisi.");
  if(id) await db.collection("payments").doc(id).update(payload); else { payload.created_at=new Date().toISOString(); await db.collection("payments").add(payload); }
  paymentId.value=""; payName.value=""; payAccountName.value=""; payAccountNumber.value=""; payDesc.value=""; payQris.value=""; await loadPayments(); alert("Payment berhasil disimpan.");
};
window.editPayment = function(id){ const p=payments.find(x=>x.id===id); if(!p)return; paymentId.value=p.id; payName.value=p.name||""; payType.value=p.type||"QRIS"; payAccountName.value=p.account_name||""; payAccountNumber.value=p.account_number||""; payDesc.value=p.description||""; payQris.value=p.qris_url||""; show("payment"); };
window.deletePayment = async function(id){ if(!confirm("Hapus payment ini?"))return; await db.collection("payments").doc(id).delete(); await loadPayments(); };

async function loadOrders(){ const snap=await db.collection("orders").get(); orders=snap.docs.map(d=>({id:d.id,...d.data()})); renderOrders(); }
function renderOrders(){ const rows=document.getElementById("orderRows"), manage=document.getElementById("manageOrders"); if(rows) rows.innerHTML = orders.length ? orders.slice(0,5).map(o=>`<tr><td>${o.invoice||"-"}</td><td>${o.product_name||"-"}</td><td>${o.status||"-"}</td><td>${fmt(o.price)}</td></tr>`).join("") : `<tr><td>Belum ada order</td></tr>`; if(manage) manage.innerHTML = orders.length ? orders.map(o=>`<div class="card" style="margin-bottom:14px"><h3>${o.invoice||"-"}</h3><p><b>Produk:</b> ${o.product_name||"-"}</p><p><b>Pembeli:</b> ${o.buyer_name||o.customer_name||"-"}</p><p><b>Kontak:</b> ${o.buyer_contact||"-"}</p><p><b>Total:</b> ${fmt(o.price)}</p><p><b>Status:</b> ${o.status||"-"}</p><button class="btn" onclick="updateOrder('${o.id}','Selesai')">Approve</button><button class="btn ghost" onclick="updateOrder('${o.id}','Ditolak')">Reject</button></div>`).join("") : `<div class="card">Belum ada pesanan.</div>`; }
window.updateOrder = async function(id,status){ await db.collection("orders").doc(id).update({status}); await loadOrders(); renderDashboard(); };

async function loadSettings(){ const snap=await db.collection("store_settings").limit(1).get(); if(!snap.empty){ const d=snap.docs[0]; settingsId=d.id; const s=d.data(); storeName.value=s.store_name||"SHEIKOSHOP"; logoText.value=s.logo_text||"S"; heroTitle.value=s.hero_title||""; heroDesc.value=s.hero_description||""; waAdmin.value=s.whatsapp||""; } }
window.saveSettings = async function(){ const payload={store_name:storeName.value.trim(), logo_text:logoText.value.trim()||"S", hero_title:heroTitle.value.trim(), hero_description:heroDesc.value.trim(), whatsapp:waAdmin.value.trim(), updated_at:new Date().toISOString()}; if(settingsId) await db.collection("store_settings").doc(settingsId).update(payload); else { const ref=await db.collection("store_settings").add(payload); settingsId=ref.id; } alert("Pengaturan berhasil disimpan."); };
function renderDashboard(){ totalProduk.textContent=products.length; totalOrder.textContent=orders.length; pending.textContent=orders.filter(o=>o.status==="Menunggu Verifikasi").length; revenue.textContent=fmt(orders.filter(o=>o.status==="Selesai").reduce((s,o)=>s+Number(o.price||0),0)); }
