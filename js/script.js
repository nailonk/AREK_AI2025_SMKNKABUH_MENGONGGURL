/* ======================================================
   GREETING & JAM REAL TIME (INDEX)
====================================================== */

let nama = localStorage.getItem("userName");
if (!nama) {
  nama = prompt("Masukkan Nama Anda") || "";
  localStorage.setItem("userName", nama);
}

// fungsi menentukan ucapan
function getGreetingByTime() {
  const hour = new Date().getHours();

  if (hour >= 4 && hour < 11) {
    return "Selamat Pagi";
  } else if (hour >= 11 && hour < 15) {
    return "Selamat Siang";
  } else if (hour >= 15 && hour < 18) {
    return "Selamat Sore";
  } else {
    return "Selamat Malam";
  }
}

const greet = getGreetingByTime();
document.getElementById("greeting").textContent = `${greet} ${nama}!`;

function updateJam() {
    const jam = document.getElementById("jam");
    if (!jam) return;

    const date = new Date();
    jam.textContent =
        `${String(date.getHours()).padStart(2, "0")}:` +
        `${String(date.getMinutes()).padStart(2, "0")}:` +
        `${String(date.getSeconds()).padStart(2, "0")}`;
}

setInterval(updateJam, 1000);
updateJam();


/* ======================================================
   TIMER & RIWAYAT (WAKTU.HTML)
====================================================== */
document.addEventListener("DOMContentLoaded", () => {

    // Sesuaikan dengan waktu.html → ID form-nya adalah "kegiatan"
    const form = document.getElementById("kegiatan");
    if (!form) return; // skip jika bukan halaman waktu

    const kegiatanInput = document.getElementById("waktu");
    const jamInput = document.getElementById("jam");
    const menitInput = document.getElementById("menit");
    const output = document.getElementById("output");
    const section = document.getElementById("section");

    // Batasi input angka
    [jamInput, menitInput].forEach((input) => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/[^0-9]/g, "");
        });
    });

    // Event submit form
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const kegiatan = kegiatanInput.value.trim();
        const jam = parseInt(jamInput.value) || 0;
        const menit = parseInt(menitInput.value) || 0;

        if (!kegiatan) {
            output.textContent = "Nama kegiatan harus diisi";
            output.classList.remove("hidden");
            return;
        }
        if (jam === 0 && menit === 0) {
            output.textContent = "Durasi tidak boleh 0";
            output.classList.remove("hidden");
            return;
        }

        output.classList.add("hidden");
        section.classList.remove("hidden");

        startKegiatan(kegiatan, jam, menit);
        kegiatanInput.value = "";
        jamInput.value = 0;
        menitInput.value = 5;
    });
});


