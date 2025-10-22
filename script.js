/* ================================================
   iDream Finance Dashboard — script.js
   Fonctionnalités :
   - Gestion revenus/dépenses
   - Graphiques Chart.js
   - Export PDF réel (jsPDF, accents corrigés)
   - Sauvegarde locale + export auto JSON
   - PWA + installation mobile
   ================================================= */

/* --- Utilitaires et État --- */
const STORAGE_KEYS = {
  TX: "idream_tx_v1",
  CATS: "idream_cats_v1",
  PREF: "idream_pref_v1"
};

let state = {
  transactions: [],
  categories: [],
  prefs: { theme: "light" }
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const formatMoney = v => Number(v).toLocaleString("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0
});

/* --- Chargement / Sauvegarde --- */
function loadState() {
  try {
    state.transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TX) || "[]");
    state.categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATS) || "[]");
    const pref = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREF) || "{}");
    state.prefs = Object.assign(state.prefs, pref);
  } catch {
    console.warn("Erreur chargement localStorage");
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(state.transactions));
  localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(state.categories));
  localStorage.setItem(STORAGE_KEYS.PREF, JSON.stringify(state.prefs));
}

/* --- Catégories par défaut --- */
function ensureDefaultCategories() {
  if (state.categories.length) return;
  const defaults = [
    { name: "Salaires", color: "#FF6B6B" },
    { name: "Loyer", color: "#4D96FF" },
    { name: "Marketing", color: "#F59E0B" },
    { name: "Équipement", color: "#22C55E" },
    { name: "Services", color: "#8A2BE2" },
    { name: "Ventes", color: "#6A0DAD" }
  ];
  defaults.forEach(d => state.categories.push({ ...d, id: uid() }));
  saveState();
}

/* --- Sélecteurs DOM --- */
const els = {
  pages: document.querySelectorAll(".page"),
  navItems: document.querySelectorAll(".sidebar nav li"),
  revenueMonth: document.getElementById("revenueMonth"),
  expensesMonth: document.getElementById("expensesMonth"),
  netProfit: document.getElementById("netProfit"),
  marginPercent: document.getElementById("marginPercent"),
  revExpChart: document.getElementById("revExpChart"),
  expensePie: document.getElementById("expensePie"),
  txForm: document.getElementById("txForm"),
  txType: document.getElementById("txType"),
  txAmount: document.getElementById("txAmount"),
  txCategory: document.getElementById("txCategory"),
  txDate: document.getElementById("txDate"),
  txClient: document.getElementById("txClient"),
  txDesc: document.getElementById("txDesc"),
  expensesTable: document.querySelector("#expensesTable tbody"),
  revenuesTable: document.querySelector("#revenuesTable tbody"),
  catForm: document.getElementById("catForm"),
  catName: document.getElementById("catName"),
  catColor: document.getElementById("catColor"),
  catList: document.getElementById("catList"),
  reportCategory: document.getElementById("reportCategory"),
  btnGenerate: document.getElementById("btnGenerate"),
  reportOutput: document.getElementById("reportOutput"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  clearAll: document.getElementById("clearAll"),
  themeSelect: document.getElementById("themeSelect"),
  installBtn: document.getElementById("installBtn"),
  searchInput: document.getElementById("searchInput"),
  resetForm: document.getElementById("resetForm"),
  clearCats: document.getElementById("clearCats")
};

/* --- Navigation --- */
function showPage(id) {
  els.pages.forEach(p => p.hidden = p.id !== id);
  els.navItems.forEach(li => li.classList.toggle("active", li.dataset.target === id));
}
els.navItems.forEach(li => li.addEventListener("click", () => showPage(li.dataset.target)));

/* --- Rendu Catégories --- */
function renderCategories() {
  els.catList.innerHTML = "";
  els.txCategory.innerHTML = "";
  els.reportCategory.innerHTML = '<option value="all">Toutes</option>';
  state.categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "cat-item";
    div.style.background = cat.color;
    div.textContent = cat.name;

    const edit = document.createElement("button");
    edit.textContent = "✎";
    edit.className = "btn";
    edit.onclick = () => {
      els.catName.value = cat.name;
      els.catColor.value = cat.color;
      els.catForm.dataset.editId = cat.id;
    };

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.className = "btn";
    del.onclick = () => {
      if (confirm("Supprimer la catégorie ?")) {
        state.categories = state.categories.filter(c => c.id !== cat.id);
        saveState(); renderAll();
      }
    };
    div.append(edit, del);
    els.catList.appendChild(div);

    const opt = new Option(cat.name, cat.id);
    els.txCategory.add(opt.cloneNode(true));
    els.reportCategory.add(opt.cloneNode(true));
  });
}

