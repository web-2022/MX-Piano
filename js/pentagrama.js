// Dibuja notas en el pentagrama (clave de sol o de fa) y figuras rítmicas, en SVG.
// Las formas de las claves vienen de la fuente libre GNU FreeSerif (GPL con excepción de fuentes).
import { claseNota, colorNota, nombreNota, hayBemoles } from './notas.js';

const CLAVE_SOL = 'M434 -2Q464 103 464 170Q464 223 427 257Q390 291 337 291Q287 291 250 262Q213 232 213 190Q213 160 234 134Q254 107 284 107Q313 107 332 128Q350 150 350 178Q350 240 280 240Q298 268 338 268Q353 268 368 264Q384 259 401 248Q418 237 428 214Q439 190 439 157Q439 136 411 6Q389 12 356 12Q259 12 190 -60Q120 -132 120 -232Q120 -267 132 -303Q143 -339 158 -366Q172 -394 200 -428Q229 -463 248 -484Q268 -504 303 -539Q280 -621 280 -689Q280 -779 313 -840Q346 -900 379 -900Q389 -900 402 -887Q414 -874 426 -851Q438 -828 446 -790Q455 -753 455 -710Q455 -551 342 -447L368 -329Q384 -332 397 -332Q458 -332 500 -282Q542 -233 542 -162Q542 -44 434 -2ZM426 -746Q426 -801 394 -801Q358 -801 333 -748Q308 -695 308 -630Q308 -588 321 -557Q359 -580 392 -640Q426 -699 426 -746ZM498 -128Q498 -183 466 -216Q434 -249 383 -249L428 -23Q498 -52 498 -128ZM407 -17 361 -247Q334 -241 312 -214Q289 -187 289 -158Q289 -143 295 -128Q301 -114 310 -104Q318 -94 327 -86Q336 -78 342 -74Q348 -71 348 -71L340 -66Q307 -75 278 -106Q248 -137 248 -184Q248 -231 278 -270Q307 -310 343 -323L325 -430Q168 -299 168 -177Q168 -104 223 -55Q278 -6 348 -6Q365 -6 407 -17Z';
const CLAVE_FA = 'M564 -704Q582 -704 594 -691Q607 -678 607 -661Q607 -644 593 -631Q579 -618 563 -618Q521 -618 521 -663Q521 -681 534 -692Q547 -704 564 -704ZM607 -469Q607 -450 594 -437Q581 -424 564 -424Q521 -424 521 -469Q521 -485 534 -498Q546 -511 564 -511Q582 -511 594 -497Q607 -483 607 -469ZM285 -757Q366 -757 421 -702Q476 -646 476 -569Q476 -531 466 -495Q455 -459 432 -426Q409 -394 386 -367Q363 -340 326 -313Q289 -286 264 -268Q239 -249 196 -226Q154 -203 136 -194Q117 -184 80 -166L75 -182Q76 -183 102 -200Q128 -217 144 -228Q160 -238 192 -263Q223 -288 244 -310Q265 -331 292 -364Q318 -396 334 -427Q350 -458 362 -498Q373 -538 373 -578Q373 -735 262 -735Q225 -735 199 -726Q173 -716 162 -702Q150 -688 145 -678Q140 -667 140 -659Q140 -644 160 -644Q168 -644 179 -648Q190 -651 194 -651Q221 -651 239 -634Q257 -617 257 -592Q257 -563 235 -544Q213 -525 183 -525Q144 -525 119 -548Q94 -571 94 -607Q94 -673 150 -715Q207 -757 285 -757Z';
const SOSTENIDO = 'M365 -24 319 -6V193L275 209V10L138 63V262L94 279V80L50 96V0L94 -17V-262L50 -245V-341L94 -358V-589L138 -606V-376L275 -429V-659L319 -675V-446L365 -464V-366L319 -348V-104L365 -122ZM275 -88V-332L138 -279V-34Z';

const ESPACIO = 14;          // distancia entre líneas del pentagrama
const ANCHO = 300;
const ALTO = 190;
const LINEA_INFERIOR = 120;  // "y" de la primera línea (abajo)

// [paso diatónico, alteración] para cada clase de nota, con sostenidos o con bemoles
const DIATONICO = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
const DIATONICO_B = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
const diatonico = (midi) => (hayBemoles() ? DIATONICO_B : DIATONICO)[claseNota(midi)];

function indiceDiatonico(midi) {
  const [paso] = diatonico(midi);
  return (Math.floor(midi / 12) - 1) * 7 + paso;
}

