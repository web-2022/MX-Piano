// Piano virtual para probar Pianito SIN piano: reemplaza el micrófono por un sintetizador.
// Se inyecta en la página antes de que cargue (Playwright: addInitScript). El sonido entra por el
// mismo camino que el micrófono real (getUserMedia → detector), así se prueba la detección completa.
//
//   window.pianoVirtual.tocar(midi, segundos, volumen)
(() => {
  let destino = null;
  let ctx = null;
  const original = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

  function preparar(nuevoCtx) {
    if (ctx === nuevoCtx && destino) return;
    ctx = nuevoCtx;
    destino = ctx.createMediaStreamDestination();
    // Ruido de la sala, muy bajo
    const largo = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * 0.003;
    const ruido = ctx.createBufferSource();
    ruido.buffer = b;
    ruido.loop = true;
    ruido.connect(destino);
    ruido.start();
  }

  navigator.mediaDevices.getUserMedia = async (opciones) => {
    const c = window.pianito?.estado?.ctx;
    if (!c || !opciones?.audio) return original(opciones);
    preparar(c);
    return destino.stream;
  };

  const sonando = new Map(); // midi → ganancia de la nota que todavía suena

  function tocar(midi, segundos = 0.5, volumen = 0.2) {
    if (!ctx || !destino) return;
    const t0 = ctx.currentTime + 0.005;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    // Volver a tocar la misma tecla: el martillo golpea la MISMA cuerda (la vibración anterior se
    // reemplaza; no se suma una segunda cuerda encima).
    const anterior = sonando.get(midi);
    if (anterior) anterior.gain.setTargetAtTime(0, t0, 0.003);
    const salida = ctx.createGain();
    salida.gain.value = 1;
    salida.connect(destino);
    sonando.set(midi, salida);
    for (let k = 1; k <= 8; k++) {
      const fk = f * k * Math.sqrt(1 + 0.0003 * k * k);
      if (fk > ctx.sampleRate / 2.3) break;
      const o = ctx.createOscillator();
      o.frequency.value = fk;
      const g = ctx.createGain();
      const a = (volumen / Math.pow(k, 1.1)) * (midi < 55 && k === 1 ? 0.5 : 1);
      const tau = 1.4 / Math.sqrt(k);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(a, t0 + 0.003);
      g.gain.setTargetAtTime(0, t0 + 0.003, tau);
      g.gain.setTargetAtTime(0, t0 + segundos, 0.04); // soltar la tecla (apagador)
      o.connect(g).connect(salida);
      o.start(t0);
      o.stop(t0 + segundos + 0.4);
    }
    // Golpe del martillo: ráfaga aguda de 6 ms
    const n = Math.floor(ctx.sampleRate * 0.006);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < n; i++) { const r = Math.random() * 2 - 1; d[i] = volumen * 0.5 * (r - prev) * (1 - i / n); prev = r; }
    const golpe = ctx.createBufferSource();
    golpe.buffer = b;
    golpe.connect(salida);
    golpe.start(t0);
  }

  window.pianoVirtual = { tocar, listo: () => !!destino };
})();
