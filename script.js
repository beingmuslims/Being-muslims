/* ==========================================================================
   BEINGMUSLIMS — script.js
   ==========================================================================

   EDIT THESE VALUES BEFORE GOING LIVE
   -------------------------------------------------------------------------- */

// WhatsApp number: country code + number, digits only (example: "919876543210").
// While this is "ADD_NUMBER_HERE", the enquiry buttons send visitors to the Contact page instead.
const WHATSAPP_NUMBER = "ADD_NUMBER_HERE";

// First message a visitor sees when they tap the floating WhatsApp button.
const WHATSAPP_MESSAGE = "Assalamu alaikum, I would like to enquire about the BeingMuslims collection.";

// Replace with the real Instagram profile link when it is available.
const INSTAGRAM_URL = "https://www.instagram.com/";

// Opens a general map search (no exact address is claimed).
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Zampa+Bazaar+Surat";

/* -------------------------------------------------------------------------- */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const whatsappReady = /^\d{8,15}$/.test(WHATSAPP_NUMBER);

function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function enquiryLink(productName) {
  if (whatsappReady) {
    return whatsappLink(`Assalamu alaikum, I would like to enquire about the ${productName}.`);
  }
  return `contact.html?enquiry=${encodeURIComponent(productName)}`;
}

function trapFocus(container, event) {
  if (event.key !== "Tab") return;
  const focusable = $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => !el.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- Header: scroll state + mobile menu ---------- */
function initHeader() {
  const header = $(".site-header");
  const toggle = $(".menu-toggle");
  const nav = $("#site-nav");
  if (!header || !toggle || !nav) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    header.classList.toggle("menu-open", open);
    document.body.classList.toggle("no-scroll", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  window.matchMedia("(min-width: 1080px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = $$("[data-reveal]");
  if (!items.length) return;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => observer.observe(el));
}

/* ---------- Hero video (Cloudinary) ---------- */
function initHeroVideo() {
  const hero = $("[data-hero-video]");
  if (!hero) return;
  const video = $("video", hero);

  const useFallbackPlayer = () => {
    if ($("iframe", hero)) return;
    if (video) video.remove();
    const frame = document.createElement("iframe");
    frame.src = hero.dataset.player;
    frame.title = "BeingMuslims campaign film";
    frame.setAttribute("allow", "autoplay; fullscreen; encrypted-media; picture-in-picture");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    hero.insertBefore(frame, $(".hero__overlay", hero));
  };

  if (!video) { useFallbackPlayer(); return; }

  video.muted = true;
  video.setAttribute("playsinline", "");
  const markPlaying = () => hero.classList.add("is-playing");
  video.addEventListener("playing", markPlaying);
  video.addEventListener("loadeddata", markPlaying);
  video.addEventListener("error", useFallbackPlayer, true);   // capture: <source> errors don't bubble
  if (video.readyState >= 2) markPlaying();

  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") attempt.catch(() => { /* autoplay blocked: image stays as backdrop */ });
}

/* ---------- Floating WhatsApp button ---------- */
function initWhatsApp() {
  const link = document.createElement("a");
  link.className = "wa-float";
  link.setAttribute("aria-label", "Enquire on WhatsApp");
  link.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-chat"></use></svg><span>Enquire</span>';
  if (whatsappReady) {
    link.href = whatsappLink(WHATSAPP_MESSAGE);
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    link.href = "contact.html";
    link.title = "WhatsApp number has not been added yet";
  }
  document.body.appendChild(link);
}

/* ---------- Shared links ---------- */
function initLinks() {
  $$("[data-instagram]").forEach((a) => { a.href = INSTAGRAM_URL; });
  $$("[data-directions]").forEach((a) => { a.href = MAPS_URL; });
}

/* ---------- Collection: filters + product modal ---------- */
function initCollection() {
  const grid = $("#product-grid");
  if (!grid) return;

  const cards = $$(".product", grid);
  const filters = $$(".filter");
  const counter = $("#result-count");
  const modal = $("#product-modal");
  const dialog = $(".modal__dialog", modal);
  const closeBtn = $(".modal__close", modal);
  let lastFocus = null;

  /* Filtering */
  const applyFilter = (tag) => {
    grid.classList.add("is-changing");
    window.setTimeout(() => {
      let visible = 0;
      cards.forEach((card) => {
        const match = tag === "all" || card.dataset.tags.split(" ").includes(tag);
        card.hidden = !match;
        if (match) visible += 1;
      });
      counter.textContent = `Showing ${visible} ${visible === 1 ? "piece" : "pieces"}`;
      grid.classList.remove("is-changing");
    }, prefersReducedMotion ? 0 : 280);
  };

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((f) => { f.classList.remove("is-active"); f.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      applyFilter(btn.dataset.filter);
    });
  });

  /* Modal */
  const openModal = (card) => {
    lastFocus = document.activeElement;
    const img = $("img", card);
    const name = $(".product__name", card).textContent.trim();
    $("#modal-img").src = img.src;
    $("#modal-img").alt = img.alt;
    $("#modal-cat").textContent = $(".product__cat", card).textContent.trim();
    $("#modal-title").textContent = name;
    $("#modal-desc").textContent = card.dataset.detail || $(".product__desc", card).textContent.trim();

    const cta = $("#modal-cta");
    cta.href = enquiryLink(name);
    if (whatsappReady) { cta.target = "_blank"; cta.rel = "noopener"; }
    else { cta.removeAttribute("target"); cta.removeAttribute("rel"); }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    dialog.scrollTop = 0;
    window.setTimeout(() => closeBtn.focus(), 60);
  };

  const closeModal = () => {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  cards.forEach((card) => {
    const trigger = $("[data-open-product]", card);
    if (trigger) trigger.addEventListener("click", () => openModal(card));
  });
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    else trapFocus(modal, e);
  });

  /* Deep link: collection.html?product=premium-thobe */
  const wanted = new URLSearchParams(window.location.search).get("product");
  if (wanted) {
    const target = cards.find((c) => c.dataset.id === wanted);
    if (target) window.setTimeout(() => openModal(target), 500);
  }
}

