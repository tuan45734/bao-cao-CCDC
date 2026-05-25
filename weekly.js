// ========== WEEKLY REPORT ==========
function getNppKVMap() {
    const map = new Map();
    nppByKV.forEach(([npp, kv]) => map.set(normalizeNppName(npp), kv));
    return map;
}

function getWeeklyNppEntries(weekData = {}, notUploadedByNPP = {}) {
    const kvMap = getNppKVMap();
    const seen = new Set();
    const entries = [];

    const addNpp = npp => {
        const normalizedNpp = normalizeNppName(npp);
        if (!normalizedNpp || seen.has(normalizedNpp)) return;
        seen.add(normalizedNpp);
        entries.push({
            npp: normalizedNpp,
            kv: kvMap.get(normalizedNpp) || UNKNOWN_KV
        });
    };

    nppByKV.forEach(([npp]) => addNpp(npp));
    Object.keys(weekData || {}).forEach(addNpp);
    Object.keys(notUploadedByNPP || {}).forEach(addNpp);

    return entries.sort((a, b) => {
        const aIndex = KNOWN_KVS.indexOf(a.kv);
        const bIndex = KNOWN_KVS.indexOf(b.kv);
        const safeAIndex = aIndex === -1 ? KNOWN_KVS.length : aIndex;
        const safeBIndex = bIndex === -1 ? KNOWN_KVS.length : bIndex;

        if (safeAIndex !== safeBIndex) {
            return safeAIndex - safeBIndex;
        }

        return a.npp.localeCompare(b.npp);
    });
}

function getWeeklyKvOrder(weekData = {}, notUploadedByKV = {}) {
    const order = [...KNOWN_KVS];
    const kvMap = getNppKVMap();
    const hasUnknownUploads = Object.keys(weekData || {}).some(npp => !kvMap.has(normalizeNppName(npp)));
    const hasUnknownNotUploaded = !!(notUploadedByKV && notUploadedByKV[UNKNOWN_KV]);

    if (hasUnknownUploads || hasUnknownNotUploaded) {
        order.push(UNKNOWN_KV);
    }

    return order;
}

function getWeekUploadTotals(weekKey, kvFilter) {
    const week = weeklyUploadData[weekKey];
    if (!week) return null;
    const nppKV = getNppKVMap();
    const totals = { total: 0, m1: 0, m2: 0, m3: 0 };

    Object.entries(week).forEach(([npp, data]) => {
        const kv = nppKV.get(npp) || UNKNOWN_KV;
        if (kvFilter && kvFilter !== 'all' && kv !== kvFilter) return;
        const l1 = data.levels['Mức 1 (TB 01 kệ)'] || 0;
        const l2 = data.levels['Mức 2 (TB 02 kệ)'] || 0;
        const l3 = data.levels['Mức 3 (TB 03 kệ)'] || 0;
        totals.total += l1 + l2 + l3;
        totals.m1 += l1;
        totals.m2 += l2;
        totals.m3 += l3;
    });

    return totals;
}

function getWeekNotUploadedTotals(weekKey, kvFilter) {
    const week = weeklyNotUploadedData[weekKey];
    if (!week) return null;
    const nppKV = getNppKVMap();
    const totals = { total: 0, m1: 0, m2: 0, m3: 0 };

    Object.entries(week).forEach(([npp, data]) => {
        const kv = nppKV.get(npp) || UNKNOWN_KV;
        if (kvFilter && kvFilter !== 'all' && kv !== kvFilter) return;
        const l1 = data.levels['Mức 1 (TB 01 kệ)'] || 0;
        const l2 = data.levels['Mức 2 (TB 02 kệ)'] || 0;
        const l3 = data.levels['Mức 3 (TB 03 kệ)'] || 0;
        totals.total += l1 + l2 + l3;
        totals.m1 += l1;
        totals.m2 += l2;
        totals.m3 += l3;
    });

    return totals;
}

