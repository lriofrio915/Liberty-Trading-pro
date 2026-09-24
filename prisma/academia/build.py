"""Genera el seed de Prisma y el SQL de la Academia desde lecciones.py.

Uso: python prisma/academia/build.py
"""
import json
import pathlib
import re

from lecciones import LECCIONES, MODULOS

AQUI = pathlib.Path(__file__).parent
PRISMA = AQUI.parent


def compactar(html: str) -> str:
    # La Academia convierte '\n' en <br/>: el HTML debe ir en una sola línea.
    return re.sub(r'>\s+<', '><', ' '.join(l.strip() for l in html.strip().splitlines()))


def filas():
    orden = {}
    for l in LECCIONES:
        cat = MODULOS[l['modulo']]
        orden[cat] = orden.get(cat, 0) + 1
        yield {
            'titulo': l['titulo'],
            'descripcion': l['descripcion'],
            'contenido': compactar(l['contenido']),
            'videoUrl': None,
            'orden': orden[cat],
            'categoria': cat,
            'publicado': True,
        }


def sql_str(v):
    return 'NULL' if v is None else "'" + str(v).replace("'", "''") + "'"


def main():
    data = list(filas())

    seed = (
        "// Generado por prisma/academia/build.py desde prisma/academia/lecciones.py — no editar a mano.\n"
        "import { PrismaClient } from '@prisma/client'\n\n"
        "const prisma = new PrismaClient()\n\n"
        f"const lecciones = {json.dumps(data, ensure_ascii=False, indent=2)}\n\n"
        "async function main() {\n"
        "  console.log('🎓 Seeding academia...')\n"
        "  await prisma.leccionProgreso.deleteMany({})\n"
        "  await prisma.leccion.deleteMany({})\n"
        "  for (const l of lecciones) {\n"
        "    await prisma.leccion.create({ data: l })\n"
        "    console.log(`  ✓ ${l.categoria} → ${l.titulo}`)\n"
        "  }\n"
        "  console.log(`\\n✅ ${lecciones.length} lecciones creadas`)\n"
        "}\n\n"
        "main().catch(console.error).finally(() => prisma.$disconnect())\n"
    )
    (PRISMA / 'seed-academia.ts').write_text(seed, encoding='utf-8')

    valores = ',\n'.join(
        "  ('lq_' || substr(md5(random()::text || clock_timestamp()::text), 1, 22), "
        f"{sql_str(f['titulo'])}, {sql_str(f['descripcion'])}, {sql_str(f['contenido'])}, "
        f"NULL, {f['orden']}, {sql_str(f['categoria'])}, true, now(), now())"
        for f in data
    )
    sql = (
        '-- Generado por prisma/academia/build.py — temario de trading algorítmico cuantitativo.\n'
        'INSERT INTO "Leccion" (id, titulo, descripcion, contenido, "videoUrl", orden, categoria, publicado, "creadoEn", "actualizadoEn") VALUES\n'
        f'{valores};\n'
    )
    (AQUI / 'lecciones.sql').write_text(sql, encoding='utf-8')
    print(f'{len(data)} lecciones en {len(MODULOS)} módulos')


if __name__ == '__main__':
    main()
