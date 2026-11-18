/* ============================================================
   RAPOR TPQ - Main Application JS
   ============================================================ */

// !! GANTI URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA !!
const API_URL = 'https://script.google.com/macros/s/AKfycbxwfByaQBkOU5xyRsUaREKzJ2HMEJkDvQxFPtJxlmlYS4eeOlZ49nOEq3M0IcG_xzLN/exec';

// State
let currentUser = null;
let siswaDaftar = [];
let currentSiswaId = null;
let currentSemester = '1';
let currentTahunAjar = '2024/2025';

// ============================================================
// SURAH LIST
// ============================================================
const SURAH_LIST = [
  {no:1,  nama:"An-Naba'",      ayat:40,  key:"s1"},
  {no:2,  nama:"An-Nazi'at",    ayat:46,  key:"s2"},
  {no:3,  nama:"'Abasa",        ayat:42,  key:"s3"},
  {no:4,  nama:"At-Takwir",     ayat:29,  key:"s4"},
  {no:5,  nama:"Al-Infithar",   ayat:19,  key:"s5"},
  {no:6,  nama:"Al-Muthaffifin",ayat:36,  key:"s6"},
  {no:7,  nama:"Al-Insyiqaq",   ayat:25,  key:"s7"},
  {no:8,  nama:"Al-Buruj",      ayat:22,  key:"s8"},
  {no:9,  nama:"Ath-Thariq",    ayat:17,  key:"s9"},
  {no:10, nama:"Al-A'la",       ayat:19,  key:"s10"},
  {no:11, nama:"Al-Ghasyiyah",  ayat:26,  key:"s11"},
  {no:12, nama:"Al-Fajr",       ayat:30,  key:"s12"},
  {no:13, nama:"Al-Balad",      ayat:20,  key:"s13"},
  {no:14, nama:"Asy-Syams",     ayat:15,  key:"s14"},
  {no:15, nama:"Al-Lail",       ayat:21,  key:"s15"},
  {no:16, nama:"Ad-Dhuha",      ayat:11,  key:"s16"},
  {no:17, nama:"Al-Insyirah",   ayat:8,   key:"s17"},
  {no:18, nama:"At-Tin",        ayat:8,   key:"s18"},
  {no:19, nama:"Al-'Alaq",      ayat:19,  key:"s19"},
  {no:20, nama:"Al-Qadr",       ayat:5,   key:"s20"},
  {no:21, nama:"Al-Bayyinah",   ayat:8,   key:"s21"},
  {no:22, nama:"Al-Zalzalah",   ayat:8,   key:"s22"},
  {no:23, nama:"Al-'Adiyat",    ayat:11,  key:"s23"},
  {no:24, nama:"Al-Qari'ah",    ayat:11,  key:"s24"},
  {no:25, nama:"At-Takatsur",   ayat:8,   key:"s25"},
  {no:26, nama:"Al-Ashr",       ayat:3,   key:"s26"},
  {no:27, nama:"Al-Humazah",    ayat:9,   key:"s27"},
  {no:28, nama:"Al-Fil",        ayat:5,   key:"s28"},
  {no:29, nama:"Quraisy",       ayat:4,   key:"s29"},
  {no:30, nama:"Al-Ma'un",      ayat:7,   key:"s30"},
  {no:31, nama:"Al-Kautsar",    ayat:3,   key:"s31"},
  {no:32, nama:"Al-Kafirun",    ayat:6,   key:"s32"},
  {no:33, nama:"An-Nashr",      ayat:3,   key:"s33"},
  {no:34, nama:"Al-Lahab",      ayat:5,   key:"s34"},
  {no:35, nama:"Al-Ikhlash",    ayat:4,   key:"s35"},
  {no:36, nama:"Al-Falaq",      ayat:5,   key:"s36"},
  {no:37, nama:"An-Nas",        ayat:6,   key:"s37"},
];


// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  buildSurahGrid();
  const saved = sessionStorage.getItem('raporUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    afterLogin();
  } else {
    // Belum login: pakai cache lokal sebagai tampilan awal sementara
    const sem = localStorage.getItem('semester') || '1';
    const ta  = localStorage.getItem('tahunAjar') || '2024/2025';
    applySemesterSettings(sem, ta);
  }

  // Enter key untuk login
  ['loginUsername','loginPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });
});

function buildSurahGrid() {
  const grid = document.getElementById('gridSurah');
  if (!grid) return;
  grid.innerHTML = '';
  SURAH_LIST.forEach(s => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `<label>${s.no}. ${s.nama} (${s.ayat})</label>
      <input type="number" id="n${s.key}" min="0" max="100" placeholder="0-100" oninput="updateRataRata()">`;
    grid.appendChild(div);
  });
}

// ============================================================
// AUTH
// ============================================================
function doLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  if (!u || !p) { showError('loginError', 'Isi username dan password'); return; }
  showLoading(true);
  apiPost({action:'login', username:u, password:p}).then(res => {
    showLoading(false);
    if (res.success) {
      currentUser = res.user;
      sessionStorage.setItem('raporUser', JSON.stringify(currentUser));
      afterLogin();
    } else {
      showError('loginError', res.message || 'Login gagal');
    }
  }).catch(() => {
    showLoading(false);
    showError('loginError', 'Gagal terhubung ke server');
  });
}

function afterLogin() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
  document.getElementById('sideUserName').textContent = currentUser.nama;
  document.getElementById('topUserBadge').textContent =
    currentUser.role === 'admin' ? '👑 Admin' : `🎓 ${currentUser.kelas || 'Guru'}`;
  // Show/hide menus
  const isAdmin = currentUser.role === 'admin';
  document.querySelectorAll('.menu-admin').forEach(el => el.style.display = isAdmin ? 'flex' : 'none');
  document.querySelectorAll('.menu-cetak, .menu-cetak-btn').forEach(el => el.style.display = 'flex');
  navigate('dashboard');
  loadSiswa();
  if (isAdmin) loadUsers();
  // Ambil semester aktif dari server — berlaku untuk semua user (admin & guru)
  syncSemesterFromServer();
}

