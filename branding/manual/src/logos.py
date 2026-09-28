"""Genera el sistema de logos de Liberty Trading Club como SVG con texto en trazos.

Uso: python logos.py  ->  escribe en ../../assets/liberty-trading-club/
Las fuentes están en ./fonts (Google Fonts, licencia OFL).
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).parent
OUT = HERE.parent.parent / 'assets' / 'liberty-trading-club'
OUT.mkdir(parents=True, exist_ok=True)

GOLD, GOLD_L, GOLD_D = '#C9A84C', '#E8C96A', '#9A7A30'
INK, CREAM, STONE, INK_LIGHT = '#080808', '#f0ece4', '#8a8480', '#1a1612'

serif = instantiateVariableFont(TTFont(HERE / 'fonts/CormorantGaramond-Italic-VF.ttf'), {'wght': 300})
mono = TTFont(HERE / 'fonts/DMMono-Regular.ttf')


def text_path(font, text, size, x=0.0, y=0.0, tracking=0.0, anchor='start'):
    """Devuelve (d, ancho) del texto en trazos, con la línea base en y."""
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    s = size / upm
    names = [cmap[ord(c)] for c in text]
    width = sum(gs[n].width * s for n in names) + tracking * (len(names) - 1)
    if anchor == 'middle':
        x -= width / 2
    elif anchor == 'end':
        x -= width
    pen = SVGPathPen(gs)
    cx = x
    for n in names:
        gs[n].draw(TransformPen(pen, (s, 0, 0, -s, cx, y)))
        cx += gs[n].width * s + tracking
    return pen.getCommands(), width


def grad(id_, a, b, c):
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{a}"/><stop offset=".5" stop-color="{b}"/>'
            f'<stop offset="1" stop-color="{c}"/></linearGradient>')


def svg(w, h, body, defs='', label='Liberty Trading Club'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}" role="img" aria-label="{label}">'
            f'<defs>{defs}</defs>{body}</svg>\n')


# Paletas por variante: (relleno "Liberty", color descriptor, color regla, fondo del isotipo, borde isotipo)
VARIANTS = {
    'oscuro':  dict(main='url(#g)', desc=CREAM, rule=GOLD, box=INK, stroke='url(#g)', g=(GOLD_D, GOLD, GOLD_L)),
    'claro':   dict(main='url(#g)', desc=INK_LIGHT, rule=GOLD_D, box='#f5f2eb', stroke='url(#g)', g=('#7d6224', GOLD_D, GOLD)),
    'oro':     dict(main=GOLD, desc=GOLD, rule=GOLD, box='none', stroke=GOLD, g=None),
    'negro':   dict(main=INK, desc=INK, rule=INK, box='none', stroke=INK, g=None),
    'blanco':  dict(main='#ffffff', desc='#ffffff', rule='#ffffff', box='none', stroke='#ffffff', g=None),
}


def defs_for(v):
    return grad('g', *v['g']) if v['g'] else ''


def isotipo_body(v, x=0, y=0, size=512):
    """Caja redondeada + "L" italic cuyo pie se prolonga en tres barras ascendentes."""
    k = size / 512
    L, _ = text_path(serif, 'L', 330 * k, x + 122 * k, y + 360 * k)
    bars = ''
    for i, hgt in enumerate((58, 96, 138)):
        bx = x + (290 + i * 40) * k
        by = y + (360 - hgt) * k
        bars += f'<rect x="{bx:.1f}" y="{by:.1f}" width="{24*k:.1f}" height="{hgt*k:.1f}" rx="{3*k:.1f}" fill="{v["main"]}"/>'
    box = ''
    if v['box'] != 'none':
        box = f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="{104*k:.1f}" fill="{v["box"]}"/>'
    border = (f'<rect x="{x+18*k:.1f}" y="{y+18*k:.1f}" width="{476*k:.1f}" height="{476*k:.1f}" '
              f'rx="{88*k:.1f}" fill="none" stroke="{v["stroke"]}" stroke-width="{8*k:.1f}"/>')
    rule = f'<rect x="{x+110*k:.1f}" y="{y+384*k:.1f}" width="{236*k:.1f}" height="{3*k:.1f}" fill="{v["rule"]}" opacity=".55"/>'
    return box + border + f'<path d="{L}" fill="{v["main"]}"/>' + bars + rule


def wordmark_body(v, cx, top, scale=1.0, endorsed=False):
    """"Liberty" + regla + "TRADING CLUB" (+ "POR LUIS RIOFRIO"). Devuelve (body, ancho, alto)."""
    lib, lw = text_path(serif, 'Liberty', 120 * scale, cx, top + 100 * scale, -2 * scale, 'middle')
    tc, tw = text_path(mono, 'TRADING CLUB', 24 * scale, cx, top + 196 * scale, 11 * scale, 'middle')
    rw = max(lw, tw) * 0.72
    body = (f'<path d="{lib}" fill="{v["main"]}"/>'
            f'<rect x="{cx-rw/2:.1f}" y="{top+146*scale:.1f}" width="{rw:.1f}" height="{2*scale:.1f}" fill="{v["rule"]}" opacity=".55"/>'
            f'<path d="{tc}" fill="{v["desc"]}"/>')
    h = 210 * scale
    if endorsed:
        por, _ = text_path(mono, 'POR LUIS RIOFRIO', 16 * scale, cx, top + 244 * scale, 6 * scale, 'middle')
        col = STONE if v is VARIANTS['oscuro'] else v['desc']
        body += f'<path d="{por}" fill="{col}" />'
        h = 260 * scale
    return body, max(lw, tw), h


written = []
for name, v in VARIANTS.items():
    d = defs_for(v)
    # Isotipo
    (OUT / f'isotipo-{name}.svg').write_text(svg(512, 512, isotipo_body(v), d), encoding='utf-8')
    # Logotipo (vertical)
    body, w, h = wordmark_body(v, 360, 20)
    (OUT / f'logotipo-{name}.svg').write_text(svg(720, 240, body, d), encoding='utf-8')
    # Logotipo con respaldo
    body, w, h = wordmark_body(v, 360, 20, endorsed=True)
    (OUT / f'logotipo-respaldo-{name}.svg').write_text(svg(720, 290, body, d), encoding='utf-8')
    # Horizontal: isotipo + logotipo
    iso = isotipo_body(v, 20, 26, 200)
    wb, ww, wh = wordmark_body(v, 0, 0, 1.0)
    wb = f'<g transform="translate({268 + ww/2:.1f},22)">{wb}</g>'
    (OUT / f'horizontal-{name}.svg').write_text(svg(int(290 + ww), 252, iso + wb, d), encoding='utf-8')
    written += [f'isotipo-{name}', f'logotipo-{name}', f'logotipo-respaldo-{name}', f'horizontal-{name}']

print(len(written), 'logos en', OUT)
