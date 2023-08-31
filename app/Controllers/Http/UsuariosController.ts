import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'
import Excel from 'exceljs'
import Hash from '@ioc:Adonis/Core/Hash'
import moment from 'moment'

export default class UsuariosController {
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    const [ data, total ] = await prisma.$transaction([
      prisma.usuario.findMany({
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          rol: true,
        },
        orderBy: [
          {
            persona: {
              nombre: 'asc',
            },
          }, {
            persona: {
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            nombre: 'asc',
          },
        ],
        where: {
          AND: [
            {
              OR: [
                {
                  filial: {
                    id: filialId,
                  },
                }, {
                  filial: null,
                }
              ]
            }, {
              OR: [
                {
                  nombre: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                }, {
                  persona: {
                    OR: [
                      {
                        apellidoPaterno: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      }, {
                        apellidoMaterno: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      }, {
                        nombre: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }),
      prisma.usuario.count({
        where: {
          AND: [
            {
              OR: [
                {
                  filial: {
                    id: filialId,
                  },
                }, {
                  filial: null,
                }
              ]
            }, {
              OR: [
                {
                  nombre: {
                    contains: buscar,
                    mode: 'insensitive',
                  },
                }, {
                  persona: {
                    OR: [
                      {
                        apellidoPaterno: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      }, {
                        apellidoMaterno: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      }, {
                        nombre: {
                          contains: buscar,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              ],
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

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        usuario: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        password: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        rolId: schema.string(),
        activo: schema.boolean(),
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
        fechaNacimiento: schema.date.nullable(),
        carnetCossmil: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        carnetMilitar: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        contactoNombre: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        contactoCelular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        contactoTelefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        contactoCarnetCossmil: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        contactoCarnetMilitar: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        parentescoId: schema.string.nullable(),
        filialId: schema.string.nullable(),
      }),
      messages: {
        'cedula.range': 'El rango válido es de 1 a 18446744073709551615',
        'celular.range': 'El rango válido es de 1 a 2147483647',
        'telefono.range': 'El rango válido es de 1 a 2147483647',
        'contactoCelular.range': 'El rango válido es de 1 a 2147483647',
        'contactoTelefono.range': 'El rango válido es de 1 a 2147483647',
      },
    })
    if ((await prisma.usuario.count({
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
    if ((await prisma.persona.count({
      where: {
        cedula: payload.cedula,
        ciudadId: payload.ciudadId,
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cedula: ['El registro ya existe'],
          ciudadId: ['El registro ya existe'],
        },
      })
    }
    if ((await prisma.persona.count({
      where: {
        carnetCossmil: payload.carnetCossmil,
      },
    })) > 0 && payload.carnetCossmil !== null && payload.carnetCossmil !== undefined) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          carnetCossmil: ['El registro ya existe'],
        },
      })
    }
    if ((await prisma.persona.count({
      where: {
        carnetMilitar: payload.carnetMilitar,
      },
    })) > 0 && payload.carnetMilitar !== null && payload.carnetMilitar !== undefined) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          carnetMilitar: ['El registro ya existe'],
        },
      })
    }
    const rol = await prisma.rol.findUnique({
      where: {
        id: payload.rolId,
      },
    })
    if (rol?.nombre == 'ADMINISTRADOR') {
      payload.filialId = null
    } else {
      if (payload.filialId == null) {
        return response.status(422).send({
          message: 'Error de validación',
          errors: {
            filialId: ['El usuario debe asociarse a una filial'],
          },
        })
      }
    }
    try {
      let usuario = await prisma.usuario.create({
        data: {
          nombre: payload.usuario,
          password: await Hash.make(payload.password),
          rol: {
            connect: { id: payload.rolId },
          },
          activo: payload.activo,
          persona: {
            connectOrCreate: {
              where: {
                cedula_ciudadId: {
                  cedula: payload.cedula,
                  ciudadId: payload.ciudadId,
                },
              },
              create: {
                cedula: payload.cedula,
                nombre: payload.nombre,
                apellidoPaterno: payload.apellidoPaterno,
                apellidoMaterno: payload.apellidoMaterno,
                email: payload.email,
                cedulaComplemento: payload.cedulaComplemento,
                ciudad: {
                  connect: { id: payload.ciudadId },
                },
                celular: payload.celular,
                telefono: payload.telefono,
                fechaNacimiento: payload.fechaNacimiento ? payload.fechaNacimiento.toJSDate() : null,
                contactoNombre: payload.contactoNombre,
                contactoCelular: payload.contactoCelular,
                contactoTelefono: payload.contactoTelefono,
                carnetCossmil: payload.carnetCossmil,
                carnetMilitar: payload.carnetMilitar,
                contactoCarnetCossmil: payload.contactoCarnetCossmil,
                contactoCarnetMilitar: payload.contactoCarnetMilitar,
              },
            },
          },
        },
      })
      if (payload.filialId) {
        usuario = await prisma.usuario.update({
          where: {
            id: usuario.id,
          },
          data: {
            filial: {
              connect: { id: payload.filialId }
            },
          },
        })
      }
      if (payload.parentescoId) {
        await prisma.persona.update({
          where: {
            id: usuario.personaId,
          },
          data: {
            parentesco: {
              connect: { id: payload.parentescoId },
            },
          },
        })
      }
      return response.send({
        message: 'Registro almacenado',
        payload: {
          usuario: usuario,
        },
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
        payload: await prisma.usuario.findUniqueOrThrow({
          where: {
            id: request.param('id'),
          },
          include: {
            persona: {
              include: {
                ciudad: true,
                parentesco: true,
              },
            },
            rol: true,
          }
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
    let usuario
    try {
      usuario = await prisma.usuario.findUniqueOrThrow({
        where: {
          id: request.param('id'),
        },
        include: {
          persona: true,
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
        usuario: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        password: schema.string.optional([
          rules.maxLength(255),
          rules.trim(),
        ]),
        rolId: schema.string(),
        activo: schema.boolean(),
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
        fechaNacimiento: schema.date.nullable(),
        carnetCossmil: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        carnetMilitar: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        contactoNombre: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        contactoCelular: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        contactoTelefono: schema.number.nullable([
          rules.range(1, 2147483647),
        ]),
        contactoCarnetCossmil: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        contactoCarnetMilitar: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        parentescoId: schema.string.nullable(),
        filialId: schema.string.nullable(),
      }),
      messages: {
        'cedula.range': 'El rango válido es de 1 a 18446744073709551615',
        'celular.range': 'El rango válido es de 1 a 2147483647',
        'telefono.range': 'El rango válido es de 1 a 2147483647',
        'contactoCelular.range': 'El rango válido es de 1 a 2147483647',
        'contactoTelefono.range': 'El rango válido es de 1 a 2147483647',
        'filiales.array': 'El usuario debe asociarse al menos a una filial',
        'filiales.minLength': 'El usuario debe asociarse al menos a una filial',
      },
    })
    if ((await prisma.usuario.count({
      where: {
        nombre: payload.usuario,
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
    if ((await prisma.persona.count({
      where: {
        cedula: payload.cedula,
        id: {
          not: usuario.persona.id,
        },
      },
    })) > 0) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          cedula: ['El registro ya existe'],
        },
      })
    }
    if ((await prisma.persona.count({
      where: {
        carnetCossmil: payload.carnetCossmil,
        id: {
          not: usuario.persona.id,
        },
      },
    })) > 0 && payload.carnetCossmil !== null && payload.carnetCossmil !== undefined) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          carnetCossmil: ['El registro ya existe'],
        },
      })
    }
    if ((await prisma.persona.count({
      where: {
        carnetMilitar: payload.carnetMilitar,
        id: {
          not: usuario.persona.id,
        },
      },
    })) > 0 && payload.carnetMilitar !== null && payload.carnetMilitar !== undefined) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          carnetMilitar: ['El registro ya existe'],
        },
      })
    }
    const rol = await prisma.rol.findUnique({
      where: {
        id: payload.rolId,
      },
    })
    if (rol?.nombre == 'ADMINISTRADOR') {
      payload.filialId = null
    } else {
      if (payload.filialId == null) {
        return response.status(422).send({
          message: 'Error de validación',
          errors: {
            filialId: ['El usuario debe asociarse a una filial'],
          },
        })
      }
    }
    try {
      usuario = await prisma.usuario.update({
        where: {
          id: request.param('id'),
        },
        data: {
          nombre: payload.usuario,
          rol: {
            connect: { id: payload.rolId },
          },
          activo: payload.activo,
          persona: {
            update: {
              cedula: payload.cedula,
              nombre: payload.nombre,
              apellidoPaterno: payload.apellidoPaterno,
              apellidoMaterno: payload.apellidoMaterno,
              email: payload.email,
              cedulaComplemento: payload.cedulaComplemento,
              ciudad: {
                connect: { id: payload.ciudadId },
              },
              celular: payload.celular,
              telefono: payload.telefono,
              fechaNacimiento: payload.fechaNacimiento ? payload.fechaNacimiento.toJSDate() : null,
              contactoNombre: payload.contactoNombre,
              contactoCelular: payload.contactoCelular,
              contactoTelefono: payload.contactoTelefono,
              carnetCossmil: payload.carnetCossmil,
              carnetMilitar: payload.carnetMilitar,
              contactoCarnetCossmil: payload.contactoCarnetCossmil,
              contactoCarnetMilitar: payload.contactoCarnetMilitar,
            },
          },
        },
      })
      if (payload.filialId) {
        usuario = await prisma.usuario.update({
          where: {
            id: usuario.id,
          },
          data: {
            filial: {
              connect: { id: payload.filialId }
            },
          },
        })
      }
      if (payload.parentescoId) {
        await prisma.persona.update({
          where: {
            id: usuario.personaId,
          },
          data: {
            parentesco: {
              connect: { id: payload.parentescoId },
            },
          },
        })
      } else {
        await prisma.persona.update({
          where: {
            id: usuario.personaId,
          },
          data: {
            parentesco: {
              disconnect: true,
            },
          },
        })
      }
      if (payload.password !== null && payload.password !== undefined && payload.password !== '') {
        await prisma.usuario.update({
          where: {
            id: request.param('id'),
          },
          data: {
            password: await Hash.make(payload.password),
          },
        })
      }
      return response.send({
        message: 'Registro actualizado',
        payload: {
          usuario: usuario,
        },
      })
    } catch(err) {
      Logger.error(err)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async destroy({ request, response }: HttpContextContract) {
    let registro
    try {
      registro = await prisma.usuario.findUniqueOrThrow({
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
    await prisma.persona.delete({
      where: {
        id: registro.personaId,
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async nacionalidades({ response }: HttpContextContract) {
    return response.send({
      message: 'Lista de registros',
      payload: (await prisma.persona.findMany({
        select: {
          nacionalidad: true,
        },
        where: {
          nacionalidad: {
            not: null,
          },
        },
        distinct: ['nacionalidad'],
        orderBy: {
          nacionalidad: 'asc',
        },
      })).map(o => o.nacionalidad),
    })
  }

  public async grados({ response }: HttpContextContract) {
    return response.send({
      message: 'Lista de registros',
      payload: (await prisma.persona.findMany({
        select: {
          grado: true,
        },
        where: {
          grado: {
            not: null,
          },
        },
        distinct: ['grado'],
        orderBy: {
          grado: 'asc',
        },
      })).map(o => o.grado),
    })
  }

  public async excel({ request, response }) {
    const dir = './tmp/uploads/excel'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    const archivo = `usuarios_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Usuarios')
    hoja.columns = [
      { key: 'usuario', header: 'Usuario', },
      { key: 'rol', header: 'Rol', },
      { key: 'estado', header: 'Estado', },
      { key: 'nombre', header: 'Nombre', },
      { key: 'apellidoPaterno', header: 'Apellido Paterno', },
      { key: 'apellidoMaterno', header: 'Apellido Materno', },
      { key: 'cedula', header: 'C.I.', },
      { key: 'cedulaComplemento', header: 'Complemento C.I.', },
      { key: 'ciudad', header: 'Expedición', },
      { key: 'fechaNacimiento', header: 'Fecha de Nacimiento', },
      { key: 'celular', header: 'Celular', },
      { key: 'telefono', header: 'Teléfono', },
      { key: 'email', header: 'Email', },
      { key: 'carnetCossmil', header: 'Carnet Cossmil', },
      { key: 'carnetMilitar', header: 'Carnet Militar', },
      { key: 'contactoNombre', header: 'Contacto Nombre', },
      { key: 'contactoCelular', header: 'Contacto Celular', },
      { key: 'contactoTelefono', header: 'Contacto Telefono', },
      { key: 'parentesco', header: 'Parentesco', },
      { key: 'contactoCarnetCossmil', header: 'Contacto Carnet Cossmil', },
      { key: 'contactoCarnetMilitar', header: 'Contacto Carnet Militar', },
    ];
    hoja.getRow(1).font = {
      bold: true,
    };
    if (request.input('id') !== undefined && request.input('id') !== null && request.input('id') !== '') {
      (await prisma.usuario.findMany({
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          rol: true,
        },
        orderBy: [
          {
            persona: {
              nombre: 'asc',
            },
          }, {
            persona: {
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            nombre: 'asc',
          },
        ],
        where: {
          id: request.input('id'),
        },
      })).forEach(item => {
        hoja.addRow({
          usuario: item.nombre,
          rol: item.rol.nombre,
          estado: item.activo ? 'ACTIVO' : 'INACTIVO',
          nombre: item.persona.nombre,
          apellidoPaterno: item.persona.apellidoPaterno,
          apellidoMaterno: item.persona.apellidoMaterno,
          cedula: item.persona.cedula,
          cedulaComplemento: item.persona.cedulaComplemento,
          ciudad: item.persona.ciudad.codigo,
          fechaNacimiento: item.persona.fechaNacimiento ? moment(item.persona.fechaNacimiento).format('DD/MM/YYYY') : null,
          celular: item.persona.celular,
          telefono: item.persona.telefono,
          email: item.persona.email,
          carnetCossmil: item.persona.carnetCossmil,
          carnetMilitar: item.persona.carnetMilitar,
          contactoNombre: item.persona.contactoNombre,
          contactoCelular: item.persona.contactoCelular,
          contactoTelefono: item.persona.contactoTelefono,
          parentesco: item.persona.parentesco?.nombre,
          contactoCarnetCossmil: item.persona.contactoCarnetCossmil,
          contactoCarnetMilitar: item.persona.contactoCarnetMilitar,
        })
      })
    } else {
      const filialId: string = request.input('filialId') || ''
      if (filialId == '') {
        return response.status(422).send({
          message: 'Debe seleccionar una filial',
        })
      }
      (await prisma.usuario.findMany({
        where: {
          OR: [
            {
              filial: {
                id: filialId,
              },
            }, {
              filial: null,
            },
          ],
        },
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          rol: true,
        },
        orderBy: [
          {
            persona: {
              nombre: 'asc',
            },
          }, {
            persona: {
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            nombre: 'asc',
          },
        ],
      })).forEach(item => {
        hoja.addRow({
          usuario: item.nombre,
          rol: item.rol.nombre,
          estado: item.activo ? 'ACTIVO' : 'INACTIVO',
          nombre: item.persona.nombre,
          apellidoPaterno: item.persona.apellidoPaterno,
          apellidoMaterno: item.persona.apellidoMaterno,
          cedula: item.persona.cedula,
          cedulaComplemento: item.persona.cedulaComplemento,
          ciudad: item.persona.ciudad.codigo,
          fechaNacimiento: item.persona.fechaNacimiento ? moment(item.persona.fechaNacimiento).format('DD/MM/YYYY') : null,
          celular: item.persona.celular,
          telefono: item.persona.telefono,
          email: item.persona.email,
          carnetCossmil: item.persona.carnetCossmil,
          carnetMilitar: item.persona.carnetMilitar,
          contactoNombre: item.persona.contactoNombre,
          contactoCelular: item.persona.contactoCelular,
          contactoTelefono: item.persona.contactoTelefono,
          parentesco: item.persona.parentesco?.nombre,
          contactoCarnetCossmil: item.persona.contactoCarnetCossmil,
          contactoCarnetMilitar: item.persona.contactoCarnetMilitar,
        })
      })
    }
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
