import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class TiposEstudianteController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const combo: boolean = JSON.parse(request.input('combo') || false)
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    if (combo) {
      return response.send({
        message: 'Lista de registros',
        payload: await prisma.tipoEstudiante.findMany({
          where: {
            filial: {
              id: filialId,
            },
          },
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
        }),
      })
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.tipoEstudiante.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
          where: {
            filial: {
              id: filialId,
            },
            nombre: {
              contains: buscar,
              mode: 'insensitive',
            },
          },
        }),
        prisma.tipoEstudiante.count({
          where: {
            filial: {
              id: filialId,
            },
            nombre: {
              contains: buscar,
              mode: 'insensitive',
            },
          },
        })
      ])
      return response.send({
        message: 'Lista de registros',
        payload: {
          data: data,
          meta: {
            lastPage: Math.ceil(total/porPagina),
            total: total,
          }
        },
      })
    }
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        descuentoPorcentaje: schema.number.optional([
          rules.range(0, 100),
        ]),
        militar: schema.boolean(),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        filialId: schema.string(),
      }),
    })
    if ((await prisma.tipoEstudiante.count({
      where: {
        filial: {
          id: payload.filialId,
        },
        nombre: {
          equals: payload.nombre,
          mode: 'insensitive',
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          nombre: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.tipoEstudiante.create({
          data: {
            nombre: payload.nombre,
            posicion: payload.posicion,
            descuentoPorcentaje: payload.descuentoPorcentaje,
            militar: payload.militar,
            filial: {
              connect: { id: payload.filialId },
            },
          },
        }),
      })
    } catch(err) {
      Logger.error(err)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async show({ request, response }: HttpContextContract) {
    try {
      return response.send({
        message: 'Detalle del registro',
        payload: await prisma.tipoEstudiante.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
        }),
      })
    } catch(err) {
      Logger.error(err)
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
  }

  public async update({ request, response }: HttpContextContract) {
    if ((await prisma.tipoEstudiante.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        descuentoPorcentaje: schema.number.optional([
          rules.range(0, 100),
        ]),
        militar: schema.boolean(),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        filialId: schema.string(),
      }),
    })
    if ((await prisma.tipoEstudiante.count({
      where: {
        filial: {
          id: payload.filialId,
        },
        nombre: {
          equals: payload.nombre,
          mode: 'insensitive',
        },
        id: {
          not: request.param('id'),
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          nombre: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.tipoEstudiante.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            posicion: payload.posicion,
            descuentoPorcentaje: payload.descuentoPorcentaje,
            militar: payload.militar,
            filial: {
              connect: { id: payload.filialId },
            },
          },
        }),
      })
    } catch(err) {
      Logger.error(err)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async destroy({ request, response }: HttpContextContract) {
    if ((await prisma.tipoEstudiante.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.tipoEstudiante.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }
}
