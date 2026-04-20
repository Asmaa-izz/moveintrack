/**
 * Hero backdrop: subtle "journey / fleet flow" — horizontal lane drift and soft
 * lights (no node graph). Vue 3: start() in onMounted, destroy() in onUnmounted.
 */
(function (global) {
  "use strict";

  var LANE_COUNT = 6;
  var FLOATER_COUNT = 36;
  var DASH_LEN = 28;
  var DASH_GAP = 22;
  var LANE_SCROLL = 0.28;
  var COLOR_GOLD = "#e8a020";
  var COLOR_BLUE = "#1a6cc4";

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  var RGB_GOLD = hexToRgb(COLOR_GOLD);
  var RGB_BLUE = hexToRgb(COLOR_BLUE);

  function readDir() {
    var root = global.document && global.document.documentElement;
    if (root && root.getAttribute("dir") === "rtl") return -1;
    return 1;
  }

  function createHeroParticleNetwork(canvas) {
    var hero = canvas && canvas.closest ? canvas.closest(".hero") : null;
    if (!canvas || !hero) {
      return {
        start: function () {},
        destroy: function () {},
      };
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        start: function () {},
        destroy: function () {},
      };
    }

    var rafId = null;
    var running = false;
    var resizeObserver = null;
    var onWindowResize = null;
    var reducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var width = 0;
    var height = 0;
    var lanePhase = 0;
    var floaters = [];
    var laneYs = [];

    function initFloaters() {
      var i;
      var lane;
      var y;
      var speed;
      floaters = [];
      for (i = 0; i < FLOATER_COUNT; i += 1) {
        lane = i % LANE_COUNT;
        y = laneYs[lane] != null ? laneYs[lane] + (Math.random() - 0.5) * 10 : height * 0.5;
        speed = 0.22 + Math.random() * 0.28;
        floaters.push({
          x: Math.random() * width,
          y: y,
          baseY: y,
          vx: speed,
          r: 1.6 + Math.random() * 1.2,
          opacity: 0.38 + Math.random() * 0.22,
          rgb: i % 2 === 0 ? RGB_GOLD : RGB_BLUE,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.008 + Math.random() * 0.01,
        });
      }
    }

    function layoutLanes() {
      var pad = height * 0.14;
      var span = height - 2 * pad;
      var step = span / (LANE_COUNT + 1);
      var k;
      laneYs = [];
      for (k = 0; k < LANE_COUNT; k += 1) {
        laneYs.push(pad + step * (k + 1));
      }
    }

    function syncSize() {
      var w = hero.clientWidth;
      var h = hero.clientHeight;
      if (w <= 0 || h <= 0) return;

      var prevW = width;
      var dpr = global.devicePixelRatio || 1;

      width = w;
      height = h;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      layoutLanes();

      if (prevW <= 0 || floaters.length !== FLOATER_COUNT) {
        initFloaters();
      } else {
        floaters.forEach(function (f, idx) {
          f.x = (f.x / prevW) * w;
          f.baseY = laneYs[idx % LANE_COUNT] + (Math.random() - 0.5) * 6;
          f.y = f.baseY;
        });
      }
    }

    function drawLaneMarkings(dir) {
      var period = DASH_LEN + DASH_GAP;
      var scroll = lanePhase * dir;
      var shift = (scroll % period) + period;
      shift %= period;
      var ly;
      var x;
      var alpha;
      var lane;

      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";

      for (lane = 0; lane < LANE_COUNT; lane += 1) {
        ly = laneYs[lane];
        alpha = 0.07 + (lane % 2) * 0.04;
        ctx.strokeStyle = "rgba(200, 215, 235, " + alpha + ")";
        for (x = -period; x < width + period * 2; x += period) {
          ctx.beginPath();
          ctx.moveTo(x + shift, ly);
          ctx.lineTo(x + shift + DASH_LEN, ly);
          ctx.stroke();
        }
      }
    }

    function drawFloaters(tick) {
      var i;
      var f;
      var dir = readDir();
      var yOff;

      for (i = 0; i < floaters.length; i += 1) {
        f = floaters[i];
        f.x += f.vx * dir;
        if (dir > 0 && f.x > width + 8) f.x = -8;
        else if (dir < 0 && f.x < -8) f.x = width + 8;

        yOff = Math.sin(tick * f.wobbleSpeed + f.wobblePhase) * 2.2;
        f.y = f.baseY + yOff;

        ctx.beginPath();
        ctx.fillStyle =
          "rgba(" + f.rgb[0] + "," + f.rgb[1] + "," + f.rgb[2] + "," + f.opacity + ")";
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var motionTick = 0;

    function frame() {
      var dir = readDir();

      ctx.clearRect(0, 0, width, height);

      lanePhase += LANE_SCROLL;
      drawLaneMarkings(dir);

      motionTick += 1;
      drawFloaters(motionTick);
    }

    function loop() {
      if (!running) return;
      frame();
      rafId = global.requestAnimationFrame(loop);
    }

    function attachResize() {
      if (resizeObserver || onWindowResize) return;
      if (typeof global.ResizeObserver === "function") {
        resizeObserver = new global.ResizeObserver(function () {
          syncSize();
          if (reducedMotion) {
            frame();
          }
        });
        resizeObserver.observe(hero);
      } else {
        onWindowResize = function () {
          syncSize();
          if (reducedMotion) {
            frame();
          }
        };
        global.addEventListener("resize", onWindowResize);
      }
    }

    function detachResize() {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (onWindowResize) {
        global.removeEventListener("resize", onWindowResize);
        onWindowResize = null;
      }
    }

    function start() {
      if (running) return;
      syncSize();
      if (width <= 0 || height <= 0) return;

      attachResize();

      if (reducedMotion) {
        frame();
        return;
      }

      running = true;
      rafId = global.requestAnimationFrame(loop);
    }

    function destroy() {
      running = false;
      if (rafId != null) {
        global.cancelAnimationFrame(rafId);
        rafId = null;
      }
      detachResize();
    }

    return {
      start: start,
      destroy: destroy,
    };
  }

  global.createHeroParticleNetwork = createHeroParticleNetwork;
})(typeof window !== "undefined" ? window : this);
