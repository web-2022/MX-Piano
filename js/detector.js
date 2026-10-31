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
//  6. Fuerza y duración: cada nota informa qué tan fuerte se tocó y, al soltarla, cuánto duró
//     (el apagador del piano corta el sonido de golpe; eso se nota como una caída brusca).
//
// La lógica está en NucleoDetector (sin Web Audio) para poder probarla con señales sintéticas.
import { detectarTono } from './tono.js';
import { frecuenciaAMidi, claseNota } from './notas.js';
import { verificarNotas, notaNueva, crecimientoFundamental } from './acordes.js';

// ── Notas encimadas ──
// Cuando se toca una nota mientras la anterior todavía suena (lo normal en un niño), las dos se
// mezclan y el detector de tono puede "oír" una nota que nadie tocó o perder la nueva. En ese caso
// el corrector espera ~170 ms y compara el sonido con el de justo antes del golpe: la nota tocada es
// la que APARECIÓ (notaNueva). Funciona igual en el navegador y en las pruebas (sin Web Audio).
export class CorrectorSolape {
  constructor() {
    this.pendiente = null;
    this.bloqueoHasta = 0;
  }

  // f: { ahora, info, sonabaAntes, largo (función que da ~170 ms de sonido), antes (copia previa al golpe),
  //      sampleRate, desvio, minimo }. Devuelve las notas a avisar: [{ midi, frecuencia, instante, fuerza }]
  cuadro(f) {
    const { ahora, info } = f;
    const salida = [];
    const fin = () => {
      // Recuerda la última nota realmente avisada (no las que el corrector bloqueó).
      if (salida.length) this.ultimaEmitida = salida[salida.length - 1].midi;
      return salida;
    };
    if (info.ataque != null && info.escuchando && f.sonabaAntes && f.antes) {
      if (this.pendiente) this._resolver(f, salida);
      this.pendiente = { t: info.ataque, antes: f.antes, nucleo: null, fuerza: info.rms, anterior: this.ultimaEmitida };
      this.bloqueoHasta = 0;
      this.claseBloqueada = null;
    } else if (info.ataque != null) {
      // Golpe limpio (no sonaba nada): la nota que venga es confiable y no hay nada que bloquear.
      this.claseBloqueada = null;
      this.bloqueoHasta = 0;
      this.golpeLimpio = info.ataque;
    }
    // Nota nueva SIN golpe oído mientras otra seguía sonando (por ejemplo, bajando una escala: la nota
    // de arriba tapa el golpe de la de abajo). El tono de la mezcla puede salir "entre las dos"
    // (Re♯ en vez de Re): también se revisa, comparando con el sonido de justo antes.
    if (info.nota && !this.pendiente && f.notaSonando && f.antesDe && ahora >= this.bloqueoHasta
      && !(ahora - (this.golpeLimpio ?? -Infinity) < 250)) {
      const antes = f.antesDe(info.nota.instante - 20);
      if (antes) {
        this.pendiente = { t: info.nota.instante, antes, nucleo: info.nota, fuerza: info.nota.fuerza || info.rms, anterior: this.ultimaEmitida };
        this.claseBloqueada = null;
        if (ahora - this.pendiente.t >= 170) this._resolver(f, salida);
        return fin();
      }
    }
    if (info.nota) {
      if (this.pendiente) {
        this.pendiente.nucleo = this.pendiente.nucleo || info.nota;
        this.pendiente.fuerza = Math.max(this.pendiente.fuerza, info.nota.fuerza || 0);
      } else if (ahora >= this.bloqueoHasta && !(this.claseBloqueada === info.nota.midi % 12)) {
        salida.push(info.nota);
      }
    }
    if (this.pendiente && ahora - this.pendiente.t >= 170) this._resolver(f, salida);
    return fin();
  }

