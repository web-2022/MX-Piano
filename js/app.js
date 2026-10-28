import {
  nombreNota, nombreConOctava, colorNota, claseNota, esTeclaNegra,
  notaAMidi, DEDO_POSICION_DO, DEDO_IZQUIERDA_POSICION_DO,
} from './notas.js';
import { Detector } from './detector.js';
import {
  tocarNota, sonidoExito, sonidoFinal, programarNota, programarClic, detenerTodo,
} from './sonido.js';
import { MUNDOS, JUEGOS, buscarLeccion } from './lecciones.js';
import { crearJuego } from './juegos.js';
import { pentagramaSVG, figuraSVG } from './pentagrama.js';
import { cargarAjustes, guardarAjustes, cargarProgreso, guardarProgreso } from './almacen.js';

const $ = (s) => document.querySelector(s);

const estado = {
  ctx: null,
  detector: new Detector(),
  micListo: false,
  ajustes: cargarAjustes(),
  progreso: cargarProgreso(),
  juego: null,
  pausa: false,   // true mientras está abierta la pregunta de salir
};

const FRASES_ACIERTO = ['¡Muy bien!', '¡Genial!', '¡Bravo!', '¡Eso es!', '¡Súper!', '¡Lo lograste!'];
const FRASES_ERROR = ['¡Casi! Otra vez', '¡Uy! Prueba de nuevo', 'Tú puedes, otra vez'];
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ================= Pantallas =================
function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach((p) => p.classList.remove('activa'));
  $('#' + id).classList.add('activa');
}

// ================= Voz =================
let vozElegida = null;
function elegirVoz() {
  if (!('speechSynthesis' in window)) return;
  const voces = speechSynthesis.getVoices();
  const preferidas = ['es-PE', 'es-MX', 'es-US', 'es-419', 'es-CO', 'es-ES'];
  for (const lang of preferidas) {
    const v = voces.find((x) => x.lang.replace('_', '-') === lang);
    if (v) { vozElegida = v; return; }
  }
  vozElegida = voces.find((x) => x.lang.startsWith('es')) || null;
}
if ('speechSynthesis' in window) {
  elegirVoz();
  speechSynthesis.addEventListener?.('voiceschanged', elegirVoz);
}