// =========================
//   FUNGSI UTAMA DIGANTI
// =========================
function startKegiatan(kegiatan, jam, menit) {

    let timeLeft = (jam * 60 + menit) * 60;
    const durasiAwal = timeLeft;  // ← dalam detik
    const totalTime = timeLeft;

    const namaKegiatan = document.getElementById("waktuAktif");
    const timerDisplay = document.getElementById("kegiatanTimer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const resetBtn = document.getElementById("resetBtn");
    const finishBtn = document.getElementById("finishBtn");
    finishBtn.classList.add("hidden");

    namaKegiatan.textContent = kegiatan;

    const timerInterval = setInterval(updateTimer, 1000);

    function updateTimer() {
        if (timeLeft > 0) {
            timeLeft--;

            const h = Math.floor(timeLeft / 3600);
            const m = Math.floor((timeLeft % 3600) / 60);
            const s = timeLeft % 60;

            timerDisplay.textContent =
                `${String(h).padStart(2, "0")}:` +
                `${String(m).padStart(2, "0")}:` +
                `${String(s).padStart(2, "0")}`;

            const progress = ((totalTime - timeLeft) / totalTime) * 100;
            progressBar.style.width = progress + "%";
            progressText.textContent = Math.floor(progress) + "% Selesai";

        } else {
            clearInterval(timerInterval);
            progressText.textContent = "Waktu habis!";
            finishBtn.classList.remove("hidden");
        }
    }

resetBtn.addEventListener("click", () => {
    Swal.fire({
        title: "Batalkan aktivitas?",
        text: "Waktu berjalan akan hilang dan tidak disimpan ke riwayat.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, batalkan",
        cancelButtonText: "Tidak",
    }).then((result) => {
        if (result.isConfirmed) {
            clearInterval(timerInterval);

            // kembali ke form
            document.getElementById("section").classList.add("hidden");
            document.getElementById("kegiatan").classList.remove("hidden");

            // reset tampilan timer
            document.getElementById("kegiatanTimer").textContent = "00:00:00";
            progressBar.style.width = "0%";
            progressText.textContent = "0% Selesai";

            Swal.fire({
                title: "Dibatalkan",
                text: "Aktivitas telah dibatalkan.",
                icon: "success",
                confirmButtonText: "OK",
            });
        }
    });
});


    finishBtn.addEventListener("click", () => {
        finishBtn.classList.add("hidden");
        clearInterval(timerInterval);

        progressBar.style.width = "100%";
        progressText.textContent = "Selesai";

        let menitDipakai = Math.floor((durasiAwal - timeLeft) / 60);

        let point = Math.floor(menitDipakai / 5);

        simpanRiwayat(kegiatan, durasiAwal, timeLeft, point);

        setTimeout(() => {
            document.getElementById("section").classList.add("hidden");
            document.getElementById("kegiatan").classList.remove("hidden");
            Swal.fire({
            title: "Kegiatan Selesai!",
            html: `
                <b>${menitDipakai} menit</b><br>
                Poin Didapat: <b>${point}</b>
            `,
            icon: "success",
            confirmButtonText: "OK",
        });

    }, 300);
}, { once: true });
}


/* ======================================================
   RESET HARIAN + POIN GLOBAL
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toLocaleDateString("id-ID");
    const lastOpen = localStorage.getItem("lastOpenDate");

    if (lastOpen !== today) {
        localStorage.removeItem("riwayatKegiatan"); 
    }

    localStorage.setItem("lastOpenDate", today);

    loadRiwayat();
    updatePoinUI();
});


/* ======================================================
   SIMPAN RIWAYAT BELAJAR
====================================================== */

function simpanRiwayat(waktu, durasiAwal, timeLeft, poinInput) {
    let data = JSON.parse(localStorage.getItem("riwayatKegiatan")) || [];

    const menitDipakai = Math.floor((durasiAwal - timeLeft) / 60);
    const poin = Math.floor(menitDipakai / 5);

    const tanggal = new Date().toLocaleDateString("id-ID");

    data.push({
        waktu,
        tanggal,
        menitDipakai,
        poin
    });

    localStorage.setItem("riwayatKegiatan", JSON.stringify(data));

    let totalPoin = Number(localStorage.getItem("totalPoin")) || 0;
    totalPoin += poin;
    localStorage.setItem("totalPoin", totalPoin);

    loadRiwayat();
    updatePoinUI();
}



function loadRiwayat() {
    const container = document.getElementById("riwayatList");
    if (!container) return;

    let data = JSON.parse(localStorage.getItem("riwayatKegiatan")) || [];
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm">Belum ada riwayat aktivitas.</p>`;
        return;
    }

    data.forEach((item, index) => {
    container.innerHTML += `
        <div class="p-3 rounded-lg border bg-gray-50 flex justify-between">
            <div>
                <p class="font-semibold">${index + 1}. ${item.waktu}</p>
                <p class="text-sm text-gray-500">${item.tanggal} • ${item.menitDipakai} menit</p>
            </div>
            <div class="text-yellow-500 font-bold">+${item.poin}</div>
        </div>
    `;
});

}

function updatePoinUI() {
    const el = document.getElementById("poinUser");
    if (el) {
        const poin = Number(localStorage.getItem("totalPoin")) || 0;
        el.innerText = poin;
    }

    updateLevelUI(); // ← tambahkan ini
}

/* ======================================================
   REWARD SYSTEM (REWARD.HTML)
====================================================== */
// --- LEVEL TITLES (15 LEVEL BARU) ---
const levelTitles = [
    "Fresh Starter",
    "Time Explorer",
    "Habit Novice",
    "Focus Trainee",
    "Daily Grinder",
    "Task Handler",
    "Rhythm Keeper",
    "Momentum Builder",
    "Discipline Warrior",
    "Productivity Adept",
    "Focus Guardian",
    "Efficiency Master",
    "Time Commander",
    "Mindflow Elite",
    "Grand Productivity Sage"
];

// --- HITUNG LEVEL BERDASARKAN POIN ---
function getLevel(totalPoin) {
    let level = Math.floor(totalPoin / 200) + 1;
    if (level > 15) level = 15;
    return level;
}

// --- UPDATE UI LEVEL ---
function updateLevelUI() {
    let totalPoin = Number(localStorage.getItem("totalPoin")) || 0;

    let level = getLevel(totalPoin);
    let title = levelTitles[level - 1];

    document.getElementById("level-number").innerText = "Level " + level;
    document.getElementById("level-name").innerText = title;
}


