// Escucha el micrófono y avisa cada vez que se toca una nota nueva.
//
// Cómo decide que "se tocó una nota":
//  1. Golpe de tecla: el martillo del piano produce un "clic" agudo muy corto.
//     Se detecta como una subida brusca de la energía aguda (variación entre muestras).
//  2. Tono: el método McLeod (tono.js) calcula la frecuencia sobre la señal filtrada
//     (sin graves de ruido ni agudos de siseo).
//  3. Estabilidad: la misma nota durante varios cuadros y sin "deslizarse"
//     (la voz humana y la TV cambian de tono; el piano no).
//  4. Ruido de la casa: el nivel de fondo se mide solo y sube el umbral si hace falta.
//  5. Afinación: si el piano de casa está un poco desafinado, se compensa poco a poco.
//
// La lógica está en NucleoDetector (sin Web Audio) para poder probarla con señales sintéticas.
import { detectarTono } from './tono.js';
import { frecuenciaAMidi, claseNota } from './notas.js';

const FREC_MIN = 60;    // un poco más grave que Do2
const FREC_MAX = 2100;  // Do7

export class NucleoDetector {
  constructor() {
    // Ajustes (la sensibilidad de ⚙️ cambia umbralRms)
    this.umbralRms = 0.012;     // volumen mínimo base
    this.claridadMin = 0.8;     // qué tan "limpia" debe ser la nota (0 a 1)
    this.cuadrosEstables = 3;   // cuadros seguidos con la misma nota (~50 ms)
    this.cuadrosSinGolpe = 6;   // si no se oyó el golpe, exige más cuadros (~100 ms)
    this.maxDeslizamiento = 0.3;  // semitonos que puede variar mientras se confirma
    this.compensarAfinacion = true;

    this.ruido = 0;        // nivel de ruido de fondo medido (rms)
    this.ruidoAgudo = 0;   // energía aguda de fondo
    this.desvio = 0;       // desafinación general del piano, en semitonos (±0,45)
    this.cuadros = 0;      // los primeros cuadros solo sirven para medir el ruido
    this.reiniciar();
  }

  reiniciar() {
    this.candidato = null;
    this.historialTono = [];
    this.ultimaClase = null;
    this.ultimoMidi = null;
    this.armado = true;       // listo para aceptar la misma nota otra vez
    this.picoRms = 0;
    this.agudoAnterior = 0;
    this.ultimoGolpe = -Infinity;
    this.golpeUsado = true;
    this.rmsAnterior = 0;
    this.rmsAntesGolpe = 0;
    this.rmsDesdeGolpe = 0;
  }

  umbralEfectivo() {
    // El ruido de la casa sube el umbral, pero sin pasar de 6 veces el base.
    return Math.min(Math.max(this.umbralRms, this.ruido * 2.5), this.umbralRms * 6);
  }

