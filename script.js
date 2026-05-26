const $ = (s) => document.querySelector(s);

let userName = localStorage.userName || "";
let balance = 0;
let videoIndex = 0;
let videoUnlocked = false;
let spinCount = 0;

const videoFiles = [
    "videos/1t.mp4",
    "videos/2t.mp4",
    "videos/3t.mp4",
    "videos/4t.mp4"
];

// Recompensa aleatoria entre 7-12 USD en colones (1 USD ≈ 500 CRC → 3500-6000 CRC)
function randomReward() {
    const usd = 7 + Math.random() * 5; // 7 a 12 USD
    return Math.round(usd * 500); // convertir a colones
}

const rewards = videoFiles.map(() => randomReward());

const reactions = [
    ["🔥", "VIRAL"], ["🚀", "TOP"], ["👍", "BUENO"],
    ["😐", "MEH"], ["⚠️", "PELIGRO"], ["👎", "FLOP"]
];

// ==================== NAVEGACIÓN ====================
function stopAllVideos() {
    document.querySelectorAll("video").forEach(v => {
        try { v.pause(); v.currentTime = 0; } catch (e) {}
    });
}

function go(id) {
    stopAllVideos();
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    history.replaceState(null, "", location.pathname);
    window.currentPage = id;
    updateToasts(id);
    if (id === "video") buildSlides();
    if (id === "spin") setupSpin();
    if (id === "final") setupFinal();
    if (id === "selected") runVerification();
}

// ==================== SINCRONIZAR NOMBRE ====================
function syncName() {
    const raw = userName || "Nombre";
    const short = raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
    $("#who").textContent = short;
    $("#who2").textContent = short;
    $("#initial").textContent = raw[0].toUpperCase();
    $("#userBadge").textContent = raw[0].toUpperCase();
}

// ==================== CONTADOR EN LÍNEA ====================
setInterval(() => {
    $("#online").textContent = (5180 + Math.floor(Math.random() * 160)).toLocaleString("es-CR");
}, 1600);

// ==================== INICIO ====================
$("#name").addEventListener("input", e => {
    userName = e.target.value.trim();
    $("#continue").disabled = !userName;
});
$("#continue").onclick = () => {
    localStorage.userName = userName;
    syncName();
    go("selected");
};

// ==================== SELECCIONADO ====================
function runVerification() {
    const bar = document.getElementById("verifyBar");
    const checks = document.querySelectorAll(".verify-check");
    const btn = document.getElementById("verifyContinue");

    bar.classList.remove("running", "done");
    checks.forEach(c => c.classList.remove("done"));
    btn.disabled = true;
    btn.textContent = "VERIFICANDO...";
    btn.style.opacity = "0.5";

    void bar.offsetWidth;
    bar.classList.add("running");

    [800, 2000, 3200, 4400].forEach((delay, i) => {
        setTimeout(() => {
            if (window.currentPage === "selected" && checks[i]) checks[i].classList.add("done");
        }, delay);
    });

    setTimeout(() => {
        if (window.currentPage === "selected") {
            bar.classList.add("done");
            btn.disabled = false;
            btn.textContent = "CONTINUAR ❯";
            btn.style.opacity = "1";
        }
    }, 5000);
}

// ==================== VIDEO TIKTOK ====================
let slides = [];
let currentSlide = 0;

function buildSlides() {
    if (slides.length) return;
    const swiper = document.getElementById("tiktokSwiper");
    swiper.innerHTML = "";
    slides = videoFiles.map((file, i) => {
        const slide = document.createElement("div");
        slide.className = "tiktok-slide";

        const video = document.createElement("video");
        video.src = file;
        video.playsInline = true;
        video.setAttribute("webkit-playsinline", "");
        video.preload = "metadata";
        video.loop = false;
        video.muted = false;
        video.volume = 1;
        slide.appendChild(video);

        const info = document.createElement("div");
        info.className = "tiktok-slide-info";
        info.innerHTML = `<div class="author">@creador_0${i + 1}</div><div class="desc">Mira hasta el final · #fyp #viral</div>`;
        slide.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "tiktok-side-actions";
        actions.innerHTML = `
            <button class="tiktok-side-btn like-btn"><span class="side-icon">❤</span><span>${Math.floor(Math.random() * 90 + 10)}K</span></button>
            <button class="tiktok-side-btn"><span class="side-icon">💬</span><span>${Math.floor(Math.random() * 9 + 1)}K</span></button>
            <button class="tiktok-side-btn"><span class="side-icon">🔖</span><span>Guardar</span></button>
            <button class="tiktok-side-btn"><span class="side-icon">↗</span><span>Compartir</span></button>
        `;
        slide.appendChild(actions);

        const progress = document.createElement("div");
        progress.className = "tiktok-progress-line";
        slide.appendChild(progress);

        const lock = document.createElement("div");
        lock.className = "tiktok-play-overlay";
        lock.innerHTML = `<div class="play-btn">▶</div><div class="play-label">Toca para reproducir</div>`;
        slide.appendChild(lock);

        swiper.appendChild(slide);

        return {
            videoEl: video,
            lockEl: lock,
            progressEl: progress,
            actionsEl: actions,
            slideEl: slide,
            unlocked: false,
            index: i,
            reward: rewards[i]
        };
    });

    setupSwipe();
    activateSlide(0);
}

