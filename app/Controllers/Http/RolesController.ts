import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class RolesController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const combo: boolean = JSON.parse(request.input('combo') || false)

    if (combo) {
      return response.send({
        message: 'Lista de registros',
        payload: await prisma.rol.findMany({
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
          select: {
            id: true,
            nombre: true,
          },
        }),
      })
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.rol.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
          where: {
            nombre: {
              contains: buscar,
              mode: 'insensitive',
            },
          },
        }),
        prisma.rol.count({
          where: {
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
          rules.escape(),
          rules.trim(),
        ]),
        posicion: schema.number.optional([
          rules.range(0, 255)
        ]),
        modulos: schema.array([
          rules.minLength(1),
        ]).members(
          schema.string(),
        ),
      }),
      messages: {
        'modulos.array': 'Al menos un módulo debe asociarse al rol',
      }
    })
    if ((await prisma.rol.count({
      where: {
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
      const modulos = payload.modulos.map(o => ({
        id: o,
      }))
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.rol.create({
          data: {
            nombre: payload.nombre,
            posicion: payload.posicion,
            modulos: {
              connect: modulos,
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
        payload: await prisma.rol.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
            modulos: true,
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
    const registro = await prisma.rol.findFirst({
      where: {
        id: request.param('id'),
      },
    })
    if (!registro) {
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
        posicion: schema.number.optional([
          rules.range(0, 255)
        ]),
        modulos: schema.array([
          rules.minLength(1),
        ]).members(
          schema.string(),
        ),
      }),
      messages: {
        'modulos.array': 'Al menos un módulo debe asociarse al rol',
      }
    })
    if ((await prisma.rol.count({
      where: {
        nombre: registro.nombre.toUpperCase() === 'ADMINISTRADOR' ? registro.nombre : payload.nombre,
        id: {
          not: request.param('id'),
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          codigo: ['El registro ya existe'],
        },
      })
    }
    try {
      const modulos = payload.modulos.map(o => ({
        id: o,
      }))
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.rol.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            posicion: payload.posicion,
            modulos: {
              set: modulos,
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
    const registro = await prisma.rol.findFirst({
      where: {
        id: request.param('id'),
      },
    })
    if (!registro) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    if (registro.nombre.toUpperCase() === 'ADMINISTRADOR') {
      return response.status(404).send({
        message: 'El rol ADMINSTRADOR no puede ser eliminado',
      })
    }
    await prisma.rol.update({
      where: {
        id: request.param('id'),
      },
      data: {
        modulos: {
          set: [],
        },
      },
    })
    await prisma.rol.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }
}