// Armaduras: qué alteraciones lleva cada tonalidad y dónde se dibujan (Fa♯ y Si♭).
const ARMADURAS = {
  sol: { clases: [6], signo: 'sostenido', notas: { sol: 77, fa: 53 } },   // Fa♯ (5.ª línea / 4.ª línea)
  re: { clases: [6, 1], signo: 'sostenido', notas: { sol: 77, fa: 53 }, segunda: { sol: 72, fa: 48 } },
  fa: { clases: [10], signo: 'bemol', notas: { sol: 71, fa: 47 } },      // Si♭ (3.ª línea / 2.ª línea)
};

const BEMOL = (x, y) => `<text x="${x}" y="${y + 9}" font-size="34" font-family="'Noto Music', 'Bravura Text', serif" fill="#1e1b4b">♭</text>`;

// Posición en medios espacios desde la línea de abajo (0 = 1.ª línea, 2 = 2.ª línea...).
export function posicionEnPentagrama(midi, clave) {
  const base = clave === 'fa' ? 2 * 7 + 4 /* Sol2 */ : 4 * 7 + 2 /* Mi4 */;
  return indiceDiatonico(midi) - base;
}

const yDe = (pos) => LINEA_INFERIOR - (pos * ESPACIO) / 2;

// Posición de una nota natural (sin depender de sostenidos o bemoles)
function posicionDiatonica(midi, clave) {
  const [paso] = DIATONICO[claseNota(midi)];
  const base = clave === 'fa' ? 2 * 7 + 4 : 4 * 7 + 2;
  return (Math.floor(midi / 12) - 1) * 7 + paso - base;
}

// armadura: 'sol' (Fa♯), 're' (Fa♯ y Do♯) o 'fa' (Si♭). Las notas de la armadura no repiten la alteración.
export function pentagramaSVG(midi, { clave = 'sol', colores = true, mostrarNombre = false, armadura = null } = {}) {
  const lineas = [0, 2, 4, 6, 8]
    .map((p) => `<line x1="10" x2="${ANCHO - 10}" y1="${yDe(p)}" y2="${yDe(p)}" stroke="#1e1b4b" stroke-width="2"/>`)
    .join('');

  const claveSVG = clave === 'fa'
    ? `<path d="${CLAVE_FA}" fill="#1e1b4b" transform="translate(18 ${yDe(8) + 55}) scale(0.076)"/>`
    : `<path d="${CLAVE_SOL}" fill="#1e1b4b" transform="translate(14 ${yDe(2) + 13}) scale(0.082)"/>`;

  // Armadura después de la clave
  const arm = ARMADURAS[armadura];
  let armaduraSVG = '';
  if (arm) {
    const lugares = [arm.notas[clave === 'fa' ? 'fa' : 'sol']];
    if (arm.segunda) lugares.push(arm.segunda[clave === 'fa' ? 'fa' : 'sol']);
    lugares.forEach((m, i) => {
      const y = yDe(posicionDiatonica(m, clave));
      const x = 62 + i * 16;
      armaduraSVG += arm.signo === 'bemol' ? BEMOL(x, y - 6)
        : `<path d="${SOSTENIDO}" fill="#1e1b4b" transform="translate(${x} ${y}) scale(0.034)"/>`;
    });
  }

  let nota = '';
  if (midi != null) {
    const pos = posicionEnPentagrama(midi, clave);
    const x = 175;
    const y = yDe(pos);
    const relleno = colores ? colorNota(midi) : '#1e1b4b';

    // Líneas adicionales (por ejemplo, el Do central en clave de sol)
    let adicionales = '';
    for (let p = -2; p >= pos; p -= 2) adicionales += `<line x1="${x - 17}" x2="${x + 17}" y1="${yDe(p)}" y2="${yDe(p)}" stroke="#1e1b4b" stroke-width="2"/>`;
    for (let p = 10; p <= pos; p += 2) adicionales += `<line x1="${x - 17}" x2="${x + 17}" y1="${yDe(p)}" y2="${yDe(p)}" stroke="#1e1b4b" stroke-width="2"/>`;

    const plicaArriba = pos < 4;
    const plica = plicaArriba
      ? `<line x1="${x + 9.5}" x2="${x + 9.5}" y1="${y - 2}" y2="${y - ESPACIO * 3.5}" stroke="#1e1b4b" stroke-width="2.4"/>`
      : `<line x1="${x - 9.5}" x2="${x - 9.5}" y1="${y + 2}" y2="${y + ESPACIO * 3.5}" stroke="#1e1b4b" stroke-width="2.4"/>`;

    const alt = diatonico(midi)[1];
    const enArmadura = arm?.clases.includes(claseNota(midi));
    const alteracion = !alt || enArmadura ? ''
      : alt < 0 ? BEMOL(x - 34, y - 6)
        : `<path d="${SOSTENIDO}" fill="#1e1b4b" transform="translate(${x - 36} ${y}) scale(0.034)"/>`;

    nota = `${adicionales}${alteracion}${plica}
      <ellipse cx="${x}" cy="${y}" rx="10.5" ry="7.6" transform="rotate(-20 ${x} ${y})"
               fill="${relleno}" stroke="#1e1b4b" stroke-width="1.6"/>`;
    if (mostrarNombre) {
      nota += `<text x="${x}" y="${ALTO - 8}" text-anchor="middle" font-size="22" font-weight="800"
               fill="${relleno}" font-family="ui-rounded, system-ui, sans-serif">${nombreNota(midi)}</text>`;
    }
  }

  return `<svg viewBox="0 0 ${ANCHO} ${ALTO}" class="pentagrama-svg" role="img" aria-label="Pentagrama">${lineas}${claveSVG}${armaduraSVG}${nota}</svg>`;
}

