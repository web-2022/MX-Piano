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
//   tiempos: [..]                       (canciones: duración de cada nota, para "Escuchar la canción"
//                                        con acompañamiento. Si falta, todas duran 1 y la última 2)
//   tempo: 90                           (canciones: velocidad al escucharlas; ritmo: pulsos por minuto)
//   subdividir: true                    (ritmo: el metrónomo marca también la mitad del pulso, "ti-ti")
//   compas: 3                           (ritmo: pulsos por compás; por defecto 4)
//
//   dinamica     -> fuerte (f) y suave (p). "notas" + "cantidad" al azar, o "secuencia" fija:
//                   secuencia: [['Do4', 'f'], ['Do4', 'p'], ...]
//                   Al empezar, Ranita pide un Do fuerte y uno suave para conocer el piano.
//   articulacion -> cómo se toca: 'corta' (picado, salta), 'larga' (mantener) o 'ligada'
//                   (la siguiente nota empieza antes de soltar esta). "notas" + "cantidad" + "modo"
//                   ('corta' | 'larga' | 'mezcla'), o "secuencia": [['Do4', 'ligada'], ...]
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
    emoji: '🏝️',
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
    emoji: '⛰️',
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
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
        consejo: '¡La primera canción! Si se pierde, que vuelva a empezar despacio. La app lo espera.',
      },
    ],
  },

  // ───────────────────────── NIVEL 2 ─────────────────────────
  {
    id: 'mundo2',
    emoji: '🌳',
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
        tiempos: [1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 4],
        consejo: 'Su primera canción leída en el pentagrama. Que vaya despacio: la app espera cada nota.',
      },
    ],
  },

  // ───────────────────────── NIVEL 3 ─────────────────────────
  {
    id: 'mundo3',
    emoji: '🌊',
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
    emoji: '🌼',
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
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
        consejo: 'Pueden cantarla juntos mientras toca: "Martinillo, Martinillo, ¿dónde estás?".',
      },
      {
        id: 'n4-2', titulo: 'Mary tenía un corderito', emoji: '🐑',
        tipo: 'cancion', ayudaVisual: true,
        notas: ['Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Re4', 'Re4', 'Re4', 'Mi4', 'Sol4', 'Sol4',
                'Mi4', 'Re4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Mi4',
                'Mi4', 'Re4', 'Re4', 'Mi4', 'Re4', 'Do4'],
        tiempos: [1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
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
        tiempos: [1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 4],
        consejo: 'Empieza con el meñique en Sol. Fíjense que sube y baja como un bote en el agua.',
      },
      {
        id: 'n4-4', titulo: 'Oda a la alegría completa', emoji: '🎶',
        tipo: 'cancion', ayudaVisual: false,
        notas: ['Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Mi4', 'Re4', 'Re4',
                'Mi4', 'Mi4', 'Fa4', 'Sol4', 'Sol4', 'Fa4', 'Mi4', 'Re4',
                'Do4', 'Do4', 'Re4', 'Mi4', 'Re4', 'Do4', 'Do4'],
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2,
                  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
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
        tiempos: [1, 1, 2, 1, 1, 2, 1, 1, 1.5, 0.5, 4,
                  1, 1, 1.5, 0.5, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 2, 2],
        tempo: 110,
        consejo: '¡Muchos Mi seguidos! Que levante el dedo entre cada uno para que el piano suene otra vez.',
      },
    ],
  },

  // ───────────────────────── NIVEL 5 ─────────────────────────
  {
    id: 'mundo5',
    emoji: '🦇',
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
        tiempos: [1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 4],
        consejo: 'La misma canción del Bosque, ahora con la mano izquierda. Suena más grave, como un oso.',
      },
    ],
  },

  // ───────────────────────── NIVEL 6 ─────────────────────────
  {
    id: 'mundo6',
    emoji: '🏔️',
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
        tiempos: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
        consejo: 'La canción favorita de los niños. Para el La, el meñique se estira un poquito.',
      },
    ],
  },

  // ───────────────────────── NIVEL 7 ─────────────────────────
  {
    id: 'mundo7',
    emoji: '🦢',
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
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2,
                  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
        consejo: 'La primera frase con la derecha y la respuesta con la izquierda. ¡El gran final del viaje!',
      },
    ],
  },

  // ───────────────────────── NIVEL 8 ─────────────────────────
  {
    id: 'mundo8',
    emoji: '🐒',
    titulo: 'Selva de las Corcheas',
    nivel: 8,
    color: '#d9f99d',
    lecciones: [
      {
        id: 'n8-1', titulo: 'Corcheas: ti-ti', emoji: '🐇',
        tipo: 'ritmo', tempo: 56, subdividir: true,
        figuras: [['Do4', 1], ['Do4', 1], ['Do4', 0.5], ['Do4', 0.5], ['Do4', 1],
                  ['Re4', 0.5], ['Re4', 0.5], ['Re4', 0.5], ['Re4', 0.5], ['Mi4', 2]],
        consejo: 'Dos corcheas caben en un pulso. Digan juntos: la negra es "ta" y las dos corcheas "ti-ti". Ta, ta, ti-ti, ta.',
      },
      {
        id: 'n8-2', titulo: 'Ta y ti-ti', emoji: '🥕',
        tipo: 'ritmo', tempo: 60, subdividir: true,
        figuras: [['Mi4', 0.5], ['Mi4', 0.5], ['Re4', 1], ['Do4', 0.5], ['Do4', 0.5], ['Re4', 1],
                  ['Mi4', 0.5], ['Mi4', 0.5], ['Mi4', 0.5], ['Mi4', 0.5], ['Re4', 2]],
        consejo: 'Ahora las corcheas van primero. Que levante un poquito el dedo entre las dos corcheas iguales.',
      },
      {
        id: 'n8-3', titulo: 'Negra con puntillo', emoji: '🍎',
        tipo: 'ritmo', tempo: 56, subdividir: true,
        figuras: [['Do4', 1.5], ['Re4', 0.5], ['Mi4', 2], ['Mi4', 1.5], ['Fa4', 0.5], ['Sol4', 2]],
        consejo: 'El puntillo alarga la nota la mitad. La negra con puntillo dura un pulso y medio: "taaa-ti".',
      },
      {
        id: 'n8-4', titulo: 'Blanca con puntillo: tres pulsos', emoji: '🎠',
        tipo: 'ritmo', tempo: 72, compas: 3,
        figuras: [['Do4', 3], ['Mi4', 3], ['Sol4', 3], ['Do4', 3]],
        consejo: 'Contamos de a tres, como un vals: "uno, dos, tres". La blanca con puntillo dura los tres pulsos.',
      },
      {
        id: 'n8-5', titulo: 'Ritmo: Jingle Bells', emoji: '🔔', premio: true,
        tipo: 'ritmo', tempo: 80, subdividir: true,
        // "Jingle Bells" (James Lord Pierpont, 1857, dominio público).
        figuras: [['Mi4', 1], ['Mi4', 1], ['Mi4', 2], ['Mi4', 1], ['Mi4', 1], ['Mi4', 2],
                  ['Mi4', 1], ['Sol4', 1], ['Do4', 1.5], ['Re4', 0.5], ['Mi4', 4]],
        consejo: 'Tiene de todo: negras, blancas, una negra con puntillo y una corchea. El Do es largo y el Re es cortito.',
      },
    ],
  },

  // ───────────────────────── NIVEL 9 ─────────────────────────
  {
    id: 'mundo9',
    emoji: '🏰',
    titulo: 'Castillo del Fuerte y Suave',
    nivel: 9,
    color: '#fed7aa',
    lecciones: [
      {
        id: 'n9-1', titulo: 'El león y el ratón', emoji: '🦁',
        tipo: 'dinamica', notas: ['Do4'], cantidad: 8,
        consejo: 'Fuerte (f) es como un león: dedo firme y rápido. Suave (p) es como un ratoncito: dedo lento y delicado. Al inicio Ranita escucha un Do fuerte y uno suave para conocer su piano.',
      },
      {
        id: 'n9-2', titulo: 'Fuerte y suave con tres notas', emoji: '🐭',
        tipo: 'dinamica', notas: ['Do4', 'Re4', 'Mi4'], cantidad: 10,
        consejo: 'Ahora cambia la nota y también la fuerza. Primero que mire la letra: f = fuerte, p = suave.',
      },
      {
        id: 'n9-3', titulo: 'Gigante y enanito', emoji: '🏔️',
        tipo: 'dinamica',
        secuencia: [['Do4', 'f'], ['Re4', 'f'], ['Mi4', 'f'], ['Do4', 'p'], ['Re4', 'p'], ['Mi4', 'p'],
                    ['Mi4', 'f'], ['Re4', 'f'], ['Do4', 'f'], ['Mi4', 'p'], ['Re4', 'p'], ['Do4', 'p']],
        consejo: 'Tres pasos de gigante (fuerte) y tres de enanito (suave). Pueden pisar fuerte y suave en el suelo antes de tocar.',
      },
      {
        id: 'n9-4', titulo: 'Martinillo con eco', emoji: '🔔', premio: true,
        tipo: 'dinamica',
        // "Frère Jacques", canción tradicional (dominio público). Cada frase fuerte y su eco suave.
        secuencia: [['Do4', 'f'], ['Re4', 'f'], ['Mi4', 'f'], ['Do4', 'f'],
                    ['Do4', 'p'], ['Re4', 'p'], ['Mi4', 'p'], ['Do4', 'p'],
                    ['Mi4', 'f'], ['Fa4', 'f'], ['Sol4', 'f'],
                    ['Mi4', 'p'], ['Fa4', 'p'], ['Sol4', 'p']],
        consejo: 'Cada frase se toca fuerte y se repite suave, como el eco de una campana lejana.',
      },
    ],
  },

  // ───────────────────────── NIVEL 10 ─────────────────────────
  {
    id: 'mundo10',
    emoji: '💧',
    titulo: 'Charco Saltarín',
    nivel: 10,
    color: '#99f6e4',
    lecciones: [
      {
        id: 'n10-1', titulo: 'Picado: notas que saltan', emoji: '🏀',
        tipo: 'articulacion', modo: 'corta', notas: ['Do4', 'Re4', 'Mi4'], cantidad: 8,
        consejo: 'Picado (staccato) es tocar y soltar enseguida, como si la tecla quemara o como una pelota que rebota. El puntito debajo de la nota significa "corta".',
      },
      {
        id: 'n10-2', titulo: 'Notas largas', emoji: '🐍',
        tipo: 'articulacion', modo: 'larga', notas: ['Do4', 'Mi4', 'Sol4'], cantidad: 6,
        consejo: 'Ahora al revés: tocar y mantener la tecla hasta que el círculo se llene. La rayita sobre la nota significa "larga".',
      },
      {
        id: 'n10-3', titulo: 'Cortas y largas', emoji: '🐸',
        tipo: 'articulacion', modo: 'mezcla', notas: ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4'], cantidad: 10,
        consejo: 'Se mezclan: puntito = corta y salta, rayita = larga y se mantiene.',
      },
      {
        id: 'n10-4', titulo: 'Ligado: dedos pegaditos', emoji: '🐛',
        tipo: 'articulacion',
        secuencia: [['Do4', 'ligada'], ['Re4', 'ligada'], ['Mi4', 'ligada'], ['Fa4', 'ligada'], ['Sol4', 'larga'],
                    ['Sol4', 'ligada'], ['Fa4', 'ligada'], ['Mi4', 'ligada'], ['Re4', 'ligada'], ['Do4', 'larga']],
        consejo: 'Ligado (legato) es pasar de una nota a otra sin silencio: el dedo nuevo baja y recién entonces sube el anterior, como un gusanito que camina.',
      },
      {
        id: 'n10-5', titulo: 'Oda picada y ligada', emoji: '🏆', premio: true,
        tipo: 'articulacion',
        secuencia: [['Mi4', 'ligada'], ['Mi4', 'corta'], ['Fa4', 'ligada'], ['Sol4', 'corta'],
                    ['Sol4', 'ligada'], ['Fa4', 'ligada'], ['Mi4', 'ligada'], ['Re4', 'corta'],
                    ['Do4', 'corta'], ['Do4', 'corta'], ['Re4', 'corta'], ['Mi4', 'corta'],
                    ['Mi4', 'ligada'], ['Re4', 'ligada'], ['Re4', 'larga']],
        consejo: 'La Oda a la alegría con picado y ligado. Arcos = ligado, puntitos = picado. ¡El gran final del Charco Saltarín!',
      },
    ],
  },
];

