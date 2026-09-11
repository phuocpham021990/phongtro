// DỮ LIỆU MẶC ĐỊNH
const DEFAULT_ROOMS = [
    { 
        id: 1, 
        ten_phong: "Phòng 101", 
        gia_thue: 2500000,
        billing: { priceElec: 3000, oldElec: 100, newElec: 145, waterFee: 50000, garbageFee: 30000, surchargeFee: 0 },
        contract: { depositAmount: 2500000, startDate: "2026-01-01", contractMonths: 12, note: "Cọc 1 tháng" },
        tenants: [],
        equipments: []
    },
    { 
        id: 2, 
        ten_phong: "Phòng 102", 
        gia_thue: 3000000,
        billing: { priceElec: 3000, oldElec: 210, newElec: 260, waterFee: 50000, garbageFee: 30000, surchargeFee: 0 },
        contract: { depositAmount: 3000000, startDate: "2026-02-01", contractMonths: 12, note: "" },
        tenants: [],
        equipments: []
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
        try {
            roomsData = JSON.parse(savedData);
        } catch (e) {
            roomsData = DEFAULT_ROOMS;
        }
    } else {
        roomsData = DEFAULT_ROOMS;
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('quanLyPhongTro_Data', JSON.stringify(roomsData));
}

// ==========================================
// 2. GIÁM SÁT & HIỂN THỊ DANH SÁCH PHÒNG
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
            matchSearch = room.tenants.some(t => 
                (t.name && t.name.toLowerCase().includes(searchText)) || 
                (t.cccd && t.cccd.includes(searchText))
            );
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
// 3. XỬ LÝ CỬA SỔ MODAL CHI TIẾT PHÒNG
// ==========================================
function openRoomModal(room) {
    activeRoomId = room.id;
    document.getElementById('modalRoomTitle').innerText = `Chi tiết ${room.ten_phong}`;
    document.getElementById('roomModal').classList.remove('hidden');
    
    const b = room.billing || { priceElec: 3000, oldElec: 0, newElec: 0, waterFee: 0, garbageFee: 0, surchargeFee: 0 };
    document.getElementById('priceElec').value = b.priceElec;
    document.getElementById('oldElec').value = b.oldElec;
    document.getElementById('newElec').value = b.newElec;
    document.getElementById('roomRent').value = room.gia_thue;
    document.getElementById('waterFee').value = b.waterFee;
    document.getElementById('garbageFee').value = b.garbageFee;
    document.getElementById('surchargeFee').value = b.surchargeFee;

    const c = room.contract || { depositAmount: 0, startDate: '', contractMonths: 12, note: '' };
    document.getElementById('depositAmount').value = c.depositAmount || 0;
    document.getElementById('startDate').value = c.startDate || '';
    document.getElementById('contractMonths').value = c.contractMonths || 12;
    document.getElementById('contractNote').value = c.note || '';

    resetTenantForm();
    resetEquipForm();
    
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
// 4. TAB 1: QUẢN LÝ CON NGƯỜI (ĐÃ SỬA LỖI)
// ==========================================

// Khởi tạo gán sự kiện cho form thêm/sửa người ở
function initTenantForm() {
    const tenantForm = document.getElementById('tenantForm');
    if (!tenantForm) return;

    // Loại bỏ sự kiện cũ nếu có để tránh trùng lặp
    tenantForm.onsubmit = function(e) {
        e.preventDefault(); // Chống tải lại trang

        const fileInput = document.getElementById('tenantDocImg');
        const file = fileInput ? fileInput.files[0] : null;

        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                processSaveTenant(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            const editIdx = Number(document.getElementById('editingTenantIndex').value);
            const room = roomsData.find(r => r.id === activeRoomId);
            const oldImg = (editIdx >= 0 && room && room.tenants && room.tenants[editIdx]) 
                ? room.tenants[editIdx].docImg 
                : '';
            processSaveTenant(oldImg);
        }
    };
}

function processSaveTenant(imgSrc) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) {
        alert("Không tìm thấy thông tin phòng hiện tại!");
        return;
    }

    const editIdx = Number(document.getElementById('editingTenantIndex').value);
    const tenantData = {
        name: document.getElementById('tenantName').value.trim(),
        birth: document.getElementById('tenantBirth').value.trim(),
        cccd: document.getElementById('tenantCCCD').value.trim(),
        role: document.getElementById('tenantRole').value.trim(),
        docImg: imgSrc || ''
    };

    if (!room.tenants) room.tenants = [];

    if (editIdx >= 0) {
        room.tenants[editIdx] = tenantData;
    } else {
        room.tenants.push(tenantData);
    }

    saveToLocalStorage();
    resetTenantForm();
    renderTenants();
    renderRoomGrid();
}

