// ============================================================
// RAPOR TPQ - Google Apps Script Backend
// ============================================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SS = SpreadsheetApp.getActiveSpreadsheet();

// Sheet names
const SHEET_SISWA    = 'Siswa';
const SHEET_NILAI    = 'Nilai';
const SHEET_USERS    = 'Users';
const SHEET_SETTINGS = 'Settings';

// ============================================================
// INIT: Setup sheets if not exist
// ============================================================
function initSheets() {
  ensureSheet(SHEET_USERS,    ['username','password','role','nama','kelas','pembimbing']);
  ensureSheet(SHEET_SISWA,    ['id','nomor_induk','nama','kelas','tahapan','jilid_juz','pembimbing','aktif']);
  ensureSheet(SHEET_NILAI,    buildNilaiHeaders());
  ensureSheet(SHEET_SETTINGS, ['key','value']);

  // Default admin
  const usersSheet = SS.getSheetByName(SHEET_USERS);
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow(['admin','admin123','admin','Administrator','','']);
    usersSheet.appendRow(['guru1','guru123','guru','Ustadz Ahmad','1C','Ustadz Ahmad']);
  }

  // Default settings
  const settingsSheet = SS.getSheetByName(SHEET_SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(['logo_url',        'https://i.ibb.co.com/k2YJBL8X/Salinan-KOP-MI-2019.jpg']);
    settingsSheet.appendRow(['nama_kepala',     'Nama Kepala Madrasah']);
    settingsSheet.appendRow(['ttd_kota',        'Kota']);
    settingsSheet.appendRow(['ttd_tanggal',     '']);  // kosong = otomatis hari ini
    settingsSheet.appendRow(['semester_aktif',  '1']);
    settingsSheet.appendRow(['tahun_ajar_aktif','2024/2025']);
  } else {
    // Pastikan key semester_aktif & tahun_ajar_aktif ada di sheet lama
    const keys = settingsSheet.getDataRange().getValues().slice(1).map(r => String(r[0]).trim());
    if (!keys.includes('semester_aktif'))   settingsSheet.appendRow(['semester_aktif',  '1']);
    if (!keys.includes('tahun_ajar_aktif')) settingsSheet.appendRow(['tahun_ajar_aktif','2024/2025']);
  }
}

function ensureSheet(name, headers) {
  let sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a90d9').setFontColor('#ffffff');
  }
  return sheet;
}

function buildNilaiHeaders() {
  // Keys s1..s37 harus konsisten dengan frontend (app.js)
  const surahKeys = Array.from({length:37}, (_,i) => 's'+(i+1));
  return [
    'id_nilai','siswa_id','semester','tahun_ajar',
    'fashohah','suara_lagu','teori_tajwid','ghorib',
    ...surahKeys,
    'rata_rata','kalimat',
    'doa','menulis','kebersihan','kedisiplinan',
    'akhlak_ustadz','akhlak_teman','akhlak_belajar',
    'catatan','updated_at','updated_by'
  ];
}

// ============================================================
// WEB APP ENTRY POINT
// ============================================================
function doGet(e) {
  // Jika ada payload di query param, proses sebagai API call
  if (e && e.parameter && e.parameter.payload) {
    try {
      // Decode base64 menggunakan Utilities GAS (bukan atob yang hanya ada di browser)
      const decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.payload)).getDataAsString();
      const data    = JSON.parse(decoded);
      const result  = processAction(data);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Parse error: ' + err.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'No payload'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const result = processAction(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processAction(data) {
  const action = data.action;
  switch(action) {
    case 'login':         return loginUser(data);
    case 'getSiswa':      return getSiswa(data);
    case 'saveSiswa':     return saveSiswa(data);
    case 'deleteSiswa':   return deleteSiswa(data);
    case 'getNilai':      return getNilai(data);
    case 'saveNilai':     return saveNilai(data);
    case 'getRapor':      return getRapor(data);
    case 'getUsers':      return getUsers(data);
    case 'saveUser':      return saveUser(data);
    case 'deleteUser':    return deleteUser(data);
    case 'getSettings':   return getSettings(data);
    case 'saveSettings':  return saveSettings(data);
    default:              return {success: false, message: 'Action tidak dikenal: ' + action};
  }
}

