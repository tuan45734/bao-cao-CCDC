// Cấu hình API Mobiwork
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
        timeApprove: '',
        order_sdate: '1777568400000',
        order_edate: '1780246799999',
        sDate: '1777568400000',
        eDate: '1780160400000'
    }
};

let uploadedData = [];
let notUploadedData = [];

function buildApiUrl() {
    const query = new URLSearchParams(API_CONFIG.params);
    return `${API_CONFIG.baseUrl}?${query.toString()}`;
}

function isGsApproved(record) {
    return !!(record.nv_cham_gs && record.nv_cham_gs.date);
}

function transformApiResponse(apiData) {
    const uploaded = [];
    const notUploaded = [];
    const uploadedAgg = new Map();
    const notUploadedAgg = new Map();

    const result = apiData.result || {};

    Object.values(result).forEach(entry => {
        const npp = (entry.group || '').trim();
        if (!npp || !npp.startsWith('NPP')) return;

        (entry.data || []).forEach(record => {
            const mucKe = record.muc_trung_bay;
            if (!mucKe) return;

            const map = isGsApproved(record) ? uploadedAgg : notUploadedAgg;
            const key = `${npp}|${mucKe}`;
            map.set(key, (map.get(key) || 0) + 1);
        });
    });

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
    return transformApiResponse(apiData);
}

async function loadDataFromApi() {
    const { uploaded, notUploaded } = await fetchReportData();
    uploadedData = uploaded;
    notUploadedData = notUploaded;
    return { uploaded, notUploaded };
}
