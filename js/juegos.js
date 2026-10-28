// Mini-juegos del Parque de Ranita: atrapa moscas, eco y carrera.
// Cada juego recibe "api" con las funciones de la app (hablar, sonar, globo, etc.)
// y devuelve un objeto con: iniciar(), nota(midi), escuchar(), detener().
import { nombreNota, colorNota, notaAMidi, claseNota } from './notas.js';
import { pentagramaSVG } from './pentagrama.js';
import { dinamica, articulacion } from './expresion.js';

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Lista de notas al azar, sin repetir la misma dos veces seguidas.
function sorteo(notas, cantidad) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    let n;
    do { n = azar(notas); } while (notas.length > 1 && n === lista[lista.length - 1]);
    lista.push(n);
  }
  return lista;
}

function etiquetaNota(midi, leccion) {
  if (leccion.vista === 'pentagrama') {
    return `<div class="mini-pentagrama">${pentagramaSVG(midi, {
      clave: leccion.clave, colores: leccion.colores !== false, mostrarNombre: leccion.mostrarNombre !== false,
    })}</div>`;
  }
  const nombre = leccion.mostrarNombre === false ? '♪' : nombreNota(midi);
  return `<span class="nota-mosca" style="--color:${colorNota(midi)}">${nombre}</span>`;
}

export function crearJuego(leccion, api) {
  if (leccion.tipo === 'atrapa') return atrapaMoscas(leccion, api);
  if (leccion.tipo === 'eco') return eco(leccion, api);
  if (leccion.tipo === 'carrera') return carrera(leccion, api);
  if (leccion.tipo === 'dinamica') return dinamica(leccion, api);
  if (leccion.tipo === 'articulacion') return articulacion(leccion, api);
  throw new Error('Juego desconocido: ' + leccion.tipo);
}

// ───────────────────────── ATRAPA MOSCAS ─────────────────────────
function atrapaMoscas(leccion, api) {
  const notas = leccion.notas.map(notaAMidi);
  const lista = sorteo(notas, leccion.cantidad);
  const esc = api.escenario;
  let indice = 0;
  let atrapadas = 0;
  let mosca = null;     // { midi, el, progreso, estado }
  let vivo = true;
  let ultimo = 0;
  let erroresMosca = 0;

  esc.innerHTML = `
    <div class="charca">
      <img class="rana-cazadora" src="img/rana.png" alt="">
      <div class="lengua"></div>
      <div class="contador-moscas"><span>🪰</span> <b>0</b> / ${lista.length}</div>
    </div>`;
  const charca = esc.querySelector('.charca');
  const lengua = esc.querySelector('.lengua');
  const rana = esc.querySelector('.rana-cazadora');

  function soltarMosca() {
    if (!vivo) return;
    if (indice >= lista.length) {
      api.terminar();
      return;
    }
    const midi = lista[indice];
    erroresMosca = 0;
    const el = document.createElement('div');
    el.className = 'mosca';
    el.innerHTML = `<span class="alas">🪰</span>${etiquetaNota(midi, leccion)}`;
    charca.appendChild(el);
    mosca = { midi, el, progreso: 0, estado: 'vuela', fase: Math.random() * 6 };
    api.iluminarObjetivo(leccion.ayudaVisual ? midi : null);
    api.globo(leccion.mostrarNombre === false ? '¡Atrápala!' : `¡Atrapa ${nombreNota(midi)}!`);
    if (indice < 2 && leccion.mostrarNombre !== false) api.decir(nombreNota(midi), { menor: true });
    ultimo = performance.now();
    requestAnimationFrame(volar);
  }

  function volar(ahora) {
    if (!vivo || !mosca || mosca.estado !== 'vuela') return;
    const dt = ahora - ultimo;
    ultimo = ahora;
    // La mosca se detiene mientras Ranita habla o suena algo (así no se escapa injustamente).
    if (api.escuchando() && !api.pausado()) mosca.progreso += dt / leccion.velocidad;
    const p = Math.min(1, mosca.progreso);
    const x = 100 - p * 72;                              // de la derecha hasta cerca de Ranita
    const y = 38 + Math.sin(p * 9 + mosca.fase) * 16;     // vuelo ondulado
    mosca.el.style.left = `${x}%`;
    mosca.el.style.top = `${y}%`;
    if (p >= 1) {
      escapar();
      return;
    }
    requestAnimationFrame(volar);
  }

  function escapar() {
    const m = mosca;
    m.estado = 'escapa';
    m.el.classList.add('escapa');
    api.contarError();
    api.animarMascota('animo');
    api.globo('¡Se escapó! Atrapa la próxima');
    setTimeout(() => m.el.remove(), 900);
    indice++;
    setTimeout(soltarMosca, 1000);
  }

  function atrapar() {
    const m = mosca;
    m.estado = 'atrapada';
    // La lengua sale desde la boca de Ranita hasta la mosca.
    const c = charca.getBoundingClientRect();
    const r = rana.getBoundingClientRect();
    const f = m.el.getBoundingClientRect();
    const x0 = r.left + r.width * 0.55 - c.left;
    const y0 = r.top + r.height * 0.5 - c.top;
    const x1 = f.left + f.width / 2 - c.left;
    const y1 = f.top + f.height / 2 - c.top;
    const largo = Math.hypot(x1 - x0, y1 - y0);
    lengua.style.left = `${x0}px`;
    lengua.style.top = `${y0}px`;
    lengua.style.width = `${largo}px`;
    lengua.style.transform = `rotate(${Math.atan2(y1 - y0, x1 - x0)}rad)`;
    lengua.classList.remove('sale');
    void lengua.offsetWidth;
    lengua.classList.add('sale');
    rana.classList.remove('come');
    void rana.offsetWidth;
    rana.classList.add('come');
    setTimeout(() => {
      m.el.style.left = `${((x0 / c.width) * 100).toFixed(1)}%`;
      m.el.style.top = `${((y0 / c.height) * 100).toFixed(1)}%`;
      m.el.classList.add('atrapada');
    }, 140);
    setTimeout(() => m.el.remove(), 600);

    atrapadas++;
    esc.querySelector('.contador-moscas b').textContent = atrapadas;
    api.chispas(m.el);
    api.globo(azar(['¡Ñam!', '¡Rica!', '¡Atrapada!', '¡Bien hecho!']));
    api.sonar('exito');
    indice++;
    setTimeout(soltarMosca, 900);
  }

  return {
    iniciar() {
      api.globo('¡Toca la nota de cada mosca!');
      api.decir('¡Toca la nota de cada mosca y la atrapo!').then(() => setTimeout(soltarMosca, 300));
    },
    nota(midi) {
      if (!mosca || mosca.estado !== 'vuela') return;
      if (api.esAcierto(midi, mosca.midi)) {
        api.marcarTecla(midi, 'acierto');
        atrapar();
      } else {
        api.marcarTecla(midi, 'error');
        api.contarError();
        erroresMosca++;
        mosca.el.classList.remove('esquiva');
        void mosca.el.offsetWidth;
        mosca.el.classList.add('esquiva');
        api.globo(erroresMosca >= 2 ? `Busca ${nombreNota(mosca.midi)}, la tecla que brilla` : '¡Esa no! Otra vez');
        if (erroresMosca >= 2) api.iluminarObjetivo(mosca.midi);
      }
    },
    escuchar() {
      if (mosca?.estado === 'vuela') api.sonar('nota', mosca.midi);
    },
    detener() { vivo = false; },
  };
}

