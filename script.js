// ==========================================
// KHO KHỞI TẠO DỮ LIỆU CƠ SỞ (LOCALSTORAGE)
// ==========================================
let rooms = JSON.parse(localStorage.getItem('phongtro_rooms')) || [
    { name: "Phòng 01", price: 2000000, tenants: [], billing: { priceElec: 3000, oldElec: 0, newElec: 0, roomRent: 2000000, waterFee: 50000, garbageFee: 20000, surchargeFee: 0 }, equipments: [], contract: { depositAmount: 2000000, startDate: "", contractMonths: 12, contractNote: "" } },
    { name: "Phòng 02", price: 1400000, tenants: [], billing: { priceElec: 3000, oldElec: 0, newElec: 0, roomRent: 1400000, waterFee: 50000, garbageFee: 20000, surchargeFee: 0 }, equipments: [], contract: { depositAmount: 1400000, startDate: "", contractMonths: 12, contractNote: "" } }
];

let currentRoomIndex = null;

// Hàm lưu dữ liệu vào LocalStorage
function saveRoomsToStorage() {
    localStorage.setItem('phongtro_rooms', JSON.stringify(rooms));
    renderRooms();
}

// Khởi chạy ứng dụng khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    renderRooms();
});

// Định dạng tiền tệ VNĐ
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + " đ";
}