function setupSwipe() {
    const swiper = document.getElementById("tiktokSwiper");
    let startY = 0;
    swiper.addEventListener("touchstart", e => { startY = e.touches[0].clientY; }, { passive: true });
    swiper.addEventListener("touchend", e => {
        const diff = startY - e.changedTouches[0].clientY;
        if (Math.abs(diff) > 35) {
            if (diff > 0 && currentSlide < slides.length - 1) activateSlide(currentSlide + 1);
            else if (diff < 0 && currentSlide > 0) activateSlide(currentSlide - 1);
        }
    });
}

function activateSlide(i) {
    if (i === currentSlide && slides[i]?.unlocked) return;
    if (slides[currentSlide]) {
        const p = slides[currentSlide];
        p.videoEl.pause();
        p.videoEl.currentTime = 0;
        p.progressEl.style.width = "0%";
        p.lockEl.classList.remove("hidden");
        p.unlocked = false;
    }
    currentSlide = i;
    const d = slides[i];
    d.slideEl.scrollIntoView({ behavior: "smooth" });
    updateUI(i);

    const v = d.videoEl;
    v.onended = () => {
        d.unlocked = true;
        d.progressEl.style.width = "100%";
        d.lockEl.classList.add("hidden");
        setEnabled(true);
    };
    v.ontimeupdate = () => {
        if (v.duration && isFinite(v.duration))
            d.progressEl.style.width = Math.min(100, (v.currentTime / v.duration) * 100) + "%";
        if (v.currentTime >= 5 && !d.unlocked) {
            d.unlocked = true;
            d.lockEl.classList.add("hidden");
            setEnabled(true);
            $("#readyText").textContent = "¡Listo!";
        }
    };

    d.lockEl.onclick = async e => {
        e.preventDefault();
        if (d.unlocked) return;
        d.lockEl.querySelector(".play-btn").textContent = "⏳";
        try {
            v.currentTime = 0;
            v.muted = false;
            v.volume = 1;
            await v.play();
        } catch (err) {
            d.lockEl.querySelector(".play-btn").textContent = "▶";
        }
    };

    let lastTap = 0;
    d.slideEl.addEventListener("click", e => {
        if (Date.now() - lastTap < 300 && !e.target.closest("button"))
            showHeart(e, d.slideEl);
        lastTap = Date.now();
    });

    const likeBtn = d.actionsEl.querySelector(".like-btn");
    likeBtn.onclick = () => {
        likeBtn.classList.toggle("liked");
        if (likeBtn.classList.contains("liked"))
            showHeart({ clientX: likeBtn.getBoundingClientRect().left, clientY: likeBtn.getBoundingClientRect().top }, d.slideEl);
    };
}

function showHeart(e, slide) {
    const h = document.createElement("div");
    h.className = "heart-burst";
    h.textContent = "❤️";
    h.style.left = (e.clientX - slide.getBoundingClientRect().left - 28) + "px";
    h.style.top = (e.clientY - slide.getBoundingClientRect().top - 28) + "px";
    slide.appendChild(h);
    setTimeout(() => h.remove(), 700);
}

function showEmoji(emoji, slide) {
    const f = document.createElement("div");
    f.className = "emoji-float";
    f.textContent = emoji;
    f.style.left = "50%";
    f.style.top = "40%";
    slide.appendChild(f);
    setTimeout(() => f.remove(), 1000);
}

function updateUI(i) {
    videoIndex = i;
    $("#videoCounter").textContent = (i + 1) + "/" + videoFiles.length;
    $("#rewardTop").textContent = Math.round(rewards[i]).toLocaleString("es-CR");
    $("#bal").textContent = Math.round(balance).toLocaleString("es-CR");
    renderDots();
    renderReactions();
    setEnabled(false);
    $("#readyText").textContent = "Bloqueado";
}

