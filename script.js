/* OID Ltd — interactions. No dependencies. */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Page load: hero reveal ---------- */
  const markLoaded = () => requestAnimationFrame(() => root.classList.add("is-loaded"));
  if (document.readyState === "complete") markLoaded();
  else window.addEventListener("load", markLoaded, { once: true });
  // Don't let a slow hero image hold the headline back.
  setTimeout(markLoaded, 1200);

  /* ---------- Header state ---------- */
  const header = $("[data-header]");
  const onScrollHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScrollHeader();

  /* ---------- Hero parallax (subtle scale) ---------- */
  const heroMedia = $("[data-hero-media]");
  let heroTicking = false;
  const updateHero = () => {
    heroTicking = false;
    if (!heroMedia) return;
    const rect = heroMedia.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
    heroMedia.style.setProperty("--hero-scale", (1 + progress * 0.08).toFixed(4));
  };
  if (heroMedia && !reduceMotion) {
    setTimeout(() => root.classList.add("hero-settled"), 2600);
  }

  window.addEventListener("scroll", () => {
    onScrollHeader();
    if (!reduceMotion && root.classList.contains("hero-settled") && !heroTicking) {
      heroTicking = true;
      requestAnimationFrame(updateHero);
    }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    $(".menu-toggle__label", toggle).textContent = open ? "Close" : "Menu";
    menu.hidden = !open;
    document.body.classList.toggle("is-locked", open);
    if (open) $("a", menu).focus();
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav__list a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + entry.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ---------- Services: sticky media + production gauge ---------- */
  const stage = $("[data-svc-stage]");
  const items = $$(".svc__item");
  if (stage && items.length && "IntersectionObserver" in window) {
    const frames = $$(".svc__frames img", stage);
    const num = $("[data-svc-num]", stage);
    const gauge = $("[data-gauge]", stage);
    const note = $("[data-gauge-note]", stage);
    let current = -1;

    const activate = (i) => {
      if (i === current) return;
      current = i;
      const item = items[i];
      items.forEach((el, n) => el.classList.toggle("is-active", n === i));
      frames.forEach((img, n) => img.classList.toggle("is-active", n === i));
      num.textContent = String(i + 1).padStart(2, "0");
      gauge.style.setProperty("--from", item.dataset.from);
      gauge.style.setProperty("--to", item.dataset.to);
      note.textContent = item.dataset.note;
    };

    const svcIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) activate(Number(entry.target.dataset.svc)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    items.forEach((el) => {
      svcIO.observe(el);
      el.addEventListener("focusin", () => activate(Number(el.dataset.svc)));
    });
    activate(0);
  }

  /* ---------- Service dialogs ---------- */
  let dialogOpener = null;
  $$("[data-dialog-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dlg = document.getElementById(btn.dataset.dialogOpen);
      if (!dlg) return;
      dialogOpener = btn;
      dlg.showModal();
      document.body.classList.add("is-locked");
    });
  });
  $$("dialog.sheet").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close(); // backdrop click
      const closer = e.target.closest("[data-dialog-close]");
      if (closer) {
        dlg.close();
        if (closer.tagName === "A") {
          const target = $(closer.getAttribute("href"));
          if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); $("input", target)?.focus({ preventScroll: true }); }
        }
      }
    });
    dlg.addEventListener("close", () => {
      document.body.classList.remove("is-locked");
      if (dialogOpener && !document.activeElement?.closest("#contact")) dialogOpener.focus();
    });
  });

  /* ---------- Film reel: hover/focus expand ---------- */
  const reel = $("[data-reel]");
  if (reel) {
    const panels = $$(".reel__panel", reel);
    const open = (panel) => panels.forEach((p) => p.classList.toggle("is-active", p === panel));
    panels.forEach((panel) => {
      const btn = $(".reel__btn", panel);
      btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") open(panel); });
      btn.addEventListener("focus", () => open(panel));
    });
  }

  /* ---------- Gallery: show more ---------- */
  const moreBtn = $("[data-more-toggle]");
  if (moreBtn) {
    const extra = $$("[data-more]");
    moreBtn.addEventListener("click", () => {
      const expanded = moreBtn.getAttribute("aria-expanded") === "true";
      extra.forEach((li) => { li.hidden = expanded; });
      moreBtn.setAttribute("aria-expanded", String(!expanded));
      $("span", moreBtn).textContent = expanded ? "Show all 20 photographs" : "Show fewer photographs";
      if (!expanded) $("a", extra[0])?.focus({ preventScroll: true });
      else $("#gallery").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $("[data-lightbox-dialog]");
  if (lb) {
    const stageEl = $("[data-lb-stage]", lb);
    const countEl = $("[data-lb-count]", lb);
    const prevBtn = $("[data-lb-prev]", lb);
    const nextBtn = $("[data-lb-next]", lb);
    let list = [];
    let index = 0;
    let opener = null;

    const visibleLinks = () => $$('[data-lightbox="gallery"]').filter((a) => !a.closest("[hidden]"));

    const render = () => {
      const a = list[index];
      stageEl.querySelector("video")?.pause();
      stageEl.textContent = "";
      if (a.dataset.type === "video") {
        const v = document.createElement("video");
        v.src = a.href;
        v.controls = true;
        v.playsInline = true;
        v.preload = "metadata";
        if (a.dataset.poster) v.poster = a.dataset.poster;
        v.setAttribute("aria-label", a.getAttribute("aria-label") || "Video");
        stageEl.appendChild(v);
        if (!reduceMotion) v.play().catch(() => {});
      } else {
        const img = document.createElement("img");
        img.src = a.href;
        img.alt = $("img", a)?.alt || "";
        img.decoding = "async";
        stageEl.appendChild(img);
      }
      countEl.textContent = `${index + 1} / ${list.length}`;
      const single = list.length < 2;
      prevBtn.hidden = single;
      nextBtn.hidden = single;
      // Warm the next image.
      const next = list[(index + 1) % list.length];
      if (next && next.dataset.type !== "video") { const pre = new Image(); pre.src = next.href; }
    };

    const openAt = (a) => {
      list = visibleLinks();
      index = Math.max(0, list.indexOf(a));
      opener = document.activeElement;
      render();
      lb.showModal();
      document.body.classList.add("is-locked");
    };
    const step = (d) => { index = (index + d + list.length) % list.length; render(); };

    document.addEventListener("click", (e) => {
      const a = e.target.closest('[data-lightbox="gallery"]');
      if (a) { e.preventDefault(); openAt(a); return; }
      const trigger = e.target.closest("[data-lightbox-open]");
      if (trigger) {
        const target = $(`[data-id="${trigger.dataset.lightboxOpen}"]`);
        if (target) openAt(target);
      }
    });
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stageEl) lb.close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    });
    lb.addEventListener("close", () => {
      stageEl.querySelector("video")?.pause();
      stageEl.textContent = "";
      document.body.classList.remove("is-locked");
      opener?.focus?.();
    });

    // Touch swipe
    let x0 = null;
    stageEl.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stageEl.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  /* ---------- Counter (20+) ---------- */
  const counter = $("[data-count]");
  if (counter && !reduceMotion && "IntersectionObserver" in window) {
    const target = Number(counter.dataset.count);
    counter.textContent = "0";
    const cIO = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      cIO.disconnect();
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        counter.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    cIO.observe(counter);
  }

  /* ---------- Foshan local time ---------- */
  const clock = $("[data-clock]");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" });
    const tickClock = () => { clock.textContent = fmt.format(new Date()); };
    tickClock();
    setInterval(tickClock, 30000);
  }

  /* ---------- Year ---------- */
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Contact form → email client ---------- */
  const form = $("[data-contact-form]");
  if (form) {
    const status = $("[data-form-status]", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$("input[required], textarea[required]", form);
      let firstInvalid = null;
      fields.forEach((f) => {
        const ok = f.checkValidity() && f.value.trim() !== "";
        f.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        status.textContent = "Please complete the required fields: company, a valid email address and your message.";
        status.classList.add("is-error");
        firstInvalid.focus();
        return;
      }
      status.classList.remove("is-error");
      const data = new FormData(form);
      const body = [
        `Company: ${data.get("company")}`,
        `Email: ${data.get("email")}`,
        data.get("service") ? `Service: ${data.get("service")}` : null,
        "",
        String(data.get("message")),
      ].filter((l) => l !== null).join("\n");
      const href = `mailto:info@oidltd.info?subject=${encodeURIComponent("[Email from website] " + data.get("company"))}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
      status.textContent = "Your email application should now open with the message ready to send.";
    });
    form.addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity() && e.target.value.trim()) {
        e.target.setAttribute("aria-invalid", "false");
      }
    });
  }
})();
