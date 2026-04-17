/* KOYA Restaurant — premium static site logic (no build needed). */

const CONFIG = {
  brandName: "KOYA Restaurant",
  currencySymbol: "D",

  // Update these 4 fields first.
  whatsappNumberE164DigitsOnly: "2207335586", // e.g. "2207123456" (digits only, country code first). Leave blank to use WhatsApp share fallback.
  phoneNumberDisplay: "+220 733 5586", // e.g. "+220 712 3456" (for the Call button). Leave blank to hide Call.
  addressLine: "Senegambia Highway, Former Big Apple",
  mapsQuery: "KOYA Restaurant", // used for Google Maps embed + Directions link

  // Reservation requests (no backend). Leave blank to hide email option.
  reservationEmail: "ktron.gm@gmail.com",

  // Opening hours (local device time). Use 24h format "HH:MM". Set closed:true to mark closed all day.
  hours: {
    mon: { open: "17:00", close: "00:00" },
    tue: { open: "17:00", close: "00:00" },
    wed: { open: "17:00", close: "00:00" },
    thu: { open: "17:00", close: "00:00" },
    fri: { open: "17:00", close: "00:00" }, // supports past midnight
    sat: { open: "17:00", close: "00:00" },
    sun: { open: "17:00", close: "00:00" }
  },

  // TikTok links (fast + lightweight). Replace with your real links.
  tiktok: [
    {
      title: "Good food deserves a good place (viral)",
      caption: "That first bite sound. The sauce shine. The comments go crazy.",
      url: "https://www.tiktok.com/@koya_gambia/video/7612036710846827798?is_from_webapp=1&sender_device=pc&web_id=7629543932037187092"
    },
    {
      title: "The big reveal",
      caption: "If you’re new to KOYA, start here.",
      url: "https://www.tiktok.com/@koya_gambia/video/7612028049688775958?is_from_webapp=1&sender_device=pc&web_id=7629543932037187092"
    },
    {
      title: "New restaurant alert!",
      caption: "Black + gold vibes. Hot food. Fast pickup.",
      url: "https://www.tiktok.com/@koya_gambia/video/7611993298583997718?is_from_webapp=1&sender_device=pc&web_id=7629543932037187092"
    }
  ],

  // Gallery — these are your existing local assets.
  galleryImages: [
    { src: "./Food%20Images/Landing_image_Desktop.jpg", alt: "KOYA signature dish" },
    {
      src: "./Food%20Images/fried-chicken-breast-cheese-tomato-french-fries-ketchup-green-salad-side-view-jpg_141793-1782.avif",
      alt: "Crispy chicken meal"
    },
    {
      src: "./Food%20Images/The-Most-Popular-Menu-Items-That-You-should-Consider-Adding-to-Your-Restaurant_Content-image1-min-1024x569.png",
      alt: "Loaded fries and sides"
    },
    { src: "./Restaurant%20Photos/restaurantImage.jpg", alt: "KOYA restaurant interior" },
    { src: "./Restaurant%20Photos/istockphoto-1411971240-612x612.jpg", alt: "Restaurant vibe photo" },
    { src: "./Restaurant%20Photos/istockphoto-2212532765-612x612.jpg", alt: "Restaurant vibe photo" }
  ]
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function encodeWA(text) {
  return encodeURIComponent(text);
}

function normalizeDigitsOnly(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function formatPrice(currencySymbol, price) {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "number") return `${currencySymbol}${price}`;
  return `${currencySymbol}${String(price)}`;
}

function toast(msg) {
  const el = $("[data-toast]");
  if (!el) return;
  el.textContent = msg;
  el.dataset.show = "true";
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => {
    el.dataset.show = "false";
  }, 2800);
}

function safeOpen(url) {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  // Mobile browsers are more reliable with same-tab navigation for deep links.
  if (coarse) {
    window.location.href = url;
    return;
  }

  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url;
}

function buildWhatsAppUrl({ numberDigits, text }) {
  const msg = encodeWA(text);
  const digits = normalizeDigitsOnly(numberDigits);
  if (digits) return `https://wa.me/${digits}?text=${msg}`;
  return `https://wa.me/?text=${msg}`;
}

function buildMailtoUrl({ to, subject, body }) {
  const email = String(to || "").trim();
  const s = encodeURIComponent(String(subject || ""));
  const b = encodeURIComponent(String(body || ""));
  return `mailto:${email}?subject=${s}&body=${b}`;
}

