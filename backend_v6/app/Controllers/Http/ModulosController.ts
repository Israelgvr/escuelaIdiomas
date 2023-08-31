import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Excel from 'exceljs'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ModulosController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const combo: boolean = JSON.parse(request.input('combo') || false)

    if (combo) {
      return response.send({
        message: 'Lista de registros',
        payload: await prisma.modulo.findMany({
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
        prisma.modulo.findMany({
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
        prisma.modulo.count({
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
          rules.range(0, 255),
        ]),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 0 a 255',
      },
    })
    if ((await prisma.modulo.count({
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
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.modulo.create({
          data: payload,
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
        payload: await prisma.modulo.findUniqueOrThrow({
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
    if ((await prisma.modulo.count({
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
        posicion: schema.number.optional([
          rules.range(0, 255),
        ]),
      }),
      messages: {
        'posicion.range': 'El rango válido es de 0 a 255',
      },
    })
    if ((await prisma.modulo.count({
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
    try {
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.modulo.update({
          where: {
            id: request.param('id'),
          },
          data: payload,
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
    if ((await prisma.modulo.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.modulo.update({
      where: {
        id: request.param('id'),
      },
      data: {
        roles: {
          set: [],
        },
      },
    })
    await prisma.modulo.delete({
      where: {
        id: request.param('id'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async excel({ response }) {
    const dir = './tmp/uploads/excel'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    const archivo = `modulos_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Módulos')
    hoja.columns = [
      { key: 'nombre', header: 'Nombre', },
      { key: 'posicion', header: 'Posición', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };
    (await prisma.modulo.findMany({
      orderBy: [
        {
          posicion: 'asc',
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