function syncSemesterFromServer() {
  apiPost({action: 'getSettings', role: currentUser.role}).then(res => {
    if (res.success && res.data) {
      const sem = res.data.semester_aktif  || localStorage.getItem('semester')  || '1';
      const ta  = res.data.tahun_ajar_aktif || localStorage.getItem('tahunAjar') || '2024/2025';
      applySemesterSettings(sem, ta);
      // Update cache lokal agar konsisten
      localStorage.setItem('semester', sem);
      localStorage.setItem('tahunAjar', ta);
    }
  }).catch(() => {
    // Server tidak terjangkau — gunakan cache lokal sebagai fallback
    const sem = localStorage.getItem('semester')  || '1';
    const ta  = localStorage.getItem('tahunAjar') || '2024/2025';
    applySemesterSettings(sem, ta);
  });
}

function doLogout() {
  sessionStorage.removeItem('raporUser');
  currentUser = null;
  siswaDaftar = [];
  document.getElementById('mainApp').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('loginPassword').value = '';
  showError('loginError', '');
}

function togglePassword() {
  const inp = document.getElementById('loginPassword');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page) {
  document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const titles = {
    dashboard: 'Dashboard',
    siswa: 'Data Siswa',
    nilai: 'Input Nilai',
    cetak: 'Cetak Rapor',
    users: 'Manajemen User',
    settings: 'Pengaturan'
  };
  document.getElementById(`page${page.charAt(0).toUpperCase()+page.slice(1)}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = titles[page] || page;
  if (window.innerWidth <= 768) closeSidebar();
  if (page === 'cetak') populateSiswaCetak();
  if (page === 'settings') loadSettings();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

function goToCetak() {
  if (currentSiswaId) {
    document.getElementById('selectSiswaCetak').value = currentSiswaId;
    document.getElementById('cetakSemester').value = document.getElementById('nilaiSemester').value;
    document.getElementById('cetakTahunAjar').value = document.getElementById('nilaiTahunAjar').value;
  }
  navigate('cetak');
}

// ============================================================
// SEMESTER SETTINGS
// ============================================================
function applySemesterSettings(sem, ta) {
  currentSemester  = sem;
  currentTahunAjar = ta;
  document.getElementById('dashSemester').value  = sem;
  document.getElementById('dashTahunAjar').value = ta;
  document.getElementById('nilaiSemester').value = sem;
  document.getElementById('nilaiTahunAjar').value = ta;
  document.getElementById('cetakSemester').value = sem;
  document.getElementById('cetakTahunAjar').value = ta;
}

function saveSemester() {
  const sem = document.getElementById('dashSemester').value;
  const ta  = document.getElementById('dashTahunAjar').value;
  applySemesterSettings(sem, ta);
  // Simpan lokal sebagai cache
  localStorage.setItem('semester', sem);
  localStorage.setItem('tahunAjar', ta);

  // Admin: simpan ke server agar guru ikut sinkron
  if (currentUser && currentUser.role === 'admin') {
    apiPost({
      action: 'saveSettings',
      role: currentUser.role,
      settings: { semester_aktif: sem, tahun_ajar_aktif: ta }
    }).then(res => {
      showToast(res.success ? 'Semester disimpan & disinkronkan ke semua guru' : (res.message || 'Gagal menyimpan'), res.success ? 'success' : 'error');
    }).catch(() => showToast('Semester disimpan lokal, gagal sinkron ke server', 'warning'));
  } else {
    showToast('Pengaturan semester disimpan', 'success');
  }
}


// ============================================================
// SISWA
// ============================================================
function loadSiswa() {
  showLoading(true);
  console.log('[loadSiswa] filter →', {
    role:       currentUser.role,
    kelas:      currentUser.kelas,
    pembimbing: currentUser.pembimbing
  });
  apiPost({
    action:     'getSiswa',
    role:       currentUser.role,
    nama:       currentUser.nama,
    kelas:      currentUser.kelas,
    pembimbing: currentUser.pembimbing
  }).then(res => {
    showLoading(false);
    if (res.success) {
      console.log('[loadSiswa] debug dari server →', res.debug);
      console.log('[loadSiswa] jumlah siswa diterima:', res.data ? res.data.length : 0);
      siswaDaftar = res.data;
      renderTableSiswa(siswaDaftar);
      populateSelectSiswa();
      updateDashStats();
    }
  }).catch(() => { showLoading(false); showToast('Gagal memuat data siswa', 'error'); });
}

function renderTableSiswa(data) {
  const tbody = document.getElementById('tableSiswaBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada data siswa</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((s, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${s.nomor_induk || '-'}</td>
      <td>${s.nama || '-'}</td>
      <td>${s.kelas || '-'}</td>
      <td>${s.tahapan || '-'}</td>
      <td>${s.jilid_juz || '-'}</td>
      <td>${s.pembimbing || '-'}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editSiswa('${s.id}')">✏️</button>
        ${currentUser.role==='admin' ? `<button class="btn btn-danger btn-sm" onclick="hapusSiswa('${s.id}')">🗑️</button>` : ''}
      </td>
    </tr>`).join('');
}

function filterSiswa() {
  const q = document.getElementById('searchSiswa').value.toLowerCase();
  const filtered = siswaDaftar.filter(s =>
    (s.nama||'').toLowerCase().includes(q) ||
    (s.nomor_induk||'').toLowerCase().includes(q)
  );
  renderTableSiswa(filtered);
}

function populateSelectSiswa() {
  const selNilai = document.getElementById('selectSiswaNilai');
  selNilai.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    siswaDaftar.map(s => `<option value="${s.id}">${s.nama} (${s.nomor_induk})</option>`).join('');
}

function populateSiswaCetak() {
  const sel = document.getElementById('selectSiswaCetak');
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    siswaDaftar.map(s => `<option value="${s.id}">${s.nama} (${s.nomor_induk})</option>`).join('');
}

function updateDashStats() {
  document.getElementById('statSiswa').textContent = siswaDaftar.length;

  // Tampilkan nama pembimbing dari user yang login
  const pembimbing = currentUser.pembimbing || currentUser.nama || '-';
  const elPb = document.getElementById('statPembimbing');
  if (elPb) elPb.textContent = pembimbing;

  // Hitung kelas unik dari siswa yang sudah difilter (sesuai pembimbing guru)
  const kelasUnik = [...new Set(
    siswaDaftar.map(s => String(s.kelas || '').trim()).filter(k => k && k !== '-')
  )].sort();
  const elKelas = document.getElementById('statKelas');
  if (elKelas) {
    elKelas.textContent = kelasUnik.length > 0 ? kelasUnik.join(', ') : '-';
    // Jika banyak kelas, kecilkan font agar muat
    elKelas.style.fontSize = kelasUnik.length > 3 ? '0.85rem' : '';
  }
}

