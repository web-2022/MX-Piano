// Escucha el micrófono y avisa cada vez que se toca una nota nueva.
import { detectarTono } from './tono.js';
import { frecuenciaAMidi, claseNota } from './notas.js';

export class Detector {
  constructor() {
    this.ctx = null;
    this.analizador = null;
    this.buf = null;
    this.activo = false;

    // Ajustes
    this.umbralRms = 0.012;     // volumen mínimo para considerar que suena algo
    this.claridadMin = 0.8;     // qué tan "limpia" debe ser la nota (0 a 1)
    this.cuadrosEstables = 3;   // cuadros seguidos con la misma nota antes de aceptarla

    // Callbacks
    this.onNota = null;   // (midi, frecuencia) => {}
    this.onNivel = null;  // (rms, frecuencia, claridad, midi) => {}

    this._reiniciarEstado();
    this.silenciadoHasta = 0;
  }

  _reiniciarEstado() {
    this.candidato = null;
    this.cuenta = 0;
    this.armado = true;
    this.ultimaClase = null;
    this.picoRms = 0;
    this.historialRms = [];
  }

  async iniciar(ctx) {
    this.ctx = ctx;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const fuente = ctx.createMediaStreamSource(stream);
    this.analizador = ctx.createAnalyser();
    this.analizador.fftSize = 2048;
    fuente.connect(this.analizador);
    this.buf = new Float32Array(this.analizador.fftSize);
    this.activo = true;
    this._bucle();
  }

  // Ignora el micrófono durante "ms" (por ejemplo, mientras la app toca un sonido).
  silenciar(ms) {
    this.silenciadoHasta = Math.max(this.silenciadoHasta, performance.now() + ms);
  }

  // Fija el fin del silencio (Infinity = hasta nuevo aviso).
  silenciarHasta(instante) {
    this.silenciadoHasta = instante;
  }

  _bucle() {
    let par = false;
    const tick = () => {
      if (!this.activo) return;
      par = !par;
      if (par) this._procesar(); // ~30 veces por segundo es suficiente
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _procesar() {
    this.analizador.getFloatTimeDomainData(this.buf);
    const { frecuencia, claridad, rms } = detectarTono(this.buf, this.ctx.sampleRate);

    let midi = null;
    if (rms > this.umbralRms && frecuencia > 0 && claridad >= this.claridadMin) {
      midi = Math.round(frecuenciaAMidi(frecuencia));
    }
    this.onNivel?.(rms, frecuencia, claridad, midi);

    if (performance.now() < this.silenciadoHasta) {
      this._reiniciarEstado();
      return;
    }

    // ¿Hubo un nuevo golpe de tecla? (subida brusca de volumen)
    this.historialRms.push(rms);
    if (this.historialRms.length > 5) this.historialRms.shift();
    const minimoReciente = Math.min(...this.historialRms);
    if (rms > this.umbralRms * 2 && rms > minimoReciente * 2) this.armado = true;

    // ¿La nota anterior ya se apagó?
    if (rms < this.umbralRms || rms < this.picoRms * 0.45) this.armado = true;

    // Estabilidad: la misma nota varios cuadros seguidos.
    if (midi !== null && midi === this.candidato) {
      this.cuenta++;
    } else {
      this.candidato = midi;
      this.cuenta = midi === null ? 0 : 1;
    }

    const estable = midi !== null && this.cuenta >= this.cuadrosEstables;
    const notaDistinta = midi !== null && claseNota(midi) !== this.ultimaClase;

    if (estable && (this.armado || notaDistinta)) {
      this.ultimaClase = claseNota(midi);
      this.armado = false;
      this.picoRms = rms;
      this.onNota?.(midi, frecuencia, 'mic');
    } else if (!this.armado) {
      this.picoRms = Math.max(this.picoRms, rms);
    }
  }

  // Simula una nota (teclado de la pantalla, para probar sin piano).
  simular(midi) {
    this.onNota?.(midi, 0, 'pantalla');
  }
}
