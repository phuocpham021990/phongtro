// DỮ LIỆU MẶC ĐỊNH
const DEFAULT_ROOMS = [
    { 
        id: 1, 
        ten_phong: "Phòng 101", 
        gia_thue: 2500000,
        billing: { priceElec: 3000, oldElec: 100, newElec: 145, waterFee: 50000, garbageFee: 36000, surchargeFee: 0 },
        contract: { depositAmount: 2500000, startDate: "2026-01-01", contractMonths: 12, note: "Cọc 1 tháng" },
        tenants: [{ name: "Nguyễn Văn A", birth: "1998", cccd: "079123456789", role: "Chủ hộ", docImg: "" }],
        equipments: [],
        historyBilling: []
    }
];

let roomsData = [];
let activeRoomId = null;

// ==========================================
// 1. TÍNH NĂNG TỰ ĐỘNG LƯU LOCALSTORAGE
// ==========================================
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('quanLyPhongTro_Data');
    if (savedData) {
        try { roomsData = JSON.parse(savedData); } catch (e) { roomsData = DEFAULT_ROOMS; }
    } else {
        roomsData = DEFAULT_ROOMS;
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('quanLyPhongTro_Data', JSON.stringify(roomsData));
}

// ==========================================
// 2. HIỂN THỊ DANH SÁCH PHÒNG
// ==========================================
function renderRoomGrid(filteredList = null) {
    const grid = document.getElementById('roomGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const listToRender = filteredList || roomsData;
    if (listToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Không tìm thấy phòng nào phù hợp.</p>';
        return;
    }

    listToRender.forEach(room => {
        const isOccupied = room.tenants && room.tenants.length > 0;
        const statusBadge = isOccupied 
            ? '<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">ĐÃ THUÊ</span>' 
            : '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">TRỐNG</span>';

        const card = document.createElement('div');
        card.className = 'room-card';
        card.onclick = () => openRoomModal(room);
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <h3 style="margin:0;">${room.ten_phong}</h3>
                ${statusBadge}
            </div>
            <p style="color: #1a73e8; font-size: 16px;">${Number(room.gia_thue).toLocaleString('vi-VN')} đ/tháng</p>
            <p style="font-size: 12px; color: #666; margin-top: 4px;">👥 ${room.tenants ? room.tenants.length : 0} người ở</p>
            <div style="margin-top: 12px; display: flex; gap: 6px; justify-content: center;" onclick="event.stopPropagation()">
                <button onclick="editRoomName(${room.id})" style="background:#ffc107; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">✏️ Sửa tên</button>
                <button onclick="deleteRoom(${room.id})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ Xóa</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterRooms() {
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = roomsData.filter(room => {
        const isOccupied = room.tenants && room.tenants.length > 0;
        let matchStatus = true;
        if (statusFilter === 'OCCUPIED') matchStatus = isOccupied;
        if (statusFilter === 'EMPTY') matchStatus = !isOccupied;

        let matchSearch = room.ten_phong.toLowerCase().includes(searchText);
        if (!matchSearch && room.tenants) {
            matchSearch = room.tenants.some(t => (t.name && t.name.toLowerCase().includes(searchText)) || (t.cccd && t.cccd.includes(searchText)));
        }
        return matchStatus && matchSearch;
    });
    renderRoomGrid(filtered);
}

function editRoomName(roomId) {
    const room = roomsData.find(r => r.id === roomId);
    if (!room) return;
    const newName = prompt("Nhập tên phòng mới:", room.ten_phong);
    if (newName && newName.trim() !== "") {
        room.ten_phong = newName.trim();
        saveToLocalStorage();
        renderRoomGrid();
    }
}

function deleteRoom(roomId) {
    if (confirm("Bạn có chắc chắn muốn xóa phòng này không?")) {
        roomsData = roomsData.filter(r => r.id !== roomId);
        saveToLocalStorage();
        renderRoomGrid();
    }
}

// ==========================================
// 3. XỬ LÝ MODAL CHI TIẾT PHÒNG
// ==========================================
function openRoomModal(room) {
    activeRoomId = room.id;
    document.getElementById('modalRoomTitle').innerText = `Chi tiết ${room.ten_phong}`;
    document.getElementById('roomModal').classList.remove('hidden');
    
    const now = new Date();
    document.getElementById('billMonth').value = now.getMonth() + 1;
    document.getElementById('billYear').value = now.getFullYear();

    const b = room.billing || { priceElec: 3000, oldElec: 0, newElec: 0, waterFee: 0, surchargeFee: 0 };
    document.getElementById('priceElec').value = b.priceElec;
    document.getElementById('oldElec').value = b.oldElec;
    document.getElementById('newElec').value = b.newElec;
    document.getElementById('roomRent').value = room.gia_thue;
    document.getElementById('waterFee').value = b.waterFee;
    document.getElementById('surchargeFee').value = b.surchargeFee;

    autoCapNhatTienRac();
    openTab('tabTenants');
    renderTenants();
    renderEquipments();
    calculateTotalBill();
}

function closeModal() {
    document.getElementById('roomModal').classList.add('hidden');
}

function openTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==========================================
// 4. QUẢN LÝ TIỀN PHÒNG & TẠO PHIẾU THU (CÓ QR NGÂN HÀNG)
// ==========================================
function tinhTienRac(soNguoi, thangThu, namThu) {
    let tienRac = 0;
    let ghiChuRac = "";
    const apDungGiaMoi = (namThu > 2026) || (namThu === 2026 && thangThu >= 10);

    if (apDungGiaMoi) {
        if (soNguoi < 3) {
            tienRac = 36000;
            ghiChuRac = "(gồm 26.000đ tiền thu gom và 10.000đ vận chuyển)";
        } else {
            tienRac = 71000;
            ghiChuRac = "(gồm 52.000đ tiền thu gom, 19.000đ vận chuyển)";
        }
    } else {
        tienRac = 20000;
        ghiChuRac = "";
    }
    return { soTien: tienRac, ghiChu: ghiChuRac };
}

function autoCapNhatTienRac() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;
    const soNguoi = (room.tenants) ? room.tenants.length : 0;
    const monthEl = document.getElementById('billMonth');
    const yearEl = document.getElementById('billYear');
    if (!monthEl || !yearEl) return;
    
    const thang = parseInt(monthEl.value);
    const nam = parseInt(yearEl.value);

    const ketQua = tinhTienRac(soNguoi, thang, nam);
    const garbageFeeEl = document.getElementById('garbageFee');
    const ghiChuEl = document.getElementById('ghiChuTienRac');
    if (garbageFeeEl) garbageFeeEl.value = ketQua.soTien;
    if (ghiChuEl) ghiChuEl.innerText = ketQua.ghiChu;
    calculateTotalBill();
}

function calculateTotalBill() {
    const priceElec = Number(document.getElementById('priceElec').value) || 0;
    const oldElec = Number(document.getElementById('oldElec').value) || 0;
    const newElec = Number(document.getElementById('newElec').value) || 0;
    
    const roomRent = Number(document.getElementById('roomRent').value) || 0;
    const waterFee = Number(document.getElementById('waterFee').value) || 0;
    const garbageFee = Number(document.getElementById('garbageFee').value) || 0;
    const surchargeFee = Number(document.getElementById('surchargeFee').value) || 0;

    const elecUsage = Math.max(0, newElec - oldElec);
    const elecTotal = elecUsage * priceElec;
    const grandTotal = elecTotal + roomRent + waterFee + garbageFee + surchargeFee;

    const grandTotalEl = document.getElementById('grandTotalDisplay');
    if (grandTotalEl) grandTotalEl.innerText = grandTotal.toLocaleString('vi-VN') + ' VNĐ';
    return { elecUsage, elecTotal, grandTotal, priceElec, oldElec, newElec, roomRent, waterFee, garbageFee, surchargeFee };
}

// TÍNH NĂNG TẠO PHIẾU THU & MÃ QR NGÂN HÀNG (LƯU TRỮ TÀI KHOẢN CHO CÁC LẦN SAU)
function openReceiptModal() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;

    // 1. Kiểm tra xem đã lưu tài khoản ngân hàng trước đó chưa
    let savedBank = localStorage.getItem('phuoc_bank_info');
    let bankData = savedBank ? JSON.parse(savedBank) : null;

    // Nếu chưa có, hiện cửa sổ yêu cầu nhập và lưu lại
    if (!bankData || !bankData.bankId || !bankData.accountNo) {
        let bankIdInput = prompt("Nhập mã Ngân hàng (Ví dụ: VCB, TCB, MB, ACB, BIDV...):", "VCB");
        if (!bankIdInput) return;
        let accountNoInput = prompt("Nhập Số tài khoản ngân hàng:", "");
        if (!accountNoInput) return;
        let accountNameInput = prompt("Nhập Tên chủ tài khoản (Không dấu, ví dụ: PHAM HONG PHUOC):", "PHAM HONG PHUOC");

        bankData = {
            bankId: bankIdInput.trim().toUpperCase(),
            accountNo: accountNoInput.trim(),
            accountName: accountNameInput ? accountNameInput.trim().toUpperCase() : ""
        };

        // Lưu vào LocalStorage cho các lần sau
        localStorage.setItem('phuoc_bank_info', JSON.stringify(bankData));
    }

    const b = calculateTotalBill();
    const month = document.getElementById('billMonth').value;
    const year = document.getElementById('billYear').value;
    const soNguoi = room.tenants ? room.tenants.length : 0;
    const racInfo = tinhTienRac(soNguoi, parseInt(month), parseInt(year));

    // Hiển thị nội dung phiếu thu
    const receiptHTML = `
        <h3>PHIẾU THU TIỀN PHÒNG (Tháng ${month}/${year})</h3>
        <p style="text-align:center; margin-top:0;"><strong>${room.ten_phong}</strong></p>
        <div class="receipt-line"><span>🏠 Tiền phòng:</span> <strong>${b.roomRent.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>⚡ Số điện cũ - mới:</span> <span>${b.oldElec} - ${b.newElec} (${b.elecUsage} kWh)</span></div>
        <div class="receipt-line"><span>⚡ Tiền điện (${b.priceElec.toLocaleString('vi-VN')}đ/kWh):</span> <strong>${b.elecTotal.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>💧 Tiền nước:</span> <strong>${b.waterFee.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>🗑️ Tiền rác:</span> <strong>${b.garbageFee.toLocaleString('vi-VN')} đ</strong></div>
        <div style="font-size: 11px; color: #666; font-style: italic; text-align: right;">${racInfo.ghiChu}</div>
        <div class="receipt-line"><span>➕ Phụ thu:</span> <strong>${b.surchargeFee.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line receipt-total"><span>💰 TỔNG THANH TOÁN:</span> <span>${b.grandTotal.toLocaleString('vi-VN')} VNĐ</span></div>
        <p style="font-size: 12px; text-align: center; color: #666; margin-top: 10px;">Chủ TK: ${bankData.accountName} | ${bankData.bankId}: ${bankData.accountNo}</p>
    `;
    document.getElementById('receiptPreview').innerHTML = receiptHTML;

    // 2. Tự động tạo mã QR chuyển khoản VietQR với số tiền ấn định
    const contentNote = encodeURIComponent(`Tien phong ${room.ten_phong} T${month}`);
    const qrImageUrl = `https://img.vietqr.io/image/${bankData.bankId}-${bankData.accountNo}-compact2.jpg?amount=${b.grandTotal}&addInfo=${contentNote}`;
    
    document.getElementById('qrImageWrapper').innerHTML = `
        <img src="${qrImageUrl}" alt="Mã QR Chuyển Khoản" style="max-width: 200px; height: auto; border-radius: 6px; border: 1px solid #ddd;" onerror="this.onerror=null; alert('Không thể tạo mã QR. Vui lòng kiểm tra lại Mã ngân hàng hoặc Số tài khoản đã nhập!');">
        <p style="font-size: 11px; color: #555; margin: 5px 0 0 0;">Quét mã QR qua app Ngân hàng để chuyển khoản chính xác số tiền.</p>
    `;

    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
}

// TÍNH NĂNG MỚI: CHỤP ẢNH HÓA ĐƠN & GỬI ZALO BÁN TỰ ĐỘNG
async function copyZaloImageAndOpenChat() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;

    // Kiểm tra xem phòng đã có số điện thoại của khách chưa (lấy từ thông tin người ở đầu tiên hoặc lưu ý)
    // Giả sử bạn lưu số điện thoại ở phần ghi chú hợp đồng hoặc bạn có thể nhập nhanh
    let sdtKhach = prompt(`Nhập số điện thoại Zalo của khách phòng ${room.ten_phong}:`, room.contract?.phone || "");
    if (!sdtKhach) return;

    const receiptElement = document.getElementById('receiptPreview');
    const qrElement = document.getElementById('qrImageWrapper');
    
    // Tạo một khung tạm thời chứa cả phiếu thu và mã QR để chụp chung 1 bức ảnh hoàn chỉnh
    const container = document.createElement('div');
    container.style.cssText = "padding: 20px; background: white; width: 400px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px;";
    container.innerHTML = receiptElement.innerHTML + `<div style="text-align: center; margin-top: 15px;">` + qrElement.innerHTML + `</div>`;
    document.body.appendChild(container);

    try {
        // Chụp khung HTML thành ảnh canvas
        const canvas = await html2canvas(container, { scale: 2, useCORS: true });
        
        canvas.toBlob(async (blob) => {
            document.body.removeChild(container);
            if (!blob) {
                alert("Không thể tạo hình ảnh hóa đơn!");
                return;
            }

            try {
                // Đưa hình ảnh vào bộ nhớ tạm (Clipboard)
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);

                // Mở link chat Zalo với số điện thoại của khách
                window.open(`https://zalo.me/${sdtKhach.trim()}`, '_blank');

                // Thông báo hướng dẫn nhanh cho bạn thao tác
                alert("✨ Đã chụp ảnh phiếu thu và LƯU VÀO BỘ NHỚ TẠM!\n\n👉 Bạn chỉ cần bấm vào khung chat Zalo của khách và nhấn phím [Ctrl + V] sau đó ấn [Enter] là xong!");
            } catch (clipErr) {
                console.error(clipErr);
                alert("Trình duyệt chặn quyền ghi nhớ ảnh tạm. Bạn hãy dùng cách chụp màn hình thủ công nhé!");
            }
        }, "image/png");

    } catch (err) {
        if (document.body.contains(container)) document.body.removeChild(container);
        console.error(err);
        alert("Có lỗi khi tạo ảnh hóa đơn.");
    }
}