// ============================================================
// DEBUG: Jalankan fungsi ini dari Apps Script Editor untuk
// melihat data mentah pembimbing di kedua sheet
// ============================================================
function debugPembimbing() {
  // Cek header sheet Siswa
  const siswaSheet = SS.getSheetByName(SHEET_SISWA);
  const siswaRows  = siswaSheet.getDataRange().getValues();
  const siswaHeaders = siswaRows[0];
  Logger.log('=== HEADER SHEET SISWA ===');
  Logger.log(siswaHeaders.join(' | '));
  Logger.log('Index kolom pembimbing: ' + siswaHeaders.indexOf('pembimbing'));

  Logger.log('\n=== SAMPEL DATA SISWA (5 pertama) ===');
  for (let i = 1; i <= Math.min(5, siswaRows.length - 1); i++) {
    const r = siswaRows[i];
    Logger.log(`[${i}] nama="${r[2]}" | kelas="${r[3]}" | pembimbing="${r[6]}" | aktif="${r[7]}"`);
  }

  // Cek data Users (guru)
  const usersSheet = SS.getSheetByName(SHEET_USERS);
  const usersRows  = usersSheet.getDataRange().getValues();
  Logger.log('\n=== DAFTAR GURU (role=guru) ===');
  for (let i = 1; i < usersRows.length; i++) {
    if (usersRows[i][2] === 'guru') {
      Logger.log(`username="${usersRows[i][0]}" | nama="${usersRows[i][3]}" | kelas="${usersRows[i][4]}" | pembimbing="${usersRows[i][5]}"`);
    }
  }
}

// ============================================================
// AUTH
// ============================================================
function loginUser(data) {
  const sheet = SS.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username && rows[i][1] === data.password) {
      return {
        success: true,
        user: {
          username:   rows[i][0],
          role:       rows[i][2],
          nama:       rows[i][3],
          kelas:      rows[i][4],
          pembimbing: rows[i][5] || rows[i][3] // kolom pembimbing, fallback ke nama user
        }
      };
    }
  }
  return {success: false, message: 'Username atau password salah'};
}

// ============================================================
// SISWA CRUD
// ============================================================
function getSiswa(data) {
  const sheet = SS.getSheetByName(SHEET_SISWA);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    // Skip baris kosong
    if (!rows[i][0]) continue;
    // Skip yang dihapus (soft delete) — nilai FALSE/false/'FALSE'/'false'/0
    const aktif = rows[i][7];
    if (aktif === false || aktif === 0 ||
        String(aktif).trim().toUpperCase() === 'FALSE') continue;

    const obj = {};
    headers.forEach((h, idx) => obj[h] = rows[i][idx]);

    if (data.role === 'guru') {
      if (data.pembimbing) {
        // Guru dengan pembimbing: filter HANYA berdasarkan pembimbing, abaikan kelas
        const pbGuru  = String(data.pembimbing).trim().toLowerCase().replace(/\s+/g, ' ');
        // Coba cocokkan dengan kolom pembimbing ATAU nama guru (fallback)
        const namaGuru = String(data.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const pbSiswa = String(obj.pembimbing || '').trim().toLowerCase().replace(/\s+/g, ' ');
        // Jika siswa belum diisi pembimbingnya → tampilkan saja (data belum lengkap)
        if (!pbSiswa) { /* tetap tampil */ }
        // Cocokkan dengan pembimbing guru atau nama guru
        else if (pbSiswa !== pbGuru && pbSiswa !== namaGuru) continue;
      } else if (data.kelas) {
        // Guru tanpa pembimbing: fallback filter berdasarkan kelas
        const klGuru  = String(data.kelas).trim().toLowerCase();
        const klSiswa = String(obj.kelas || '').trim().toLowerCase();
        if (klSiswa && klSiswa !== klGuru) continue;
      }
    }

    result.push(obj);
  }

  result.sort((a,b) => (a.nama || '').localeCompare(b.nama || ''));

  // Debug: ambil sampel pembimbing dari sheet untuk mudah diagnosa
  const samplePembimbing = rows.slice(1, 6)
    .filter(r => r[0])
    .map(r => ({ nama: r[2], pembimbing: r[6], kelas: r[3] }));

  return {
    success: true,
    data: result,
    debug: {
      total_rows_sheet: rows.length - 1,
      total_after_filter: result.length,
      role: data.role,
      kelas_filter: data.kelas || null,
      pembimbing_filter: data.pembimbing || null,
      sample_siswa: samplePembimbing
    }
  };
}