/* --- Transactions --- */
function addTransaction(tx) {
  tx.id = uid();
  state.transactions.push(tx);
  saveState();
  renderAll();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState(); renderAll();
}

function renderTables(filter = "") {
  els.expensesTable.innerHTML = "";
  els.revenuesTable.innerHTML = "";
  const list = [...state.transactions].sort((a,b)=> new Date(b.date) - new Date(a.date));
  list.forEach(tx => {
    const txt = `${tx.desc||""} ${tx.client||""} ${tx.amount}`.toLowerCase();
    if (filter && !txt.includes(filter)) return;

    const tr = document.createElement("tr");
    const cat = state.categories.find(c => c.id === tx.categoryId);
    if (tx.type === "expense") {
      tr.innerHTML = `<td>${tx.date}</td><td>${cat?cat.name:"—"}</td><td>${tx.desc||""}</td><td>${formatMoney(tx.amount)}</td><td><button class="btn" data-id="${tx.id}">Suppr</button></td>`;
      els.expensesTable.appendChild(tr);
    } else {
      tr.innerHTML = `<td>${tx.date}</td><td>${tx.client||"-"}</td><td>${tx.desc||""}</td><td>${formatMoney(tx.amount)}</td><td><button class="btn" data-id="${tx.id}">Suppr</button></td>`;
      els.revenuesTable.appendChild(tr);
    }
  });

  document.querySelectorAll(".data-table button").forEach(b => {
    b.onclick = () => {
      if (confirm("Supprimer cette transaction ?")) deleteTransaction(b.dataset.id);
    };
  });
}

/* --- Métriques --- */
let revExpChartInstance, expensePieInstance;
function computeMetrics() {
  const now = new Date();
  const key = now.toISOString().slice(0,7);
  let rev=0, exp=0;
  state.transactions.forEach(t => {
    if(t.date?.slice(0,7)===key){
      if(t.type==="revenue") rev += +t.amount;
      else exp += +t.amount;
    }
  });
  const net = rev - exp;
  const margin = rev ? Math.round((net / rev) * 100) : 0;
  els.revenueMonth.textContent = formatMoney(rev);
  els.expensesMonth.textContent = formatMoney(exp);
  els.netProfit.textContent = formatMoney(net);
  els.marginPercent.textContent = margin + "%";
}

/* --- Graphiques --- */
function renderCharts() {
  const ctx1 = els.revExpChart.getContext("2d");
  const ctx2 = els.expensePie.getContext("2d");
  const now = new Date();
  const labels = [];
  const revData = [];
  const expData = [];

  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = d.toISOString().slice(0,7);
    labels.push(d.toLocaleString("fr-FR", {month:"short"}));
    let rev=0,exp=0;
    state.transactions.forEach(t=>{
      if(t.date?.slice(0,7)===key){
        if(t.type==="revenue") rev += +t.amount; else exp += +t.amount;
      }
    });
    revData.push(rev); expData.push(exp);
  }

  if(revExpChartInstance) revExpChartInstance.destroy();
  revExpChartInstance = new Chart(ctx1, {
    type:"line",
    data:{labels,datasets:[
      {label:"Revenus",data:revData,borderColor:"#6A0DAD"},
      {label:"Dépenses",data:expData,borderColor:"#FF6B6B"}
    ]},
    options:{plugins:{legend:{position:"bottom"}}}
  });

  const key = now.toISOString().slice(0,7);
  const catGroup = {};
  state.transactions.forEach(t=>{
    if(t.type==="expense" && t.date?.slice(0,7)===key){
      catGroup[t.categoryId] = (catGroup[t.categoryId]||0)+ +t.amount;
    }
  });
  const labelsPie=[], dataPie=[], colorsPie=[];
  for(const [id,amt] of Object.entries(catGroup)){
    const c = state.categories.find(x=>x.id===id);
    labelsPie.push(c?c.name:"Autres");
    dataPie.push(amt);
    colorsPie.push(c?c.color:"#999");
  }
  if(expensePieInstance) expensePieInstance.destroy();
  expensePieInstance = new Chart(ctx2,{type:"pie",data:{labels:labelsPie,datasets:[{data:dataPie,backgroundColor:colorsPie}]},options:{plugins:{legend:{position:"bottom"}}}});
}

