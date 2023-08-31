import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class RolSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'ADMINISTRADOR',
        posicion: 1,
        modulos: [
          'PARAMETROS',
          'USUARIOS',
          'FILIALES',
          'TIPOS DE ESTUDIANTE',
          'IDIOMAS',
          'LIBROS',
          'FIRMAS',
        ],
      }, {
        nombre: 'JEFE DE SECCIÓN ACADÉMICA',
        posicion: 2,
        modulos: [
          'CURSOS',
          'ESTUDIANTES',
          'INSCRIPCIONES',
          'REPORTES',
          'PREINSCRIPCIONES',
        ],
      }, {
        nombre: 'JEFE DE EVALUACIONES',
        posicion: 3,
        modulos: [],
      }, {
        nombre: 'COMANDANTE',
        posicion: 4,
        modulos: [],
      }, {
        nombre: 'SECRETARÍA',
        posicion: 5,
        modulos: [],
      }, {
        nombre: 'DOCENTE',
        posicion: 6,
        modulos: [],
      }, {
        nombre: 'ESTUDIANTE',
        posicion: 7,
        modulos: [],
      },
    ]
    for await (const registro of registros) {
      const modulos = await prisma.modulo.findMany({
        where: {
          nombre: {
            in: registro.modulos
          }
        },
        select: {
          id: true,
        },
      })
      await prisma.rol.upsert({
        where: {
          nombre: registro.nombre,
        },
        update: {
          posicion: registro.posicion,
          modulos: {
            connect: modulos
          },
        },
        create: {
          nombre: registro.nombre,
          posicion: registro.posicion,
          modulos: {
            connect: modulos
          },
        },
      })
    }
  }
}