function printReceipt() {
    window.print();
}

// Lưu thông tin hóa đơn vào lịch sử tháng
function saveBillingData() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;
    const b = calculateTotalBill();
    const month = parseInt(document.getElementById('billMonth').value);
    const year = parseInt(document.getElementById('billYear').value);

    room.gia_thue = b.roomRent;
    room.billing = { priceElec: b.priceElec, oldElec: b.oldElec, newElec: b.newElec, waterFee: b.waterFee, garbageFee: b.garbageFee, surchargeFee: b.surchargeFee };

    if (!room.historyBilling) room.historyBilling = [];
    const now = new Date();
    const record = {
        month, year,
        roomName: room.ten_phong,
        roomRent: b.roomRent,
        elecUsage: b.elecUsage,
        elecTotal: b.elecTotal,
        waterFee: b.waterFee,
        garbageFee: b.garbageFee,
        surchargeFee: b.surchargeFee,
        grandTotal: b.grandTotal,
        savedAt: `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`
    };

    const idx = room.historyBilling.findIndex(h => h.month === month && h.year === year);
    if (idx >= 0) room.historyBilling[idx] = record;
    else room.historyBilling.push(record);

    saveToLocalStorage();
    alert(`Đã lưu thành công dữ liệu tiền phòng ${room.ten_phong} cho Tháng ${month}/${year}!`);
    renderRoomGrid();
}