function showFormSiswa(siswa) {
  document.getElementById('formSiswaWrapper').classList.remove('hidden');
  document.getElementById('fSiswaId').value = siswa ? siswa.id : '';
  document.getElementById('fNomorInduk').value = siswa ? siswa.nomor_induk : '';
  document.getElementById('fNama').value = siswa ? siswa.nama : '';
  document.getElementById('fKelas').value = siswa ? siswa.kelas : (currentUser.kelas || '');
  document.getElementById('fTahapan').value = siswa ? siswa.tahapan : '';
  document.getElementById('fJilidJuz').value = siswa ? siswa.jilid_juz : '';
  document.getElementById('fPembimbing').value = siswa ? siswa.pembimbing : '';
  document.getElementById('formSiswaTitle').textContent = siswa ? 'Edit Siswa' : 'Tambah Siswa';
  document.getElementById('formSiswaWrapper').scrollIntoView({behavior:'smooth'});
}

function hideFormSiswa() {
  document.getElementById('formSiswaWrapper').classList.add('hidden');
}

function editSiswa(id) {
  const s = siswaDaftar.find(x => x.id === id);
  if (s) showFormSiswa(s);
}

function hapusSiswa(id) {
  if (!confirm('Hapus siswa ini?')) return;
  showLoading(true);
  apiPost({action:'deleteSiswa', id}).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) loadSiswa();
  });
}

function submitSiswa() {
  const siswa = {
    id: document.getElementById('fSiswaId').value,
    nomor_induk: document.getElementById('fNomorInduk').value.trim(),
    nama: document.getElementById('fNama').value.trim(),
    kelas: document.getElementById('fKelas').value.trim(),
    tahapan: document.getElementById('fTahapan').value,
    jilid_juz: document.getElementById('fJilidJuz').value,
    pembimbing: document.getElementById('fPembimbing').value.trim(),
  };
  if (!siswa.nomor_induk || !siswa.nama || !siswa.kelas || !siswa.tahapan || !siswa.jilid_juz) {
    showToast('Lengkapi semua field bertanda *', 'error'); return;
  }
  showLoading(true);
  apiPost({action:'saveSiswa', siswa}).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) { hideFormSiswa(); loadSiswa(); }
  });
}

// ============================================================
// UPLOAD XLS SISWA
// ============================================================

// Download template sebagai file .xlsx (kolom Excel native, bukan CSV)
function downloadTemplateSiswa() {
  if (typeof XLSX === 'undefined') {
    showToast('Memuat library Excel...', '');
    loadSheetJS(() => _buatTemplateXlsx());
  } else {
    _buatTemplateXlsx();
  }
}

function _buatTemplateXlsx() {
  // Data template
  const headers = ['NO', 'NOMOR_INDUK', 'NAMA', 'KELAS', 'TAHAPAN', 'JILID_JUZ', 'PEMBIMBING'];
  const contoh  = [
    [1, '2024001', 'Ahmad Fauzi',  '1C', 'Tilawati', 3, 'Ustadz Hasan'],
    [2, '2024002', 'Siti Aisyah',  '1C', 'Alquran',  5, 'Ustadzah Rina'],
    [3, '2024003', 'Muhammad Rizki','1C', 'Tilawati', 2, 'Ustadz Hasan'],
  ];

  // Buat worksheet dari array
  const wsData = [headers, ...contoh];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Lebar kolom (karakter)
  ws['!cols'] = [
    { wch: 5  },  // NO
    { wch: 14 },  // NOMOR_INDUK
    { wch: 28 },  // NAMA
    { wch: 8  },  // KELAS
    { wch: 12 },  // TAHAPAN
    { wch: 10 },  // JILID_JUZ
    { wch: 22 },  // PEMBIMBING
  ];

  // Style header (baris 1) — tebal + background kuning
  const headerStyle = {
    font:    { bold: true, color: { rgb: 'FFFFFF' } },
    fill:    { fgColor: { rgb: '1A6B3C' } },
    alignment: { horizontal: 'center' },
    border: {
      top:    { style: 'thin' }, bottom: { style: 'thin' },
      left:   { style: 'thin' }, right:  { style: 'thin' },
    },
  };
  const dataStyle = {
    border: {
      top:    { style: 'thin' }, bottom: { style: 'thin' },
      left:   { style: 'thin' }, right:  { style: 'thin' },
    },
  };

  headers.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[cellRef]) ws[cellRef] = {};
    ws[cellRef].s = headerStyle;
  });

  // Style baris data
  contoh.forEach((_, ri) => {
    headers.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (ws[cellRef]) ws[cellRef].s = dataStyle;
    });
  });

  // Tambahkan baris kosong untuk diisi (10 baris kosong setelah contoh)
  for (let r = contoh.length + 1; r <= contoh.length + 10; r++) {
    headers.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r, c: ci });
      ws[cellRef] = { v: '', t: 's', s: dataStyle };
    });
    // Isi nomor urut otomatis
    const noCell = XLSX.utils.encode_cell({ r, c: 0 });
    ws[noCell] = { v: r, t: 'n', s: dataStyle };
  }

  // Update range agar mencakup semua baris
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: contoh.length + 10, c: headers.length - 1 },
  });

  // Tambah sheet keterangan
  const wsKet = XLSX.utils.aoa_to_sheet([
    ['KETERANGAN PENGISIAN'],
    [''],
    ['Kolom',        'Keterangan',                          'Contoh'],
    ['NO',           'Nomor urut (diisi otomatis)',          '1, 2, 3 ...'],
    ['NOMOR_INDUK',  'Nomor induk / NIS santri',            '2024001'],
    ['NAMA',         'Nama lengkap santri',                  'Ahmad Fauzi'],
    ['KELAS',        'Kelas pengampu',                      '1C, 2A, dst'],
    ['TAHAPAN',      'Hanya isi: Tilawati  atau  Alquran',  'Tilawati'],
    ['JILID_JUZ',    'Angka 1 s.d. 30',                    '3'],
    ['PEMBIMBING',   'Nama ustadz/ustadzah pengampu',        'Ustadz Hasan'],
  ]);
  wsKet['!cols'] = [{ wch: 16 }, { wch: 42 }, { wch: 22 }];

  // Buat workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws,   'Data Siswa');
  XLSX.utils.book_append_sheet(wb, wsKet,'Keterangan');

  // Download
  XLSX.writeFile(wb, 'template_siswa.xlsx');
  showToast('Template Excel berhasil diunduh', 'success');
}