document.addEventListener("DOMContentLoaded", () => {
    const poinElem = document.getElementById("poinUser");
    if (!poinElem) return;

    let poin = Number(localStorage.getItem("totalPoin")) || 0;
    poinElem.innerText = poin;

    const buttons = document.querySelectorAll(".reward-btn");

    // Ambil data reward yang sudah dibeli
    let rewardUnlocked = JSON.parse(localStorage.getItem("rewardUnlocked")) || {};

    // Tandai reward yang sudah dibeli
    buttons.forEach(btn => {
        const harga = parseInt(btn.getAttribute("data-harga"));
        const namaReward = btn.parentElement.querySelector("h4").innerText;

        if (rewardUnlocked[namaReward]) {
            btn.innerText = "Sudah Dibeli";
            btn.disabled = true;
            btn.classList.add("opacity-50", "cursor-not-allowed");
        }

        btn.addEventListener("click", () => {
            let currentPoin = Number(localStorage.getItem("totalPoin")) || 0;

            if (currentPoin < harga) {
                alert("Poin kamu tidak cukup");
                return;
            }

            // Kurangi poin
            currentPoin -= harga;
            localStorage.setItem("totalPoin", currentPoin);
            poinElem.innerText = currentPoin;

            // Cek apakah reward adalah gacha
            if (namaReward.includes("Gacha")) {
                lakukanGacha();
            } else {
                // Simpan sebagai "sudah dibeli"
                rewardUnlocked[namaReward] = true;
                localStorage.setItem("rewardUnlocked", JSON.stringify(rewardUnlocked));

                btn.innerText = "Sudah Dibeli";
                btn.disabled = true;
                btn.classList.add("opacity-50", "cursor-not-allowed");

                alert("Reward berhasil ditukar!");
            }
        });
    });
});


/* ======================================================
   FUNGSI GACHA
====================================================== */
function lakukanGacha() {
    const hadiah = [
        "🍬 Candy",
        "🧸 Boneka Mini",
        "🎲 Mini Dice",
        "🎧 Stiker Musik",
        "🐱 Stiker Kucing",
        "💎 Kristal Biru",
        "🎮 Keychain Gamepad",
        "⭐ Badge Keren"
    ];

    const randomItem = hadiah[Math.floor(Math.random() * hadiah.length)];

    // Simpan item ke localStorage
    let koleksi = JSON.parse(localStorage.getItem("koleksiGacha")) || [];
    koleksi.push(randomItem);
    localStorage.setItem("koleksiGacha", JSON.stringify(koleksi));

    alert("🎁 Kamu mendapatkan: " + randomItem);
}

