// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5-PsvkcfxrY-9XjeVa-VVXiP3VeJw5zo",
    authDomain: "harita-8f6f1.firebaseapp.com",
    projectId: "harita-8f6f1",
    storageBucket: "harita-8f6f1.firebasestorage.app",
    messagingSenderId: "98203219506",
    appId: "1:98203219506:web:c6a414e93b7a667ae5ae2b",
    measurementId: "G-YZK8FE3ZMC"
};

// Initialize Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    // Offline persistence - sayfayı kapayıp açsanız bile veriler kaybolmaz
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Çoklu sekme açık - offline persistence devre dışı');
        } else if (err.code === 'unimplemented') {
            console.warn('Bu tarayıcı offline persistence desteklemiyor');
        }
    });
    console.log('Firebase başarıyla bağlandı.');
} catch (e) {
    console.error('Firebase başlatma hatası:', e);
    alert('Firebase bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
}

// App State
let map;
let markers = [];
let savedPins = []; // Firestore'dan gelecek
let tempMarkerPos = null;
let editingPinId = null; // her zaman string (Firestore doc ID)

// Categories Config
const CATEGORIES = {
    esnaf: { label: 'Esnaf', color: '#0ea5e9', icon: 'shopping-bag' },
    office: { label: 'Emlak Ofisi', color: '#8b5cf6', icon: 'briefcase' },
    owner: { label: 'Ev Sahibi', color: '#10b981', icon: 'home' },
    contractor: { label: 'Müteahhit', color: '#f59e0b', icon: 'hard-hat' }
};

// Locations Data
const LOCATIONS = {
    "Kartal": [
        "ATALAR MAHALLESİ", "CEVİZLİ MAHALLESİ", "CUMHURİYET MAHALLESİ", "ÇAVUŞOĞLU MAHALLESİ",
        "ESENTEPE MAHALLESİ", "GÜMÜŞPINAR MAHALLESİ", "HÜRRİYET MAHALLESİ", "KARLIKTEPE MAHALLESİ",
        "KORDONBOYU MAHALLESİ", "ORHANTEPE MAHALLESİ", "ORTA MAHALLESİ", "PETROL İŞ MAHALLESİ",
        "SOĞANLIK YENİ MAHALLESİ", "TOPSELVİ MAHALLESİ", "UĞUR MUMCU MAHALLESİ",
        "YAKACIK ÇARŞI MAHALLESİ", "YAKACIK YENİ MAHALLESİ", "YALI MAHALLESİ", "YUKARI MAHALLESİ", "YUNUS MAHALLESİ"
    ],
    "Maltepe": [
        "ALTAYÇEŞME MAHALLESİ", "ALTINTEPE MAHALLESİ", "AYDINEVLER MAHALLESİ", "BAĞLARBAŞI MAHALLESİ",
        "BAŞIBÜYÜK MAHALLESİ", "BÜYÜKBAKKALKÖY MAHALLESİ", "CEVİZLİ MAHALLESİ", "ÇINAR MAHALLESİ",
        "ESENKENT MAHALLESİ", "FEYZULLAH MAHALLESİ", "FINDIKLI MAHALLESİ", "GİRNE MAHALLESİ",
        "GÜLENSU MAHALLESİ", "GÜLSUYU MAHALLESİ", "İDEALTEPE MAHALLESİ", "KÜÇÜKYALI MERKEZ MAHALLESİ",
        "YALI MAHALLESİ", "ZÜMRÜTEVLER MAHALLESİ"
    ],
    "Pendik": [
        "AHMET YESEVİ MAHALLESİ", "BAHÇELİEVLER MAHALLESİ", "BALLICA MAHALLESİ", "BATI MAHALLESİ",
        "ÇAMÇEŞME MAHALLESİ", "ÇAMLIK MAHALLESİ", "ÇINARDERE MAHALLESİ", "DOĞU MAHALLESİ",
        "DUMLUPINAR MAHALLESİ", "EMİRLİ MAHALLESİ", "ERTUĞRUL GAZİ MAHALLESİ", "ESENLER MAHALLESİ",
        "ESENYALI MAHALLESİ", "FATİH MAHALLESİ", "FEVZİ ÇAKMAK MAHALLESİ", "GÖÇBEYLİ MAHALLESİ",
        "GÜLLÜ BAĞLAR MAHALLESİ", "GÜZELYALI MAHALLESİ", "HARMANDERE MAHALLESİ", "KAVAKPINAR MAHALLESİ",
        "KAYNARCA MAHALLESİ", "KURNA MAHALLESİ", "KURTDOĞMUŞ MAHALLESİ", "KURTKÖY MAHALLESİ",
        "ORHANGAZİ MAHALLESİ", "ORTA MAHALLESİ", "RAMAZANOĞLU MAHALLESİ", "SANAYİ MAHALLESİ",
        "SAPAN BAĞLARI MAHALLESİ", "SÜLÜNTEPE MAHALLESİ", "ŞEYHLİ MAHALLESİ", "VELİBABA MAHALLESİ",
        "YAYALAR MAHALLESİ", "YENİ MAHALLESİ", "YENİŞEHİR MAHALLESİ", "YEŞİLBAĞLAR MAHALLESİ"
    ],
    "Kadıköy": [
        "19 MAYIS MAHALLESİ", "ACIBADEM MAHALLESİ", "BOSTANCI MAHALLESİ", "CADDEBOSTAN MAHALLESİ",
        "CAFERAĞA MAHALLESİ", "DUMLUPINAR MAHALLESİ", "EĞİTİM MAHALLESİ", "ERENKÖY MAHALLESİ",
        "FENERBAHÇE MAHALLESİ", "FENERYOLU MAHALLESİ", "FİKİRTEPE MAHALLESİ", "GÖZTEPE MAHALLESİ",
        "HASANPAŞA MAHALLESİ", "KOŞUYOLU MAHALLESİ", "KOZYATAĞI MAHALLESİ", "MERDİVENKÖY MAHALLESİ",
        "OSMANAĞA MAHALLESİ", "RASİMPAŞA MAHALLESİ", "SAHRAYICEDİT MAHALLESİ", "SUADİYE MAHALLESİ",
        "ZÜHTÜPAŞA MAHALLESİ"
    ],
    "Tuzla": [
        "AKFIRAT MAHALLESİ", "ANADOLU MAHALLESİ", "AYDINLI MAHALLESİ", "AYDINTEPE MAHALLESİ",
        "CAMİ MAHALLESİ", "EVLİYA ÇELEBİ MAHALLESİ", "FATİH MAHALLESİ", "İÇMELER MAHALLESİ",
        "İSTASYON MAHALLESİ", "MESCİT MAHALLESİ", "MİMAR SİNAN MAHALLESİ", "ORHANLI MAHALLESİ",
        "ORTA MAHALLESİ", "POSTANE MAHALLESİ", "ŞİFA MAHALLESİ", "TEPEÖREN MAHALLESİ", "YAYLA MAHALLESİ"
    ]
};

const PROPERTY_TYPES = {
    konut: 'Konut',
    ticari: 'Ticari',
    arsa: 'Arsa'
};

const ROOM_OPTIONS = ["1+1", "2+1", "3+1", "3+2", "4+1", "4+2", "5+1", "5+2", "6+1", "6+2"];
const AGE_OPTIONS = ["0", "1", "2", "3", "4", "5", "6-10", "11-15", "16-20", "20-30", "31 ve üzeri"];
const USAGE_OPTIONS = ["Boş", "Mülk Sahibi", "Kiracılı"];
const DEED_OPTIONS = ["Kat Mülkiyetli", "Kat İrtifaklı", "Arsa Tapulu"];

let selectedRooms = [];
let selectedAges = [];
let selectedUsage = [];
let selectedDeeds = [];

// ──────────────────────────────────────────────
// GLOBAL EXPOSURE — popup butonlarında kullanılır
// ──────────────────────────────────────────────
window.deletePin = deletePin;
window.editPin = editPin;
window.closeModal = closeModal;
window.togglePinReminder = togglePinReminder;
window.exportData = exportData;
window.importData = importData;
window.focusPin = focusPin;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initLocationSelectors();
    setupFirebaseListeners();
    setupEventListeners();
    registerServiceWorker();
});

