const API_CONFIG = {
    baseUrl: 'https://api.mobiwork.vn:3020/ReportAuditDisplayDVF',
    auth: 'Basic YWRtaW41QGFjYnQuY29tOmFjZjY4MTljNmNiZjJlMGZkNGE2Njg5MjQ5NjAzODFi',
    params: {
        orgid: '67eb9cf392d9028035624d91',
        fromdate: '01/03/2026',
        todate: '31/12/2026',
        formID: '69a547bc20383fc829812f8f',
        formName: 'Trưng bày quầy kệ 2026 (Mới)',
        datechoice: 'cdate',
        chamDiem: '',
        muc_cttbbaocao: '',
        timeApprove: '',
        order_sdate: '1777568400000',
        order_edate: '1780246799999',
        sDate: '1777568400000',
        eDate: '1780160400000'
    }
};

let uploadedData = [];
let notUploadedData = [];

let weeklyUploadData = {};
let weeklyNotUploadedData = {};
let sortedWeeks = [];

function buildApiUrl() {
    const params = { ...API_CONFIG.params };
    const query = new URLSearchParams(params);
    return `${API_CONFIG.baseUrl}?${query.toString()}`;
}

function parseDateDMY(dateStr) {
    if (dateStr === null || dateStr === undefined || dateStr === '') return null;

    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
        return new Date(dateStr);
    }

    if (typeof dateStr === 'number') {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    }

    const raw = String(dateStr).trim();
    if (/^\d{10,13}$/.test(raw)) {
        const ms = raw.length === 10 ? Number(raw) * 1000 : Number(raw);
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
    }

    const parts = raw.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2]);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    return new Date(y, m - 1, d);
}

function getLevelWeight(mucKe) {
    if (mucKe === null || mucKe === undefined) return 1;
    const raw = String(mucKe).trim();
    const m = raw.match(/(\d)/);
    if (m && m[1]) return Number(m[1]) || 1;
    // fallback: check words
    if (/m%E1%BB%A5c\s*3|muc\s*3|Mức\s*3|Muc\s*3/i.test(raw)) return 3;
    if (/m%E1%BB%A5c\s*2|muc\s*2|Mức\s*2|Muc\s*2/i.test(raw)) return 2;
    return 1;
}

function getRecordDate(record) {
    if (!record) return null;

    const createdDate = parseDateDMY(record.createdDate);
    if (createdDate) return createdDate;

    const gsDate = record.nv_cham_gs && record.nv_cham_gs.date;
    if (gsDate) {
        const parsedGsDate = parseDateDMY(gsDate);
        if (parsedGsDate) return parsedGsDate;
    }

    return parseDateDMY(record.ngay || record.date);
}

function hasActualUpload(record) {
    const hasNvChup = !!(record.nv_chup && (record.nv_chup.email || record.nv_chup.name));
    const hasPhotoList = Array.isArray(record.photo) && record.photo.length > 0;
    const hasImageCount = Number(record.sl_anh || 0) > 0;
    return hasNvChup || hasPhotoList || hasImageCount;
}

function hasNonEmptyChupInfo(record) {
    const chup = record && record.nv_chup;
    if (!chup) return false;

    const fields = [chup.grCode, chup.grName, chup.email, chup.name];
    return fields.some(value => String(value || '').trim() !== '');
}

function hasPhotoEvidence(record) {
    const hasPhotoList = Array.isArray(record.photo) && record.photo.length > 0;
    const hasImageCount = Number(record.sl_anh || 0) > 0;
    return hasPhotoList || hasImageCount;
}

function getConfiguredCreatedDateRange() {
    const params = API_CONFIG.params || {};
    const startDate = parseDateDMY(params.fromdate);
    const endDate = parseDateDMY(params.todate);

    return {
        startMs: startDate ? startDate.getTime() : null,
        endMs: endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1).getTime() : null
    };
}

function isInConfiguredDateRangeByCreatedDate(record) {
    const recordDate = getRecordDate(record);
    if (!recordDate) return false;

    const createdMs = recordDate.getTime();

    const { startMs, endMs } = getConfiguredCreatedDateRange();
    if (startMs !== null && createdMs < startMs) return false;
    if (endMs !== null && createdMs >= endMs) return false;
    return true;
}

