/* =============================================================
   ✏️  EDIT YOUR LINKS HERE — this is the only place you need to.
   Every Email / LinkedIn / GitHub / Phone / Resume link on the page
   reads from this block. Set phone or resume to "" to hide them.

   RESUME: put your file in a folder named "resume" next to
   index.html, named exactly as below (PDF recommended; a JPG or
   PNG also works — just change the file name here).
============================================================= */
const PROFILE = {
  email: "franzebona13@gmail.com",
  linkedin: "https://www.linkedin.com/in/franz-jan-eboña-40697b2a8",
  github: "https://github.com/franzebona13",
  phone: "+63 927 603 0362", // set to "" to hide the phone card
  resume: "Resume/Resume.pdf",
};

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =============================================================
     PROFILE LINKS
     Fills every [data-link] href and every [data-text] label.
  ============================================================= */
  const prettyUrl = (url) =>
    url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

  function linkFor(key) {
    const value = (PROFILE[key] || "").trim();
    if (!value) return "";
    if (key === "email") return "mailto:" + value;
    if (key === "phone") return "tel:" + value.replace(/[^\d+]/g, "");
    return value;
  }

  $$("[data-link]").forEach((el) => {
    const key = el.dataset.link;
    const href = linkFor(key);

    if (!href) {
      // Nothing set (e.g. no phone) → hide this link, or its wrapper
      (el.closest("[data-optional]") || el).hidden = true;
      return;
    }

    el.href = href;
    if (/^https?:/.test(href)) {
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  });

  $$("[data-text]").forEach((el) => {
    const value = (PROFILE[el.dataset.text] || "").trim();
    if (!value) return;
    el.textContent = /^https?:/.test(value) ? prettyUrl(value) : value;
  });

  /* Copy email button */
  const copyBtn = $("#copy-email");
  const copyStatus = $("#copy-status");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = PROFILE.email;
      let ok = false;
      try {
        await navigator.clipboard.writeText(email);
        ok = true;
      } catch {
        // Fallback for older browsers / non-HTTPS pages
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
      }
      copyStatus.textContent = ok ? "✓ Email copied to clipboard" : email;
      copyBtn.textContent = ok ? "Copied!" : "Copy email";
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => {
        copyBtn.textContent = "Copy email";
        copyStatus.textContent = "";
      }, 2500);
    });
  }

  /* =============================================================
     WORD-BY-WORD HEADINGS
     Section headings (.h2) are split into words that rise in one
     after another when they scroll into view.
  ============================================================= */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const outer = document.createElement("span");
            outer.className = "word";
            const inner = document.createElement("span");
            inner.className = "word-inner";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
    $$(".word-inner", el).forEach((w, i) => (w.style.transitionDelay = `${i * 70}ms`));
  }

  const splitHeadings = reduceMotion || !("IntersectionObserver" in window) ? [] : $$(".h2");
  splitHeadings.forEach((h) => {
    // label for screen readers (a <br> counts as a space between words)
    const label = [...h.childNodes].map((n) => (n.nodeName === "BR" ? " " : n.textContent)).join("");
    h.setAttribute("aria-label", label.replace(/\s+/g, " ").trim());
    splitWords(h);
    h.classList.remove("reveal");
    h.classList.add("split-heading");
  });

  if (splitHeadings.length) {
    const headingObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" }
    );
    splitHeadings.forEach((h) => headingObserver.observe(h));
  }

  /* =============================================================
     SCROLL REVEAL
  ============================================================= */
  const revealEls = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("is-visible");
          obs.unobserve(el);
          // Once the animation has played, drop the reveal classes so the
          // element's own hover transitions work normally again.
          const delay = (parseFloat(el.style.getPropertyValue("--d")) || 0) * 90;
          setTimeout(() => el.classList.remove("reveal", "reveal-clip", "is-visible"), 1200 + delay);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* =============================================================
     HEADER — solid background once you scroll past the top
  ============================================================= */
  const header = $(".site-header");
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none;";
  document.body.prepend(sentinel);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle("is-scrolled", !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* =============================================================
     SCROLL PROGRESS BAR + BACK-TO-TOP BUTTON
     One passive scroll listener, batched with requestAnimationFrame.
  ============================================================= */
  const progressBar = $(".scroll-progress");
  const toTop = $(".to-top");
  const heroCard = $(".hero-card");
  let scrollTicking = false;

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.9);

    // Hero parallax: content drifts down and fades as you scroll away
    if (heroCard && !reduceMotion && y < window.innerHeight * 1.2) {
      const hp = Math.min(1, Math.max(0, y / (window.innerHeight * 0.9)));
      heroCard.style.setProperty("--hp", hp.toFixed(3));
    }
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", onScroll);
  onScroll();

  /* =============================================================
     MOBILE NAV
  ============================================================= */
  const navToggle = $(".nav-toggle");
  const navLinks = $("#nav-links");

  function setNav(open) {
    navLinks.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => setNav(!navLinks.classList.contains("is-open")));
    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("is-open") && !e.target.closest(".nav")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  /* =============================================================
     ACTIVE NAV LINK (scroll-spy)
  ============================================================= */
  const navAnchors = $$('.nav-links a[href^="#"]');
  const spySections = navAnchors
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && spySections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navAnchors.forEach((a) =>
            a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + id))
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  /* =============================================================
     TOOLS MARQUEE — duplicate the list once for a seamless loop
  ============================================================= */
  const marqueeTrack = $(".marquee-track");
  if (marqueeTrack && !reduceMotion) {
    $$("li", marqueeTrack).forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.appendChild(clone);
    });
  }

  /* =============================================================
     CURSOR EFFECTS (mouse / trackpad only)
     - spotlight glow that follows the cursor on cards
     - skill preview image that follows the cursor along its row
  ============================================================= */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer) {
    // Soft page light that follows the mouse
    const cursorLight = $(".cursor-light");
    if (cursorLight && !reduceMotion) {
      let lx = 0, ly = 0, lightTicking = false;
      window.addEventListener(
        "pointermove",
        (e) => {
          lx = e.clientX;
          ly = e.clientY;
          if (lightTicking) return;
          lightTicking = true;
          requestAnimationFrame(() => {
            cursorLight.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
            cursorLight.classList.add("is-on");
            lightTicking = false;
          });
        },
        { passive: true }
      );
      document.documentElement.addEventListener("pointerleave", () => cursorLight.classList.remove("is-on"));
    }

    $$(".process-card, .cert-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    // Project cards tilt slightly toward the cursor, with a soft light on top
    if (!reduceMotion) {
      $$(".work-card").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty("--ry", `${((px - 0.5) * 6).toFixed(2)}deg`);
          card.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
          card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
          card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        });
        card.addEventListener("pointerleave", () => {
          ["--rx", "--ry", "--gx", "--gy"].forEach((v) => card.style.removeProperty(v));
        });
      });
    }

    $$(".skill-row").forEach((row) => {
      row.addEventListener("pointermove", (e) => {
        const r = row.getBoundingClientRect();
        // keep the image within the middle area so it never covers the title or text edges
        const x = Math.min(Math.max(e.clientX - r.left, r.width * 0.35), r.width * 0.68);
        row.style.setProperty("--sx", `${x}px`);
        row.style.setProperty("--sy", `${e.clientY - r.top}px`);
      });
      row.addEventListener("pointerleave", () => {
        row.style.removeProperty("--sx");
        row.style.removeProperty("--sy");
      });
    });
  }

  /* =============================================================
     MEDIA HELPERS
  ============================================================= */
  const isVideo = (src) => /\.(mp4|webm|mov|ogg)$/i.test(src);

  const parseMedia = (str = "") =>
    str
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((src) => ({ src, type: isVideo(src) ? "video" : "image" }));

  /* =============================================================
     PROJECTS — badges, counts, filter, "show all"
  ============================================================= */
  const workCards = $$(".work-card");
  const workMore = $("#work-more");
  const filterBtns = $$(".filter-btn");
  const VISIBLE_LIMIT = 10; // 10 cards fill 4 neat rows on desktop
  let currentFilter = "all";
  let currentFilterChanged = false;
  let expanded = false;

  const tagsOf = (card) => (card.dataset.tags || "").split(/\s+/);
  const matches = (card, filter) => filter === "all" || tagsOf(card).includes(filter);

  // Arrow + media badge on every card
  workCards.forEach((card) => {
    const media = parseMedia(card.dataset.media);
    const videos = media.filter((m) => m.type === "video").length;

    const arrow = document.createElement("span");
    arrow.className = "work-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9" /></svg>';
    card.appendChild(arrow);

    if (media.length > 1 || videos) {
      const badge = document.createElement("span");
      badge.className = "work-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.innerHTML =
        (videos ? '<span class="play"></span>Video · ' : "") +
        media.length + (media.length === 1 ? " item" : " items");
      card.appendChild(badge);
    }
  });

  // Counts on the filter buttons
  filterBtns.forEach((btn) => {
    const n = workCards.filter((c) => matches(c, btn.dataset.filter)).length;
    const slot = $(".filter-count", btn);
    if (slot) slot.textContent = n;
  });

  function applyFilter(animate = false) {
    const list = workCards.filter((c) => matches(c, currentFilter));
    const wasVisible = new Set(workCards.filter((c) => !c.hidden));
    workCards.forEach((c) => (c.hidden = true));

    let n = 0;
    list.forEach((c, i) => {
      c.hidden = !expanded && i >= VISIBLE_LIMIT;
      if (c.hidden || !animate || reduceMotion) return;
      // cards that just appeared fade in one after another
      if (currentFilterChanged || !wasVisible.has(c)) {
        c.classList.remove("is-entering");
        void c.offsetWidth; // restart the animation
        c.style.setProperty("--i", n++);
        c.classList.add("is-entering");
      }
    });
    currentFilterChanged = false;

    if (workMore) {
      workMore.hidden = list.length <= VISIBLE_LIMIT;
      workMore.textContent = expanded ? "Show fewer projects" : `Show all ${list.length} projects`;
      workMore.setAttribute("aria-expanded", String(expanded));
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      if (currentFilter === btn.dataset.filter) return;
      currentFilter = btn.dataset.filter;
      currentFilterChanged = true;
      expanded = false;
      applyFilter(true);
    });
  });

  if (workMore) {
    workMore.addEventListener("click", () => {
      const wasExpanded = expanded;
      expanded = !expanded;
      applyFilter(true);
      if (wasExpanded) {
        $("#work-grid").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  }

  workCards.forEach((c) =>
    c.addEventListener("animationend", () => c.classList.remove("is-entering"))
  );

  applyFilter();

  /* =============================================================
     CERTIFICATES — placeholder until the image exists
  ============================================================= */
  const certCards = $$(".cert-card");

  certCards.forEach((card) => {
    const img = $(".cert-thumb img", card);
    if (!img) return;
    const markMissing = () => card.classList.add("is-missing");
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      // already failed before this script ran
      markMissing();
    }
    img.addEventListener("error", markMissing);
    img.addEventListener("load", () => card.classList.remove("is-missing"));
  });

  /* =============================================================
     AUTO COUNTS in the About section
  ============================================================= */
  const counts = {
    hardware: workCards.filter((c) => tagsOf(c).includes("hardware")).length,
    software: workCards.filter((c) => tagsOf(c).includes("software")).length,
    certs: certCards.length,
  };

  const statEls = $$("[data-count]").filter((el) => counts[el.dataset.count] !== undefined);
  statEls.forEach((el) => (el.textContent = counts[el.dataset.count]));

  // Numbers count up from 0 the first time the stats scroll into view
  const statsBox = $(".stats");
  if (statsBox && !reduceMotion && "IntersectionObserver" in window) {
    statEls.forEach((el) => (el.textContent = "0"));
    const countObserver = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        statEls.forEach((el) => {
          const target = counts[el.dataset.count];
          const start = performance.now();
          const duration = 1400;
          const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    countObserver.observe(statsBox);
  }

  const certStat = $('[data-stat="certs"]');
  if (certStat && counts.certs === 0) certStat.hidden = true;

  /* =============================================================
     GALLERY / LIGHTBOX
     Opens for project cards (all photos + videos) and certificates.
     Keyboard: ← → to move, Esc to close. Swipe on touch screens.
  ============================================================= */
  const lb = $("#lightbox");
  const lbImg = $(".lb-img", lb);
  const lbVideo = $(".lb-video", lb);
  const lbPrev = $(".lb-prev", lb);
  const lbNext = $(".lb-next", lb);
  const lbTitle = $("#lb-title", lb);
  const lbKicker = $(".lb-kicker", lb);
  const lbDesc = $(".lb-desc", lb);
  const lbCount = $(".lb-count", lb);
  const lbThumbs = $(".lb-thumbs", lb);
  const lbCloseBtn = $(".lb-close", lb);

  let items = [];
  let index = 0;
  let lastFocus = null;
  let closeTimer = null;

  function stopVideo() {
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    lbVideo.load();
  }

  function render() {
    const item = items[index];
    const total = items.length;
    const title = lbTitle.textContent;

    if (item.type === "video") {
      lbImg.hidden = true;
      lbImg.removeAttribute("src");
      lbVideo.hidden = false;
      lbVideo.src = item.src;
      lbVideo.setAttribute("aria-label", `${title} — video`);
      lbVideo.play().catch(() => {});
    } else {
      stopVideo();
      lbVideo.hidden = true;
      lbImg.hidden = false;
      lbImg.classList.add("is-swapping");
      lbImg.src = item.src;
      lbImg.alt = total > 1 ? `${title} — ${index + 1} of ${total}` : title;
      const reveal = () => {
        if (lbImg.getAttribute("src") === item.src) lbImg.classList.remove("is-swapping");
      };
      if (lbImg.decode) lbImg.decode().then(reveal, reveal);
      else requestAnimationFrame(reveal);
    }

    lbCount.textContent = total > 1 ? `${index + 1} / ${total}` : "";
    lbPrev.hidden = lbNext.hidden = total < 2;

    $$(".lb-thumb", lbThumbs).forEach((t, i) => {
      const active = i === index;
      t.setAttribute("aria-current", String(active));
      if (active) t.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function buildThumbs() {
    lbThumbs.innerHTML = "";
    lbThumbs.hidden = items.length < 2;
    if (items.length < 2) return;

    items.forEach((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lb-thumb";
      b.setAttribute("aria-label", `Show item ${i + 1}${item.type === "video" ? " (video)" : ""}`);
      if (item.type === "video") {
        b.innerHTML = '<span class="lb-thumb-video">▶ Video</span>';
      } else {
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = "";
        img.loading = "lazy";
        b.appendChild(img);
      }
      b.addEventListener("click", () => go(i));
      lbThumbs.appendChild(b);
    });
  }

  function go(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    render();
  }

  function openGallery({ media, title, kicker = "", desc = "", start = 0 }) {
    if (!media.length) return;
    clearTimeout(closeTimer);
    items = media;
    index = start;
    lastFocus = document.activeElement;

    lbTitle.textContent = title;
    lbKicker.textContent = kicker;
    lbDesc.textContent = desc;
    lbDesc.hidden = !desc;

    buildThumbs();
    lb.hidden = false;
    document.documentElement.classList.add("lb-lock");
    requestAnimationFrame(() => lb.classList.add("is-open"));
    render();
    lbCloseBtn.focus();
  }

  function closeGallery() {
    if (lb.hidden) return;
    lb.classList.remove("is-open");
    stopVideo();
    document.documentElement.classList.remove("lb-lock");
    closeTimer = setTimeout(() => {
      lb.hidden = true;
      lbImg.removeAttribute("src");
    }, reduceMotion ? 0 : 250);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // Open from project cards
  workCards.forEach((card) => {
    const btn = $(".work-open", card);
    if (!btn) return;
    btn.addEventListener("click", () =>
      openGallery({
        media: parseMedia(card.dataset.media),
        title: btn.textContent.trim(),
        kicker: $(".work-meta", card)?.textContent.trim() || "",
        desc: $(".work-info p", card)?.textContent.trim() || "",
      })
    );
  });

  // Open from certificate cards
  certCards.forEach((card) => {
    const btn = $(".cert-open", card);
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (card.classList.contains("is-missing")) return; // no image yet
      const issuer = $(".cert-issuer", card)?.textContent.trim() || "";
      const date = $(".cert-date", card)?.textContent.trim() || "";
      // The viewer shows the same file as the card's <img>,
      // so each certificate's path only has to be written once.
      const src = card.dataset.media || $(".cert-thumb img", card)?.getAttribute("src") || "";
      openGallery({
        media: parseMedia(src),
        title: btn.textContent.trim(),
        kicker: [issuer, date].filter(Boolean).join(" · "),
      });
    });
  });

  lbPrev.addEventListener("click", () => go(index - 1));
  lbNext.addEventListener("click", () => go(index + 1));
  $$("[data-close]", lb).forEach((el) => el.addEventListener("click", closeGallery));

  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeGallery();
      return;
    }

    // ← → move between items (except while using the video's own controls)
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target !== lbVideo) {
      e.preventDefault();
      go(index + (e.key === "ArrowLeft" ? -1 : 1));
      return;
    }

    // keep Tab focus inside the dialog
    if (e.key === "Tab") {
      const focusables = $$("button, video[controls], [href]", lb).filter(
        (el) => !el.hidden && el.offsetParent !== null
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Swipe left/right on touch screens
  let touchX = null;
  const stage = $(".lb-stage", lb);
  stage.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* =============================================================
     RESUME VIEWER
     Desktop: opens the resume in a viewer on top of the page, with
     Download and Open-in-new-tab buttons.
     Phones/tablets: most mobile browsers can't show a PDF inside a
     page, so the link simply opens the file in the browser's own viewer.
  ============================================================= */
  const resumeSrc = (PROFILE.resume || "").trim();
  const resumeLinks = $$("[data-resume]");
  const resumeIsImage = /\.(png|jpe?g|webp|gif)$/i.test(resumeSrc);
  const resumeExt = (resumeSrc.split(".").pop() || "pdf").toUpperCase();
  const resumeName = resumeSrc.split("/").pop() || "Resume";

  if (!resumeSrc) {
    // No resume set → hide every resume link and button
    resumeLinks.forEach((el) => ((el.closest("[data-optional]") || el).hidden = true));
  } else {
    resumeLinks.forEach((el) => (el.href = resumeSrc));
    $$("[data-resume-type]").forEach((el) => (el.textContent = resumeIsImage ? resumeExt.replace("JPEG", "JPG") : "PDF"));
  }

  const rm = $("#resume-modal");
  const rmFrame = rm && $(".rm-frame", rm);
  const rmImageWrap = rm && $(".rm-image-wrap", rm);
  const rmImg = rm && $(".rm-img", rm);
  const rmLoading = rm && $(".rm-loading", rm);
  const rmEmpty = rm && $(".rm-empty", rm);
  const rmOpen = rm && $(".rm-open", rm);
  const rmDownload = rm && $(".rm-download", rm);
  const rmClose = rm && $(".rm-close", rm);
  let rmLastFocus = null;
  let rmCloseTimer = null;
  let rmLoadTimer = null;

  const useInlineViewer = () =>
    !window.matchMedia("(max-width: 900px), (hover: none), (pointer: coarse)").matches;

  // Checks the file exists before showing it (skipped when the page is opened
  // straight from the computer, where the browser blocks this check).
  async function resumeExists() {
    if (location.protocol === "file:") return true;
    try {
      const res = await fetch(resumeSrc, { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch {
      return true;
    }
  }

  function rmShow(state) {
    rmLoading.hidden = state !== "loading";
    rmEmpty.hidden = state !== "empty";
    rmFrame.hidden = state !== "pdf";
    rmImageWrap.hidden = state !== "image";
    rmOpen.hidden = rmDownload.hidden = state === "empty";
  }

  async function openResume() {
    clearTimeout(rmCloseTimer);
    clearTimeout(rmLoadTimer);
    rmLastFocus = document.activeElement;
    rmOpen.href = resumeSrc;
    rmDownload.href = resumeSrc;
    rmDownload.setAttribute("download", resumeName);

    rm.hidden = false;
    document.documentElement.classList.add("lb-lock");
    requestAnimationFrame(() => rm.classList.add("is-open"));
    rmShow("loading");
    rmClose.focus();

    if (!(await resumeExists())) {
      console.warn(`Resume not found at "${resumeSrc}". Check the file name in PROFILE.resume.`);
      rmShow("empty");
      return;
    }
    if (rm.hidden) return; // closed while checking

    if (resumeIsImage) {
      rmImg.onload = () => rmShow("image");
      rmImg.onerror = () => rmShow("empty");
      rmImg.src = resumeSrc;
    } else {
      rmFrame.onload = () => {
        clearTimeout(rmLoadTimer);
        rmShow("pdf");
      };
      rmFrame.src = resumeSrc + "#view=FitH";
      // some browsers never fire "load" for PDFs — show it anyway after a moment
      rmLoadTimer = setTimeout(() => !rm.hidden && rmShow("pdf"), 2500);
    }
  }

  function closeResume() {
    if (!rm || rm.hidden) return;
    clearTimeout(rmLoadTimer);
    rm.classList.remove("is-open");
    document.documentElement.classList.remove("lb-lock");
    rmCloseTimer = setTimeout(() => {
      rm.hidden = true;
      rmFrame.removeAttribute("src");
      rmImg.removeAttribute("src");
    }, reduceMotion ? 0 : 250);
    if (rmLastFocus && document.contains(rmLastFocus)) rmLastFocus.focus();
  }

  if (rm && resumeSrc) {
    resumeLinks.forEach((el) =>
      el.addEventListener("click", (e) => {
        if (!useInlineViewer()) return; // phones: let the link open the file normally
        e.preventDefault();
        if (navLinks && navLinks.classList.contains("is-open")) setNav(false);
        openResume();
      })
    );

    $$("[data-rm-close]", rm).forEach((el) => el.addEventListener("click", closeResume));

    document.addEventListener("keydown", (e) => {
      if (rm.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeResume();
        return;
      }
      if (e.key === "Tab") {
        const focusables = $$("a[href], button", rm).filter((el) => !el.hidden && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* =============================================================
     FOOTER YEAR
  ============================================================= */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();