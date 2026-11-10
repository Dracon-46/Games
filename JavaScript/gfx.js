/* gfx.js — utilitários WebGL compartilhados pelos jogos Enxame, Núcleo e Túnel.
   Contexto (WebGL2 com fallback para WebGL1), compilação de shaders com erros bem visíveis,
   laço de animação que pausa em aba oculta e qualidade adaptativa pelo tempo de quadro. */
(function () {
  'use strict';
  var G = { errors: [], version: 0, frameMs: 16.7, stats: { n: 0, sum: 0, max: 0 } };

  G.noGL = function (host, why) {
    try { console.warn('[gfx] WebGL indisponível: ' + (why || '')); } catch (e) {}
    if (host) host.innerHTML = '<p class="msg" style="padding:40px 16px">😕 Não foi possível iniciar o WebGL neste navegador.<br>' +
      '<span class="hint">Atualize o navegador ou ative a aceleração de hardware e tente de novo.</span></p>';
  };

  G.context = function (canvas, opts) {
    var gl = null;
    opts = opts || {};
    if (opts.powerPreference === undefined) opts.powerPreference = 'high-performance';
    try { gl = canvas.getContext('webgl2', opts); } catch (e) {}
    G.version = gl ? 2 : 0;
    if (!gl) {
      try { gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts); } catch (e) {}
      if (gl) G.version = 1;
    }
    if (!gl) return null;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); G.lost = true; });
    canvas.addEventListener('webglcontextrestored', function () { location.reload(); });
    return gl;
  };

  function shader(gl, type, src, name) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s) || '(sem log)';
      var m = '[shader] ERRO de compilação em "' + name + '" (' + (type === gl.VERTEX_SHADER ? 'vertex' : 'fragment') + '):\n' + log;
      G.errors.push(m); console.error(m);
      return null;
    }
    return s;
  }

  /* Devolve {prog, u:{uniformes}, a:{atributos}} ou null (e registra o erro em console.error). */
  G.program = function (gl, vs, fs, name) {
    var hp = 'precision highp float;\n';
    var v = shader(gl, gl.VERTEX_SHADER, hp + vs, name), f = shader(gl, gl.FRAGMENT_SHADER, hp + fs, name);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      var m = '[shader] ERRO de link em "' + name + '":\n' + (gl.getProgramInfoLog(p) || '(sem log)');
      G.errors.push(m); console.error(m);
      return null;
    }
    var o = { prog: p, u: {}, a: {} }, i, n, info;
    n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { info = gl.getActiveUniform(p, i); var nm = info.name.replace(/\[0\]$/, ''); o.u[nm] = gl.getUniformLocation(p, nm); }
    n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < n; i++) { info = gl.getActiveAttrib(p, i); o.a[info.name] = gl.getAttribLocation(p, info.name); }
    return o;
  };

  /* Triângulo de tela cheia: atributo vec2 aP em [-1,3]. */
  G.fullscreen = function (gl) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    return function (loc) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  };

  /* Ajusta o tamanho do buffer do canvas. Devolve true se mudou. */
  G.fit = function (canvas, scale, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 1.5) * (scale || 1);
    var w = Math.max(2, Math.round(canvas.clientWidth * dpr)), h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
    return false;
  };

  /* Qualidade adaptativa: mede o tempo de quadro e reduz (ou recupera um pouco) a escala. */
  G.quality = function (start, min) {
    var q = { value: start, min: min || 0.4, max: start, acc: 0, n: 0, good: 0, ups: 0, changed: false };
    q.push = function (ms) {
      q.changed = false;
      if (ms > 200) return false;
      q.acc += ms; q.n++;
      if (q.n < 45) return false;
      var avg = q.acc / q.n; q.acc = 0; q.n = 0; q.avg = avg;
      if (avg > 21 && q.value > q.min) {
        q.value = Math.max(q.min, q.value * (avg > 34 ? 0.7 : 0.85)); q.good = 0; q.changed = true;
      } else if (avg < 17.6) {
        if (++q.good >= 8 && q.value < q.max && q.ups < 2) { q.value = Math.min(q.max, q.value / 0.88); q.good = 0; q.ups++; q.changed = true; }
      } else q.good = 0;
      return q.changed;
    };
    return q;
  };

  /* Laço de animação: fn(dtSegundos, tSegundos, dtMsBruto). Pausa quando a aba está oculta. */
  G.loop = function (fn) {
    var last = 0, raf = 0, t = 0, dead = false;
    function tick(now) {
      raf = requestAnimationFrame(tick);
      var ms = last ? now - last : 16.7; last = now;
      if (ms > 250) ms = 16.7;
      G.frameMs += (ms - G.frameMs) * 0.05;
      G.stats.n++; G.stats.sum += ms; if (ms > G.stats.max) G.stats.max = ms;
      var dt = Math.min(ms, 40) / 1000; t += dt;
      try { fn(dt, t, ms); } catch (e) {
        if (!dead) { dead = true; console.error('[gfx] erro no quadro:', e); }
        cancelAnimationFrame(raf);
      }
    }
    document.addEventListener('visibilitychange', function () {
      cancelAnimationFrame(raf);
      if (!document.hidden && !dead) { last = 0; raf = requestAnimationFrame(tick); }
    });
    if (!document.hidden) raf = requestAnimationFrame(tick);
  };

  G.hi = function (key) {
    var v = 0;
    try { v = +localStorage.getItem(key) || 0; } catch (e) {}
    return {
      get: function () { return v; },
      set: function (n) { if (n > v) { v = n; try { localStorage.setItem(key, String(n)); } catch (e) {} return true; } return false; }
    };
  };

  G.small = function () { return Math.min(window.innerWidth, window.innerHeight) < 520 || (navigator.hardwareConcurrency || 4) <= 2; };

  window.GFX = G;
})();
