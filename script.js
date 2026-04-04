// Khởi tạo biến toàn cục
let overviewChart = null;
let levelChart = null;
let currentKV = 'all';
let currentSearchTerm = '';

// Hàm xác định số kệ tương ứng với mức
function getSoKeByMuc(mucKe) {
    if (mucKe === 'Mức 1 (TB 01 kệ)') return 1;
    if (mucKe === 'Mức 2 (TB 02 kệ)') return 2;
    if (mucKe === 'Mức 3 (TB 03 kệ)') return 3;
    return 0;
}

// Hàm xử lý dữ liệu
function processData() {
    const nppToKV = new Map();
    nppByKV.forEach(([npp, kv]) => {
        nppToKV.set(npp.trim(), kv);
    });

    const exportedByNPP = new Map();
    exportedData.forEach(item => {
        const npp = item.npp.trim();
        const current = exportedByNPP.get(npp) || 0;
        exportedByNPP.set(npp, current + (item.sl || 0));
    });

    const uploadedByNPP = new Map();
    const uploadedByLevel = new Map();
    const uploadedByNPPAndLevel = new Map();
    
    uploadedData.forEach(item => {
        const npp = item.npp.trim();
        const mucKe = item.muc_ke;
        const soLan = item.so_lan || 1;
        const soKe = getSoKeByMuc(mucKe) * soLan;
        
        const currentTotal = uploadedByNPP.get(npp) || 0;
        uploadedByNPP.set(npp, currentTotal + soKe);
        
        const levelKey = `${npp}|${mucKe}`;
        const currentLevel = uploadedByLevel.get(levelKey) || 0;
        uploadedByLevel.set(levelKey, currentLevel + soKe);
        
        const nppLevelKey = `${npp}|${mucKe}`;
        const currentNPPLevel = uploadedByNPPAndLevel.get(nppLevelKey) || 0;
        uploadedByNPPAndLevel.set(nppLevelKey, currentNPPLevel + soKe);
    });

    const kvStats = new Map();
    const allKVs = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'];
    allKVs.forEach(kv => {
        kvStats.set(kv, {
            exported: 0,
            uploaded: 0,
            uploadedByLevel: { 
                'Mức 1 (TB 01 kệ)': 0, 
                'Mức 2 (TB 02 kệ)': 0,
                'Mức 3 (TB 03 kệ)': 0
            },
            details: []
        });
    });

    nppByKV.forEach(([npp, kv]) => {
        npp = npp.trim();
        const exported = exportedByNPP.get(npp) || 0;
        const uploaded = uploadedByNPP.get(npp) || 0;
        const shortage = exported - uploaded;
        
        const stats = kvStats.get(kv);
        stats.exported += exported;
        stats.uploaded += uploaded;
        
        const nppUploadLevels = {
            'Mức 1 (TB 01 kệ)': 0,
            'Mức 2 (TB 02 kệ)': 0,
            'Mức 3 (TB 03 kệ)': 0
        };
        
        for (let [key, count] of uploadedByLevel) {
            if (key.startsWith(npp + '|')) {
                const level = key.split('|')[1];
                nppUploadLevels[level] = (nppUploadLevels[level] || 0) + count;
                stats.uploadedByLevel[level] = (stats.uploadedByLevel[level] || 0) + count;
            }
        }
        
        stats.details.push({
            npp,
            exported,
            uploaded,
            shortage,
            levels: nppUploadLevels
        });
    });

    for (let kv of allKVs) {
        kvStats.get(kv).details.sort((a, b) => a.npp.localeCompare(b.npp));
    }

    return { kvStats, allKVs, uploadedByNPPAndLevel };
}