// ──────────────────────────────────────────────
// FIREBASE
// ──────────────────────────────────────────────
function setupFirebaseListeners() {
    if (!db) return;

    db.collection('pins').onSnapshot((snapshot) => {
        // Mevcut marker'ları haritadan temizle
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        savedPins = [];

        snapshot.forEach((doc) => {
            const pin = { id: doc.id, ...doc.data() }; // id her zaman string
            savedPins.push(pin);
            addMarkerToMap(pin);
        });

        renderPinnedList();
        renderTodayTasks();

        // LocalStorage yedek
        try {
            localStorage.setItem('saha_harita_pins', JSON.stringify(savedPins));
        } catch (e) {
            console.warn('LocalStorage yazma hatası:', e);
        }
    }, (error) => {
        console.error('Firestore dinleme hatası:', error);
        // Firestore'a erişilemezse local yedekten yükle
        loadFromLocalStorage();
    });
}

function loadFromLocalStorage() {
    const localData = JSON.parse(localStorage.getItem('saha_harita_pins') || '[]');
    if (localData.length > 0) {
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        savedPins = localData;
        savedPins.forEach(pin => addMarkerToMap(pin));
        renderPinnedList();
        renderTodayTasks();
        console.info('Veriler yerel depodan yüklendi (çevrimdışı mod).');
    }
}

