let table;
let allStockData = [];
let activeFilterState = {};

const columnOrder = [
  "編號", "報告日期", "投顧機構", "公司名稱", "stock_id",
  "26年eps", "26年eps yoy", "26年本益比", "26年本益比(修正)", "26年PEG",
  "27年eps", "27年eps yoy", "27年本益比", "27年本益比(修正)", "27年PEG",
  "投資價值分數", "Price(Est)", "ref_price",
  "above_ma20", "above_ma60", "above_ma120", "above_ma240", "In Portfolio?"
];

const columnTitleMap = {
  "ref_price": "Ref Price",
  "26年本益比(修正)": "26年本益比(修正)",
  "27年本益比(修正)": "27年本益比(修正)",
  "above_ma20": "above_ma20",
  "above_ma60": "above_ma60",
  "above_ma120": "above_ma120",
  "above_ma240": "above_ma240"
};

function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function addBoundOptions(id, values, suffix = "") {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '<option value="">不限</option>' + values.map(v =>
    `<option value="${v}">${v}${suffix}</option>`
  ).join("");
}

function initFilterOptions() {
  const pe = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  ["pe26Min","pe26Max","pe27Min","pe27Max"].forEach(id => addBoundOptions(id, pe, " 倍"));
  const yoy = [-100, -50, -20, -10, 0, 10, 20, 30, 50, 75, 100, 150, 200, 300];
  ["yoy26Min","yoy26Max","yoy27Min","yoy27Max"].forEach(id => addBoundOptions(id, yoy, "%"));
  const peg = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5, 10];
  ["peg26Min","peg26Max","peg27Min","peg27Max"].forEach(id => addBoundOptions(id, peg, ""));
  const scores = [0, 10, 20, 30, 35, 40, 50, 60, 65, 70, 80, 90, 100];
  ["scoreMin","scoreMax"].forEach(id => addBoundOptions(id, scores, ""));
}

function getPEValue(row, year, forceAdjusted = false) {
  const useAdjusted = forceAdjusted || document.getElementById("peType").value === "adjusted";
  const raw = numeric(row[`${year}年本益比`]);
  const adjusted = numeric(row[`${year}年本益比(修正)`]);
  // 修正後本益比優先；只有修正值缺失或非數字時才回退原始本益比。
  if (useAdjusted) return adjusted !== null ? adjusted : raw;
  return raw;
}

function readFilters() {
  const read = id => {
    const v = document.getElementById(id)?.value ?? "";
    return v === "" ? null : Number(v);
  };
  return {
    pe26Min: read("pe26Min"), pe26Max: read("pe26Max"),
    pe27Min: read("pe27Min"), pe27Max: read("pe27Max"),
    yoy26Min: read("yoy26Min"), yoy26Max: read("yoy26Max"),
    yoy27Min: read("yoy27Min"), yoy27Max: read("yoy27Max"),
    peg26Min: read("peg26Min"), peg26Max: read("peg26Max"),
    peg27Min: read("peg27Min"), peg27Max: read("peg27Max"),
    scoreMin: read("scoreMin"), scoreMax: read("scoreMax"),
    portfolio: document.getElementById("portfolioFilter").value,
    ma: document.getElementById("maFilter").value
  };
}