// ───────────────────────── PARQUE DE JUEGOS ─────────────────────────
// Mini-juegos para practicar lo aprendido. No bloquean el viaje: cada uno se abre
// cuando se gana al menos una estrella en la lección indicada en "requiere".
//
// TIPOS DE JUEGO
//   atrapa   -> pasan moscas con una nota; al tocarla, Ranita la atrapa con la lengua.
//               cantidad: moscas · velocidad: ms que tarda una mosca en cruzar
//   eco      -> Ranita toca unas notas y el niño las repite (oído y memoria).
//               rondas: cuántas notas tiene cada ronda · soloOido: true = sin colores ni nombres
//   carrera  -> Ranita corre contra el caracol: cada nota correcta es un salto.
//               meta: saltos para llegar · tiempo: segundos que tarda el caracol
export const JUEGOS = [
  {
    id: 'j-moscas-1', titulo: 'Atrapa moscas', emoji: '🪰', requiere: 'n1-2',
    tipo: 'atrapa', notas: ['Do4', 'Re4', 'Mi4'], cantidad: 8, velocidad: 9000, ayudaVisual: true,
    consejo: 'Cada mosca lleva una nota. Si la toca antes de que llegue al otro lado, Ranita se la come. ¡Sin apuro!',
  },
  {
    id: 'j-eco-1', titulo: 'El eco de Ranita', emoji: '🦜', requiere: 'n1-2',
    tipo: 'eco', notas: ['Do4', 'Re4', 'Mi4'], rondas: [2, 2, 3, 3, 3],
    consejo: 'Ranita toca unas notas y el niño las repite igualito. Entrena el oído y la memoria.',
  },
  {
    id: 'j-carrera-1', titulo: 'Carrera con el caracol', emoji: '🐌', requiere: 'n1-4',
    tipo: 'carrera', notas: CINCO_DERECHA, meta: 10, tiempo: 45, ayudaVisual: false,
    consejo: 'Cada nota correcta es un salto de Ranita. ¿Le gana al caracol? Mejor despacio y bien que rápido y mal.',
  },
  {
    id: 'j-moscas-2', titulo: 'Moscas de las 5 notas', emoji: '🐸', requiere: 'n1-5',
    tipo: 'atrapa', notas: CINCO_DERECHA, cantidad: 10, velocidad: 8000, ayudaVisual: false,
    consejo: 'Ahora con las cinco notas y sin ayuda en la pantalla.',
  },
  {
    id: 'j-eco-2', titulo: 'Eco solo con el oído', emoji: '👂', requiere: 'n2-5',
    tipo: 'eco', notas: ['Do4', 'Re4', 'Mi4'], rondas: [2, 2, 3, 3, 3], soloOido: true,
    consejo: 'Ya no se ven los colores: solo se escucha. Puede tocar varias veces hasta encontrar la nota de Ranita.',
  },
  {
    id: 'j-moscas-3', titulo: 'Moscas en el pentagrama', emoji: '🎼', requiere: 'n2-4',
    tipo: 'atrapa', vista: 'pentagrama', clave: 'sol', colores: false, mostrarNombre: false,
    notas: CINCO_DERECHA, cantidad: 10, velocidad: 10000, ayudaVisual: false,
    consejo: 'Las moscas llevan la nota escrita en el pentagrama. Hay que leerla para atraparla.',
  },
  {
    id: 'j-carrera-2', titulo: 'Gran carrera del teclado', emoji: '🏁', requiere: 'n6-2',
    tipo: 'carrera', notas: ['Do4', 'Re4', 'Mi4', 'Fa4', 'Sol4', 'La4', 'Si4', 'Do5'], meta: 14, tiempo: 50,
    ayudaVisual: false,
    consejo: 'Todas las teclas blancas. Que mire la nota y busque con calma.',
  },
];

// Todas las lecciones en orden, para saber cuál se desbloquea después de cuál.
export const LECCIONES = MUNDOS.flatMap((m) => m.lecciones);

export function buscarLeccion(id) {
  return LECCIONES.find((l) => l.id === id) || JUEGOS.find((l) => l.id === id);
}