  // tono: muestras filtradas para calcular la frecuencia.
  // crudo: muestras sin filtrar (las más recientes al final) para detectar el golpe.
  // ahora: tiempo en ms. silenciado: true mientras la app habla o suena.
  procesar(tono, crudo, sampleRate, ahora, silenciado = false) {
    const { frecuencia, claridad, rms } = detectarTono(tono, sampleRate, FREC_MIN, FREC_MAX);
    const umbral = this.umbralEfectivo();

    // --- Golpe de tecla: energía aguda de la parte más reciente de la ventana ---
    const n = crudo.length;
    const desde = Math.max(1, n - 512);
    let agudo = 0;
    for (let i = desde; i < n; i++) {
      const d = crudo[i] - crudo[i - 1];
      agudo += d * d;
    }
    agudo /= n - desde;
    this.cuadros++;
    const calentando = this.cuadros < 12; // ~0,2 s al encender el micrófono
    const golpe = !calentando && agudo > this.agudoAnterior * 4 && agudo > this.ruidoAgudo * 8 && rms > umbral * 0.7;
    this.agudoAnterior = agudo;

    // --- Tono ---
    let midiExacto = null;
    let midi = null;
    if (rms > umbral && frecuencia > 0 && claridad >= this.claridadMin) {
      midiExacto = frecuenciaAMidi(frecuencia) - this.desvio;
      midi = Math.round(midiExacto);
    }
    const info = {
      rms, umbral, frecuencia, claridad, midi,
      cents: midiExacto == null ? 0 : Math.round((midiExacto - midi) * 100),
      desvio: Math.round(this.desvio * 100),
      escuchando: !silenciado,
      nota: null,
    };

    // --- Ruido de fondo: solo se mide cuando no hay nota ni golpe ---
    if (midi === null && !golpe) {
      const a = this.ruido === 0 ? 0.3 : 0.03;
      this.ruido += (rms - this.ruido) * a;
      this.ruidoAgudo += (agudo - this.ruidoAgudo) * a;
    }

    if (silenciado || calentando) {
      this.reiniciar();
      return info;
    }

    if (golpe) {
      this.ultimoGolpe = ahora;
      this.golpeUsado = false;
      this.armado = true;
      this.rmsAntesGolpe = this.rmsAnterior;
      this.rmsDesdeGolpe = 0;
      // Lo que sonaba antes del golpe no cuenta: la nota nueva se confirma desde cero.
      this.candidato = null;
      this.historialTono = [];
    }
    this.rmsDesdeGolpe = Math.max(this.rmsDesdeGolpe, rms);
    this.rmsAnterior = rms;

    // ¿La nota anterior ya se apagó? Entonces se puede volver a tocar la misma.
    if (rms < umbral) this.armado = true;

    // --- Estabilidad: misma nota y sin deslizarse ---
    if (midi !== null && midi === this.candidato) {
      this.historialTono.push(midiExacto);
    } else {
      this.candidato = midi;
      this.historialTono = midi === null ? [] : [midiExacto];
    }
    const h = this.historialTono;
    const cuenta = h.length;
    // ¿Se mantuvo quieta en los últimos k cuadros? (los primeros, justo tras el golpe,
    // todavía se mezclan con la nota anterior y no cuentan)
    const quietaEn = (k) => {
      const u = h.slice(-k);
      return u.length >= k && Math.max(...u) - Math.min(...u) <= this.maxDeslizamiento;
    };

    const golpeReciente = !this.golpeUsado && ahora - this.ultimoGolpe < 300;
    const mismaNota = midi !== null && claseNota(midi) === this.ultimaClase;

    let aceptar = false;
    if (midi !== null && quietaEn(this.cuadrosEstables)) {
      // Si es la misma nota de antes, hay que distinguir "la tocó otra vez" de "es la
      // anterior que sigue sonando": el volumen sube con el golpe, o ya venía bajando
      // porque soltó la tecla.
      const repetida = this.rmsDesdeGolpe > this.rmsAntesGolpe * 1.15 || this.rmsAntesGolpe < this.picoRms * 0.85;
      if (golpeReciente && (!mismaNota || repetida)) {
        // Golpe claro: se acepta la nota.
        aceptar = true;
      } else if (!mismaNota && quietaEn(this.cuadrosSinGolpe) && claridad >= 0.88) {
        // Nota distinta, muy clara y sostenida aunque no se oyó el golpe (piano suave).
        aceptar = true;
      } else if (mismaNota && this.armado && quietaEn(this.cuadrosSinGolpe) && this.picoRms === 0) {
        // La misma nota otra vez, después de que la anterior se apagó del todo.
        aceptar = true;
      }
    }

    if (aceptar) {
      const u = h.slice(-this.cuadrosEstables);
      const promedio = u.reduce((a, v) => a + v, 0) / u.length;
      info.nota = {
        midi,
        frecuencia,
        // Momento del golpe: sirve para medir el ritmo con precisión.
        instante: golpeReciente ? this.ultimoGolpe : ahora - cuenta * 16,
      };
      this.ultimaClase = claseNota(midi);
      this.ultimoMidi = midi;
      this.armado = false;
      this.golpeUsado = true;
      this.picoRms = rms;
      // Afinación: se corrige un poco con cada nota reconocida.
      if (this.compensarAfinacion) {
        this.desvio = Math.max(-0.45, Math.min(0.45, this.desvio + (promedio - midi) * 0.15));
      }
    } else if (rms < umbral) {
      this.picoRms = 0;
    } else if (!this.armado) {
      this.picoRms = Math.max(this.picoRms, rms);
    }
    return info;
  }
}