// ==========================================
// 5. CÁC TAB KHÁC (CON NGƯỜI, THIẾT BỊ, HỢP ĐỒNG, BÁO CÁO)
// ==========================================
function initTenantForm() {
    const tenantForm = document.getElementById('tenantForm');
    if (!tenantForm) return;
    tenantForm.onsubmit = function(e) {
        e.preventDefault(); 
        const fileInput = document.getElementById('tenantDocImg');
        const file = fileInput ? fileInput.files[0] : null;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) { processSaveTenant(event.target.result); };
            reader.readAsDataURL(file);
        } else {
            const editIdx = Number(document.getElementById('editingTenantIndex').value);
            const room = roomsData.find(r => r.id === activeRoomId);
            const oldImg = (editIdx >= 0 && room && room.tenants && room.tenants[editIdx]) ? room.tenants[editIdx].docImg : '';
            processSaveTenant(oldImg);
        }
    };
}

function processSaveTenant(imgSrc) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;
    const editIdx = Number(document.getElementById('editingTenantIndex').value);
    const tenantData = {
        name: document.getElementById('tenantName').value.trim(),
        birth: document.getElementById('tenantBirth').value.trim(),
        cccd: document.getElementById('tenantCCCD').value.trim(),
        role: document.getElementById('tenantRole').value.trim(),
        docImg: imgSrc || ''
    };

    if (!room.tenants) room.tenants = [];
    if (editIdx >= 0) room.tenants[editIdx] = tenantData;
    else room.tenants.push(tenantData);

    saveToLocalStorage();
    resetTenantForm();
    renderTenants();
    renderRoomGrid();
}