function renderDots() {
    const p = $("#progress");
    p.innerHTML = "";
    for (let i = 0; i < videoFiles.length; i++) {
        const s = document.createElement("span");
        s.className = "dot-seg" + (i <= videoIndex ? " on" : "");
        p.appendChild(s);
    }
}

function renderReactions() {
    const b = $("#choices");
    b.innerHTML = "";
    reactions.forEach(r => {
        const btn = document.createElement("button");
        btn.className = "tiktok-reaction-btn";
        btn.disabled = true;
        btn.innerHTML = "<b>" + r[0] + "</b>" + r[1];
        btn.onclick = () => chooseReaction(btn);
        b.appendChild(btn);
    });
}

function setEnabled(v) {
    videoUnlocked = v;
    document.querySelectorAll(".tiktok-reaction-btn").forEach(b => {
        b.disabled = !v;
        b.style.pointerEvents = v ? "auto" : "none";
    });
    $("#readyText").textContent = v ? "¡Listo!" : "Bloqueado";
}

function chooseReaction(btn) {
    const d = slides[currentSlide];
    if (!d || !d.unlocked) return;
    document.querySelectorAll(".tiktok-reaction-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    balance += d.reward;
    $("#bal").textContent = Math.round(balance).toLocaleString("es-CR");
    $("#modalReward").textContent = Math.round(d.reward).toLocaleString("es-CR");
    $("#modalCash").textContent = Math.round(d.reward).toLocaleString("es-CR");
    showEmoji(btn.querySelector("b").textContent, d.slideEl);
    $("#nextVideo").textContent = currentSlide < videoFiles.length - 1
        ? (videoFiles.length - currentSlide - 1) + " video más →"
        : "Abrir rueda de bono →";
    $("#rewardModal").classList.add("show");
}

$("#nextVideo").onclick = () => {
    $("#rewardModal").classList.remove("show");
    if (currentSlide < videoFiles.length - 1) activateSlide(currentSlide + 1);
    else { balance = 89200; go("spin"); }
};

// ==================== DATOS ====================
const ranks = [
    ["1", "Marie L. 🇨🇷 👑", "₡4,923,500"],
    ["2", "Thomas P. 🇨🇷 💎", "₡4,261,500"],
    ["3", "Lea M. 🇨🇷 🔥", "₡3,552,500"],
    ["4", "Nicolas D. 🇨🇷 ⭐", "₡3,144,500"],
    ["5", "Camille B. 🇨🇷 ⭐", "₡2,767,000"]
];
const withdrawals = [
    ["Jessica M.", "PayPal · 15 Ene", "₡620,000"],
    ["Brandon K.", "CashApp · 14 Ene", "₡445,250"],
    ["Logan S.", "Banco · ahora", "₡175,500"],
    ["Isabella R.", "PayPal · 2 min", "₡1,431,000"],
    ["Mia C.", "PayPal · 5 min", "₡920,000"],
    ["David L.", "Zelle · 18 min", "₡2,010,500"]
];
const reviewsData = [
    ["Julia S.", "1 día", "¡Recibí mi primer retiro en 24 horas!"],
    ["Mark T.", "2 días", "Fácil de usar, pagos rápidos."],
    ["Sophie R.", "3 días", "¡Gran plataforma!"],
    ["Lucas P.", "5 días", "¡Ya gané más de ₡1,000,000 este mes!"]
];

function fillLists() {
    const templates = {
        finalRankList: ranks.map((r, i) => {
            let cls = "";
            if (i === 1) cls = "silver";
            if (i === 2) cls = "bronze";
            return `<div class="rank-item">
                <div class="rank-pos ${cls}">${r[0]}</div>
                <div class="rank-info"><div class="rank-name">${r[1]}</div><div class="rank-badge">✅ Verificado</div></div>
                <div class="rank-amount">${r[2]}</div>
            </div>`;
        }).join(""),
        finalWithdrawList: withdrawals.map(w => `<div class="withdraw-item">
            <div><b>${w[0]}</b><br><span style="color:var(--muted);font-size:12px">${w[1]}</span></div>
            <div class="withdraw-amount">${w[2]}</div>
        </div>`).join(""),
        finalReviewList: reviewsData.map(r => `<div class="review-card-item">
            <b>${r[0]}</b> <span style="color:var(--muted);float:right;font-size:12px">${r[1]}</span><br>
            <span class="stars">⭐⭐⭐⭐⭐</span>
            <p style="color:var(--muted);margin:6px 0 0;font-size:13px">${r[2]}</p>
        </div>`).join("")
    };
    for (const [id, html] of Object.entries(templates)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
}

document.addEventListener("click", e => {
    if (e.target.classList.contains("tab-btn")) {
        const bar = e.target.closest(".tabs-bar");
        bar.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        const wrap = bar.parentElement;
        wrap.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        document.getElementById(e.target.dataset.tab).classList.add("active");
    }
});

// ==================== RULETA ====================
function setupSpin() {
    spinCount = 0;
    $("#spinBal").textContent = "89,200";
    $("#spinNote").classList.add("hidden");
    $("#spinSuccess").classList.add("hidden");
    document.getElementById("wheel").style.transform = "rotate(0deg)";
    const btn = document.getElementById("spinBtn");
    btn.disabled = false;
    btn.textContent = "GIRAR PARA MULTIPLICAR";
    btn.onclick = spinWheel;
}

function spinWheel() {
    spinCount++;
    document.getElementById("spinBtn").disabled = true;
    const first = spinCount === 1;
    document.getElementById("wheel").style.transform = first ? "rotate(1755deg)" : "rotate(3915deg)";
    setTimeout(() => {
        if (first) {
            $("#spinNote").classList.remove("hidden");
            document.getElementById("spinBtn").disabled = false;
            document.getElementById("spinBtn").textContent = "¡GIRO DE BONO GRATIS!";
        } else {
            $("#spinBal").textContent = "178,400";
            $("#successAmount").textContent = "₡178,400";
            $("#spinSuccess").classList.remove("hidden");
            document.getElementById("spinBtn").disabled = false;
            document.getElementById("spinBtn").textContent = "CONTINUAR →";
            document.getElementById("spinBtn").onclick = () => go("final");
        }
    }, 4200);
}

document.addEventListener("click", e => {
    if (e.target.closest("#wheel") && document.getElementById("spinBtn") && !document.getElementById("spinBtn").disabled) {
        document.getElementById("spinBtn").click();
    }
});

// ==================== FINAL ====================
function setupFinal() {
    fillLists();
    setupReviewStrip();
    // Video testimonial eliminado - ya no se reproduce nada en fondo
}

function setupReviewStrip() {
    document.querySelectorAll(".review-video-thumb").forEach(thumb => {
        const video = thumb.querySelector("video");
        const overlay = thumb.querySelector(".play-overlay");
        if (!video || !overlay) return;
        thumb.onclick = () => {
            document.querySelectorAll(".review-video-thumb video").forEach(v2 => {
                v2.pause();
                v2.currentTime = 0;
                v2.parentElement.querySelector(".play-overlay").style.display = "flex";
            });
            overlay.style.display = "none";
            video.muted = false;
            video.volume = 1;
            video.play().catch(() => {});
        };
        video.onended = () => { overlay.style.display = "flex"; };
    });
}

// ==================== TOASTS ====================
const people = ["James K.", "Emily R.", "Michael B.", "Sarah M.", "Daniel P.", "Olivia M.", "Chris W.", "Jessica H.", "Ryan T.", "Ashley C.", "Brandon S.", "Megan D.", "Liam H.", "Noah B.", "Ava R.", "Sophia L."];
const cities = ["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón", "Escazú", "Santa Ana", "Tamarindo", "Jacó", "La Fortuna"];

function showToast() {
    const box = document.getElementById("withdrawToast");
    if (!box || window.currentPage === "home") return;
    const name = people[Math.floor(Math.random() * people.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const amt = Math.round(8000 + Math.random() * 417000).toLocaleString("es-CR");
    box.innerHTML = `<div class="toast-avatar"></div><div class="toast-info"><div class="toast-name">${name}</div><div class="toast-location">${city}, Costa Rica</div></div><div class="toast-value">+₡${amt}</div>`;
    box.classList.add("show");
    clearTimeout(window._toastHide);
    window._toastHide = setTimeout(() => box.classList.remove("show"), 2200);
}

function startToasts() {
    const box = document.getElementById("withdrawToast");
    if (!box || window.currentPage === "home") {
        if (box) box.classList.remove("show");
        clearTimeout(window._toastLoop);
        return;
    }
    clearTimeout(window._toastLoop);
    function schedule() {
        window._toastLoop = setTimeout(() => { showToast(); schedule(); }, Math.floor(Math.random() * 3000) + 5000);
    }
    schedule();
}

function updateToasts(id) {
    const box = document.getElementById("withdrawToast");
    if (!box) return;
    if (id === "home") {
        box.classList.remove("show");
        clearTimeout(window._toastLoop);
        clearTimeout(window._toastHide);
        return;
    }
    startToasts();
}

// ==================== INICIALIZAR ====================
renderReactions();
syncName();
go("home");