function decir(texto) {
  if (!estado.ajustes.voz || !('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((resolver) => {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = vozElegida?.lang || 'es-MX';
    if (vozElegida) u.voice = vozElegida;
    u.rate = 0.95;
    u.pitch = 1.25;
    let listo = false;
    const fin = () => {
      if (listo) return;
      listo = true;
      estado.detector.silenciarHasta(performance.now() + 300);
      resolver();
    };
    u.onend = fin;
    u.onerror = fin;
    setTimeout(fin, 4000);
    estado.detector.silenciarHasta(Infinity); // que el micrófono no escuche la voz
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

// ================= Sonidos (silenciando el micrófono) =================
function sonar(fn, ...args) {
  if (!estado.ctx) return 0;
  const ms = fn(estado.ctx, ...args);
  estado.detector.silenciar(ms + 150);
  return ms;
}

// ================= Inicio =================
$('#btn-empezar').addEventListener('click', async () => {
  const msg = $('#mensaje-inicio');
  msg.textContent = '';
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    estado.ctx = estado.ctx || new Ctx();
    await estado.ctx.resume();
  } catch {
    msg.textContent = 'Este navegador no permite sonido. Prueba con Safari o Chrome.';
    return;
  }

  // Desbloquea la voz en iPad (debe hablar por primera vez tras un toque).
  if (estado.ajustes.voz) decir('¡Hola! Vamos a tocar piano.');

  if (!estado.micListo && !estado.ajustes.tecladoPantalla) {
    try {
      await estado.detector.iniciar(estado.ctx);
      estado.micListo = true;
    } catch (e) {
      msg.textContent = 'No pude usar el micrófono. Revisa el permiso del navegador, ' +
        'o activa "teclado de la pantalla" en ⚙️ para probar sin piano.';
      estado.ajustes.tecladoPantalla = true;
      guardarAjustes(estado.ajustes);
      await esperar(2500);
    }
  }
  aplicarAjustesDetector();
  dibujarMapa();
  mostrar('pantalla-mapa');
});

document.addEventListener('visibilitychange', async () => {
  if (document.hidden) return;
  if (estado.ctx?.state === 'suspended') estado.ctx.resume();
  // En iPad, al volver a la app el micrófono puede haberse cortado: se vuelve a abrir.
  if (estado.micListo && estado.detector.necesitaReiniciar()) {
    try { await estado.detector.iniciar(estado.ctx); } catch { /* se intenta en el próximo toque */ }
  }
});

// ================= Mapa =================
function estrellasDe(id) {
  return estado.progreso.estrellas[id] || 0;
}

function botonParada(leccion, { bloqueada, siguiente, est }) {
  const boton = document.createElement('button');
  boton.className = 'parada';
  if (leccion.premio) boton.classList.add('premio');
  if (bloqueada) boton.classList.add('bloqueada');
  if (siguiente) boton.classList.add('siguiente');
  if (est > 0) boton.classList.add('hecha');
  boton.setAttribute('aria-label', bloqueada ? `${leccion.titulo} (bloqueada)` : leccion.titulo);
  boton.innerHTML = `
    <span class="piedra">
      <span class="emoji">${bloqueada ? '🔒' : leccion.emoji}</span>
      ${siguiente ? '<img class="rana-aqui" src="img/rana.png" alt="">' : ''}
    </span>
    <span class="estrellas">${[1, 2, 3].map((n) => `<i class="${n <= est ? 'ganada' : ''}">★</i>`).join('')}</span>
    <span class="nombre">${leccion.titulo}</span>`;
  return boton;
}

function dibujarMapa() {
  const mapa = $('#mapa');
  mapa.innerHTML = '';
  let anteriorCompletada = true;
  let siguienteMarcada = false;
  let total = 0;
  let botonSiguiente = null;

  for (const mundo of MUNDOS) {
    const seccion = document.createElement('section');
    seccion.className = 'mundo';
    seccion.style.setProperty('--color-mundo', mundo.color);
    const ganadas = mundo.lecciones.reduce((sum, l) => sum + estrellasDe(l.id), 0);
    seccion.innerHTML = `
      <header class="mundo-cabecera">
        <span class="mundo-emoji">${mundo.emoji || '🎵'}</span>
        <h2>${mundo.titulo}<small>Nivel ${mundo.nivel}</small></h2>
        <span class="mundo-estrellas">★ ${ganadas}/${mundo.lecciones.length * 3}</span>
      </header>`;
    const camino = document.createElement('div');
    camino.className = 'camino';

    for (const leccion of mundo.lecciones) {
      const est = estrellasDe(leccion.id);
      total += est;
      const bloqueada = !anteriorCompletada && !estado.ajustes.desbloquearTodo;
      const siguiente = !bloqueada && est === 0 && !siguienteMarcada;
      if (siguiente) siguienteMarcada = true;
      const boton = botonParada(leccion, { bloqueada, siguiente, est });
      if (siguiente) botonSiguiente = boton;
      boton.addEventListener('click', () => {
        if (bloqueada) {
          sacudir(boton);
          decir('Primero termina la lección anterior');
          return;
        }
        empezarLeccion(leccion.id);
      });
      camino.appendChild(boton);
      anteriorCompletada = est > 0;
    }
    seccion.appendChild(camino);
    mapa.appendChild(seccion);
  }
  for (const juego of JUEGOS) total += estrellasDe(juego.id);
  $('#total-estrellas').textContent = `⭐ ${total}`;
  dibujarParque();

  // Llevar la vista hasta la próxima lección, para que el niño no tenga que buscarla.
  if (botonSiguiente && !$('#mapa').classList.contains('oculto')) {
    requestAnimationFrame(() => botonSiguiente.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }
}

function dibujarParque() {
  const parque = $('#parque');
  parque.innerHTML = `<p class="parque-intro">🐸 ¡Juegos para practicar! Se abren a medida que avanzas en el viaje.</p>`;
  const rejilla = document.createElement('div');
  rejilla.className = 'rejilla-juegos';
  let nuevos = 0;
  for (const juego of JUEGOS) {
    const est = estrellasDe(juego.id);
    const abierto = estado.ajustes.desbloquearTodo || estrellasDe(juego.requiere) > 0;
    if (abierto && est === 0) nuevos++;
    const req = buscarLeccion(juego.requiere);
    const tarjeta = document.createElement('button');
    tarjeta.className = 'tarjeta-juego';
    if (!abierto) tarjeta.classList.add('bloqueada');
    tarjeta.innerHTML = `
      <span class="juego-emoji">${abierto ? juego.emoji : '🔒'}</span>
      <span class="nombre">${juego.titulo}</span>
      <span class="estrellas">${[1, 2, 3].map((n) => `<i class="${n <= est ? 'ganada' : ''}">★</i>`).join('')}</span>
      ${abierto ? '' : `<small>Se abre con: ${req?.titulo || ''}</small>`}`;
    tarjeta.addEventListener('click', () => {
      if (!abierto) {
        sacudir(tarjeta);
        decir('Este juego se abre más adelante en tu viaje');
        return;
      }
      empezarLeccion(juego.id);
    });
    rejilla.appendChild(tarjeta);
  }
  parque.appendChild(rejilla);
  const pestana = $('[data-pestana="parque"]');
  pestana.dataset.nuevos = nuevos || '';
}

document.querySelectorAll('.pestana').forEach((p) => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((x) => x.classList.toggle('activa', x === p));
    const ver = p.dataset.pestana;
    $('#mapa').classList.toggle('oculto', ver !== 'mapa');
    $('#parque').classList.toggle('oculto', ver !== 'parque');
    if (ver === 'mapa') dibujarMapa();
  });
});

// ================= Efectos =================
function sacudir(el) {
  if (!el) return;
  el.classList.remove('sacudir');
  void el.offsetWidth;
  el.classList.add('sacudir');
}

// Estrellitas que salen disparadas desde un elemento (premio de cada acierto).
function chispas(el) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const simbolos = ['✦', '★', '✨', '♪'];
  for (let i = 0; i < 10; i++) {
    const c = document.createElement('span');
    c.className = 'chispa';
    c.textContent = simbolos[i % simbolos.length];
    const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 60;
    c.style.left = `${cx}px`;
    c.style.top = `${cy}px`;
    c.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    c.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    c.style.color = ['#facc15', '#f472b6', '#22c55e', '#38bdf8', '#a855f7'][i % 5];
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 800);
  }
}

function confeti() {
  const cont = $('#confeti');
  cont.innerHTML = '';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colores = ['#f43f5e', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colores[i % colores.length];
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    p.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    p.style.setProperty('--giro', `${(Math.random() * 2 - 1) * 720}deg`);
    p.style.setProperty('--deriva', `${(Math.random() * 2 - 1) * 80}px`);
    cont.appendChild(p);
  }
  setTimeout(() => { cont.innerHTML = ''; }, 4500);
}

