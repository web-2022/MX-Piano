// Contenido de la app. Para agregar lecciones solo se edita este archivo.
//
// TIPOS DE LECCIÓN
//   buscar     -> la misma nota varias veces (encontrarla en el teclado)
//   aleatorio  -> notas al azar de "notas", "cantidad" veces
//   cancion    -> secuencia fija de "notas" (melodía de dominio público), sin tiempo
//   ritmo      -> "figuras" con duración, se toca a tiempo con el pulso (tempo en pulsos por minuto)
//
// OPCIONES
//   vista: 'circulo' (por defecto) | 'pentagrama'
//   clave: 'sol' | 'fa'                 (en vista pentagrama)
//   colores: true|false                 (notas de color en el pentagrama y en la canción)
//   mostrarNombre: true|false           (mostrar el nombre de la nota; false = leer de verdad)
//   ayudaVisual: true|false             (ilumina siempre la tecla correcta en la pantalla)
//   mano: 'derecha' | 'izquierda' | 'ambas'
//   registro: true                      (exige la octava: grave = mano izquierda, agudo = derecha)
//   teclado: [desde, hasta]             (rango del teclado en pantalla, en números MIDI; 60 = Do central)
//   dedos: [..]                         (dedo de cada nota en canciones, si no es la posición de Do)
//
// Notas: 'Do4' = Do central. Sostenido: 'Fa#4'. En ritmo, null = silencio.
// Duración en ritmo: 1 = negra, 2 = blanca, 4 = redonda.

const CINCO_DERECHA = ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4'];
const CINCO_IZQUIERDA = ['Do3', 'Re3', 'Mi3', 'Fa3', 'Sol3'];
const DOS_MANOS = [48, 72]; // Do3 a Do5