function editTenant(index) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room || !room.tenants[index]) return;
    const t = room.tenants[index];
    document.getElementById('editingTenantIndex').value = index;
    document.getElementById('tenantName').value = t.name;
    document.getElementById('tenantBirth').value = t.birth;
    document.getElementById('tenantCCCD').value = t.cccd;
    document.getElementById('tenantRole').value = t.role;
    document.getElementById('tenantFormTitle').innerText = "✏️ Chỉnh sửa thông tin người ở";
    document.getElementById('btnSaveTenant').innerText = "Cập nhật người ở";
    document.getElementById('btnCancelTenant').classList.remove('hidden');
}

function deleteTenant(index) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (room && confirm("Xóa người ở này khỏi danh sách?")) {
        room.tenants.splice(index, 1);
        saveToLocalStorage();
        renderTenants();
        renderRoomGrid();
    }
}

function resetTenantForm() {
    const form = document.getElementById('tenantForm');
    if (form) form.reset();
    document.getElementById('editingTenantIndex').value = "-1";
    document.getElementById('tenantFormTitle').innerText = "Thêm người ở mới";
    document.getElementById('btnSaveTenant').innerText = "+ Thêm người ở";
    document.getElementById('btnCancelTenant').classList.add('hidden');
}

function renderTenants() {
    const room = roomsData.find(r => r.id === activeRoomId);
    const container = document.getElementById('tenantList');
    if (!room || !container) return;
    container.innerHTML = (!room.tenants || room.tenants.length === 0) ? '<p style="color:#666; padding: 10px 0;">Chưa có người ở trong phòng này</p>' : '';
    if (room.tenants) {
        room.tenants.forEach((t, i) => {
            const item = document.createElement('div');
            item.className = 'tenant-card';
            item.style.cssText = "display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ddd;";
            item.innerHTML = `
                ${t.docImg ? `<img src="${t.docImg}" class="tenant-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" alt="CCCD">` : '<div style="width:60px; height:60px; background:#eee; text-align:center; line-height:60px; font-size:12px; border-radius:4px;">Không ảnh</div>'}
                <div style="flex:1">
                    <strong style="font-size: 15px;">${t.name}</strong> (${t.birth}) - <span style="color:#1a73e8; font-weight:bold">${t.role}</span><br>
                    <small style="color: #555;">CCCD: ${t.cccd}</small>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button type="button" onclick="editTenant(${i})" style="background:#ffc107; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">✏️ Sửa</button>
                    <button type="button" onclick="deleteTenant(${i})" style="background:#dc3545; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ Xóa</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
}

// Thiết bị & Hợp đồng
document.getElementById('equipForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;
    const editIdx = Number(document.getElementById('editingEquipIndex').value);
    const qty = Number(document.getElementById('equipQty').value);
    const price = Number(document.getElementById('equipUnitPrice').value);
    const equipData = {
        name: document.getElementById('equipName').value,
        replaceName: document.getElementById('replaceName').value || '-',
        replaceDate: document.getElementById('replaceDate').value || '-',
        qty: qty, unitPrice: price, total: qty * price
    };
    if (!room.equipments) room.equipments = [];
    if (editIdx >= 0) room.equipments[editIdx] = equipData;
    else room.equipments.push(equipData);
    saveToLocalStorage();
    resetEquipForm();
    renderEquipments();
});

function editEquipment(index) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room || !room.equipments[index]) return;
    const eq = room.equipments[index];
    document.getElementById('editingEquipIndex').value = index;
    document.getElementById('equipName').value = eq.name;
    document.getElementById('replaceName').value = eq.replaceName === '-' ? '' : eq.replaceName;
    document.getElementById('replaceDate').value = eq.replaceDate === '-' ? '' : eq.replaceDate;
    document.getElementById('equipQty').value = eq.qty;
    document.getElementById('equipUnitPrice').value = eq.unitPrice;
}

function deleteEquipment(index) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (room && confirm("Xóa thiết bị này khỏi phòng?")) {
        room.equipments.splice(index, 1);
        saveToLocalStorage();
        renderEquipments();
    }
}

function resetEquipForm() {
    document.getElementById('equipForm').reset();
    document.getElementById('editingEquipIndex').value = "-1";
}

function renderEquipments() {
    const room = roomsData.find(r => r.id === activeRoomId);
    const tbody = document.getElementById('equipTableBody');
    if (!room || !tbody) return;
    tbody.innerHTML = '';
    if (room.equipments) {
        room.equipments.forEach((eq, i) => {
            tbody.innerHTML += `<tr><td><strong>${eq.name}</strong></td><td>${eq.replaceName}</td><td>${eq.replaceDate}</td><td>${eq.qty}</td><td>${eq.unitPrice.toLocaleString('vi-VN')} đ</td><td><strong style="color:#28a745">${eq.total.toLocaleString('vi-VN')} đ</strong></td><td><button onclick="editEquipment(${i})" style="background:#ffc107; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">✏️</button> <button onclick="deleteEquipment(${i})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️</button></td></tr>`;
        });
    }
}

