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
      document.getElementById("summaryBar").innerHTML =
        "⚠️ 沒有資料";
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
      .filter(col => data[0].hasOwnProperty(col))
      .map(key => ({

        title: key,
        data: key,

        render: function (value, type, row) {

          // ---------- PEG ----------
          if (key.includes("PEG")) {

            const peg = parseFloat(value);

            // 排序使用數值
            if (type === "sort" || type === "type") {
              return isNaN(peg) ? 999999 : peg;
            }

            if (!isNaN(peg)) {
              let cls = "peg-high";

              if (peg < 0.3)
                cls = "peg-low";
              else if (peg < 0.7)
                cls = "peg-mid";

              return `<span class="badge ${cls}">${peg.toFixed(3)}</span>`;
            }

            return value;
          }

          // ---------- In Portfolio ----------
          if (key === "In Portfolio?") {

            const v = String(value).trim().toUpperCase();

            if (type === "sort" || type === "filter") {
              return v;
            }

            if (v === "YES") {
              return '<span class="badge badge-true">✔ YES</span>';
            } else {
              return '<span class="badge badge-false">✘ NO</span>';
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

            if (type === "sort" || type === "filter") {
              return boolVal ? 1 : 0;
            }

            if (boolVal) {
              return '<span class="badge badge-true">✔ True</span>';
            } else {
              return '<span class="badge badge-false">✘ False</span>';
            }
          }

          // ---------- stock_id ----------
          if (key === "stock_id") {

            if (type === "sort" || type === "type") {
              return parseInt(value) || 0;
            }

            return `<span class="stock-id">${value}</span>`;
          }

          // ---------- 公司名稱 ----------
          if (key === "公司名稱") {
            return `<span class="company-name">${value}</span>`;
          }

          // ---------- 一般數字欄位 ----------
          if (
            key.includes("eps") ||
            key.includes("本益比") ||
            key === "編號"
          ) {
            const num = parseFloat(
              String(value).replace("%", "")
            );

            if (type === "sort" || type === "type") {
              return isNaN(num) ? -999999 : num;
            }
          }

          // ---------- 預設 ----------
          return value;
        }
      }));

    // ===== 建立 DataTable =====

    table = new DataTable("#stockTable", {
      data: data,
      columns: columns,
      pageLength: 100,
      scrollX: true,
      autoWidth: false,
      order: [],       // 預設不排序
      destroy: true
    });

  })
  .catch(err => {
    console.error(err);
    document.getElementById("summaryBar").innerHTML =
      "⚠️ 讀取資料失敗";
  });


// ===== 在庫存篩選 =====

function filterPortfolio(value) {

  if (!table) return;

  const idx = table.settings()[0].aoColumns.findIndex(
    c => c.sTitle === "In Portfolio?"
  );

  if (idx === -1) return;

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
