import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Excel from 'exceljs'
import Logger from '@ioc:Adonis/Core/Logger'

export default class IdiomasController {
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
        payload: await prisma.idioma.findMany({
          where: {
            filial: {
              id: filialId,
            },
          },
          orderBy: [
            { codigo: 'asc' },
            { nombre: 'asc' },
          ],
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            codigo: true,
            imagen: true,
          },
        }),
      })
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.idioma.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          orderBy: [
            { codigo: 'asc' },
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
                codigo: {
                  contains: buscar,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
        prisma.idioma.count({
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
          rules.trim(),
        ]),
        codigo: schema.string([
          rules.maxLength(20),
          rules.trim(),
        ]),
        resolucionMinisterial: schema.string.nullableAndOptional([
          rules.maxLength(50),
          rules.trim(),
        ]),
        imagen: schema.file.nullableAndOptional({
          size: '2mb',
          extnames: ['jpg', 'jpeg', 'webp', 'gif', 'png', 'svg', 'JPG', 'JPEG', 'WEBP', 'GIF', 'PNG', 'SVG'],
        }),
        filialId: schema.string(),
        descripcion: schema.string([
          rules.maxLength(1000),
          rules.trim(),
        ]),
      }),
    })
    if ((await prisma.idioma.count({
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
    if ((await prisma.idioma.count({
      where: {
        filial: {
          id: payload.filialId,
        },
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
      let nombreImagen
      if (payload.imagen) {
        nombreImagen = `${new Date().getTime()}.${payload.imagen.extname}`;
        await payload.imagen.moveToDisk(`./idiomas`, {
          name: nombreImagen
        })
      } else {
        nombreImagen = null
      }
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.idioma.create({
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            resolucionMinisterial: payload.resolucionMinisterial,
            imagen: nombreImagen,
            filial: {
              connect: { id: payload.filialId },
            },
            descripcion: payload.descripcion,
          },
        }),
      })
    } catch(err) {
      Logger.error(err.message)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async show({ request, response }: HttpContextContract) {
    try {
      return response.send({
        message: 'Detalle del registro',
        payload: await prisma.idioma.findUniqueOrThrow({
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
    let registro
    try {
      registro = await prisma.idioma.findUniqueOrThrow({
        where: {
          id: request.param('id'),
        },
      })
    } catch(err) {
      Logger.error(err)
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
        resolucionMinisterial: schema.string.nullableAndOptional([
          rules.maxLength(50),
          rules.trim(),
        ]),
        imagen: schema.file.nullableAndOptional({
          size: '2mb',
          extnames: ['jpg', 'jpeg', 'webp', 'gif', 'png', 'svg', 'JPG', 'JPEG', 'WEBP', 'GIF', 'PNG', 'SVG'],
        }),
        filialId: schema.string(),
        descripcion: schema.string([
          rules.maxLength(1000),
          rules.trim(),
        ]),
      }),
    })
    if ((await prisma.idioma.count({
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
    if ((await prisma.idioma.count({
      where: {
        filial: {
          id: payload.filialId,
        },
        codigo: {
          equals: payload.codigo,
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
          codigo: ['El registro ya existe'],
        },
      })
    }
    try {
      let nombreImagen
      if (payload.imagen) {
        if (registro.imagen) {
          const archivo = `./tmp/uploads/idiomas/${registro.imagen}`
          if (fs.existsSync(archivo)) {
            fs.unlinkSync(archivo)
          }
        }
        nombreImagen = `${new Date().getTime()}.${payload.imagen.extname}`;
        await payload.imagen.moveToDisk(`./idiomas`, {
          name: nombreImagen
        })
        registro.imagen = nombreImagen
      }
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.idioma.update({
          where: {
            id: registro.id,
          },
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            resolucionMinisterial: payload.resolucionMinisterial === undefined ? null : payload.resolucionMinisterial,
            imagen: registro.imagen,
            filial: {
              connect: { id: payload.filialId },
            },
            descripcion: payload.descripcion,
          },
        }),
      })
    } catch(err) {
      Logger.error(err.message)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async destroy({ request, response }: HttpContextContract) {
    if ((await prisma.idioma.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.idioma.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async cursos({ request, response }: HttpContextContract) {
    return response.send({
      message: 'Detalle del registro',
      payload: await prisma.idioma.findMany({
        where: {
          id: request.param('id'),
        },
        include: {
          cursos: true,
        },
      }),
    })
  }

  public async excel({ request, response }) {
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    const dir = './tmp/uploads/excel'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    const archivo = `idiomas_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Idiomas')
    hoja.columns = [
      { key: 'codigo', header: 'Código', },
      { key: 'nombre', header: 'Nombre', },
      { key: 'resolucionMinisterial', header: 'Resolución Ministerial', },
      { key: 'descripcion', header: 'Descripción', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };
    (await prisma.idioma.findMany({
      where: {
        filial: {
          id: filialId,
        },
      },
      orderBy: [
        {
          codigo: 'asc',
        }, {
          nombre: 'asc',
        },
      ],
    })).forEach(item => {
      hoja.addRow(item)
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