function saveContractData() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;
    room.contract = {
        depositAmount: Number(document.getElementById('depositAmount').value) || 0,
        startDate: document.getElementById('startDate').value || '',
        contractMonths: Number(document.getElementById('contractMonths').value) || 12,
        note: document.getElementById('contractNote').value || ''
    };
    saveToLocalStorage();
    alert("Đã lưu thông tin hợp đồng và tiền cọc!");
}

function advanceAllElectricityMeters() {
    if (confirm("Chốt kỳ đầu tháng: Chuyển toàn bộ 'Số điện mới' thành 'Số điện cũ'?")) {
        roomsData.forEach(room => { if (room.billing) room.billing.oldElec = room.billing.newElec || room.billing.oldElec; });
        saveToLocalStorage();
        alert("Đã chốt kỳ thành công!");
        renderRoomGrid();
    }
}

// Báo cáo & Excel
function openGlobalReportModal() {
    const now = new Date();
    document.getElementById('reportMonth').value = now.getMonth() + 1;
    document.getElementById('reportYear').value = now.getFullYear();
    renderReportTable();
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() { document.getElementById('reportModal').classList.add('hidden'); }

function renderReportTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    const selectedMonth = parseInt(document.getElementById('reportMonth').value);
    const selectedYear = parseInt(document.getElementById('reportYear').value);
    tbody.innerHTML = '';
    let totalRevenue = 0, stt = 1;

    roomsData.forEach(room => {
        if (room.historyBilling && room.historyBilling.length > 0) {
            const history = room.historyBilling.find(h => h.month === selectedMonth && h.year === selectedYear);
            if (history) {
                totalRevenue += history.grandTotal;
                tbody.innerHTML += `<tr><td>${stt++}</td><td><strong>${history.roomName}</strong></td><td>${history.roomRent.toLocaleString('vi-VN')} đ</td><td>${history.elecTotal.toLocaleString('vi-VN')} đ</td><td>${history.waterFee.toLocaleString('vi-VN')} đ</td><td>${history.garbageFee.toLocaleString('vi-VN')} đ</td><td>${history.surchargeFee.toLocaleString('vi-VN')} đ</td><td><strong style="color:#28a745">${history.grandTotal.toLocaleString('vi-VN')} đ</strong></td><td><small>${history.savedAt}</small></td></tr>`;
            }
        }
    });
    if (stt === 1) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#888; padding:20px;">Chưa có dữ liệu trong Tháng ${selectedMonth}/${selectedYear}</td></tr>`;
    document.getElementById('globalTotalDisplay').innerText = totalRevenue.toLocaleString('vi-VN') + ' VNĐ';
}