// ================= Teclado en pantalla =================
function dibujarTeclado([desde, hasta] = [60, 72]) {
  const teclado = $('#teclado');
  teclado.innerHTML = '';
  const blancas = [];
  for (let m = desde; m <= hasta; m++) if (!esTeclaNegra(m)) blancas.push(m);
  teclado.classList.toggle('ancho', blancas.length > 10);

  blancas.forEach((m) => {
    const t = document.createElement('div');
    t.className = 'tecla-blanca';
    if (m === 60) t.classList.add('do-central');
    t.dataset.midi = m;
    t.style.setProperty('--color', colorNota(m));
    t.innerHTML = `<span class="pegatina"></span>${nombreNota(m)}`;
    teclado.appendChild(t);
  });

  for (let m = desde; m <= hasta; m++) {
    if (!esTeclaNegra(m)) continue;
    const indiceBlancaAnterior = blancas.indexOf(m - 1);
    const t = document.createElement('div');
    t.className = 'tecla-negra';
    t.dataset.midi = m;
    const fraccion = (indiceBlancaAnterior + 1 - 0.3) / blancas.length;
    t.style.left = `calc(6px + (100% - 12px) * ${fraccion})`;
    t.style.width = `calc((100% - 12px) * ${0.6 / blancas.length})`;
    teclado.appendChild(t);
  }

  teclado.querySelectorAll('[data-midi]').forEach((t) => {
    t.addEventListener('pointerdown', () => {
      if (!estado.ajustes.tecladoPantalla) return;
      const midi = Number(t.dataset.midi);
      const enRitmo = estado.juego?.ritmo?.corriendo;
      if (enRitmo) programarNota(estado.ctx, midi, estado.ctx.currentTime, 0.4, estado.juego.ritmo.nodos);
      else sonar(tocarNota, midi, 0.6);
      estado.detector.simular(midi);
    });
  });
}

function teclaDe(midi) {
  // La tecla exacta; si no está en pantalla, la misma nota en otra octava.
  const exacta = $(`#teclado [data-midi="${midi}"]`);
  if (exacta) return exacta;
  const clase = claseNota(midi);
  return [...document.querySelectorAll('#teclado [data-midi]')]
    .find((t) => claseNota(Number(t.dataset.midi)) === clase);
}

function marcarTecla(midi, clase, ms = 450) {
  const t = teclaDe(midi);
  if (!t) return;
  t.classList.add(clase);
  setTimeout(() => t.classList.remove(clase), ms);
}

function iluminarObjetivo(midi) {
  document.querySelectorAll('#teclado .objetivo').forEach((t) => t.classList.remove('objetivo'));
  if (midi != null) teclaDe(midi)?.classList.add('objetivo');
}

// ================= Utilidades de la lección =================
const vistaDe = (l) => l.vista || 'circulo';
const mostrarNombreDe = (l) => l.mostrarNombre !== false;
const coloresDe = (l) => l.colores !== false;

function manoDe(leccion, midi) {
  if (leccion.mano === 'ambas') return midi < 60 ? 'izquierda' : 'derecha';
  return leccion.mano || 'derecha';
}

function dedoDe(leccion, midi, indice) {
  if (leccion.dedos) return leccion.dedos[indice];
  const tabla = manoDe(leccion, midi) === 'izquierda' ? DEDO_IZQUIERDA_POSICION_DO : DEDO_POSICION_DO;
  return tabla[claseNota(midi)];
}

function textoDedo(leccion, midi, indice) {
  if (leccion.tipo === 'buscar' && leccion.mano !== 'izquierda') return '';
  const dedo = dedoDe(leccion, midi, indice);
  const mano = manoDe(leccion, midi);
  const prefijo = leccion.mano === 'ambas' || mano === 'izquierda'
    ? (mano === 'izquierda' ? 'izq · ' : 'der · ')
    : '';
  if (!dedo) return prefijo ? prefijo.replace(' · ', '') : '';
  return `${prefijo}dedo ${dedo}`;
}

function esAcierto(leccion, tocada, objetivo) {
  if (claseNota(tocada) !== claseNota(objetivo)) return false;
  if (leccion.octavaEstricta) return tocada === objetivo;
  if (leccion.registro) return (tocada < 60) === (objetivo < 60);
  return true;
}

// Dibuja la nota pedida: círculo de color o nota en el pentagrama.
function mostrarObjetivo(midi, indice) {
  const j = estado.juego;
  const l = j.leccion;
  const enPentagrama = vistaDe(l) === 'pentagrama';
  $('#pentagrama').classList.toggle('oculto', !enPentagrama);
  $('#nota-objetivo').classList.toggle('oculto', enPentagrama);

  if (midi == null) {
    // Silencio (modo ritmo)
    if (enPentagrama) $('#pentagrama').innerHTML = pentagramaSVG(null, { clave: l.clave });
    else {
      $('#nota-objetivo').style.setProperty('--color', '#cbd5e1');
      $('#nota-nombre').textContent = '🤫';
      $('#nota-dedo').textContent = '';
    }
    return;
  }

  if (enPentagrama) {
    const pent = $('#pentagrama');
    pent.innerHTML = pentagramaSVG(midi, {
      clave: l.clave, colores: coloresDe(l), mostrarNombre: mostrarNombreDe(l),
    });
    pent.classList.remove('aparece');
    void pent.offsetWidth;
    pent.classList.add('aparece');
  } else {
    const circulo = $('#nota-objetivo');
    circulo.style.setProperty('--color', colorNota(midi));
    $('#nota-nombre').textContent = nombreNota(midi);
    $('#nota-dedo').textContent = textoDedo(l, midi, indice);
    circulo.classList.remove('aparece');
    void circulo.offsetWidth;
    circulo.classList.add('aparece');
  }
}