async function tryCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function minutesFromHHMM(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  if (!m) return null;
  const h = clamp(parseInt(m[1], 10), 0, 23);
  const mm = clamp(parseInt(m[2], 10), 0, 59);
  return h * 60 + mm;
}

function getDayKey(date) {
  const d = date.getDay();
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d];
}

function getOpenStatus(now = new Date()) {
  const dayKey = getDayKey(now);
  const today = CONFIG.hours[dayKey];
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  if (!today || today.closed) return { isOpen: false, label: "Closed today" };

  const openM = minutesFromHHMM(today.open);
  const closeM = minutesFromHHMM(today.close);
  if (openM === null || closeM === null) return { isOpen: false, label: "Hours unavailable" };

  const wraps = closeM <= openM;
  const isOpen = wraps ? minutesNow >= openM || minutesNow < closeM : minutesNow >= openM && minutesNow < closeM;

  if (isOpen) return { isOpen: true, label: "Open now" };

  // Next opening label
  const nextOpen = openM;
  const hh = String(Math.floor(nextOpen / 60)).padStart(2, "0");
  const mm = String(nextOpen % 60).padStart(2, "0");
  return { isOpen: false, label: `Closed • opens ${hh}:${mm}` };
}

function renderOpenStatus() {
  const status = getOpenStatus();
  const els = $$("[data-open-status]");
  for (const el of els) {
    el.textContent = status.label;
    el.innerHTML = `<span class="dot ${status.isOpen ? "dot-gold" : "dot-white"}" aria-hidden="true"></span>${status.label}`;
  }
}

function renderAddressAndLinks() {
  const addressEls = $$("[data-address]");
  for (const el of addressEls) el.textContent = CONFIG.addressLine || "";

  const mapsQ = encodeURIComponent(CONFIG.mapsQuery || CONFIG.addressLine || CONFIG.brandName);
  const embed = `https://www.google.com/maps?q=${mapsQ}&output=embed`;
  const directions = `https://www.google.com/maps/search/?api=1&query=${mapsQ}`;

  const map = $("[data-map]");
  if (map) map.src = embed;

  const dirLink = $("[data-directions]");
  if (dirLink) dirLink.href = directions;

  const call = $("[data-call]");
  const display = String(CONFIG.phoneNumberDisplay || "").trim();
  const digits = normalizeDigitsOnly(display);
  if (call) {
    if (!digits) {
      call.style.display = "none";
    } else {
      call.style.display = "";
      call.href = `tel:${digits}`;
    }
  }
}

function renderHours() {
  const root = $("[data-hours]");
  if (!root) return;

  const now = new Date();
  const todayKey = getDayKey(now);
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const labels = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun"
  };

  root.innerHTML = order
    .map((k) => {
      const h = CONFIG.hours[k];
      const isToday = k === todayKey;
      let right = "Closed";
      if (h && !h.closed && h.open && h.close) right = `${h.open} – ${h.close}`;
      return `<div class="hour-row" data-today="${isToday ? "true" : "false"}">
        <strong>${labels[k]}</strong>
        <span>${right}</span>
      </div>`;
    })
    .join("");
}

function observeReveals() {
  const els = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.dataset.in = "true";
        io.unobserve(e.target);
      }
    },
    { root: null, threshold: 0.12 }
  );
  for (const el of els) io.observe(el);
}