function isUploadedRecord(record) {
    return hasNonEmptyChupInfo(record) && hasPhotoEvidence(record);
}

function transformApiResponse(apiData) {
    const uploadedAgg = new Map();
    const notUploadedAgg = new Map();
    const result = apiData.result || {};

    Object.values(result).forEach(entry => {
        const npp = String(entry.group || '').trim();
        if (!npp) return;

        (entry.data || []).forEach(record => {
            const mucKe = record.muc_trung_bay;
            if (!mucKe) return;

            const key = `${npp}|${mucKe}`;
            if (isUploadedRecord(record)) {
                uploadedAgg.set(key, (uploadedAgg.get(key) || 0) + 1);
            } else {
                notUploadedAgg.set(key, (notUploadedAgg.get(key) || 0) + 1);
            }
        });
    });

    const uploaded = [];
    const notUploaded = [];

    uploadedAgg.forEach((soLan, key) => {
        const [npp, mucKe] = key.split('|');
        uploaded.push({ npp, muc_ke: mucKe, so_lan: soLan });
    });

    notUploadedAgg.forEach((soLan, key) => {
        const [npp, mucKe] = key.split('|');
        notUploaded.push({ npp, muc_ke: mucKe, so_lan: soLan });
    });

    return { uploaded, notUploaded };
}

function getWeekKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekNum = Math.ceil(day / 7);
    return `Tháng ${month}/${year} - Tuần ${weekNum}`;
}

function compareWeeks(a, b) {
    const aM = a.match(/Tháng (\d+)\/(\d+) - Tuần (\d+)/);
    const bM = b.match(/Tháng (\d+)\/(\d+) - Tuần (\d+)/);
    if (!aM || !bM) return 0;
    const ay = parseInt(aM[2]), by = parseInt(bM[2]);
    if (ay !== by) return ay - by;
    const am = parseInt(aM[1]), bm = parseInt(bM[1]);
    if (am !== bm) return am - bm;
    return parseInt(aM[3]) - parseInt(bM[3]);
}

function extractWeeklyData(apiData) {
    const weekly = {};
    const weeklyNotUploaded = {};
    const result = apiData.result || {};

    Object.values(result).forEach(entry => {
        const npp = String(entry.group || '').trim();
        if (!npp) return;

        (entry.data || []).forEach(record => {
            if (!isInConfiguredDateRangeByCreatedDate(record)) return;

            const date = getRecordDate(record);
            if (!date || isNaN(date.getTime())) return;

            const weekKey = getWeekKey(date);
            const mucKe = record.muc_trung_bay;
            if (!mucKe) return;

            const target = isUploadedRecord(record) ? weekly : weeklyNotUploaded;
            if (!target[weekKey]) target[weekKey] = {};
            if (!target[weekKey][npp]) target[weekKey][npp] = { levels: {} };
            target[weekKey][npp].levels[mucKe] = (target[weekKey][npp].levels[mucKe] || 0) + getLevelWeight(mucKe);
        });
    });

    sortedWeeks = Array.from(new Set([
        ...Object.keys(weekly),
        ...Object.keys(weeklyNotUploaded)
    ])).sort(compareWeeks);
    weeklyUploadData = weekly;
    weeklyNotUploadedData = weeklyNotUploaded;
}

let rawApiData = null;

async function fetchReportData() {
    const response = await fetch(buildApiUrl(), {
        method: 'GET',
        headers: {
            Authorization: API_CONFIG.auth,
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API lỗi ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();
    rawApiData = apiData;
    return transformApiResponse(apiData);
}

async function loadDataFromApi() {
    const { uploaded, notUploaded } = await fetchReportData();
    uploadedData = uploaded;
    notUploadedData = notUploaded;
    try {
        if (rawApiData) {
            extractWeeklyData(rawApiData);
        }
    } catch (e) {
        console.warn('Lỗi xử lý dữ liệu tuần:', e);
    }
    return { uploaded, notUploaded };
}
