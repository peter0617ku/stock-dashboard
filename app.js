let table;
let allData = [];

fetch("stocks_dashboard.json?t=" + Date.now())
  .then(response => response.json())
  .then(data => {

    allData = data;

    // ====== 摘要資訊 ======
    const total = data.length;

    const inPortfolio = data.filter(
      x => String(x["In Portfolio?"]) === "True" || x["In Portfolio?"] === true
    ).length;

    const notPortfolio = total - inPortfolio;

    document.getElementById("summary").innerHTML =
      `共 <b>${total}</b> 檔　|　` +
      `✅ 在庫存 <b>${inPortfolio}</b> 檔　|　` +
      `❌ 不在庫存 <b>${notPortfolio}</b> 檔`;

    // ====== 建立欄位 ======
    const columns = Object.keys(data[0]).map(key => ({
      title: key,
      data: key
    }));

    table = new DataTable('#stockTable', {
      data: data,
      columns: columns,
      pageLength: 50,
      scrollX: true,
      order: [],

      createdRow: function (row, rowData) {

        $("td", row).each(function (index) {

          const columnName = columns[index].title;
          const value = rowData[columnName];

          // ===== In Portfolio =====
          if (columnName === "In Portfolio?") {

            if (value === true || String(value) === "True") {
              $(this).html(
                '<span class="badge badge-true">✔ 在庫存</span>'
              );
            } else {
              $(this).html(
                '<span class="badge badge-false">✘ 不在庫存</span>'
              );
            }
          }

          // ===== PEG 上色 =====
          if (columnName.includes("PEG")) {

            const peg = parseFloat(value);

            if (!isNaN(peg)) {

              let cls = "peg-high";

              if (peg < 0.3)
                cls = "peg-low";
              else if (peg < 0.7)
                cls = "peg-mid";

              $(this).html(
                `<span class="badge ${cls}">${peg.toFixed(3)}</span>`
              );
            }
          }

          // ===== 股票代號 =====
          if (
            columnName === "代號" ||
            columnName === "Stock ID" ||
            columnName === "stock_id"
          ) {
            $(this).addClass("stock-id");
          }

          // ===== 公司名稱 =====
          if (
            columnName === "公司" ||
            columnName === "Company"
          ) {
            $(this).addClass("company-name");
          }
        });
      }
    });
  });

function filterPortfolio(value) {

  if (!table) return;

  const idx = table.settings()[0].aoColumns.findIndex(
    c => c.sTitle === "In Portfolio?"
  );

  if (idx === -1) return;

  table
    .column(idx)
    .search(value)
    .draw();
}