function wireMobileDrawer() {
  const btn = $("[data-mobile-nav]");
  const drawer = $("[data-mobile-drawer]");
  if (!btn || !drawer) return;

  const close = () => {
    drawer.dataset.open = "false";
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  const open = () => {
    drawer.dataset.open = "true";
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  btn.addEventListener("click", () => {
    const isOpen = drawer.dataset.open === "true";
    if (isOpen) close();
    else open();
  });

  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) close();
  });

  for (const a of $$("[data-drawer-close]")) {
    a.addEventListener("click", () => close());
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function getOrderMessage(item) {
  const lines = [
    `Hi KOYA 👋`,
    ``,
    `I’d like to order: ${item?.name || "an item"}`,
    item?.price !== undefined ? `Price: ${formatPrice(CONFIG.currencySymbol, item.price)}` : ``,
    ``,
    `Pickup or delivery?`,
    `Name:`,
    `Location:`,
    `Notes:`
  ].filter(Boolean);
  return lines.join("\n");
}

async function orderNow(item = null) {
  const text = item ? getOrderMessage(item) : `Hi KOYA 👋\n\nI’d like to place an order.\n\nName:\nLocation:\nNotes:`;
  const url = buildWhatsAppUrl({ numberDigits: CONFIG.whatsappNumberE164DigitsOnly, text });

  if (!normalizeDigitsOnly(CONFIG.whatsappNumberE164DigitsOnly)) {
    const copied = await tryCopy(text);
    toast(copied ? "Message copied — paste into WhatsApp and send." : "Opening WhatsApp…");
  }

  safeOpen(url);
}

function getReservationMessage(data) {
  const lines = [
    `Hi KOYA 👋`,
    ``,
    `Table reservation request`,
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Date: ${data.date}`,
    `Time: ${data.time}`,
    `Guests: ${data.guests}`,
    data.notes ? `Notes: ${data.notes}` : ``,
    ``,
    `Please confirm availability. Thank you.`
  ].filter(Boolean);
  return lines.join("\n");
}

function wireReservationForm() {
  const form = $("[data-reserve-form]");
  if (!form) return;

  const emailBtn = $("[data-reserve-email]");
  if (emailBtn) {
    if (!String(CONFIG.reservationEmail || "").trim()) emailBtn.style.display = "none";
    else emailBtn.style.display = "";
  }

  const getData = () => {
    const fd = new FormData(form);
    return {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      date: String(fd.get("date") || "").trim(),
      time: String(fd.get("time") || "").trim(),
      guests: String(fd.get("guests") || "").trim(),
      notes: String(fd.get("notes") || "").trim()
    };
  };

  const validate = (d) => {
    if (!d.name) return "Please enter your name.";
    if (!d.phone) return "Please enter your phone number.";
    if (!d.date) return "Please choose a date.";
    if (!d.time) return "Please choose a time.";
    if (!d.guests) return "Please enter number of guests.";
    return null;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = getData();
    const err = validate(d);
    if (err) return toast(err);

    const msg = getReservationMessage(d);
    const url = buildWhatsAppUrl({ numberDigits: CONFIG.whatsappNumberE164DigitsOnly, text: msg });
    toast("Opening WhatsApp…");
    safeOpen(url);
  });

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const d = getData();
      const err = validate(d);
      if (err) return toast(err);

      const body = getReservationMessage(d);
      const url = buildMailtoUrl({ to: CONFIG.reservationEmail, subject: "KOYA — Table Reservation Request", body });
      toast("Opening email…");
      safeOpen(url);
    });
  }
}

function wireOrderButtons(menuIndex) {
  for (const btn of $$("[data-order-now]")) {
    btn.addEventListener("click", () => orderNow(null));
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const action = t.closest("[data-order-item]");
    if (!action) return;
    // Prevent any card "expand" interactions from hijacking the click.
    e.preventDefault();
    e.stopPropagation();
    const id = action.getAttribute("data-order-item");
    const item = menuIndex.get(id);
    if (item) orderNow(item);
  });
}

function buildMenuIndex(menuData) {
  const idx = new Map();
  for (const c of menuData.categories || []) {
    for (const it of c.items || []) {
      idx.set(it.id, { ...it, categoryId: c.id, categoryName: c.name });
    }
  }
  return idx;
}

function renderFeatured(menuData, menuIndex) {
  const root = $("[data-featured-grid]");
  if (!root) return;

  const ids = menuData.featuredIds || [];
  const items = ids.map((id) => menuIndex.get(id)).filter(Boolean);
  root.innerHTML = items.map((it) => cardHTML(it, { compact: true })).join("");
}

function cardHTML(item, { compact = false } = {}) {
  const price = formatPrice(CONFIG.currencySymbol, item.price);
  const desc = item.description || "";
  const imgAlt = item.name ? `${item.name} photo` : "Menu item photo";
  const variant = compact ? "featured" : "menu";

  return `
  <article class="card" data-variant="${variant}" tabindex="0" aria-label="${escapeHTML(item.name || "Menu item")}">
    <div class="card-media">
      <img src="${escapeAttr(item.image || "")}" alt="${escapeAttr(imgAlt)}" loading="lazy" decoding="async" />
    </div>
    <div class="card-body">
      <div class="card-top">
        <div class="card-title">${escapeHTML(item.name || "")}</div>
        <div class="price">${escapeHTML(price)}</div>
      </div>
      <p class="card-desc">${escapeHTML(desc)}</p>
      <div class="card-actions">
        <button class="btn btn-gold" type="button" data-order-item="${escapeAttr(item.id)}">Order on WhatsApp</button>
        ${compact ? `<a class="btn btn-ghost" href="#menu">View menu</a>` : ""}
      </div>
    </div>
  </article>`;
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHTML(str).replaceAll("`", "&#096;");
}

function renderCategoryChips(menuData, state) {
  const root = $("[data-category-chips]");
  if (!root) return;

  const cats = menuData.categories || [];
  const allChip = { id: "all", name: "All" };
  const chips = [allChip, ...cats.map((c) => ({ id: c.id, name: c.name }))];

  root.innerHTML = chips
    .map(
      (c) => `<button class="chip" type="button" data-chip="${escapeAttr(c.id)}" data-active="${
        state.categoryId === c.id ? "true" : "false"
      }">${escapeHTML(c.name)}</button>`
    )
    .join("");

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const btn = t.closest("[data-chip]");
    if (!btn) return;
    state.categoryId = btn.getAttribute("data-chip") || "all";
    renderCategoryChips(menuData, state);
    renderMenuGrid(menuData, state);
  });
}