function exportInvoicesToExcel() {
    const selectedMonth = parseInt(document.getElementById('reportMonth').value);
    const selectedYear = parseInt(document.getElementById('reportYear').value);
    let exportData = [], stt = 1;
    roomsData.forEach(room => {
        if (room.historyBilling) {
            const h = room.historyBilling.find(x => x.month === selectedMonth && x.year === selectedYear);
            if (h) exportData.push({ "STT": stt++, "Tên Phòng": h.roomName, "Tiền Phòng": h.roomRent, "Điện (kWh)": h.elecUsage, "Tiền Điện": h.elecTotal, "Tiền Nước": h.waterFee, "Tiền Rác": h.garbageFee, "Phụ Thu": h.surchargeFee, "TỔNG CỘNG": h.grandTotal, "Thời Gian": h.savedAt });
        }
    });
    if (exportData.length === 0) { alert("Không có dữ liệu để xuất Excel!"); return; }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DoanhThu");
    XLSX.writeFile(wb, `Bao_Cao_Thang_${selectedMonth}_${selectedYear}.xls`);
}

function exportAllTenantsToExcel() {
    let allTenants = [], stt = 1;
    roomsData.forEach(room => {
        if (room.tenants) room.tenants.forEach(t => allTenants.push({ "STT": stt++, "Phòng": room.ten_phong, "Họ Tên": t.name, "Năm Sinh": t.birth, "CCCD": t.cccd, "Vai Trò": t.role }));
    });
    if (allTenants.length === 0) { alert("Chưa có khách thuê!"); return; }
    const ws = XLSX.utils.json_to_sheet(allTenants);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TamTru");
    XLSX.writeFile(wb, `Danh_Sach_Tam_Tru.xlsx`);
}

