"""
Genera el icono de Navegador X (build/icon.ico) con Pillow.

Diseño: cuadrado redondeado oscuro con una "X" en degradado magenta → cian,
coherente con la paleta de la interfaz. Se dibuja vectorialmente (sin fuentes)
para que el resultado sea idéntico en cualquier máquina.

Uso:
    python scripts/generate-icon.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw

SIZE = 1024
MAGENTA = (255, 60, 172)
CYAN = (0, 210, 255)
BACKGROUND_TOP = (13, 16, 22)
BACKGROUND_BOTTOM = (5, 6, 10)
BORDER = (44, 52, 66)

OUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build", "icon.ico")
PNG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build", "icon.png")


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    gradient = Image.new("RGB", (1, size))
    for y in range(size):
        ratio = y / max(1, size - 1)
        gradient.putpixel(
            (0, y),
            tuple(round(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3)),
        )
    return gradient.resize((size, size))


def diagonal_gradient(size: int, start: tuple[int, int, int], end: tuple[int, int, int]) -> Image.Image:
    """Degradado en diagonal de 45°, del color `start` (arriba-izquierda) a `end`."""
    gradient = Image.new("RGB", (size, size))
    pixels = gradient.load()
    for y in range(size):
        for x in range(size):
            ratio = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(round(start[i] + (end[i] - start[i]) * ratio) for i in range(3))
    return gradient


def build_icon() -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # Fondo: cuadrado redondeado con degradado vertical y borde sutil.
    background = vertical_gradient(SIZE, BACKGROUND_TOP, BACKGROUND_BOTTOM).convert("RGBA")
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=int(SIZE * 0.22), fill=255)
    canvas.paste(background, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        [2, 2, SIZE - 3, SIZE - 3],
        radius=int(SIZE * 0.22),
        outline=BORDER,
        width=max(2, SIZE // 220),
    )

    # La "X": dos barras diagonales con extremos redondeados.
    stroke_mask = Image.new("L", (SIZE, SIZE), 0)
    stroke_draw = ImageDraw.Draw(stroke_mask)

    inset = SIZE * 0.26
    width = int(SIZE * 0.135)
    cap_radius = width // 2
    a = (inset, inset)
    b = (SIZE - inset, SIZE - inset)
    c = (SIZE - inset, inset)
    d = (inset, SIZE - inset)

    for start, end in ((a, b), (c, d)):
        stroke_draw.line([start, end], fill=255, width=width)
        for point in (start, end):
            stroke_draw.ellipse(
                [point[0] - cap_radius, point[1] - cap_radius, point[0] + cap_radius, point[1] + cap_radius],
                fill=255,
            )

    gradient = diagonal_gradient(SIZE, MAGENTA, CYAN).convert("RGBA")
    canvas.paste(gradient, (0, 0), stroke_mask)

    return canvas


def main() -> None:
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    icon = build_icon()

    png = icon.resize((512, 512), Image.LANCZOS)
    png.save(PNG_PATH, format="PNG")

    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icon.save(OUT_PATH, format="ICO", sizes=sizes)

    print(f"Icono generado: {OUT_PATH}")
    print(f"Vista previa PNG: {PNG_PATH}")


if __name__ == "__main__":
    main()