/* ======================================================
   MONEY PLANNER (UANG.HTML)
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const formTarget = document.getElementById("target");
    const formTransaksi = document.getElementById("transaksi");
    const finishTargetBtn = document.getElementById("finish-target");

    if (!formTarget || !formTransaksi) return;

    let targetName = localStorage.getItem("targetName") || "-";
    let targetHarga = Number(localStorage.getItem("targetHarga")) || 0;
    let targetTabungan = Number(localStorage.getItem("targetTabungan")) || 0;

    document.getElementById("target-name").innerText = targetName;
    document.getElementById("target-saved").innerText = "Rp " + targetTabungan.toLocaleString();
    document.getElementById("target-price").innerText = "/ Rp " + targetHarga.toLocaleString();

    updateProgress();
    loadRiwayatUang();


    /* SET TARGET */
    formTarget.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("nama-target").value;
        const harga = Number(document.getElementById("harga-target").value);

        if (!name || harga <= 0) {
            alert("Harap isi target dengan benar!");
            return;
        }

        localStorage.setItem("targetName", name);
        localStorage.setItem("targetHarga", harga);
        localStorage.setItem("targetTabungan", 0);

        targetName = name;
        targetHarga = harga;
        targetTabungan = 0;

        document.getElementById("target-name").innerText = name;
        document.getElementById("target-price").innerText = "/ Rp " + harga.toLocaleString();
        document.getElementById("target-saved").innerText = "Rp 0";

        updateProgress();
    });


    /* TRANSAKSI */
    formTransaksi.addEventListener("submit", (e) => {
        e.preventDefault();

        const nama = document.getElementById("keterangan").value.trim();
        const jumlah = Number(document.getElementById("jumlah").value);
        const jenis = e.submitter.value;
        const tanggal = new Date().toLocaleString("id-ID");

        if (!nama || jumlah <= 0) {
            alert("Isi transaksi dengan benar!");
            return;
        }

        let finalJumlah = jumlah;
        if (jenis === "keluar") finalJumlah = -jumlah;

        let riwayat = JSON.parse(localStorage.getItem("riwayatUang")) || [];
        riwayat.push({ nama, jumlah: finalJumlah, jenis, tanggal });
        localStorage.setItem("riwayatUang", JSON.stringify(riwayat));

        targetTabungan += finalJumlah;
        localStorage.setItem("targetTabungan", targetTabungan);

        document.getElementById("target-saved").innerText = rupiah(targetTabungan);
        document.getElementById("target-price").innerText = "/ " + rupiah(targetHarga);

        updateProgress();
        loadRiwayatUang();

        formTransaksi.reset();
    });


    /* PROGRESS */
    function updateProgress() {
        const progress = targetHarga > 0 ? (targetTabungan / targetHarga) * 100 : 0;

        document.getElementById("target-progress").style.width = progress + "%";

        document.getElementById("target-percent").innerText =
            `${Math.floor(progress)}% tercapai • ${rupiah(targetTabungan)} dari ${rupiah(targetHarga)}`;

        const finishBtn = document.getElementById("finish-target");

        if (progress >= 100) {
            finishBtn.classList.remove("hidden");
        } else {
            finishBtn.classList.add("hidden");
        }
    }


    function rupiah(nominal) {
        nominal = Number(nominal);
        return nominal.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }


    /* RIWAYAT UANG */
    function loadRiwayatUang() {
        let riwayat = JSON.parse(localStorage.getItem("riwayatUang")) || [];
        const box = document.getElementById("riwayat-list");
        box.innerHTML = "";

        if (riwayat.length === 0) {
            box.innerHTML = "<p class='text-white-500'>Belum ada riwayat.</p>";
            return;
        }

        riwayat.forEach((item, i) => {
            box.innerHTML += `
                <div class="p-3 bg-slate-100 rounded-lg shadow flex justify-between">
                    <div>
                        <p class="font-medium text-slate-800">${i + 1}. ${item.nama}</p>
                        <p class="text-xs text-slate-600">${rupiah(item.jumlah)}</p>
                    </div>
                </div>
            `;
        });
    }


    /* ===========================
       FIX: BUTTON SELESAI TARGET
    ============================ */
    finishTargetBtn.addEventListener("click", () => {
        Swal.fire({
            title: "Selesaikan Target?",
            text: "Semua riwayat dan tabungan akan direset!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, reset",
            cancelButtonText: "Batal"
        }).then(result => {
            if (result.isConfirmed) {

                // Hapus data
                localStorage.removeItem("targetName");
                localStorage.removeItem("targetHarga");
                localStorage.removeItem("targetTabungan");
                localStorage.removeItem("riwayatUang");

                // Reset variabel
                targetName = "-";
                targetHarga = 0;
                targetTabungan = 0;

                // Reset UI
                document.getElementById("target-name").innerText = "-";
                document.getElementById("target-saved").innerText = "Rp 0";
                document.getElementById("target-price").innerText = "/ Rp 0";

                updateProgress();
                loadRiwayatUang();

                Swal.fire("Berhasil!", "Target telah diselesaikan 🎉", "success");
            }
        });
    });
});


/* ======================================================
   FITUR YANG TERBUKA (INDEX)
====================================================== */

const fiturUnlock = {
    2: "🎉 Dark Mode",
    3: "🔥 Mode Fokus",
    5: "✨ Tema Pastel",
    10: "🎁 Item Gacha",
    15: "⭐ Elite Productivity Badge"
};

function updateUnlockedFeatures() {
    const box = document.getElementById("fitur-terbuka");
    if (!box) return;

    const totalPoin = Number(localStorage.getItem("totalPoin")) || 0;
    const level = getLevel(totalPoin);

    let list = "";

    Object.keys(fiturUnlock).forEach(lv => {
        if (level >= lv) {
            list += `
                <div class="p-3 mb-2 bg-blue-600 text-white rounded-lg">
                    ✔ ${fiturUnlock[lv]}
                </div>
            `;
        }
    });

    if (list === "") {
        box.innerHTML = `
            <div class="card">
                <p class="text-white">Belum ada fitur yang terbuka.<br>Kumpulkan poin untuk membuka mode baru!</p>
            </div>
        `;
    } else {
        box.innerHTML = list;
    }
}

updateUnlockedFeatures();
