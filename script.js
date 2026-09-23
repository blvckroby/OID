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
  const heroStage = $(".hero__stage");
  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    const overHero = heroStage && !document.body.classList.contains("menu-open") && y < heroStage.offsetHeight - header.offsetHeight;
    header.classList.toggle("is-over-hero", Boolean(overHero));
  };
  onScrollHeader();
  window.addEventListener("resize", onScrollHeader, { passive: true });

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
    document.body.classList.toggle("menu-open", open);
    onScrollHeader();
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

  /* ---------- Lightbox (images, video, zoom & pan) ---------- */
  const lb = $("[data-lightbox-dialog]");
  if (lb) {
    const stageEl = $("[data-lb-stage]", lb);
    const countEl = $("[data-lb-count]", lb);
    const levelEl = $("[data-lb-level]", lb);
    const prevBtn = $("[data-lb-prev]", lb);
    const nextBtn = $("[data-lb-next]", lb);
    const zoomIn = $('[data-lb-zoom="in"]', lb);
    const zoomOut = $('[data-lb-zoom="out"]', lb);
    const MAX = 4;
    let list = [];
    let index = 0;
    let opener = null;
    let z = { s: 1, x: 0, y: 0 };

    const groupLinks = (group) => $$(`[data-lightbox="${group}"]`).filter((a) => !a.closest("[hidden]"));
    const currentImg = () => stageEl.querySelector("img");

    const clampPan = () => {
      const img = currentImg();
      if (!img) return;
      const maxX = (img.clientWidth * (z.s - 1)) / 2;
      const maxY = (img.clientHeight * (z.s - 1)) / 2;
      z.x = Math.min(maxX, Math.max(-maxX, z.x));
      z.y = Math.min(maxY, Math.max(-maxY, z.y));
    };
    const applyZoom = () => {
      const img = currentImg();
      const isImg = Boolean(img);
      zoomIn.disabled = !isImg || z.s >= MAX;
      zoomOut.disabled = !isImg || z.s <= 1;
      levelEl.textContent = isImg ? `${Math.round(z.s * 100)}%` : "";
      if (!img) return;
      clampPan();
      img.style.transform = `translate(${z.x}px, ${z.y}px) scale(${z.s})`;
      stageEl.classList.toggle("is-zoomed", z.s > 1);
    };
    // Zoom towards a point (clientX/Y) so that point stays under the pointer.
    const zoomTo = (next, cx, cy) => {
      const img = currentImg();
      if (!img) return;
      next = Math.min(MAX, Math.max(1, next));
      const r = img.getBoundingClientRect();
      const ox = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
      const oy = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
      const k = next / z.s;
      z.x = z.x * k - ox * (k - 1);
      z.y = z.y * k - oy * (k - 1);
      z.s = next;
      if (z.s === 1) { z.x = 0; z.y = 0; }
      applyZoom();
    };
    const resetZoom = () => { z = { s: 1, x: 0, y: 0 }; applyZoom(); };

    const render = () => {
      const a = list[index];
      stageEl.querySelector("video")?.pause();
      stageEl.textContent = "";
      z = { s: 1, x: 0, y: 0 };
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
        img.alt = $("img", a)?.alt || "";
        img.decoding = "async";
        img.draggable = false;
        // Don't blow small originals up beyond 2x their real size before the user zooms.
        img.addEventListener("load", () => {
          img.style.maxWidth = `${img.naturalWidth * 2}px`;
          img.style.maxHeight = `${img.naturalHeight * 2}px`;
        }, { once: true });
        img.src = a.href;
        stageEl.appendChild(img);
      }
      applyZoom();
      countEl.textContent = `${index + 1} / ${list.length}`;
      const single = list.length < 2;
      prevBtn.hidden = single;
      nextBtn.hidden = single;
      const next = list[(index + 1) % list.length];
      if (next && next !== a && next.dataset.type !== "video") { const pre = new Image(); pre.src = next.href; }
    };

    const openAt = (a) => {
      list = groupLinks(a.dataset.lightbox);
      index = Math.max(0, list.indexOf(a));
      opener = document.activeElement;
      render();
      lb.showModal();
      document.body.classList.add("is-locked");
    };
    const step = (d) => { index = (index + d + list.length) % list.length; render(); };

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-lightbox]");
      if (a) { e.preventDefault(); openAt(a); return; }
      const trigger = e.target.closest("[data-lightbox-open]");
      if (trigger) {
        const target = $(`[data-id="${trigger.dataset.lightboxOpen}"]`);
        if (target) openAt(target);
      }
    });
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));
    zoomIn.addEventListener("click", () => zoomTo(z.s * 1.5));
    zoomOut.addEventListener("click", () => zoomTo(z.s / 1.5));
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" && z.s === 1) step(1);
      else if (e.key === "ArrowLeft" && z.s === 1) step(-1);
      else if (e.key === "+" || e.key === "=") zoomTo(z.s * 1.5);
      else if (e.key === "-") zoomTo(z.s / 1.5);
      else if (e.key === "0") resetZoom();
    });
    lb.addEventListener("close", () => {
      stageEl.querySelector("video")?.pause();
      stageEl.textContent = "";
      document.body.classList.remove("is-locked");
      opener?.focus?.();
    });
    window.addEventListener("resize", () => { if (lb.open) applyZoom(); });

    // Wheel zoom
    stageEl.addEventListener("wheel", (e) => {
      if (!currentImg()) return;
      e.preventDefault();
      zoomTo(z.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
    }, { passive: false });

    // Pointer: click/double-tap to zoom, drag to pan, pinch to zoom, swipe to navigate.
    const pointers = new Map();
    let start = null;
    let pinch = null;
    let lastTap = 0;
    stageEl.addEventListener("pointerdown", (e) => {
      if (!e.target.matches("img")) return;
      e.target.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), s: z.s };
      } else {
        start = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y, moved: false };
      }
    });
    stageEl.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        zoomTo(pinch.s * (d / pinch.d), (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        return;
      }
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) start.moved = true;
      if (z.s > 1 && start.moved) {
        stageEl.classList.add("is-dragging");
        z.x = start.zx + dx;
        z.y = start.zy + dy;
        applyZoom();
      }
    });
    const endPointer = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      stageEl.classList.remove("is-dragging");
      if (pinch) { if (pointers.size < 2) pinch = null; start = null; return; }
      if (!start) return;
      const dx = e.clientX - start.x;
      if (!start.moved) {
        const now = Date.now();
        const isTouch = e.pointerType !== "mouse";
        if (!isTouch || now - lastTap < 300) {
          if (z.s > 1) resetZoom(); else zoomTo(2.5, e.clientX, e.clientY);
          lastTap = 0;
        } else {
          lastTap = now;
        }
      } else if (z.s === 1 && Math.abs(dx) > 50 && list.length > 1) {
        step(dx < 0 ? 1 : -1);
      }
      start = null;
    };
    stageEl.addEventListener("pointerup", endPointer);
    stageEl.addEventListener("pointercancel", endPointer);
    // Click on the empty area around the media closes the viewer.
    stageEl.addEventListener("click", (e) => { if (e.target === stageEl) lb.close(); });
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