// ──────────────────────────────────────────────
// KAYDETME / GÜNCELLEME
// ──────────────────────────────────────────────
function saveNewPin() {
    if (!db) {
        alert('Firebase bağlantısı yok. Veri kaydedilemedi.');
        return;
    }

    const title = document.getElementById('pin-title').value.trim();
    if (!title) {
        alert('Lütfen bir başlık/isim girin.');
        document.getElementById('pin-title').focus();
        return;
    }

    const district = document.getElementById('pin-district').value;
    const neighborhood = document.getElementById('pin-neighborhood').value;
    if (!district || !neighborhood || neighborhood === 'all') {
        alert('Lütfen ilçe ve mahalle seçin.');
        return;
    }

    const price = document.getElementById('pin-price').value;
    const m2 = document.getElementById('pin-m2').value;
    const propertyType = document.getElementById('pin-property-type').value;
    const floor = document.getElementById('pin-floor').value;
    const roomCount = propertyType === 'konut' ? document.getElementById('pin-rooms').value : null;
    const buildingAge = document.getElementById('pin-age').value;
    const usageStatus = document.getElementById('pin-usage').value;
    const titleDeed = document.getElementById('pin-title-deed').value;
    const category = document.getElementById('pin-category').value;
    const notes = document.getElementById('pin-notes').value.trim();
    const company = document.getElementById('pin-company').value.trim();
    const sector = document.getElementById('pin-sector').value.trim();
    const phone = document.getElementById('pin-phone').value.trim();
    const reminderDate = document.getElementById('pin-reminder-date').value;
    const reminderDone = document.getElementById('pin-reminder-done').checked;

    const pinData = {
        title,
        price: parseInt(price) || 0,
        m2: parseInt(m2) || 0,
        district,
        neighborhood,
        propertyType: propertyType || 'konut',
        floor: floor !== '' ? parseInt(floor) : null,
        roomCount: roomCount || null,
        buildingAge: buildingAge || null,
        usageStatus: usageStatus || null,
        titleDeed: titleDeed || null,
        category,
        notes,
        company,
        sector,
        phone,
        reminderDate: reminderDate || null,
        reminderDone
    };

    const saveBtn = document.querySelector('.btn-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Kaydediliyor...';

    if (editingPinId) {
        // Güncelleme
        pinData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('pins').doc(editingPinId).set(pinData, { merge: true })
            .then(() => {
                closeModal();
            })
            .catch(err => {
                console.error('Güncelleme hatası:', err);
                alert('Güncelleme sırasında bir hata oluştu: ' + err.message);
            })
            .finally(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet';
            });
    } else {
        // Yeni kayıt
        if (!tempMarkerPos) {
            tempMarkerPos = map.getCenter();
        }
        pinData.lat = tempMarkerPos.lat;
        pinData.lng = tempMarkerPos.lng;
        pinData.timestamp = firebase.firestore.FieldValue.serverTimestamp();

        db.collection('pins').add(pinData)
            .then(() => {
                closeModal();
            })
            .catch(err => {
                console.error('Kayıt hatası:', err);
                alert('Kayıt sırasında bir hata oluştu: ' + err.message);
            })
            .finally(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet';
            });
    }
}

// ──────────────────────────────────────────────
// HARİTA
// ──────────────────────────────────────────────
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        tap: false
    }).setView([40.8887, 29.1856], 13);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Kullanıcı konumunu bul
    if ("geolocation" in navigator) {
        document.getElementById('current-location-status').classList.remove('hidden');
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15);
            document.getElementById('current-location-status').classList.add('hidden');

            L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: "#2563eb",
                color: "#fff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup("Siz buradasınız");
        }, () => {
            document.getElementById('current-location-status').classList.add('hidden');
        });
    }

    // Sağ tıkla pin ekle (desktop)
    map.on('contextmenu', (e) => {
        handleMapClick(e.latlng);
    });

    // Mobil: haritaya tıklandığında sidebar kapat
    map.on('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebar-overlay')?.classList.remove('active');
            document.getElementById('hamburger-btn')?.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

function handleMapClick(latlng) {
    tempMarkerPos = latlng;
    editingPinId = null;
    document.getElementById('modal-title').textContent = 'Yeni Nokta Ekle';
    openModal();
}

function openModal() {
    document.getElementById('add-modal').classList.add('active');
    setTimeout(() => document.getElementById('pin-title').focus(), 100);
}

function closeModal() {
    document.getElementById('add-modal').classList.remove('active');
    document.getElementById('add-form').reset();
    tempMarkerPos = null;
    editingPinId = null;
    document.getElementById('modal-title').textContent = 'Yeni Nokta Ekle';

    // Secondary select'leri sıfırla
    document.getElementById('pin-neighborhood').innerHTML = '<option value="">Önce İlçe Seçiniz</option>';
    document.getElementById('pin-rooms-container').classList.add('hidden');

    // Kaydet butonunu sıfırla (hata durumunda kalmış olabilir)
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Kaydet';
    }

    // Kategori değişikliğini varsayılana döndür
    document.getElementById('pin-category').value = 'owner';
    handleCategoryChange('owner');
}