function getWeeklyNotUploadedStats(weekKey = currentWeek) {
    const nppKV = getNppKVMap();
    const byNPP = {}, byKV = {};
    const totalByLevel = {};
    const week = weeklyNotUploadedData[weekKey] || {};

    Object.entries(week).forEach(([npp, data]) => {
        const kv = nppKV.get(npp) || UNKNOWN_KV;
        const l1 = data.levels['Mức 1 (TB 01 kệ)'] || 0;
        const l2 = data.levels['Mức 2 (TB 02 kệ)'] || 0;
        const l3 = data.levels['Mức 3 (TB 03 kệ)'] || 0;
        const total = l1 + l2 + l3;

        if (!byNPP[npp]) byNPP[npp] = { total: 0, levels: {} };
        byNPP[npp].total += total;
        byNPP[npp].levels['Mức 1 (TB 01 kệ)'] = (byNPP[npp].levels['Mức 1 (TB 01 kệ)'] || 0) + l1;
        byNPP[npp].levels['Mức 2 (TB 02 kệ)'] = (byNPP[npp].levels['Mức 2 (TB 02 kệ)'] || 0) + l2;
        byNPP[npp].levels['Mức 3 (TB 03 kệ)'] = (byNPP[npp].levels['Mức 3 (TB 03 kệ)'] || 0) + l3;

        if (!byKV[kv]) byKV[kv] = { total: 0, byLevel: {} };
        byKV[kv].total += total;
        byKV[kv].byLevel['Mức 1 (TB 01 kệ)'] = (byKV[kv].byLevel['Mức 1 (TB 01 kệ)'] || 0) + l1;
        byKV[kv].byLevel['Mức 2 (TB 02 kệ)'] = (byKV[kv].byLevel['Mức 2 (TB 02 kệ)'] || 0) + l2;
        byKV[kv].byLevel['Mức 3 (TB 03 kệ)'] = (byKV[kv].byLevel['Mức 3 (TB 03 kệ)'] || 0) + l3;

        totalByLevel['Mức 1 (TB 01 kệ)'] = (totalByLevel['Mức 1 (TB 01 kệ)'] || 0) + l1;
        totalByLevel['Mức 2 (TB 02 kệ)'] = (totalByLevel['Mức 2 (TB 02 kệ)'] || 0) + l2;
        totalByLevel['Mức 3 (TB 03 kệ)'] = (totalByLevel['Mức 3 (TB 03 kệ)'] || 0) + l3;
    });

    return { byNPP, byKV, totalByLevel };
}

function getWeeklyDeltaTable() {
    const rows = [];
    let prevTotal = null;
    sortedWeeks.forEach(week => {
        const t = getWeekUploadTotals(week, 'all');
        const total = t ? t.total : 0;
        let change = null, pct = null;
        if (prevTotal !== null) {
            change = total - prevTotal;
            if (prevTotal > 0) {
                pct = (change / prevTotal) * 100;
            } else if (change > 0) {
                pct = 100;
            } else {
                pct = 0;
            }
        }
        rows.push({ week, total, change, pct });
        prevTotal = total;
    });
    return rows;
}

function getCumulativeUploadedByNPP(weekKey) {
    const cumulative = new Map();
    for (const week of sortedWeeks) {
        const weekData = weeklyUploadData[week];
        if (!weekData) continue;
        Object.entries(weekData).forEach(([npp, data]) => {
            const total = (data.levels['Mức 1 (TB 01 kệ)'] || 0)
                       + (data.levels['Mức 2 (TB 02 kệ)'] || 0)
                       + (data.levels['Mức 3 (TB 03 kệ)'] || 0);
            cumulative.set(npp, (cumulative.get(npp) || 0) + total);
        });
        if (week === weekKey) break;
    }
    return cumulative;
}

function getNppExportPlan() {
    const plan = new Map();
    exportedData.forEach(item => {
        plan.set(normalizeNppName(item.npp), item.sl || 0);
    });
    return plan;
}