function inRange(value, min, max) {
  if (min === null && max === null) return true;
  if (value === null) return false;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function rowPassesFilters(row, f) {
  const pe26 = numeric(getPEValue(row, "26"));
  const pe27 = numeric(getPEValue(row, "27"));
  const yoy26 = numeric(row["26年eps yoy"]);
  const yoy27 = numeric(row["27年eps yoy"]);
  const peg26 = numeric(row["26年PEG"]);
  const peg27 = numeric(row["27年PEG"]);
  const score = numeric(row["投資價值分數"]);

  if (!inRange(pe26, f.pe26Min, f.pe26Max)) return false;
  if (!inRange(pe27, f.pe27Min, f.pe27Max)) return false;
  if (!inRange(yoy26, f.yoy26Min, f.yoy26Max)) return false;
  if (!inRange(yoy27, f.yoy27Min, f.yoy27Max)) return false;
  if (!inRange(peg26, f.peg26Min, f.peg26Max)) return false;
  if (!inRange(peg27, f.peg27Min, f.peg27Max)) return false;
  if (!inRange(score, f.scoreMin, f.scoreMax)) return false;

  const portfolio = String(row["In Portfolio?"] ?? "").trim().toUpperCase();
  if (f.portfolio && portfolio !== f.portfolio) return false;
  if (f.ma && !(
    row[f.ma] === true ||
    String(row[f.ma]).trim().toLowerCase() === "true" ||
    String(row[f.ma]).trim() === "1"
  )) return false;
  return true;
}

function updateFilterSummary() {
  const f = activeFilterState;
  const labels = [];
  const add = (name, min, max, suffix = "") => {
    if (min !== null && max !== null) labels.push(`${name} ${min}～${max}${suffix}`);
    else if (min !== null) labels.push(`${name} ≥ ${min}${suffix}`);
    else if (max !== null) labels.push(`${name} ≤ ${max}${suffix}`);
  };
  add("26 PE", f.pe26Min, f.pe26Max, "x");
  add("27 PE", f.pe27Min, f.pe27Max, "x");
  add("26 YoY", f.yoy26Min, f.yoy26Max, "%");
  add("27 YoY", f.yoy27Min, f.yoy27Max, "%");
  add("26 PEG", f.peg26Min, f.peg26Max);
  add("27 PEG", f.peg27Min, f.peg27Max);
  add("分數", f.scoreMin, f.scoreMax);
  if (f.portfolio) labels.push(f.portfolio === "YES" ? "僅在庫存" : "僅不在庫存");
  if (f.ma) labels.push(`站上 ${f.ma.replace("above_ma","MA")}`);
  const peType = document.getElementById("peType").value === "adjusted"
    ? "修正 PE（缺值回退原始 PE）" : "原始 PE";
  if (labels.some(x => x.includes("PE"))) labels.push(`使用${peType}`);
  document.getElementById("filterSummary").textContent = labels.length ? labels.join("　｜　") : "尚未套用額外條件";
  const visible = table ? table.rows({ filter: "applied" }).count() : 0;
  document.getElementById("resultCount").textContent = `顯示 ${visible} / ${allStockData.length} 檔`;
}

function applyAdvancedFilters() {
  activeFilterState = readFilters();
  if (table) table.draw();
  updateFilterSummary();
}

function clearAdvancedFilters() {
  document.querySelectorAll(".filter-panel select").forEach(el => el.value = "");
  document.getElementById("peType").value = "adjusted";
  activeFilterState = readFilters();
  if (table) table.draw();
  updateFilterSummary();
}

function applyPreset(name) {
  clearAdvancedFilters();
  // 每次點擊快速策略，都明確切換為修正後本益比版本。
  // 若個別股票缺少修正後本益比，getPEValue() 會自動回退原始本益比。
  document.getElementById("peType").value = "adjusted";
  const set = (id, value) => document.getElementById(id).value = String(value);
  if (name === "convergence") {
    set("pe26Min", 35); set("pe27Max", 20); set("yoy27Min", 50);
  } else if (name === "growth") {
    set("pe27Max", 25); set("yoy27Min", 20); set("peg27Max", 1.5);
  } else if (name === "lowpe") {
    set("pe26Max", 15); set("pe27Max", 15);
  } else if (name === "highgrowth") {
    set("yoy27Min", 50); set("peg27Max", 1);
  } else if (name === "leftside") {
    set("pe27Max", 20); set("yoy27Min", 30);
  }
  applyAdvancedFilters();
}

function formatNumber(value, decimals = 2) {
  const n = numeric(value);
  return n === null ? "" : n.toFixed(decimals);
}

function badge(text, cls = "") {
  return `<span class="badge ${cls}">${text}</span>`;
}

function renderCell(key, value, row, type) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "sort" || type === "type") {
    const n = numeric(value);
    if (n !== null) return n;
  }

  if (key === "Price(Est)") return formatNumber(value, 2);
  if (key === "ref_price") {
    const ref = numeric(value), est = numeric(row["Price(Est)"]);
    let cls = "";
    if (ref !== null && est !== null) cls = ref > est ? "badge-true" : ref < est ? "badge-false" : "";
    return ref === null ? "" : badge(ref.toFixed(2), cls);
  }
  if (key.includes("本益比(修正)")) {
    const adj = numeric(value), raw = numeric(row[key.replace("(修正)", "")]);
    const cls = adj === null || raw === null ? "" : adj < raw ? "badge-true" : adj > raw ? "badge-false" : "";
    return adj === null ? "" : badge(adj.toFixed(2), cls);
  }
  if (key === "26年eps yoy" || key === "27年eps yoy") {
    const n = numeric(value);
    if (n === null) return "";
    return badge(`${n.toFixed(1)}%`, n >= 50 ? "badge-true" : n >= 0 ? "peg-mid" : "badge-false");
  }
  if (key === "投資價值分數") {
    const n = numeric(value);
    if (n === null) return "";
    return badge(n.toFixed(1), n >= 65 ? "badge-true" : n >= 35 ? "peg-mid" : "badge-false");
  }
  if (key.includes("PEG")) {
    const n = numeric(value);
    if (n === null) return "";
    return badge(n.toFixed(3), n < 0.3 ? "peg-low" : n < 0.7 ? "peg-mid" : "peg-high");
  }
  if (key === "In Portfolio?") {
    const v = String(value).trim().toUpperCase();
    return v === "YES" ? badge("🟢 YES", "badge-true") : badge("🔴 NO", "badge-false");
  }
  if (["above_ma20","above_ma60","above_ma120","above_ma240"].includes(key)) {
    const b = value === true || String(value).toLowerCase() === "true" || String(value) === "1";
    return b ? badge("✔ True", "badge-true") : badge("✘ False", "badge-false");
  }
  if (key === "stock_id") return `<span class="stock-id">${String(value)}</span>`;
  if (key === "公司名稱") return `<span class="company-name">${String(value)}</span>`;
  return String(value);
}

