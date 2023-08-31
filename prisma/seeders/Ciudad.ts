import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class CiudadSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'La Paz',
        codigo: 'LP',
        posicion: 1,
      }, {
        nombre: 'Santa Cruz',
        codigo: 'SC',
        posicion: 2,
      }, {
        nombre: 'Cochabamba',
        codigo: 'CB',
        posicion: 3,
      }, {
        nombre: 'Chuquisaca',
        codigo: 'CH',
        posicion: 4,
      }, {
        nombre: 'Oruro',
        codigo: 'OR',
        posicion: 5,
      }, {
        nombre: 'Potosí',
        codigo: 'PT',
        posicion: 6,
      }, {
        nombre: 'Tarija',
        codigo: 'TJ',
        posicion: 7,
      }, {
        nombre: 'Beni',
        codigo: 'BN',
        posicion: 8,
      }, {
        nombre: 'Pando',
        codigo: 'PD',
        posicion: 9,
      },
    ]
    for await (const registro of registros) {
      await prisma.ciudad.upsert({
        where: {
          nombre: registro.nombre,
        },
        update: {
          codigo: registro.codigo,
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