function hasWeeklyDataForWeek(weekKey) {
    return !!(weeklyUploadData[weekKey] || weeklyNotUploadedData[weekKey]);
}

function updateWeeklyStats() {
    const container = document.getElementById('weeklyStats');
    if (!currentWeek || !hasWeeklyDataForWeek(currentWeek)) {
        container.innerHTML = '<div class="stat-card"><h4>Chọn tuần</h4><div class="number">—</div></div>';
        return;
    }

    const uploadTotals = getWeekUploadTotals(currentWeek, currentWeeklyKV) || { total: 0, m1: 0, m2: 0, m3: 0 };
    const notUploadTotals = getWeekNotUploadedTotals(currentWeek, currentWeeklyKV) || { total: 0, m1: 0, m2: 0, m3: 0 };
    const nppCount = new Set([
        ...Object.keys(weeklyUploadData[currentWeek] || {}),
        ...Object.keys(weeklyNotUploadedData[currentWeek] || {})
    ]).size;

    if (uploadTotals.total === 0 && notUploadTotals.total === 0) {
        container.innerHTML = '<div class="stat-card"><h4>Không có dữ liệu</h4><div class="number">0</div></div>';
        return;
    }

    container.innerHTML = `
        <div class="stat-card success">
            <div class="stat-icon">📤</div>
            <h4>Kệ đã upload (tuần)</h4>
            <div class="number">${uploadTotals.total.toLocaleString()}</div>
            <div class="unit">kệ</div>
        </div>
        <div class="stat-card info">
            <div class="stat-icon">⏳</div>
            <h4>Kệ chưa upload (tuần)</h4>
            <div class="number">${notUploadTotals.total.toLocaleString()}</div>
            <div class="unit">kệ</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">1️⃣</div>
            <h4>Mức 1</h4>
            <div class="number">${uploadTotals.m1.toLocaleString()}</div>
            <div class="unit">kệ</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">2️⃣</div>
            <h4>Mức 2</h4>
            <div class="number">${uploadTotals.m2.toLocaleString()}</div>
            <div class="unit">kệ</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">3️⃣</div>
            <h4>Mức 3</h4>
            <div class="number">${uploadTotals.m3.toLocaleString()}</div>
            <div class="unit">kệ</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <h4>Tổng NPP có dữ liệu</h4>
            <div class="number">${nppCount.toLocaleString()}</div>
            <div class="unit">NPP</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <h4>Phân bố</h4>
            <div class="number" style="font-size:18px;">M1:${uploadTotals.m1} / M2:${uploadTotals.m2} / M3:${uploadTotals.m3}</div>
            <div class="unit">theo mức</div>
        </div>
    `;
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const title = document.getElementById('weeklyChartTitle');
    if (weeklyChart) weeklyChart.destroy();

    const kvFilter = currentWeeklyKV || 'all';
    title.innerHTML = kvFilter === 'all' ? 'Biểu đồ upload theo tuần' : `Biểu đồ upload theo tuần - ${kvFilter}`;
    const uploaded = [], notUploaded = [];
    sortedWeeks.forEach(week => {
        const up = getWeekUploadTotals(week, kvFilter);
        const nu = getWeekNotUploadedTotals(week, kvFilter);
        uploaded.push(up ? up.total : 0);
        notUploaded.push(nu ? nu.total : 0);
    });

    weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedWeeks,
            datasets: [
                {
                    label: 'Đã upload',
                    data: uploaded,
                    borderColor: 'rgba(37, 99, 235, 0.95)',
                    backgroundColor: 'rgba(37, 99, 235, 0.14)',
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Chưa upload',
                    data: notUploaded,
                    borderColor: 'rgba(249, 115, 22, 0.95)',
                    backgroundColor: 'rgba(249, 115, 22, 0.12)',
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} kệ`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Số lượng (kệ)' }, grid: { borderDash: [5, 5], color: '#e5e7eb' } },
                x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            }
        }
    });

    const deltaBody = document.getElementById('deltaTableBody');
    const deltaRows = getWeeklyDeltaTable();
    deltaBody.innerHTML = deltaRows.map(row => {
        let changeHtml = '<span style="color:#9ca3af;">—</span>';
        let pctHtml = '<span style="color:#9ca3af;">—</span>';
        if (row.change !== null && row.pct !== null) {
            const cls = row.change >= 0 ? 'delta-up' : 'delta-down';
            const icon = row.change >= 0 ? '▲' : '▼';
            changeHtml = `<span class="${cls}">${icon} ${Math.abs(row.change).toLocaleString()}</span>`;
            pctHtml = `<span class="${cls}">${row.change >= 0 ? '+' : ''}${row.pct.toFixed(1)}%</span>`;
        }
        return `<tr>
            <td><strong>${row.week}</strong></td>
            <td>${row.total.toLocaleString()}</td>
            <td>${changeHtml}</td>
            <td>${pctHtml}</td>
        </tr>`;
    }).join('');
}

function updateWeeklyLevelChart() {
    const ctx = document.getElementById('weeklyLevelChart').getContext('2d');
    const title = document.getElementById('weeklyLevelChartTitle');
    if (weeklyLevelChart) weeklyLevelChart.destroy();

    if (!currentWeek || !hasWeeklyDataForWeek(currentWeek)) {
        title.innerHTML = 'Thống kê kệ theo mức';
        return;
    }

    const nppKV = getNppKVMap();
    const weekData = weeklyUploadData[currentWeek];
    const notUploaded = getWeeklyNotUploadedStats(currentWeek);

    if (currentWeeklyKV === 'all') {
        title.innerHTML = `Thống kê kệ theo mức - ${currentWeek}`;
        const allKVs = getWeeklyKvOrder(weekData, notUploaded.byKV);
        const up1 = [], up2 = [], up3 = [];
        const nu1 = [], nu2 = [], nu3 = [];

        allKVs.forEach(kv => {
            let l1 = 0, l2 = 0, l3 = 0;
            Object.entries(weekData).forEach(([npp, data]) => {
                const nppKv = nppKV.get(npp) || UNKNOWN_KV;
                if (nppKv !== kv) return;
                l1 += data.levels['Mức 1 (TB 01 kệ)'] || 0;
                l2 += data.levels['Mức 2 (TB 02 kệ)'] || 0;
                l3 += data.levels['Mức 3 (TB 03 kệ)'] || 0;
            });
            up1.push(l1); up2.push(l2); up3.push(l3);

            const kvNU = notUploaded.byKV[kv];
            nu1.push(kvNU ? (kvNU.byLevel['Mức 1 (TB 01 kệ)'] || 0) : 0);
            nu2.push(kvNU ? (kvNU.byLevel['Mức 2 (TB 02 kệ)'] || 0) : 0);
            nu3.push(kvNU ? (kvNU.byLevel['Mức 3 (TB 03 kệ)'] || 0) : 0);
        });

        weeklyLevelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allKVs,
                datasets: [
                    { label: 'Đã upload - Mức 1', data: up1, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Đã upload - Mức 2', data: up2, backgroundColor: 'rgba(16, 185, 129, 0.85)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Đã upload - Mức 3', data: up3, backgroundColor: 'rgba(16, 185, 129, 1)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 1', data: nu1, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 2', data: nu2, backgroundColor: 'rgba(245, 158, 11, 0.85)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 3', data: nu3, backgroundColor: 'rgba(245, 158, 11, 1)', borderRadius: 4, borderWidth: 0 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} kệ` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Số lượng kệ' }, grid: { borderDash: [5, 5], color: '#e5e7eb' } },
                    x: { ticks: { font: { size: 11 } } }
                }
            }
        });
    } else {
        title.innerHTML = `Thống kê kệ theo mức - ${currentWeeklyKV}`;
        const kvNpps = getWeeklyNppEntries(weekData, notUploaded.byNPP)
            .filter(entry => entry.kv === currentWeeklyKV)
            .map(entry => entry.npp);
        const labels = [], up1 = [], up2 = [], up3 = [];
        const nu1 = [], nu2 = [], nu3 = [];

        kvNpps.forEach(npp => {
            const d = weekData[npp];
            const hasUpload = d && (d.levels['Mức 1 (TB 01 kệ)'] || d.levels['Mức 2 (TB 02 kệ)'] || d.levels['Mức 3 (TB 03 kệ)']);
            const nu = notUploaded.byNPP[npp];
            const hasNotUpload = nu && nu.total > 0;
            if (!hasUpload && !hasNotUpload) {
                labels.push(npp);
                up1.push(0); up2.push(0); up3.push(0);
                nu1.push(0); nu2.push(0); nu3.push(0);
                return;
            }
            labels.push(npp);
            up1.push(d ? (d.levels['Mức 1 (TB 01 kệ)'] || 0) : 0);
            up2.push(d ? (d.levels['Mức 2 (TB 02 kệ)'] || 0) : 0);
            up3.push(d ? (d.levels['Mức 3 (TB 03 kệ)'] || 0) : 0);
            nu1.push(nu ? (nu.levels['Mức 1 (TB 01 kệ)'] || 0) : 0);
            nu2.push(nu ? (nu.levels['Mức 2 (TB 02 kệ)'] || 0) : 0);
            nu3.push(nu ? (nu.levels['Mức 3 (TB 03 kệ)'] || 0) : 0);
        });

        weeklyLevelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Đã upload - Mức 1', data: up1, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Đã upload - Mức 2', data: up2, backgroundColor: 'rgba(16, 185, 129, 0.85)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Đã upload - Mức 3', data: up3, backgroundColor: 'rgba(16, 185, 129, 1)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 1', data: nu1, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 2', data: nu2, backgroundColor: 'rgba(245, 158, 11, 0.85)', borderRadius: 4, borderWidth: 0 },
                    { label: 'Chưa upload - Mức 3', data: nu3, backgroundColor: 'rgba(245, 158, 11, 1)', borderRadius: 4, borderWidth: 0 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} kệ` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Số lượng kệ' }, grid: { borderDash: [5, 5], color: '#e5e7eb' } },
                    x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
                }
            }
        });
    }
}

function updateWeeklyTable() {
    const tableBody = document.getElementById('weeklyTableBody');
    const tableTitle = document.getElementById('weeklyTableTitle');

    if (!currentWeek || !hasWeeklyDataForWeek(currentWeek)) {
        tableTitle.innerHTML = 'Chi tiết NPP theo tuần';
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Chọn tuần để xem chi tiết</td></tr>';
        return;
    }

    const weekUploadData = weeklyUploadData[currentWeek] || {};
    const weekNotUploadedData = weeklyNotUploadedData[currentWeek] || {};
    const notUploadTotalsByKV = getWeeklyNotUploadedStats(currentWeek).byKV;

    const allKVs = currentWeeklyKV === 'all' ? getWeeklyKvOrder(weekUploadData, notUploadTotalsByKV) : [currentWeeklyKV];
    const titleKv = currentWeeklyKV === 'all' ? 'Tất cả khu vực' : currentWeeklyKV;
    tableTitle.innerHTML = `Chi tiết NPP - ${titleKv} - ${currentWeek}`;

    tableBody.innerHTML = '';
    allKVs.forEach(kv => {
        const kvNpps = getWeeklyNppEntries(weekUploadData, weekNotUploadedData)
            .filter(entry => entry.kv === kv)
            .map(entry => entry.npp)
            .filter(npp => !weeklySearchTerm || npp.toLowerCase().includes(weeklySearchTerm.toLowerCase()));

        let kvUploadTotal = 0;
        let kvNotUploadTotal = 0;
        let kvLevel1 = 0;
        let kvLevel2 = 0;
        let kvLevel3 = 0;

        kvNpps.forEach(npp => {
            const d = weekUploadData[npp];
            const nd = weekNotUploadedData[npp];
            const up1 = d ? (d.levels['Mức 1 (TB 01 kệ)'] || 0) : 0;
            const up2 = d ? (d.levels['Mức 2 (TB 02 kệ)'] || 0) : 0;
            const up3 = d ? (d.levels['Mức 3 (TB 03 kệ)'] || 0) : 0;
            const totalUp = up1 + up2 + up3;
            const totalNotUp = nd ? ((nd.levels['Mức 1 (TB 01 kệ)'] || 0) + (nd.levels['Mức 2 (TB 02 kệ)'] || 0) + (nd.levels['Mức 3 (TB 03 kệ)'] || 0)) : 0;

            if (weeklyOnlyUploaded && totalUp === 0) return;

            kvUploadTotal += totalUp;
            kvNotUploadTotal += totalNotUp;
            kvLevel1 += up1;
            kvLevel2 += up2;
            kvLevel3 += up3;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${kv}</td>
                <td><strong>${npp}</strong></td>
                <td>${totalUp.toLocaleString()}</td>
                <td>${totalNotUp.toLocaleString()}</td>
                <td>${up1.toLocaleString()}</td>
                <td>${up2.toLocaleString()}</td>
                <td>${up3.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });

        if (kvNpps.length > 0) {
            const totalRow = document.createElement('tr');
            totalRow.className = 'row-warning';
            totalRow.innerHTML = `
                <td colspan="2"><strong>Tổng ${kv}</strong></td>
                <td><strong>${kvUploadTotal.toLocaleString()}</strong></td>
                <td><strong>${kvNotUploadTotal.toLocaleString()}</strong></td>
                <td><strong>${kvLevel1.toLocaleString()}</strong></td>
                <td><strong>${kvLevel2.toLocaleString()}</strong></td>
                <td><strong>${kvLevel3.toLocaleString()}</strong></td>
            `;
            tableBody.appendChild(totalRow);
        }
    });

    if (tableBody.children.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Không có dữ liệu upload trong tuần này</td></tr>';
    }
}

function initWeeklyReport() {
    if (sortedWeeks.length === 0) {
        document.getElementById('weekSelect').innerHTML = '<option value="">Không có dữ liệu tuần</option>';
        return;
    }

    const weekSelect = document.getElementById('weekSelect');
    const currentVal = weekSelect.value;
    weekSelect.innerHTML = sortedWeeks.map(w =>
        `<option value="${w}" ${w === currentVal || (!currentVal && w === sortedWeeks[sortedWeeks.length - 1]) ? 'selected' : ''}>${w}</option>`
    ).join('');

    if (!currentWeek) {
        currentWeek = weekSelect.value;
    } else if (!hasWeeklyDataForWeek(currentWeek)) {
        currentWeek = weekSelect.value || sortedWeeks[sortedWeeks.length - 1];
    }

    const weeklyKvSelect = document.getElementById('weeklyKvSelect');
    if (currentUserRole !== 'ADMIN') {
        weeklyKvSelect.value = currentUserRole;
        currentWeeklyKV = currentUserRole;
        for (let opt of weeklyKvSelect.options) {
            if (opt.value !== currentUserRole && opt.value !== 'all') {
                opt.disabled = true;
                opt.style.opacity = '0.5';
            }
        }
        weeklyKvSelect.options[0].disabled = true;
        weeklyKvSelect.options[0].style.opacity = '0.5';
    }

    updateWeeklyStats();
    updateWeeklyChart();
    updateWeeklyLevelChart();
    weeklyOnlyUploaded = document.getElementById('weeklyOnlyUploaded').checked;
    updateWeeklyTable();
}
