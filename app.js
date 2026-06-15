let table;
let columnsGlobal = [];

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

        let portfolioCount = 0;

        if (data[0]["In Portfolio?"] !== undefined) {
            portfolioCount = data.filter(
                x => String(x["In Portfolio?"]).toUpperCase() === "YES"
            ).length;
        }

        document.getElementById("summaryBar").innerHTML =
            `📊 共 <b>${total}</b> 檔股票　｜　🟢 在庫存 <b>${portfolioCount}</b> 檔　｜　🔴 不在庫存 <b>${total - portfolioCount}</b> 檔`;

        // ===== Columns =====

        columnsGlobal = Object.keys(data[0]).map(key => ({
            title: key,
            data: key
        }));

        table = new DataTable("#stockTable", {
            data: data,
            columns: columnsGlobal,
            pageLength: 50,
            scrollX: true,
            order: [],

            createdRow: function (row, rowData) {

                $("td", row).each(function (idx) {

                    const colName = columnsGlobal[idx].title;
                    const rawValue = rowData[colName];
                    const value = String(rawValue).trim().toUpperCase();

                    // ---------- PEG ----------

                    if (colName.includes("PEG")) {

                        const peg = parseFloat(rawValue);

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

                    // ---------- true / false ----------

                    if (value === "TRUE") {
                        $(this).html(
                            `<span class="badge badge-true">✔ True</span>`
                        );
                    }

                    if (value === "FALSE") {
                        $(this).html(
                            `<span class="badge badge-false">✘ False</span>`
                        );
                    }

                    // ---------- YES / NO ----------

                    if (colName === "In Portfolio?") {

                        if (value === "YES") {
                            $(this).html(
                                `<span class="badge badge-true">🟢 YES</span>`
                            );
                        }
                        else {
                            $(this).html(
                                `<span class="badge badge-false">🔴 NO</span>`
                            );
                        }
                    }

                    // ---------- 股票代號 ----------

                    if (
                        colName === "stock_id" ||
                        colName === "代號"
                    ) {
                        $(this).addClass("stock-id");
                    }

                    // ---------- 公司名稱 ----------

                    if (
                        colName.includes("公司")
                    ) {
                        $(this).addClass("company-name");
                    }

                });
            }
        });
    });

function filterPortfolio(value) {

    if (!table)
        return;

    const idx = table.settings()[0].aoColumns.findIndex(
        c => c.sTitle === "In Portfolio?"
    );

    if (idx < 0)
        return;

    table.column(idx)
        .search(value)
        .draw();
}
