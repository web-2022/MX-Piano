# Revisa lecciones de Pianito tocándolas con el piano virtual (por el micrófono).
# Requiere: pip install playwright  y un servidor local en la carpeta del proyecto:
#   python3 -m http.server 8765
# Uso:
#   python3 pruebas/navegador/revisar.py              (todas las lecciones y juegos)
#   python3 pruebas/navegador/revisar.py n1-5 n11-6   (solo esas)
import asyncio, json, os, sys
from playwright.async_api import async_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
PIANO = open(os.path.join(AQUI, 'piano-virtual.js')).read()
ROBOT = open(os.path.join(AQUI, 'robot.js')).read()
URL = os.environ.get('PIANITO_URL', 'http://localhost:8765/index.html?depurar')
CHROME = os.environ.get('CHROME')
GRUPO = 12  # lecciones por navegador (se reinicia para que no se acumule memoria)

async def revisar(ids, resultados):
    async with async_playwright() as p:
        opciones = {'args': ['--autoplay-policy=no-user-gesture-required']}
        if CHROME: opciones['executable_path'] = CHROME
        b = await p.chromium.launch(**opciones)
        pg = await (await b.new_context(viewport={'width': 1180, 'height': 820})).new_page()
        errores = []
        pg.on('pageerror', lambda e: errores.append(str(e)))
        await pg.add_init_script(PIANO)
        await pg.goto(URL)
        await pg.evaluate("localStorage.clear(); localStorage.setItem('pianito-ajustes', JSON.stringify({modo:'peques',voz:false,notaReferencia:true,tecladoPantalla:false,desbloquearTodo:true}))")
        await pg.reload()
        await pg.click('#btn-empezar')
        await pg.wait_for_timeout(1200)
        for lid in ids:
            errores.clear()
            abierta = await pg.evaluate("""async (id) => {
                const m = await import('./js/lecciones.js');
                const l = m.buscarLeccion(id);
                const esJuego = m.JUEGOS.some(j => j.id === id);
                document.querySelector(`[data-pestana="${esJuego ? 'parque' : 'mapa'}"]`).click();
                await new Promise(r => setTimeout(r, 200));
                const sel = esJuego ? '.tarjeta-juego' : '.parada';
                const b = [...document.querySelectorAll(sel)].find(x => x.querySelector('.nombre')?.textContent === l.titulo);
                if (!b) return false;
                b.click(); return true; }""", lid)
            if not abierta:
                resultados[lid] = {'ok': False, 'detalle': 'no se encontró el botón'}
                continue
            await pg.wait_for_timeout(350)
            if await pg.evaluate("document.querySelector('#dialogo-consejo').open"):
                await pg.click('#dialogo-consejo button')
            await pg.wait_for_timeout(300)
            r = await pg.evaluate(ROBOT, lid)
            if errores: r['js'] = errores[:2]
            resultados[lid] = r
            marca = '✅' if r['ok'] and r['estrellas'] == 3 else ('⚠️ ' if r['ok'] else '❌')
            print(f"{marca} {lid}: {r['estrellas']}★ errores {r['errores']} reintentos {r['reintentos']} {r['segundos']}s {r.get('detalle','')} {r.get('js','')}", flush=True)
            if await pg.evaluate("document.querySelector('#pantalla-resultado').classList.contains('activa')"):
                await pg.click('#btn-mapa')
            else:
                await pg.evaluate("document.querySelector('#btn-volver').click()")
                await pg.wait_for_timeout(200)
                if await pg.evaluate("document.querySelector('#dialogo-salir').open"):
                    await pg.click('#dialogo-salir button[value=salir]')
            await pg.wait_for_timeout(300)
        await b.close()

async def main():
    ids = sys.argv[1:]
    if not ids:
        import subprocess
        salida = subprocess.run(['node', '--input-type=module', '-e',
            "import * as m from './js/lecciones.js'; console.log(JSON.stringify([...m.LECCIONES, ...m.JUEGOS].map(l => l.id)))"],
            capture_output=True, text=True, cwd=os.path.join(AQUI, '..', '..'))
        ids = json.loads(salida.stdout)
    resultados = {}
    for i in range(0, len(ids), GRUPO):
        await revisar(ids[i:i + GRUPO], resultados)
    malas = {k: v for k, v in resultados.items() if not (v['ok'] and v.get('estrellas') == 3)}
    print(f"\n{len(resultados) - len(malas)} de {len(resultados)} lecciones con 3 estrellas.")
    with open(os.environ.get('INFORME', '/tmp/informe-lecciones.json'), 'w') as f:
        json.dump(resultados, f, ensure_ascii=False, indent=1)

asyncio.run(main())
