let table;

// ===== 固定欄位順序 =====
const columnOrder = [
  "編號",
  "報告日期",
  "投顧機構",
  "公司名稱",
  "stock_id",
  "26年eps",
  "26年eps yoy",
  "26年本益比",
  "26年PEG",
  "27年eps",
  "27年eps yoy",
  "27年本益比",
  "27年PEG",
  "投資價值分數",
  "above_ma20",
  "above_ma60",
  "above_ma120",
  "above_ma240",
  "In Portfolio?"
];

fetch("stocks_dashboard.json?t=" + Date.now())
  .then(response => response.json())
  .then(data => {

    if (!data || data.length === 0) {
      document.getElementById("summaryBar").innerHTML = "⚠️ 沒有資料";
      return;
    }

    // ===== Summary =====
    const total = data.length;

    const portfolioCount = data.filter(
      x => String(x["In Portfolio?"]).trim().toUpperCase() === "YES"
    ).length;

    document.getElementById("summaryBar").innerHTML =
      `📊 共 <b>${total}</b> 檔股票　｜　🟢 在庫存 <b>${portfolioCount}</b> 檔　｜　🔴 不在庫存 <b>${total - portfolioCount}</b> 檔`;

    // ===== 建立欄位 =====
    const columns = columnOrder
      .filter(col => Object.prototype.hasOwnProperty.call(data[0], col))
      .map(key => ({

        title: key,
        data: key,

        render: function (value, type) {

          // ---------- YOY ----------
          if (key === "26年eps yoy" || key === "27年eps yoy") {
            
            // 安全防禦：若資料為空或 null，直接回傳空字串
            if (value === null || value === undefined || value === "") return "";

            const yoyVal = parseFloat(value);

            // 排序 / 搜尋使用純數值
            if (type === "sort" || type === "type" || type === "filter") {
              return isNaN(yoyVal) ? -999999 : yoyVal;
            }

            if (isNaN(yoyVal)) return "";

            let cls = "badge";

            if (yoyVal >= 50) {
              cls += " badge-true";      // 綠色
            } else if (yoyVal >= 0) {
              cls += " peg-mid";         // 黃色
            } else {
              cls += " badge-false";     // 紅色
            }

            return `<span class="${cls}">${yoyVal.toFixed(1)}%</span>`;
          }

          // ---------- 投資價值分數 ----------
          if (key === "投資價值分數") {

            if (value === null || value === undefined || value === "") return "";

            const score = parseFloat(value);

            if (type === "sort" || type === "type" || type === "filter") {
              return isNaN(score) ? -999999 : score;
            }

            if (isNaN(score)) return "";

            let cls = "badge";

            if (score >= 65) {
              cls += " badge-true";      // 綠色：分數高
            } else if (score >= 35) {
              cls += " peg-mid";         // 黃色：中等
            } else {
              cls += " badge-false";     // 紅色：分數低
            }

            return `<span class="${cls}">${score.toFixed(1)}</span>`;
          }

          // ---------- PEG ----------
          if (key.includes("PEG")) {

            const peg = parseFloat(value);

            if (type === "sort" || type === "type" || type === "filter") {
              return isNaN(peg) ? 999999 : peg;
            }

            if (isNaN(peg)) return "";

            let cls = "peg-high";

            if (peg < 0.3)
              cls = "peg-low";
            else if (peg < 0.7)
              cls = "peg-mid";

            return `<span class="badge ${cls}">${peg.toFixed(3)}</span>`;
          }

          // ---------- In Portfolio ----------
          if (key === "In Portfolio?") {

            const v = String(value).trim().toUpperCase();

            if (type === "sort" || type === "type" || type === "filter") {
              return v;
            }

            if (v === "YES") {
              return '<span class="badge badge-true">🟢 YES</span>';
            } else {
              return '<span class="badge badge-false">🔴 NO</span>';
            }
          }

          // ---------- true / false ----------
          if (
            typeof value === "boolean" ||
            String(value).toLowerCase() === "true" ||
            String(value).toLowerCase() === "false"
          ) {

            const boolVal =
              value === true ||
              String(value).toLowerCase() === "true";

            if (type === "sort" || type === "type" || type === "filter") {
              return boolVal ? 1 : 0;
            }

            if (boolVal) {
              return '<span class="badge badge-true">✔ True</span>';
            } else {
              return '<span class="badge badge-false">✘ False</span>';
            }
          }

          // ---------- 一般數值欄位 ----------
          if (
            key === "編號" ||
            key === "26年eps" ||
            key === "27年eps" ||
            key === "26年本益比" ||
            key === "27年本益比"
          ) {

            const num = parseFloat(value);

            if (type === "sort" || type === "type" || type === "filter") {
              return isNaN(num) ? -999999 : num;
            }

            return value;
          }

          // ---------- stock_id ----------
          if (key === "stock_id") {

            const num = parseInt(value);

            if (type === "sort" || type === "type" || type === "filter") {
              return isNaN(num) ? 0 : num;
            }

            return `<span class="stock-id">${value}</span>`;
          }

          // ---------- 公司名稱 ----------
          if (key === "公司名稱") {
            return `<span class="company-name">${value}</span>`;
          }

          // ---------- 預設 ----------
          return value ?? "";
        }

      }));

    // ===== 建立 DataTable =====
    table = new DataTable("#stockTable", {
      data: data,
      columns: columns,
      pageLength: 200,
      lengthMenu: [25, 50, 100, 200], // 👈 新增這行來指定選單內容
      scrollX: true,
      autoWidth: false,
      order: [],
      destroy: true
    });

  })
  .catch(err => {
    console.error(err);

    document.getElementById("summaryBar").innerHTML =
      "⚠️ 錯誤：" + err.message;

    document.body.insertAdjacentHTML(
      "beforeend",
      `<pre style="
        color:red;
        background:#fff0f0;
        padding:10px;
        margin:10px;
        border:1px solid #ccc;
        white-space:pre-wrap;
        font-size:14px;
      ">${err.stack || err}</pre>`
    );
  });


// ===== 在庫存篩選 =====
function filterPortfolio(value) {

  if (!table) return;

  const idx = table.settings()[0].aoColumns.findIndex(
    c => c.sTitle === "In Portfolio?"
  );

  if (idx < 0) return;

  if (value === "") {
    table.column(idx)
      .search("")
      .draw();
  } else {
    table.column(idx)
      .search("^" + value + "$", true, false)
      .draw();
  }
}
