// Lecciones de acordes y de las dos manos juntas.
// Con micrófono: al oír un ataque, espera ~220 ms (que pase el golpe del martillo) y comprueba
// que suenen exactamente las notas pedidas. Con el teclado de la pantalla: junta las teclas
// tocadas (se pueden tocar una por una) y compara cuando están todas.
import { nombreNota, colorNota, notaAMidi, claseNota } from './notas.js';
import { textoAcorde } from './acordes.js';

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const ESPERA_MS = 220;   // después del ataque, para que pase el golpe del martillo
const SEGUNDA_MS = 160;  // segundo intento (por si las notas no bajaron justo juntas)

// Normaliza un elemento de la lección: ['Do4', 'Mi4'] o { notas: [...], nombre: 'Do mayor' }.
function normalizar(item) {
  const notas = Array.isArray(item) ? item : item.notas;
  return { midis: notas.map(notaAMidi).sort((a, b) => a - b), nombre: Array.isArray(item) ? '' : item.nombre || '' };
}

export function leccionAcordes(leccion, api) {
  const esc = api.escenario;
  const base = leccion.acordes.map(normalizar);
  const lista = leccion.cantidad
    ? Array.from({ length: leccion.cantidad }, (_, i) => base[i < base.length ? i : Math.floor(Math.random() * base.length)])
    : base;
  const dosManos = leccion.mano === 'ambas';
  let indice = 0;
  let ocupado = false;     // comprobando un ataque
  let fallos = 0;
  let tocadas = new Set(); // teclado de la pantalla
  let vivo = true;

  esc.innerHTML = `
    <div class="acorde">
      <div class="acorde-nombre"></div>
      <div class="acorde-notas"></div>
      <div class="exp-progreso">${lista.map(() => '<i></i>').join('')}</div>
    </div>`;
  const cajaNotas = esc.querySelector('.acorde-notas');
  const puntos = [...esc.querySelectorAll('.exp-progreso i')];

  function presentar(conservarGlobo = false) {
    if (!vivo) return;
    if (indice >= lista.length) {
      setTimeout(() => vivo && api.terminar(), 500);
      return;
    }
    const { midis, nombre } = lista[indice];
    tocadas = new Set();
    fallos = 0;
    esc.querySelector('.acorde-nombre').textContent = nombre || (midis.length > 1 ? '¡Juntas!' : '');
    // La nota más aguda arriba, como en la partitura.
    cajaNotas.innerHTML = [...midis].reverse().map((m) => `
      <span class="acorde-nota" data-midi="${m}" style="--color:${colorNota(m)}">
        ${nombreNota(m)}${dosManos ? `<small>${m < 60 ? 'izq' : 'der'}</small>` : ''}
      </span>`).join('');
    cajaNotas.classList.remove('aparece');
    void cajaNotas.offsetWidth;
    cajaNotas.classList.add('aparece');
    puntos.forEach((p, i) => { if (i === indice) p.className = 'actual'; });
    api.iluminarObjetivo(null);
    if (leccion.ayudaVisual !== false) midis.forEach((m) => api.marcarTecla(m, 'objetivo', 1e9));
    // Con pedal, la app vigila el acorde pedido en vez de depender de oír el golpe.
    if (api.conPedal?.()) {
      const i = indice;
      api.vigilar(midis, () => { if (vivo && indice === i) acierto(); }, { cualquierOctava: !dosManos });
    }
    if (!conservarGlobo) {
      const izq = midis.filter((m) => m < 60).map(nombreNota).join(' y ');
      const der = midis.filter((m) => m >= 60).map(nombreNota).join(' y ');
      api.globo(midis.length === 1 ? `¡Toca ${nombreNota(midis[0])}!`
        : dosManos && izq && der ? `Izquierda ${izq} + derecha ${der}, ¡juntas!`
          : `¡Toca ${midis.map(nombreNota).join(', ')} juntas!`);
    }
  }

  function limpiarTeclas() {
    document.querySelectorAll('#teclado .objetivo').forEach((t) => t.classList.remove('objetivo'));
  }

  function acierto() {
    const n = lista[indice].midis.length;
    puntos[indice].className = 'hecho';
    api.chispas(cajaNotas);
    api.animarMascota('feliz');
    api.globo(n > 1 ? azar(['¡Qué bonito suena!', '¡Acorde perfecto!', '¡Juntas, muy bien!']) : azar(['¡Bien!', '¡Eso es!']));
    limpiarTeclas();
    indice++;
    presentar(true);
  }

  function error(resultado) {
    api.contarError();
    fallos++;
    api.animarMascota('animo');
    api.sacudir(cajaNotas);
    const texto = textoAcorde(resultado) || 'Otra vez';
    // Las notas que faltan se marcan en el dibujo.
    cajaNotas.querySelectorAll('.acorde-nota').forEach((el) => {
      const m = Number(el.dataset.midi);
      el.classList.toggle('falta', resultado.faltan.some((f) => claseNota(f) === claseNota(m)));
    });
    resultado.sobran.forEach((m) => api.marcarTecla(m, 'error', 700));
    api.globo(`¡Casi! ${texto}`);
    if (fallos === 1) api.decir(`Casi. ${texto}.`, { menor: true });
    if (fallos >= 2 && leccion.ayudaVisual === false) lista[indice].midis.forEach((m) => api.marcarTecla(m, 'objetivo', 1e9));
  }

  function pista(resultado) {
    const texto = textoAcorde(resultado);
    if (texto) api.globo(texto);
    api.sacudir(cajaNotas);
  }

  // ── Micrófono ──
  async function comprobarMicrofono(instante) {
    if (ocupado || indice >= lista.length) return;
    ocupado = true;
    const antes = api.antesDelGolpe?.();
    const i = indice;
    const objetivo = lista[i];
    // Con pedal se espera más: si la vigilancia ya oyó el acorde, la lección habrá avanzado.
    const espera = api.conPedal?.() ? ESPERA_MS + 250 : ESPERA_MS;
    await api.esperar(Math.max(0, instante + espera - performance.now()));
    if (indice !== i) { ocupado = false; return; }
    const opciones = { cualquierOctava: !dosManos, antes };
    let r = vivo && api.escuchando() ? api.verificarAcorde(objetivo.midis, opciones) : null;
    if (r && !r.ok) {
      await api.esperar(SEGUNDA_MS);
      if (vivo && api.escuchando() && indice === i) r = api.verificarAcorde(objetivo.midis, opciones);
    }
    ocupado = false;
    if (!r || !vivo || indice !== i) return;
    if (r.ok) acierto();
    else if (api.conPedal?.()) pista(r);   // con pedal: pista sin castigo (puede ser lo que sigue sonando)
    else error(r);
  }

  // ── Teclado de la pantalla ──
  function comprobarPantalla(midi) {
    const { midis } = lista[indice];
    const coincide = (a, b) => (dosManos ? a === b : claseNota(a) === claseNota(b));
    if (!midis.some((m) => coincide(m, midi))) {
      tocadas = new Set();
      error({ faltan: [], sobran: [midi] });
      return;
    }
    api.marcarTecla(midi, 'acierto', 400);
    tocadas.add(midis.find((m) => coincide(m, midi)));
    if (tocadas.size === midis.length) acierto();
  }

  return {
    iniciar() {
      presentar();
      api.decir(lista[0].midis.length > 1 ? 'Toca las notas juntas, todas al mismo tiempo.' : '¡Vamos!');
    },
    ataque(instante) {
      if (vivo && !api.esPantalla()) comprobarMicrofono(instante);
    },
    nota(midi, origen) {
      if (vivo && origen === 'pantalla' && indice < lista.length) comprobarPantalla(midi);
    },
    fin() {},
    escuchar() {
      const actual = lista[indice];
      if (actual) actual.midis.forEach((m) => api.sonar('nota', m, 1.2));
    },
    detener() {
      vivo = false;
      api.dejarDeVigilar?.();
      limpiarTeclas();
    },
  };
}
