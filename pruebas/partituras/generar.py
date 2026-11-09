"""Genera partituras MusicXML gratis (obras de dominio público, arreglos fáciles propios) para la pestaña 📄 Partituras.

Uso:  python3 pruebas/partituras/generar.py   → escribe los .musicxml en partituras/ (carpeta pública del sitio)

Cada obra: dos voces (derecha en clave de Sol, izquierda en clave de Fa) como listas de (notas, duración).
  notas: 'Do4' | 'Fa#3' | 'Sib3' | ['Do3', 'Sol3'] (acorde) | None (silencio)
  duración en negras: 1 = negra, 0.5 = corchea, 0.25 = semicorchea, 2 = blanca, 3 = blanca con puntillo, 4 = redonda
"""
import os
from xml.sax.saxutils import escape

DIV = 4  # divisiones por negra (semicorchea = 1)
PASOS = {'Do': ('C', 0), 'Re': ('D', 2), 'Mi': ('E', 4), 'Fa': ('F', 5), 'Sol': ('G', 7), 'La': ('A', 9), 'Si': ('B', 11)}


def leer(nota):
    import re
    m = re.match(r'^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(\d)$', nota)
    if not m:
        raise ValueError('Nota no válida: ' + nota)
    paso, _ = PASOS[m.group(1)]
    alter = 1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0
    return paso, alter, int(m.group(3))


TIPOS = {16: 'whole', 12: 'half', 8: 'half', 6: 'quarter', 4: 'quarter', 3: 'eighth', 2: 'eighth', 1: '16th'}
PUNTILLO = {12, 6, 3}


def partes(dur):
    """Divide una duración (en divisiones) en figuras escribibles."""
    out = []
    for f in (16, 12, 8, 6, 4, 3, 2, 1):
        while dur >= f:
            out.append(f)
            dur -= f
    return out


def compases(voz, largo_compas, anacrusa):
    """Reparte la voz en compases; las notas que cruzan la barra se dividen con ligadura."""
    eventos = []
    for notas, d in voz:
        div = round(d * DIV)
        if abs(div - d * DIV) > 1e-6:
            raise ValueError(f'duración no representable: {d}')
        eventos.append([notas, div])
    res, actual, lleno = [], [], 0
    limite = anacrusa or largo_compas
    for notas, div in eventos:
        while div > 0:
            cabe = limite - lleno
            toma = min(div, cabe)
            sigue = div > toma
            actual.append((notas, toma, sigue, bool(actual and actual[-1][2] and actual[-1][0] == notas)))
            lleno += toma
            div -= toma
            if lleno == limite:
                res.append(actual)
                actual, lleno, limite = [], 0, largo_compas
    if actual:
        actual.append((None, limite - lleno, False, False))
        res.append(actual)
    return res


def nota_xml(notas, div, pentagrama, ligar_inicio, ligar_fin, voz):
    piezas = []
    lista = notas if isinstance(notas, list) else [notas]
    for f in partes(div):
        for i, n in enumerate(lista):
            x = ['<note>']
            if i > 0:
                x.append('<chord/>')
            if n is None:
                x.append('<rest/>')
            else:
                paso, alter, oct_ = leer(n)
                x.append(f'<pitch><step>{paso}</step>' + (f'<alter>{alter}</alter>' if alter else '') + f'<octave>{oct_}</octave></pitch>')
            x.append(f'<duration>{f}</duration>')
            if n is not None and ligar_fin:
                x.append('<tie type="stop"/>')
            if n is not None and ligar_inicio:
                x.append('<tie type="start"/>')
            x.append(f'<voice>{voz}</voice><type>{TIPOS[f]}</type>')
            if f in PUNTILLO:
                x.append('<dot/>')
            x.append(f'<staff>{pentagrama}</staff>')
            if n is not None and (ligar_inicio or ligar_fin):
                x.append('<notations>' + ('<tied type="stop"/>' if ligar_fin else '') + ('<tied type="start"/>' if ligar_inicio else '') + '</notations>')
            x.append('</note>')
            piezas.append(''.join(x))
    return piezas


