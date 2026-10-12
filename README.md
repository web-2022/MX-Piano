# Pianito 🎹

App web (PWA) para que niños de 4 a 7 años aprendan piano con un piano de verdad.
El iPad escucha por el micrófono y reconoce la nota que se tocó.

## Niveles

| Nivel | Mundo | Qué aprende |
|---|---|---|
| 0 | Isla del Do | Encontrar el Do |
| 1 | Montaña de las 5 notas | Do a Sol con la mano derecha |
| 2 | Bosque del Pentagrama | Leer en clave de Sol: con color, sin nombre y en blanco y negro |
| 3 | Río del Ritmo | Negra, blanca, redonda y silencios, tocando a tiempo con el pulso |
| 4 | Valle de las Canciones | Martinillo, Mary, Remando suave, Oda completa, Jingle Bells |
| 5 | Cueva de la Mano Izquierda | Do a Sol graves y clave de Fa |
| 6 | Cumbre del Teclado | La, Si, escala de Do con paso del pulgar, teclas negras, Estrellita |
| 7 | Lago de las Dos Manos | Melodías que alternan derecha e izquierda |

Cada lección se desbloquea al terminar la anterior. En ⚙️ el profesor puede
**desbloquear todas** para saltar a cualquier lección.

## Estructura

```
pianito/
├── index.html            Pantallas: inicio, mapa, juego, resultado, ajustes
├── css/estilos.css       Diseño (horizontal y vertical)
├── js/
│   ├── app.js            Lógica de pantallas y del juego
│   ├── lecciones.js      ← CONTENIDO: aquí agregas niveles y canciones
│   ├── detector.js       Escucha el micrófono y avisa cada nota nueva
│   ├── pentagrama.js     Dibuja el pentagrama, las claves y las figuras
│   ├── tono.js           Algoritmo que calcula la frecuencia (método McLeod)
│   ├── notas.js          Nombres, colores y frecuencias de las notas
│   ├── sonido.js         Nota de referencia y sonidos de premio
│   └── almacen.js        Guarda estrellas y ajustes en el iPad
├── manifest.webmanifest  Datos para instalarla como app
├── sw.js                 Permite usarla sin internet
├── img/rana.png          Mascota
└── icons/
```

## Abrir y probar en VS Code (PC)

1. Abre la carpeta `pianito` en VS Code.
2. Instala la extensión **Live Server** (VS Code te la sugerirá).
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Se abre `http://127.0.0.1:5500`. Acepta el permiso del micrófono.

> No abras `index.html` con doble clic: los módulos de JavaScript y el micrófono
> necesitan un servidor (`localhost` o `https`).

**Sin piano cerca:** en ⚙️ activa *"Usar el teclado de la pantalla"* y toca las teclas con el mouse.
**Para ver qué escucha:** activa *"Mostrar lo que escucha el micrófono"*.

## Probar en el iPad

Safari solo permite el micrófono en páginas **https**. La forma más simple es GitHub Pages:

1. Sube la carpeta a un repositorio de GitHub.
2. *Settings → Pages →* rama `main`, carpeta `/ (root)`.
3. Abre en el iPad `https://TU-USUARIO.github.io/pianito/`.
4. En Safari: **Compartir → Agregar a pantalla de inicio**. Queda como app y funciona sin internet.

Cada vez que publiques cambios, sube el número de `VERSION` en `sw.js`.

## Consejos para que reconozca bien las notas

- iPad en el atril del piano, en un lugar sin TV ni conversaciones.
- Si no reconoce las notas, sube la **sensibilidad** en ⚙️. Si reacciona sola con el ruido, bájala.
- Mientras la app habla o toca un sonido, el micrófono se pausa (para no escucharse a sí misma).
- Acepta la nota en cualquier octava: el niño puede tocar cualquier Do del piano.

## Agregar una lección

En `js/lecciones.js` (al inicio del archivo están explicadas todas las opciones), dentro de un mundo:

```js
{
  id: 'n1-6',                 // único
  titulo: 'Sol y Mi',
  emoji: '🎵',
  tipo: 'aleatorio',          // 'buscar' | 'aleatorio' | 'cancion'
  notas: ['Sol4', 'Mi4'],     // Do4 = Do central. Sostenido: 'Fa#4', bemol: 'Sib4'
  cantidad: 8,                // no se usa en 'cancion'
  ayudaVisual: true,          // ilumina la tecla correcta en la pantalla
  consejo: 'Texto corto para el adulto que acompaña.',
}
```

Una lección de ritmo usa `figuras` en vez de `notas`:

```js
{
  id: 'n3-6', titulo: 'Mi ritmo', emoji: '🥁',
  tipo: 'ritmo', tempo: 60,                    // pulsos por minuto
  figuras: [['Do4', 1], ['Re4', 1], ['Mi4', 2], [null, 4]],  // 1 negra, 2 blanca, 4 redonda, null silencio
}
```

Conviene que cada lección de ritmo dure como máximo 16 pulsos (4 compases), para que entre en la pantalla.

Para canciones usa solo obras de **dominio público** (tradicionales o clásicas).

## Cómo funciona el modo ritmo

1. La app toca el ejemplo con clics de metrónomo ("primero escuchar").
2. Cuenta 1, 2, 3, 4 y el niño toca. Una nota cuenta si llega hasta 0,35 s antes o después del pulso.
3. El micrófono tarda unos 0,12 s en reconocer una nota; la app ya lo descuenta
   (`LATENCIA_MIC_MS` en `js/app.js`). Si en tu iPad siempre marca "tarde", súbelo un poco.

## Lo que sigue

- Mini-juegos (atrapa la nota, eco, carrera).
- Niveles 9 y 10: corcheas y puntillo; dinámica (fuerte/suave) y legato/staccato.
- Acompañamiento musical de fondo en las canciones.
- Voz grabada para Ranita en lugar de la voz del sistema.
- Puerta para padres en ⚙️ y modo para mayores de 8 años.