function triggerUploadXls() {
  document.getElementById('inputUploadXls').click();
}

function handleUploadXls(input) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv','xls','xlsx'].includes(ext)) {
    showToast('Format file harus CSV, XLS, atau XLSX', 'error');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let rows;
      if (ext === 'csv') {
        rows = parseCSV(e.target.result);
      } else {
        // XLS/XLSX: gunakan SheetJS (dikembed saat dibutuhkan)
        if (typeof XLSX === 'undefined') {
          showToast('Memuat library Excel...', '');
          loadSheetJS(() => {
            rows = parseXLSX(e.target.result);
            previewUpload(rows);
          });
          return;
        }
        rows = parseXLSX(e.target.result);
      }
      previewUpload(rows);
    } catch(err) {
      showToast('Gagal membaca file: ' + err.message, 'error');
    }
  };
  if (ext === 'csv') {
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
  input.value = '';
}

function loadSheetJS(callback) {
  const script = document.createElement('script');
  script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
  script.onload = callback;
  script.onerror = () => showToast('Gagal memuat library, coba format CSV', 'error');
  document.head.appendChild(script);
}

function parseCSV(text) {
  // Hapus BOM jika ada
  text = text.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    // Handle quoted fields
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    result.push(cur.trim());
    return result;
  });
}

function parseXLSX(arrayBuffer) {
  const wb   = XLSX.read(arrayBuffer, {type:'array'});
  const ws   = wb.Sheets[wb.SheetNames[0]];
  // sheet_to_json dengan header:1 menghasilkan array 2D (sama seperti sheet_to_array)
  return XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});
}

function previewUpload(rows) {
  if (!rows || rows.length < 2) {
    showToast('File kosong atau tidak ada data', 'error'); return;
  }

  // Deteksi header: cari baris yang mengandung NAMA atau NOMOR
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map(c => String(c||'').toUpperCase());
    if (row.some(c => c.includes('NAMA') || c.includes('NOMOR'))) {
      headerIdx = i; break;
    }
  }

  const header = rows[headerIdx].map(c => String(c||'').trim().toUpperCase()
    .replace(/\s+/g,'_').replace(/[^A-Z0-9_]/g,''));
  const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c !== null && c !== undefined && String(c).trim() !== ''));

  // Map kolom secara fleksibel
  const colMap = {
    nomor_induk: findCol(header, ['NOMOR_INDUK','NIS','NO_INDUK','INDUK','NIS_NISN']),
    nama:        findCol(header, ['NAMA','NAMA_LENGKAP','NAMA_SISWA','NAMA_SANTRI']),
    kelas:       findCol(header, ['KELAS']),
    tahapan:     findCol(header, ['TAHAPAN','TAHAP']),
    jilid_juz:   findCol(header, ['JILID_JUZ','JILID','JUZ']),
    pembimbing:  findCol(header, ['PEMBIMBING','USTADZ','GURU','PENGAMPU']),
  };

  // Validasi minimal
  if (colMap.nama === -1) {
    showToast('Kolom NAMA tidak ditemukan. Gunakan template yang disediakan.', 'error'); return;
  }
  if (colMap.nomor_induk === -1) {
    showToast('Kolom NOMOR_INDUK tidak ditemukan. Gunakan template yang disediakan.', 'error'); return;
  }

  // Parse data
  const parsed = [];
  dataRows.forEach((r, i) => {
    const nama = String(r[colMap.nama] || '').trim();
    const induk = String(r[colMap.nomor_induk] || '').trim();
    if (!nama || !induk) return;

    let tahapan = String(r[colMap.tahapan] || '').trim();
    // Normalisasi tahapan
    if (!['Alquran','Tilawati'].includes(tahapan)) {
      tahapan = tahapan.toLowerCase().includes('quran') ? 'Alquran' : 'Tilawati';
    }

    let jilid = String(r[colMap.jilid_juz] || '1').trim().replace(/[^0-9]/g,'') || '1';
    const juzNum = parseInt(jilid);
    if (juzNum < 1 || juzNum > 30) jilid = '1';

    parsed.push({
      nomor_induk: induk,
      nama,
      kelas:       String(r[colMap.kelas] || currentUser.kelas || '').trim() || '-',
      tahapan,
      jilid_juz:   jilid,
      pembimbing:  String(r[colMap.pembimbing] || '').trim() || '-',
      _row: i + 1,
      _valid: true,
    });
  });

  if (!parsed.length) {
    showToast('Tidak ada data valid yang ditemukan', 'error'); return;
  }

  showPreviewModal(parsed);
}

function findCol(header, keys) {
  for (const k of keys) {
    const idx = header.indexOf(k);
    if (idx !== -1) return idx;
  }
  // Partial match
  for (const k of keys) {
    const idx = header.findIndex(h => h.includes(k));
    if (idx !== -1) return idx;
  }
  return -1;
}