// ================= Juego =================
const TIPOS_JUEGO = ['atrapa', 'eco', 'carrera'];
const esMiniJuego = (l) => TIPOS_JUEGO.includes(l.tipo);

function generarObjetivos(leccion) {
  if (leccion.tipo === 'ritmo' || esMiniJuego(leccion)) return [];
  const notas = leccion.notas.map(notaAMidi);
  if (leccion.tipo === 'cancion') return notas;
  if (leccion.tipo === 'buscar') return Array(leccion.cantidad).fill(notas[0]);
  const lista = [];
  for (let i = 0; i < leccion.cantidad; i++) {
    let n;
    do { n = azar(notas); } while (notas.length > 1 && n === lista[lista.length - 1]);
    lista.push(n);
  }
  return lista;
}

async function empezarLeccion(id) {
  detenerRitmo();
  estado.juego?.minijuego?.detener();
  const leccion = buscarLeccion(id);
  estado.juego = {
    leccion,
    objetivos: generarObjetivos(leccion),
    indice: 0,
    errores: 0,
    erroresNota: 0,
    esperando: false,
    ritmo: null,
  };
  const j = estado.juego;
  const esRitmo = leccion.tipo === 'ritmo';
  const esJuego = esMiniJuego(leccion);

  $('#pantalla-juego').dataset.modo = leccion.tipo;
  $('#juego-titulo').textContent = `${leccion.emoji} ${leccion.titulo}`;
  $('#btn-escuchar').textContent = esRitmo ? '🔊 Escuchar el ritmo' : leccion.tipo === 'eco' ? '🔊 Otra vez' : '🔊 Escuchar';
  $('#pulso').classList.toggle('oculto', !esRitmo);
  $('#escenario').classList.toggle('oculto', !esJuego);
  $('#escenario').innerHTML = '';
  dibujarTeclado(leccion.teclado);
  iluminarObjetivo(null);
  globo('¡Hola!');

  if (esJuego) {
    $('#progreso-juego').innerHTML = '';
    $('#progreso-juego').className = 'progreso-juego';
    $('#nota-objetivo').classList.add('oculto');
    $('#pentagrama').classList.add('oculto');
    j.minijuego = crearJuego(leccion, apiJuego(j));
  } else if (esRitmo) {
    prepararRitmo();
    mostrarObjetivo(j.ritmo.eventos[0].midi, 0);
  } else {
    dibujarProgreso();
    mostrarObjetivo(j.objetivos[0], 0);
  }
  mostrar('pantalla-juego');

  if (leccion.consejo) {
    $('#consejo-texto').textContent = leccion.consejo;
    const dlg = $('#dialogo-consejo');
    dlg.showModal();
    await new Promise((r) => dlg.addEventListener('close', r, { once: true }));
  }
  if (estado.juego !== j) return;

  if (esJuego) {
    j.minijuego.iniciar();
    return;
  }

  if (esRitmo) {
    await decir('Primero escucha. Después te toca a ti.');
    if (estado.juego !== j) return;
    await correrRitmo(true);
    if (estado.juego !== j) return;
    globo('¡Ahora tú!');
    await decir('¡Ahora tú! Cuenta conmigo.');
    if (estado.juego !== j) return;
    await correrRitmo(false);
    return;
  }

  if (leccion.tipo === 'cancion') {
    await decir(vistaDe(leccion) === 'pentagrama'
      ? '¡Vamos a leer una canción!'
      : '¡Vamos a tocar una canción! Sigue los colores.');
  }
  presentarObjetivo();
}

// Lo que la app ofrece a los mini-juegos (js/juegos.js).
function apiJuego(j) {
  const activo = () => estado.juego === j;
  return {
    escenario: $('#escenario'),
    decir: (t) => (activo() ? decir(t) : Promise.resolve()),
    esperar,
    globo: (t) => { if (activo()) globo(t); },
    animarMascota: (c) => { if (activo()) animarMascota(c); },
    marcarTecla,
    iluminarObjetivo,
    mostrarObjetivo: (midi, i) => { if (activo()) mostrarObjetivo(midi, i); },
    sacudirObjetivo: () => sacudir($('#nota-objetivo')),
    esAcierto: (tocada, objetivo) => esAcierto(j.leccion, tocada, objetivo),
    contarError: () => { j.errores++; },
    chispas,
    escuchando: () => estado.detector.escuchando,
    pausado: () => estado.pausa,
    sonar: (tipo, midi, dur) => {
      if (!activo()) return 0;
      return tipo === 'exito' ? sonar(sonidoExito) : sonar(tocarNota, midi, dur);
    },
    terminar: (opciones) => { if (activo()) terminarLeccion(opciones); },
  };
}

