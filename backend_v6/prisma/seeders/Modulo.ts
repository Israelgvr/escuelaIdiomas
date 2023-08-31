import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class ModuloSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'PARAMETROS',
        posicion: 1
      },{
        nombre: 'USUARIOS',
        posicion: 2
      },{
        nombre: 'FILIALES',
        posicion: 3
      },{
        nombre: 'TIPOS DE ESTUDIANTE',
        posicion: 4
      },{
        nombre: 'IDIOMAS',
        posicion: 5
      },{
        nombre: 'LIBROS',
        posicion: 5
      },{
        nombre: 'CURSOS',
        posicion: 6
      },{
        nombre: 'INSCRIPCIONES',
        posicion: 7
      },{
        nombre: 'ESTUDIANTES',
        posicion: 8
      },{
        nombre: 'REPORTES',
        posicion: 10
      }, {
        nombre: 'FIRMAS',
        posicion: 11
      }, {
        nombre: 'PREINSCRIPCIONES',
        posicion: 12
      },
    ]
    for await (const registro of registros) {
      await prisma.modulo.upsert({
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
