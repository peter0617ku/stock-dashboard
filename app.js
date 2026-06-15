let table;

fetch("stocks_dashboard.json")
  .then(response => response.json())
  .then(data => {

    const columns = Object.keys(data[0]).map(key => ({
      title: key,
      data: key
    }));

    table = new DataTable('#stockTable', {
      data: data,
      columns: columns,

      pageLength: 50,
      scrollX: true,

      columnDefs: [
        {
          // True / False 顏色
          targets: "_all",
          createdCell: function (td, cellData, rowData, row, col) {

            // True / False
            if (cellData === true || cellData === "True") {
              td.innerHTML =
                '<span class="badge badge-true">✔ True</span>';
            }
            else if (cellData === false || cellData === "False") {
              td.innerHTML =
                '<span class="badge badge-false">✘ False</span>';
            }

            // PEG 顏色（欄位名稱是 26PEG）
            const columnName = columns[col].title;

            if (columnName === "26PEG") {
              const peg = parseFloat(cellData);

              let cls = "peg-high";
              if (peg < 0.3)
                cls = "peg-low";
              else if (peg < 0.7)
                cls = "peg-mid";

              td.innerHTML =
                `<span class="badge ${cls}">${peg.toFixed(3)}</span>`;
            }
          }
        }
      ]
    });
  });

function filterPortfolio(value) {
  if (!table) return;

  const idx = table.settings()[0].aoColumns.findIndex(
    c => c.sTitle === "In Portfolio?"
  );

  table.column(idx)
       .search(value)
       .draw();
}