/* --- Rapport --- */
function generateReport(){
  const period = document.getElementById("reportPeriod").value;
  const cat = document.getElementById("reportCategory").value;
  const now = new Date();
  let start,end;
  if(period==="month"){ start=new Date(now.getFullYear(),now.getMonth(),1); end=new Date(now.getFullYear(),now.getMonth()+1,0);}
  else if(period==="quarter"){const q=Math.floor(now.getMonth()/3);start=new Date(now.getFullYear(),q*3,1);end=new Date(now.getFullYear(),q*3+3,0);}
  else{start=new Date(now.getFullYear(),0,1);end=new Date(now.getFullYear(),11,31);}
  const sISO=start.toISOString().slice(0,10),eISO=end.toISOString().slice(0,10);
  const filtered=state.transactions.filter(t=>t.date>=sISO&&t.date<=eISO&&(cat==="all"||t.categoryId===cat));
  let totalRev=0,totalExp=0;
  filtered.forEach(t=>{if(t.type==="revenue")totalRev+=+t.amount;else totalExp+=+t.amount;});
  const net=totalRev-totalExp;
  const topExp=filtered.filter(t=>t.type==="expense").sort((a,b)=>b.amount-a.amount).slice(0,5);
  els.reportOutput.innerHTML=`<h3>Période : ${sISO} → ${eISO}</h3>
  <p>Total revenus : <strong>${formatMoney(totalRev)}</strong> — Total dépenses : <strong>${formatMoney(totalExp)}</strong> — Bénéfice : <strong>${formatMoney(net)}</strong></p>
  <h4>Top 5 dépenses</h4><ul>${topExp.map(t=>`<li>${t.date} — ${t.desc||"-"} — ${formatMoney(t.amount)}</li>`).join("")}</ul>`;
}

/* --- Export PDF (accents corrigés) --- */
els.exportPdfBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ encoding: "WinAnsiEncoding" });
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("Rapport Financier iDream", 14, 15);
  doc.setFontSize(10);
  doc.text("Généré le : " + new Date().toLocaleString("fr-FR"), 14, 22);

  const totalRev = state.transactions.filter(t=>t.type==="revenue").reduce((a,b)=>a+Number(b.amount),0);
  const totalExp = state.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+Number(b.amount),0);
  const net = totalRev - totalExp;

  doc.text(`Revenus : ${formatMoney(totalRev)}   Dépenses : ${formatMoney(totalExp)}   Bénéfice : ${formatMoney(net)}`, 14, 32);

  doc.setFontSize(11);
  doc.text("10 dernières transactions :", 14, 42);
  let y = 50;
  state.transactions.slice(-10).reverse().forEach(t => {
    const line = `${t.date} — ${t.type === "revenue" ? "Revenu" : "Dépense"} — ${t.desc || "-"} — ${formatMoney(t.amount)}`;
    doc.text(line, 14, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.save(`iDream-Rapport-${new Date().toISOString().slice(0,10)}.pdf`);
});

/* --- Sauvegarde auto JSON hebdomadaire --- */
setInterval(() => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `idream-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log("✅ Sauvegarde JSON automatique générée.");
}, 1000 * 60 * 60 * 24 * 7);

/* --- Événements UI --- */
els.txForm.onsubmit = e => {
  e.preventDefault();
  const tx = {
    type: els.txType.value,
    amount: +els.txAmount.value,
    categoryId: els.txCategory.value || null,
    date: els.txDate.value,
    client: els.txClient.value,
    desc: els.txDesc.value
  };
  if (tx.amount <= 0) return alert("Montant invalide");
  addTransaction(tx);
  els.txForm.reset();
};
els.resetForm.onclick = () => els.txForm.reset();
els.btnGenerate.onclick = generateReport;
els.clearAll.onclick = () => {
  if(confirm("Supprimer toutes les données ?")){
    state.transactions=[];state.categories=[];saveState();ensureDefaultCategories();renderAll();
  }
};
els.searchInput.oninput = e => renderTables(e.target.value.trim().toLowerCase());
els.themeSelect.onchange = e => {
  state.prefs.theme = e.target.value;
  applyTheme(); saveState();
};

/* --- PWA --- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('sw.js');
  });
}
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.style.display = "inline-block";
});
els.installBtn.onclick = async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.style.display = "none";
};

/* --- Rendu global --- */
function renderAll(){
  renderCategories();
  renderTables();
  computeMetrics();
  renderCharts();
}
function applyTheme(){
  if(state.prefs.theme==="dark")document.body.setAttribute("data-theme","dark");
  else document.body.removeAttribute("data-theme");
  els.themeSelect.value=state.prefs.theme;
}

/* --- Initialisation --- */
(function init(){
  loadState();
  ensureDefaultCategories();
  applyTheme();
  renderAll();
})();
