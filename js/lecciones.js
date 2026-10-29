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
//   posicion: 'Sol4'                    (posición de cinco dedos: el pulgar en esa nota; da los dedos solo)
//   bemoles: true                       (las teclas negras se llaman Si♭, Mi♭... en vez de La♯, Re♯...)
//   armadura: 'sol' | 'fa' | 're' | 'sib'  (pentagrama: Fa♯, Si♭, Fa♯ y Do♯, o Si♭ y Mi♭ al inicio)
//   tonalidad: 'sol' | 'fa' | 're' | 'sib' | 'lam' | 'rem'  (acompañamiento en esa tonalidad; 'lam' = La menor)
//   pedal: true                         (lección que se toca con pedal: se juzga lo que acaba de sonar)
//   sinAcompanamiento: true             (escuchar la canción sin acordes, por ejemplo si está en menor)
//   pulso: 1.5                          (ritmo: cada cuántas negras suena el clic; 1,5 en 6/8 y 3/8)
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
//   acordes      -> varias notas al mismo tiempo (una mano o las dos). "acordes" es la lista:
//                   [['Do4', 'Mi4'], { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do mayor' }, ...]
//                   Con "cantidad", se eligen al azar de la lista; sin ella, van en orden.
//                   Una mano: vale en cualquier octava. Con mano: 'ambas', cada nota en su lugar.
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
    etapa: '🐣 Etapa 1 · Pianito',
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

  // ───────────────────────── NIVEL 11 ─────────────────────────
  {
    id: 'mundo11',
    etapa: '🚀 Etapa 2 · Explorador',
    emoji: '🗼',
    titulo: 'Torre de los Acordes',
    nivel: 11,
    color: '#e9d5ff',
    lecciones: [
      {
        id: 'n11-1', titulo: 'Dos notas juntas', emoji: '🤝',
        tipo: 'acordes', acordes: [['Do4', 'Mi4'], ['Do4', 'Mi4'], ['Re4', 'Fa4'], ['Re4', 'Fa4'], ['Mi4', 'Sol4'], ['Mi4', 'Sol4']],
        consejo: 'Dos dedos bajan al mismo tiempo, como si saltaran juntos. Do y Mi: dedos 1 y 3. Re y Fa: dedos 2 y 4. Mi y Sol: dedos 3 y 5.',
      },
      {
        id: 'n11-2', titulo: 'Terceras y quintas', emoji: '🪜',
        tipo: 'acordes', cantidad: 8,
        acordes: [['Do4', 'Mi4'], ['Re4', 'Fa4'], ['Mi4', 'Sol4'], ['Do4', 'Sol4']],
        consejo: 'Una tercera salta una tecla (Do-Mi). Una quinta abre toda la mano, del pulgar al meñique (Do-Sol).',
      },
      {
        id: 'n11-3', titulo: 'El acorde de Do', emoji: '🏠',
        tipo: 'acordes', acordes: Array(6).fill({ notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do mayor' }),
        consejo: 'Tres notas juntas forman un acorde. Dedos 1, 3 y 5 bajan a la vez. Que los dedos estén curvos, como sosteniendo una pelotita.',
      },
      {
        id: 'n11-4', titulo: 'Los acordes Do, Fa y Sol', emoji: '🎢', ayudaVisual: true, teclado: [55, 72],
        tipo: 'acordes', cantidad: 9,
        acordes: [
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do mayor' },
          { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa mayor' },
          { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol mayor' },
        ],
        consejo: 'Con estos tres acordes se acompañan cientos de canciones. Para Fa, el pulgar se queda en Do y los otros dedos suben. Para Sol, el pulgar baja a Si.',
      },
      {
        id: 'n11-5', mano: 'ambas', titulo: 'Las dos manos juntas', emoji: '🤲', teclado: [48, 72],
        tipo: 'acordes',
        acordes: [['Do3', 'Do4'], ['Do3', 'Mi4'], ['Do3', 'Sol4'], ['Sol3', 'Sol4'], ['Sol3', 'Re4'], ['Do3', 'Do4']],
        consejo: 'La mano izquierda toca su nota y la derecha la suya, al mismo tiempo. Pueden contar "una, dos, ¡ya!" para bajar juntas.',
      },
      {
        id: 'n11-6', mano: 'ambas', titulo: 'Estrellita con bajo', emoji: '🌟', premio: true, teclado: [48, 72],
        tipo: 'acordes',
        // "Ah, vous dirai-je, maman", canción tradicional (dominio público). La izquierda pone el bajo.
        acordes: [['Do3', 'Do4'], ['Do4'], ['Sol4'], ['Sol4'], ['Fa3', 'La4'], ['La4'], ['Do3', 'Sol4'],
                  ['Fa3', 'Fa4'], ['Fa4'], ['Do3', 'Mi4'], ['Mi4'], ['Sol3', 'Re4'], ['Re4'], ['Do3', 'Do4']],
        consejo: 'La derecha toca la melodía y, en algunas notas, la izquierda toca a la vez un bajo. ¡Suena como una orquesta!',
      },
    ],
  },

  // ═════════════════════════ ETAPA 2 · EXPLORADOR ═════════════════════════

  // ───────────────────────── NIVEL 12 ─────────────────────────
  {
    id: 'mundo12',
    emoji: '🌄',
    titulo: 'Valle del Sol',
    nivel: 12,
    color: '#fef08a',
    lecciones: [
      {
        id: 'n12-1', titulo: 'La posición de Sol', emoji: '🖐️',
        tipo: 'aleatorio', notas: ['Sol4', 'La4', 'Si4', 'Do5', 'Re5'], cantidad: 10, ayudaVisual: true,
        posicion: 'Sol4', teclado: [60, 76],
        consejo: 'La mano se muda: el pulgar va a Sol y cada dedo tiene su tecla hasta Re. Las notas son nuevas para los dedos, aunque los nombres ya los conoce.',
      },
      {
        id: 'n12-2', titulo: 'Sol a Re sin ayuda', emoji: '👀',
        tipo: 'aleatorio', notas: ['Sol4', 'La4', 'Si4', 'Do5', 'Re5'], cantidad: 12, ayudaVisual: false,
        posicion: 'Sol4', teclado: [60, 76],
        consejo: 'Sin ayuda en la pantalla. Si duda, que piense en el número del dedo: Sol = 1, La = 2, Si = 3, Do = 4, Re = 5.',
      },
      {
        id: 'n12-3', titulo: 'Fa sostenido', emoji: '♯',
        tipo: 'aleatorio', notas: ['Fa#4', 'Sol4', 'La4', 'Mi4'], cantidad: 10, ayudaVisual: true, teclado: [60, 76],
        consejo: 'Fa♯ es la tecla negra justo a la derecha de Fa. En la tonalidad de Sol todos los Fa son Fa♯, por eso se escribe una sola vez al inicio del pentagrama: es la armadura.',
      },
      {
        id: 'n12-4', titulo: 'Leer en Sol mayor', emoji: '🎼',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', armadura: 'sol', colores: true, mostrarNombre: false,
        notas: ['Fa#4', 'Sol4', 'La4', 'Si4', 'Do5', 'Re5'], cantidad: 12, ayudaVisual: false, teclado: [60, 76],
        consejo: 'El ♯ al inicio, sobre la línea de Fa, avisa que todos los Fa se tocan Fa♯ aunque la nota no lo diga.',
      },
      {
        id: 'n12-5', titulo: 'Oda a la alegría en Sol', emoji: '🏆', premio: true,
        tipo: 'cancion', ayudaVisual: false, posicion: 'Sol4', teclado: [60, 76], tonalidad: 'sol',
        notas: ['Si4', 'Si4', 'Do5', 'Re5', 'Re5', 'Do5', 'Si4', 'La4', 'Sol4', 'Sol4', 'La4', 'Si4', 'Si4', 'La4', 'La4'],
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
        consejo: 'La misma canción, ahora en la posición de Sol: suena más aguda, pero los dedos se mueven igual que en Do.',
      },
    ],
  },

  // ───────────────────────── NIVEL 13 ─────────────────────────
  {
    id: 'mundo13',
    emoji: '🍂',
    titulo: 'Bosque del Bemol',
    nivel: 13,
    color: '#fdba74',
    lecciones: [
      {
        id: 'n13-1', titulo: 'La posición de Fa', emoji: '🖐️', bemoles: true,
        tipo: 'aleatorio', notas: ['Fa4', 'Sol4', 'La4', 'Do5'], cantidad: 10, ayudaVisual: true,
        posicion: 'Fa4', teclado: [60, 76],
        consejo: 'El pulgar va a Fa. Fa = 1, Sol = 2, La = 3, el dedo 4 espera y Do = 5.',
      },
      {
        id: 'n13-2', titulo: 'Si bemol', emoji: '♭', bemoles: true,
        tipo: 'aleatorio', notas: ['La4', 'Sib4', 'Do5', 'Sol4'], cantidad: 10, ayudaVisual: true,
        posicion: 'Fa4', teclado: [60, 76],
        consejo: 'Si♭ es la tecla negra justo a la izquierda de Si. El bemol (♭) baja la nota medio tono. En la posición de Fa la toca el dedo 4.',
      },
      {
        id: 'n13-3', titulo: 'Leer en Fa mayor', emoji: '🎼', bemoles: true,
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', armadura: 'fa', colores: true, mostrarNombre: false,
        notas: ['Fa4', 'Sol4', 'La4', 'Sib4', 'Do5'], cantidad: 12, ayudaVisual: false, posicion: 'Fa4', teclado: [60, 76],
        consejo: 'El ♭ al inicio, en la línea del medio, avisa que todos los Si se tocan Si♭.',
      },
      {
        id: 'n13-4', titulo: 'Acordes de Fa, Si♭ y Do', emoji: '🎹', bemoles: true, ayudaVisual: true,
        tipo: 'acordes', cantidad: 9, teclado: [60, 76],
        acordes: [
          { notas: ['Fa4', 'La4', 'Do5'], nombre: 'Fa mayor' },
          { notas: ['Fa4', 'Sib4', 'Re5'], nombre: 'Si♭ mayor' },
          { notas: ['Mi4', 'Sol4', 'Do5'], nombre: 'Do mayor' },
        ],
        consejo: 'Los tres acordes de la tonalidad de Fa, con la mano casi quieta: el pulgar se queda en Fa para los dos primeros y baja a Mi para el de Do.',
      },
      {
        id: 'n13-5', titulo: 'Estrellita en Fa', emoji: '🌟', premio: true, bemoles: true,
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 76], tonalidad: 'fa',
        notas: ['Fa4', 'Fa4', 'Do5', 'Do5', 'Re5', 'Re5', 'Do5',
                'Sib4', 'Sib4', 'La4', 'La4', 'Sol4', 'Sol4', 'Fa4',
                'Do5', 'Do5', 'Sib4', 'Sib4', 'La4', 'La4', 'Sol4',
                'Do5', 'Do5', 'Sib4', 'Sib4', 'La4', 'La4', 'Sol4',
                'Fa4', 'Fa4', 'Do5', 'Do5', 'Re5', 'Re5', 'Do5',
                'Sib4', 'Sib4', 'La4', 'La4', 'Sol4', 'Sol4', 'Fa4'],
        tiempos: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2,
                  1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
        consejo: 'Estrellita empezando en Fa. Hay un Si♭ en cada frase: que lo busque antes de empezar.',
      },
    ],
  },

  // ───────────────────────── NIVEL 14 ─────────────────────────
  {
    id: 'mundo14',
    emoji: '🪜',
    titulo: 'Escalera de las Escalas',
    nivel: 14,
    color: '#c7d2fe',
    lecciones: [
      {
        id: 'n14-1', titulo: 'Escala de Do con la izquierda', emoji: '👈',
        tipo: 'cancion', ayudaVisual: true, mano: 'izquierda', registro: true, teclado: [48, 72],
        notas: ['Do3', 'Re3', 'Mi3', 'Fa3', 'Sol3', 'La3', 'Si3', 'Do4', 'Si3', 'La3', 'Sol3', 'Fa3', 'Mi3', 'Re3', 'Do3'],
        dedos: [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5],
        consejo: 'Con la izquierda, al subir el dedo 3 cruza por encima del pulgar después de Sol. Al bajar, el pulgar pasa por debajo después de La.',
      },
      {
        id: 'n14-2', titulo: 'Escala de Sol mayor', emoji: '🌄',
        tipo: 'cancion', ayudaVisual: true, teclado: [60, 79], tonalidad: 'sol',
        notas: ['Sol4', 'La4', 'Si4', 'Do5', 'Re5', 'Mi5', 'Fa#5', 'Sol5', 'Fa#5', 'Mi5', 'Re5', 'Do5', 'Si4', 'La4', 'Sol4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1],
        consejo: 'Los mismos dedos que la escala de Do, empezando en Sol. Ojo: la séptima nota es Fa♯, la tecla negra.',
      },
      {
        id: 'n14-3', titulo: 'Escala de Fa mayor', emoji: '🍂', bemoles: true,
        tipo: 'cancion', ayudaVisual: true, teclado: [60, 77], tonalidad: 'fa',
        notas: ['Fa4', 'Sol4', 'La4', 'Sib4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Mi5', 'Re5', 'Do5', 'Sib4', 'La4', 'Sol4', 'Fa4'],
        dedos: [1, 2, 3, 4, 1, 2, 3, 4, 3, 2, 1, 4, 3, 2, 1],
        consejo: 'La escala de Fa tiene su propia digitación: 1-2-3-4 y el pulgar pasa a Do. Así el dedo 4 queda siempre sobre Si♭.',
      },
      {
        id: 'n14-4', titulo: 'Escala de Do con ritmo', emoji: '🏃',
        tipo: 'ritmo', tempo: 66, subdividir: true,
        figuras: [['Do4', 0.5], ['Re4', 0.5], ['Mi4', 0.5], ['Fa4', 0.5], ['Sol4', 0.5], ['La4', 0.5], ['Si4', 0.5], ['Do5', 0.5],
                  ['Si4', 0.5], ['La4', 0.5], ['Sol4', 0.5], ['Fa4', 0.5], ['Mi4', 0.5], ['Re4', 0.5], ['Do4', 1]],
        consejo: 'La escala en corcheas: dos notas por cada clic, parejas como un tren. Primero lento y parejo; la velocidad llega sola.',
      },
      {
        id: 'n14-5', titulo: 'Leer la escala de Sol', emoji: '🏆', premio: true,
        tipo: 'cancion', vista: 'pentagrama', clave: 'sol', armadura: 'sol', colores: false, mostrarNombre: false,
        ayudaVisual: false, teclado: [60, 79], tonalidad: 'sol',
        notas: ['Sol4', 'La4', 'Si4', 'Do5', 'Re5', 'Mi5', 'Fa#5', 'Sol5', 'Re5', 'Si4', 'Sol4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 3, 2, 1],
        consejo: 'En partitura de verdad, en blanco y negro. El Fa no lleva ♯ escrito: lo dice la armadura.',
      },
    ],
  },

  // ───────────────────────── NIVEL 15 ─────────────────────────
  {
    id: 'mundo15',
    emoji: '🌈',
    titulo: 'Cascada de Arpegios',
    nivel: 15,
    color: '#a7f3d0',
    lecciones: [
      {
        id: 'n15-1', titulo: 'Arpegio de Do', emoji: '🌈',
        tipo: 'cancion', ayudaVisual: true, teclado: [60, 72],
        notas: ['Do4', 'Mi4', 'Sol4', 'Do5', 'Sol4', 'Mi4', 'Do4', 'Mi4', 'Sol4', 'Do5', 'Sol4', 'Mi4', 'Do4'],
        dedos: [1, 2, 3, 5, 3, 2, 1, 2, 3, 5, 3, 2, 1],
        consejo: 'Un arpegio es un acorde tocado nota por nota, como una cascada. La mano se abre un poco para llegar al Do de arriba con el meñique.',
      },
      {
        id: 'n15-2', titulo: 'Arpegios de Do, Fa y Sol', emoji: '💧',
        tipo: 'cancion', ayudaVisual: true, teclado: [55, 72],
        notas: ['Do4', 'Mi4', 'Sol4', 'Mi4', 'Do4', 'Fa4', 'La4', 'Fa4', 'Si3', 'Re4', 'Sol4', 'Re4', 'Do4', 'Mi4', 'Sol4', 'Do5'],
        tiempos: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 2],
        consejo: 'Los tres acordes que ya conoce, ahora en cascada. Fíjense que el pulgar casi no se mueve.',
      },
      {
        id: 'n15-3', titulo: 'Bajo Alberti', emoji: '🎠',
        tipo: 'cancion', ayudaVisual: true, mano: 'izquierda', registro: true, teclado: [48, 72], tempo: 120,
        notas: ['Do3', 'Sol3', 'Mi3', 'Sol3', 'Do3', 'Sol3', 'Mi3', 'Sol3',
                'Re3', 'Sol3', 'Fa3', 'Sol3', 'Re3', 'Sol3', 'Fa3', 'Sol3',
                'Do3', 'Sol3', 'Mi3', 'Sol3', 'Do3'],
        tiempos: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        dedos: [5, 1, 3, 1, 5, 1, 3, 1, 4, 1, 2, 1, 4, 1, 2, 1, 5, 1, 3, 1, 5],
        consejo: 'Abajo, arriba, medio, arriba: el famoso acompañamiento de Mozart. La izquierda dibuja el acorde mientras la derecha cantaría la melodía.',
      },
      {
        id: 'n15-4', titulo: 'Acordes con la izquierda', emoji: '✋', ayudaVisual: true,
        tipo: 'acordes', cantidad: 9, teclado: [43, 67],
        acordes: [
          { notas: ['Do3', 'Mi3', 'Sol3'], nombre: 'Do mayor' },
          { notas: ['Do3', 'Fa3', 'La3'], nombre: 'Fa mayor' },
          { notas: ['Si2', 'Re3', 'Sol3'], nombre: 'Sol mayor' },
        ],
        consejo: 'Los acordes de Do, Fa y Sol con la mano izquierda: meñique, dedo 3 y pulgar. Es la base para acompañar canciones.',
      },
      {
        id: 'n15-5', titulo: 'Arpegios con ritmo', emoji: '🏆', premio: true,
        tipo: 'ritmo', tempo: 60, subdividir: true, teclado: [55, 72],
        figuras: [['Do4', 0.5], ['Mi4', 0.5], ['Sol4', 0.5], ['Mi4', 0.5],
                  ['Do4', 0.5], ['Fa4', 0.5], ['La4', 0.5], ['Fa4', 0.5],
                  ['Si3', 0.5], ['Re4', 0.5], ['Sol4', 0.5], ['Re4', 0.5],
                  ['Do4', 0.5], ['Mi4', 0.5], ['Sol4', 1]],
        consejo: 'Los arpegios en corcheas, parejitos con el "ti-ti" del metrónomo.',
      },
    ],
  },

  // ───────────────────────── NIVEL 16 ─────────────────────────
  {
    id: 'mundo16',
    emoji: '🎻',
    titulo: 'Puente de las Dos Manos',
    nivel: 16,
    color: '#fecdd3',
    lecciones: [
      {
        id: 'n16-1', titulo: 'Martinillo con bordón', emoji: '🔔', mano: 'ambas',
        tipo: 'acordes', teclado: [48, 72],
        acordes: [['Do3', 'Sol3', 'Do4'], ['Re4'], ['Mi4'], ['Do4'], ['Do3', 'Sol3', 'Do4'], ['Re4'], ['Mi4'], ['Do4'],
                  ['Do3', 'Sol3', 'Mi4'], ['Fa4'], ['Sol4'], ['Do3', 'Sol3', 'Mi4'], ['Fa4'], ['Sol4']],
        consejo: 'El bordón es una quinta (Do-Sol) que la izquierda toca al comienzo de cada frase, como una gaita. La derecha sigue con la melodía.',
      },
      {
        id: 'n16-2', titulo: 'Mary con bajo', emoji: '🐑', mano: 'ambas',
        tipo: 'acordes', teclado: [48, 72],
        acordes: [['Do3', 'Mi4'], ['Re4'], ['Do4'], ['Re4'], ['Do3', 'Mi4'], ['Mi4'], ['Mi4'],
                  ['Sol3', 'Re4'], ['Re4'], ['Re4'], ['Do3', 'Mi4'], ['Sol4'], ['Sol4'],
                  ['Do3', 'Mi4'], ['Re4'], ['Do4'], ['Re4'], ['Do3', 'Mi4'], ['Mi4'], ['Mi4'], ['Mi4'],
                  ['Sol3', 'Re4'], ['Re4'], ['Mi4'], ['Re4'], ['Do3', 'Do4']],
        consejo: 'La izquierda toca un bajo al comienzo de cada compás: Do cuando la canción "está en casa" y Sol cuando "se va de paseo".',
      },
      {
        id: 'n16-3', titulo: 'Oda con bajo', emoji: '🎶', mano: 'ambas',
        tipo: 'acordes', teclado: [48, 72],
        acordes: [['Do3', 'Mi4'], ['Mi4'], ['Fa4'], ['Sol4'], ['Re3', 'Sol4'], ['Fa4'], ['Mi4'], ['Re4'],
                  ['Mi3', 'Do4'], ['Do4'], ['Re4'], ['Mi4'], ['Do3', 'Mi4'], ['Sol3', 'Re4'], ['Re4']],
        consejo: 'Cada bajo cae junto con la primera nota del compás. Si cuesta, primero que toque solo la izquierda mientras el adulto canta la melodía.',
      },
      {
        id: 'n16-4', titulo: 'Jingle Bells a dos manos', emoji: '🏆', premio: true, mano: 'ambas',
        tipo: 'acordes', teclado: [48, 72],
        acordes: [['Do3', 'Mi4'], ['Mi4'], ['Mi4'], ['Do3', 'Mi4'], ['Mi4'], ['Mi4'],
                  ['Do3', 'Mi4'], ['Sol4'], ['Do4'], ['Re4'], ['Do3', 'Mi4'],
                  ['La3', 'Fa4'], ['Fa4'], ['Fa4'], ['Fa4'], ['Fa4'], ['Do3', 'Mi4'], ['Mi4'], ['Mi4'],
                  ['Mi4'], ['Sol3', 'Re4'], ['Re4'], ['Mi4'], ['Sol3', 'Re4'], ['Sol4']],
        consejo: '¡La canción completa con bajo! Cuando la izquierda baja a La, la derecha está en Fa.',
      },
    ],
  },

  // ───────────────────────── NIVEL 17 ─────────────────────────
  {
    id: 'mundo17',
    emoji: '🐝',
    titulo: 'Colmena de Semicorcheas',
    nivel: 17,
    color: '#fde047',
    lecciones: [
      {
        id: 'n17-1', titulo: 'Semicorcheas: ti-ri-ti-ri', emoji: '🐝',
        tipo: 'ritmo', tempo: 50, subdividir: true,
        figuras: [['Do4', 1], ['Do4', 1], ['Do4', 0.25], ['Do4', 0.25], ['Do4', 0.25], ['Do4', 0.25], ['Do4', 1],
                  ['Re4', 0.25], ['Re4', 0.25], ['Re4', 0.25], ['Re4', 0.25], ['Re4', 1],
                  ['Mi4', 0.25], ['Mi4', 0.25], ['Mi4', 0.25], ['Mi4', 0.25], ['Mi4', 1]],
        consejo: 'Cuatro semicorcheas caben en un pulso: "ti-ri-ti-ri". Para repetir la misma nota rápido, conviene alternar dedos: 3-2-3-2.',
      },
      {
        id: 'n17-2', titulo: 'Corcheas y semicorcheas', emoji: '🍯',
        tipo: 'ritmo', tempo: 52, subdividir: true,
        figuras: [['Do4', 0.5], ['Re4', 0.5], ['Mi4', 0.25], ['Re4', 0.25], ['Do4', 0.25], ['Re4', 0.25], ['Mi4', 0.5], ['Mi4', 0.5], ['Re4', 1],
                  ['Mi4', 0.25], ['Fa4', 0.25], ['Sol4', 0.25], ['Fa4', 0.25], ['Mi4', 0.5], ['Re4', 0.5], ['Do4', 2]],
        consejo: 'Se mezclan "ti-ti" y "ti-ri-ti-ri". Que diga las sílabas en voz alta antes de tocar.',
      },
      {
        id: 'n17-3', titulo: 'Tresillos: tri-o-la', emoji: '🍀',
        tipo: 'ritmo', tempo: 54,
        figuras: [['Do4', 1], ['Do4', 1 / 3], ['Re4', 1 / 3], ['Mi4', 1 / 3], ['Fa4', 1], ['Mi4', 1 / 3], ['Re4', 1 / 3], ['Do4', 1 / 3],
                  ['Re4', 1 / 3], ['Mi4', 1 / 3], ['Fa4', 1 / 3], ['Sol4', 1 / 3], ['Fa4', 1 / 3], ['Mi4', 1 / 3], ['Do4', 2]],
        consejo: 'Un tresillo son tres notas iguales en un pulso: "tri-o-la". El 3 encima de las notas lo avisa.',
      },
      {
        id: 'n17-4', titulo: 'Corchea con puntillo', emoji: '🐎',
        tipo: 'ritmo', tempo: 56, subdividir: true,
        figuras: [['Do4', 0.75], ['Re4', 0.25], ['Mi4', 0.75], ['Fa4', 0.25], ['Sol4', 2],
                  ['Sol4', 0.75], ['Fa4', 0.25], ['Mi4', 0.75], ['Re4', 0.25], ['Do4', 2]],
        consejo: 'Larga-cortita, como un caballito al galope: "taaa-ri, taaa-ri".',
      },
      {
        id: 'n17-5', titulo: 'Ritmo: Para Elisa', emoji: '🏆', premio: true,
        tipo: 'ritmo', tempo: 36, pulso: 1.5, compas: 1.5, teclado: [60, 77],
        // "Para Elisa", Ludwig van Beethoven (1810), dominio público. Comienzo del tema, en 3/8.
        figuras: [[null, 1], ['Mi5', 0.25], ['Re#5', 0.25],
                  ['Mi5', 0.25], ['Re#5', 0.25], ['Mi5', 0.25], ['Si4', 0.25], ['Re5', 0.25], ['Do5', 0.25],
                  ['La4', 0.5], [null, 0.25], ['Do4', 0.25], ['Mi4', 0.25], ['La4', 0.25],
                  ['Si4', 0.5], [null, 0.25], ['Mi4', 0.25], ['Sol#4', 0.25], ['Si4', 0.25],
                  ['Do5', 0.5], [null, 1]],
        consejo: 'El comienzo de una de las piezas más famosas del mundo, con su ritmo de verdad. Primero que la aprenda en el Gran Teatro sin metrónomo.',
      },
    ],
  },

  // ───────────────────────── NIVEL 18 ─────────────────────────
  {
    id: 'mundo18',
    emoji: '🛶',
    titulo: 'Barca del Seis por Ocho',
    nivel: 18,
    color: '#bae6fd',
    lecciones: [
      {
        id: 'n18-1', titulo: 'Seis por ocho: el balanceo', emoji: '🌊',
        tipo: 'ritmo', tempo: 46, pulso: 1.5, compas: 3,
        figuras: [['Do4', 1.5], ['Mi4', 1.5], ['Sol4', 1.5], ['Mi4', 1.5],
                  ['Do4', 0.5], ['Re4', 0.5], ['Mi4', 0.5], ['Fa4', 0.5], ['Mi4', 0.5], ['Re4', 0.5], ['Do4', 3]],
        consejo: 'En 6/8 se cuentan dos pulsos que se balancean, como una barca: "UNO-dos-tres, DOS-dos-tres". Cada pulso tiene tres corcheas.',
      },
      {
        id: 'n18-2', titulo: 'Larga-corta en 6/8', emoji: '🐬',
        tipo: 'ritmo', tempo: 48, pulso: 1.5, compas: 3,
        figuras: [['Do4', 1], ['Re4', 0.5], ['Mi4', 1], ['Fa4', 0.5], ['Sol4', 1], ['Mi4', 0.5], ['Do4', 1.5],
                  ['Re4', 1], ['Mi4', 0.5], ['Fa4', 1], ['Re4', 0.5], ['Do4', 3]],
        consejo: 'Negra y corchea: "taa-ti, taa-ti", como un columpio.',
      },
      {
        id: 'n18-3', titulo: 'Rema, rema tu barquito', emoji: '🏆', premio: true,
        tipo: 'ritmo', tempo: 44, pulso: 1.5, compas: 3,
        // "Row, Row, Row Your Boat", canción tradicional (dominio público).
        figuras: [['Do4', 1.5], ['Do4', 1.5], ['Do4', 1], ['Re4', 0.5], ['Mi4', 1.5],
                  ['Mi4', 1], ['Re4', 0.5], ['Mi4', 1], ['Fa4', 0.5], ['Sol4', 3],
                  ['Do5', 0.5], ['Do5', 0.5], ['Do5', 0.5], ['Sol4', 0.5], ['Sol4', 0.5], ['Sol4', 0.5],
                  ['Mi4', 0.5], ['Mi4', 0.5], ['Mi4', 0.5], ['Do4', 0.5], ['Do4', 0.5], ['Do4', 0.5],
                  ['Sol4', 1], ['Fa4', 0.5], ['Mi4', 1], ['Re4', 0.5], ['Do4', 3]],
        consejo: 'Una canción entera en 6/8. En la parte de "do-do-do, sol-sol-sol" van tres corcheas por pulso: que levante el dedo entre cada una.',
      },
    ],
  },

  // ───────────────────────── NIVEL 19 ─────────────────────────
  {
    id: 'mundo19',
    emoji: '🌊',
    titulo: 'Ola del Crescendo',
    nivel: 19,
    color: '#bfdbfe',
    lecciones: [
      {
        id: 'n19-1', titulo: 'Crescendo: cada vez más fuerte', emoji: '📈',
        tipo: 'dinamica',
        secuencia: [['Do4', 'p'], ['Re4', '<'], ['Mi4', '<'], ['Fa4', '<'], ['Sol4', '<'],
                    ['Do4', 'p'], ['Re4', '<'], ['Mi4', '<'], ['Fa4', '<'], ['Sol4', '<']],
        consejo: 'Crescendo (<) es crecer poco a poco: cada nota un poquito más fuerte que la anterior, como alguien que se acerca.',
      },
      {
        id: 'n19-2', titulo: 'Diminuendo: cada vez más suave', emoji: '📉',
        tipo: 'dinamica',
        secuencia: [['Sol4', 'f'], ['Fa4', '>'], ['Mi4', '>'], ['Re4', '>'], ['Do4', '>'],
                    ['Sol4', 'f'], ['Fa4', '>'], ['Mi4', '>'], ['Re4', '>'], ['Do4', '>']],
        consejo: 'Diminuendo (>) es al revés: cada nota más suave, como alguien que se aleja.',
      },
      {
        id: 'n19-3', titulo: 'La ola', emoji: '🌊',
        tipo: 'dinamica',
        secuencia: [['Do4', 'p'], ['Re4', '<'], ['Mi4', '<'], ['Fa4', '<'], ['Sol4', '<'],
                    ['Fa4', '>'], ['Mi4', '>'], ['Re4', '>'], ['Do4', '>']],
        consejo: 'Sube y crece, baja y se apaga, como una ola que llega a la playa.',
      },
      {
        id: 'n19-4', titulo: 'Oda con matices', emoji: '🏆', premio: true,
        tipo: 'dinamica',
        secuencia: [['Mi4', 'p'], ['Mi4', '<'], ['Fa4', '<'], ['Sol4', '<'], ['Sol4', 'f'], ['Fa4', '>'], ['Mi4', '>'], ['Re4', '>'],
                    ['Do4', 'p'], ['Do4', '<'], ['Re4', '<'], ['Mi4', '<'], ['Mi4', 'f'], ['Re4', '>'], ['Re4', '>']],
        consejo: 'Los matices son lo que hace que la música "hable". La primera mitad crece y llega a forte; después se calma.',
      },
    ],
  },

  // ───────────────────────── NIVEL 20 ─────────────────────────
  {
    id: 'mundo20',
    emoji: '🎭',
    titulo: 'Gran Teatro',
    nivel: 20,
    color: '#f5d0fe',
    lecciones: [
      {
        id: 'n20-1', titulo: 'Minueto en Sol', emoji: '💃',
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 79], tempo: 104, tonalidad: 'sol',
        // Minueto en Sol mayor, atribuido a Christian Petzold (c. 1725), del Cuaderno de Ana Magdalena Bach.
        // Dominio público. Primera frase (8 compases), mano derecha.
        notas: ['Re5', 'Sol4', 'La4', 'Si4', 'Do5', 'Re5', 'Sol4', 'Sol4',
                'Mi5', 'Do5', 'Re5', 'Mi5', 'Fa#5', 'Sol5', 'Sol4', 'Sol4',
                'Do5', 'Re5', 'Do5', 'Si4', 'La4', 'Si4', 'Do5', 'Si4', 'La4', 'Sol4',
                'Fa#4', 'Sol4', 'La4', 'Si4', 'Sol4', 'La4'],
        tiempos: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1,
                  1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1,
                  1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5,
                  1, 0.5, 0.5, 0.5, 0.5, 3],
        consejo: 'Una pieza clásica de verdad, de hace 300 años. Que la escuche primero con "Escuchar la canción" y la toque despacio: la app espera cada nota.',
      },
      {
        id: 'n20-2', titulo: 'Minueto con su ritmo', emoji: '🎩',
        tipo: 'ritmo', tempo: 84, compas: 3, subdividir: true, teclado: [60, 79],
        figuras: [['Re5', 1], ['Sol4', 0.5], ['La4', 0.5], ['Si4', 0.5], ['Do5', 0.5], ['Re5', 1], ['Sol4', 1], ['Sol4', 1],
                  ['Mi5', 1], ['Do5', 0.5], ['Re5', 0.5], ['Mi5', 0.5], ['Fa#5', 0.5], ['Sol5', 1], ['Sol4', 1], ['Sol4', 1]],
        consejo: 'El minueto es un baile en 3: "UN-dos-tres". Los cuatro primeros compases, con metrónomo.',
      },
      {
        id: 'n20-3', titulo: 'Para Elisa', emoji: '🌹',
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 77], tempo: 60, sinAcompanamiento: true,
        // "Para Elisa", Ludwig van Beethoven (1810), dominio público. Tema principal, mano derecha.
        notas: ['Mi5', 'Re#5', 'Mi5', 'Re#5', 'Mi5', 'Si4', 'Re5', 'Do5', 'La4', 'Do4', 'Mi4', 'La4',
                'Si4', 'Mi4', 'Sol#4', 'Si4', 'Do5', 'Mi4', 'Mi5', 'Re#5',
                'Mi5', 'Re#5', 'Mi5', 'Si4', 'Re5', 'Do5', 'La4', 'Do4', 'Mi4', 'La4',
                'Si4', 'Mi4', 'Do5', 'Si4', 'La4'],
        tiempos: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.75, 0.25, 0.25, 0.25,
                  0.75, 0.25, 0.25, 0.25, 0.75, 0.25, 0.25, 0.25,
                  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.75, 0.25, 0.25, 0.25,
                  0.75, 0.25, 0.25, 0.25, 1.5],
        consejo: 'El tema completo. Mi y Re♯ se alternan con los dedos 2 y 1, la mano casi quieta. ¡Ahora sí puede tocarla con su ritmo en la Colmena!',
      },
      {
        id: 'n20-4', titulo: 'Concierto: Minueto a dos manos', emoji: '🏆', premio: true, mano: 'ambas',
        tipo: 'acordes', teclado: [48, 79],
        acordes: [['Sol3', 'Re5'], ['Sol4'], ['La4'], ['Si4'], ['Do5'], ['Si3', 'Re5'], ['Sol4'], ['Sol4'],
                  ['Do3', 'Mi5'], ['Do5'], ['Re5'], ['Mi5'], ['Fa#5'], ['Si3', 'Sol5'], ['Sol4'], ['Sol4'],
                  ['La3', 'Do5'], ['Re5'], ['Do5'], ['Si4'], ['La4'], ['Sol3', 'Si4'], ['Do5'], ['Si4'], ['La4'], ['Sol4'],
                  ['Re3', 'Fa#4'], ['Sol4'], ['La4'], ['Si4'], ['Sol4'], ['Re3', 'La4']],
        consejo: '¡El gran final de la Etapa 2! El minueto con un bajo sencillo en la izquierda al comienzo de cada compás. Bravo por llegar hasta aquí.',
      },
    ],
  },

  // ═════════════════════════ ETAPA 3 · PIANISTA ═════════════════════════

  // ───────────────────────── NIVEL 21 ─────────────────────────
  {
    id: 'mundo21',
    etapa: '🎹 Etapa 3 · Pianista',
    emoji: '🔄',
    titulo: 'Rueda de las Inversiones',
    nivel: 21,
    color: '#fbcfe8',
    lecciones: [
      {
        id: 'n21-1', titulo: 'El acorde de Do da la vuelta', emoji: '🔄', ayudaVisual: true,
        tipo: 'acordes', teclado: [60, 79],
        acordes: [
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do · estado fundamental' },
          { notas: ['Mi4', 'Sol4', 'Do5'], nombre: 'Do · 1.ª inversión' },
          { notas: ['Sol4', 'Do5', 'Mi5'], nombre: 'Do · 2.ª inversión' },
          { notas: ['Mi4', 'Sol4', 'Do5'], nombre: 'Do · 1.ª inversión' },
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do · estado fundamental' },
          { notas: ['Sol4', 'Do5', 'Mi5'], nombre: 'Do · 2.ª inversión' },
        ],
        consejo: 'Invertir un acorde es pasar la nota de abajo arriba: Do-Mi-Sol, Mi-Sol-Do, Sol-Do-Mi. Son las mismas tres notas, así que sigue siendo el acorde de Do.',
      },
      {
        id: 'n21-2', titulo: 'Inversiones de Fa y Sol', emoji: '🎡', ayudaVisual: true,
        tipo: 'acordes', cantidad: 10, teclado: [55, 79],
        acordes: [
          { notas: ['Fa4', 'La4', 'Do5'], nombre: 'Fa · fundamental' },
          { notas: ['La4', 'Do5', 'Fa5'], nombre: 'Fa · 1.ª inversión' },
          { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa · 2.ª inversión' },
          { notas: ['Sol4', 'Si4', 'Re5'], nombre: 'Sol · fundamental' },
          { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol · 1.ª inversión' },
          { notas: ['Re4', 'Sol4', 'Si4'], nombre: 'Sol · 2.ª inversión' },
        ],
        consejo: 'Los acordes de Fa y Sol también dan la vuelta. Que diga el nombre de las tres notas antes de tocarlas.',
      },
      {
        id: 'n21-3', titulo: 'Acordes menores', emoji: '🌧️', ayudaVisual: true,
        tipo: 'acordes', cantidad: 9, teclado: [55, 76],
        acordes: [
          { notas: ['La3', 'Do4', 'Mi4'], nombre: 'La menor' },
          { notas: ['Re4', 'Fa4', 'La4'], nombre: 'Re menor' },
          { notas: ['Mi4', 'Sol4', 'Si4'], nombre: 'Mi menor' },
        ],
        consejo: 'Los acordes menores suenan más tristes o misteriosos. Toquen Do mayor y luego La menor: ¿cuál suena alegre y cuál triste?',
      },
      {
        id: 'n21-4', titulo: 'La progresión mágica', emoji: '✨', ayudaVisual: true,
        tipo: 'acordes', teclado: [55, 72],
        acordes: [
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do' }, { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol' },
          { notas: ['Do4', 'Mi4', 'La4'], nombre: 'La menor' }, { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa' },
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do' }, { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol' },
          { notas: ['Do4', 'Mi4', 'La4'], nombre: 'La menor' }, { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa' },
        ],
        consejo: 'Do – Sol – La menor – Fa: con estos cuatro acordes se acompañan miles de canciones. Gracias a las inversiones, la mano casi no se mueve.',
      },
      {
        id: 'n21-5', titulo: 'Los acordes del Canon de Pachelbel', emoji: '🏆', premio: true, mano: 'ambas',
        tipo: 'acordes', teclado: [41, 72],
        // Canon en Re de Johann Pachelbel (c. 1680), dominio público. Sus acordes, llevados a Do.
        acordes: [
          { notas: ['Do3', 'Mi4', 'Sol4'], nombre: 'Do' }, { notas: ['Si2', 'Re4', 'Sol4'], nombre: 'Sol' },
          { notas: ['La2', 'Do4', 'Mi4'], nombre: 'La menor' }, { notas: ['Sol2', 'Si3', 'Mi4'], nombre: 'Mi menor' },
          { notas: ['Fa2', 'La3', 'Do4'], nombre: 'Fa' }, { notas: ['Do3', 'Mi4', 'Sol4'], nombre: 'Do' },
          { notas: ['La2', 'Do4', 'Fa4'], nombre: 'Fa' }, { notas: ['Si2', 'Re4', 'Sol4'], nombre: 'Sol' },
          { notas: ['Do3', 'Mi4', 'Sol4'], nombre: 'Do' },
        ],
        consejo: 'La izquierda toca el bajo, que baja como una escalera, y la derecha los acordes. Es la progresión del famoso Canon, que suena en casi todas las bodas.',
      },
    ],
  },

  // ───────────────────────── NIVEL 22 ─────────────────────────
  {
    id: 'mundo22',
    emoji: '🌙',
    titulo: 'Noche de las Menores',
    nivel: 22,
    color: '#c4b5fd',
    lecciones: [
      {
        id: 'n22-1', titulo: 'La posición de La', emoji: '🖐️',
        tipo: 'aleatorio', notas: ['La4', 'Si4', 'Do5', 'Re5', 'Mi5'], cantidad: 12, ayudaVisual: false,
        posicion: 'La4', teclado: [60, 79],
        consejo: 'El pulgar va a La. La = 1, Si = 2, Do = 3, Re = 4, Mi = 5. Es la casa de la tonalidad de La menor.',
      },
      {
        id: 'n22-2', titulo: '¿Alegre o triste?', emoji: '🎭', bemoles: true, ayudaVisual: true,
        tipo: 'acordes', cantidad: 10, teclado: [57, 76],
        acordes: [
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do mayor 😊' },
          { notas: ['Do4', 'Mib4', 'Sol4'], nombre: 'Do menor 😢' },
          { notas: ['La3', 'Do4', 'Mi4'], nombre: 'La menor 😢' },
          { notas: ['Fa4', 'La4', 'Do5'], nombre: 'Fa mayor 😊' },
        ],
        consejo: 'Mayor y menor se diferencian en una sola nota, la del medio: Do-Mi-Sol es alegre y Do-Mi♭-Sol es triste. Que escuche la diferencia con "Escuchar".',
      },
      {
        id: 'n22-3', titulo: 'Escala de La menor', emoji: '🌙',
        tipo: 'cancion', ayudaVisual: true, teclado: [57, 81], tonalidad: 'lam',
        notas: ['La4', 'Si4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Sol5', 'La5', 'Sol5', 'Fa5', 'Mi5', 'Re5', 'Do5', 'Si4', 'La4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1],
        consejo: 'La menor usa las mismas teclas blancas que Do mayor, pero empieza en La. Por eso se llaman "relativas": son familia.',
      },
      {
        id: 'n22-4', titulo: 'La menor armónica', emoji: '🐫',
        tipo: 'cancion', ayudaVisual: true, teclado: [57, 81], tonalidad: 'lam',
        notas: ['La4', 'Si4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Sol#5', 'La5', 'Sol#5', 'Fa5', 'Mi5', 'Re5', 'Do5', 'Si4', 'La4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1],
        consejo: 'Ahora el Sol sube a Sol♯. Ese salto entre Fa y Sol♯ le da un sonido de desierto, como de caravana.',
      },
      {
        id: 'n22-5', titulo: 'Greensleeves', emoji: '🏆', premio: true,
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 79], tonalidad: 'lam', tempo: 120,
        // "Greensleeves", canción tradicional inglesa (siglo XVI), dominio público.
        notas: ['La4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Mi5', 'Re5', 'Si4', 'Sol4', 'La4', 'Si4',
                'Do5', 'La4', 'La4', 'Sol#4', 'La4', 'Si4', 'Sol#4', 'Mi4',
                'La4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Mi5', 'Re5', 'Si4', 'Sol4', 'La4', 'Si4',
                'Do5', 'Si4', 'La4', 'Sol#4', 'Fa#4', 'Sol#4', 'La4', 'La4'],
        tiempos: [0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 0.75, 0.25, 0.5,
                  1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 1,
                  0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 0.75, 0.25, 0.5,
                  0.75, 0.25, 0.5, 0.75, 0.25, 0.5, 1.5, 1.5],
        consejo: 'Una melodía de hace más de 400 años, en La menor. Tiene Sol♯ y un Fa♯ al final: que los busque antes de empezar.',
      },
    ],
  },

  // ───────────────────────── NIVEL 23 ─────────────────────────
  {
    id: 'mundo23',
    emoji: '💃',
    titulo: 'Salón de los Acompañamientos',
    nivel: 23,
    color: '#fed7aa',
    lecciones: [
      {
        id: 'n23-1', titulo: 'Vals con la izquierda', emoji: '💃', ayudaVisual: true,
        tipo: 'acordes', teclado: [41, 67],
        acordes: [['Do3'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3'], ['Sol2'], ['Si2', 'Fa3'], ['Si2', 'Fa3'],
                  ['Fa2'], ['La2', 'Do3'], ['La2', 'Do3'], ['Do3'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3']],
        consejo: 'El vals va en 3: "bajo – acorde – acorde", "UM-pa-pa". El bajo con el meñique y el acorde con los dedos 3 y 1.',
      },
      {
        id: 'n23-2', titulo: 'Arpegio roto', emoji: '🌊', ayudaVisual: true, mano: 'izquierda', registro: true,
        tipo: 'cancion', teclado: [36, 60], tempo: 110,
        notas: ['Do3', 'Sol3', 'Do4', 'Sol3', 'La2', 'Mi3', 'La3', 'Mi3', 'Fa2', 'Do3', 'Fa3', 'Do3', 'Sol2', 'Re3', 'Sol3', 'Re3', 'Do3'],
        tiempos: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        dedos: [5, 2, 1, 2, 5, 2, 1, 2, 5, 2, 1, 2, 5, 2, 1, 2, 5],
        consejo: 'Bajo, quinta, octava, quinta: la izquierda dibuja olas. Es el acompañamiento de muchas baladas.',
      },
      {
        id: 'n23-3', titulo: 'El vals de Ranita', emoji: '🐸', mano: 'ambas',
        tipo: 'acordes', teclado: [41, 72],
        acordes: [['Do3', 'Mi4'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3'], ['Do3', 'Sol4'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3'],
                  ['Sol2', 'Fa4'], ['Si2', 'Fa3'], ['Si2', 'Fa3'], ['Do3', 'Mi4'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3'],
                  ['Fa2', 'La4'], ['La2', 'Do3'], ['La2', 'Do3'], ['Do3', 'Sol4'], ['Mi3', 'Sol3'], ['Mi3', 'Sol3'],
                  ['Sol2', 'Re4'], ['Si2', 'Fa3'], ['Si2', 'Fa3'], ['Do3', 'Do4']],
        consejo: 'La derecha toca una nota larga por compás y la mantiene mientras la izquierda hace "UM-pa-pa".',
      },
      {
        id: 'n23-4', titulo: 'Alberti con melodía', emoji: '🎠', mano: 'ambas',
        tipo: 'acordes', teclado: [48, 72],
        acordes: [['Do3', 'Mi4'], ['Sol3'], ['Mi3'], ['Sol3'], ['Do3', 'Sol4'], ['Sol3'], ['Mi3'], ['Sol3'],
                  ['Re3', 'Fa4'], ['Sol3'], ['Fa3'], ['Sol3'], ['Do3', 'Mi4'], ['Sol3'], ['Mi3'], ['Sol3']],
        consejo: 'El bajo Alberti que ya conoce, ahora con una melodía encima. La derecha baja junto con el primer Do de cada grupo.',
      },
      {
        id: 'n23-5', titulo: 'Sonata fácil de Mozart', emoji: '🏆', premio: true, mano: 'ambas',
        tipo: 'acordes', teclado: [48, 79],
        // Sonata en Do mayor K. 545 de W. A. Mozart (1788), dominio público. Primeros dos compases.
        acordes: [['Do3', 'Do5'], ['Sol3'], ['Mi3'], ['Sol3'], ['Do3', 'Mi5'], ['Sol3'], ['Mi3', 'Sol5'], ['Sol3'],
                  ['Re3', 'Si4'], ['Sol3'], ['Fa3'], ['Sol3', 'Do5'], ['Re5'], ['Do3', 'Do5'], ['Sol3'], ['Mi3'], ['Sol3']],
        consejo: 'El comienzo de una de las sonatas más famosas de Mozart. La izquierda no para con su Alberti mientras la derecha canta encima. Primero cada mano por separado.',
      },
    ],
  },

  // ───────────────────────── NIVEL 24 ─────────────────────────
  {
    id: 'mundo24',
    emoji: '🦶',
    titulo: 'Taller del Pedal',
    nivel: 24,
    color: '#bbf7d0',
    lecciones: [
      {
        id: 'n24-1', titulo: 'Pisar y levantar', emoji: '🦶', pedal: true, ayudaVisual: true,
        tipo: 'acordes', teclado: [55, 72],
        acordes: [
          { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do' }, { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa' },
          { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol' }, { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do' },
          { notas: ['Do4', 'Mi4', 'La4'], nombre: 'La menor' }, { notas: ['Do4', 'Fa4', 'La4'], nombre: 'Fa' },
          { notas: ['Si3', 'Re4', 'Sol4'], nombre: 'Sol' }, { notas: ['Do4', 'Mi4', 'Sol4'], nombre: 'Do' },
        ],
        consejo: 'El pedal de la derecha hace que las notas sigan sonando. Truco: tocar el acorde, y RECIÉN después levantar y volver a pisar el pedal ("tocar – levantar – pisar"). Así no se mezclan los acordes.',
      },
      {
        id: 'n24-2', titulo: 'Arpegios amplios con pedal', emoji: '🌅', pedal: true, ayudaVisual: true,
        tipo: 'cancion', teclado: [41, 67], tempo: 120,
        notas: ['Do3', 'Sol3', 'Do4', 'Mi4', 'Sol4', 'Mi4', 'Do4', 'Sol3',
                'La2', 'Mi3', 'La3', 'Do4', 'Mi4', 'Do4', 'La3', 'Mi3',
                'Fa2', 'Do3', 'Fa3', 'La3', 'Do4', 'La3', 'Fa3', 'Do3',
                'Sol2', 'Re3', 'Sol3', 'Si3', 'Re4', 'Si3', 'Sol3', 'Re3', 'Do3'],
        tiempos: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                  0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
        consejo: 'Con pedal, el arpegio suena como un arpa. Se cambia el pedal en la primera nota de cada grupo (la más grave).',
      },
      {
        id: 'n24-3', titulo: 'Canción de cuna de Brahms', emoji: '🌛', pedal: true,
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 76], tempo: 96,
        // "Wiegenlied", Johannes Brahms (1868), dominio público.
        notas: ['Mi4', 'Mi4', 'Sol4', 'Mi4', 'Mi4', 'Sol4',
                'Mi4', 'Sol4', 'Do5', 'Si4', 'La4', 'La4', 'Sol4',
                'Re4', 'Mi4', 'Fa4', 'Re4', 'Re4', 'Mi4', 'Fa4',
                'Re4', 'Fa4', 'Si4', 'La4', 'Sol4', 'Si4', 'Do5'],
        tiempos: [0.5, 0.5, 2, 0.5, 0.5, 2,
                  0.5, 0.5, 1, 1.5, 0.5, 1, 1,
                  0.5, 0.5, 1, 1, 0.5, 0.5, 2,
                  0.5, 0.5, 0.5, 0.5, 1, 1, 3],
        consejo: 'Suave y "cantando". El pedal ayuda a que las notas largas se unan. Que imagine que arrulla a un bebé.',
      },
      {
        id: 'n24-4', titulo: 'Preludio en Do de Bach', emoji: '🏆', premio: true, pedal: true,
        tipo: 'cancion', ayudaVisual: false, teclado: [59, 79], tempo: 60,
        // Preludio en Do mayor BWV 846, J. S. Bach (1722), dominio público. Primeros cuatro compases.
        notas: ['Do4', 'Mi4', 'Sol4', 'Do5', 'Mi5', 'Sol4', 'Do5', 'Mi5',
                'Do4', 'Re4', 'La4', 'Re5', 'Fa5', 'La4', 'Re5', 'Fa5',
                'Si3', 'Re4', 'Sol4', 'Re5', 'Fa5', 'Sol4', 'Re5', 'Fa5',
                'Do4', 'Mi4', 'Sol4', 'Do5', 'Mi5', 'Sol4', 'Do5', 'Mi5'],
        tiempos: Array(31).fill(0.25).concat([1]),
        consejo: 'Cada compás es un acorde tocado nota por nota. Con pedal, cada compás suena como un arpa. Se cambia el pedal al comenzar cada compás.',
      },
    ],
  },

  // ───────────────────────── NIVEL 25 ─────────────────────────
  {
    id: 'mundo25',
    emoji: '🗝️',
    titulo: 'Puerta de las Tonalidades',
    nivel: 25,
    color: '#fde68a',
    lecciones: [
      {
        id: 'n25-1', titulo: 'La posición de Re', emoji: '🖐️',
        tipo: 'aleatorio', notas: ['Re4', 'Mi4', 'Fa#4', 'Sol4', 'La4'], cantidad: 12, ayudaVisual: true,
        posicion: 'Re4', teclado: [60, 76],
        consejo: 'El pulgar va a Re. Ojo: el dedo 3 cae en Fa♯, la tecla negra.',
      },
      {
        id: 'n25-2', titulo: 'Escala de Re mayor', emoji: '🪜',
        tipo: 'cancion', ayudaVisual: true, teclado: [60, 76], tonalidad: 're',
        notas: ['Re4', 'Mi4', 'Fa#4', 'Sol4', 'La4', 'Si4', 'Do#5', 'Re5', 'Do#5', 'Si4', 'La4', 'Sol4', 'Fa#4', 'Mi4', 'Re4'],
        dedos: [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1],
        consejo: 'Re mayor tiene dos teclas negras: Fa♯ y Do♯. Los dedos son los mismos que en la escala de Do.',
      },
      {
        id: 'n25-3', titulo: 'Leer en Re mayor', emoji: '🎼',
        tipo: 'aleatorio', vista: 'pentagrama', clave: 'sol', armadura: 're', colores: false, mostrarNombre: false,
        notas: ['Re4', 'Mi4', 'Fa#4', 'Sol4', 'La4', 'Si4', 'Do#5', 'Re5'], cantidad: 12, ayudaVisual: false, teclado: [60, 76],
        consejo: 'Dos sostenidos en la armadura: Fa♯ y Do♯. Todos los Fa y todos los Do se tocan en la tecla negra.',
      },
      {
        id: 'n25-4', titulo: 'Escala de Si♭ mayor', emoji: '🍂', bemoles: true,
        tipo: 'cancion', ayudaVisual: true, teclado: [57, 72], tonalidad: 'sib',
        notas: ['Sib3', 'Do4', 'Re4', 'Mib4', 'Fa4', 'Sol4', 'La4', 'Sib4', 'La4', 'Sol4', 'Fa4', 'Mib4', 'Re4', 'Do4', 'Sib3'],
        dedos: [2, 1, 2, 3, 1, 2, 3, 4, 3, 2, 1, 3, 2, 1, 2],
        consejo: 'Si♭ mayor tiene dos bemoles: Si♭ y Mi♭. El pulgar siempre cae en Do y en Fa, las teclas blancas.',
      },
      {
        id: 'n25-5', titulo: 'Canon de Pachelbel (melodía)', emoji: '🏆', premio: true,
        tipo: 'cancion', ayudaVisual: false, teclado: [60, 79], tonalidad: 're', tempo: 60,
        // Canon en Re de Johann Pachelbel (c. 1680), dominio público. La melodía del comienzo.
        notas: ['Fa#5', 'Mi5', 'Re5', 'Do#5', 'Si4', 'La4', 'Si4', 'Do#5',
                'Re5', 'Do#5', 'Si4', 'La4', 'Sol4', 'Fa#4', 'Sol4', 'Mi4', 'Fa#4'],
        tiempos: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        consejo: 'La melodía del Canon en su tonalidad original, Re mayor. Es la misma progresión de acordes que tocó en la Rueda de las Inversiones.',
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

// Lecciones creadas desde partituras (MusicXML) que el adulto agregó en el iPad.
const LECCIONES_PARTITURAS = [];
export function registrarPartituras(partituras) {
  LECCIONES_PARTITURAS.length = 0;
  for (const p of partituras) LECCIONES_PARTITURAS.push(...p.lecciones);
}

export function buscarLeccion(id) {
  return LECCIONES.find((l) => l.id === id) || JUEGOS.find((l) => l.id === id)
    || LECCIONES_PARTITURAS.find((l) => l.id === id);
}