/* ---------- Gallery: lightbox ---------- */
function initGallery() {
  const buttons = $$(".tile__btn");
  const box = $("#lightbox");
  if (!buttons.length || !box) return;

  const img = $(".lightbox__img", box);
  const caption = $(".lightbox__caption", box);
  const count = $(".lightbox__count", box);
  const closeBtn = $(".lightbox__close", box);
  const items = buttons.map((b) => ({ src: b.dataset.full, alt: b.dataset.alt, caption: b.dataset.caption }));
  let index = 0;
  let lastFocus = null;
  let touchStartX = 0;

  const show = (n) => {
    index = (n + items.length) % items.length;
    const item = items[index];
    img.classList.add("is-loading");
    const loader = new Image();
    const done = () => { img.src = item.src; img.alt = item.alt; img.classList.remove("is-loading"); };
    loader.onload = done;
    loader.onerror = done;
    loader.src = item.src;
    caption.textContent = item.caption;
    count.textContent = `${index + 1} / ${items.length}`;
  };

  const open = (n) => {
    lastFocus = document.activeElement;
    show(n);
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    window.setTimeout(() => closeBtn.focus(), 60);
  };

  const close = () => {
    if (!box.classList.contains("is-open")) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  buttons.forEach((btn, i) => btn.addEventListener("click", () => open(i)));
  closeBtn.addEventListener("click", close);
  $(".lightbox__prev", box).addEventListener("click", () => show(index - 1));
  $(".lightbox__next", box).addEventListener("click", () => show(index + 1));
  $(".lightbox__figure", box).addEventListener("click", (e) => { if (e.target === e.currentTarget) close(); });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else trapFocus(box, e);
  });

  box.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) show(delta < 0 ? index + 1 : index - 1);
  }, { passive: true });
}

/* ---------- Contact form (front-end only, nothing is sent) ---------- */
function initContactForm() {
  const form = $("#enquiry-form");
  if (!form) return;
  const success = $("#form-success");
  const message = $("#message");

  const enquiry = new URLSearchParams(window.location.search).get("enquiry");
  if (enquiry && message) message.value = `I would like to enquire about the ${enquiry}.`;

  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Please enter your full name."),
    phone: (v) => (/^\+?[\d\s\-()]{7,}$/.test(v.trim()) ? "" : "Please enter a valid phone number."),
    email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."),
    message: (v) => (v.trim().length >= 5 ? "" : "Please tell us how we can help.")
  };

  const check = (field) => {
    const input = $("input, textarea", field);
    const error = $(".field__error", field);
    const msg = rules[input.name](input.value);
    field.classList.toggle("has-error", Boolean(msg));
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    error.textContent = msg;
    return !msg;
  };

  const fields = $$(".field", form);
  fields.forEach((field) => {
    $("input, textarea", field).addEventListener("blur", () => check(field));
    $("input, textarea", field).addEventListener("input", () => { if (field.classList.contains("has-error")) check(field); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = fields.map(check);
    if (results.includes(false)) {
      const firstBad = fields.find((f) => f.classList.contains("has-error"));
      if (firstBad) $("input, textarea", firstBad).focus();
      return;
    }
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  $("#form-reset").addEventListener("click", () => {
    form.reset();
    fields.forEach((f) => { f.classList.remove("has-error"); $(".field__error", f).textContent = ""; });
    success.hidden = true;
    form.hidden = false;
    $("input", form).focus();
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initReveal();
  initHeroVideo();
  initLinks();
  initWhatsApp();
  initCollection();
  initGallery();
  initContactForm();
});