function editTenant(index) {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room || !room.tenants || !room.tenants[index]) return;

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

    container.innerHTML = (!room.tenants || room.tenants.length === 0) 
        ? '<p style="color:#666; padding: 10px 0;">Chưa có người ở trong phòng này</p>' 
        : '';
    
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

// ==========================================
// 5. TAB 2: QUẢN LÝ TIỀN PHÒNG & XUẤT PHIẾU THU ZALO
// ==========================================
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

    document.getElementById('grandTotalDisplay').innerText = grandTotal.toLocaleString('vi-VN') + ' VNĐ';
    return { elecUsage, elecTotal, grandTotal, priceElec, oldElec, newElec, roomRent, waterFee, garbageFee, surchargeFee };
}

function saveBillingData() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;

    room.gia_thue = Number(document.getElementById('roomRent').value) || 0;
    room.billing = {
        priceElec: Number(document.getElementById('priceElec').value) || 0,
        oldElec: Number(document.getElementById('oldElec').value) || 0,
        newElec: Number(document.getElementById('newElec').value) || 0,
        waterFee: Number(document.getElementById('waterFee').value) || 0,
        garbageFee: Number(document.getElementById('garbageFee').value) || 0,
        surchargeFee: Number(document.getElementById('surchargeFee').value) || 0
    };

    saveToLocalStorage();
    alert("Đã lưu thông tin tiền phòng!");
    renderRoomGrid();
}