// ==========================================
// 1. HIỂN THỊ DANH SÁCH THẺ PHÒNG & TÌM KIẾM
// ==========================================
function renderRooms() {
    const grid = document.getElementById('roomGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const searchText = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'ALL';

    rooms.forEach((room, index) => {
        const tenantCount = room.tenants ? room.tenants.length : 0;
        const isOccupied = tenantCount > 0;

        // Lọc trạng thái
        if (statusFilter === 'OCCUPIED' && !isOccupied) return;
        if (statusFilter === 'EMPTY' && isOccupied) return;

        // Lọc từ khóa tìm kiếm (Tên phòng, Tên người ở, CCCD)
        if (searchText) {
            const matchRoom = room.name.toLowerCase().includes(searchText);
            const matchTenant = room.tenants && room.tenants.some(t => t.name.toLowerCase().includes(searchText) || t.cccd.includes(searchText));
            if (!matchRoom && !matchTenant) return;
        }

        const card = document.createElement('div');
        card.className = `room-card ${isOccupied ? 'occupied' : 'empty'}`;
        card.style.cssText = `
            background: white; border-radius: 8px; padding: 15px; border-left: 5px solid ${isOccupied ? '#d9534f' : '#28a745'};
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer; position: relative;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-shadow:space-between; align-items:center;">
                <h3 style="margin:0; font-size:16px;">${room.name}</h3>
                <span style="font-size:11px; padding:2px 6px; border-radius:4px; color:white; background:${isOccupied ? '#d9534f' : '#28a745'}">
                    ${isOccupied ? 'ĐÃ THUÊ' : 'TRỐNG'}
                </span>
            </div>
            <p style="margin:8px 0; font-weight:bold; color:#0068ff;">${formatVND(room.price)}/tháng</p>
            <p style="margin:0; font-size:12px; color:#666;">👤 ${tenantCount} người ở</p>
            <div style="margin-top:10px; display:flex; gap:5px;" onclick="event.stopPropagation()">
                <button onclick="renameRoom(${index})" style="flex:1; padding:4px; font-size:11px; background:#ffc107; border:none; border-radius:3px; cursor:pointer;">✏️ Sửa tên</button>
                <button onclick="deleteRoom(${index})" style="flex:1; padding:4px; font-size:11px; background:#dc3545; color:white; border:none; border-radius:3px; cursor:pointer;">🗑️ Xóa</button>
            </div>
        `;

        card.onclick = () => openRoomModal(index);
        grid.appendChild(card);
    });
}

function filterRooms() { renderRooms(); }

function handleAddRoom(e) {
    e.preventDefault();
    const name = document.getElementById('newRoomName').value.trim();
    const price = Number(document.getElementById('newRoomPrice').value) || 0;

    if (!name) return;
    rooms.push({
        name: name,
        price: price,
        tenants: [],
        billing: { priceElec: 3000, oldElec: 0, newElec: 0, roomRent: price, waterFee: 50000, garbageFee: 20000, surchargeFee: 0 },
        equipments: [],
        contract: { depositAmount: price, startDate: "", contractMonths: 12, contractNote: "" }
    });

    saveRoomsToStorage();
    document.getElementById('addRoomForm').reset();
}

function renameRoom(index) {
    const newName = prompt("Nhập tên mới cho phòng:", rooms[index].name);
    if (newName && newName.trim()) {
        rooms[index].name = newName.trim();
        saveRoomsToStorage();
    }
}

function deleteRoom(index) {
    if (confirm(`Bạn có chắc muốn xóa [${rooms[index].name}] không?`)) {
        rooms.splice(index, 1);
        saveRoomsToStorage();
    }
}

// ==========================================
// 2. MODAL CHI TIẾT PHÒNG & CHUYỂN TAB
// ==========================================
function openRoomModal(index) {
    currentRoomIndex = index;
    const room = rooms[index];

    document.getElementById('modalRoomTitle').innerText = `Chi tiết - ${room.name}`;
    document.getElementById('roomModal').classList.remove('hidden');

    // Nạp dữ liệu các tab
    renderTenants();
    loadBillingForm();
    renderEquipments();
    loadContractForm();

    // Mặc định mở Tab 1
    openTab('tabTenants', document.getElementById('tabBtn1'));
}

function closeModal() {
    document.getElementById('roomModal').classList.add('hidden');
    currentRoomIndex = null;
}

function openTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// ==========================================
// TAB 1: QUẢN LÝ CON NGƯỜI (TENANTS)
// ==========================================
function renderTenants() {
    const list = document.getElementById('tenantList');
    list.innerHTML = '';
    const tenants = rooms[currentRoomIndex].tenants || [];

    if (tenants.length === 0) {
        list.innerHTML = '<p style="font-size:13px; color:#888;">Chưa có người ở nào.</p>';
        return;
    }

    tenants.forEach((t, i) => {
        const item = document.createElement('div');
        item.style.cssText = "background:#f8f9fa; padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;";
        item.innerHTML = `
            <div>
                <strong>${t.name}</strong> (${t.birth || 'N/A'}) - <span style="color:#0068ff">${t.role}</span>
                <br><small>CCCD: ${t.cccd}</small>
                ${t.docImg ? `<br><a href="${t.docImg}" target="_blank" style="font-size:11px; color:#28a745;">🖼️ Xem ảnh CCCD/HĐ</a>` : ''}
            </div>
            <div>
                <button onclick="editTenant(${i})" style="padding:4px 8px; font-size:11px; background:#ffc107; border:none; border-radius:3px;">Sửa</button>
                <button onclick="deleteTenant(${i})" style="padding:4px 8px; font-size:11px; background:#dc3545; color:white; border:none; border-radius:3px;">Xóa</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function handleSaveTenant(e) {
    e.preventDefault();
    const name = document.getElementById('tenantName').value.trim();
    const birth = document.getElementById('tenantBirth').value;
    const cccd = document.getElementById('tenantCCCD').value.trim();
    const role = document.getElementById('tenantRole').value.trim();
    const fileInput = document.getElementById('tenantDocImg');
    const editIdx = Number(document.getElementById('editingTenantIndex').value);

    if (!rooms[currentRoomIndex].tenants) rooms[currentRoomIndex].tenants = [];

    const saveProc = (imgData) => {
        const tenantData = { name, birth, cccd, role, docImg: imgData || (editIdx >= 0 ? rooms[currentRoomIndex].tenants[editIdx].docImg : '') };
        if (editIdx >= 0) {
            rooms[currentRoomIndex].tenants[editIdx] = tenantData;
        } else {
            rooms[currentRoomIndex].tenants.push(tenantData);
        }
        saveRoomsToStorage();
        resetTenantForm();
        renderTenants();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (evt) => saveProc(evt.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveProc();
    }
}

function editTenant(i) {
    const t = rooms[currentRoomIndex].tenants[i];
    document.getElementById('tenantName').value = t.name;
    document.getElementById('tenantBirth').value = t.birth;
    document.getElementById('tenantCCCD').value = t.cccd;
    document.getElementById('tenantRole').value = t.role;
    document.getElementById('editingTenantIndex').value = i;
    document.getElementById('btnSaveTenant').innerText = "Cập nhật";
    document.getElementById('btnCancelTenant').classList.remove('hidden');
}

function resetTenantForm() {
    document.getElementById('tenantForm').reset();
    document.getElementById('editingTenantIndex').value = -1;
    document.getElementById('btnSaveTenant').innerText = "+ Thêm người ở";
    document.getElementById('btnCancelTenant').classList.add('hidden');
}

function deleteTenant(i) {
    if (confirm("Xóa thông tin người ở này?")) {
        rooms[currentRoomIndex].tenants.splice(i, 1);
        saveRoomsToStorage();
        renderTenants();
    }
}

// ==========================================
// TAB 2: QUẢN LÝ TIỀN PHÒNG (BILLING)
// ==========================================
function loadBillingForm() {
    const b = rooms[currentRoomIndex].billing || {};
    document.getElementById('priceElec').value = b.priceElec || 3000;
    document.getElementById('oldElec').value = b.oldElec || 0;
    document.getElementById('newElec').value = b.newElec || 0;
    document.getElementById('roomRent').value = b.roomRent || rooms[currentRoomIndex].price;
    document.getElementById('waterFee').value = b.waterFee || 50000;
    document.getElementById('garbageFee').value = b.garbageFee || 20000;
    document.getElementById('surchargeFee').value = b.surchargeFee || 0;

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

    const elecKwh = Math.max(0, newElec - oldElec);
    const elecTotal = elecKwh * priceElec;
    const grandTotal = roomRent + elecTotal + waterFee + garbageFee + surchargeFee;

    document.getElementById('grandTotalDisplay').innerText = formatVND(grandTotal);
    return { elecKwh, elecTotal, grandTotal, roomRent, waterFee, garbageFee, surchargeFee, priceElec, oldElec, newElec };
}

function saveBillingData() {
    const calc = calculateTotalBill();
    rooms[currentRoomIndex].billing = {
        priceElec: calc.priceElec, oldElec: calc.oldElec, newElec: calc.newElec,
        roomRent: calc.roomRent, waterFee: calc.waterFee, garbageFee: calc.garbageFee, surchargeFee: calc.surchargeFee
    };
    saveRoomsToStorage();
    alert("Đã lưu thông tin tiền phòng thành công!");
}

function openReceiptModal() {
    saveBillingData();
    const room = rooms[currentRoomIndex];
    const calc = calculateTotalBill();
    const headTenant = (room.tenants && room.tenants[0]) ? room.tenants[0].name : "Khách thuê";

    const receiptText = 
`--- PHIẾU THU TIỀN PHÒNG ---
Phòng: ${room.name}
Người đại diện: ${headTenant}
----------------------------------
1. Tiền phòng: ${formatVND(calc.roomRent)}
2. Tiền điện (${calc.elecKwh} kWh x ${formatVND(calc.priceElec)}): ${formatVND(calc.elecTotal)}
   (Số cũ: ${calc.oldElec} - Số mới: ${calc.newElec})
3. Tiền nước: ${formatVND(calc.waterFee)}
4. Tiền rác: ${formatVND(calc.garbageFee)}
5. Phụ thu: ${formatVND(calc.surchargeFee)}
----------------------------------
TỔNG CỘNG THANH TOÁN: ${formatVND(calc.grandTotal)}
----------------------------------
Vui lòng thanh toán đầu tháng. Xin cảm ơn!`;

    document.getElementById('receiptPreview').innerText = receiptText;
    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceiptModal() { document.getElementById('receiptModal').classList.add('hidden'); }

function copyZaloText() {
    const text = document.getElementById('receiptPreview').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Đã sao chép phiếu thu! Hãy dán (Paste) vào Zalo để gửi cho khách.");
    });
}

// ==========================================
// TAB 3: QUẢN LÝ TRANG THIẾT BỊ & ÁP DỤNG HÀNG LOẠT
// ==========================================
function renderEquipments() {
    const tbody = document.getElementById('equipTableBody');
    tbody.innerHTML = '';
    const equips = rooms[currentRoomIndex].equipments || [];

    equips.forEach((eq, i) => {
        const total = (eq.qty || 1) * (eq.price || 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${eq.name}</td>
            <td>${eq.replaceName || '-'}</td>
            <td>${eq.replaceDate || '-'}</td>
            <td>${eq.qty}</td>
            <td>${formatVND(eq.price)}</td>
            <td>${formatVND(total)}</td>
            <td>
                <button onclick="editEquip(${i})" style="padding:2px 6px; font-size:11px; background:#ffc107; border:none; border-radius:3px;">Sửa</button>
                <button onclick="deleteEquip(${i})" style="padding:2px 6px; font-size:11px; background:#dc3545; color:white; border:none; border-radius:3px;">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSaveEquip(e) {
    e.preventDefault();
    const name = document.getElementById('equipName').value.trim();
    const replaceName = document.getElementById('replaceName').value.trim();
    const replaceDate = document.getElementById('replaceDate').value;
    const qty = Number(document.getElementById('equipQty').value) || 1;
    const price = Number(document.getElementById('equipUnitPrice').value) || 0;
    const editIdx = Number(document.getElementById('editingEquipIndex').value);

    if (!rooms[currentRoomIndex].equipments) rooms[currentRoomIndex].equipments = [];

    const eqData = { name, replaceName, replaceDate, qty, price };
    if (editIdx >= 0) {
        rooms[currentRoomIndex].equipments[editIdx] = eqData;
    } else {
        rooms[currentRoomIndex].equipments.push(eqData);
    }

    saveRoomsToStorage();
    resetEquipForm();
    renderEquipments();
}

function editEquip(i) {
    const eq = rooms[currentRoomIndex].equipments[i];
    document.getElementById('equipName').value = eq.name;
    document.getElementById('replaceName').value = eq.replaceName || '';
    document.getElementById('replaceDate').value = eq.replaceDate || '';
    document.getElementById('equipQty').value = eq.qty;
    document.getElementById('equipUnitPrice').value = eq.price;
    document.getElementById('editingEquipIndex').value = i;
    document.getElementById('btnSaveEquip').innerText = "Cập nhật";
    document.getElementById('btnCancelEquip').classList.remove('hidden');
}

function resetEquipForm() {
    document.getElementById('equipForm').reset();
    document.getElementById('editingEquipIndex').value = -1;
    document.getElementById('btnSaveEquip').innerText = "+ Thêm thiết bị";
    document.getElementById('btnCancelEquip').classList.add('hidden');
}

function deleteEquip(i) {
    if (confirm("Xóa thiết bị này?")) {
        rooms[currentRoomIndex].equipments.splice(i, 1);
        saveRoomsToStorage();
        renderEquipments();
    }
}

// HÀM ÁP DỤNG THIẾT BỊ SANG PHÒNG KHÁC
function copyEquipmentToOtherRooms() {
    if (currentRoomIndex === null || currentRoomIndex === undefined || currentRoomIndex < 0) {
        alert("Vui lòng mở một phòng cụ thể trước khi thực hiện!");
        return;
    }

    const currentRoom = rooms[currentRoomIndex];
    if (!currentRoom.equipments || currentRoom.equipments.length === 0) {
        alert("Phòng này hiện chưa có thiết bị nào để sao chép!");
        return;
    }

    let targetInput = prompt("Nhập tên các phòng bạn muốn áp dụng (cách nhau bởi dấu phẩy).\nHoặc gõ 'ALL' để áp dụng cho TẤT CẢ các phòng khác:\n\nVí dụ: Phòng 02, Phòng 03");
    if (!targetInput) return;

    targetInput = targetInput.trim();
    let updatedCount = 0;

    if (targetInput.toUpperCase() === 'ALL') {
        if (confirm(`Xác nhận chép toàn bộ ${currentRoom.equipments.length} thiết bị từ [${currentRoom.name}] sang TẤT CẢ các phòng còn lại?`)) {
            rooms.forEach((room, idx) => {
                if (idx !== currentRoomIndex) {
                    room.equipments = JSON.parse(JSON.stringify(currentRoom.equipments));
                    updatedCount++;
                }
            });
        }
    } else {
        let targetNames = targetInput.split(',').map(n => n.trim().toLowerCase());
        rooms.forEach((room, idx) => {
            if (idx !== currentRoomIndex && targetNames.includes(room.name.toLowerCase())) {
                room.equipments = JSON.parse(JSON.stringify(currentRoom.equipments));
                updatedCount++;
            }
        });
    }

    if (updatedCount > 0) {
        saveRoomsToStorage();
        alert(`Đã sao chép thành công danh sách thiết bị sang ${updatedCount} phòng!`);
    } else {
        alert("Không tìm thấy tên phòng khớp với danh sách bạn nhập!");
    }
}

// ==========================================
// TAB 4: QUẢN LÝ HỢP ĐỒNG (CONTRACT)
// ==========================================
function loadContractForm() {
    const c = rooms[currentRoomIndex].contract || {};
    document.getElementById('depositAmount').value = c.depositAmount || rooms[currentRoomIndex].price;
    document.getElementById('startDate').value = c.startDate || '';
    document.getElementById('contractMonths').value = c.contractMonths || 12;
    document.getElementById('contractNote').value = c.contractNote || '';
}

function saveContractData() {
    rooms[currentRoomIndex].contract = {
        depositAmount: Number(document.getElementById('depositAmount').value) || 0,
        startDate: document.getElementById('startDate').value,
        contractMonths: Number(document.getElementById('contractMonths').value) || 12,
        contractNote: document.getElementById('contractNote').value.trim()
    };
    saveRoomsToStorage();
    alert("Đã lưu thông tin hợp đồng thành công!");
}

// ==========================================
// THAO TÁC HỆ THỐNG: CHỐT KỲ, XUẤT EXCEL, JSON
// ==========================================

// Chốt kỳ điện nước (Chuyển Số Mới -> Số Cũ)
function advanceAllElectricityMeters() {
    if (confirm("Xác nhận chốt kỳ mới? Toàn bộ Số điện mới sẽ được chuyển thành Số điện cũ cho tất cả các phòng.")) {
        rooms.forEach(r => {
            if (r.billing) {
                r.billing.oldElec = r.billing.newElec || r.billing.oldElec || 0;
            }
        });
        saveRoomsToStorage();
        alert("Đã chuyển chốt kỳ điện nước thành công!");
    }
}

// Sao lưu file JSON
function exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rooms, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PhongTro_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Phục hồi dữ liệu từ file JSON
function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                rooms = importedData;
                saveRoomsToStorage();
                alert("Đã phục hồi dữ liệu thành công!");
            } else {
                alert("File sao lưu không đúng định dạng!");
            }
        } catch (err) {
            alert("Lỗi khi đọc file sao lưu!");
        }
    };
    reader.readAsText(file);
}

// Xuất Danh sách Tạm trú ra Excel
function exportAllTenantsToExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Chưa tải xong thư viện Excel, vui lòng kiểm tra kết nối mạng!");
        return;
    }

    let excelRows = [];
    rooms.forEach(r => {
        if (r.tenants && r.tenants.length > 0) {
            r.tenants.forEach(t => {
                excelRows.push({
                    "Phòng": r.name,
                    "Họ và Tên": t.name,
                    "Năm Sinh": t.birth,
                    "Số CCCD": t.cccd,
                    "Định Danh": t.role
                });
            });
        }
    });

    if (excelRows.length === 0) {
        alert("Hiện chưa có dữ liệu người ở để xuất!");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachTamTru");
    XLSX.writeFile(workbook, `Danh_Sach_Tam_Tru_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Báo cáo doanh thu & Xuất hóa đơn Excel
function openGlobalReportModal() {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    let globalTotal = 0;

    rooms.forEach(r => {
        const b = r.billing || {};
        const priceElec = b.priceElec || 3000;
        const oldE = b.oldElec || 0;
        const newE = b.newElec || 0;
        const kwh = Math.max(0, newE - oldE);
        const elecTotal = kwh * priceElec;
        const rent = b.roomRent || r.price || 0;
        const water = b.waterFee || 0;
        const surcharge = (b.garbageFee || 0) + (b.surchargeFee || 0);
        const total = rent + elecTotal + water + surcharge;

        globalTotal += total;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${(r.tenants && r.tenants.length > 0) ? '🔴 Đã thuê' : '🟢 Trống'}</td>
            <td>${formatVND(rent)}</td>
            <td>${kwh} kWh</td>
            <td>${formatVND(elecTotal)}</td>
            <td>${formatVND(water)}</td>
            <td>${formatVND(surcharge)}</td>
            <td><strong style="color:#d9534f">${formatVND(total)}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('globalTotalDisplay').innerText = formatVND(globalTotal);
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() { document.getElementById('reportModal').classList.add('hidden'); }

function exportInvoicesToExcel() {
    if (typeof XLSX === 'undefined') return;

    let excelRows = rooms.map(r => {
        const b = r.billing || {};
        const kwh = Math.max(0, (b.newElec || 0) - (b.oldElec || 0));
        const elecTotal = kwh * (b.priceElec || 3000);
        const rent = b.roomRent || r.price || 0;
        const water = b.waterFee || 0;
        const garbage = b.garbageFee || 0;
        const surcharge = b.surchargeFee || 0;

        return {
            "Tên Phòng": r.name,
            "Tiền Phòng": rent,
            "Số Điện Cũ": b.oldElec || 0,
            "Số Điện Mới": b.newElec || 0,
            "Số kWh": kwh,
            "Tiền Điện": elecTotal,
            "Tiền Nước": water,
            "Tiền Rác": garbage,
            "Phụ Thu": surcharge,
            "Tổng Tiền": rent + elecTotal + water + garbage + surcharge
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoDoanhThu");
    XLSX.writeFile(workbook, `Bao_Cao_Doanh_Thu_${new Date().toISOString().slice(0,10)}.xlsx`);
}