// ──────────────────────────────────────────────
// PIN DÜZENLEME
// ──────────────────────────────────────────────
function editPin(id) {
    const pinId = String(id); // her zaman string'e çevir
    const pin = savedPins.find(p => p.id === pinId);
    if (!pin) {
        console.error('Pin bulunamadı:', pinId);
        return;
    }

    editingPinId = pinId;
    document.getElementById('modal-title').textContent = 'Noktayı Düzenle';

    document.getElementById('pin-category').value = pin.category;
    document.getElementById('pin-title').value = pin.title || '';
    document.getElementById('pin-district').value = pin.district || '';

    // Mahalleleri doldur
    populateNeighborhoods(pin.district, document.getElementById('pin-neighborhood'), "Önce İlçe Seçiniz");
    document.getElementById('pin-neighborhood').value = pin.neighborhood || '';

    document.getElementById('pin-price').value = pin.price || '';
    document.getElementById('pin-m2').value = pin.m2 || '';
    document.getElementById('pin-floor').value = pin.floor !== null && pin.floor !== undefined ? pin.floor : '';
    document.getElementById('pin-property-type').value = pin.propertyType || 'konut';
    document.getElementById('pin-age').value = pin.buildingAge || '';
    document.getElementById('pin-usage').value = pin.usageStatus || '';
    document.getElementById('pin-title-deed').value = pin.titleDeed || '';
    document.getElementById('pin-notes').value = pin.notes || '';
    document.getElementById('pin-company').value = pin.company || '';
    document.getElementById('pin-sector').value = pin.sector || '';
    document.getElementById('pin-phone').value = pin.phone || '';
    document.getElementById('pin-reminder-date').value = pin.reminderDate || '';
    document.getElementById('pin-reminder-done').checked = pin.reminderDone || false;

    // Oda sayısı görünürlüğü
    if (pin.propertyType === 'konut') {
        document.getElementById('pin-rooms-container').classList.remove('hidden');
        document.getElementById('pin-rooms').value = pin.roomCount || '';
    } else {
        document.getElementById('pin-rooms-container').classList.add('hidden');
    }

    handleCategoryChange(pin.category);
    document.getElementById('add-modal').classList.add('active');
}

// ──────────────────────────────────────────────
// SİLME
// ──────────────────────────────────────────────
function deletePin(id) {
    const pinId = String(id);
    if (!confirm('Bu noktayı silmek istediğinize emin misiniz?')) return;
    if (!db) return;

    db.collection('pins').doc(pinId).delete()
        .then(() => {
            console.log('Pin silindi:', pinId);
        })
        .catch(err => {
            console.error('Silme hatası:', err);
            alert('Silme işlemi başarısız: ' + err.message);
        });
}

// ──────────────────────────────────────────────
// REMINDER TOGGLE
// ──────────────────────────────────────────────
function togglePinReminder(id) {
    const pinId = String(id);
    const pin = savedPins.find(p => p.id === pinId);
    if (!pin || !db) return;

    db.collection('pins').doc(pinId).update({
        reminderDone: !pin.reminderDone
    }).catch(err => {
        console.error('Reminder güncelleme hatası:', err);
    });
}

// ──────────────────────────────────────────────
// MARKER / POPUP
// ──────────────────────────────────────────────
function createCustomIcon(category) {
    const config = CATEGORIES[category] || CATEGORIES['owner'];
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="marker-pin" style="background-color: ${config.color}">
                <i data-lucide="${config.icon}" style="width: 16px; height: 16px;"></i>
            </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -40]
    });
}

function addMarkerToMap(pin) {
    if (pin.lat === undefined || pin.lng === undefined) {
        console.warn('Koordinatsız pin atlandı:', pin.id);
        return;
    }

    const icon = createCustomIcon(pin.category);
    const today = new Date().toISOString().split('T')[0];
    if (pin.reminderDate === today && !pin.reminderDone) {
        icon.options.className += ' pulse';
    }

    const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
    marker.bindPopup(generatePopupContent(pin), { maxWidth: 300 });
    marker.pinData = pin;
    markers.push(marker);

    // Popup açıldığında Lucide ikonlarını yeniden render et
    marker.on('popupopen', () => {
        if (window.lucide) lucide.createIcons();
    });
}