function dibujarProgreso() {
  const j = estado.juego;
  const l = j.leccion;
  const cont = $('#progreso-juego');
  cont.innerHTML = '';
  cont.className = 'progreso-juego';
  j.objetivos.forEach((m, i) => {
    const el = document.createElement('div');
    if (l.tipo === 'cancion') {
      el.className = 'burbuja';
      el.style.setProperty('--color', coloresDe(l) ? colorNota(m) : '#64748b');
      el.textContent = mostrarNombreDe(l) ? nombreNota(m) : '♪';
      if (l.mano === 'ambas' && m < 60) el.classList.add('izq');
    } else {
      el.className = 'nenufar';
      if (i === j.indice) el.innerHTML = '<img src="img/rana.png" alt="">';
    }
    if (i < j.indice) el.classList.add('hecho');
    if (i === j.indice) el.classList.add('actual');
    cont.appendChild(el);
  });
}

function globo(texto) {
  $('#globo').textContent = texto;
}

function animarMascota(clase) {
  const m = $('#mascota-juego');
  m.classList.remove('feliz', 'animo');
  void m.getBoundingClientRect(); // reinicia la animación
  m.classList.add(clase);
}

async function presentarObjetivo() {
  const j = estado.juego;
  if (!j) return;
  const l = j.leccion;
  const midi = j.objetivos[j.indice];
  j.erroresNota = 0;
  j.esperando = false;

  mostrarObjetivo(midi, j.indice);
  dibujarProgreso();
  iluminarObjetivo(l.ayudaVisual ? midi : null);

  const nueva = j.indice === 0 || j.objetivos[j.indice - 1] !== midi;
  const nombre = mostrarNombreDe(l) ? nombreNota(midi) : null;

  if (l.tipo !== 'cancion') {
    globo(nombre ? `¡Toca ${nombre}!` : '¿Qué nota es?');
    if (nueva || l.tipo === 'buscar') {
      await decir(nombre ? `Toca ${nombre}` : 'Toca esta nota');
      if (estado.ajustes.notaReferencia && nueva) await esperar(sonar(tocarNota, midi));
    }
  } else {
    globo(vistaDe(l) === 'pentagrama' ? '¡Lee la canción!' : '¡Sigue la canción!');
  }

  if (estado.juego === j) j.esperando = true;
}

function objetivoVisible() {
  return $('#nota-objetivo').classList.contains('oculto') ? $('#pentagrama') : $('#nota-objetivo');
}

async function alRecibirNota(midi, frecuencia, origen, instante) {
  const j = estado.juego;
  if (!j || estado.pausa || !$('#pantalla-juego').classList.contains('activa')) return;
  if (j.leccion.tipo === 'ritmo') {
    notaEnRitmo(midi, origen, instante);
    return;
  }
  if (j.minijuego) {
    j.minijuego.nota(midi, origen);
    return;
  }
  if (!j.esperando) return;

  const l = j.leccion;
  const objetivo = j.objetivos[j.indice];

  if (esAcierto(l, midi, objetivo)) {
    j.esperando = false;
    marcarTecla(midi, 'acierto');
    animarMascota('feliz');
    chispas(objetivoVisible());
    globo(azar(FRASES_ACIERTO));
    j.indice++;

    if (j.indice >= j.objetivos.length) {
      await esperar(400);
      terminarLeccion();
      return;
    }
    if (l.tipo !== 'cancion') await esperar(sonar(sonidoExito));
    else await esperar(150);
    presentarObjetivo();
    return;
  }

  j.errores++;
  j.erroresNota++;
  marcarTecla(midi, 'error');
  animarMascota('animo');
  sacudir(objetivoVisible());

  // Nota correcta pero en la octava equivocada (la otra mano).
  const otraMano = claseNota(midi) === claseNota(objetivo);
  const nombreObj = nombreNota(objetivo);

  if (j.erroresNota === 3) {
    globo(`Mira la tecla que brilla: ${nombreObj}`);
    iluminarObjetivo(objetivo);
    j.esperando = false;
    await decir(`Busca ${nombreObj}. Mira la tecla que brilla.`);
    if (estado.ajustes.notaReferencia) await esperar(sonar(tocarNota, objetivo));
    if (estado.juego === j) j.esperando = true;
    return;
  }

  if (otraMano) {
    const texto = objetivo < 60 ? '¡Bien la nota! Pero más abajo, con la izquierda' : '¡Bien la nota! Pero más arriba, con la derecha';
    globo(texto);
    j.esperando = false;
    await decir(texto);
    if (estado.juego === j) j.esperando = true;
    return;
  }

  globo(l.tipo === 'cancion' ? '¡Casi! Busca la nota' : azar(FRASES_ERROR));
  if (j.erroresNota === 1 && l.tipo !== 'cancion') {
    j.esperando = false;
    await decir('¡Casi! Otra vez');
    if (estado.juego === j) j.esperando = true;
  }
}

function calcularEstrellas(errores, total) {
  if (errores <= 1) return 3;
  if (errores <= Math.ceil(total * 0.3)) return 2;
  return 1;
}

function totalNotas(j) {
  const l = j.leccion;
  if (l.tipo === 'ritmo') return j.ritmo.eventos.filter((e) => e.midi != null).length;
  if (l.tipo === 'atrapa') return l.cantidad;
  if (l.tipo === 'eco') return l.rondas.reduce((a, b) => a + b, 0);
  if (l.tipo === 'carrera') return l.meta;
  return j.objetivos.length;
}

