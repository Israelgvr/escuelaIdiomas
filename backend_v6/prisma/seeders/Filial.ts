import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class FilialSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'Escuela de Idiomas del Ejército - Achacachi',
        codigo: 'EIE-ACH-01',
        ciudad: 'LP',
        localidad: 'Achacachi',
        direccion: 'Av. Prueba #123',
        celular: 6543210,
        telefono: null,
        posicion: 1,
      }, {
        nombre: 'Escuela de Idiomas del Ejército - La Paz',
        codigo: 'EIE-LP-02',
        ciudad: 'LP',
        localidad: 'La Paz',
        direccion: 'Calle Murillo #456',
        celular: 7654321,
        telefono: 2415700,
        posicion: 2,
      }, {
        nombre: 'Escuela de Idiomas del Ejército - Quillacollo',
        codigo: 'EIE-CB-01',
        ciudad: 'CB',
        localidad: 'Quillacollo',
        direccion: 'Av. Test #789',
        celular: null,
        telefono: 2345410,
        posicion: 3,
      },
    ]
    for await (const registro of registros) {
      const ciudad = await prisma.ciudad.findFirst({
        where: {
          codigo: registro.ciudad,
        },
        select: {
          id: true,
        },
      })
      if (ciudad) {
        await prisma.filial.upsert({
          where: {
            nombre_codigo: {
              nombre: registro.nombre,
              codigo: registro.codigo,
            },
          },
          update: {
            nombre: registro.nombre,
            ciudad: {
              connect: ciudad,
            },
            localidad: registro.localidad,
            direccion: registro.direccion,
            celular: registro.celular,
            telefono: registro.telefono,
            posicion: registro.posicion,
          },
          create: {
            nombre: registro.nombre,
            codigo: registro.codigo,
            ciudad: {
              connect: ciudad,
            },
            localidad: registro.localidad,
            direccion: registro.direccion,
            celular: registro.celular,
            telefono: registro.telefono,
            posicion: registro.posicion,
          },
        })
      }
    }
  }
}