function openReceiptModal() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;

    const b = calculateTotalBill();
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}/${now.getFullYear()}`;

    const receiptHTML = `
        <h3>PHIẾU THU TIỀN PHÒNG (${monthYear})</h3>
        <p style="text-align:center; margin-top:0;"><strong>${room.ten_phong}</strong></p>
        <div class="receipt-line"><span>🏠 Tiền phòng:</span> <strong>${b.roomRent.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>⚡ Số điện cũ - mới:</span> <span>${b.oldElec} - ${b.newElec} (${b.elecUsage} kWh)</span></div>
        <div class="receipt-line"><span>⚡ Tiền điện (${b.priceElec.toLocaleString('vi-VN')}đ/kWh):</span> <strong>${b.elecTotal.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>💧 Tiền nước:</span> <strong>${b.waterFee.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>🗑️ Tiền rác:</span> <strong>${b.garbageFee.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line"><span>➕ Phụ thu:</span> <strong>${b.surchargeFee.toLocaleString('vi-VN')} đ</strong></div>
        <div class="receipt-line receipt-total"><span>💰 TỔNG THANH TOÁN:</span> <span>${b.grandTotal.toLocaleString('vi-VN')} VNĐ</span></div>
        <p style="font-size: 12px; text-align: center; color: #666; margin-top: 15px;">Vui lòng thanh toán chuyển khoản hoặc tiền mặt. Xin cảm ơn!</p>
    `;

    document.getElementById('receiptPreview').innerHTML = receiptHTML;
    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
}

function copyZaloText() {
    const room = roomsData.find(r => r.id === activeRoomId);
    if (!room) return;

    const b = calculateTotalBill();
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}/${now.getFullYear()}`;

    const zaloText = 
`🧾 PHIẾU THU TIỀN PHÒNG - ${room.ten_phong.toUpperCase()}
📅 Tháng ${monthYear}
----------------------------------
🏠 Tiền phòng: ${b.roomRent.toLocaleString('vi-VN')} đ
⚡ Tiền điện: ${b.elecUsage} kWh (${b.oldElec} ➔ ${b.newElec}) x ${b.priceElec.toLocaleString('vi-VN')}đ = ${b.elecTotal.toLocaleString('vi-VN')} đ
💧 Tiền nước: ${b.waterFee.toLocaleString('vi-VN')} đ
🗑️ Tiền rác: ${b.garbageFee.toLocaleString('vi-VN')} đ
➕ Phụ thu: ${b.surchargeFee.toLocaleString('vi-VN')} đ
----------------------------------
💰 TỔNG CỘNG: ${b.grandTotal.toLocaleString('vi-VN')} VNĐ

📌 Anh/Chị vui lòng kiểm tra và thanh toán tiền phòng giúp em nhé. Xin cảm ơn!`;

    navigator.clipboard.writeText(zaloText).then(() => {
        alert("Đã sao chép tin nhắn phiếu thu! Bây giờ bạn chỉ cần mở Zalo và nhấn Dán (Ctrl + V) để gửi cho khách.");
    }).catch(err => {
        alert("Không thể tự động sao chép. Vui lòng thử lại!");
    });
}

function printReceipt() {
    window.print();
}

// ==========================================
// 6. TAB 3: QUẢN LÝ TRANG THIẾT BỊ
// ==========================================
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
        qty: qty,
        unitPrice: price,
        total: qty * price
    };

    if (!room.equipments) room.equipments = [];

    if (editIdx >= 0) {
        room.equipments[editIdx] = equipData;
    } else {
        room.equipments.push(equipData);
    }

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

    document.getElementById('equipFormTitle').innerText = "✏️ Chỉnh sửa thông tin thiết bị";
    document.getElementById('btnSaveEquip').innerText = "Cập nhật thiết bị";
    document.getElementById('btnCancelEquip').classList.remove('hidden');
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
    document.getElementById('equipFormTitle').innerText = "Thêm / Thay thế thiết bị";
    document.getElementById('btnSaveEquip').innerText = "+ Thêm thiết bị";
    document.getElementById('btnCancelEquip').classList.add('hidden');
}

function renderEquipments() {
    const room = roomsData.find(r => r.id === activeRoomId);
    const tbody = document.getElementById('equipTableBody');
    if (!room) return;

    tbody.innerHTML = '';
    if (room.equipments) {
        room.equipments.forEach((eq, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${eq.name}</strong></td>
                <td>${eq.replaceName}</td>
                <td>${eq.replaceDate}</td>
                <td>${eq.qty}</td>
                <td>${eq.unitPrice.toLocaleString('vi-VN')} đ</td>
                <td><strong style="color:#28a745">${eq.total.toLocaleString('vi-VN')} đ</strong></td>
                <td>
                    <button onclick="editEquipment(${i})" style="background:#ffc107; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">✏️ Sửa</button>
                    <button onclick="deleteEquipment(${i})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// ==========================================
// 7. TAB 4: HỢP ĐỒNG & TIỀN CỌC
// ==========================================
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

// ==========================================
// 8. TÍNH NĂNG CHỐT KỲ ĐIỆN NƯỚC ĐẦU THÁNG
// ==========================================
function advanceAllElectricityMeters() {
    if (confirm("Bạn có chắc chắn muốn CHỐT KỲ ĐẦU THÁNG?\n\nThao tác này sẽ chuyển toàn bộ 'Số điện mới' thành 'Số điện cũ' cho tất cả các phòng.")) {
        roomsData.forEach(room => {
            if (room.billing) {
                room.billing.oldElec = room.billing.newElec || room.billing.oldElec;
            }
        });
        saveToLocalStorage();
        alert("Đã cập nhật chốt kỳ thành công!");
        renderRoomGrid();
    }
}

// ==========================================
// 9. THỐNG KÊ DOANH THU & EXCEL
// ==========================================
function openGlobalReportModal() {
    renderReportTable();
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

function calculateRoomTotal(room) {
    const b = room.billing || { priceElec: 3000, oldElec: 0, newElec: 0, waterFee: 0, garbageFee: 0, surchargeFee: 0 };
    const elecUsage = Math.max(0, (b.newElec || 0) - (b.oldElec || 0));
    const elecTotal = elecUsage * (b.priceElec || 0);
    const roomRent = room.gia_thue || 0;
    const waterFee = b.waterFee || 0;
    const garbageFee = b.garbageFee || 0;
    const surchargeFee = b.surchargeFee || 0;
    const grandTotal = elecTotal + roomRent + waterFee + garbageFee + surchargeFee;

    return {
        roomName: room.ten_phong,
        isOccupied: room.tenants && room.tenants.length > 0,
        roomRent,
        elecUsage,
        elecTotal,
        waterFee,
        otherFees: garbageFee + surchargeFee,
        grandTotal
    };
}

function renderReportTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalRevenue = 0;

    roomsData.forEach(room => {
        const data = calculateRoomTotal(room);
        totalRevenue += data.grandTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${data.roomName}</strong></td>
            <td>${data.isOccupied ? '<span style="color:red;font-weight:bold;">Đã thuê</span>' : '<span style="color:green;font-weight:bold;">Trống</span>'}</td>
            <td>${data.roomRent.toLocaleString('vi-VN')} đ</td>
            <td>${data.elecUsage} kWh</td>
            <td>${data.elecTotal.toLocaleString('vi-VN')} đ</td>
            <td>${data.waterFee.toLocaleString('vi-VN')} đ</td>
            <td>${data.otherFees.toLocaleString('vi-VN')} đ</td>
            <td><strong style="color:#28a745">${data.grandTotal.toLocaleString('vi-VN')} đ</strong></td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('globalTotalDisplay').innerText = totalRevenue.toLocaleString('vi-VN') + ' VNĐ';
}

function exportInvoicesToExcel() {
    if (roomsData.length === 0) {
        alert("Không có dữ liệu để xuất Excel!");
        return;
    }

    const now = new Date();
    const monthYear = `${now.getMonth() + 1}_${now.getFullYear()}`;

    const excelData = roomsData.map((room, index) => {
        const data = calculateRoomTotal(room);
        return {
            "STT": index + 1,
            "Tên Phòng": data.roomName,
            "Trạng Thái": data.isOccupied ? "Đã thuê" : "Trống",
            "Tiền Phòng (VNĐ)": data.roomRent,
            "Điện Tiêu Thụ (kWh)": data.elecUsage,
            "Tiền Điện (VNĐ)": data.elecTotal,
            "Tiền Nước (VNĐ)": data.waterFee,
            "Rác & Phụ Thu (VNĐ)": data.otherFees,
            "TỔNG CỘNG (VNĐ)": data.grandTotal
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoaDon_Thang");

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 20 }
    ];

    XLSX.writeFile(workbook, `Danh_Sach_Hoa_Don_Thang_${monthYear}.xlsx`);
}

function exportAllTenantsToExcel() {
    let allTenants = [];
    let stt = 1;

    roomsData.forEach(room => {
        if (room.tenants && room.tenants.length > 0) {
            room.tenants.forEach(t => {
                allTenants.push({
                    "STT": stt++,
                    "Phòng Ở": room.ten_phong,
                    "Họ Và Tên": t.name,
                    "Năm Sinh": t.birth,
                    "Số CCCD": t.cccd,
                    "Vai Trò / Định Danh": t.role
                });
            });
        }
    });

    if (allTenants.length === 0) {
        alert("Hiện chưa có người ở nào được đăng ký trong hệ thống!");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allTenants);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhaiBaoTamTru");

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.writeFile(workbook, `Danh_Sach_Tam_Tru_Khach_Thue.xlsx`);
}

// ==========================================
// 10. SAO LƯU & PHỤC HỒI DỮ LIỆU (BACKUP / RESTORE JSON)
// ==========================================
function exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roomsData, null, 2));
    const downloadAnchor = document.createElement('a');
    const now = new Date();
    const fileName = `Backup_QuanLyPhongTro_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}.json`;

    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importBackupJSON(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            if (Array.isArray(parsedData)) {
                if (confirm("Bạn có chắc chắn muốn đè dữ liệu từ file phục hồi lên hệ thống hiện tại?")) {
                    roomsData = parsedData;
                    saveToLocalStorage();
                    renderRoomGrid();
                    alert("Đã phục hồi dữ liệu thành công!");
                }
            } else {
                alert("File sao lưu không đúng định dạng!");
            }
        } catch (error) {
            alert("Lỗi khi đọc file sao lưu!");
        }
    };
    if (event.target.files[0]) {
        fileReader.readAsText(event.target.files[0]);
    }
}

// THÊM PHÒNG MỚI
document.getElementById('addRoomForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('newRoomName').value;
    const price = Number(document.getElementById('newRoomPrice').value);

    roomsData.push({
        id: Date.now(),
        ten_phong: name,
        gia_thue: price,
        billing: { priceElec: 3000, oldElec: 0, newElec: 0, waterFee: 0, garbageFee: 0, surchargeFee: 0 },
        contract: { depositAmount: 0, startDate: '', contractMonths: 12, note: '' },
        tenants: [],
        equipments: []
    });

    saveToLocalStorage();
    document.getElementById('addRoomForm').reset();
    renderRoomGrid();
});

// KHỞI ĐỘNG HỆ THỐNG
loadFromLocalStorage();
renderRoomGrid();
initTenantForm(); // <--- BỔ SUNG DÒNG NÀY VÀO DƯỚI CÙNG