// Hàm cập nhật thống kê nhanh
function updateStatsCards(kvStats, selectedKV) {
    const statsCards = document.getElementById('statsCards');
    
    if (selectedKV === 'all') {
        let totalExported = 0, totalUploaded = 0, totalShortage = 0;
        kvStats.forEach(stat => {
            totalExported += stat.exported;
            totalUploaded += stat.uploaded;
            totalShortage += Math.max(0, stat.exported - stat.uploaded);
        });
        
        statsCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <h4>Tổng kệ đã xuất</h4>
                <div class="number">${totalExported.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">📤</div>
                <h4>Tổng kệ đã upload</h4>
                <div class="number">${totalUploaded.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <h4>Tổng kệ thiếu</h4>
                <div class="number">${totalShortage.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏭</div>
                <h4>Tổng số NPP</h4>
                <div class="number">${nppByKV.length}</div>
                <div class="unit">đại lý</div>
            </div>
        `;
    } else {
        const stat = kvStats.get(selectedKV);
        const shortage = Math.max(0, stat.exported - stat.uploaded);
        const completionRate = stat.exported > 0 ? ((stat.uploaded / stat.exported) * 100).toFixed(1) : 0;
        
        statsCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <h4>Kệ đã xuất</h4>
                <div class="number">${stat.exported.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">📤</div>
                <h4>Kệ đã upload</h4>
                <div class="number">${stat.uploaded.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <h4>Kệ thiếu</h4>
                <div class="number">${shortage.toLocaleString()}</div>
                <div class="unit">kệ</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <h4>Tỷ lệ hoàn thành</h4>
                <div class="number">${completionRate}%</div>
                <div class="unit">upload/xuất</div>
            </div>
        `;
    }
}

// Hàm cập nhật biểu đồ tổng quan
function updateOverviewChart(kvStats, selectedKV) {
    const ctx = document.getElementById('overviewChart').getContext('2d');
    const chartTitle = document.getElementById('chartTitle');
    const allKVs = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'];
    
    let labels = [], datasets = [];
    
    if (selectedKV === 'all') {
        chartTitle.innerHTML = 'Tổng quan kệ theo khu vực';
        labels = allKVs;
        const exportedData = [], uploadedData = [], shortageData = [];
        
        allKVs.forEach(kv => {
            const stat = kvStats.get(kv);
            exportedData.push(stat.exported);
            uploadedData.push(stat.uploaded);
            shortageData.push(Math.max(0, stat.exported - stat.uploaded));
        });
        
        datasets = [
            {
                label: 'Kệ đã xuất',
                data: exportedData,
                backgroundColor: 'rgba(99, 102, 241, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            },
            {
                label: 'Kệ đã upload',
                data: uploadedData,
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            },
            {
                label: 'Kệ thiếu',
                data: shortageData,
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            }
        ];
    } else {
        chartTitle.innerHTML = `Chi tiết kệ theo NPP - ${selectedKV}`;
        const stat = kvStats.get(selectedKV);
        labels = stat.details.map(d => d.npp);
        const exportedData = stat.details.map(d => d.exported);
        const uploadedData = stat.details.map(d => d.uploaded);
        const shortageData = stat.details.map(d => Math.max(0, d.shortage));
        
        datasets = [
            {
                label: 'Kệ đã xuất',
                data: exportedData,
                backgroundColor: 'rgba(99, 102, 241, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            },
            {
                label: 'Kệ đã upload',
                data: uploadedData,
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            },
            {
                label: 'Kệ thiếu',
                data: shortageData,
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                borderRadius: 8,
                borderWidth: 0
            }
        ];
    }
    
    if (overviewChart) overviewChart.destroy();
    
    overviewChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'top', 
                    labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } 
                },
                tooltip: { 
                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} kệ` },
                    backgroundColor: '#1f2937',
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Số lượng (kệ)', font: { size: 12 } }, 
                    grid: { borderDash: [5, 5], color: '#e5e7eb' } 
                },
                x: { 
                    title: { display: true, text: selectedKV === 'all' ? 'Khu vực' : 'Nhà phân phối', font: { size: 12 } }, 
                    ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } } 
                }
            }
        }
    });
}

// Hàm cập nhật biểu đồ mức kệ
function updateLevelChart(kvStats, selectedKV, uploadedByNPPAndLevel) {
    const ctx = document.getElementById('levelChart').getContext('2d');
    const levelChartTitle = document.getElementById('levelChartTitle');
    
    let labels = [], level1Data = [], level2Data = [], level3Data = [];
    
    if (selectedKV === 'all') {
        levelChartTitle.innerHTML = 'Thống kê kệ đã upload theo mức - Tất cả khu vực';
        const allKVs = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'];
        labels = allKVs;
        
        allKVs.forEach(kv => {
            const stat = kvStats.get(kv);
            level1Data.push(stat.uploadedByLevel['Mức 1 (TB 01 kệ)'] || 0);
            level2Data.push(stat.uploadedByLevel['Mức 2 (TB 02 kệ)'] || 0);
            level3Data.push(stat.uploadedByLevel['Mức 3 (TB 03 kệ)'] || 0);
        });
    } else {
        levelChartTitle.innerHTML = `Thống kê kệ đã upload theo mức - ${selectedKV}`;
        const stat = kvStats.get(selectedKV);
        const nppsWithUpload = stat.details.filter(d => d.uploaded > 0);
        
        if (nppsWithUpload.length > 0) {
            labels = nppsWithUpload.map(d => d.npp);
            level1Data = nppsWithUpload.map(d => d.levels['Mức 1 (TB 01 kệ)'] || 0);
            level2Data = nppsWithUpload.map(d => d.levels['Mức 2 (TB 02 kệ)'] || 0);
            level3Data = nppsWithUpload.map(d => d.levels['Mức 3 (TB 03 kệ)'] || 0);
        } else {
            labels = ['Không có dữ liệu upload'];
            level1Data = [0]; level2Data = [0]; level3Data = [0];
        }
    }
    
    if (levelChart) levelChart.destroy();
    
    levelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Mức 1 (1 kệ)', data: level1Data, backgroundColor: 'rgba(245, 158, 11, 0.85)', borderRadius: 8, borderWidth: 0 },
                { label: 'Mức 2 (2 kệ)', data: level2Data, backgroundColor: 'rgba(139, 92, 246, 0.85)', borderRadius: 8, borderWidth: 0 },
                { label: 'Mức 3 (3 kệ)', data: level3Data, backgroundColor: 'rgba(236, 72, 153, 0.85)', borderRadius: 8, borderWidth: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'top', 
                    labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } 
                },
                tooltip: { 
                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} kệ` },
                    backgroundColor: '#1f2937',
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Số lượng kệ upload', font: { size: 12 } }, 
                    grid: { borderDash: [5, 5], color: '#e5e7eb' } 
                },
                x: { 
                    title: { display: true, text: selectedKV === 'all' ? 'Khu vực' : 'Nhà phân phối', font: { size: 12 } }, 
                    ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } } 
                }
            }
        }
    });
}