// Popup HTML üreteci — ID'ler her zaman tırnak içinde string olarak geçilir
function generatePopupContent(pin) {
    const id = pin.id; // string
    const priceFormatted = new Intl.NumberFormat('tr-TR').format(pin.price || 0);

    const reminderSection = pin.reminderDate ? `
        <div style="background: ${pin.reminderDone ? '#f1f5f9' : '#fff1f2'}; padding: 6px; border-radius: 6px; margin-top: 8px; border: 1px solid ${pin.reminderDone ? '#e2e8f0' : '#fecaca'}; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: ${pin.reminderDone ? '#64748b' : '#ef4444'}; font-weight: 600;">
                Görüşme: ${pin.reminderDate}
            </span>
            <button onclick="togglePinReminder('${id}')" style="background: none; border: none; cursor: pointer; color: ${pin.reminderDone ? '#10b981' : '#64748b'};">
                <i data-lucide="${pin.reminderDone ? 'check-circle-2' : 'circle'}" style="width: 16px; height: 16px;"></i>
            </button>
        </div>` : '';

    const ownerDetails = pin.category === 'owner' ? `
        <div style="font-size:0.9rem; font-weight:700; color:#2563eb; margin-bottom:4px;">${priceFormatted} TL</div>
        <div style="font-size:0.7rem; font-weight:700; color:#334155; margin-bottom:5px;">
            Tip: ${PROPERTY_TYPES[pin.propertyType] || pin.propertyType || '-'}
            ${pin.roomCount ? ` | Oda: ${pin.roomCount}` : ''}
            ${pin.floor !== null && pin.floor !== undefined ? ` | Kat: ${pin.floor}` : ''}
            ${pin.buildingAge ? ` | Bina Yaşı: ${pin.buildingAge}` : ''}
            ${pin.usageStatus ? ` | Durum: ${pin.usageStatus}` : ''}
            ${pin.titleDeed ? ` | Tapu: ${pin.titleDeed}` : ''}
            ${pin.m2 ? ` | ${pin.m2} m²` : ''}
        </div>` : `
        <div style="font-size:0.75rem; color:#475569; margin-bottom:5px;">
            ${pin.company ? `<strong>${pin.company}</strong><br>` : ''}
            ${pin.sector ? `Sektör: ${pin.sector}<br>` : ''}
            ${pin.phone ? `Tel: <a href="tel:${pin.phone}" style="color:#2563eb;">${pin.phone}</a>` : ''}
        </div>`;

    return `
        <div class="popup-content">
            <strong style="display:block; margin-bottom:2px; font-size:0.95rem;">${pin.title}</strong>
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px;">${pin.district || ''} / ${pin.neighborhood || ''}</div>
            ${ownerDetails}
            <small style="color: ${(CATEGORIES[pin.category] || CATEGORIES['owner']).color}; font-weight:600;">${(CATEGORIES[pin.category] || CATEGORIES['owner']).label}</small>
            ${reminderSection}
            ${pin.notes ? `<p style="font-size: 0.8rem; margin-top:5px; color:#475569;">${pin.notes}</p>` : ''}
            <div style="margin-top: 10px; display:flex; gap:5px; flex-wrap:wrap;">
                <button onclick="editPin('${id}')" style="border:none; cursor:pointer; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:600;">✏️ Düzenle</button>
                <button onclick="deletePin('${id}')" style="border:none; cursor:pointer; background:#fee2e2; color:#ef4444; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:600;">🗑️ Sil</button>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}" target="_blank" style="text-decoration:none; background:#dcfce7; color:#16a34a; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:600;">🗺️ Yol Tarifi</a>
            </div>
        </div>
    `;
}

