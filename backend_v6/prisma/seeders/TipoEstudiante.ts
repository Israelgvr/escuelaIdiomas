import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'

export default class TipoEstudianteSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'Alumno militar destinado',
        descuentoPorcentaje: 100,
        posicion: 1,
        militar: true,
      }, {
        nombre: 'Alumno militar',
        descuentoPorcentaje: 25,
        posicion: 2,
        militar: true,
      }, {
        nombre: 'Personal civil',
        descuentoPorcentaje: 0,
        posicion: 3,
        militar: false,
      }, {
        nombre: 'Soldado',
        descuentoPorcentaje: 25,
        posicion: 4,
        militar: false,
      }, {
        nombre: 'Pre-militar',
        descuentoPorcentaje: 20,
        posicion: 5,
        militar: false,
      }, {
        nombre: 'Estudiante E.M.I.',
        descuentoPorcentaje: 20,
        posicion: 6,
        militar: false,
      }, {
        nombre: 'Familiar en 1er grado',
        descuentoPorcentaje: 25,
        posicion: 7,
        militar: false,
      }, {
        nombre: 'Familiar en 1er grado con descuento total',
        descuentoPorcentaje: 100,
        posicion: 8,
        militar: false,
      },
    ]
    const filiales = await prisma.filial.findMany()
    for await (const registro of registros) {
      for await (const filial of filiales) {
        await prisma.tipoEstudiante.upsert({
          where: {
            nombre_filialId: {
              nombre: registro.nombre,
              filialId: filial.id,
            },
          },
          update: {
            posicion: registro.posicion,
            descuentoPorcentaje: registro.descuentoPorcentaje,
            militar: registro.militar,
            filial: {
              connect: { id: filial.id },
            },
          },
          create: {
            nombre: registro.nombre,
            posicion: registro.posicion,
            descuentoPorcentaje: registro.descuentoPorcentaje,
            militar: registro.militar,
            filial: {
              connect: { id: filial.id },
            },
          },
        })
      }
    }
  }
}