  _resolver(f, salida) {
    const p = this.pendiente;
    this.pendiente = null;
    const r = notaNueva(f.largo(), p.antes, f.sampleRate, { desvio: f.desvio, minimo: f.minimo });
    if (r) {
      // Nota repetida: el detector de tono dice "la misma que sonaba" y el corrector la ve en otra octava
      // (los agudos de la anterior ya se habían apagado y parecían nuevos): manda el detector de tono.
      // Y si el detector de tono dice "la misma" y su fundamental volvió a crecer, también es repetida
      // (el corrector puede haber visto un armónico, como el 3.º, que crece más tras soltar la tecla).
      // Distancias de armónicos/subarmónicos (octava, octava+quinta, dos octavas...).
      const ARMONICOS = [12, 19, 24, 28, 31];
      if (p.nucleo && p.nucleo.midi === p.anterior && r.midi !== p.nucleo.midi
        && (ARMONICOS.includes(Math.abs(r.midi - p.nucleo.midi))
          || crecimientoFundamental(f.largo(), p.antes, f.sampleRate, p.nucleo.midi, f.desvio) > 1.3)) {
        r.midi = p.nucleo.midi;
      }
      salida.push({ midi: r.midi, frecuencia: 440 * Math.pow(2, (r.midi - 69) / 12), instante: p.t, fuerza: p.fuerza });
      // Lo que el detector de tono diga en los próximos 600 ms viene de la misma mezcla: se ignora;
      // y esa misma nota no se vuelve a avisar hasta un golpe nuevo.
      this.bloqueoHasta = f.ahora + 600;
      this.claseBloqueada = r.midi % 12;
    } else if (p.nucleo) {
      salida.push(p.nucleo);
    }
  }
}

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
    this.caidaFin = 0.5;        // caída de volumen (en ~65 ms) que indica que soltó la tecla

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
    this.activa = null;        // nota que está sonando: { midi, inicio, pico }
    this.rmsRecientes = [];
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
    // Toda la ventana (~21 ms): más que el tiempo entre cuadros (~16 ms), así ningún golpe
    // cae en un hueco entre una mirada y la siguiente.
    // Segunda diferencia: resalta los agudos del martillo frente al sonido sostenido de la nota.
    let agudo = 0;
    for (let i = 2; i < n; i++) {
      const d = crudo[i] - 2 * crudo[i - 1] + crudo[i - 2];
      agudo += d * d;
    }
    agudo /= n - 2;
    this.cuadros++;
    const calentando = this.cuadros < 12; // ~0,2 s al encender el micrófono
    // Se compara con lo MÁS BAJO de los últimos ~70 ms (no solo con el cuadro anterior): como las
    // ventanas se solapan, el golpe se reparte en dos cuadros y la subida de uno a otro es menor.
    // Así se detecta el golpe aunque la nota anterior siga sonando.
    this.historialAgudo = this.historialAgudo || [];
    const base = this.historialAgudo.length ? Math.min(...this.historialAgudo) : Infinity;
    const golpe = !calentando && agudo > base * 3.5 && agudo > this.ruidoAgudo * 8 && rms > umbral * 0.7
      && ahora - this.ultimoGolpe > 90;
    this.historialAgudo.push(agudo);
    if (this.historialAgudo.length > 4) this.historialAgudo.shift();
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
      fin: null,   // { midi, duracion, instante } cuando se suelta una nota
      ataque: null, // instante en que empezó a sonar algo nuevo (para verificar acordes)
    };

    // --- Ruido de fondo: solo se mide cuando no hay nota ni golpe ---
    // Sube muy lento y baja rápido: así el sonido sostenido (pedal, notas largas)
    // no se confunde con ruido de la casa y los golpes nuevos se siguen notando.
    if (midi === null && !golpe) {
      const inicial = this.ruido === 0;
      const aR = inicial ? 0.3 : rms > this.ruido ? 0.004 : 0.08;
      const aA = inicial ? 0.3 : agudo > this.ruidoAgudo ? 0.004 : 0.08;
      this.ruido += (rms - this.ruido) * aR;
      this.ruidoAgudo += (agudo - this.ruidoAgudo) * aA;
    }

    if (silenciado || calentando) {
      this.reiniciar();
      return info;
    }

    // Ataque: golpe de tecla, o sonido que aparece desde el silencio (piano muy suave).
    if (golpe || (rms > umbral && this.rmsAnterior < umbral * 0.8)) info.ataque = ahora;

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

    // --- ¿Se soltó la nota que sonaba? ---
    this.rmsRecientes.push(rms);
    if (this.rmsRecientes.length > 5) this.rmsRecientes.shift();
    if (this.activa) {
      const a = this.activa;
      a.pico = Math.max(a.pico, rms);
      const r = this.rmsRecientes;
      const caidaBrusca = r.length === 5 && rms < r[0] * this.caidaFin && rms < a.pico * 0.6 && !golpe;
      if (caidaBrusca || rms < umbral) {
        // La caída se nota unos 50 ms después de soltar: se descuentan.
        const instante = Math.max(a.inicio + 20, ahora - (caidaBrusca ? 50 : 30));
        info.fin = { midi: a.midi, duracion: instante - a.inicio, instante };
        this.activa = null;
      }
    }

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
      const instante = golpeReciente ? this.ultimoGolpe : ahora - cuenta * 16;
      info.nota = {
        midi,
        frecuencia,
        // Momento del golpe: sirve para medir el ritmo con precisión.
        instante,
        // Fuerza: el volumen más alto desde el golpe (para "fuerte" y "suave").
        fuerza: golpeReciente ? Math.max(this.rmsDesdeGolpe, rms) : rms,
      };
      // Si la anterior seguía sonando (ligado), termina justo cuando empieza esta.
      if (this.activa && !info.fin) {
        info.fin = { midi: this.activa.midi, duracion: instante - this.activa.inicio, instante, ligada: true };
      }
      this.activa = { midi, inicio: instante, pico: rms };
      this.rmsRecientes = [];
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
    this.onNota = null;   // (midi, frecuencia, origen, instante, fuerza) => {}
    this.onFin = null;    // (midi, duracion, origen, instante, ligada) => {}
    this.onAtaque = null; // (instante) => {}   algo empezó a sonar (acordes)
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
    // Ventana larga (~170 ms) para distinguir las notas de un acorde.
    this.analizadorAcorde = ctx.createAnalyser();
    this.analizadorAcorde.fftSize = 8192;
    pasaBajos.connect(this.analizadorAcorde);
    this.bufAcorde = new Float32Array(this.analizadorAcorde.fftSize);

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

  // ── Vigilancia (modo pedal) ──
  // Con mucho pedal, algunos golpes se pierden entre lo que sigue sonando. Entonces se vigila
  // directamente la nota (o acorde) que se espera: unas 20 veces por segundo se compara el
  // sonido de ahora con el de hace un cuarto de segundo y, si esas notas acaban de aparecer,
  // se avisa. "alOir" recibe el instante aproximado del golpe.
  vigilar(esperadas, alOir, { cualquierOctava = false } = {}) {
    this.vigilancia = { esperadas, alOir, cualquierOctava, guardados: [] };
  }

  dejarDeVigilar() {
    this.vigilancia = null;
  }

  _vigilar(ahora) {
    const v = this.vigilancia;
    if (!v || !this.analizadorAcorde) return;
    if (ahora < this.silenciadoHasta) { v.guardados = []; return; }
    this.cuadroVigilancia = (this.cuadroVigilancia || 0) + 1;
    if (this.cuadroVigilancia % 3) return;
    const b = new Float32Array(this.analizadorAcorde.fftSize);
    this.analizadorAcorde.getFloatTimeDomainData(b);
    v.guardados.push({ t: ahora, b });
    while (v.guardados.length && v.guardados[0].t < ahora - 600) v.guardados.shift();
    // "Antes": un sonido de hace 250 a 400 ms (que todavía no tenga el golpe nuevo).
    const antes = [...v.guardados].reverse().find((g) => g.t <= ahora - 250 && g.t >= ahora - 420);
    if (!antes) return;
    const opciones = { desvio: this.nucleo.desvio, pedal: true, antes: antes.b, minimo: this.minimoNota() };
    const desplazamientos = v.cualquierOctava ? [0, -12, 12] : [0];
    for (const d of desplazamientos) {
      const r = verificarNotas(b, this.ctx.sampleRate, v.esperadas.map((m) => m + d), opciones);
      if (r.ok) {
        const alOir = v.alOir;
        this.vigilancia = null;
        alOir(ahora - 200, r);
        return;
      }
    }
  }

  _procesar() {
    this.analizadorTono.getFloatTimeDomainData(this.bufTono);
    this.analizadorCrudo.getFloatTimeDomainData(this.bufCrudo);
    const ahora = performance.now();
    // ¿Sonaba una nota justo antes de este cuadro? (para saber si un golpe nuevo se encima)
    const sonabaAntes = !!this.nucleo.activa || this.nucleo.rmsAnterior > this.nucleo.umbralEfectivo();
    const notaSonando = !!this.nucleo.activa; // una nota ya avisada que todavía no se apagó
    const midiSonando = this.nucleo.activa?.midi ?? null;
    const info = this.nucleo.procesar(this.bufTono, this.bufCrudo, this.ctx.sampleRate, ahora, ahora < this.silenciadoHasta);
    this.onNivel?.(info);
    this._vigilar(ahora);
    // Primero el fin de la nota anterior y después la nueva (importa en el ligado).
    if (info.ataque != null && info.escuchando) {
      // Sonido justo antes del golpe (para el modo pedal: saber qué es nuevo).
      // Cada golpe guarda su propia copia; un segundo aviso del mismo golpe (< 150 ms) no la pisa.
      if (this.analizadorAcorde && !(ahora - (this.tAntes || -1e9) < 150)) {
        this.bufAntes = new Float32Array(this.analizadorAcorde.fftSize);
        this.analizadorAcorde.getFloatTimeDomainData(this.bufAntes);
        this.tAntes = ahora;
      }
      this.onAtaque?.(info.ataque);
    }
    if (info.fin) this.onFin?.(info.fin.midi, info.fin.duracion, 'mic', info.fin.instante, !!info.fin.ligada);
    this.corrector = this.corrector || new CorrectorSolape();
    // Copias del sonido cada ~50 ms (las últimas ~0,5 s), para saber qué sonaba antes de una nota.
    this.copias = this.copias || [];
    this.cuadroCopia = (this.cuadroCopia || 0) + 1;
    if (this.cuadroCopia % 3 === 0 && this.analizadorAcorde) {
      const b = this.copias.length >= 10 ? this.copias.shift().b : new Float32Array(this.analizadorAcorde.fftSize);
      this.analizadorAcorde.getFloatTimeDomainData(b);
      this.copias.push({ t: ahora, b });
    }
    const notas = this.corrector.cuadro({
      ahora, info, sonabaAntes, notaSonando, midiSonando,
      antes: info.ataque != null ? this.bufAntes : null,
      antesDe: (t) => {
        let mejor = null;
        for (const c of this.copias) if (c.t <= t && (!mejor || c.t > mejor.t)) mejor = c;
        return mejor && t - mejor.t < 150 ? Float32Array.from(mejor.b) : null;
      },
      largo: () => { this.analizadorAcorde.getFloatTimeDomainData(this.bufAcorde); return this.bufAcorde; },
      sampleRate: this.ctx.sampleRate, desvio: this.nucleo.desvio, minimo: this.minimoNota(),
    });
    for (const n of notas) {
      // El núcleo queda sabiendo cuál fue la nota real (para no repetirla después).
      this.nucleo.ultimaClase = claseNota(n.midi);
      this.nucleo.ultimoMidi = n.midi;
      if (this.nucleo.activa) this.nucleo.activa.midi = n.midi;
      this.onNota?.(n.midi, n.frecuencia, 'mic', n.instante, n.fuerza);
    }
  }

  // ¿Están sonando estas notas ahora? (para acordes). Prueba también una octava
  // arriba y abajo si se permite, porque el niño puede tocar el acorde en otro Do.
  // pedal: no busca teclas de más y exige que cada nota "acabe de sonar" (comparando con antes del golpe).
  // antes: la copia del sonido previo a ESE golpe (por defecto, la del último golpe).
  // Piso de energía para una nota: una senoide de amplitud A da ~A²/16; se pide la mitad del umbral.
  minimoNota() {
    const u = this.nucleo.umbralEfectivo();
    return (u * u) / 32;
  }

  verificarAcorde(esperadas, { cualquierOctava = false, pedal = false, antes = this.bufAntes } = {}) {
    if (!this.analizadorAcorde) return { ok: false, faltan: esperadas, sobran: [], detalle: {} };
    this.analizadorAcorde.getFloatTimeDomainData(this.bufAcorde);
    const opciones = { desvio: this.nucleo.desvio, pedal: pedal && !!antes, antes, minimo: this.minimoNota() };
    const base = verificarNotas(this.bufAcorde, this.ctx.sampleRate, esperadas, opciones);
    if (base.ok || !cualquierOctava) return base;
    for (const d of [-12, 12]) {
      const r = verificarNotas(this.bufAcorde, this.ctx.sampleRate, esperadas.map((m) => m + d), opciones);
      if (r.ok) return { ...r, faltan: [], sobran: [] };
    }
    return base;
  }

  // Simula una nota (teclado de la pantalla, para probar sin piano).
  // fuerza: 0 a 1 (en la pantalla, tocar abajo en la tecla = fuerte, arriba = suave).
  simular(midi, fuerza = 0.5) {
    const ahora = performance.now();
    if (this.teclaPantalla) {
      const t = this.teclaPantalla;
      this.onFin?.(t.midi, ahora - t.inicio, 'pantalla', ahora, true);
    }
    this.teclaPantalla = { midi, inicio: ahora };
    this.onNota?.(midi, 0, 'pantalla', ahora, fuerza);
  }

  simularFin(midi) {
    const t = this.teclaPantalla;
    if (!t || t.midi !== midi) return;
    this.teclaPantalla = null;
    const ahora = performance.now();
    this.onFin?.(midi, ahora - t.inicio, 'pantalla', ahora, false);
  }
}
