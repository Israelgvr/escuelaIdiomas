import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class ModalidadSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'Presencial',
        posicion: 1,
      }, {
        nombre: 'Virtual',
        posicion: 2,
      },
    ]
    for await (const registro of registros) {
      await prisma.modalidad.upsert({
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