function exportBackupJSON() {
    const blob = new Blob([JSON.stringify(roomsData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            roomsData = JSON.parse(e.target.result);
            saveToLocalStorage();
            renderRoomGrid();
            alert("Phục hồi dữ liệu thành công!");
        } catch (err) { alert("Lỗi đọc file JSON!"); }
    };
    reader.readAsText(file);
}

document.getElementById('addRoomForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    roomsData.push({
        id: Date.now(),
        ten_phong: document.getElementById('newRoomName').value,
        gia_thue: Number(document.getElementById('newRoomPrice').value),
        billing: { priceElec: 3000, oldElec: 0, newElec: 0, waterFee: 0, garbageFee: 36000, surchargeFee: 0 },
        contract: { depositAmount: 0, startDate: '', contractMonths: 12, note: '' },
        tenants: [], equipments: [], historyBilling: []
    });
    saveToLocalStorage();
    document.getElementById('addRoomForm').reset();
    renderRoomGrid();
});
// ========================================================
// HỆ THỐNG SAO LƯU & PHỤC HỒI DỮ LIỆU TƯƠNG THÍCH MỌI THIẾT BỊ
// ========================================================
function normalizeRoomsData(dataArray) {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(room => {
        return {
            id: room.id || (Date.now() + Math.random()),
            ten_phong: room.ten_phong || room.name || "Phòng chưa tên",
            gia_thue: Number(room.gia_thue || room.price) || 0,
            so_nguoi: Number(room.so_nguoi || room.occupants) || 1,
            trang_thai: room.trang_thai || "Trong",
            chi_so_dien_cu: Number(room.chi_so_dien_cu) || 0,
            chi_so_nuoc_cu: Number(room.chi_so_nuoc_cu) || 0,
            contract: room.contract || { tenant_name: "", phone: "", start_date: "" },
            note: room.note || ""
        };
    });
}

