// Detección de la frecuencia de una nota (monofónica).
// Método McLeod (MPM): función de diferencia cuadrada normalizada (NSDF)
// + selección del primer pico "claro" + interpolación parabólica.
// Es más robusto que la autocorrelación simple frente a los armónicos del piano.

export function detectarTono(buf, sampleRate, frecMin = 55, frecMax = 1600) {
  const n = buf.length;

  let suma = 0;
  for (let i = 0; i < n; i++) suma += buf[i] * buf[i];
  const rms = Math.sqrt(suma / n);
  if (rms < 0.002) return { frecuencia: -1, claridad: 0, rms };

  const tauMin = Math.max(2, Math.floor(sampleRate / frecMax));
  const tauMax = Math.min(Math.floor(sampleRate / frecMin), Math.floor(n / 2));

  // NSDF
  const nsdf = new Float32Array(tauMax + 2);
  for (let tau = 0; tau <= tauMax + 1; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0, lim = n - tau; i < lim; i++) {
      const a = buf[i];
      const b = buf[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Saltar el primer lóbulo positivo (tau cercano a 0).
  let tau = 1;
  while (tau <= tauMax && nsdf[tau] > 0) tau++;

  // Máximo de cada lóbulo positivo.
  const picos = [];
  let enLobulo = false;
  let mejorTau = -1;
  let mejorVal = -Infinity;
  for (; tau <= tauMax; tau++) {
    const v = nsdf[tau];
    if (v > 0) {
      if (!enLobulo) {
        enLobulo = true;
        mejorVal = -Infinity;
      }
      if (v > mejorVal) {
        mejorVal = v;
        mejorTau = tau;
      }
    } else if (enLobulo) {
      enLobulo = false;
      picos.push(mejorTau);
    }
  }
  if (enLobulo && mejorTau > 0) picos.push(mejorTau);
  if (!picos.length) return { frecuencia: -1, claridad: 0, rms };

  let maximo = 0;
  for (const t of picos) maximo = Math.max(maximo, nsdf[t]);

  // Primer pico que alcanza el 90 % del máximo: evita errores de octava.
  const elegido = picos.find((t) => t >= tauMin && nsdf[t] >= 0.9 * maximo);
  if (elegido === undefined) return { frecuencia: -1, claridad: 0, rms };

  let t = elegido;
  let claridad = nsdf[elegido];
  const a = nsdf[elegido - 1];
  const b = nsdf[elegido];
  const c = nsdf[elegido + 1];
  const d = a - 2 * b + c;
  if (d !== 0) {
    const desplazamiento = (0.5 * (a - c)) / d;
    t = elegido + desplazamiento;
    claridad = b - 0.25 * (a - c) * desplazamiento;
  }

  return { frecuencia: sampleRate / t, claridad, rms };
}