// Hàm cập nhật bảng dữ liệu
function updateDataTable(kvStats, selectedKV, searchTerm = '') {
    const tableBody = document.getElementById('tableBody');
    const tableTitle = document.getElementById('tableTitle');
    tableBody.innerHTML = '';
    
    if (selectedKV === 'all') {
        tableTitle.innerHTML = 'Dữ liệu chi tiết - Tất cả khu vực';
        const allKVs = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'];
        
        allKVs.forEach(kv => {
            const stat = kvStats.get(kv);
            let filteredDetails = stat.details;
            if (searchTerm) {
                filteredDetails = stat.details.filter(d => d.npp.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            if (filteredDetails.length === 0) return;
            
            const kvHeader = document.createElement('tr');
            kvHeader.style.background = '#f9fafb';
            kvHeader.innerHTML = `<td colspan="5" style="background: #f9fafb; font-weight: 600; border-top: 2px solid #e5e7eb;">📌 ${kv} - Xuất: ${stat.exported.toLocaleString()} | Upload: ${stat.uploaded.toLocaleString()} | Thiếu: ${Math.max(0, stat.exported - stat.uploaded).toLocaleString()}</td>`;
            tableBody.appendChild(kvHeader);
            
            filteredDetails.forEach(detail => {
                const row = document.createElement('tr');
                const shortageClass = detail.shortage > 0 ? 'badge-danger' : 'badge-success';
                const shortageText = detail.shortage > 0 ? `Thiếu ${detail.shortage.toLocaleString()}` : 'Đủ';
                row.innerHTML = `<td>${kv}</td><td><strong>${detail.npp}</strong></td><td>${detail.exported.toLocaleString()}</td><td>${detail.uploaded.toLocaleString()}</td><td><span class="badge ${shortageClass}">${shortageText}</span></td>`;
                tableBody.appendChild(row);
            });
        });
    } else {
        tableTitle.innerHTML = `Dữ liệu chi tiết - ${selectedKV}`;
        const stat = kvStats.get(selectedKV);
        let filteredDetails = stat.details;
        if (searchTerm) {
            filteredDetails = stat.details.filter(d => d.npp.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        if (filteredDetails.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `<td colspan="5" class="no-data">🔍 Không tìm thấy NPP "${searchTerm}" trong ${selectedKV}</td>`;
            tableBody.appendChild(noDataRow);
        } else {
            filteredDetails.forEach(detail => {
                const row = document.createElement('tr');
                const shortageClass = detail.shortage > 0 ? 'badge-danger' : 'badge-success';
                const shortageText = detail.shortage > 0 ? `Thiếu ${detail.shortage.toLocaleString()}` : 'Đủ';
                row.innerHTML = `<td>${selectedKV}</td><td><strong>${detail.npp}</strong></td><td>${detail.exported.toLocaleString()}</td><td>${detail.uploaded.toLocaleString()}</td><td><span class="badge ${shortageClass}">${shortageText}</span></td>`;
                tableBody.appendChild(row);
            });
        }
    }
}

// Hàm khởi tạo dashboard
function initDashboard() {
    const { kvStats, allKVs, uploadedByNPPAndLevel } = processData();
    const selectedKV = document.getElementById('kvSelect').value;
    const searchTerm = document.getElementById('searchInput').value;
    
    currentKV = selectedKV;
    currentSearchTerm = searchTerm;
    
    updateStatsCards(kvStats, selectedKV);
    updateOverviewChart(kvStats, selectedKV);
    updateLevelChart(kvStats, selectedKV, uploadedByNPPAndLevel);
    updateDataTable(kvStats, selectedKV, searchTerm);
    
    // Update current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    document.getElementById('currentDate').innerHTML = `${formattedDate}`;
}

// Export to Excel
function exportToExcel() {
    const table = document.getElementById('dataTable');
    const html = table.outerHTML;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao_cao_ke_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Download chart as image
function downloadChart(chartId) {
    const canvas = document.getElementById(chartId);
    const link = document.createElement('a');
    link.download = `${chartId}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// Expand chart modal
let modalChart = null;
function expandChart(chartId) {
    const modal = document.getElementById('chartModal');
    const modalCanvas = document.getElementById('modalChart');
    const originalCanvas = document.getElementById(chartId);
    const title = chartId === 'overviewChart' ? 'Biểu đồ tổng quan' : 'Biểu đồ theo mức kệ';
    
    document.getElementById('modalTitle').innerHTML = title;
    modal.style.display = 'flex';
    
    if (modalChart) modalChart.destroy();
    const ctx = modalCanvas.getContext('2d');
    const originalChart = chartId === 'overviewChart' ? overviewChart : levelChart;
    
    modalCanvas.width = originalCanvas.width;
    modalCanvas.height = originalCanvas.height;
    modalChart = new Chart(ctx, {
        type: originalChart.config.type,
        data: originalChart.config.data,
        options: { ...originalChart.config.options, responsive: true, maintainAspectRatio: true }
    });
}

function closeModal() {
    const modal = document.getElementById('chartModal');
    modal.style.display = 'none';
    if (modalChart) {
        modalChart.destroy();
        modalChart = null;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    
    document.getElementById('kvSelect').addEventListener('change', () => {
        document.getElementById('searchInput').value = '';
        initDashboard();
    });
    
    document.getElementById('searchInput').addEventListener('input', () => initDashboard());
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        initDashboard();
    });
    
    // Close modal on outside click
    window.onclick = (e) => {
        const modal = document.getElementById('chartModal');
        if (e.target === modal) closeModal();
    };
});