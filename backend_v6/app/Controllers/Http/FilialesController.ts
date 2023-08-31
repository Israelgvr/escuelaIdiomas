import * as fs from 'fs'
import flat from 'flat'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Excel from 'exceljs'
import Logger from '@ioc:Adonis/Core/Logger'

export default class FilialesController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const combo: boolean = JSON.parse(request.input('combo') || false)

    if (combo) {
      return response.send({
        message: 'Lista de registros',
        payload: await prisma.filial.findMany({
          orderBy: [
            { posicion: 'asc' },
            { codigo: 'asc' },
            { nombre: 'asc' },
          ],
          select: {
            id: true,
            nombre: true,
            codigo: true,
            ciudadId: true,
            enlaceWhatsApp: true,
            enlaceFacebook: true,
            enlaceYouTube: true,
            enlaceInstagram: true,
            enlaceTikTok: true,
            ciudad: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                posicion: true,
              },
            },
          },
        }),
      })
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.filial.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { posicion: 'asc' },
            { codigo: 'asc' },
            { nombre: 'asc' },
          ],
          include: {
            ciudad: true,
          },
          where: {
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
        prisma.filial.count({
          where: {
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
        codigo: schema.string([
          rules.maxLength(20),
          rules.trim(),
        ]),
        ciudadId: schema.string(),
        localidad: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        direccion: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        celular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        telefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        enlaceWhatsApp: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceFacebook: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceYouTube: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceInstagram: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceTikTok: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
      }),
    })
    if ((await prisma.filial.count({
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
    if ((await prisma.filial.count({
      where: {
        codigo: {
          equals: payload.codigo,
          mode: 'insensitive',
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
      const filial = await prisma.filial.create({
        data: {
          nombre: payload.nombre,
          codigo: payload.codigo,
          ciudad: {
            connect: { id: payload.ciudadId },
          },
          localidad: payload.localidad,
          direccion: payload.direccion,
          celular: payload.celular,
          telefono: payload.telefono,
          posicion: payload.posicion,
          enlaceWhatsApp: payload.enlaceWhatsApp,
          enlaceFacebook: payload.enlaceFacebook,
          enlaceYouTube: payload.enlaceYouTube,
          enlaceInstagram: payload.enlaceInstagram,
          enlaceTikTok: payload.enlaceTikTok,
        },
      })
      for (let i = 1; i <= 3; i++) {
        await prisma.firma.create({
          data: {
            nombre: `Nombre ${i}`,
            cargo: `Cargo ${i}`,
            posicion: i,
            filial: {
              connect: { id: filial.id },
            },
          },
        })
      }
      return response.send({
        message: 'Registro almacenado',
        payload: filial,
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
        payload: await prisma.filial.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
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
    if ((await prisma.filial.count({
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
        codigo: schema.string([
          rules.maxLength(20),
          rules.trim(),
        ]),
        ciudadId: schema.string(),
        localidad: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        direccion: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        celular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        telefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
        enlaceWhatsApp: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceFacebook: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceYouTube: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceInstagram: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        enlaceTikTok: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
      }),
    })
    if ((await prisma.filial.count({
      where: {
        nombre: payload.nombre,
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
    if ((await prisma.filial.count({
      where: {
        codigo: payload.codigo,
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
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.filial.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            ciudad: {
              connect: { id: payload.ciudadId },
            },
            localidad: payload.localidad,
            direccion: payload.direccion,
            celular: payload.celular,
            telefono: payload.telefono,
            posicion: payload.posicion,
            enlaceWhatsApp: payload.enlaceWhatsApp,
            enlaceFacebook: payload.enlaceFacebook,
            enlaceYouTube: payload.enlaceYouTube,
            enlaceInstagram: payload.enlaceInstagram,
            enlaceTikTok: payload.enlaceTikTok,
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
    if ((await prisma.filial.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.$transaction([
      prisma.usuario.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.idioma.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.libro.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.curso.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.tipoEstudiante.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.estudiante.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.firma.deleteMany({
        where: {
          filialId: request.param('id'),
        },
      }),
      prisma.inscripcion.deleteMany({
        where: {
          OR: [
            {
              filialId: request.param('id'),
            }, {
              traspasoFilialId: request.param('id'),
            },
          ],
        },
      }),
      prisma.filial.delete({
        where: {
          id: request.param('id'),
        },
      }),
    ])
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async excel({ response }) {
    const dir = './tmp/uploads/excel'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    const archivo = `filiales_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Filiales')
    hoja.columns = [
      { key: 'codigo', header: 'Código', },
      { key: 'nombre', header: 'Nombre', },
      { key: 'ciudad.nombre', header: 'Departamento', },
      { key: 'localidad', header: 'Localidad', },
      { key: 'direccion', header: 'Dirección', },
      { key: 'celular', header: 'Celular', },
      { key: 'telefono', header: 'Teléfono', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };
    (await prisma.filial.findMany({
      orderBy: [
        { posicion: 'asc' },
        { codigo: 'asc' },
        { nombre: 'asc' },
      ],
      include: {
        ciudad: true,
      },
    })).forEach(item => {
      hoja.addRow(flat(item))
    })
    await response.header('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    await response.header('content-disposition', `attachment; filename=${archivo}`)
    await libro.xlsx.writeFile(`${dir}/${archivo}`)
    return response.download(`${dir}/${archivo}`, true, (err) => {
      if (err) {
        Logger.error(err.message)
        return response.status(500).send({
          message: 'Error al generar el archivo',
        })
      }
      fs.unlinkSync(`${dir}/${archivo}`)
    })
  }
}