function showPreviewModal(data) {
  // Hapus modal lama jika ada
  const old = document.getElementById('modalUploadPreview');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'modalUploadPreview';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box modal-lg">
      <div class="modal-header">
        <h3>📋 Preview Upload Siswa</h3>
        <span class="modal-close" onclick="closePreviewModal()">✕</span>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:12px">Ditemukan <strong>${data.length}</strong> data siswa. Periksa sebelum menyimpan:</p>
        <div class="table-wrapper" style="max-height:320px;overflow-y:auto">
          <table class="data-table">
            <thead><tr>
              <th>No</th><th>Nomor Induk</th><th>Nama</th>
              <th>Kelas</th><th>Tahapan</th><th>Jilid/Juz</th><th>Pembimbing</th>
            </tr></thead>
            <tbody>
              ${data.map((d,i) => `<tr>
                <td>${i+1}</td>
                <td>${d.nomor_induk}</td>
                <td>${d.nama}</td>
                <td><input class="inp-mini" value="${d.kelas}" onchange="uploadData[${i}].kelas=this.value"></td>
                <td><select class="inp-mini" onchange="uploadData[${i}].tahapan=this.value">
                  <option ${d.tahapan==='Tilawati'?'selected':''}>Tilawati</option>
                  <option ${d.tahapan==='Alquran'?'selected':''}>Alquran</option>
                </select></td>
                <td><input class="inp-mini" type="number" min="1" max="30" value="${d.jilid_juz}" onchange="uploadData[${i}].jilid_juz=this.value" style="width:55px"></td>
                <td><input class="inp-mini" value="${d.pembimbing}" onchange="uploadData[${i}].pembimbing=this.value"></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="konfirmasiUpload()">💾 Simpan Semua (${data.length})</button>
        <button class="btn btn-secondary" onclick="closePreviewModal()">Batal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  window.uploadData = data;
}

function closePreviewModal() {
  const m = document.getElementById('modalUploadPreview');
  if (m) m.remove();
  window.uploadData = null;
}

async function konfirmasiUpload() {
  const data = window.uploadData;
  if (!data || !data.length) return;
  closePreviewModal();
  showLoading(true);

  let berhasil = 0, gagal = 0;
  // Kirim satu per satu agar tidak timeout
  for (const siswa of data) {
    try {
      const res = await apiPost({action:'saveSiswa', siswa});
      if (res.success) berhasil++; else gagal++;
    } catch { gagal++; }
  }

  showLoading(false);
  showToast(`Upload selesai: ${berhasil} berhasil${gagal ? ', ' + gagal + ' gagal' : ''}`,
    gagal ? 'warning' : 'success');
  loadSiswa();
}


// ============================================================
// NILAI
// ============================================================
function loadNilaiSiswa() {
  const id = document.getElementById('selectSiswaNilai').value;
  if (!id) return;
  currentSiswaId = id;
  const sem = document.getElementById('nilaiSemester').value;
  const ta  = document.getElementById('nilaiTahunAjar').value;
  const siswa = siswaDaftar.find(s => s.id === id);

  showLoading(true);
  apiPost({action:'getNilai', siswa_id:id, semester:sem, tahun_ajar:ta}).then(res => {
    showLoading(false);
    document.getElementById('nilaiForm').classList.remove('hidden');
    if (siswa) {
      document.getElementById('nilaiSiswaInfo').innerHTML =
        `<strong>${siswa.nama}</strong> &nbsp;|&nbsp; Induk: ${siswa.nomor_induk}
         &nbsp;|&nbsp; Kelas: ${siswa.kelas} &nbsp;|&nbsp;
         Tahapan: ${siswa.tahapan} - Jilid/Juz: ${siswa.jilid_juz}
         &nbsp;|&nbsp; Pembimbing: ${siswa.pembimbing}`;
    }
    if (res.success && res.data) {
      fillNilaiForm(res.data);
    } else {
      clearNilaiForm();
    }
    updateRataRata();
  }).catch(() => { showLoading(false); showToast('Gagal memuat nilai', 'error'); });
}

function fillNilaiForm(d) {
  const fields = [
    {id:'nFashohah',     key:'fashohah'},
    {id:'nSuaraLagu',    key:'suara_lagu'},
    {id:'nTeoriTajwid',  key:'teori_tajwid'},
    {id:'nGhorib',       key:'ghorib'},
  ];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = d[f.key] || '';
  });
  SURAH_LIST.forEach(s => {
    const el = document.getElementById('n'+s.key);
    if (el) el.value = d[s.key] || '';
  });
  const predikat = ['Doa','Menulis','Kebersihan','Kedisiplinan','AkhlakUstadz','AkhlakTeman','AkhlakBelajar'];
  const predKeys = ['doa','menulis','kebersihan','kedisiplinan','akhlak_ustadz','akhlak_teman','akhlak_belajar'];
  predikat.forEach((f,i) => {
    const el = document.getElementById('n'+f);
    if (el) el.value = d[predKeys[i]] || '';
  });
  document.getElementById('nCatatan').value = d.catatan || '';
  // Store ID
  document.getElementById('nCatatan').dataset.id = d.id_nilai || '';
}

function clearNilaiForm() {
  document.querySelectorAll('#nilaiForm input[type="number"]').forEach(el => el.value = '');
  document.querySelectorAll('#nilaiForm select').forEach(el => el.value = '');
  document.getElementById('nCatatan').value = '';
  document.getElementById('nCatatan').dataset.id = '';
}

function updateRataRata() {
  let total = 0, count = 0;
  SURAH_LIST.forEach(s => {
    const v = parseFloat(document.getElementById('n'+s.key)?.value);
    if (!isNaN(v)) { total += v; count++; }
  });
  const avg = count > 0 ? (total/count).toFixed(1) : '-';
  document.getElementById('displayRataRata').textContent = avg;
  document.getElementById('nRataRata').value = avg !== '-' ? avg : '';
  document.getElementById('displayKalimat').textContent = avg !== '-' ? angkaTerbilang(parseFloat(avg)) : '-';
  document.getElementById('nKalimat').value = avg !== '-' ? angkaTerbilang(parseFloat(avg)) : '';
  // Update stats
  document.getElementById('statNilai').textContent = count > 0 ? count + '/37' : '0/37';
}

function submitNilai() {
  const id = document.getElementById('selectSiswaNilai').value;
  if (!id) { showToast('Pilih siswa terlebih dahulu', 'error'); return; }
  const sem = document.getElementById('nilaiSemester').value;
  const ta  = document.getElementById('nilaiTahunAjar').value.trim();

  if (!ta) { showToast('Isi tahun ajaran terlebih dahulu', 'error'); return; }

  const nilai = {
    id_nilai: document.getElementById('nCatatan').dataset.id || '',
    siswa_id: id, semester: sem, tahun_ajar: ta,
    fashohah:    document.getElementById('nFashohah').value,
    suara_lagu:  document.getElementById('nSuaraLagu').value,
    teori_tajwid:document.getElementById('nTeoriTajwid').value,
    ghorib:      document.getElementById('nGhorib').value,
    rata_rata:   document.getElementById('nRataRata').value,
    kalimat:     document.getElementById('nKalimat').value,
    doa:         document.getElementById('nDoa').value,
    menulis:     document.getElementById('nMenulis').value,
    kebersihan:  document.getElementById('nKebersihan').value,
    kedisiplinan:document.getElementById('nKedisiplinan').value,
    akhlak_ustadz: document.getElementById('nAkhlakUstadz').value,
    akhlak_teman:  document.getElementById('nAkhlakTeman').value,
    akhlak_belajar:document.getElementById('nAkhlakBelajar').value,
    catatan: document.getElementById('nCatatan').value,
  };
  SURAH_LIST.forEach(s => {
    nilai[s.key] = document.getElementById('n'+s.key)?.value || '';
  });

  showLoading(true);
  apiPost({action:'saveNilai', nilai, username: currentUser.username,
           role: currentUser.role, pembimbing: currentUser.pembimbing}).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success && res.id) {
      document.getElementById('nCatatan').dataset.id = res.id;
    }
  });
}


// ============================================================
// CETAK RAPOR
// ============================================================
function loadRapor() {
  const id = document.getElementById('selectSiswaCetak').value;
  if (!id) { showToast('Pilih siswa', 'error'); return; }
  const sem = document.getElementById('cetakSemester').value;
  const ta  = document.getElementById('cetakTahunAjar').value;

  if (!ta || ta.trim() === '') {
    showToast('Isi tahun ajaran terlebih dahulu', 'error'); return;
  }

  showLoading(true);
  apiPost({action:'getRapor', siswa_id:id, semester:sem, tahun_ajar:ta.trim()}).then(res => {
    showLoading(false);
    // Log debug info ke console
    if (res.debug) {
      console.log('[getRapor debug]', res.debug);
      if (!res.debug.nilai_found) {
        showToast(
          `Data nilai tidak ditemukan untuk Semester ${res.debug.semester_req}, T.A. ${res.debug.tahun_ajar_req}. Pastikan semester & tahun ajaran sama saat input nilai.`,
          'warning'
        );
      }
    }
    if (res.success) {
      renderRapor(res.siswa, res.nilai, sem, ta.trim(), res.logo_url || '',
        res.nama_kepala || '', res.ttd_kota || '', res.ttd_tanggal || '');
    } else {
      showToast(res.message || 'Data tidak ditemukan', 'error');
    }
  }).catch(() => { showLoading(false); showToast('Gagal memuat rapor', 'error'); });
}

function renderRapor(siswa, nilai, semester, tahunAjar, logoUrl, namaKepala, ttdKota, ttdTanggalSetting) {
  const n       = nilai || {};
  const semStr  = semester === '1' ? 'I (Ganjil)' : 'II (Genap)';
  const rataRata = n.rata_rata || '-';
  const kalimat  = n.kalimat  || '-';

  // Tanggal TTD: parse berbagai format → tampilkan "dd MMMM yyyy" saja
  const today = new Date();
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
                 'Agustus','September','Oktober','November','Desember'];
  const _fmt = d => `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  let tglTtd;
  if (ttdTanggalSetting && ttdTanggalSetting.trim()) {
    const parsed = new Date(ttdTanggalSetting.trim());
    // Jika hasil parse valid (termasuk string panjang dari Date.toString()), format ulang
    tglTtd = isNaN(parsed.getTime()) ? ttdTanggalSetting.trim() : _fmt(parsed);
  } else {
    tglTtd = _fmt(today);
  }
  const kotaTtd = ttdKota && ttdKota.trim() ? ttdKota.trim() : '.........';
  const kepala  = namaKepala && namaKepala.trim() ? namaKepala.trim() : '(............................)';

  // Header kop logo
  const kopHtml = logoUrl
    ? `<div class="rapor-kop-logo"><img src="${logoUrl}" alt="Kop Sekolah" class="kop-img"></div>`
    : `<div class="rapor-judul">LAPORAN PERKEMBANGAN PESERTA DIDIK</div>`;

  const subJudulHtml = `
    <div class="rapor-sub-judul-utama">LAPORAN PERKEMBANGAN PESERTA DIDIK</div>
    <div class="rapor-sub-judul">Semester ${semStr} &nbsp;&middot;&nbsp; Tahun Ajaran ${tahunAjar}</div>
  `;

  // ===================== SATU RAPOR-PAGE — browser atur page break natural =====================
  let html = `<div class="rapor-page">`;

  // HEADER
  html += `<div class="rapor-header">
    ${kopHtml}
    ${subJudulHtml}
  </div>`;

  html += `<div class="rapor-identitas">
    <div class="ident-row">
      <span class="ident-label">Nama</span>
      <span class="ident-sep">:</span>
      <span class="ident-value ident-nama"><strong>${siswa.nama||'-'}</strong></span>
      <span class="ident-label">Kelas</span>
      <span class="ident-sep">:</span>
      <span class="ident-value">${siswa.kelas||'-'}</span>
    </div>
    <div class="ident-row">
      <span class="ident-label">Nomor Induk</span>
      <span class="ident-sep">:</span>
      <span class="ident-value">${siswa.nomor_induk||'-'}</span>
      <span class="ident-label">Tahapan</span>
      <span class="ident-sep">:</span>
      <span class="ident-value">${siswa.tahapan||'-'}</span>
    </div>
    <div class="ident-row">
      <span class="ident-label">Pembimbing</span>
      <span class="ident-sep">:</span>
      <span class="ident-value ident-nama">${siswa.pembimbing||'-'}</span>
      <span class="ident-label">Jilid / Juz</span>
      <span class="ident-sep">:</span>
      <span class="ident-value">${siswa.jilid_juz||'-'}</span>
    </div>
  </div>`;

  // SECTION I
  html += `<div class="rapor-section-title">I. Materi Pokok (${siswa.tahapan||'Tilawati/Alquran'})</div>`;
  html += `<table class="rapor-table"><thead>
    <tr><th class="td-no">No</th><th>Aspek Penilaian</th><th class="td-nilai">Nilai</th><th>Keterangan</th></tr>
  </thead><tbody>
    ${[['Fashohah', n.fashohah],['Suara dan Lagu', n.suara_lagu],
       ['Teori Tajwid', n.teori_tajwid],['Ghorib', n.ghorib]]
      .map((r,i) => `<tr><td>${i+1}</td><td class="td-left">${r[0]}</td>
        <td class="td-nilai">${r[1]||'-'}</td><td>${nilaiKet(r[1])}</td></tr>`).join('')}
  </tbody></table>`;

  // SECTION II — hanya tampilkan surah yang ada nilainya
  const surahTerisi = SURAH_LIST.filter(s => {
    const v = n[s.key];
    return v !== '' && v !== undefined && v !== null && v !== '-' && !isNaN(parseFloat(v));
  });

  html += `<div class="rapor-section-title">II. Materi Hafalan Juz 'Amma</div>`;
  if (surahTerisi.length === 0) {
    html += `<p style="padding:8px;font-style:italic;color:#888">Belum ada nilai hafalan diinput.</p>`;
  } else {
    html += `<table class="rapor-table"><thead>
      <tr>
        <th class="td-no2">No</th>
        <th>Nama Surah</th>
        <th class="td-ayat">Ayat</th>
        <th class="td-nilai">Nilai</th>
        <th class="td-terbilang">Terbilang</th>
      </tr>
    </thead><tbody>`;
    surahTerisi.forEach((s, idx) => {
      const nilaiSurah = n[s.key];
      const tbSurah   = angkaTerbilang(parseFloat(nilaiSurah));
      html += `<tr>
        <td class="td-no2">${idx + 1}</td>
        <td class="td-left">${s.nama}</td>
        <td class="td-ayat">${s.ayat}</td>
        <td class="td-nilai">${nilaiSurah}</td>
        <td class="td-terbilang td-left">${tbSurah}</td>
      </tr>`;
    });
    html += `<tr class="tr-total">
      <td colspan="3" class="td-left"><strong>Rata-rata Hafalan</strong></td>
      <td class="td-nilai"><strong>${rataRata}</strong></td>
      <td class="td-terbilang td-left"><em>${kalimat}</em></td>
    </tr>`;
    html += `</tbody></table>`;
  }

  // SECTION III — Materi Tambahan
  html += `<div class="rapor-section-title">III. Materi Tambahan</div>`;
  html += `<table class="rapor-table"><thead>
    <tr><th class="td-no">No</th><th>Aspek</th><th class="td-nilai">Predikat</th><th>Keterangan</th></tr>
  </thead><tbody>
    ${[['Doa', n.doa],['Menulis (Kitabati)', n.menulis],['Kebersihan', n.kebersihan]]
      .map((r,i) => `<tr><td>${i+1}</td><td class="td-left">${r[0]}</td>
        <td><span class="akhlak-predikat predikat-${r[1]||'D'}">${r[1]||'-'}</span></td>
        <td>${predKet(r[1])}</td></tr>`).join('')}
  </tbody></table>`;

  // SECTION IV — satu kesatuan dengan III, keterangan, catatan, dan TTD
  // Dibungkus dalam blok avoid-break agar tidak terpotong di tengah
  html += `<div class="rapor-section-title">IV. Akhlak Peserta Didik</div>`;
  html += `<table class="rapor-table"><thead>
    <tr><th class="td-no">No</th><th>Aspek</th><th class="td-nilai">Predikat</th><th>Keterangan</th></tr>
  </thead><tbody>
    ${[['Kedisiplinan', n.kedisiplinan],
       ['Akhlak kepada Ustadz/ah', n.akhlak_ustadz],
       ['Akhlak kepada Teman', n.akhlak_teman],
       ['Akhlak dalam Belajar', n.akhlak_belajar]]
      .map((r,i) => `<tr><td>${i+1}</td><td class="td-left">${r[0]}</td>
        <td><span class="akhlak-predikat predikat-${r[1]||'D'}">${r[1]||'-'}</span></td>
        <td>${predKet(r[1])}</td></tr>`).join('')}
  </tbody></table>`;

  // Keterangan Predikat
  html += `<div class="keterangan-box">
    <span class="keterangan-title">Keterangan Predikat:</span>
    <span>A = Sangat Baik (86 - 100)</span><span>B = Baik (71 - 85)</span>
    <span>C = Cukup (56 - 70)</span><span>D = Perlu Bimbingan (≤ 55)</span>
  </div>`;

  // Catatan
  html += `<div class="rapor-section-title" style="margin-top:8px">Catatan Ustadz/Ustadzah</div>`;
  html += `<div class="rapor-catatan">${n.catatan || '&nbsp;'}</div>`;

  // TTD — page-break-inside:avoid agar tidak terpotong
  html += `<div class="rapor-ttd-wrapper">
    <div class="rapor-ttd">
      <div class="ttd-box">
        <div class="ttd-title">Mengetahui,<br>Orang Tua / Wali</div>
        <div class="ttd-name">(............................)</div>
      </div>
      <div class="ttd-box">
        <div class="ttd-title">${kotaTtd}, ${tglTtd}<br>Kepala Madrasah</div>
        <div class="ttd-name">${kepala}</div>
      </div>
      <div class="ttd-box">
        <div class="ttd-title">Ustadz/ah Pengampu<br>&nbsp;</div>
        <div class="ttd-name">${siswa.pembimbing||'(............................)'}</div>
      </div>
    </div>
  </div>`;

  html += `</div>`; // end rapor-page

  const container = document.getElementById('raporPrint');
  container.innerHTML = html;
  container.classList.remove('hidden');
  container.scrollIntoView({behavior:'smooth'});
}

function printRapor() {
  if (document.getElementById('raporPrint').classList.contains('hidden')) {
    showToast('Tampilkan rapor terlebih dahulu', 'warning'); return;
  }
  window.print();
}


// ============================================================
// SETTINGS
// ============================================================
function loadSettings() {
  showLoading(true);
  apiPost({action:'getSettings', role: currentUser.role}).then(res => {
    showLoading(false);
    if (res.success && res.data) {
      const d = res.data;
      document.getElementById('sLogoUrl').value    = d.logo_url    || '';
      document.getElementById('sNamaKepala').value = d.nama_kepala || '';
      document.getElementById('sTtdKota').value    = d.ttd_kota    || '';

      // Konversi tanggal tersimpan ke format YYYY-MM-DD untuk input[type=date]
      const tglRaw = d.ttd_tanggal || '';
      if (tglRaw) {
        const parsed = new Date(tglRaw);
        if (!isNaN(parsed.getTime())) {
          // Format YYYY-MM-DD (local, bukan UTC)
          const y  = parsed.getFullYear();
          const mo = String(parsed.getMonth() + 1).padStart(2, '0');
          const dy = String(parsed.getDate()).padStart(2, '0');
          document.getElementById('sTtdTanggal').value = `${y}-${mo}-${dy}`;
        } else {
          document.getElementById('sTtdTanggal').value = '';
        }
      } else {
        document.getElementById('sTtdTanggal').value = '';
      }

      // Preview logo
      const logoUrl = d.logo_url || '';
      const prev = document.getElementById('settingsLogoPreview');
      const img  = document.getElementById('previewLogoImg');
      if (logoUrl) { img.src = logoUrl; prev.classList.remove('hidden'); }
      else          { prev.classList.add('hidden'); }
    }
  }).catch(() => { showLoading(false); showToast('Gagal memuat pengaturan', 'error'); });
}

function submitSettings() {
  const logoUrl    = document.getElementById('sLogoUrl').value.trim();
  const namaKepala = document.getElementById('sNamaKepala').value.trim();
  const ttdKota    = document.getElementById('sTtdKota').value.trim();
  const ttdTanggal = document.getElementById('sTtdTanggal').value.trim(); // format YYYY-MM-DD dari date picker

  showLoading(true);
  apiPost({
    action: 'saveSettings',
    role: currentUser.role,
    settings: { logo_url: logoUrl, nama_kepala: namaKepala, ttd_kota: ttdKota, ttd_tanggal: ttdTanggal }
  }).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    // Update preview logo
    if (logoUrl) {
      document.getElementById('previewLogoImg').src = logoUrl;
      document.getElementById('settingsLogoPreview').classList.remove('hidden');
    }
  }).catch(() => { showLoading(false); showToast('Gagal menyimpan', 'error'); });
}