def musicxml(obra):
    num, den = obra['compas']
    largo = num * DIV * 4 // den
    anac = round(obra.get('anacrusa', 0) * DIV)
    der = compases(obra['derecha'], largo, anac)
    izq = compases(obra['izquierda'], largo, anac)
    if len(der) != len(izq):
        raise ValueError(f"{obra['titulo']}: la derecha tiene {len(der)} compases y la izquierda {len(izq)}")
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
           '<score-partwise version="3.1">',
           f'<work><work-title>{escape(obra["titulo"])}</work-title></work>',
           f'<identification><creator type="composer">{escape(obra["autor"])}</creator>'
           f'<rights>Dominio público. Arreglo fácil para Pianito.</rights></identification>',
           '<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>',
           '<part id="P1">']
    for i, (cd, ci) in enumerate(zip(der, izq)):
        out.append(f'<measure number="{i + (0 if anac else 1)}"' + (' implicit="yes"' if anac and i == 0 else '') + '>')
        if i == 0:
            out.append(f'<attributes><divisions>{DIV}</divisions><key><fifths>{obra.get("armadura", 0)}</fifths>'
                       + ('<mode>minor</mode>' if obra.get('menor') else '') + '</key>'
                       f'<time><beats>{num}</beats><beat-type>{den}</beat-type></time><staves>2</staves>'
                       '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>'
                       f'<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>'
                       f'<per-minute>{obra.get("tempo", 80)}</per-minute></metronome></direction-type><sound tempo="{obra.get("tempo", 80)}"/></direction>')
        total = 0
        for notas, div, sigue, viene in cd:
            out += nota_xml(notas, div, 1, sigue, viene, 1)
            total += div
        out.append(f'<backup><duration>{total}</duration></backup>')
        for notas, div, sigue, viene in ci:
            out += nota_xml(notas, div, 2, sigue, viene, 2)
        out.append('</measure>')
    out += ['</part>', '</score-partwise>']
    return '\n'.join(out)


def seguido(notas, duraciones):
    if isinstance(duraciones, (int, float)):
        duraciones = [duraciones] * len(notas)
    assert len(notas) == len(duraciones), (len(notas), len(duraciones))
    return list(zip(notas, duraciones))


# ─────────────────────────── OBRAS ───────────────────────────
OBRAS = []

# 1. Estrellita — "Ah, vous dirai-je, maman" (canción popular francesa, s. XVIII)
_m = ['Do4', 'Do4', 'Sol4', 'Sol4', 'La4', 'La4', 'Sol4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4', 'Re4', 'Do4',
      'Sol4', 'Sol4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4', 'Sol4', 'Sol4', 'Fa4', 'Fa4', 'Mi4', 'Mi4', 'Re4']
_m = _m + _m[:14]
_r = ([1] * 6 + [2]) * 6
_bajo1 = [('Do3', 4), ('Fa3', 2), ('Do3', 2), ('Fa3', 2), ('Do3', 2), ('Sol3', 2), ('Do3', 2)]
_bajo2 = [('Do3', 2), ('Fa3', 2), ('Do3', 2), ('Sol3', 2)] * 2
OBRAS.append(dict(archivo='01-estrellita', titulo='Estrellita, ¿dónde estás?', autor='Canción popular francesa',
                  compas=(4, 4), tempo=96, derecha=seguido(_m, _r), izquierda=_bajo1 + _bajo2 + _bajo1))

# 2. Canción de cuna — Johannes Brahms (1868)
_m = ['Mi4', 'Mi4', 'Sol4', 'Mi4', 'Mi4', 'Sol4', 'Mi4', 'Sol4', 'Do5', 'Si4', 'La4', 'La4', 'Sol4',
      'Re4', 'Mi4', 'Fa4', 'Re4', 'Re4', 'Mi4', 'Fa4', 'Re4', 'Fa4', 'Si4', 'La4', 'Sol4', 'Si4', 'Do5']
_r = [0.5, 0.5, 2, 0.5, 0.5, 2, 0.5, 0.5, 1, 1.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 1, 1, 3]
_izq = [(None, 1)] + [(['Do3', 'Sol3'], 3)] * 3 + [(['Si2', 'Sol3'], 3)] * 4 + [(['Do3', 'Sol3'], 3)]
OBRAS.append(dict(archivo='02-cancion-de-cuna-brahms', titulo='Canción de cuna', autor='Johannes Brahms',
                  compas=(3, 4), anacrusa=1, tempo=84, derecha=seguido(_m, _r), izquierda=_izq))

# 3. Canon en Re — Johann Pachelbel (c. 1680), melodía y bajo
_m = ['Fa#5', 'Mi5', 'Re5', 'Do#5', 'Si4', 'La4', 'Si4', 'Do#5', 'Re5', 'Do#5', 'Si4', 'La4', 'Sol4', 'Fa#4', 'Sol4', 'Mi4', 'Fa#4']
_bajo = ['Re3', 'La2', 'Si2', 'Fa#2', 'Sol2', 'Re2', 'Sol2', 'La2']
OBRAS.append(dict(archivo='03-canon-pachelbel', titulo='Canon en Re', autor='Johann Pachelbel',
                  compas=(4, 4), armadura=2, tempo=60, derecha=seguido(_m, [2] * 16 + [4]),
                  izquierda=seguido(_bajo * 2 + ['Re3'], [2] * 16 + [4])))

# 4. Greensleeves — canción tradicional inglesa (s. XVI)
_m = ['La4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Mi5', 'Re5', 'Si4', 'Sol4', 'La4', 'Si4', 'Do5', 'La4', 'La4', 'Sol#4', 'La4', 'Si4', 'Sol#4', 'Mi4',
      'La4', 'Do5', 'Re5', 'Mi5', 'Fa5', 'Mi5', 'Re5', 'Si4', 'Sol4', 'La4', 'Si4', 'Do5', 'Si4', 'La4', 'Sol#4', 'Fa#4', 'Sol#4', 'La4', 'La4']
