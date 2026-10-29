// Lecciones de expresión: fuerte y suave (dinámica) y picado, largo y ligado (articulación).
// Usan la fuerza y la duración de cada nota que entrega el detector.
import { nombreNota, colorNota, notaAMidi } from './notas.js';

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Límites de duración (ms). Se pueden ajustar si en el iPad no coinciden con lo que se toca.
export const CORTA_MS = 350;   // picado: soltar antes de esto
export const LARGA_MS = 1000;  // larga: mantener al menos esto
const LIGADO_MS = 150;         // ligado: como máximo este silencio entre dos notas

function circuloObjetivo() {
  return `
    <div class="exp-objetivo">
      <svg class="exp-anillo" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46"/></svg>
      <div class="exp-circulo"><span class="exp-nombre"></span><span class="exp-marca"></span></div>
      <span class="exp-etiqueta"></span>
    </div>`;
}

function nenufares(n) {
  return `<div class="exp-progreso">${Array.from({ length: n }, () => '<i></i>').join('')}</div>`;
}

function marcarProgreso(esc, i, clase) {
  const p = esc.querySelectorAll('.exp-progreso i')[i];
  if (p) p.className = clase;
}

// ───────────────────────── FUERTE Y SUAVE ─────────────────────────
export function dinamica(leccion, api) {
  const esc = api.escenario;
  const lista = leccion.secuencia
    ? leccion.secuencia.map(([n, d]) => [notaAMidi(n), d])
    : sorteoDinamica(leccion.notas.map(notaAMidi), leccion.cantidad);
  const clave = api.esPantalla() ? 'pantalla' : 'mic';
  const memoria = api.memoria;
  let fase = memoria.fuerza?.[clave] ? 'juego' : 'fuerte';
  let calib = {};
  let indice = 0;
  let fallos = 0;
  let anterior = null;   // fuerza de la última nota bien tocada (para crescendo y diminuendo)
  let ocupado = false;
  let vivo = true;

  esc.innerHTML = `
    <div class="expresion">
      ${circuloObjetivo()}
      <div class="medidor-fuerza" aria-hidden="true">
        <span>🐭</span>
        <div class="barra-fuerza"><div class="linea-fuerza"></div><div class="marcador-fuerza"></div></div>
        <span>🦁</span>
      </div>
      ${nenufares(lista.length)}
      ${api.esPantalla() ? '<p class="exp-pista">En la pantalla: abajo en la tecla = fuerte · arriba = suave</p>' : ''}
    </div>`;
  const circulo = esc.querySelector('.exp-circulo');
  const marcador = esc.querySelector('.marcador-fuerza');
  const linea = esc.querySelector('.linea-fuerza');

  // Escala logarítmica entre la fuerza suave y la fuerte (para el medidor).
  function posicion(fuerza) {
    const c = memoria.fuerza?.[clave];
    if (!c) return 0.5;
    const lo = Math.log(c.suave * 0.5);
    const hi = Math.log(c.fuerte * 1.6);
    return Math.max(0, Math.min(1, (Math.log(Math.max(fuerza, 1e-6)) - lo) / (hi - lo)));
  }

  function mostrarMedidor(fuerza) {
    marcador.style.left = `${(posicion(fuerza) * 100).toFixed(1)}%`;
    marcador.classList.remove('salta');
    void marcador.offsetWidth;
    marcador.classList.add('salta');
  }

  function dibujar(midi, din, etiqueta) {
    circulo.style.setProperty('--color', colorNota(midi));
    circulo.classList.toggle('fuerte', din === 'f');
    circulo.classList.toggle('suave', din === 'p');
    circulo.classList.toggle('crece', din === '<');
    circulo.classList.toggle('decrece', din === '>');
    esc.querySelector('.exp-nombre').textContent = nombreNota(midi);
    esc.querySelector('.exp-marca').textContent = din;
    esc.querySelector('.exp-etiqueta').textContent = etiqueta;
    circulo.classList.remove('aparece');
    void circulo.offsetWidth;
    circulo.classList.add('aparece');
    api.iluminarObjetivo(midi);
  }

  async function presentar() {
    if (!vivo) return;
    const c = memoria.fuerza?.[clave];
    if (c) linea.style.left = `${(posicion(c.umbral) * 100).toFixed(1)}%`;
    if (fase === 'fuerte') {
      dibujar(60, 'f', '🦁 ¡FUERTE!');
      api.globo('Toca Do muy fuerte, como un león');
      await api.decir('Primero conozco tu piano. Toca Do muy fuerte, como un león.');
      return;
    }
    if (fase === 'suave') {
      dibujar(60, 'p', '🐭 suavecito');
      api.globo('Ahora muy suave, como un ratoncito');
      await api.decir('Ahora muy suave, como un ratoncito.');
      return;
    }
    if (indice >= lista.length) {
      api.terminar();
      return;
    }
    const [midi, din] = lista[indice];
    fallos = 0;
    marcarProgreso(esc, indice, 'actual');
    const ETIQUETAS = { f: '🦁 fuerte', p: '🐭 suave', '<': '📈 un poco más fuerte', '>': '📉 un poco más suave' };
    dibujar(midi, din, ETIQUETAS[din]);
    api.globo(`${nombreNota(midi)}: ${ETIQUETAS[din].slice(3)}`);
  }

  async function calibrar(fuerza) {
    mostrarMedidor(fuerza);
    if (fase === 'fuerte') {
      calib.fuerte = fuerza;
      fase = 'suave';
      api.animarMascota('feliz');
      api.globo('¡Qué fuerte! 🦁');
      await api.esperar(700);
      presentar();
      return;
    }
    calib.suave = fuerza;
    if (calib.fuerte < calib.suave * 1.6) {
      // No hubo suficiente diferencia: se vuelve a intentar.
      fase = 'fuerte';
      calib = {};
      api.animarMascota('animo');
      api.globo('¡Casi no se nota la diferencia! Otra vez');
      await api.decir('Casi no se nota la diferencia. Probemos otra vez, con más fuerza el león y más suave el ratón.');
      presentar();
      return;
    }
    memoria.fuerza = memoria.fuerza || {};
    memoria.fuerza[clave] = { ...calib, umbral: Math.sqrt(calib.fuerte * calib.suave) };
    fase = 'juego';
    api.chispas(circulo);
    api.globo('¡Listo! Ya conozco tu piano');
    await api.decir('¡Listo! Ahora mira la letra: f es fuerte y p es suave.');
    presentar();
  }

  return {
    iniciar() { presentar(); },
    async nota(midi, origen, fuerza) {
      if (!vivo || ocupado) return;
      if (fase !== 'juego') {
        ocupado = true;
        await calibrar(fuerza);
        ocupado = false;
        return;
      }
      const [objetivo, din] = lista[indice] || [];
      if (objetivo == null) return;
      mostrarMedidor(fuerza);
      if (!api.esAcierto(midi, objetivo)) {
        api.marcarTecla(midi, 'error');
        api.contarError();
        api.globo(`Esa no: busca ${nombreNota(objetivo)}`);
        return;
      }
      const { umbral } = memoria.fuerza[clave];
      // f / p: comparado con la mitad entre fuerte y suave.
      // < / > (crescendo / diminuendo): comparado con la nota anterior.
      const cumple = din === 'f' ? fuerza >= umbral
        : din === 'p' ? fuerza < umbral
          : din === '<' ? anterior == null || fuerza > anterior * 1.12
            : anterior == null || fuerza < anterior / 1.12;
      if (cumple) {
        anterior = fuerza;
        api.marcarTecla(midi, 'acierto');
        api.animarMascota('feliz');
        api.chispas(circulo);
        api.globo(din === 'f' ? azar(['¡Rugió el león! 🦁', '¡Fuerte!', '¡Muy bien!']) : azar(['¡Shhh, perfecto! 🐭', '¡Suavecito!', '¡Muy bien!']));
        marcarProgreso(esc, indice, 'hecho');
        indice++;
        ocupado = true;
        await api.esperar(550);
        ocupado = false;
        presentar();
        return;
      }
      api.contarError();
      fallos++;
      api.marcarTecla(midi, 'error');
      api.animarMascota('animo');
      api.sacudir(circulo);
      const texto = din === 'f' ? '¡Bien la nota! Pero más fuerte, como un león'
        : din === 'p' ? '¡Bien la nota! Pero más suave, como un ratón'
          : din === '<' ? '¡Un poquito más fuerte que la anterior!' : '¡Un poquito más suave que la anterior!';
      api.globo(texto);
      if (fallos >= 3) {
        // Para no frustrar: después de tres intentos se sigue adelante.
        marcarProgreso(esc, indice, 'mal');
        indice++;
        ocupado = true;
        await api.esperar(900);
        ocupado = false;
        presentar();
      } else if (fallos === 1) {
        ocupado = true;
        await api.decir(texto, { menor: true });
        ocupado = false;
      }
    },
    fin() {},
    escuchar() {
      const actual = fase === 'juego' ? lista[indice]?.[0] : 60;
      if (actual != null) api.sonar('nota', actual);
    },
    detener() { vivo = false; },
  };
}