export const MUNDOS = [
  // ───────────────────────── NIVEL 0 ─────────────────────────
  {
    id: 'mundo0',
    titulo: 'Isla del Do',
    nivel: 0,
    color: '#fecaca',
    lecciones: [
      {
        id: 'n0-1', titulo: 'Encuentra el Do', emoji: '🔍',
        tipo: 'buscar', notas: ['Do4'], cantidad: 5, ayudaVisual: true,
        consejo: 'El Do está justo a la izquierda de cada grupo de DOS teclas negras. Ayúdale a encontrar uno.',
      },
      {
        id: 'n0-2', titulo: 'Todos los Do', emoji: '🎯',
        tipo: 'buscar', notas: ['Do4'], cantidad: 6, ayudaVisual: false,
        consejo: 'Ahora sin ayuda en la pantalla. Puede tocar cualquier Do del piano, arriba o abajo.',
      },
    ],
  },

  // ───────────────────────── NIVEL 1 ─────────────────────────
  {
    id: 'mundo1',
    titulo: 'Montaña de las 5 notas',
    nivel: 1,
    color: '#bae6fd',
    lecciones: [
      {
        id: 'n1-1', titulo: 'Do y Re', emoji: '👆',
        tipo: 'aleatorio', notas: ['Do4', 'Re4'], cantidad: 8, ayudaVisual: true,
        consejo: 'Pulgar (dedo 1) en Do, índice (dedo 2) en Re. La mano queda quieta, solo se mueven los dedos.',
      },
      {
        id: 'n1-2', titulo: 'Do, Re y Mi', emoji: '🎈',
        tipo: 'aleatorio', notas: ['Do4', 'Re4', 'Mi4'], cantidad: 10, ayudaVisual: true,
        consejo: 'Dedos 1, 2 y 3. Si duda, que primero diga el nombre de la nota en voz alta y luego la toque.',
      },
      {
        id: 'n1-3', titulo: 'Fa y Sol', emoji: '🌿',
        tipo: 'aleatorio', notas: ['Fa4', 'Sol4'], cantidad: 8, ayudaVisual: true,
        consejo: 'Dedo 4 en Fa y dedo 5 (meñique) en Sol. El meñique es débil: es normal que cueste al inicio.',
      },
      {
        id: 'n1-4', titulo: 'Las cinco notas', emoji: '🖐️',
        tipo: 'aleatorio', notas: CINCO_DERECHA, cantidad: 12, ayudaVisual: false,
        consejo: 'Cinco dedos, cinco notas. Ya no hay ayuda en la pantalla: que mire su mano, no el iPad.',
      },
      {
        id: 'n1-5', titulo: 'Canción: Oda a la alegría', emoji: '🏆', premio: true,
        tipo: 'cancion', ayudaVisual: true,
        // Beethoven, Sinfonía n.º 9 (dominio público). Primera frase.
        notas: ['Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Re4', 'Re4'],
        consejo: '¡La primera canción! Si se pierde, que vuelva a empezar despacio. La app lo espera.',
      },
    ],
  },

  // ───────────────────────── NIVEL 2 ─────────────────────────
  {
    id: 'mundo2',
    titulo: 'Bosque del Pentagrama',
    nivel: 2,
    color: '#bbf7d0',
    lecciones: [
      {
        id: 'n2-1', titulo: 'Do, Re y Mi en el pentagrama', emoji: '🎼',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', colores: true, mostrarNombre: true,
        notas: ['Do4', 'Re4', 'Mi4'], cantidad: 9, ayudaVisual: true,
        consejo: 'El Do central vive debajo del pentagrama, con una rayita. Re cuelga de la primera línea y Mi se sienta sobre ella.',
      },
      {
        id: 'n2-2', titulo: 'Fa y Sol en el pentagrama', emoji: '🌳',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', colores: true, mostrarNombre: true,
        notas: ['Mi4', 'Fa4', 'Sol4'], cantidad: 9, ayudaVisual: false,
        consejo: 'Fa está en el primer espacio. Sol está en la segunda línea, justo donde se enrosca la clave de Sol.',
      },
      {
        id: 'n2-3', titulo: 'Lee sin nombres', emoji: '👀',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', colores: true, mostrarNombre: false,
        notas: CINCO_DERECHA, cantidad: 10, ayudaVisual: false,
        consejo: 'Ya no aparece el nombre: solo el color y el lugar en el pentagrama. Pregúntale "¿línea o espacio?".',
      },
      {
        id: 'n2-4', titulo: 'Lectura en blanco y negro', emoji: '📖',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', colores: false, mostrarNombre: false,
        notas: CINCO_DERECHA, cantidad: 10, ayudaVisual: false,
        consejo: 'Ahora las notas son negras, como en una partitura de verdad. Si duda, que cuente líneas y espacios desde el Do.',
      },
      {
        id: 'n2-5', titulo: 'Lee la canción: A la luz de la luna', emoji: '🌙', premio: true,
        tipo: 'cancion', vista: 'pentagrama', clave: 'sol', colores: true, mostrarNombre: false,
        // "Au clair de la lune", canción tradicional francesa (dominio público).
        notas: ['Do4', 'Do4', 'Do4', 'Re4', 'Mi4', 'Re4', 'Do4', 'Mi4', 'Re4', 'Re4', 'Do4'],
        consejo: 'Su primera canción leída en el pentagrama. Que vaya despacio: la app espera cada nota.',
      },
    ],
  },

  // ───────────────────────── NIVEL 3 ─────────────────────────
  {
    id: 'mundo3',
    titulo: 'Río del Ritmo',
    nivel: 3,
    color: '#a5f3fc',
    lecciones: [
      {
        id: 'n3-1', titulo: 'Negras: un pulso', emoji: '🥁',
        tipo: 'ritmo', tempo: 60,
        figuras: [['Do4', 1], ['Do4', 1], ['Do4', 1], ['Do4', 1], ['Re4', 1], ['Re4', 1], ['Re4', 1], ['Re4', 1]],
        consejo: 'La negra dura un pulso: un toque por cada "clic". Primero escuchen el ejemplo y den palmadas juntos.',
      },
      {
        id: 'n3-2', titulo: 'Blancas: tocar y esperar', emoji: '⏳',
        tipo: 'ritmo', tempo: 60,
        figuras: [['Do4', 2], ['Do4', 2], ['Re4', 2], ['Re4', 2], ['Mi4', 2], ['Mi4', 2], ['Do4', 4]],
        consejo: 'La blanca dura dos pulsos: se toca y se mantiene la tecla mientras cuentan "uno, dos".',
      },
      {
        id: 'n3-3', titulo: 'Redondas: notas largas', emoji: '🐢',
        tipo: 'ritmo', tempo: 66,
        figuras: [['Do4', 4], ['Mi4', 4], ['Sol4', 4], ['Do4', 4]],
        consejo: 'La redonda dura cuatro pulsos. Es la nota más larga: "uno, dos, tres, cuatro".',
      },
      {
        id: 'n3-4', titulo: 'Silencios: la mano descansa', emoji: '🤫',
        tipo: 'ritmo', tempo: 60,
        figuras: [['Do4', 1], ['Re4', 1], ['Mi4', 1], [null, 1],
                  ['Mi4', 1], ['Re4', 1], ['Do4', 1], [null, 1],
                  ['Do4', 1], ['Mi4', 1], ['Sol4', 1], [null, 1],
                  ['Sol4', 2], [null, 2]],
        consejo: 'En el silencio no se toca nada: la manito se levanta un poquito y se sigue contando.',
      },
      {
        id: 'n3-5', titulo: 'Ritmo: Mary tenía un corderito', emoji: '🐑', premio: true,
        tipo: 'ritmo', tempo: 60,
        // "Mary Had a Little Lamb", canción tradicional (dominio público).
        figuras: [['Mi4', 1], ['Re4', 1], ['Do4', 1], ['Re4', 1],
                  ['Mi4', 1], ['Mi4', 1], ['Mi4', 2],
                  ['Re4', 1], ['Re4', 1], ['Re4', 2],
                  ['Mi4', 1], ['Sol4', 1], ['Sol4', 2]],
        consejo: '¡Una canción con ritmo! Las blancas del final de cada frase se sostienen dos pulsos.',
      },
    ],
  },

  // ───────────────────────── NIVEL 4 ─────────────────────────
  {
    id: 'mundo4',
    titulo: 'Valle de las Canciones',
    nivel: 4,
    color: '#fde68a',
    lecciones: [
      {
        id: 'n4-1', titulo: 'Martinillo', emoji: '🔔',
        tipo: 'cancion', ayudaVisual: true,
        // "Frère Jacques", canción tradicional francesa (dominio público). Primera parte.
        notas: ['Do4', 'Re4', 'Mi4', 'Do4', 'Do4', 'Re4', 'Mi4', 'Do4',
                'Mi4', 'Fa4', 'Sol4', 'Mi4', 'Fa4', 'Sol4'],
        consejo: 'Pueden cantarla juntos mientras toca: "Martinillo, Martinillo, ¿dónde estás?".',
      },
      {
        id: 'n4-2', titulo: 'Mary tenía un corderito', emoji: '🐑',
        tipo: 'cancion', ayudaVisual: true,
        notas: ['Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Re4', 'Re4', 'Re4', 'Mi4', 'Sol4', 'Sol4',
                'Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Mi4', 'Re4', 'Re4', 'Mi4', 'Re4', 'Do4'],
        consejo: 'La canción completa. Ya conoce el comienzo del Río del Ritmo.',
      },
      {
        id: 'n4-3', titulo: 'Remando suave', emoji: '🚣',
        tipo: 'cancion', ayudaVisual: false,
        // "Lightly Row" / "Hänschen klein", canción tradicional alemana (dominio público).
        notas: ['Sol4', 'Mi4', 'Mi4', 'Fa4', 'Re4', 'Re4',
                'Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Sol4',
                'Sol4', 'Mi4', 'Mi4', 'Fa4', 'Re4', 'Re4',
                'Do4', 'Mi4', 'Sol4', 'Sol4', 'Do4'],
        consejo: 'Empieza con el meñique en Sol. Fíjense que sube y baja como un bote en el agua.',
      },
      {
        id: 'n4-4', titulo: 'Oda a la alegría completa', emoji: '🎶',
        tipo: 'cancion', ayudaVisual: false,
        notas: ['Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Re4', 'Re4',
                'Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Re4', 'Do4', 'Do4'],
        consejo: 'Las dos frases. La segunda termina distinto: "Re, Do, Do", y vuelve a casa.',
      },
      {
        id: 'n4-5', titulo: 'Jingle Bells', emoji: '🎄', premio: true,
        tipo: 'cancion', ayudaVisual: false,
        // "Jingle Bells" (James Lord Pierpont, 1857, dominio público). Estribillo.
        notas: ['Mi4', 'Mi4', 'Mi4', 'Mi4', 'Mi4', 'Mi4',
                'Mi4', 'Sol4', 'Do4', 'Re4', 'Mi4',
                'Fa4', 'Fa4', 'Fa4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Mi4',
                'Mi4', 'Re4', 'Re4', 'Mi4', 'Re4', 'Sol4'],
        consejo: '¡Muchos Mi seguidos! Que levante el dedo entre cada uno para que el piano suene otra vez.',
      },
    ],
  },

  // ───────────────────────── NIVEL 5 ─────────────────────────
  {
    id: 'mundo5',
    titulo: 'Cueva de la Mano Izquierda',
    nivel: 5,
    color: '#ddd6fe',
    lecciones: [
      {
        id: 'n5-1', titulo: 'El Do de abajo', emoji: '👈',
        tipo: 'buscar', notas: ['Do3'], cantidad: 5, ayudaVisual: true,
        mano: 'izquierda', registro: true, teclado: DOS_MANOS,
        consejo: 'Ahora la mano izquierda. El meñique (dedo 5) va en el Do que está justo debajo del Do central.',
      },
      {
        id: 'n5-2', titulo: 'Do, Re y Mi con la izquierda', emoji: '🦶',
        tipo: 'aleatorio', notas: ['Do3', 'Re3', 'Mi3'], cantidad: 9, ayudaVisual: true,
        mano: 'izquierda', registro: true, teclado: DOS_MANOS,
        consejo: 'En la mano izquierda los números van al revés: Do es el dedo 5, Re el 4 y Mi el 3.',
      },
      {
        id: 'n5-3', titulo: 'Cinco dedos a la izquierda', emoji: '✋',
        tipo: 'aleatorio', notas: CINCO_IZQUIERDA, cantidad: 10, ayudaVisual: false,
        mano: 'izquierda', registro: true, teclado: DOS_MANOS,
        consejo: 'Fa es el dedo 2 y Sol el pulgar. El pulgar izquierdo queda cerca del Do central.',
      },
      {
        id: 'n5-4', titulo: 'La clave de Fa', emoji: '🗝️',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'fa', colores: true, mostrarNombre: true,
        notas: CINCO_IZQUIERDA, cantidad: 10, ayudaVisual: false,
        mano: 'izquierda', registro: true, teclado: DOS_MANOS,
        consejo: 'La clave de Fa es para las notas graves. Sus dos puntitos abrazan la línea del Fa.',
      },
      {
        id: 'n5-5', titulo: 'A la luz de la luna (izquierda)', emoji: '🌛', premio: true,
        tipo: 'cancion', ayudaVisual: false,
        mano: 'izquierda', registro: true, teclado: DOS_MANOS,
        notas: ['Do3', 'Do3', 'Do3', 'Re3', 'Mi3', 'Re3', 'Do3', 'Mi3', 'Re3', 'Re3', 'Do3'],
        consejo: 'La misma canción del Bosque, ahora con la mano izquierda. Suena más grave, como un oso.',
      },
    ],
  },

  // ───────────────────────── NIVEL 6 ─────────────────────────
  {
    id: 'mundo6',
    titulo: 'Cumbre del Teclado',
    nivel: 6,
    color: '#fbcfe8',
    lecciones: [
      {
        id: 'n6-1', titulo: 'Conoce a La y Si', emoji: '🧗',
        tipo: 'aleatorio', notas: ['Sol4', 'La4', 'Si4'], cantidad: 9, ayudaVisual: true,
        consejo: 'La y Si están a la derecha del Sol. Para alcanzarlos, la mano se desliza un poquito a la derecha.',
      },
      {
        id: 'n6-2', titulo: 'Todas las teclas blancas', emoji: '🎹',
        tipo: 'aleatorio', notas: ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5'],
        cantidad: 12, ayudaVisual: false,
        consejo: 'Ocho teclas blancas, de Do a Do. Que se mueva por todo el teclado sin miedo.',
      },
      {
        id: 'n6-3', titulo: 'La escala de Do', emoji: '🪜',
        tipo: 'cancion', ayudaVisual: true,
        notas: ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5',
                'Do5', 'Si4', 'La4', 'Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 3, 2, 1],
        consejo: 'Después del Mi, el pulgar pasa por debajo para tocar el Fa. Al bajar, el dedo 3 cruza por encima del pulgar.',
      },
      {
        id: 'n6-4', titulo: 'Las teclas negras', emoji: '🖤',
        tipo: 'aleatorio', notas: ['Do#4', 'Re#4', 'Fa#4', 'Sol#4', 'La#4'], cantidad: 10, ayudaVisual: true,
        consejo: 'Las teclas negras se llaman sostenidos (♯). Do♯ está justo a la derecha del Do.',
      },
      {
        id: 'n6-5', titulo: 'Estrellita, ¿dónde estás?', emoji: '⭐', premio: true,
        tipo: 'cancion', ayudaVisual: false,
        // "Ah, vous dirai-je, maman", canción tradicional francesa (dominio público).
        notas: ['Do4', 'Do4', 'Sol4', 'Sol4', 'La4', 'La4', 'Sol4',
                'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4', 'Re4', 'Do4',
                'Sol4', 'Sol4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4',
                'Sol4', 'Sol4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Sol4', 'Sol4', 'La4', 'La4', 'Sol4',
                'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4', 'Re4', 'Do4'],
        consejo: 'La canción favorita de los niños. Para el La, el meñique se estira un poquito.',
      },
    ],
  },

  // ───────────────────────── NIVEL 7 ─────────────────────────
  {
    id: 'mundo7',
    titulo: 'Lago de las Dos Manos',
    nivel: 7,
    color: '#c7d2fe',
    lecciones: [
      {
        id: 'n7-1', titulo: 'Pregunta y respuesta', emoji: '💬',
        tipo: 'cancion', ayudaVisual: true,
        mano: 'ambas', registro: true, teclado: DOS_MANOS,
        notas: ['Do4', 'Re4', 'Mi4', 'Do3', 'Re3', 'Mi3',
                'Mi4', 'Re4', 'Do4', 'Mi3', 'Re3', 'Do3'],
        consejo: 'La mano derecha pregunta y la izquierda responde. Las dos manos quedan listas, cada una sobre su Do.',
      },
      {
        id: 'n7-2', titulo: 'El eco', emoji: '🏔️',
        tipo: 'cancion', ayudaVisual: true,
        mano: 'ambas', registro: true, teclado: DOS_MANOS,
        notas: ['Sol4', 'Fa4', 'Mi4', 'Re4', 'Do4', 'Sol3', 'Fa3', 'Mi3', 'Re3', 'Do3',
                'Do4', 'Mi4', 'Sol4', 'Do3', 'Mi3', 'Sol3'],
        consejo: 'Lo que toca la derecha, la izquierda lo repite más grave, como un eco en la montaña.',
      },
      {
        id: 'n7-3', titulo: 'Mary con dos manos', emoji: '🐏',
        tipo: 'cancion', ayudaVisual: false,
        mano: 'ambas', registro: true, teclado: DOS_MANOS,
        notas: ['Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Re3', 'Re3', 'Re3', 'Mi4', 'Sol4', 'Sol4',
                'Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Mi4', 'Re3', 'Re3', 'Mi3', 'Re3', 'Do3'],
        consejo: 'Algunas notas las toca la izquierda. Los círculos con borde de rayitas son de la mano izquierda.',
      },
      {
        id: 'n7-4', titulo: 'Oda a la alegría a dos manos', emoji: '🏆', premio: true,
        tipo: 'cancion', ayudaVisual: false,
        mano: 'ambas', registro: true, teclado: DOS_MANOS,
        notas: ['Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Re4', 'Re4',
                'Mi3', 'Mi3', 'Fa3', 'Sol3', 'Sol3', 'Fa3', 'Mi3', 'Re3',
                'Do3', 'Do3', 'Re3', 'Mi3', 'Re3', 'Do3', 'Do3'],
        consejo: 'La primera frase con la derecha y la respuesta con la izquierda. ¡El gran final del viaje!',
      },
    ],
  },
];

// Todas las lecciones en orden, para saber cuál se desbloquea después de cuál.
export const LECCIONES = MUNDOS.flatMap((m) => m.lecciones);

export function buscarLeccion(id) {
  return LECCIONES.find((l) => l.id === id);
}