// ============================================================
// USER MANAGEMENT
// ============================================================
function loadUsers() {
  apiPost({action:'getUsers', role: currentUser.role}).then(res => {
    if (res.success) renderTableUsers(res.data);
  });
}

function renderTableUsers(data) {
  const tbody = document.getElementById('tableUsersBody');
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada user</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((u,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${u.username}</td>
      <td>${u.nama||'-'}</td>
      <td><span class="badge badge-${u.role}">${u.role==='admin'?'Admin':'Guru'}</span></td>
      <td>${u.kelas||'-'}</td>
      <td>${u.pembimbing||'-'}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick='editUser(${JSON.stringify(u)})'>✏️</button>
        ${u.username !== currentUser.username
          ? `<button class="btn btn-danger btn-sm" onclick="hapusUser('${u.username}')">🗑️</button>`
          : '<span style="color:#999;font-size:11px">Anda</span>'}
      </td>
    </tr>`).join('');
}

function showFormUser(user) {
  document.getElementById('formUserWrapper').classList.remove('hidden');
  document.getElementById('fUsername').value         = user ? user.username   : '';
  document.getElementById('fUsername').disabled      = !!user;
  document.getElementById('fPassword').value         = '';
  document.getElementById('fPassword').placeholder   = user ? 'Kosongkan jika tidak diubah' : 'Password baru';
  document.getElementById('fNamaUser').value         = user ? user.nama       : '';
  document.getElementById('fRole').value             = user ? user.role       : 'guru';
  document.getElementById('fKelasUser').value        = user ? user.kelas      : '';
  document.getElementById('fPembimbingUser').value   = user ? (user.pembimbing || user.nama || '') : '';
  document.getElementById('fUsernameOriginal').value = user ? user.username   : '';
  document.getElementById('formUserTitle').textContent = user ? 'Edit User' : 'Tambah User';
  toggleKelasField();
}

function hideFormUser() {
  document.getElementById('formUserWrapper').classList.add('hidden');
}

function editUser(u) { showFormUser(u); }

function toggleKelasField() {
  const isGuru = document.getElementById('fRole').value === 'guru';
  document.getElementById('kelasField').style.display      = isGuru ? 'flex' : 'none';
  document.getElementById('pembimbingField').style.display = isGuru ? 'flex' : 'none';
}

function submitUser() {
  const udata = {
    username:   document.getElementById('fUsernameOriginal').value || document.getElementById('fUsername').value,
    password:   document.getElementById('fPassword').value || '***',
    nama:       document.getElementById('fNamaUser').value.trim(),
    role:       document.getElementById('fRole').value,
    kelas:      document.getElementById('fKelasUser').value.trim(),
    pembimbing: document.getElementById('fPembimbingUser').value.trim(),
  };
  if (!udata.username || !udata.nama) {
    showToast('Lengkapi username dan nama', 'error'); return;
  }
  // Jika guru dan pembimbing kosong, isi dengan nama
  if (udata.role === 'guru' && !udata.pembimbing) udata.pembimbing = udata.nama;
  showLoading(true);
  apiPost({action:'saveUser', role: currentUser.role, userdata: udata}).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) { hideFormUser(); loadUsers(); }
  });
}

function hapusUser(username) {
  if (!confirm(`Hapus user "${username}"?`)) return;
  showLoading(true);
  apiPost({action:'deleteUser', role: currentUser.role, username_target: username}).then(res => {
    showLoading(false);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) loadUsers();
  });
}

// ============================================================
// API HELPER — Google Apps Script CORS-safe
// GAS tidak support CORS preflight dari domain external.
// Solusi: GET dengan payload di query param (encode JSON → base64)
// ============================================================
async function apiPost(data) {
  // Encode JSON → UTF-8 bytes → base64
  // Utilities.base64Decode di GAS bekerja dengan base64 standar (bukan URL-safe)
  const json    = JSON.stringify(data);
  const payload = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  const url = API_URL + '?payload=' + encodeURIComponent(payload);

  const res  = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Response tidak valid: ' + text.substring(0, 300));
  }
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function showError(id, msg) {
  document.getElementById(id).textContent = msg;
}

// ============================================================
// HELPERS: TERBILANG & KETERANGAN
// ============================================================
function angkaTerbilang(n) {
  if (isNaN(n)) return '-';
  const satuan = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan',
    'sepuluh','sebelas','dua belas','tiga belas','empat belas','lima belas','enam belas',
    'tujuh belas','delapan belas','sembilan belas'];
  const puluhan = ['','','dua puluh','tiga puluh','empat puluh','lima puluh',
    'enam puluh','tujuh puluh','delapan puluh','sembilan puluh'];
  n = Math.round(n * 10) / 10;
  const dec = Math.round((n % 1) * 10);
  const bil = Math.floor(n);
  let str = '';
  if (bil >= 100) str += satuan[Math.floor(bil/100)] + ' ratus ';
  if (bil % 100 < 20) str += satuan[bil % 100];
  else str += puluhan[Math.floor((bil%100)/10)] + ' ' + satuan[bil%10];
  if (dec > 0) str += ' koma ' + satuan[dec];
  return str.trim() || 'nol';
}

function nilaiKet(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return '-';
  if (n >= 86) return 'Sangat Baik';
  if (n >= 71) return 'Baik';
  if (n >= 56) return 'Cukup';
  return 'Perlu Bimbingan';
}

function predKet(v) {
  const m = {A:'Sangat Baik', B:'Baik', C:'Cukup', D:'Perlu Bimbingan'};
  return m[v] || '-';
}