// ───────────────────────── ECO ─────────────────────────
function eco(leccion, api) {
  const notas = leccion.notas.map(notaAMidi);
  const esc = api.escenario;
  let ronda = 0;
  let secuencia = [];
  let pos = 0;
  let turno = 'ranita';   // 'ranita' (toca ella) | 'nino'
  let fallosRonda = 0;
  let vivo = true;

  esc.innerHTML = `
    <div class="eco">
      <div class="eco-fila"></div>
      <div class="eco-rondas">${leccion.rondas.map(() => '<span></span>').join('')}</div>
    </div>`;
  const fila = esc.querySelector('.eco-fila');

  function dibujarCirculos() {
    fila.innerHTML = secuencia.map(() => '<div class="eco-nota"><span></span></div>').join('');
  }

  function pintar(i, midi, clase) {
    const c = fila.children[i];
    if (!c) return;
    const mostrar = !leccion.soloOido || clase === 'hecha';
    c.style.setProperty('--color', mostrar ? colorNota(midi) : '#a78bfa');
    c.querySelector('span').textContent = mostrar ? nombreNota(midi) : '♪';
    c.classList.remove('suena', 'hecha', 'mal');
    void c.offsetWidth;
    c.classList.add(clase);
  }

  async function tocarSecuencia() {
    turno = 'ranita';
    dibujarCirculos();
    api.globo('Escucha...');
    api.animarMascota('feliz');
    await api.esperar(500);
    for (let i = 0; i < secuencia.length; i++) {
      if (!vivo) return;
      pintar(i, secuencia[i], 'suena');
      api.marcarTecla(secuencia[i], 'objetivo', 600);
      await api.esperar(api.sonar('nota', secuencia[i], 0.6) + 120);
    }
    if (!vivo) return;
    // Después de dos intentos fallidos, la ayuda: los colores se quedan a la vista.
    dibujarCirculos();
    if (fallosRonda >= 2) secuencia.forEach((m, i) => pintar(i, m, 'pista'));
    pos = 0;
    turno = 'nino';
    api.globo('¡Tu turno!');
  }

  async function nuevaRonda() {
    if (!vivo) return;
    if (ronda >= leccion.rondas.length) {
      api.terminar();
      return;
    }
    secuencia = sorteo(notas, leccion.rondas[ronda]);
    fallosRonda = 0;
    esc.querySelectorAll('.eco-rondas span').forEach((s, i) => s.classList.toggle('actual', i === ronda));
    await tocarSecuencia();
  }

  return {
    async iniciar() {
      api.globo('¡Repite lo que toco!');
      await api.decir('Yo toco y tú repites. ¡Escucha bien!');
      nuevaRonda();
    },
    async nota(midi) {
      if (turno !== 'nino') return;
      const esperada = secuencia[pos];
      if (api.esAcierto(midi, esperada)) {
        api.marcarTecla(midi, 'acierto');
        pintar(pos, esperada, 'hecha');
        pos++;
        if (pos >= secuencia.length) {
          turno = 'ranita';
          esc.querySelectorAll('.eco-rondas span')[ronda]?.classList.add('hecha');
          api.chispas(fila);
          api.animarMascota('feliz');
          api.globo(azar(['¡Igualito!', '¡Qué buen oído!', '¡Perfecto!']));
          await api.esperar(api.sonar('exito') + 300);
          ronda++;
          nuevaRonda();
        }
        return;
      }
      // Error: se vuelve a escuchar la misma ronda.
      turno = 'ranita';
      api.marcarTecla(midi, 'error');
      api.contarError();
      pintar(pos, midi, 'mal');
      fallosRonda++;
      api.animarMascota('animo');
      api.globo('¡Casi! Escucha otra vez');
      await api.decir('¡Casi! Escucha otra vez');
      await api.esperar(300);
      if (vivo) tocarSecuencia();
    },
    escuchar() {
      if (turno === 'nino') tocarSecuencia();
    },
    detener() { vivo = false; },
  };
}

