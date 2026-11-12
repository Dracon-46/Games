/* fx.js — fundo ambiente compartilhado: nebulosa/aurora fluida em WebGL puro.
   Uso: <script src="fx.js" defer></script>
   Opções na página: <body data-fx="off"> desliga, <body data-fx="dim"> reduz a intensidade.
   Nunca lança erro: se o WebGL não existir, simplesmente não faz nada. */
(function () {
  'use strict';
  function boot() {
    try { start(); } catch (e) { /* silencioso de propósito */ }
  }

  function start() {
    var body = document.body;
    if (!body || window.__fxStarted) return;
    var mode = (body.getAttribute('data-fx') || '').toLowerCase();
    if (mode === 'off') return;
    window.__fxStarted = true;

    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;max-width:none;z-index:-1;' +
      'pointer-events:none;border:0;border-radius:0;background:none;display:block;margin:0;padding:0';
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false };
    var gl = null;
    try { gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts); } catch (e) {}
    if (!gl) return;

    var VS = 'attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      '#else',
      'precision mediump float;',
      '#endif',
      'uniform vec2 uRes;uniform float uT;uniform vec2 uPtr;uniform float uAmt;',
      // ruído de valor 2D com interpolação suave
      'float hash(vec2 p){p=fract(p*vec2(0.3183,0.3671));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x*7.31);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
      'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}',
      // camada de estrelas: uma por célula, piscando e derivando devagar
      'float stars(vec2 p,float sc,float sp){p=p*sc+vec2(uT*sp,uT*sp*.6);vec2 i=floor(p),f=fract(p)-.5;',
      ' float h=hash(i+3.7);vec2 o=(vec2(hash(i+11.3),hash(i+5.9))-.5)*.7;float d=length(f-o);',
      ' float tw=.55+.45*sin(uT*(.6+h*1.7)+h*40.);return step(.72,h)*tw*smoothstep(.07,0.,d);}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y);',
      ' vec2 m=vec2(uPtr.x*asp,uPtr.y);vec2 dm=p-m;float near=exp(-dot(dm,dm)*5.);',
      ' float t=uT*.035;',
      ' vec2 q0=p*1.35+dm*near*.35;',            // o ponteiro empurra o fluido de leve
      ' vec2 q=vec2(fbm(q0+vec2(0.,t)),fbm(q0+vec2(5.2,1.3)-t));',
      ' vec2 r=vec2(fbm(q0+3.2*q+vec2(1.7,9.2)+t*1.6),fbm(q0+3.2*q+vec2(8.3,2.8)-t*1.3));',
      ' float f=fbm(q0+3.4*r);',
      ' vec3 base=vec3(.047,.047,.051);',
      ' vec3 cA=vec3(.96,.72,.2),cB=vec3(.45,.56,.9),cC=vec3(.5,.42,.7);',
      ' float band=smoothstep(.34,.86,f);',
      ' vec3 neb=mix(cB,cC,clamp(r.x*1.5-.2,0.,1.));neb=mix(neb,cA,clamp(q.y*q.y*2.2-.25,0.,1.));',
      // faixas de aurora verticais ondulando
      ' float au=sin(p.x*3.+r.y*5.+uT*.11)*.5+.5;au=pow(au,3.)*smoothstep(.15,.95,uv.y+q.x*.35-.2);',
      ' vec3 col=base*(.82+.3*f);',
      ' col+=neb*band*band*.15*uAmt;',
      ' col+=cA*au*.045*uAmt;',
      ' col+=mix(cB,cA,.5)*near*.035*uAmt;',
      ' float st=stars(p,26.,.006)+.6*stars(p+7.3,47.,.011);',
      ' col+=vec3(.75,.82,1.)*st*.3*uAmt*(1.-band*.6);',
      ' col*=1.-.28*dot(uv-.5,uv-.5)*2.;',
      ' col+=(hash(gl_FragCoord.xy+fract(uT)*61.)-.5)*.008;',   // dithering contra faixas de cor
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n');

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        try { console.error('[fx.js][shader] ERRO de compilação:\n' + gl.getShaderInfoLog(s)); } catch (e) {}
        return null;
      }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      try { console.error('[fx.js][shader] ERRO de link:\n' + gl.getProgramInfoLog(pr)); } catch (e) {}
      return;
    }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aP = gl.getAttribLocation(pr, 'aP'); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(pr, 'uRes'), uT = gl.getUniformLocation(pr, 'uT'),
      uPtr = gl.getUniformLocation(pr, 'uPtr'), uAmt = gl.getUniformLocation(pr, 'uAmt');

    var amt = mode === 'dim' ? 0.45 : 1;
    var scale = 0.5, half = false, lost = false, shown = false;
    var reduce = false, mq = null;
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)'); reduce = mq.matches; } catch (e) {}
    var px = 0.5, py = 0.6, tx = 0.5, ty = 0.6;
    var t0 = Math.random() * 500, time = 0, last = 0, raf = 0, odd = false;
    var acc = 0, cnt = 0;

    function size() {
      // ~0,5x dos pixels CSS; DPR limitado para não pesar em telas retina
      var f = scale * Math.min(window.devicePixelRatio || 1, 1.25);
      var w = Math.max(2, Math.round(window.innerWidth * f)), h = Math.max(2, Math.round(window.innerHeight * f));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }
    function draw() {
      if (lost) return;
      size();
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, t0 + time);
      gl.uniform2f(uPtr, px, py);
      gl.uniform1f(uAmt, amt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        // só torna o body transparente quando o canvas está realmente desenhando
        if (gl.getError() === gl.NO_ERROR && !gl.isContextLost()) {
          shown = true;
          document.documentElement.style.backgroundColor = '#0c0c0d';
          body.style.background = 'transparent';
          window.__fxActive = true;
        }
      }
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      var ms = last ? now - last : 16.7; last = now;
      if (ms > 250) ms = 16.7;
      // adaptação: se estiver pesado, reduz a resolução e depois passa a 30 qps
      acc += ms; cnt++;
      if (cnt >= 60) {
        var avg = acc / cnt; acc = 0; cnt = 0; window.__fxMs = avg;
        if (avg > 22) { if (scale > 0.26) scale = Math.max(0.25, scale * 0.75); else half = true; }
      }
      time += Math.min(ms, 50) / 1000;
      px += (tx - px) * 0.04; py += (ty - py) * 0.04;
      odd = !odd;
      if (half && odd) return;
      try { draw(); } catch (e) { cancelAnimationFrame(raf); }
    }
    function run() {
      cancelAnimationFrame(raf); raf = 0;
      if (lost || document.hidden) return;
      if (reduce) { try { draw(); } catch (e) {} return; }
      last = 0; raf = requestAnimationFrame(tick);
    }

    body.insertBefore(cv, body.firstChild);
    cv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); lost = true; cancelAnimationFrame(raf);
      if (shown) { body.style.background = ''; shown = false; window.__fxActive = false; }
    });
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX / Math.max(1, window.innerWidth); ty = 1 - e.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });
    window.addEventListener('resize', function () { if (reduce && !lost && !document.hidden) { try { draw(); } catch (e) {} } });
    document.addEventListener('visibilitychange', function () { try { run(); } catch (e) {} });
    if (mq) {
      var onMq = function () { reduce = mq.matches; try { run(); } catch (e) {} };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    }
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
