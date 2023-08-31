import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class PreInscripcionesController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const filtroIdioma: string = request.input('idiomaId') || ''
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    if (filtroIdioma === '') {
      const [ data, total ] = await prisma.$transaction([
        prisma.preInscripcion.findMany({
          include: {
            idioma: true,
            modalidad: true,
            ciudad: true,
          },
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { createdAt: 'asc' },
            { nombre: 'asc' },
            { apellidoPaterno: 'asc' },
            { apellidoMaterno: 'asc' },
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
                apellidoPaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                apellidoMaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
        prisma.preInscripcion.count({
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
                apellidoPaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                apellidoMaterno: {
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
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.preInscripcion.findMany({
          include: {
            idioma: true,
            modalidad: true,
            ciudad: true,
          },
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { createdAt: 'asc' },
            { nombre: 'asc' },
            { apellidoPaterno: 'asc' },
            { apellidoMaterno: 'asc' },
          ],
          where: {
            idioma: {
              id: filtroIdioma
            },
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
                apellidoPaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                apellidoMaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
        prisma.preInscripcion.count({
          where: {
            idioma: {
              id: filtroIdioma
            },
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
                apellidoPaterno: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              }, {
                apellidoMaterno: {
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
        apellidoPaterno: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        apellidoMaterno: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        email: schema.string([
          rules.maxLength(255),
          rules.email(),
        ]),
        cedula: schema.number([
          rules.range(1, 18446744073709551615),
        ]),
        cedulaComplemento: schema.string.nullable([
          rules.maxLength(4),
          rules.escape(),
          rules.trim(),
        ]),
        ciudadId: schema.string(),
        celular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        telefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        idiomaId: schema.string(),
        filialId: schema.string(),
        modalidadId: schema.string(),
      }),
    })
    if ((await prisma.preInscripcion.count({
      where: {
        cedula: payload.cedula,
        ciudad: {
          id: payload.ciudadId,
        },
        filial: {
          id: payload.filialId,
        },
        idioma: {
          id: payload.idiomaId,
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cedula: ['El registro ya existe'],
          ciudad: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.preInscripcion.create({
          data: {
            nombre: payload.nombre,
            apellidoPaterno: payload.apellidoPaterno,
            apellidoMaterno: payload.apellidoMaterno,
            email: payload.email,
            cedula: payload.cedula,
            cedulaComplemento: payload.cedulaComplemento,
            ciudad: {
              connect: { id: payload.ciudadId },
            },
            celular: payload.celular,
            telefono: payload.telefono,
            idioma: {
              connect: { id: payload.idiomaId },
            },
            filial: {
              connect: { id: payload.filialId },
            },
            modalidad: {
              connect: { id: payload.modalidadId },
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
        payload: await prisma.preInscripcion.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
            idioma: true,
            modalidad: true,
            ciudad: true,
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
    if ((await prisma.preInscripcion.count({
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
        apellidoPaterno: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        apellidoMaterno: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        email: schema.string([
          rules.maxLength(255),
          rules.email(),
        ]),
        cedula: schema.number([
          rules.range(1, 18446744073709551615),
        ]),
        cedulaComplemento: schema.string.nullable([
          rules.maxLength(4),
          rules.escape(),
          rules.trim(),
        ]),
        ciudadId: schema.string(),
        celular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        telefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        idiomaId: schema.string(),
        filialId: schema.string(),
        modalidadId: schema.string(),
      }),
    })
    if ((await prisma.preInscripcion.count({
      where: {
        cedula: payload.cedula,
        ciudad: {
          id: payload.ciudadId,
        },
        filial: {
          id: payload.filialId,
        },
        idioma: {
          id: payload.idiomaId,
        },
        id: {
          not: request.param('id'),
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cedula: ['El registro ya existe'],
          ciudad: ['El registro ya existe'],
        },
      })
    }
    try {
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.preInscripcion.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            apellidoPaterno: payload.apellidoPaterno,
            apellidoMaterno: payload.apellidoMaterno,
            email: payload.email,
            cedula: payload.cedula,
            cedulaComplemento: payload.cedulaComplemento,
            ciudad: {
              connect: { id: payload.ciudadId },
            },
            celular: payload.celular,
            telefono: payload.telefono,
            idioma: {
              connect: { id: payload.idiomaId },
            },
            filial: {
              connect: { id: payload.filialId },
            },
            modalidad: {
              connect: { id: payload.modalidadId },
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
    if ((await prisma.preInscripcion.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.preInscripcion.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }
}