function saveSiswa(data) {
  const sheet = SS.getSheetByName(SHEET_SISWA);
  const rows = sheet.getDataRange().getValues();
  const s = data.siswa;

  if (!s.id) {
    // New
    s.id = Utilities.getUuid();
    s.aktif = true;
    sheet.appendRow([s.id, s.nomor_induk, s.nama, s.kelas, s.tahapan, s.jilid_juz, s.pembimbing, true]);
  } else {
    // Update
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === s.id) {
        sheet.getRange(i+1, 1, 1, 8).setValues([[
          s.id, s.nomor_induk, s.nama, s.kelas, s.tahapan, s.jilid_juz, s.pembimbing, true
        ]]);
        break;
      }
    }
  }
  return {success: true, message: 'Data siswa berhasil disimpan', id: s.id};
}

function deleteSiswa(data) {
  const sheet = SS.getSheetByName(SHEET_SISWA);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i+1, 8).setValue(false); // soft delete
      return {success: true, message: 'Siswa berhasil dihapus'};
    }
  }
  return {success: false, message: 'Siswa tidak ditemukan'};
}

// ============================================================
// NILAI CRUD
// ============================================================
function getNilai(data) {
  const sheet = SS.getSheetByName(SHEET_NILAI);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  // Normalisasi: bandingkan sebagai string agar angka vs string tidak jadi masalah
  const semStr = String(data.semester).trim();
  const taStr  = String(data.tahun_ajar).trim();

  for (let i = 1; i < rows.length; i++) {
    const rowSiswaId  = String(rows[i][1]).trim();
    const rowSemester = String(rows[i][2]).trim();
    const rowTahun    = String(rows[i][3]).trim();

    if (rowSiswaId  === String(data.siswa_id).trim() &&
        rowSemester === semStr &&
        rowTahun    === taStr) {
      const obj = {};
      headers.forEach((h, idx) => {
        // Kembalikan angka sebagai string agar konsisten di frontend
        obj[h] = rows[i][idx] !== null && rows[i][idx] !== undefined
                 ? String(rows[i][idx])
                 : '';
      });
      return {success: true, data: obj};
    }
  }
  return {success: true, data: null};
}

function saveNilai(data) {
  const sheet = SS.getSheetByName(SHEET_NILAI);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const n = data.nilai;

  // Proteksi: guru hanya boleh simpan nilai siswa yang pembimbingnya dirinya
  if (data.role === 'guru' && data.pembimbing) {
    const siswaSheet = SS.getSheetByName(SHEET_SISWA);
    const siswaRows  = siswaSheet.getDataRange().getValues();
    for (let i = 1; i < siswaRows.length; i++) {
      if (String(siswaRows[i][0]).trim() === String(n.siswa_id).trim()) {
        const pbSiswa = String(siswaRows[i][6] || '').trim().toLowerCase();
        const pbGuru  = String(data.pembimbing).trim().toLowerCase();
        if (pbSiswa && pbGuru && pbSiswa !== pbGuru) {
          return {success: false, message: 'Akses ditolak: siswa ini bukan bimbingan Anda'};
        }
        break;
      }
    }
  }

  // Paksa semester & tahun_ajar tersimpan sebagai string (cegah auto-convert ke number)
  n.semester   = String(n.semester || '').trim();
  n.tahun_ajar = String(n.tahun_ajar || '').trim();
  n.updated_at = new Date().toISOString();
  n.updated_by = data.username || 'system';

  const rowValues = headers.map(h => n[h] !== undefined && n[h] !== null ? n[h] : '');

  if (!n.id_nilai) {
    n.id_nilai = Utilities.getUuid();
    rowValues[0] = n.id_nilai;
    sheet.appendRow(rowValues);
  } else {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(n.id_nilai).trim()) {
        sheet.getRange(i+1, 1, 1, headers.length).setValues([rowValues]);
        return {success: true, message: 'Nilai berhasil disimpan'};
      }
    }
    // id_nilai tidak ketemu di sheet, append baru
    sheet.appendRow(rowValues);
  }
  return {success: true, message: 'Nilai berhasil disimpan', id: n.id_nilai};
}

