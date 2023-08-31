import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class ParentescoSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'PADRE',
        posicion: 1,
      }, {
        nombre: 'MADRE',
        posicion: 2,
      }, {
        nombre: 'ESPOSO',
        posicion: 3,
      }, {
        nombre: 'ESPOSA',
        posicion: 4,
      }, {
        nombre: 'HIJO',
        posicion: 5,
      }, {
        nombre: 'HIJA',
        posicion: 6,
      }, {
        nombre: 'HERMANO',
        posicion: 7,
      }, {
        nombre: 'HERMANA',
        posicion: 8,
      }, {
        nombre: 'ABUELO',
        posicion: 9,
      }, {
        nombre: 'ABUELA',
        posicion: 10,
      }, {
        nombre: 'TÍO',
        posicion: 11,
      }, {
        nombre: 'TÍA',
        posicion: 12,
      }, {
        nombre: 'SOBRINO',
        posicion: 13,
      }, {
        nombre: 'SOBRINA',
        posicion: 14,
      }, {
        nombre: 'SUEGRO',
        posicion: 15,
      }, {
        nombre: 'SUEGRA',
        posicion: 16,
      }, {
        nombre: 'YERNO',
        posicion: 17,
      }, {
        nombre: 'NUERA',
        posicion: 18,
      }, {
        nombre: 'CUÑADO',
        posicion: 19,
      }, {
        nombre: 'CUÑADA',
        posicion: 20,
      }, {
        nombre: 'NIETO',
        posicion: 21,
      }, {
        nombre: 'NIETA',
        posicion: 22,
      }, {
        nombre: 'BISABUELO',
        posicion: 23,
      }, {
        nombre: 'BISABUELA',
        posicion: 24,
      }, {
        nombre: 'BISNIETO',
        posicion: 25,
      }, {
        nombre: 'BISNIETA',
        posicion: 26,
      },
    ]
    for await (const registro of registros) {
      await prisma.parentesco.upsert({
        where: {
          nombre: registro.nombre,
        },
        update: {
          posicion: registro.posicion,
        },
        create: {
          nombre: registro.nombre,
          posicion: registro.posicion,
        },
      })
    }
  }
}
