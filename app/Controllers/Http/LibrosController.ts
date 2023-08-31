import * as fs from 'fs'
import flat from 'flat'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Excel from 'exceljs'
import Logger from '@ioc:Adonis/Core/Logger'

export default class LibrosController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const combo: boolean = JSON.parse(request.input('combo') || false)
    const filtroIdioma: string = request.input('idiomaId') || ''
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    if (filtroIdioma === '') {
      if (combo) {
        return response.send({
          message: 'Lista de registros',
          payload: await prisma.libro.findMany({
            where: {
              filial: {
                id: filialId,
              },
            },
            orderBy: [
              { codigo: 'asc' },
              { nombre: 'asc' },
              { edicion: 'desc' },
            ],
            include: {
              idioma: true,
            },
          }),
        })
      } else {
        const [ data, total ] = await prisma.$transaction([
          prisma.libro.findMany({
            skip: (pagina - 1) * porPagina,
            take: porPagina,
            include: {
              idioma: true,
            },
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
                }, {
                  editorial: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }),
          prisma.libro.count({
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
                }, {
                  editorial: {
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
    } else {
      if (combo) {
        return response.send({
          message: 'Lista de registros',
          payload: await prisma.libro.findMany({
            orderBy: [
              { codigo: 'asc' },
              { nombre: 'asc' },
              { edicion: 'desc' },
            ],
            include: {
              idioma: true,
            },
            where: {
              idioma: {
                id: filtroIdioma,
              },
              filial: {
                id: filialId,
              },
            },
          }),
        })
      } else {
        const [ data, total ] = await prisma.$transaction([
          prisma.libro.findMany({
            skip: (pagina - 1) * porPagina,
            take: porPagina,
            include: {
              idioma: true,
            },
            orderBy: [
              { codigo: 'asc' },
              { nombre: 'asc' },
            ],
            where: {
              idioma: {
                id: filtroIdioma,
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
                  codigo: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                }, {
                  editorial: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }),
          prisma.libro.count({
            where: {
              idioma: {
                id: filtroIdioma,
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
                  codigo: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                }, {
                  editorial: {
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
        editorial: schema.string.nullableAndOptional([
          rules.maxLength(255),
          rules.trim(),
        ]),
        edicion: schema.number.nullableAndOptional([
          rules.range(0, 2147483647),
        ]),
        stock: schema.number([
          rules.range(0, 2147483647),
        ]),
        imagen: schema.file.nullableAndOptional({
          size: '2mb',
          extnames: ['jpg', 'jpeg', 'webp', 'gif', 'png', 'svg', 'JPG', 'JPEG', 'WEBP', 'GIF', 'PNG', 'SVG'],
        }),
        idiomaId: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'edicion.range': 'El rango válido es de 1 a 2147483647',
        'stock.range': 'El rango válido es de 1 a 2147483647',
      },
    })
    if ((await prisma.libro.count({
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
        await payload.imagen.moveToDisk(`./libros`, {
          name: nombreImagen
        })
      } else {
        nombreImagen = null
      }
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.libro.create({
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            editorial: payload.editorial === undefined ? null : payload.editorial,
            edicion: payload.edicion === undefined ? null : payload.edicion,
            stock: payload.stock,
            imagen: nombreImagen,
            idioma: {
              connect: { id: payload.idiomaId },
            },
            filial: {
              connect: { id: payload.filialId },
            },
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
        payload: await prisma.libro.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
            idioma: true,
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
      registro = await prisma.libro.findUniqueOrThrow({
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
        editorial: schema.string.nullableAndOptional([
          rules.maxLength(255),
          rules.trim(),
        ]),
        edicion: schema.number.nullableAndOptional([
          rules.range(0, 2147483647),
        ]),
        stock: schema.number([
          rules.range(0, 2147483647),
        ]),
        imagen: schema.file.nullableAndOptional({
          size: '2mb',
          extnames: ['jpg', 'jpeg', 'webp', 'gif', 'png', 'svg', 'JPG', 'JPEG', 'WEBP', 'GIF', 'PNG', 'SVG'],
        }),
        idiomaId: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'edicion.range': 'El rango válido es de 1 a 2147483647',
        'stock.range': 'El rango válido es de 1 a 2147483647',
      },
    })
    if ((await prisma.libro.count({
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
        }
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
          const archivo = `./tmp/uploads/libros/${registro.imagen}`
          if (fs.existsSync(archivo)) {
            fs.unlinkSync(archivo)
          }
        }
        nombreImagen = `${new Date().getTime()}.${payload.imagen.extname}`;
        await payload.imagen.moveToDisk(`./libros`, {
          name: nombreImagen
        })
        registro.imagen = nombreImagen
      }
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.libro.update({
          where: {
            id: registro.id,
          },
          data: {
            nombre: payload.nombre,
            codigo: payload.codigo,
            editorial: payload.editorial === undefined ? null : payload.editorial,
            edicion: payload.edicion === undefined ? null : payload.edicion,
            stock: payload.stock,
            imagen: registro.imagen,
            idioma: {
              connect: { id: payload.idiomaId }
            },
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
    if ((await prisma.libro.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.libro.update({
      where: {
        id: request.param('id'),
      },
      data: {
        niveles: {
          set: [],
        },
      },
    })
    await prisma.libro.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
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
    const archivo = `libros_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Libros',)
    hoja.columns = [
      { key: 'idioma.nombre', header: 'Idioma', },
      { key: 'codigo', header: 'Código', },
      { key: 'nombre', header: 'Nombre', },
      { key: 'editorial', header: 'Editorial', },
      { key: 'edicion', header: 'Edición', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };
    (await prisma.libro.findMany({
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
        }, {
          edicion: 'desc',
        },
      ],
      include: {
        idioma: true,
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
