Stock Dashboard 更新包

本次修改：
1. 快速策略套用時會重設為「修正後本益比」。
2. PE 欄位版本預設為「修正後本益比（缺值回退原始）」。
3. 修正後本益比缺值或非數字時，才回退使用原始本益比。
4. 清除條件後，PE 欄位版本也會回到修正後本益比。

更新 GitHub：
1. 解壓縮 stock-dashboard-updated.zip。
2. 開啟 https://github.com/peter0617ku/stock-dashboard
3. 進入 app.js，按編輯（鉛筆），以更新包中的 app.js 全文取代原內容並提交。
4. 進入 index.html，同樣以更新包中的 index.html 全文取代原內容並提交。
5. stocks_dashboard.json 和 style.css 本次沒有修改，不需要上傳。

注意：不要把 ZIP 本身當成網站原始碼直接上傳；請上傳其中的 app.js 和 index.html。