function filterPortfolio(value) {
  const el = document.getElementById("portfolioFilter");
  if (el) el.value = value;
  applyAdvancedFilters();
}

function initDashboard(data) {
  allStockData = data;
  const total = data.length;
  const portfolioCount = data.filter(x => String(x["In Portfolio?"]).trim().toUpperCase() === "YES").length;
  document.getElementById("summaryBar").innerHTML =
    `📊 共 <b>${total}</b> 檔股票　｜　🟢 在庫存 <b>${portfolioCount}</b> 檔　｜　🔴 不在庫存 <b>${total - portfolioCount}</b> 檔`;

  const columns = columnOrder.filter(col => data.some(row => Object.prototype.hasOwnProperty.call(row, col))).map(key => ({
    title: columnTitleMap[key] || key,
    data: key,
    render: (value, type, row) => renderCell(key, value, row, type)
  }));

  DataTable.ext.search.push(function(settings, searchData, dataIndex) {
    if (!table || settings.nTable.id !== "stockTable") return true;
    const row = table.row(dataIndex).data();
    return row ? rowPassesFilters(row, activeFilterState) : true;
  });

  table = new DataTable("#stockTable", {
    data,
    columns,
    pageLength: 200,
    lengthMenu: [25, 50, 100, 200],
    scrollX: true,
    autoWidth: false,
    order: [],
    destroy: true,
    language: {
      search: "表格搜尋：",
      lengthMenu: "每頁顯示 _MENU_ 筆",
      info: "顯示第 _START_ 至 _END_ 筆，共 _TOTAL_ 筆",
      infoEmpty: "沒有符合資料",
      zeroRecords: "找不到符合條件的股票",
      paginate: { first: "第一頁", last: "最後一頁", next: "下一頁", previous: "上一頁" }
    },
    drawCallback: function() { updateFilterSummary(); }
  });
  activeFilterState = readFilters();
  updateFilterSummary();
}

document.addEventListener("DOMContentLoaded", () => {
  initFilterOptions();
  document.getElementById("applyFilters").addEventListener("click", applyAdvancedFilters);
  document.getElementById("clearFilters").addEventListener("click", clearAdvancedFilters);
  document.querySelectorAll(".preset-btn").forEach(btn =>
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset))
  );
  document.querySelectorAll(".filter-panel select").forEach(el => {
    el.addEventListener("change", applyAdvancedFilters);
  });

  fetch("stocks_dashboard.json?t=" + Date.now())
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}：無法讀取 stocks_dashboard.json`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("summaryBar").textContent = "⚠️ 沒有資料";
        return;
      }
      initDashboard(data);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("summaryBar").textContent = "⚠️ 載入資料失敗：" + err.message;
    });
});
