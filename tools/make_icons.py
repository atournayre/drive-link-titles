"""Génère icons/icon{16,48,128}.png (reproductible : python3 tools/make_icons.py)."""
from PIL import Image, ImageDraw

S = 1024  # rendu 8x puis réduction (anti-aliasing)

def draw():
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = S * 16 // 128          # 16 px de marge sur 128 (doc Chrome Web Store)
    x0, y0, x1, y1 = pad, pad, S - pad, S - pad
    fold = (x1 - x0) * 0.30
    r = S * 0.06
    # page bleue, coin haut-droit plié
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill='#4285f4')
    d.polygon([(x1 - fold, y0 - 1), (x1 + 1, y0 - 1), (x1 + 1, y0 + fold)], fill=(0, 0, 0, 0))
    d.polygon([(x1 - fold, y0), (x1, y0 + fold), (x1 - fold, y0 + fold)], fill='#a8c7fa')
    # "titre" : puce d'icône + ligne de texte, puis deux lignes grises
    w = x1 - x0
    lh = w * 0.075
    def bar(y, xs, xe, color='#ffffff'):
        d.rounded_rectangle([xs, y, xe, y + lh], radius=lh / 2, fill=color)
    left = x0 + w * 0.16
    d.rounded_rectangle([left, y0 + w * 0.46, left + w * 0.17, y0 + w * 0.46 + w * 0.17], radius=w * 0.03, fill='#ffffff')
    bar(y0 + w * 0.51, left + w * 0.26, x1 - w * 0.16)
    bar(y0 + w * 0.70, left, x1 - w * 0.16, '#d2e3fc')
    bar(y0 + w * 0.82, left, x1 - w * 0.40, '#d2e3fc')
    return img

big = draw()
for n in (16, 48, 128):
    big.resize((n, n), Image.LANCZOS).save(f'icons/icon{n}.png')
    print('icons/icon%d.png' % n)