// ============================================================
// RAPOR DATA (for print)
// ============================================================
function getRapor(data) {
  // Get siswa
  const siswaSheet = SS.getSheetByName(SHEET_SISWA);
  const siswaRows  = siswaSheet.getDataRange().getValues();
  const siswaHeaders = siswaRows[0];
  let siswa = null;
  for (let i = 1; i < siswaRows.length; i++) {
    if (String(siswaRows[i][0]).trim() === String(data.siswa_id).trim()) {
      siswa = {};
      siswaHeaders.forEach((h, idx) => siswa[h] = siswaRows[i][idx]);
      break;
    }
  }
  if (!siswa) return {success: false, message: 'Siswa tidak ditemukan'};

  // Get nilai
  const nilaiResult = getNilai({
    siswa_id:   data.siswa_id,
    semester:   data.semester,
    tahun_ajar: data.tahun_ajar
  });

  // Get semua settings sekaligus
  const logoUrl     = getSetting('logo_url');
  const namaKepala  = getSetting('nama_kepala');
  const ttdKota     = getSetting('ttd_kota');
  const ttdTanggal  = getSetting('ttd_tanggal'); // kosong = hari ini

  const debug = {
    siswa_id_req:   data.siswa_id,
    semester_req:   data.semester,
    tahun_ajar_req: data.tahun_ajar,
    nilai_found:    nilaiResult.data !== null
  };

  return {
    success: true, siswa, nilai: nilaiResult.data,
    logo_url: logoUrl, nama_kepala: namaKepala,
    ttd_kota: ttdKota, ttd_tanggal: ttdTanggal,
    debug
  };
}

// ============================================================
// SETTINGS
// ============================================================
function getSetting(key) {
  const sheet = SS.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return '';
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key) return String(rows[i][1]).trim();
  }
  return '';
}

function getSettings(data) {
  const sheet = SS.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return {success: false, message: 'Sheet Settings tidak ditemukan'};
  const rows = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) result[String(rows[i][0]).trim()] = String(rows[i][1] || '').trim();
  }
  return {success: true, data: result};
}

function saveSettings(data) {
  if (data.role !== 'admin') return {success: false, message: 'Akses ditolak'};
  const sheet = SS.getSheetByName(SHEET_SETTINGS);
  const rows  = sheet.getDataRange().getValues();
  const settings = data.settings || {};

  Object.entries(settings).forEach(([key, value]) => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === key) {
        sheet.getRange(i+1, 2).setValue(value);
        found = true; break;
      }
    }
    if (!found) sheet.appendRow([key, value]);
  });
  return {success: true, message: 'Pengaturan berhasil disimpan'};
}

// ============================================================
// UTILITY: Migrasi data lama (jalankan sekali jika ada data lama)
// Fungsi ini memastikan kolom semester di sheet Nilai tersimpan sebagai string
// ============================================================
function migrasiSemesterString() {
  const sheet = SS.getSheetByName(SHEET_NILAI);
  if (!sheet) return 'Sheet Nilai tidak ditemukan';
  const rows = sheet.getDataRange().getValues();
  let fixed = 0;
  for (let i = 1; i < rows.length; i++) {
    const sem = rows[i][2];
    if (typeof sem === 'number') {
      sheet.getRange(i+1, 3).setNumberFormat('@').setValue(String(sem));
      fixed++;
    }
  }
  return 'Selesai. ' + fixed + ' baris diperbaiki.';
}
function getUsers(data) {
  if (data.role !== 'admin') return {success: false, message: 'Akses ditolak'};
  const sheet = SS.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = rows[i][idx]);
    // Pastikan kolom pembimbing ada meski sheet lama hanya 5 kolom
    if (!obj.pembimbing && obj.nama) obj.pembimbing = obj.nama;
    obj.password = '***';
    result.push(obj);
  }
  return {success: true, data: result};
}

function saveUser(data) {
  if (data.role !== 'admin') return {success: false, message: 'Akses ditolak'};
  const sheet = SS.getSheetByName(SHEET_USERS);
  const rows  = sheet.getDataRange().getValues();
  const u = data.userdata;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === u.username) {
      const pw = u.password === '***' ? rows[i][1] : u.password;
      sheet.getRange(i+1, 1, 1, 6).setValues([[
        u.username, pw, u.role, u.nama, u.kelas, u.pembimbing || u.nama
      ]]);
      return {success: true, message: 'User berhasil diperbarui'};
    }
  }
  sheet.appendRow([u.username, u.password, u.role, u.nama, u.kelas, u.pembimbing || u.nama]);
  return {success: true, message: 'User berhasil ditambahkan'};
}

function deleteUser(data) {
  if (data.role !== 'admin') return {success: false, message: 'Akses ditolak'};
  const sheet = SS.getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username_target) {
      sheet.deleteRow(i+1);
      return {success: true, message: 'User berhasil dihapus'};
    }
  }
  return {success: false, message: 'User tidak ditemukan'};
}