// ──────────────────────────────────────────────
// LİSTE RENDER
// ──────────────────────────────────────────────
function renderPinnedList() {
    const container = document.getElementById('pins-container');
    container.innerHTML = '';

    const filtered = getFilteredPins();
    renderTodayTasks();

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">Kriterlere uygun nokta bulunamadı.</p>';
        return;
    }

    // Timestamp'e göre sırala (yeniden eskiye)
    filtered.sort((a, b) => {
        const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return tb - ta;
    }).forEach(pin => {
        const card = document.createElement('div');
        card.className = 'pin-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="category-tag" style="background: ${CATEGORIES[pin.category].color}20; color: ${CATEGORIES[pin.category].color}">
                    ${CATEGORIES[pin.category].label}
                </span>
                ${pin.category === 'owner' ? `
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <small style="font-size:0.65rem; color:#94a3b8;">${pin.district || ''}</small>
                    <small style="font-size:0.65rem; font-weight:600; color:#475569;">
                        ${PROPERTY_TYPES[pin.propertyType] || pin.propertyType || ''}
                        ${pin.roomCount ? ` - ${pin.roomCount}` : ''}
                        ${pin.floor !== null && pin.floor !== undefined ? ` - K:${pin.floor}` : ''}
                        ${pin.buildingAge ? ` - ${pin.buildingAge}Y` : ''}
                        ${pin.titleDeed ? ` - ${pin.titleDeed}` : ''}
                        ${pin.m2 ? ` - ${pin.m2}m²` : ''}
                    </small>
                </div>` : `
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <small style="font-size:0.65rem; color:#94a3b8;">${pin.district || ''}</small>
                    <small style="font-size:0.7rem; font-weight:600; color:#475569;">
                        ${pin.sector || 'Sektör Belirtilmedi'}
                    </small>
                </div>`}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <h4 style="margin:0;">${pin.title}</h4>
                ${pin.category === 'owner' ? `<div style="font-size:0.9rem; font-weight:700; color:#2563eb;">${new Intl.NumberFormat('tr-TR').format(pin.price || 0)} TL</div>` : ''}
            </div>
            <p style="font-size: 0.75rem; color: #64748b; ${pin.category !== 'owner' ? 'margin-bottom:2px;' : 'margin-bottom:4px;'}">${pin.neighborhood || ''}</p>
            ${pin.category !== 'owner' && pin.phone ? `<p style="font-size: 0.75rem; color: #2563eb; font-weight:600; margin-bottom:4px;">${pin.phone}</p>` : ''}
            ${pin.notes ? `<p style="font-size: 0.8rem; color: #475569; border-top: 1px solid #f1f5f9; padding-top:4px;">${pin.notes.substring(0, 60)}${pin.notes.length > 60 ? '...' : ''}</p>` : ''}
            `;

        card.onclick = () => {
            map.flyTo([pin.lat, pin.lng], 16);
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('mobile-open');
            }
        };

        container.appendChild(card);
    });
}

// ──────────────────────────────────────────────
// FİLTRELEME
// ──────────────────────────────────────────────
function getFilteredPins() {
    const cat = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
    const dist = document.getElementById('filter-district').value;
    const neigh = document.getElementById('filter-neighborhood').value;
    const propType = document.getElementById('filter-property-type').value;
    const minM2 = parseInt(document.getElementById('filter-min-m2').value) || 0;
    const minPrice = parseInt(document.getElementById('filter-min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('filter-max-price').value) || Infinity;
    const minFloor = parseInt(document.getElementById('filter-min-floor').value) || -999;
    const searchQuery = document.getElementById('smart-search').value.toLowerCase().trim();

    return savedPins.filter(p => {
        let matchSearch = true;
        if (searchQuery) {
            const searchText = `${p.title || ''} ${p.notes || ''} ${p.neighborhood || ''} ${p.company || ''} ${p.sector || ''} ${p.phone || ''}`.toLowerCase();
            matchSearch = searchText.includes(searchQuery);
        }

        const matchCat = cat === 'all' || p.category === cat;
        const matchDist = dist === 'all' || p.district === dist;
        const matchNeigh = neigh === 'all' || p.neighborhood === neigh;
        const matchProp = propType === 'all' || p.propertyType === propType;
        const matchM2 = (p.m2 || 0) >= minM2;
        // FİYAT FİLTRESİ DÜZELTİLDİ: owner kategorisi dışındakileri fiyat filtresi etkilemez
        const matchPrice = p.category !== 'owner' || ((p.price || 0) >= minPrice && (p.price || 0) <= maxPrice);
        const matchFloor = p.floor === null || p.floor === undefined || p.floor >= minFloor;

        let matchRooms = true;
        if (propType === 'konut' && selectedRooms.length > 0) {
            matchRooms = selectedRooms.includes(p.roomCount);
        }
        let matchAge = true;
        if (selectedAges.length > 0) {
            matchAge = selectedAges.includes(p.buildingAge);
        }
        let matchUsage = true;
        if (selectedUsage.length > 0) {
            matchUsage = selectedUsage.includes(p.usageStatus);
        }
        let matchDeed = true;
        if (selectedDeeds.length > 0) {
            matchDeed = selectedDeeds.includes(p.titleDeed);
        }

        return matchSearch && matchCat && matchDist && matchNeigh && matchProp && matchRooms && matchM2 && matchPrice && matchAge && matchUsage && matchDeed && matchFloor;
    });
}

function applyFilters() {
    const filtered = getFilteredPins();
    const filteredIds = new Set(filtered.map(p => p.id));

    markers.forEach(marker => {
        if (filteredIds.has(marker.pinData.id)) {
            if (!map.hasLayer(marker)) marker.addTo(map);
        } else {
            if (map.hasLayer(marker)) map.removeLayer(marker);
        }
    });

    renderPinnedList();
}

// ──────────────────────────────────────────────
// BUGÜNÜN GÖRÜŞMELERİ
// ──────────────────────────────────────────────
function renderTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = savedPins.filter(p => p.reminderDate === today && !p.reminderDone);

    const section = document.getElementById('today-tasks-section');
    if (!section) return;
    const container = document.getElementById('today-tasks-container');

    if (todayTasks.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = todayTasks.map(pin => `
        <div onclick="focusPin('${pin.id}')" style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #fecaca; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <div style="flex: 1;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #334155;">${pin.title}</div>
                <div style="font-size: 0.7rem; color: #64748b;">${pin.district || ''} / ${pin.neighborhood || ''}</div>
            </div>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #ef4444;"></i>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function focusPin(id) {
    const pinId = String(id);
    const marker = markers.find(m => m.pinData.id === pinId);
    if (marker) {
        map.setView(marker.getLatLng(), 18);
        marker.openPopup();
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }
}

// ──────────────────────────────────────────────
// FORM / KONUM SEÇİCİLERİ
// ──────────────────────────────────────────────
function initLocationSelectors() {
    const districts = Object.keys(LOCATIONS);
    const pinDistrict = document.getElementById('pin-district');
    const filterDistrict = document.getElementById('filter-district');

    districts.forEach(d => {
        pinDistrict.add(new Option(d, d));
        filterDistrict.add(new Option(d, d));
    });

    // Room Chips
    const roomContainer = document.getElementById('filter-rooms');
    ROOM_OPTIONS.forEach(room => {
        const chip = document.createElement('div');
        chip.className = 'room-chip';
        chip.textContent = room;
        chip.onclick = () => toggleRoomFilter(room, chip);
        roomContainer.appendChild(chip);
    });

    // Age Chips
    const ageContainer = document.getElementById('filter-ages');
    AGE_OPTIONS.forEach(age => {
        const chip = document.createElement('div');
        chip.className = 'room-chip';
        chip.textContent = age;
        chip.onclick = () => toggleAgeFilter(age, chip);
        ageContainer.appendChild(chip);
    });

    // Usage Chips
    const usageContainer = document.getElementById('filter-usage');
    USAGE_OPTIONS.forEach(usage => {
        const chip = document.createElement('div');
        chip.className = 'room-chip';
        chip.textContent = usage;
        chip.onclick = () => toggleUsageFilter(usage, chip);
        usageContainer.appendChild(chip);
    });

    // Deed Chips
    const deedContainer = document.getElementById('filter-title-deed');
    DEED_OPTIONS.forEach(deed => {
        const chip = document.createElement('div');
        chip.className = 'room-chip';
        chip.textContent = deed;
        chip.onclick = () => toggleDeedFilter(deed, chip);
        deedContainer.appendChild(chip);
    });
}

function toggleRoomFilter(room, element) {
    if (selectedRooms.includes(room)) {
        selectedRooms = selectedRooms.filter(r => r !== room);
        element.classList.remove('active');
    } else {
        selectedRooms.push(room);
        element.classList.add('active');
    }
    applyFilters();
}

function toggleAgeFilter(age, element) {
    if (selectedAges.includes(age)) {
        selectedAges = selectedAges.filter(a => a !== age);
        element.classList.remove('active');
    } else {
        selectedAges.push(age);
        element.classList.add('active');
    }
    applyFilters();
}

function toggleUsageFilter(usage, element) {
    if (selectedUsage.includes(usage)) {
        selectedUsage = selectedUsage.filter(u => u !== usage);
        element.classList.remove('active');
    } else {
        selectedUsage.push(usage);
        element.classList.add('active');
    }
    applyFilters();
}

function toggleDeedFilter(deed, element) {
    if (selectedDeeds.includes(deed)) {
        selectedDeeds = selectedDeeds.filter(d => d !== deed);
        element.classList.remove('active');
    } else {
        selectedDeeds.push(deed);
        element.classList.add('active');
    }
    applyFilters();
}

function populateNeighborhoods(district, selectElement, defaultText, isFilter = false) {
    selectElement.innerHTML = '';
    selectElement.add(new Option(isFilter ? "Tüm Mahalleler" : defaultText, isFilter ? "all" : ""));

    if (district && district !== 'all' && LOCATIONS[district]) {
        LOCATIONS[district].forEach(m => {
            selectElement.add(new Option(m, m));
        });
    }
}

function handleCategoryChange(category) {
    const businessFields = document.getElementById('business-fields');
    const propertyFields = document.getElementById('property-fields');
    const fieldCompany = document.getElementById('field-company');
    const labelTitle = document.getElementById('label-title');

    if (category === 'esnaf' || category === 'office' || category === 'contractor') {
        businessFields.classList.remove('hidden');
        fieldCompany.classList.remove('hidden');
        propertyFields.classList.add('hidden');
        labelTitle.textContent = 'İsim / Soyisim';
    } else { // owner
        businessFields.classList.add('hidden');
        fieldCompany.classList.add('hidden');
        propertyFields.classList.remove('hidden');
        labelTitle.textContent = 'Başlık / Portföy';
    }
}

// ──────────────────────────────────────────────
// EVENT LİSTENERS
// ──────────────────────────────────────────────
function setupEventListeners() {
    // Form Submit
    document.getElementById('add-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewPin();
    });

    // İlçe değişimi → mahalleleri doldur
    document.getElementById('pin-district').addEventListener('change', (e) => {
        const district = e.target.value;
        const neighborhoodSelect = document.getElementById('pin-neighborhood');
        populateNeighborhoods(district, neighborhoodSelect, "Önce İlçe Seçiniz");
    });

    // Kategori değişimi → form alanları
    document.getElementById('pin-category').addEventListener('change', (e) => {
        handleCategoryChange(e.target.value);
    });

    // Filtre: ilçe
    document.getElementById('filter-district').addEventListener('change', (e) => {
        const district = e.target.value;
        const neighborhoodSelect = document.getElementById('filter-neighborhood');
        populateNeighborhoods(district, neighborhoodSelect, "Tüm Mahalleler", true);
        applyFilters();
    });

    document.getElementById('filter-neighborhood').addEventListener('change', () => applyFilters());
    document.getElementById('filter-min-m2').addEventListener('input', () => applyFilters());
    document.getElementById('filter-min-price').addEventListener('input', () => applyFilters());
    document.getElementById('filter-max-price').addEventListener('input', () => applyFilters());
    document.getElementById('filter-min-floor').addEventListener('input', () => applyFilters());

    // Emlak tipi filtresi → oda sayısı chip'ini göster/gizle
    document.getElementById('filter-property-type').addEventListener('change', (e) => {
        const type = e.target.value;
        const roomFilter = document.getElementById('room-filter-container');
        if (type === 'konut') {
            roomFilter.classList.remove('hidden');
        } else {
            roomFilter.classList.add('hidden');
        }
        applyFilters();
    });

    // Form: emlak tipi → oda sayısı select
    document.getElementById('pin-property-type').addEventListener('change', (e) => {
        const type = e.target.value;
        const roomContainer = document.getElementById('pin-rooms-container');
        if (type === 'konut') {
            roomContainer.classList.remove('hidden');
        } else {
            roomContainer.classList.add('hidden');
            document.getElementById('pin-rooms').value = '';
        }
    });

    // Kategori filtre butonları
    document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-category]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    // Akıllı arama
    document.getElementById('smart-search').addEventListener('input', () => applyFilters());

    // Gelişmiş filtreler toggle
    document.getElementById('toggle-filters').addEventListener('click', (e) => {
        const container = document.getElementById('advanced-filters-container');
        const btn = e.currentTarget;
        const isHidden = container.classList.toggle('hidden');
        btn.classList.toggle('active', !isHidden);
    });

    // Hamburger butonu — sidebar aç/kapat
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function openSidebar() {
        document.getElementById('sidebar').classList.add('mobile-open');
        sidebarOverlay.classList.add('active');
        hamburgerBtn.classList.add('open');
        document.body.style.overflow = 'hidden'; // arkayı kilitle
    }

    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        hamburgerBtn.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', () => {
        const isOpen = document.getElementById('sidebar').classList.contains('mobile-open');
        isOpen ? closeSidebar() : openSidebar();
    });

    // Overlay'e tıklayınca sidebar kapat
    sidebarOverlay.addEventListener('click', closeSidebar);

    // FAB (sağ alt) → harita merkezine pin ekle modunu aç
    document.getElementById('add-btn-mobile').addEventListener('click', () => {
        closeSidebar();
        // Haritanın görünür merkezine pin eklemek için modal aç
        tempMarkerPos = map.getCenter();
        editingPinId = null;
        document.getElementById('modal-title').textContent = 'Yeni Nokta Ekle';
        openModal();
    });

    // Modal dışına tıklayınca kapat
    document.getElementById('add-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('add-modal')) {
            closeModal();
        }
    });
}

