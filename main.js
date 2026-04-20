(function () {
  "use strict";

  var STORAGE_KEY = "mit-lang";
  var nav = document.getElementById("mainNav");
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("navOverlay");
  var langToggle = document.getElementById("langToggle");

  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
    return "en";
  }

  function dict(lang) {
    var ui = window.MIT_I18N_UI && window.MIT_I18N_UI[lang];
    var co = window.MIT_I18N_CONTENT && window.MIT_I18N_CONTENT[lang];
    return Object.assign({}, ui || {}, co || {});
  }

  function t(lang, key) {
    var d = dict(lang);
    return d[key] != null ? d[key] : "";
  }

  function applyLanguage(lang) {
    var code = lang === "ar" ? "ar" : "en";
    localStorage.setItem(STORAGE_KEY, code);
    var d = dict(code);
    var root = document.documentElement;
    root.lang = code === "ar" ? "ar" : "en";
    root.dir = code === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key && d[key] != null) el.textContent = d[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (!key || d[key] == null) return;
      var html = String(d[key]).replace(/\{\{year\}\}/g, String(new Date().getFullYear()));
      el.innerHTML = html;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key && d[key] != null) el.setAttribute("aria-label", d[key]);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-alt");
      if (key && d[key] != null) el.setAttribute("alt", d[key]);
    });

    if (d.pageTitle) document.title = d.pageTitle;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && d.metaDescription) meta.setAttribute("content", d.metaDescription);

    if (langToggle) {
      if (code === "en") {
        langToggle.textContent = d.langToggleToAr != null ? d.langToggleToAr : "عربي";
        langToggle.setAttribute("aria-label", d.langToggleAriaToAr != null ? d.langToggleAriaToAr : "Arabic");
      } else {
        langToggle.textContent = d.langToggleToEn != null ? d.langToggleToEn : "English";
        langToggle.setAttribute("aria-label", d.langToggleAriaToEn != null ? d.langToggleAriaToEn : "English");
      }
    }

    if (toggle && nav) {
      var open = nav.classList.contains("is-open");
      toggle.setAttribute("aria-label", open ? t(code, "navCloseMenu") : t(code, "navOpenMenu"));
    }
  }

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    var code = getLang();
    toggle.setAttribute("aria-label", open ? t(code, "navCloseMenu") : t(code, "navOpenMenu"));
    if (overlay) {
      overlay.hidden = !open;
      overlay.classList.toggle("is-visible", open);
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", function () {
      setNavOpen(false);
    });
  }

  document.querySelectorAll('.main-nav a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 960px)").matches) {
        setNavOpen(false);
      }
    });
  });

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      applyLanguage(getLang() === "en" ? "ar" : "en");
    });
  }

  var dropdowns = document.querySelectorAll("[data-dropdown]");
  dropdowns.forEach(function (dd) {
    var btn = dd.querySelector("button");
    if (!btn) return;

    function closeOthers() {
      dropdowns.forEach(function (other) {
        if (other === dd) return;
        other.classList.remove("is-open");
        var b = other.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = dd.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (window.matchMedia("(min-width: 961px)").matches) {
        closeOthers();
        if (!isOpen) dd.classList.remove("is-open");
        else dd.classList.add("is-open");
        btn.setAttribute("aria-expanded", dd.classList.contains("is-open") ? "true" : "false");
      }
    });

    dd.addEventListener("mouseenter", function () {
      if (window.matchMedia("(min-width: 961px)").matches) {
        closeOthers();
        dd.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });

    dd.addEventListener("mouseleave", function () {
      if (window.matchMedia("(min-width: 961px)").matches) {
        dd.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("click", function () {
    dropdowns.forEach(function (dd) {
      dd.classList.remove("is-open");
      var b = dd.querySelector("button");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  });

  dropdowns.forEach(function (dd) {
    dd.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.matchMedia("(min-width: 961px)").matches) {
        setNavOpen(false);
      }
    }, 150);
  });

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Typewriter effect for the main hero brand title (runs once on first paint).
   */
  function runHeroTitleTypewriter() {
    var h1 = document.getElementById("hero-title");
    var part1El = document.getElementById("heroTitlePart1");
    var part2El = document.getElementById("heroTitlePart2");
    if (!h1 || !part1El || !part2El) return;

    var text1 = h1.getAttribute("data-type-part1") || "Movein";
    var text2 = h1.getAttribute("data-type-part2") || "track";
    var delayMs = 52;
    var pauseBetweenMs = 220;

    function finish() {
      h1.classList.add("is-complete");
    }

    if (prefersReducedMotion()) {
      part1El.textContent = text1;
      part2El.textContent = text2;
      finish();
      return;
    }

    var i1 = 0;
    var i2 = 0;

    function tickPart1() {
      if (i1 >= text1.length) {
        setTimeout(tickPart2, pauseBetweenMs);
        return;
      }
      part1El.textContent += text1.charAt(i1);
      i1 += 1;
      setTimeout(tickPart1, delayMs);
    }

    function tickPart2() {
      if (i2 >= text2.length) {
        finish();
        return;
      }
      part2El.textContent += text2.charAt(i2);
      i2 += 1;
      setTimeout(tickPart2, delayMs);
    }

    tickPart1();
  }

  applyLanguage(getLang());
  runHeroTitleTypewriter();

  var heroSection = document.getElementById("hero");
  var heroCanvas = heroSection && heroSection.querySelector(".hero-particles-canvas");
  if (heroCanvas && typeof window.createHeroParticleNetwork === "function") {
    window.createHeroParticleNetwork(heroCanvas).start();
  }
})();