function flattenMenu(menuData) {
  const out = [];
  for (const c of menuData.categories || []) {
    for (const it of c.items || []) out.push({ ...it, categoryId: c.id, categoryName: c.name });
  }
  return out;
}

function renderMenuGrid(menuData, state) {
  const root = $("[data-menu-grid]");
  if (!root) return;

  const q = String(state.query || "").trim().toLowerCase();
  const items = flattenMenu(menuData).filter((it) => {
    const matchesCategory = state.categoryId === "all" || it.categoryId === state.categoryId;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      String(it.name || "").toLowerCase().includes(q) ||
      String(it.description || "").toLowerCase().includes(q) ||
      String(it.categoryName || "").toLowerCase().includes(q)
    );
  });

  root.innerHTML = items.map((it) => cardHTML(it)).join("");
}

function wireMenuCardExpand() {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hover = window.matchMedia?.("(hover: hover)")?.matches;
  const fine = window.matchMedia?.("(pointer: fine)")?.matches;
  // On desktop hover, CSS handles the reveal. On mobile/touch, we toggle on tap.
  if (!reduced && hover && fine) return;

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    // If they tapped the order button, let ordering win (handled elsewhere).
    if (t.closest("[data-order-item]")) return;

    const card = t.closest(".card[data-variant=\"menu\"]");
    if (!card) return;

    const expanded = card.getAttribute("data-expanded") === "true";
    card.setAttribute("data-expanded", expanded ? "false" : "true");
  });
}

function wireSearch(menuData, state) {
  const input = $("[data-menu-search]");
  if (!input) return;
  input.addEventListener("input", () => {
    state.query = input.value || "";
    renderMenuGrid(menuData, state);
  });
}