// ──────────────────────────────────────────────
// EXPORT / IMPORT
// ──────────────────────────────────────────────
function exportData() {
    const dataStr = JSON.stringify(savedPins, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `saha_harita_yedek_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedPins = JSON.parse(e.target.result);
            if (!Array.isArray(importedPins)) {
                alert('Hatalı dosya formatı.');
                return;
            }

            if (!db) {
                alert('Firebase bağlantısı yok. İçe aktarma yapılamadı.');
                return;
            }

            const existingIds = new Set(savedPins.map(p => p.id));
            const newPins = importedPins.filter(p => !existingIds.has(p.id));

            if (newPins.length === 0) {
                alert('Eklenecek yeni nokta bulunamadı (tüm noktalar zaten sistemde mevcut).');
                return;
            }

            const confirmMsg = `${newPins.length} yeni nokta Firebase'e aktarılacak. Devam edilsin mi?`;
            if (!confirm(confirmMsg)) return;

            // Batch write ile Firestore'a kaydet
            const batch = db.batch();
            newPins.forEach(pin => {
                const { id, timestamp, updatedAt, ...pinData } = pin; // Eski ID ve timestamp'i çıkar
                const docRef = db.collection('pins').doc(); // Yeni ID üret
                batch.set(docRef, {
                    ...pinData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            batch.commit()
                .then(() => {
                    alert(`${newPins.length} nokta başarıyla Firebase'e aktarıldı.`);
                })
                .catch(err => {
                    console.error('İçe aktarma hatası:', err);
                    alert('İçe aktarma sırasında hata: ' + err.message);
                });

        } catch (err) {
            console.error(err);
            alert('Dosya okunurken bir hata oluştu.');
        } finally {
            event.target.value = ''; // Input'u sıfırla
        }
    };
    reader.readAsText(file);
}

// ──────────────────────────────────────────────
// SERVICE WORKER
// ──────────────────────────────────────────────
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Kayıtlı', reg))
            .catch(err => console.log('SW Başarısız', err));
    }
}
