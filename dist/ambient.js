(() => {
  'use strict';
  const canvas = document.getElementById('ember-field');
  const surface = canvas?.parentElement;
  const toggle = document.querySelector('.motion-toggle');
  if (!canvas || !surface || !toggle) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power',
    });
  } catch { return; }
  if (!gl) return;

  const vertexSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec3 u_pointer;
    uniform vec2 u_wake;
    uniform float u_time;
    uniform float u_scroll;
    uniform float u_energy;

    mat2 rotate(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      vec2 mouse = (u_pointer.xy - 0.5) * vec2(aspect, 1.0);
      vec2 wake = (u_wake - 0.5) * vec2(aspect, 1.0);
      vec2 delta = p - mouse;
      float touch = exp(-dot(delta, delta) * 3.2) * u_pointer.z;
      vec2 drift = mouse - wake;
      p += vec2(-delta.y, delta.x) * touch * 0.34;
      p -= drift * exp(-dot(p - wake, p - wake) * 2.4) * 0.7;
      p += mouse * 0.075;
      p = rotate(-0.39 + sin(u_scroll * 0.37) * 0.16) * p;
      p.y += sin(u_scroll * 0.5) * 0.18;
      p.x -= u_scroll * 0.10;
      float t = u_time * 0.22;
      float n = noise(p * 2.1 + vec2(t * 0.16, -t * 0.09));
      float warp = sin(p.x * 1.65 - t * 0.37) * 0.23
                 + sin(p.x * 3.1 + t * 0.21) * 0.065
                 + (n - 0.5) * 0.09;
      vec3 color = vec3(0.070, 0.058, 0.045);
      float atmosphere = exp(-length((uv - vec2(0.80, 0.53)) * vec2(1.1, 0.85)) * 2.1);
      color += vec3(0.12, 0.047, 0.020) * atmosphere;

      // Six translucent, folded ribbons share one draw call. Fine contours
      // live inside each sheet, so they read as silk rather than a particle fog.
      for (int i = 0; i < 6; i++) {
        float f = float(i);
        float offset = (f - 2.5) * 0.093;
        float fold = sin(p.x * (1.15 + f * 0.13) + t * 0.28 + f * 0.54) * 0.10;
        float center = warp + offset + fold;
        float width = 0.045 + 0.035 * (0.5 + 0.5 * sin(p.x * 1.8 - t * 0.22 + f));
        float d = p.y - center;
        float body = exp(-pow(d / width, 2.0) * 1.6);
        float edge = exp(-abs(d - width * 0.62) * 310.0);
        float thread = pow(0.5 + 0.5 * sin(d * 350.0 + p.x * 7.0 + f * 3.0), 16.0) * body;
        float taper = 0.42 + 0.58 * pow(0.5 + 0.5 * sin(p.x * 1.0 + f * 0.8 - t * 0.25), 2.0);
        float shading = smoothstep(-width, width, d);
        vec3 copper = mix(vec3(0.38, 0.075, 0.019), vec3(0.82, 0.32, 0.095), shading);
        color += copper * body * taper * 0.26;
        color += vec3(1.0, 0.49, 0.18) * edge * taper * 0.24;
        color += vec3(0.80, 0.27, 0.065) * thread * taper * 0.085;
        color += vec3(0.27, 0.058, 0.012) * exp(-abs(d) * 12.0) * 0.035;
      }

      // A broad cursor light and a slowly moving outer filament add depth.
      float filament = p.y - warp - 0.37 - sin(p.x * 2.0 + t * 0.16) * 0.06;
      color += vec3(0.75, 0.33, 0.11) * exp(-abs(filament) * 580.0) * 0.16;
      color += vec3(0.13, 0.055, 0.022) * touch;
      color += vec3(0.09, 0.028, 0.008) * u_energy * atmosphere;

      // Reserve contrast beneath the main reading column; light opens on the right.
      float reading = mix(0.38, 1.0, smoothstep(0.20, 0.79, uv.x));
      color = mix(vec3(0.078, 0.065, 0.051), color, reading);
      float vignette = 1.0 - smoothstep(0.35, 1.05, length((uv - 0.5) * vec2(0.9, 1.1)));
      color *= 0.8 + 0.2 * vignette;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  let program, buffer, uniforms;
  let available = false, frame = 0, lastTime = 0, lastDraw = 0, elapsed = 0;
  let paused = reduced.matches, suspended = false, needsSize = true;
  let scroll = window.scrollY / Math.max(1, window.innerHeight);
  let targetScroll = scroll, energy = 0, targetEnergy = 0;
  let pointer = [0.7, 0.5], targetPointer = [0.7, 0.5], wake = [...pointer];
  let presence = 0, targetPresence = 0;
  let pixelBudget = coarse.matches ? 550000 : 1600000;
  let slowFrames = 0;

  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Shader allocation unavailable');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  function prepare() {
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const fragment = precision?.precision ? fragmentSource : fragmentSource.replace('precision highp float', 'precision mediump float');
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const pixel = compile(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, pixel);
    gl.bindAttribLocation(program, 0, 'a_position');
    gl.linkProgram(program);
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    gl.deleteShader(vertex); gl.deleteShader(pixel);
    if (!linked) { gl.deleteProgram(program); program = null; throw new Error('Shader linking unavailable'); }
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(['resolution', 'pointer', 'wake', 'time', 'scroll', 'energy'].map(name => [name, gl.getUniformLocation(program, `u_${name}`)]));
    available = true; needsSize = true;
    surface.classList.add('is-ready');
    toggle.hidden = false;
  }
  function size() {
    const width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(pixelBudget / (width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    needsSize = false;
  }
  function draw() {
    if (!available || gl.isContextLost()) return;
    if (needsSize) size();
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform3f(uniforms.pointer, pointer[0], pointer[1], presence);
    gl.uniform2f(uniforms.wake, wake[0], wake[1]);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.scroll, scroll);
    gl.uniform1f(uniforms.energy, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function tick(now) {
    frame = 0;
    if (!available || paused || suspended || document.hidden) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.06) : 1 / 60;
    lastTime = now;
    elapsed += dt;
    const ease = 1 - Math.exp(-dt * 5.0), trailEase = 1 - Math.exp(-dt * 1.5);
    for (let i = 0; i < 2; i++) {
      pointer[i] += (targetPointer[i] - pointer[i]) * ease;
      wake[i] += (pointer[i] - wake[i]) * trailEase;
    }
    presence += (targetPresence - presence) * ease;
    scroll += (targetScroll - scroll) * ease;
    energy += (targetEnergy - energy) * ease;
    targetEnergy *= Math.exp(-dt * 3);
    if (!coarse.matches && dt > 0.027) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 60 && pixelBudget > 700000) {
      pixelBudget = Math.max(700000, pixelBudget * 0.75); needsSize = true; slowFrames = 0;
    }
    const interval = coarse.matches ? 1000 / 30 : 1000 / 60;
    if (now - lastDraw >= interval - 0.8) { draw(); lastDraw = now; }
    frame = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function start() {
    if (!frame && available && !paused && !suspended && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function updateControl() {
    document.body.dataset.motion = paused ? 'paused' : 'running';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume background motion' : 'Pause background motion');
    toggle.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
  }
  function fallback() {
    available = false; stop(); surface.classList.remove('is-ready'); toggle.hidden = true;
    document.body.dataset.motion = 'paused';
  }
  try { prepare(); } catch { fallback(); return; }
  updateControl(); draw(); start();

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || paused) return;
    targetPointer = [event.clientX / Math.max(1, window.innerWidth), 1 - event.clientY / Math.max(1, window.innerHeight)];
    targetPresence = 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetPresence = 0; targetPointer = [0.7, 0.5]; });
  window.addEventListener('scroll', () => {
    const next = window.scrollY / Math.max(1, window.innerHeight);
    targetEnergy = Math.min(1, targetEnergy + Math.abs(next - targetScroll) * 2);
    targetScroll = next;
  }, { passive: true });
  window.addEventListener('resize', () => {
    needsSize = true; targetScroll = window.scrollY / Math.max(1, window.innerHeight);
    if (paused) draw();
  }, { passive: true });
  toggle.addEventListener('click', () => {
    paused = !paused; updateControl();
    if (paused) stop(); else start();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches; updateControl();
    if (paused) stop(); else start();
  });
  coarse.addEventListener('change', () => {
    pixelBudget = coarse.matches ? 550000 : 1600000; needsSize = true;
    if (paused) draw();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  window.addEventListener('pagehide', () => { suspended = true; stop(); });
  window.addEventListener('pageshow', () => { suspended = false; needsSize = true; if (paused) draw(); else start(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
  canvas.addEventListener('webglcontextrestored', () => {
    try { prepare(); updateControl(); draw(); start(); } catch { fallback(); }
  });
})();