function processImportedJSON(jsonText) {
    try {
        if (jsonText.charCodeAt(0) === 0xFEFF) jsonText = jsonText.slice(1);
        const parsed = JSON.parse(jsonText.trim());
        let importedRooms = [];

        if (Array.isArray(parsed)) {
            importedRooms = parsed;
        } else if (parsed && typeof parsed === 'object') {
            importedRooms = parsed.roomsData || parsed.rooms || [];
            if (parsed.bankInfo) {
                localStorage.setItem('phuoc_bank_info', JSON.stringify(parsed.bankInfo));
            }
        } else {
            throw new Error("Cấu trúc file sao lưu không hợp lệ!");
        }

        if (importedRooms.length === 0) {
            alert("⚠️ File sao lưu trống hoặc không chứa danh sách phòng!");
            return false;
        }

        const cleanedRooms = normalizeRoomsData(importedRooms);
        
        // Lưu thẳng vào bộ nhớ localStorage của trình duyệt
        localStorage.setItem('phuoc_rooms_data', JSON.stringify(cleanedRooms));

        alert(`🎉 PHỤC HỒI THÀNH CÔNG!\nĐã nạp dữ liệu cho ${cleanedRooms.length} phòng. Trang web sẽ tự động làm mới để hiển thị.`);
        
        // Tự động tải lại trang ngay lập tức để ứng dụng nhận dữ liệu mới
        location.reload();
        return true;
    } catch (err) {
        console.error("Lỗi đọc JSON:", err);
        alert("❌ Không thể đọc file sao lưu này!\nChi tiết lỗi: " + err.message);
        return false;
    }
}

function exportDataJSON() {
    try {
        const backupData = {
            version: "2.0",
            exportDate: new Date().toISOString(),
            roomsData: typeof roomsData !== 'undefined' ? roomsData : [],
            bankInfo: JSON.parse(localStorage.getItem('phuoc_bank_info') || '{}')
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const fileName = `PhongTro_Backup_${new Date().toISOString().slice(0,10)}.json`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
        alert("✅ Đã tải file sao lưu về máy!");
    } catch (err) {
        alert("❌ Lỗi khi xuất file sao lưu: " + err.message);
    }
}

function importDataFromFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        processImportedJSON(e.target.result);
        event.target.value = '';
    };
    reader.onerror = function() {
        alert("❌ Không thể mở file trên thiết bị này!");
        event.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
}

function importDataFromTextPaste() {
    const jsonInput = prompt("👉 Dán toàn bộ nội dung file JSON sao lưu của bạn vào ô dưới đây:");
    if (!jsonInput || !jsonInput.trim()) return;
    processImportedJSON(jsonInput.trim());
}
// Khởi chạy hệ thống
loadFromLocalStorage();
renderRoomGrid();
initTenantForm();