// opciones (mini-juegos): { estrellas, titulo, frase }
function terminarLeccion(opciones = {}) {
  const j = estado.juego;
  j.minijuego?.detener();
  iluminarObjetivo(null);
  const estrellas = opciones.estrellas ?? calcularEstrellas(j.errores, totalNotas(j));
  const id = j.leccion.id;
  estado.progreso.estrellas[id] = Math.max(estrellasDe(id), estrellas);
  guardarProgreso(estado.progreso);

  $('#resultado-titulo').textContent = opciones.titulo
    || (estrellas === 3 ? '¡Perfecto!' : estrellas === 2 ? '¡Muy bien!' : '¡Lo lograste!');
  $('#resultado-estrellas').innerHTML = [1, 2, 3]
    .map((n, i) => `<span class="${n <= estrellas ? '' : 'apagada'}" style="animation-delay:${i * 0.25}s">⭐</span>`)
    .join('');
  mostrar('pantalla-resultado');
  confeti();
  sonar(sonidoFinal);
  const frase = estrellas === 3 ? '¡Perfecto! Tres estrellas' : `¡Muy bien! Ganaste ${estrellas} ${estrellas === 1 ? 'estrella' : 'estrellas'}`;
  decir(opciones.frase ? `${opciones.frase}. ${frase}` : frase);
}

// ================= Modo ritmo =================
const TOLERANCIA_MS = 350;    // qué tan antes o después se acepta una nota
const PERFECTO_MS = 150;
const LATENCIA_MIC_MS = 40;   // demora del micrófono del iPad en entregar el sonido (el golpe ya se mide aparte)
const CUENTA = 4;             // pulsos de cuenta antes de empezar

function prepararRitmo() {
  const j = estado.juego;
  let t = 0;
  const eventos = j.leccion.figuras.map(([nota, tiempos]) => {
    const e = { midi: nota ? notaAMidi(nota) : null, tiempos, inicio: t, estado: 'pendiente' };
    t += tiempos;
    return e;
  });
  j.ritmo = { eventos, total: t, corriendo: false, demo: false, nodos: [], actual: -1 };
  dibujarCarril();
}

function dibujarCarril() {
  const j = estado.juego;
  const l = j.leccion;
  const { eventos, total } = j.ritmo;
  const cont = $('#progreso-juego');
  cont.className = 'progreso-juego carril';
  cont.innerHTML = '';

  const pista = document.createElement('div');
  pista.className = 'pista';
  eventos.forEach((e, i) => {
    const b = document.createElement('div');
    b.className = 'bloque';
    b.dataset.i = i;
    b.style.flexGrow = e.tiempos;
    const color = e.midi == null ? '#94a3b8' : colorNota(e.midi);
    b.style.setProperty('--color', color);
    b.innerHTML = `${figuraSVG(e.tiempos, { color, silencio: e.midi == null })}
      <span>${e.midi == null || !mostrarNombreDe(l) ? '&nbsp;' : nombreNota(e.midi)}</span>`;
    if (Math.round(e.inicio) % 4 === 0 && e.inicio > 0) b.classList.add('compas');
    pista.appendChild(b);
  });
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.id = 'cursor-ritmo';
  pista.appendChild(cursor);
  cont.appendChild(pista);
  j.ritmo.total = total;
}

function estadoBloque(i, clase) {
  const b = $(`#progreso-juego .bloque[data-i="${i}"]`);
  if (!b) return;
  b.classList.remove('bien', 'perfecto', 'fallo', 'actual');
  if (clase) b.classList.add(clase);
}

function detenerRitmo() {
  const r = estado.juego?.ritmo;
  if (!r) return;
  r.corriendo = false;
  detenerTodo(r.nodos);
}