// ───────────────────────── CARRERA ─────────────────────────
function carrera(leccion, api) {
  const notas = leccion.notas.map(notaAMidi);
  const esc = api.escenario;
  let saltos = 0;
  let objetivo = null;
  let corriendo = false;
  let vivo = true;
  let tiempoCaracol = 0;   // ms que lleva corriendo el caracol
  let ultimo = 0;

  esc.innerHTML = `
    <div class="carrera">
      <div class="carril carril-rana"><img class="corredor rana-corre" src="img/rana.png" alt=""></div>
      <div class="carril carril-caracol"><span class="corredor caracol">🐌</span></div>
      <div class="meta" aria-hidden="true"></div>
    </div>`;
  const ranaEl = esc.querySelector('.rana-corre');
  const caracolEl = esc.querySelector('.caracol');

  function siguienteNota() {
    let n;
    do { n = azar(notas); } while (notas.length > 1 && n === objetivo);
    objetivo = n;
    api.mostrarObjetivo(objetivo, saltos);
    api.iluminarObjetivo(leccion.ayudaVisual ? objetivo : null);
  }

  function mover() {
    ranaEl.style.left = `${(saltos / leccion.meta) * 88}%`;
  }

  function cuadro(ahora) {
    if (!vivo || !corriendo) return;
    if (!api.pausado()) tiempoCaracol += ahora - ultimo;
    ultimo = ahora;
    const p = Math.min(1, tiempoCaracol / (leccion.tiempo * 1000));
    caracolEl.style.left = `${p * 88}%`;
    if (p >= 1) {
      fin(false);
      return;
    }
    requestAnimationFrame(cuadro);
  }

  function fin(gano) {
    corriendo = false;
    api.iluminarObjetivo(null);
    const sobra = 1 - tiempoCaracol / (leccion.tiempo * 1000);
    const estrellas = gano ? (sobra >= 0.3 ? 3 : 2) : 1;
    if (gano) api.chispas(ranaEl);
    api.terminar({
      estrellas,
      titulo: gano ? '¡Le ganaste al caracol!' : '¡Casi! Ganó el caracol',
      frase: gano ? '¡Ganaste la carrera!' : '¡Casi le ganas al caracol! Otra vez, tú puedes',
    });
  }

  return {
    async iniciar() {
      api.globo('¡Gánale al caracol!');
      await api.decir('Cada nota correcta es un salto. ¡Gánale al caracol!');
      for (const n of ['3', '2', '1']) {
        if (!vivo) return;
        api.globo(n);
        await api.esperar(700);
      }
      if (!vivo) return;
      api.globo('¡Ya!');
      siguienteNota();
      corriendo = true;
      ultimo = performance.now();
      requestAnimationFrame(cuadro);
    },
    nota(midi) {
      if (!corriendo) return;
      if (api.esAcierto(midi, objetivo)) {
        api.marcarTecla(midi, 'acierto');
        saltos++;
        mover();
        ranaEl.classList.remove('salta');
        void ranaEl.offsetWidth;
        ranaEl.classList.add('salta');
        if (saltos >= leccion.meta) {
          fin(true);
          return;
        }
        api.globo(azar(['¡Salta!', '¡Rápido!', '¡Bien!', '¡Vamos!']));
        siguienteNota();
      } else {
        api.marcarTecla(midi, 'error');
        api.contarError();
        api.animarMascota('animo');
        api.globo(`¡Esa no! Busca ${nombreNota(objetivo)}`);
        if (claseNota(midi) !== claseNota(objetivo)) api.sacudirObjetivo();
      }
    },
    escuchar() {
      if (corriendo && objetivo != null) api.sonar('nota', objetivo);
    },
    detener() { vivo = false; corriendo = false; },
  };
}
