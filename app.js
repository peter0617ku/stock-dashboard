let table;
let columnsGlobal = [];

fetch("stocks_dashboard.json?t=" + Date.now())
  .then(response => response.json())
  .then(data => {

    if (!data || data.length === 0) {
      document.getElementById("summaryBar").innerHTML = "⚠️ 沒有資料";
      return;
    }

    // ===== Summary =====

    const total = data.length;

    let portfolioCount = 0;
    if (data[0]["In Portfolio?"] !== undefined) {
      portfolioCount = data.filter(
        x => String(x["In Portfolio?"]).trim().toUpperCase() === "YES"
      ).length;
    }

    document.getElementById("summaryBar").innerHTML =
      `📊 共 <b>${total}</b> 檔股票　｜　🟢 在庫存 <b>${portfolioCount}</b> 檔　｜　🔴 不在庫存 <b>${total - portfolioCount}</b> 檔`;

    // ===== 建立欄位 =====

    columnsGlobal = Object.keys(data[0]).map(key => ({
      title: key,
      data: key,

      render: function (value, type, row) {

        // 排序與搜尋使用原始值
        if (type === "sort" || type === "filter") {
          return value;
        }

        // ---------- In Portfolio ----------
        if (key === "In Portfolio?") {
          if (String(value).trim().toUpperCase() === "YES") {
            return '<span class="badge badge-true">🟢 YES</span>';
          } else {
            return '<span class="badge badge-false">🔴 NO</span>';
          }
        }

        // ---------- true / false ----------
        if (typeof value === "boolean") {
          if (value) {
            return '<span class="badge badge-true">✔ TRUE</span>';
          } else {
            return '<span class="badge badge-false">✘ FALSE</span>';
          }
        }

        if (String(value).trim().toLowerCase() === "true") {
          return '<span class="badge badge-true">✔ TRUE</span>';
        }

        if (String(value).trim().toLowerCase() === "false") {
          return '<span class="badge badge-false">✘ FALSE</span>';
        }

        // ---------- PEG ----------
        if (key.includes("PEG")) {

          const peg = parseFloat(value);

          if (!isNaN(peg)) {

            let cls = "peg-high";

            if (peg < 0.3)
              cls = "peg-low";
            else if (peg < 0.7)
              cls = "peg-mid";

            return `<span class="badge ${cls}">${peg.toFixed(3)}</span>`;
          }
        }

        // ---------- 股票代號 ----------
        if (key === "stock_id" || key === "代號") {
          return `<span class="stock-id">${value}</span>`;
        }

        // ---------- 公司名稱 ----------
        if (key.includes("公司")) {
          return `<span class="company-name">${value}</span>`;
        }

        return value;
      }
    }));

    // ===== 建立 DataTable =====

    table = new DataTable("#stockTable", {
      data: data,
      columns: columnsGlobal,
      pageLength: 50,
      scrollX: true,
      autoWidth: false,
      order: []
    });

  });

// ===== 在庫存篩選 =====

function filterPortfolio(value) {

  if (!table) return;

  // 找最後一欄（In Portfolio?）
  const idx = table.columns().count() - 1;

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
