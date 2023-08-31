import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class FuerzaSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'Ejército',
        codigo: 'EJTO',
        posicion: 1,
      }, {
        nombre: 'Fuerza Naval',
        codigo: 'FF.NN.',
        posicion: 2,
      }, {
        nombre: 'Fuerza Aérea',
        codigo: 'FF.AA.',
        posicion: 3,
      },
    ]
    for await (const registro of registros) {
      await prisma.fuerza.upsert({
        where: {
          codigo: registro.codigo,
        },
        update: {
          nombre: registro.nombre,
          posicion: registro.posicion,
        },
        create: {
          nombre: registro.nombre,
          codigo: registro.codigo,
          posicion: registro.posicion,
        },
      })
    }
  }
}
