import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Excel from 'exceljs'
import Logger from '@ioc:Adonis/Core/Logger'

export default class CursosController {
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
          payload: await prisma.curso.findMany({
            where: {
              filial: {
                id: filialId,
              },
            },
            orderBy: [
              { nombre: 'asc' },
            ],
            include: {
              idioma: true,
              modalidad: true,
              niveles: {
                include: {
                  libros: {
                    orderBy: [
                      { nombre: 'asc' },
                    ],
                  },
                },
              },
            },
          }),
        })
      } else {
        const [ data, total ] = await prisma.$transaction([
          prisma.curso.findMany({
            skip: (pagina - 1) * porPagina,
            take: porPagina,
            include: {
              idioma: true,
              modalidad: true,
            },
            orderBy: [
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
                },
              ],
            },
          }),
          prisma.curso.count({
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
          payload: await prisma.curso.findMany({
            orderBy: [
              { nombre: 'asc' },
            ],
            include: {
              idioma: true,
              modalidad: true,
              niveles: {
                include: {
                  libros: {
                    orderBy: [
                      { nombre: 'asc' },
                    ],
                  },
                },
              },
            },
            where: {
              filial: {
                id: filialId,
              },
              idioma: {
                id: filtroIdioma,
              },
            },
          }),
        })
      } else {
        const [ data, total ] = await prisma.$transaction([
          prisma.curso.findMany({
            skip: (pagina - 1) * porPagina,
            take: porPagina,
            include: {
              idioma: true,
              modalidad: true,
            },
            orderBy: [
              { nombre: 'asc' },
            ],
            where: {
              filial: {
                id: filialId,
              },
              idioma: {
                id: filtroIdioma,
              },
              nombre: {
                contains: buscar,
                mode: 'insensitive',
              },
            },
          }),
          prisma.curso.count({
            where: {
              filial: {
                id: filialId,
              },
              idioma: {
                id: filtroIdioma,
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
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        activo: schema.boolean(),
        horaInicial: schema.string([
          rules.time()
        ]),
        horaFinal: schema.string([
          rules.time()
        ]),
        filialId: schema.string(),
        idiomaId: schema.string(),
        modalidadId: schema.string(),
        niveles: schema.array([
          rules.minLength(1),
        ]).members(
          schema.string(),
        ),
      }),
    })
    try {
      return response.send({
        message: 'Registro almacenado',
        payload: await prisma.curso.create({
          data: {
            nombre: payload.nombre,
            activo: true,
            modalidad: {
              connect: { id: payload.modalidadId },
            },
            idioma: {
              connect: { id: payload.idiomaId },
            },
            filial: {
              connect: { id: payload.filialId },
            },
            horaInicial: payload.horaInicial,
            horaFinal: payload.horaFinal,
            niveles: {
              connect: payload.niveles.map(o => ({ id: o })),
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
        payload: await prisma.curso.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
            idioma: true,
            modalidad: true,
            niveles: {
              include: {
                libros: {
                  orderBy: [
                    { nombre: 'asc' },
                  ],
                },
              },
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
    if ((await prisma.curso.count({
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
        activo: schema.boolean(),
        horaInicial: schema.string([
          rules.time()
        ]),
        horaFinal: schema.string([
          rules.time()
        ]),
        filialId: schema.string(),
        idiomaId: schema.string(),
        modalidadId: schema.string(),
        niveles: schema.array([
          rules.minLength(1),
        ]).members(
          schema.string(),
        ),
      }),
    })
    try {
      return response.send({
        message: 'Registro actualizado',
        payload: await prisma.curso.update({
          where: {
            id: request.param('id'),
          },
          data: {
            nombre: payload.nombre,
            activo: payload.activo,
            modalidad: {
              connect: { id: payload.modalidadId },
            },
            idioma: {
              connect: { id: payload.idiomaId },
            },
            filial: {
              connect: { id: payload.filialId },
            },
            horaInicial: payload.horaInicial,
            horaFinal: payload.horaFinal,
            niveles: {
              set: payload.niveles.map(o => ({ id: o })),
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
    if ((await prisma.curso.count({
      where: {
        id: request.param('id'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.curso.update({
      where: {
        id: request.param('id'),
      },
      data: {
        niveles: {
          set: [],
        },
      },
    })
    await prisma.curso.delete({
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
    const archivo = `cursos_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Cursos')
    hoja.columns = [
      { key: 'idiomaNombre', header: 'Idioma', },
      { key: 'modalidadNombre', header: 'Modalidad', },
      { key: 'nombre', header: 'Nombre', },
      { key: 'horaInicial', header: 'Hora Inicial', },
      { key: 'horaFinal', header: 'Hora Final', },
      { key: 'estado', header: 'Estado', },
      { key: 'nivelesLista', header: 'Niveles', },
      { key: 'librosLista', header: 'Libros', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };

    (await prisma.curso.findMany({
      where: {
        filial: {
          id: filialId,
        },
      },
      include: {
        idioma: true,
        modalidad: true,
        niveles: {
          include: {
            libros: {
              orderBy: [
                { nombre: 'asc' },
              ],
            },
          },
        },
      },
    })).forEach(item => {
      let librosCurso: Array<Array<string>> = []
      item.niveles.forEach(nivel => {
        librosCurso.push(nivel.libros.reduce(function(acc: Array<string>, o) {
          acc.push(o.nombre)
          return acc
        }, []))
      })
      const librosLista = librosCurso.flat(1).filter((value, index, array) => array.indexOf(value) === index).join(', ')
      hoja.addRow({
        idiomaNombre: item.idioma.nombre,
        modalidadNombre: item.modalidad.nombre,
        nombre: item.nombre,
        horaInicial: item.horaInicial,
        horaFinal: item.horaFinal,
        estado: item.activo ? 'EN CURSO' : 'FINALIZADO',
        nivelesLista: item.niveles.reduce(function(acc: Array<string>, o) {
          acc.push(o.nombre)
          return acc
        }, []).join(', '),
        librosLista: librosLista,
      })
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
