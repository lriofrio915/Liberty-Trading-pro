"""Exporta las piezas de piezas.html y los logos SVG a PNG con Chrome headless."""
import subprocess, sys
from pathlib import Path
HERE = Path(__file__).parent.resolve()
ASSETS = HERE.parent.parent / 'assets' / 'liberty-trading-club'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = r'C:\Users\Administrator\AppData\Local\Temp\2\chrome-headless-brand'

def shot(url, w, h, out, transparent=False):
    args = [CHROME, '--headless=new', '--disable-gpu', f'--user-data-dir={PROFILE}', '--hide-scrollbars',
            '--force-device-scale-factor=1', f'--window-size={w},{h}', '--virtual-time-budget=4000', f'--screenshot={out}']
    if transparent:
        args.append('--default-background-color=00000000')
    subprocess.run(args + [url], check=True, capture_output=True)

PIECES = {'ig-post': (1080, 1080), 'reel-cover': (1080, 1920), 'story-cta': (1080, 1920),
          'fb-cover-liberty': (1640, 624), 'fb-cover-luis': (1640, 624), 'avatar': (1080, 1080),
          'tarjeta-anverso': (1050, 600), 'tarjeta-reverso': (1050, 600), 'certificado': (1754, 1240),
          'hotmart': (1920, 1080)}
out = ASSETS / 'piezas'; out.mkdir(exist_ok=True)
only = sys.argv[1:]
for pid, (w, h) in PIECES.items():
    if only and pid not in only: continue
    shot((HERE / 'piezas.html').as_uri() + f'?p={pid}', w, h, str(out / f'{pid}.png'))
    print('pieza', pid)

if not only:
    png = ASSETS / 'png'; png.mkdir(exist_ok=True)
    for svg in sorted(ASSETS.glob('*.svg')):
        txt = svg.read_text(encoding='utf-8')
        w = int(txt.split('width="')[1].split('"')[0]); h = int(txt.split('height="')[1].split('"')[0])
        k = 2  # exportar al doble de tamaño
        page = HERE / '_logo.html'
        page.write_text(f'<html><body style="margin:0;background:transparent"><img src="{svg.as_uri()}" '
                        f'style="width:{w*k}px;height:{h*k}px;display:block"></body></html>', encoding='utf-8')
        shot(page.as_uri(), w * k, h * k, str(png / (svg.stem + '.png')), transparent=True)
    page.unlink()
    print('logos png:', len(list(png.glob('*.png'))))
