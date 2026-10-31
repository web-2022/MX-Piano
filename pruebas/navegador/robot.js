// Robot que toca una lección de Pianito con el piano virtual (por el micrófono).
// Toca como un niño: suelta cada tecla un poco tarde (la nota anterior sigue sonando al tocar la
// siguiente) y, en las lecciones con pedal, deja sonar las notas.
// Uso (Playwright): await page.evaluate(ROBOT, idLeccion)  →  { ok, estrellas, errores, detalle }
async (id) => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const E = window.pianito.estado;
  const P = window.pianoVirtual;
  const notas = await import('./js/notas.js');
  const L = (await import('./js/lecciones.js')).buscarLeccion(id);
  const terminado = () => document.querySelector('#pantalla-resultado').classList.contains('activa');
  const pedal = !!L.pedal;
  const larga = pedal ? 2.2 : 0.75;      // cuánto mantiene la tecla
  const midiDe = (nombre) => {
    const ms = [...document.querySelectorAll('#teclado [data-midi]')].map((t) => +t.dataset.midi);
    return ms.find((m) => notas.nombreNota(m) === nombre) ?? ms.find((m) => notas.nombreNota(m).startsWith(nombre));
  };
  const progreso = () => {
    const j = E.juego;
    if (!j) return '';
    return [j.indice, document.querySelectorAll('.exp-progreso i.hecho, .exp-progreso i.mal').length,
      document.querySelector('.contador-moscas b')?.textContent, document.querySelectorAll('.eco-rondas .hecha').length,
      document.querySelector('.rana-corre')?.style.left, document.querySelector('.impro-barra div')?.style.width,
      j.ritmo?.eventos?.filter((e) => e.estado !== 'pendiente').length].join('|');
  };
  // Toca y espera a que la lección avance; si no avanza, reintenta (como haría un niño).
  let reintentos = 0;
  const tocarYEsperar = async (fn, maxMs = 1800) => {
    const antes = progreso();
    await fn();
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      await espera(40);
      if (terminado() || progreso() !== antes) return true;
    }
    reintentos++;
    return false;
  };

  const inicio = performance.now();
  const limite = L.tipo === 'ritmo' ? 120000 : 150000;
  let eco = { sec: [], ultimo: null };
  const obsEco = setInterval(() => {
    const t = document.querySelector('#teclado .objetivo');
    const m = t ? t.dataset.midi : null;
    if (m && m !== eco.ultimo) eco.sec.push(+m);
    eco.ultimo = m;
  }, 25);
  let dinY = null;

  try {
    while (!terminado() && performance.now() - inicio < limite) {
      const j = E.juego;
      if (!j || !E.detector.escuchando && L.tipo !== 'ritmo') { await espera(50); continue; }
      const tipo = L.tipo;

      if (tipo === 'ritmo') {
        const r = j.ritmo;
        if (!r?.corriendo || r.demo) { await espera(15); continue; }
        for (const e of r.eventos) {
          if (e.midi == null) continue;
          const cuando = r.inicio + e.inicio * r.beatMs;
          while (performance.now() < cuando - 3) await espera(2);
          P.tocar(e.midi, Math.max(0.12, (e.tiempos * r.beatMs) / 1000 * 0.85), 0.2);
        }
        while (!terminado() && performance.now() - inicio < limite) await espera(50);
        break;
      }

      if (['buscar', 'aleatorio', 'cancion'].includes(tipo)) {
        if (!j.esperando) { await espera(30); continue; }
        const m = j.objetivos[j.indice];
        await tocarYEsperar(() => P.tocar(m, larga, 0.2));
        await espera(120);
        continue;
      }

      if (tipo === 'acordes') {
        const midis = [...document.querySelectorAll('.acorde-nota')].map((e) => +e.dataset.midi);
        if (!midis.length) { await espera(50); continue; }
        await tocarYEsperar(() => midis.forEach((m) => P.tocar(m, larga, 0.18)), 2000);
        await espera(150);
        continue;
      }

      if (tipo === 'dinamica') {
        const marca = document.querySelector('.exp-marca')?.textContent;
        const nombre = document.querySelector('.exp-nombre')?.textContent;
        if (!marca || !nombre) { await espera(50); continue; }
        if (marca === 'f') dinY = 0.4; else if (marca === 'p') dinY = 0.04;
        else if (marca === '<') dinY = Math.min(0.5, (dinY ?? 0.06) * 1.6);
        else dinY = Math.max(0.03, (dinY ?? 0.4) / 1.6);
        await tocarYEsperar(() => P.tocar(midiDe(nombre), 0.6, dinY), 2200);
        await espera(200);
        continue;
      }

      if (tipo === 'articulacion') {
        const circulo = document.querySelector('.exp-circulo');
        const art = circulo?.dataset.art;
        const nombre = document.querySelector('.exp-nombre')?.textContent;
        if (!art || !nombre) { await espera(50); continue; }
        const m = midiDe(nombre);
        if (art === 'corta') await tocarYEsperar(() => P.tocar(m, 0.15, 0.2));
        else if (art === 'larga') await tocarYEsperar(() => P.tocar(m, 1.3, 0.2), 2600);
        else { P.tocar(m, 0.65, 0.2); await espera(450); continue; } // ligada: la siguiente empieza antes de soltar
        await espera(150);
        continue;
      }

      if (tipo === 'atrapa') {
        const nombre = document.querySelector('.mosca:not(.atrapada):not(.escapa) .nota-mosca')?.textContent;
        if (!nombre) {
          // en el pentagrama la mosca no dice el nombre: se toma del estado interno visible
          const mosca = document.querySelector('.mosca:not(.atrapada):not(.escapa)');
          if (mosca?.dataset.midi) { await espera(400); await tocarYEsperar(() => P.tocar(+mosca.dataset.midi, 0.5, 0.2)); continue; }
          await espera(80); continue;
        }
        await espera(400);
        await tocarYEsperar(() => P.tocar(midiDe(nombre), 0.5, 0.2));
        continue;
      }

      if (tipo === 'eco') {
        if (document.querySelector('#globo').textContent !== '¡Tu turno!') { await espera(40); continue; }
        const n = document.querySelectorAll('.eco-nota').length;
        const sec = eco.sec.slice(-n);
        for (const m of sec) { P.tocar(m, 0.5, 0.2); await espera(550); }
        eco.sec = [];
        await espera(800);
        continue;
      }

      if (tipo === 'carrera') {
        const nombre = document.querySelector('#nota-nombre')?.textContent;
        if (!nombre || document.querySelector('#nota-objetivo').classList.contains('oculto')) { await espera(50); continue; }
        await tocarYEsperar(() => P.tocar(midiDe(nombre), 0.5, 0.2));
        continue;
      }

      if (tipo === 'improvisa') {
        const teclas = [...document.querySelectorAll('#teclado .objetivo')].map((t) => +t.dataset.midi);
        if (!teclas.length) { await espera(80); continue; }
        await tocarYEsperar(() => P.tocar(teclas[Math.floor(Math.random() * teclas.length)], 0.5, 0.2));
        await espera(150);
        continue;
      }
      await espera(100);
    }
  } finally {
    clearInterval(obsEco);
  }
  const ok = terminado();
  const j = E.juego;
  return {
    ok,
    estrellas: ok ? document.querySelectorAll('#resultado-estrellas span:not(.apagada)').length : 0,
    errores: j?.errores ?? null,
    reintentos,
    segundos: Math.round((performance.now() - inicio) / 1000),
    detalle: ok ? '' : `trabada: ${progreso()} · globo: "${document.querySelector('#globo')?.textContent}"`,
  };
}
