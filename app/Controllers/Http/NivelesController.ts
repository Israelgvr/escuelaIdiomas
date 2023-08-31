import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class NivelesController {
  public async index({ request, response }: HttpContextContract) {
    const buscar: string = request.input('buscar') || ''
    if ((await prisma.idioma.count({
      where: {
        id: request.param('idiomaId'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }

    return response.send({
      message: 'Lista de registros',
      payload: await prisma.nivel.findMany({
        orderBy: [
          { posicion: 'asc' },
          { codigo: 'asc' },
          { nombre: 'asc' },
        ],
        include: {
          libros: {
            orderBy: [
              { codigo: 'asc' },
              { nombre: 'asc' },
              { edicion: 'desc' },
            ],
          },
        },
        where: {
          idioma: {
            id: request.param('idiomaId'),
          },
          OR: [
            {
              nombre: {
                contains: buscar,
                mode: 'insensitive',
              },
            }, {
              codigo: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    if ((await prisma.idioma.count({
      where: {
        id: request.param('idiomaId'),
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
        codigo: schema.string([
          rules.maxLength(20),
          rules.trim(),
        ]),
        posicion: schema.number.optional([
          rules.range(1, 255),
        ]),
        libros: schema.array.nullable([
          rules.minLength(0),
        ]).members(
          schema.string(),
        ),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 1 a 255',
        'libros.array': 'El nivel debe asociarse al menos a un libro',
      },
    })
    if ((await prisma.nivel.count({
      where: {
        codigo: {
          equals: payload.codigo,
          mode: 'insensitive',
        },
        idioma: {
          id: request.param('idiomaId'),
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
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.nivel.create({
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            posicion: payload.posicion,
            idioma: {
              connect: { id: request.param('idiomaId') },
            },
            libros: {
              connect: payload.libros?.map(o => ({ id: o }))
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
        payload: await prisma.nivel.findUniqueOrThrow({
          where: {
            id: request.param('nivelId'),
          },
          include: {
            libros: {
              orderBy: [
                {
                  codigo: 'asc',
                }, {
                  nombre: 'asc',
                }, {
                  edicion: 'desc',
                },
              ],
            },
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
    if ((await prisma.idioma.count({
      where: {
        id: request.param('idiomaId'),
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
        codigo: schema.string([
          rules.maxLength(20),
          rules.trim(),
        ]),
        posicion: schema.number.optional([
          rules.range(1, 255),
        ]),
        libros: schema.array.nullable([
          rules.minLength(0),
        ]).members(
          schema.string(),
        ),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 1 a 255',
        'libros.array': 'El nivel debe asociarse al menos a un libro',
      },
    })
    if ((await prisma.nivel.count({
      where: {
        codigo: {
          equals: payload.codigo,
          mode: 'insensitive',
        },
        idioma: {
          id: request.param('idiomaId'),
        },
        id: {
          not: request.param('nivelId')
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
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.nivel.update({
          where: {
            id: request.param('nivelId'),
          },
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            posicion: payload.posicion,
            idioma: {
              connect: { id: request.param('idiomaId') },
            },
            libros: {
              set: payload.libros?.map(o => ({ id: o }))
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
    if ((await prisma.nivel.count({
      where: {
        id: request.param('nivelId'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.nivel.update({
      where: {
        id: request.param('nivelId'),
      },
      data: {
        libros: {
          set: [],
        },
        cursos: {
          set: [],
        },
      },
    })
    await prisma.nivel.delete({
      where: {
        id: request.param('nivelId'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }
}