function wireMenuJump() {
  for (const el of $$("[data-open-menu]")) {
    el.addEventListener("click", () => {
      $("#menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function renderGallery() {
  const root = $("[data-gallery]");
  if (!root) return;
  root.innerHTML = CONFIG.galleryImages
    .map(
      (g) => `<button class="shot" type="button" data-shot="${escapeAttr(g.src)}" aria-label="Open image">
        <img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.alt || "Gallery photo")}" loading="lazy" decoding="async" />
      </button>`
    )
    .join("");
}

function wireLightbox() {
  const dlg = $("[data-lightbox]");
  const img = $("[data-lightbox-img]");
  const closeBtn = $("[data-lightbox-close]");
  if (!dlg || !img || !closeBtn) return;

  const close = () => {
    if (dlg.open) dlg.close();
  };

  closeBtn.addEventListener("click", () => close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const shot = t.closest("[data-shot]");
    if (!shot) return;
    const src = shot.getAttribute("data-shot");
    if (!src) return;
    img.src = src;
    img.alt = "Gallery photo";
    dlg.showModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function renderTikTok() {
  const root = $("[data-tiktok-grid]");
  if (!root) return;
  root.innerHTML = (CONFIG.tiktok || [])
    .map(
      (t) => `<a class="tiktok-card" href="${escapeAttr(t.url)}" target="_blank" rel="noreferrer" aria-label="Open TikTok">
        <div class="tiktok-top">
          <div class="tiktok-title">${escapeHTML(t.title || "TikTok")}</div>
          <div class="tiktok-link">Open</div>
        </div>
        <p class="tiktok-sub">${escapeHTML(t.caption || "")}</p>
      </a>`
    )
    .join("");
}

function wireSectionAutoScroll() {
  // Premium "slide to next section" feel on desktop wheel only.
  // We intentionally avoid touch/mobile and require a stronger wheel gesture.
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const hover = window.matchMedia?.("(hover: hover)")?.matches;
  const hasTouch = navigator.maxTouchPoints > 0;
  const desktopLayout = window.innerWidth >= 1280;
  const ua = navigator.userAgent || "";
  const mobileUA = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua);
  if (reduced || coarse || !hover || hasTouch || mobileUA || !desktopLayout) return;

  const sections = $$("main > section");
  if (!sections.length) return;

  let lastAt = 0;
  let lockedUntil = 0;
  let prevWheelAt = 0;

  const headerOffset = 84; // sticky header + breathing room

  const getIndex = () => {
    const y = window.scrollY + headerOffset + 2;
    let best = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= y) best = i;
    }
    return best;
  };

  const shouldIgnore = (e) => {
    if (e.defaultPrevented) return true;
    if (e.ctrlKey || e.metaKey) return true; // allow zoom / browser shortcuts
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.getAttribute("contenteditable") === "true")) return true;
    return false;
  };

  window.addEventListener(
    "wheel",
    (e) => {
      if (shouldIgnore(e)) return;
      const now = performance.now();
      if (now - lastAt < 450) return;
      if (now < lockedUntil) return;

      const dy = e.deltaY;
      const deltaAbs = Math.abs(dy);
      const dt = prevWheelAt ? now - prevWheelAt : 999;
      prevWheelAt = now;
      const speed = deltaAbs / Math.max(dt, 1);

      // Only snap on strong/fast wheel gestures.
      if (deltaAbs < 110 && speed < 0.9) return;

      const idx = getIndex();
      const next = dy > 0 ? idx + 1 : idx - 1;
      if (next < 0 || next >= sections.length) return;

      // If the current section is tall and user is still within it, don't hijack.
      const cur = sections[idx];
      const curTop = cur.offsetTop;
      const curBottom = curTop + cur.offsetHeight;
      const viewportTop = window.scrollY + headerOffset;
      const viewportBottom = window.scrollY + window.innerHeight;
      const withinTallSection = cur.offsetHeight > window.innerHeight * 1.25 && viewportBottom < curBottom - 140 && viewportTop > curTop + 80;
      if (withinTallSection) return;

      e.preventDefault();
      lastAt = now;
      lockedUntil = now + 900;
      sections[next].scrollIntoView({ behavior: "smooth", block: "start" });
    },
    { passive: false }
  );
}

function setYear() {
  const y = $("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
}

async function loadMenu() {
  const res = await fetch("./data/menu.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load menu.json");
  return res.json();
}

function applyMenuCurrency(menuData) {
  if (menuData?.currencySymbol) CONFIG.currencySymbol = menuData.currencySymbol;
}

function wireCardKeyboardOrdering(menuIndex) {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const card = t.closest(".card");
    if (!card) return;
    const btn = card.querySelector("[data-order-item]");
    if (!btn) return;
    const id = btn.getAttribute("data-order-item");
    const item = menuIndex.get(id);
    if (item) orderNow(item);
  });
}

function applyTrendingLine(menuData) {
  const el = $("[data-trending-line]");
  if (!el) return;
  const top = (menuData.featuredIds || []).slice(0, 3);
  if (!top.length) return;
  el.textContent = `Today: ${top.map((x) => x.replaceAll("-", " ")).join(" • ")}`;
}

async function main() {
  setYear();
  observeReveals();
  wireMobileDrawer();
  wireSectionAutoScroll();
  wireReservationForm();
  renderOpenStatus();
  renderAddressAndLinks();
  renderHours();
  renderGallery();
  wireLightbox();
  renderTikTok();
  wireMenuJump();
  wireMenuCardExpand();

  // Keep open status fresh.
  window.setInterval(renderOpenStatus, 60_000);

  let menuData;
  try {
    menuData = await loadMenu();
  } catch (e) {
    toast("Menu data missing. Check data/menu.json");
    return;
  }

  applyMenuCurrency(menuData);
  const state = { categoryId: "all", query: "" };
  const menuIndex = buildMenuIndex(menuData);

  applyTrendingLine(menuData);
  renderFeatured(menuData, menuIndex);
  renderCategoryChips(menuData, state);
  renderMenuGrid(menuData, state);
  wireSearch(menuData, state);
  wireOrderButtons(menuIndex);
  wireCardKeyboardOrdering(menuIndex);
}

main();