export class Detector {
  constructor() {
    this.ctx = null;
    this.nucleo = new NucleoDetector();
    this.activo = false;
    this.stream = null;
    this.silenciadoHasta = 0;

    // Callbacks
    this.onNota = null;   // (midi, frecuencia, origen, instante) => {}
    this.onNivel = null;  // (info) => {}
  }

  get umbralRms() { return this.nucleo.umbralRms; }
  set umbralRms(v) { this.nucleo.umbralRms = v; }

  async iniciar(ctx) {
    this.ctx = ctx;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const fuente = ctx.createMediaStreamSource(this.stream);

    // Rama para el tono: sin graves de ruido (aire, golpes en la mesa) ni siseo agudo.
    const pasaAltos = ctx.createBiquadFilter();
    pasaAltos.type = 'highpass';
    pasaAltos.frequency.value = 50;
    const pasaBajos = ctx.createBiquadFilter();
    pasaBajos.type = 'lowpass';
    pasaBajos.frequency.value = 2400;
    this.analizadorTono = ctx.createAnalyser();
    this.analizadorTono.fftSize = 2048;
    fuente.connect(pasaAltos).connect(pasaBajos).connect(this.analizadorTono);

    // Rama sin filtro para oír el golpe del martillo.
    this.analizadorCrudo = ctx.createAnalyser();
    this.analizadorCrudo.fftSize = 1024;
    fuente.connect(this.analizadorCrudo);

    this.bufTono = new Float32Array(this.analizadorTono.fftSize);
    this.bufCrudo = new Float32Array(this.analizadorCrudo.fftSize);
    this.nucleo.reiniciar();
    if (!this.activo) {
      this.activo = true;
      this._bucle();
    }
  }

  // En iPad el micrófono se corta al salir de la app. Devuelve true si hay que reiniciarlo.
  necesitaReiniciar() {
    const pista = this.stream?.getAudioTracks()[0];
    return !!pista && pista.readyState === 'ended';
  }

  // Ignora el micrófono durante "ms" (por ejemplo, mientras la app toca un sonido).
  silenciar(ms) {
    this.silenciadoHasta = Math.max(this.silenciadoHasta, performance.now() + ms);
  }

  // Fija el fin del silencio (Infinity = hasta nuevo aviso).
  silenciarHasta(instante) {
    this.silenciadoHasta = instante;
  }

  get escuchando() {
    return performance.now() >= this.silenciadoHasta;
  }

  _bucle() {
    const tick = () => {
      if (!this.activo) return;
      this._procesar();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _procesar() {
    this.analizadorTono.getFloatTimeDomainData(this.bufTono);
    this.analizadorCrudo.getFloatTimeDomainData(this.bufCrudo);
    const ahora = performance.now();
    const info = this.nucleo.procesar(this.bufTono, this.bufCrudo, this.ctx.sampleRate, ahora, ahora < this.silenciadoHasta);
    this.onNivel?.(info);
    if (info.nota) this.onNota?.(info.nota.midi, info.nota.frecuencia, 'mic', info.nota.instante);
  }

  // Simula una nota (teclado de la pantalla, para probar sin piano).
  simular(midi) {
    this.onNota?.(midi, 0, 'pantalla', performance.now());
  }
}
