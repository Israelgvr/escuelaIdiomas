import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class FirmasController {
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
        payload: await prisma.firma.findMany({
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
          select: {
            id: true,
            nombre: true,
            cargo: true,
            posicion: true,
          },
          where: {
            filial: {
              id: filialId,
            },
          },
        }),
      })
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.firma.findMany({
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
            OR: [
              {
                nombre: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                cargo: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
        prisma.firma.count({
          where: {
            filial: {
              id: filialId,
            },
            OR: [
              {
                nombre: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                cargo: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            ],
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
          rules.escape(),
          rules.trim(),
        ]),
        cargo: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 0 a 255',
      },
    })
    if ((await prisma.firma.count({
      where: {
        filial: {
          id: payload.filialId,
        },
        cargo: {
          equals: payload.cargo,
          mode: 'insensitive',
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cargo: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.firma.create({
          data: {
            nombre: payload.nombre,
            cargo: payload.cargo,
            posicion: payload.posicion,
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
        payload: await prisma.firma.findUniqueOrThrow({
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
    if ((await prisma.firma.count({
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
          rules.escape(),
          rules.trim(),
        ]),
        cargo: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 0 a 255',
      },
    })
    if ((await prisma.firma.count({
      where: {
        cargo: payload.cargo,
        filial: {
          id: payload.filialId,
        },
        id: {
          not: request.param('id'),
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cargo: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.firma.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            cargo: payload.cargo,
            posicion: payload.posicion,
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
    if ((await prisma.firma.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.firma.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }
}