// Icono de figura rítmica: 4 = redonda, 3 = blanca con puntillo, 2 = blanca, 1.5 = negra con puntillo,
// 1 = negra, 0.5 = corchea. silencio = true para silencios.
export function figuraSVG(tiempos, { color = '#1e1b4b', silencio = false } = {}) {
  if (silencio) {
    if (tiempos >= 2) {
      // silencio de blanca: rectángulo sobre la línea
      return `<svg viewBox="0 0 40 60" class="figura"><line x1="6" x2="34" y1="32" y2="32" stroke="${color}" stroke-width="2"/>
              <rect x="11" y="22" width="18" height="10" fill="${color}"/></svg>`;
    }
    if (tiempos < 1) {
      // silencio de corchea: un "7" con bolita
      return `<svg viewBox="0 0 40 60" class="figura"><circle cx="15" cy="20" r="4.5" fill="${color}"/>
              <path d="M15 24 Q22 25 28 17 L18 50" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
    }
    // silencio de negra (zigzag)
    return `<svg viewBox="0 0 40 60" class="figura"><path d="M16 8 L26 20 L17 30 L27 42 Q15 38 18 52 Q8 40 22 40 L13 30 L22 20 Z"
            fill="${color}"/></svg>`;
  }
  // Tresillo: tres notas en el lugar de dos (duración 1/3 de negra) → corchea con un "3" encima.
  const tresillo = Math.abs(tiempos * 3 - Math.round(tiempos * 3)) < 1e-6 && Math.abs(tiempos * 4 - Math.round(tiempos * 4)) > 1e-6;
  const puntillo = !tresillo && [0.375, 0.75, 1.5, 3, 6].some((d) => Math.abs(d - tiempos) < 1e-6);
  const base = tresillo ? 0.5 : puntillo ? tiempos / 1.5 : tiempos;
  const hueca = base >= 2;
  const cabeza = `<ellipse cx="17" cy="46" rx="9" ry="6.5" transform="rotate(-20 17 46)"
                  fill="${hueca ? 'none' : color}" stroke="${color}" stroke-width="${hueca ? 3 : 1.5}"/>`;
  const plica = base >= 4 ? '' : `<line x1="25" x2="25" y1="44" y2="8" stroke="${color}" stroke-width="2.6"/>`;
  const banderin = (y) => `<path d="M25 ${y} Q27 ${y + 10} 36 ${y + 14} Q31 ${y + 19} 33 ${y + 28} Q30 ${y + 18} 25 ${y + 14} Z" fill="${color}"/>`;
  const bandera = base < 1 ? banderin(8) + (base < 0.5 ? banderin(17) : '') : '';
  const punto = puntillo ? `<circle cx="33" cy="44" r="3.2" fill="${color}"/>` : '';
  const tres = tresillo ? `<text x="8" y="14" font-size="14" font-weight="900" fill="${color}" font-family="system-ui, sans-serif">3</text>` : '';
  return `<svg viewBox="0 0 40 60" class="figura">${tres}${plica}${bandera}${cabeza}${punto}</svg>`;
}
