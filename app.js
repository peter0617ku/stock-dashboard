let table;

fetch("stocks_dashboard.json")
  .then(response => response.json())
  .then(data => {

    // 自動建立所有欄位
    const columns = Object.keys(data[0]).map(key => ({
      title: key,
      data: key
    }));

    table = new DataTable('#stockTable', {
      data: data,
      columns: columns,
      pageLength: 50,
      scrollX: true
    });
  });

function filterPortfolio(value) {
    if (!table) return;

    // 找出 "In Portfolio?" 這個欄位位置
    const idx = table.settings()[0].aoColumns.findIndex(
        c => c.sTitle === "In Portfolio?"
    );

    table.column(idx)
         .search(value)
         .draw();
}