_r = [x * 2 for x in [0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 1,
                      0.5, 1, 0.5, 0.75, 0.25, 0.5, 1, 0.5, 0.75, 0.25, 0.5, 0.75, 0.25, 0.5, 0.75, 0.25, 0.5, 1.5, 1.5]]
_acordes = ['La2', 'Do3', 'Sol2', 'Mi2', 'La2', 'Mi2', 'Mi2', 'Mi2', 'La2', 'Do3', 'Sol2', 'Mi2', 'La2', 'Mi2', 'La2', 'La2']
OBRAS.append(dict(archivo='04-greensleeves', titulo='Greensleeves', autor='Tradicional inglesa', menor=True,
                  compas=(3, 4), anacrusa=1, tempo=96, derecha=seguido(_m, _r), izquierda=[(None, 1)] + [(b, 3) for b in _acordes]))

# 5. Para Elisa — Ludwig van Beethoven (1810), primera frase
_d = []
_i = []
def _comp(der, izq):
    _d.extend(der)
    _i.extend(izq)
S = 0.25
_comp([(None, 1), ('Mi5', S), ('Re#5', S)], [(None, 1.5)])
_frase = [('Mi5', S), ('Re#5', S), ('Mi5', S), ('Si4', S), ('Re5', S), ('Do5', S)]
for _ in range(2):
    _comp(_frase, [(None, 1.5)])
    _comp([('La4', 0.5), (None, S), ('Do4', S), ('Mi4', S), ('La4', S)], [('La2', S), ('Mi3', S), ('La3', S), (None, 0.75)])
    if _ == 0:
        _comp([('Si4', 0.5), (None, S), ('Mi4', S), ('Sol#4', S), ('Si4', S)], [('Mi2', S), ('Mi3', S), ('Sol#3', S), (None, 0.75)])
        _comp([('Do5', 0.5), (None, S), ('Mi4', S), ('Mi5', S), ('Re#5', S)], [('La2', S), ('Mi3', S), ('La3', S), (None, 0.75)])
    else:
        _comp([('Si4', 0.5), (None, S), ('Mi4', S), ('Do5', S), ('Si4', S)], [('Mi2', S), ('Mi3', S), ('Sol#3', S), (None, 0.75)])
        _comp([('La4', 1.5)], [('La2', S), ('Mi3', S), ('La3', S), (None, 0.75)])
OBRAS.append(dict(archivo='05-para-elisa', titulo='Para Elisa (primera frase)', autor='Ludwig van Beethoven', menor=True,
                  compas=(3, 8), tempo=60, derecha=_d, izquierda=_i))

# 6. Preludio en Do mayor BWV 846 — J. S. Bach (1722), compases 1 a 16 (primera mitad de cada uno)
_bach = [['Do4', 'Mi4', 'Sol4', 'Do5', 'Mi5'], ['Do4', 'Re4', 'La4', 'Re5', 'Fa5'], ['Si3', 'Re4', 'Sol4', 'Re5', 'Fa5'], ['Do4', 'Mi4', 'Sol4', 'Do5', 'Mi5'],
         ['Do4', 'Mi4', 'La4', 'Mi5', 'La5'], ['Do4', 'Re4', 'Fa#4', 'La4', 'Re5'], ['Si3', 'Re4', 'Sol4', 'Re5', 'Sol5'], ['Si3', 'Do4', 'Mi4', 'Sol4', 'Do5'],
         ['La3', 'Do4', 'Mi4', 'Sol4', 'Do5'], ['Re3', 'La3', 'Re4', 'Fa#4', 'Do5'], ['Sol3', 'Si3', 'Re4', 'Sol4', 'Si4'], ['Sol3', 'Sib3', 'Mi4', 'Sol4', 'Do#5'],
         ['Fa3', 'La3', 'Re4', 'La4', 'Re5'], ['Fa3', 'Lab3', 'Re4', 'Fa4', 'Si4'], ['Mi3', 'Sol3', 'Do4', 'Sol4', 'Do5'], ['Mi3', 'Fa3', 'La3', 'Do4', 'Fa4']]
_d, _i = [], []
for c in _bach:
    # En el original, las dos primeras notas son de la izquierda (se mantienen) y las otras tres de la derecha.
    grave, medio, *arriba = c
    _i += [(grave, 2)]
    _d += [(None, S), (medio, S)] + [(n, S) for n in arriba] + [(n, S) for n in arriba]
OBRAS.append(dict(archivo='06-preludio-bach', titulo='Preludio en Do mayor (c. 1-16)', autor='Johann Sebastian Bach',
                  compas=(2, 4), tempo=66, derecha=_d, izquierda=_i))


if __name__ == '__main__':
    aqui = os.path.dirname(os.path.abspath(__file__))
    destino = os.path.join(aqui, '..', '..', 'partituras')
    os.makedirs(destino, exist_ok=True)
    for o in OBRAS:
        ruta = os.path.join(destino, o['archivo'] + '.musicxml')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(musicxml(o))
        print('✔', o['archivo'])