function sorteoDinamica(notas, cantidad) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    const anterior = lista[i - 1];
    const dosIguales = i >= 2 && lista[i - 1][1] === lista[i - 2][1];
    const din = dosIguales ? (lista[i - 1][1] === 'f' ? 'p' : 'f') : azar(['f', 'p']);
    let midi;
    do { midi = azar(notas); } while (notas.length > 1 && anterior && midi === anterior[0] && din === anterior[1]);
    lista.push([midi, din]);
  }
  return lista;
}

// ───────────────────────── PICADO, LARGO Y LIGADO ─────────────────────────
const MARCAS = {
  corta: { simbolo: '•', etiqueta: '🏀 ¡salta!', globo: '¡Corta! Toca y suelta' },
  larga: { simbolo: '—', etiqueta: '🐍 ¡mantén!', globo: '¡Larga! Mantén hasta llenar el círculo' },
  ligada: { simbolo: '⌒', etiqueta: '🐛 pegadito', globo: 'Pegadito a la siguiente' },
};

export function articulacion(leccion, api) {
  const esc = api.escenario;
  const enCancion = !!leccion.secuencia;
  const lista = enCancion
    ? leccion.secuencia.map(([n, a]) => [notaAMidi(n), a])
    : sorteoArticulacion(leccion.notas.map(notaAMidi), leccion.cantidad, leccion.modo);
  let indice = 0;
  let pendiente = null;      // nota correcta que se está tocando: { i, midi, art, inicio, juzgada }
  let esperaLigado = null;   // nota ligada que se soltó antes: { i, fin }
  let intentos = 0;
  let vivo = true;

  esc.innerHTML = `
    <div class="expresion">
      ${circuloObjetivo()}
      <div class="exp-cancion">${lista.map(([m, a], i) => `
        <span class="exp-burbuja ${a}" data-i="${i}" style="--color:${colorNota(m)}">${nombreNota(m)}</span>`).join('')}
      </div>
    </div>`;
  const circulo = esc.querySelector('.exp-circulo');
  const anillo = esc.querySelector('.exp-anillo circle');
  const burbujas = [...esc.querySelectorAll('.exp-burbuja')];

  function marcarBurbuja(i, clase) {
    const b = burbujas[i];
    if (!b) return;
    b.classList.remove('actual', 'bien', 'mal');
    if (clase) b.classList.add(clase);
  }

  function llenarAnillo(fraccion) {
    anillo.style.strokeDashoffset = String(289 * (1 - Math.max(0, Math.min(1, fraccion))));
  }

  // conservarGlobo: deja a la vista el mensaje anterior (por ejemplo, "¡Más cortita!").
  function presentar(conservarGlobo = false) {
    if (!vivo) return;
    if (indice >= lista.length) {
      if (!pendiente && !esperaLigado) setTimeout(() => { if (vivo) api.terminar(); }, 600);
      return;
    }
    const [midi, art] = lista[indice];
    const m = MARCAS[art];
    circulo.style.setProperty('--color', colorNota(midi));
    circulo.dataset.art = art;
    esc.querySelector('.exp-nombre').textContent = nombreNota(midi);
    esc.querySelector('.exp-marca').textContent = m.simbolo;
    esc.querySelector('.exp-etiqueta').textContent = m.etiqueta;
    circulo.classList.remove('aparece');
    void circulo.offsetWidth;
    circulo.classList.add('aparece');
    llenarAnillo(0);
    burbujas.forEach((b, i) => b.classList.toggle('actual', i === indice));
    api.iluminarObjetivo(leccion.ayudaVisual === false ? null : midi);
    if (!conservarGlobo && (!enCancion || indice === 0)) api.globo(`${nombreNota(midi)}: ${m.globo.toLowerCase()}`);
  }

  // Se avanza enseguida: si el niño toca rápido la siguiente nota, ya se compara con la correcta.
  function avanzar() {
    indice++;
    intentos = 0;
    presentar(true);
  }

  function bien(i, texto) {
    marcarBurbuja(i, 'bien');
    api.chispas(burbujas[i] || circulo);
    api.animarMascota('feliz');
    if (texto) api.globo(texto);
  }

  function mal(i, texto, decirlo) {
    marcarBurbuja(i, 'mal');
    api.contarError();
    api.animarMascota('animo');
    api.sacudir(circulo);
    api.globo(texto);
    if (decirlo) api.decir(texto, { menor: true });
  }

  // Repetir la misma nota (lecciones de práctica) o seguir (canciones).
  function despuesDeError() {
    intentos++;
    if (enCancion || intentos >= 3) avanzar();
    else presentar(true);
  }

  // Mientras se mantiene una nota larga, el anillo se va llenando.
  function vigilarLarga(p) {
    const cuadro = () => {
      if (!vivo || pendiente !== p || p.juzgada) return;
      const fraccion = (performance.now() - p.inicio) / LARGA_MS;
      llenarAnillo(fraccion);
      if (fraccion >= 1) {
        p.juzgada = true;
        bien(p.i, azar(['¡Larguísima! 🐍', '¡Muy bien sostenida!', '¡Eso es!']));
        if (pendiente === p) pendiente = null;
        avanzar();
        return;
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }

  return {
    iniciar() {
      presentar();
      const art = lista[0][1];
      api.decir(enCancion ? 'Mira las marcas de cada nota.' : MARCAS[art].globo);
    },

    nota(midi, origen, fuerza, instante) {
      if (!vivo) return;
      // ¿La nota anterior era "ligada" y ya se había soltado? Se mide el silencio.
      if (esperaLigado) {
        const e = esperaLigado;
        esperaLigado = null;
        const silencio = instante - e.fin;
        if (silencio <= LIGADO_MS) bien(e.i);
        else mal(e.i, '¡Sin levantar la mano! Pegadito como un gusanito', true);
      }
      if (indice >= lista.length) return;
      const [objetivo, art] = lista[indice];
      if (!api.esAcierto(midi, objetivo)) {
        api.marcarTecla(midi, 'error');
        api.contarError();
        api.globo(`Esa no: busca ${nombreNota(objetivo)}`);
        return;
      }
      api.marcarTecla(midi, 'acierto');
      const p = { i: indice, midi, art, inicio: instante, juzgada: false };
      pendiente = p;
      if (art === 'ligada') {
        // Se pasa a la siguiente enseguida: el ligado se juzga cuando suena la próxima.
        marcarBurbuja(indice, 'actual');
        indice++;
        presentar();
      } else if (art === 'larga') {
        api.globo('¡Mantén, mantén...!');
        vigilarLarga(p);
      }
    },

    fin(midi, duracion, origen, instante, ligada) {
      const p = pendiente;
      if (!vivo || !p || midi % 12 !== p.midi % 12) return;
      pendiente = null;
      if (p.juzgada) return;
      p.juzgada = true;

      if (p.art === 'ligada') {
        if (ligada) bien(p.i);
        else esperaLigado = { i: p.i, fin: instante };
        if (indice >= lista.length && !esperaLigado) presentar();
        return;
      }
      if (p.art === 'corta') {
        if (duracion <= CORTA_MS && !ligada) {
          bien(p.i, azar(['¡Boing! 🏀', '¡Saltó!', '¡Cortita, muy bien!']));
          avanzar();
        } else {
          mal(p.i, '¡Más cortita! Suéltala rápido, como si quemara', intentos === 0);
          despuesDeError();
        }
        return;
      }
      // Larga soltada antes de tiempo
      llenarAnillo(0);
      mal(p.i, '¡Mantenla un poquito más, hasta llenar el círculo!', intentos === 0);
      despuesDeError();
    },

    escuchar() {
      const actual = lista[indice]?.[0];
      if (actual != null) api.sonar('nota', actual, lista[indice][1] === 'corta' ? 0.25 : 1.2);
    },
    detener() { vivo = false; },
  };
}

function sorteoArticulacion(notas, cantidad, modo) {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    let midi;
    do { midi = azar(notas); } while (notas.length > 1 && midi === lista[i - 1]?.[0]);
    const art = modo === 'mezcla' ? (i % 2 === 0 ? azar(['corta', 'larga']) : (lista[i - 1][1] === 'corta' ? 'larga' : 'corta')) : modo;
    lista.push([midi, art]);
  }
  return lista;
}
