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
| 8 | Selva de las Corcheas | Corcheas ("ti-ti"), negra y blanca con puntillo, compás de 3 |
| 9 | Castillo del Fuerte y Suave | Dinámica: fuerte (f) y suave (p) |
| 10 | Charco Saltarín | Articulación: picado (corta), larga y ligado |

Cada lección se desbloquea al terminar la anterior. En ⚙️ el profesor puede
**desbloquear todas** para saltar a cualquier lección.

## Fuerte y suave · Picado y ligado

- **Fuerte y suave:** al empezar, Ranita pide un Do fuerte 🦁 y uno suave 🐭 para conocer *ese* piano
  (cada piano y cada iPad suenan distinto). Después compara cada nota con la mitad entre ambos.
  El medidor león/ratón muestra qué tan fuerte se tocó.
- **Picado:** tocar y soltar en menos de 0,35 s. **Larga:** mantener hasta que se llene el círculo (1 s).
  **Ligado:** la nota siguiente debe empezar antes de soltar la anterior (o casi al mismo tiempo).
- Los límites están al inicio de `js/expresion.js` (`CORTA_MS`, `LARGA_MS`).
- Con el teclado de la pantalla: tocar **abajo** en la tecla = fuerte, **arriba** = suave.

## Acompañamiento 🎻

- En las canciones, **🎶 Escuchar la canción** la toca completa con bajo y acordes (Do, Fa y Sol, elegidos solos).
- Al terminar una canción o un ritmo: **🎻 Escuchar mi canción con orquesta**.
- En ⚙️ se puede activar **acompañar con acordes mientras toca** (mejor con audífonos: si no, el micrófono
  también escucha los acordes).
- Para que una canción suene con su ritmo real, agrega `tiempos: [...]` (1 = negra, 2 = blanca, 0.5 = corchea).

## Voz grabada de Ranita 🎙️

En ⚙️ → **Grabar la voz de Ranita**. Toca ●, di la frase y toca ■. Ranita usará tu voz en esas frases
(con la opción "voz más aguda, de rana"); las que no grabes las dice la voz del iPad.
Se guardan solo en ese iPad. Las frases están en `js/voz.js`.

## Modo para mayores de 8 años 🚀

La primera vez la app pregunta la edad (se cambia en ⚙️). En el modo 8+:
- Un **mundo entero se abre** cuando el anterior tiene estrellas en 3 lecciones (no hace falta ir de una en una).
- Ranita habla menos (no repite "Toca Re" en cada nota) y es más pequeña.
- Un poco más de notas por lección y ritmos un 15 % más rápidos.

## Parque de juegos 🎪

En la pestaña **Juegos** del mapa. No bloquean el viaje: cada juego se abre
cuando se gana una estrella en la lección que tiene en `requiere`.

| Juego | Qué entrena | Se abre con |
|---|---|---|
| 🪰 Atrapa moscas | Reconocer la nota rápido (la mosca se detiene mientras Ranita habla) | Do, Re y Mi |
| 🦜 El eco de Ranita | Oído y memoria: Ranita toca 2 o 3 notas y el niño las repite | Do, Re y Mi |
| 🐌 Carrera con el caracol | Fluidez: cada nota correcta es un salto | Las cinco notas |
| 🐸 Moscas de las 5 notas | Igual que Atrapa moscas, sin ayuda | Oda a la alegría |
| 👂 Eco solo con el oído | El eco sin colores ni nombres | A la luz de la luna |
| 🎼 Moscas en el pentagrama | Leer la nota que lleva la mosca | Lectura en blanco y negro |
| 🏁 Gran carrera del teclado | Las 8 teclas blancas | Todas las teclas blancas |

Para agregar uno, copia un bloque de `JUEGOS` al final de `js/lecciones.js`.

## Para el adulto

- **⚙️ Ajustes:** hay que **mantenerlo presionado** 1,5 segundos (un toque corto de un niño solo muestra un aviso).
- **🏠 durante una lección:** pregunta "¿Nos vamos?" para que un toque sin querer no borre lo avanzado. Mientras pregunta, las moscas y el caracol esperan.
- **Aro de Ranita:** verde = te está escuchando (crece con el sonido del piano). Morado punteado = Ranita habla, hay que esperar.

## Estructura

```
pianito/
├── index.html            Pantallas: inicio, mapa, juego, resultado, ajustes
├── css/estilos.css       Diseño (horizontal y vertical)
├── js/
│   ├── app.js            Lógica de pantallas y del juego
│   ├── lecciones.js      ← CONTENIDO: aquí agregas niveles y canciones
│   ├── detector.js       Escucha el micrófono y avisa cada nota nueva
│   ├── juegos.js         Mini-juegos: atrapa moscas, eco y carrera
│   ├── expresion.js      Fuerte y suave · picado, largo y ligado
│   ├── acompanamiento.js Armonía automática y canción con orquesta
│   ├── voz.js            Voz grabada de Ranita
│   ├── pentagrama.js     Dibuja el pentagrama, las claves y las figuras
│   ├── tono.js           Algoritmo que calcula la frecuencia (método McLeod)
│   ├── notas.js          Nombres, colores y frecuencias de las notas
│   ├── sonido.js         Nota de referencia y sonidos de premio
│   └── almacen.js        Guarda estrellas y ajustes en el iPad
├── manifest.webmanifest  Datos para instalarla como app
├── sw.js                 Permite usarla sin internet
├── img/rana.png          Mascota
├── icons/
└── pruebas/
    └── prueba-detector.mjs   Prueba el reconocimiento con pianos sintéticos
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

## Cómo reconoce las notas

1. **Golpe de tecla:** el martillo del piano hace un "clic" agudo cortísimo. La app lo detecta y así sabe que se tocó una tecla nueva, incluso si es **la misma nota repetida** (Mi, Mi, Mi).
2. **Tono:** calcula la frecuencia (método McLeod) sobre el sonido filtrado, sin graves de ruido ni siseo.
3. **Estabilidad:** la nota debe quedarse quieta unos 50 ms. La voz y la TV cambian de tono todo el tiempo, por eso no se confunden con el piano.
4. **Ruido de la casa:** mide solo el ruido de fondo y ajusta el umbral.
5. **Afinación:** si el piano de casa está un poco desafinado, lo compensa poco a poco (se ve en "Mostrar lo que escucha el micrófono").
6. Una nota larga que se va apagando **no se cuenta dos veces**.
7. **Fuerza y duración:** mide qué tan fuerte se tocó y, al soltar la tecla (el apagador corta el sonido de golpe), cuánto duró.

Para comprobarlo sin micrófono (en la terminal de VS Code):

```
node pruebas/prueba-detector.mjs
```

Toca pianos sintéticos (notas sueltas, repetidas, rápidas, desafinadas, graves, suaves con ruido,
con voz de TV) y dice si reconoció exactamente lo que se tocó.

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
3. La app usa el momento del **golpe de la tecla**, no el momento en que terminó de reconocer la nota,
   y descuenta la demora del micrófono (`LATENCIA_MIC_MS` en `js/app.js`, 40 ms).
   Si en tu iPad siempre marca "tarde", súbelo un poco; si marca "antes", bájalo.

## Lo que sigue

- Ajustar en el iPad real los límites de fuerte/suave y de picado/ligado.
- Varios perfiles de niños en el mismo iPad.
- Más canciones en el Valle de las Canciones.