// Ejecuta el ritmo. demo = true: la app toca el ejemplo; false: evalúa al niño.
function correrRitmo(demo) {
  const j = estado.juego;
  const r = j.ritmo;
  const ctx = estado.ctx;
  if (!ctx) return Promise.resolve();
  detenerTodo(r.nodos);

  const beatMs = 60000 / j.leccion.tempo;
  r.beatMs = beatMs;
  r.demo = demo;
  r.corriendo = true;
  r.actual = -1;
  j.errores = 0;
  r.eventos.forEach((e, i) => { e.estado = 'pendiente'; estadoBloque(i, null); });

  // Programar clics y (en el ejemplo) las notas con el reloj de audio, que es preciso.
  const margen = 0.25;
  const ctxInicio = ctx.currentTime + margen;
  r.inicio = performance.now() + margen * 1000 + CUENTA * beatMs; // momento del primer pulso del ritmo
  const pulsosTotales = CUENTA + r.total;
  for (let k = 0; k < pulsosTotales; k++) {
    programarClic(ctx, ctxInicio + (k * beatMs) / 1000, k % 4 === 0, r.nodos);
  }
  if (demo) {
    for (const e of r.eventos) {
      if (e.midi == null) continue;
      const cuando = ctxInicio + ((CUENTA + e.inicio) * beatMs) / 1000;
      programarNota(ctx, e.midi, cuando, (e.tiempos * beatMs) / 1000 * 0.9, r.nodos);
    }
    estado.detector.silenciarHasta(r.inicio + r.total * beatMs + 600);
  }

  globo(demo ? 'Escucha...' : 'Prepárate...');
  const pulsos = [...document.querySelectorAll('#pulso span')];

  return new Promise((resolver) => {
    let ultimoPulso = null;
    const cuadro = () => {
      if (estado.juego !== j || !r.corriendo) { resolver(); return; }
      const ahora = performance.now();
      const t = (ahora - r.inicio) / beatMs; // pulsos desde el inicio (negativo = cuenta)

      // Luces del pulso
      const pulso = Math.floor(t + CUENTA);
      if (pulso !== ultimoPulso && pulso >= 0) {
        ultimoPulso = pulso;
        pulsos.forEach((p, i) => p.classList.toggle('activo', i === ((pulso % 4) + 4) % 4));
        if (t < 0) globo(String(pulso + 1));
        else if (pulso === CUENTA) globo(demo ? '♪ ♪ ♪' : '¡Ya!');
        $('#mascota-juego').classList.toggle('pulso-salto', pulso % 2 === 0);
      }

      // Cursor
      const cursor = $('#cursor-ritmo');
      if (cursor) cursor.style.left = `${Math.max(0, Math.min(1, t / r.total)) * 100}%`;

      // Nota actual (la próxima que hay que tocar)
      const actual = r.eventos.findIndex((e) => e.estado === 'pendiente' && (t - e.inicio) * beatMs <= TOLERANCIA_MS);
      if (actual !== r.actual) {
        if (r.actual >= 0 && r.eventos[r.actual].estado === 'pendiente') estadoBloque(r.actual, null);
        r.actual = actual;
        if (actual >= 0) {
          estadoBloque(actual, 'actual');
          const m = r.eventos[actual].midi;
          mostrarObjetivo(m, actual);
          iluminarObjetivo(demo || j.leccion.ayudaVisual !== false ? m : null);
        }
      }

      // Notas que pasaron sin tocarse
      if (!demo) {
        r.eventos.forEach((e, i) => {
          if (e.estado !== 'pendiente') return;
          if ((t - e.inicio) * beatMs > TOLERANCIA_MS) {
            if (e.midi == null) { e.estado = 'silencio'; estadoBloque(i, 'bien'); return; }
            e.estado = 'fallo';
            j.errores++;
            estadoBloque(i, 'fallo');
            animarMascota('animo');
            globo('¡Sigue! No te detengas');
          }
        });
      } else {
        r.eventos.forEach((e, i) => {
          if (e.estado === 'pendiente' && t >= e.inicio + e.tiempos) { e.estado = 'demo'; estadoBloque(i, null); }
        });
      }

      // ¿Terminó?
      if (t >= r.total + 0.3) {
        r.corriendo = false;
        pulsos.forEach((p) => p.classList.remove('activo'));
        iluminarObjetivo(null);
        resolver();
        if (!demo) setTimeout(() => { if (estado.juego === j) terminarLeccion(); }, 500);
        return;
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  });
}

function notaEnRitmo(midi, origen, instante = performance.now()) {
  const j = estado.juego;
  const r = j.ritmo;
  if (!r?.corriendo || r.demo) return;
  // "instante" es el momento del golpe de la tecla (no cuando terminó de reconocerse).
  const momento = instante - (origen === 'mic' ? LATENCIA_MIC_MS : 0);
  const t = (momento - r.inicio) / r.beatMs;

  // La nota pendiente más cercana en el tiempo
  let mejor = -1;
  let distancia = Infinity;
  r.eventos.forEach((e, i) => {
    if (e.estado !== 'pendiente' || e.midi == null) return;
    const d = Math.abs(t - e.inicio) * r.beatMs;
    if (d <= TOLERANCIA_MS && d < distancia) { mejor = i; distancia = d; }
  });
  if (mejor < 0) return; // tocó fuera de tiempo: no se cuenta

  const e = r.eventos[mejor];
  if (esAcierto(j.leccion, midi, e.midi)) {
    e.estado = distancia <= PERFECTO_MS ? 'perfecto' : 'bien';
    estadoBloque(mejor, e.estado);
    marcarTecla(midi, 'acierto');
    animarMascota('feliz');
    if (e.estado === 'perfecto') chispas($(`#progreso-juego .bloque[data-i="${mejor}"]`));
    globo(e.estado === 'perfecto' ? '¡Justo a tiempo!' : azar(FRASES_ACIERTO));
  } else {
    e.estado = 'fallo';
    j.errores++;
    estadoBloque(mejor, 'fallo');
    marcarTecla(midi, 'error');
    animarMascota('animo');
    globo(`Era ${nombreNota(e.midi)}`);
  }
}

estado.detector.onNota = (midi, frecuencia, origen, instante) => alRecibirNota(midi, frecuencia, origen, instante);

// Indicador de escucha: el aro de Ranita se pone verde y crece con el sonido del piano;
// mientras ella habla o suena algo, se pone gris (así el niño sabe que debe esperar).
let escuchabaAntes = null;
estado.detector.onNivel = (info) => {
  const { rms, umbral, frecuencia, claridad, midi, cents, escuchando } = info;
  const nivel = Math.min(1, rms / (umbral * 8));
  $('#medidor-nivel').style.width = `${Math.round(nivel * 100)}%`;
  const pantalla = $('#pantalla-juego');
  pantalla.style.setProperty('--nivel', nivel.toFixed(3));
  if (escuchando !== escuchabaAntes) {
    escuchabaAntes = escuchando;
    pantalla.classList.toggle('escuchando', escuchando);
    pantalla.classList.toggle('hablando', !escuchando);
    $('#oreja').classList.toggle('esperando', !escuchando);
    $('#oreja-icono').textContent = escuchando ? '👂' : '💬';
  }
  if (estado.ajustes.mostrarDetector) {
    $('#detector-texto').textContent = midi != null
      ? `Escucho: ${nombreConOctava(midi)} · ${frecuencia.toFixed(0)} Hz · ${cents >= 0 ? '+' : ''}${cents} cents · claridad ${claridad.toFixed(2)}`
      : `volumen ${rms.toFixed(3)} · umbral ${umbral.toFixed(3)} · afinación del piano ${info.desvio >= 0 ? '+' : ''}${info.desvio} cents`;
  }
};

// ================= Botones del juego =================
function volverAlMapa() {
  detenerRitmo();
  estado.juego?.minijuego?.detener();
  estado.juego = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  dibujarMapa();
  mostrar('pantalla-mapa');
}

// Un toque sin querer en 🏠 no debe borrar lo avanzado: se pregunta con dibujos grandes.
$('#btn-volver').addEventListener('click', () => {
  const j = estado.juego;
  const avanzado = j && (j.indice > 0 || j.ritmo?.corriendo || j.minijuego);
  if (!avanzado) { volverAlMapa(); return; }
  const dlg = $('#dialogo-salir');
  dlg.returnValue = '';
  estado.pausa = true;   // las moscas y el caracol esperan
  dlg.showModal();
  dlg.addEventListener('close', () => {
    estado.pausa = false;
    if (dlg.returnValue === 'salir') volverAlMapa();
  }, { once: true });
});

$('#btn-escuchar').addEventListener('click', async () => {
  const j = estado.juego;
  if (!j) return;
  if (j.minijuego) {
    j.minijuego.escuchar();
    return;
  }
  if (j.leccion.tipo === 'ritmo') {
    if (j.ritmo.corriendo) return;
    await correrRitmo(true);
    if (estado.juego !== j) return;
    await decir('¡Ahora tú!');
    if (estado.juego === j) correrRitmo(false);
    return;
  }
  const midi = j.objetivos[j.indice];
  if (midi != null) sonar(tocarNota, midi);
});

$('#btn-repetir').addEventListener('click', () => empezarLeccion(estado.juego.leccion.id));
$('#btn-mapa').addEventListener('click', volverAlMapa);

// ================= Ajustes =================
function umbralDesdeSensibilidad(s) {
  return 0.05 * Math.pow(0.7, s - 1); // 1 → 0.05 (poco sensible), 10 → 0.002 (muy sensible)
}

function aplicarAjustesDetector() {
  estado.detector.umbralRms = umbralDesdeSensibilidad(estado.ajustes.sensibilidad);
  if (!estado.ajustes.mostrarDetector) $('#detector-texto').textContent = '';
}

// Puerta para padres: hay que mantener presionado ⚙️ un segundo y medio.
// Un toque corto (un niño curioso) solo muestra un aviso.
const PUERTA_MS = 1500;
let temporizadorPuerta = null;
const botonAjustes = $('#btn-ajustes');
function soltarPuerta() {
  clearTimeout(temporizadorPuerta);
  temporizadorPuerta = null;
  botonAjustes.classList.remove('cargando');
}
botonAjustes.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  botonAjustes.classList.add('cargando');
  temporizadorPuerta = setTimeout(() => {
    soltarPuerta();
    abrirAjustes();
  }, PUERTA_MS);
});
botonAjustes.addEventListener('pointerup', () => {
  if (temporizadorPuerta) {
    const aviso = $('#ayuda-padres');
    aviso.classList.add('visible');
    setTimeout(() => aviso.classList.remove('visible'), 2200);
  }
  soltarPuerta();
});
botonAjustes.addEventListener('pointerleave', soltarPuerta);
botonAjustes.addEventListener('pointercancel', soltarPuerta);
botonAjustes.addEventListener('contextmenu', (e) => e.preventDefault());
botonAjustes.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') abrirAjustes(); });

function abrirAjustes() {
  const a = estado.ajustes;
  $('#aj-voz').checked = a.voz;
  $('#aj-referencia').checked = a.notaReferencia;
  $('#aj-teclado').checked = a.tecladoPantalla;
  $('#aj-detector').checked = a.mostrarDetector;
  $('#aj-desbloquear').checked = a.desbloquearTodo;
  $('#aj-sensibilidad').value = a.sensibilidad;
  $('#aj-sens-valor').textContent = a.sensibilidad;
  $('#dialogo-ajustes').showModal();
}

$('#aj-sensibilidad').addEventListener('input', (e) => {
  $('#aj-sens-valor').textContent = e.target.value;
});

$('#dialogo-ajustes').addEventListener('close', async () => {
  const a = estado.ajustes;
  a.voz = $('#aj-voz').checked;
  a.notaReferencia = $('#aj-referencia').checked;
  a.tecladoPantalla = $('#aj-teclado').checked;
  a.mostrarDetector = $('#aj-detector').checked;
  a.desbloquearTodo = $('#aj-desbloquear').checked;
  a.sensibilidad = Number($('#aj-sensibilidad').value);
  guardarAjustes(a);
  aplicarAjustesDetector();
  if ($('#pantalla-mapa').classList.contains('activa')) dibujarMapa();

  // Si apagan el teclado de pantalla y el micrófono aún no está activo, se activa ahora.
  if (!a.tecladoPantalla && !estado.micListo && estado.ctx) {
    try {
      await estado.detector.iniciar(estado.ctx);
      estado.micListo = true;
    } catch {
      alert('No pude usar el micrófono. Revisa los permisos del navegador.');
    }
  }
});

$('#btn-borrar-progreso').addEventListener('click', () => {
  if (confirm('¿Borrar todas las estrellas y empezar de cero?')) {
    estado.progreso = { estrellas: {} };
    guardarProgreso(estado.progreso);
    dibujarMapa();
  }
});

// ================= PWA =================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
