import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import { generatePdf } from 'html-pdf-node-ts'
import Logger from '@ioc:Adonis/Core/Logger'
import moment from 'moment'
import Excel from 'exceljs'

export default class EstudiantesController {
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
      prisma.estudiante.findMany({
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          tipoEstudiante: true,
          fuerza: true,
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
          },
        ],
        where: {
          filial: {
            id: filialId,
          },
          OR: [
            {
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
      }),
      prisma.estudiante.count({
        where: {
          filial: {
            id: filialId,
          },
          OR: [
            {
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
        activo: schema.boolean(),
        matricula: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
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
        tipoEstudianteId: schema.string(),
        fuerzaId: schema.string.nullable(),
        grado: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        gestionDiploma: schema.number.nullable([
          rules.range(1925, 2050),
        ]),
        gestionEgreso: schema.number.nullable([
          rules.range(1925, 2050),
        ]),
        nacionalidad: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        destinoActual: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        direccion: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'cedula.range': 'El rango válido es de 1 a 18446744073709551615',
        'celular.range': 'El rango válido es de 1 a 2147483647',
        'telefono.range': 'El rango válido es de 1 a 2147483647',
        'contactoCelular.range': 'El rango válido es de 1 a 2147483647',
        'contactoTelefono.range': 'El rango válido es de 1 a 2147483647',
        'gestionDiploma.range': 'El rango válido es de 1925 a 2050',
        'gestionEgreso.range': 'El rango válido es de 1925 a 2050',
      },
    })
    if (payload.matricula !== null) {
      if ((await prisma.estudiante.count({
        where: {
          filial: {
            id: payload.filialId,
          },
          matricula: {
            equals: payload.matricula,
            mode: 'insensitive',
          },
        },
      })) > 0) {
        return response.status(422).send({
          message: 'Registro duplicado',
          errors: {
            matricula: ['El registro ya existe'],
          },
        })
      }
    }
    if ((await prisma.persona.count({
      where: {
        cedula: payload.cedula,
        ciudad: {
          id: payload.ciudadId,
        },
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
    try {
      const estudiante = await prisma.estudiante.create({
        data: {
          activo: payload.activo,
          matricula: payload.matricula,
          tipoEstudiante: {
            connect: { id: payload.tipoEstudianteId },
          },
          filial: {
            connect: { id: payload.filialId },
          },
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
                grado: payload.grado,
                gestionDiploma: payload.gestionDiploma,
                gestionEgreso: payload.gestionEgreso,
                nacionalidad: payload.nacionalidad,
                destinoActual: payload.destinoActual,
                carnetCossmil: payload.carnetCossmil,
                carnetMilitar: payload.carnetMilitar,
                fechaNacimiento: payload.fechaNacimiento ? payload.fechaNacimiento.toJSDate() : null,
                direccion: payload.direccion,
                contactoNombre: payload.contactoNombre,
                contactoCelular: payload.contactoCelular,
                contactoTelefono: payload.contactoTelefono,
                contactoCarnetCossmil: payload.contactoCarnetCossmil,
                contactoCarnetMilitar: payload.contactoCarnetMilitar,
              },
            },
          },
        },
      })
      if (payload.parentescoId) {
        await prisma.persona.update({
          where: {
            id: estudiante.personaId,
          },
          data: {
            parentesco: {
              connect: { id: payload.parentescoId },
            },
          },
        })
      }
      if (payload.fuerzaId) {
        await prisma.estudiante.update({
          where: {
            id: estudiante.id,
          },
          data: {
            fuerza: {
              connect: { id: payload.fuerzaId },
            },
          },
        })
      }
      return response.send({
        message: 'Registro almacenado',
        payload: {
          estudiante: estudiante,
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
        payload: await prisma.estudiante.findUniqueOrThrow({
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
            tipoEstudiante: true,
            fuerza: true,
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
    let estudiante
    try {
      estudiante = await prisma.estudiante.findUniqueOrThrow({
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
        activo: schema.boolean(),
        matricula: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
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
        tipoEstudianteId: schema.string(),
        fuerzaId: schema.string.nullable(),
        grado: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        gestionDiploma: schema.number.nullable([
          rules.range(1925, 2050),
        ]),
        gestionEgreso: schema.number.nullable([
          rules.range(1925, 2050),
        ]),
        nacionalidad: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        destinoActual: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
          rules.trim(),
        ]),
        direccion: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        filialId: schema.string(),
      }),
      messages: {
        'cedula.range': 'El rango válido es de 1 a 18446744073709551615',
        'celular.range': 'El rango válido es de 1 a 2147483647',
        'telefono.range': 'El rango válido es de 1 a 2147483647',
        'contactoCelular.range': 'El rango válido es de 1 a 2147483647',
        'contactoTelefono.range': 'El rango válido es de 1 a 2147483647',
        'gestionDiploma.range': 'El rango válido es de 1925 a 2050',
        'gestionEgreso.range': 'El rango válido es de 1925 a 2050',
      },
    })
    if (payload.matricula !== null) {
      if ((await prisma.estudiante.count({
        where: {
          filial: {
            id: payload.filialId,
          },
          matricula: {
            equals: payload.matricula,
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
            matricula: ['El registro ya existe'],
          },
        })
      }
    }
    if ((await prisma.persona.count({
      where: {
        cedula: payload.cedula,
        ciudad: {
          id: payload.ciudadId,
        },
        id: {
          not: estudiante.persona.id,
        },
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
        id: {
          not: estudiante.persona.id,
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
          not: estudiante.persona.id,
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
    try {
      const estudiante = await prisma.estudiante.update({
        where: {
          id: request.param('id'),
        },
        data: {
          activo: payload.activo,
          matricula: payload.matricula,
          tipoEstudiante: {
            connect: { id: payload.tipoEstudianteId },
          },
          filial: {
            connect: { id: payload.filialId },
          },
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
              grado: payload.grado,
              gestionDiploma: payload.gestionDiploma,
              gestionEgreso: payload.gestionEgreso,
              nacionalidad: payload.nacionalidad,
              destinoActual: payload.destinoActual,
              carnetCossmil: payload.carnetCossmil,
              carnetMilitar: payload.carnetMilitar,
              fechaNacimiento: payload.fechaNacimiento ? payload.fechaNacimiento.toJSDate() : null,
              direccion: payload.direccion,
              contactoNombre: payload.contactoNombre,
              contactoCelular: payload.contactoCelular,
              contactoTelefono: payload.contactoTelefono,
              contactoCarnetCossmil: payload.contactoCarnetCossmil,
              contactoCarnetMilitar: payload.contactoCarnetMilitar,
            },
          },
        },
      })
      if (payload.parentescoId) {
        await prisma.persona.update({
          where: {
            id: estudiante.personaId,
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
            id: estudiante.personaId,
          },
          data: {
            parentesco: {
              disconnect: true,
            },
          },
        })
      }
      if (payload.fuerzaId) {
        await prisma.estudiante.update({
          where: {
            id: estudiante.id,
          },
          data: {
            fuerza: {
              connect: { id: payload.fuerzaId },
            },
          },
        })
      } else {
        await prisma.estudiante.update({
          where: {
            id: estudiante.id,
          },
          data: {
            fuerza: {
              disconnect: true,
            },
          },
        })
      }
      return response.send({
        message: 'Registro actualizado',
        payload: {
          estudiante: estudiante,
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
    let estudiante
    try {
      estudiante = await prisma.estudiante.findUniqueOrThrow({
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
        id: estudiante.personaId,
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async imprimir({ request, response }) {
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }
    const payload = await request.validate({
      schema: schema.create({
        excel: schema.boolean(),
      }),
    })
    let dir: string = ''
    if (payload.excel) {
      dir = './tmp/uploads/excel'
    } else {
      dir = './tmp/uploads/pdf'
    }
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    let registros
    if (request.input('id') !== undefined && request.input('id') !== null && request.input('id') !== '') {
      registros = await prisma.estudiante.findMany({
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          tipoEstudiante: true,
          fuerza: true,
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
          },
        ],
        where: {
          id: request.input('id'),
        },
      })
    } else {
      registros = await prisma.estudiante.findMany({
        where: {
          filial: {
            id: filialId,
          },
        },
        include: {
          persona: {
            include: {
              ciudad: true,
              parentesco: true,
            },
          },
          tipoEstudiante: true,
          fuerza: true,
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
          },
        ],
      })
    }
    let archivo: string = ''
    if (payload.excel) {
      archivo = `estudiantes_${Math.floor(new Date().getTime() / 1000)}.xlsx`
      const libro = new Excel.Workbook()
      const hoja = libro.addWorksheet('Estudiantes')
      hoja.columns = [
        { key: 'matricula', header: 'Matrícula', },
        { key: 'tipoEstudiante', header: 'Tipo de Estudiante', },
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
        { key: 'gestionDiploma', header: 'Año de Bachillerato', },
        { key: 'nacionalidad', header: 'Nacionalidad', },
        { key: 'direccion', header: 'Dirección', },
        { key: 'fuerzaArmada', header: 'FF.AA.', },
        { key: 'carnetCossmil', header: 'Carnet Cossmil', },
        { key: 'carnetMilitar', header: 'Carnet Militar', },
        { key: 'grado', header: 'Grado', },
        { key: 'gestionEgreso', header: 'Año de Egreso', },
        { key: 'destinoActual', header: 'Destino Actual', },
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
      registros.forEach(item => {
        hoja.addRow({
          matricula: item.matricula,
          tipoEstudiante: item.tipoEstudiante.nombre,
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
          gestionDiploma: item.persona.gestionDiploma,
          nacionalidad: item.persona.nacionalidad,
          direccion: item.persona.direccion,
          fuerzaArmada: item.fuerza?.nombre,
          carnetCossmil: item.persona.carnetCossmil,
          carnetMilitar: item.persona.carnetMilitar,
          grado: item.persona.grado,
          gestionEgreso: item.persona.gestionEgreso,
          destinoActual: item.persona.destinoActual,
          contactoNombre: item.persona.contactoNombre,
          contactoCelular: item.persona.contactoCelular,
          contactoTelefono: item.persona.contactoTelefono,
          parentesco: item.persona.parentesco?.nombre,
          contactoCarnetCossmil: item.persona.contactoCarnetCossmil,
          contactoCarnetMilitar: item.persona.contactoCarnetMilitar,
        })
      })
      if (registros.length == 0) {
        hoja.mergeCells('A2:AB2')
        hoja.getCell('A2').value = 'Sin registros.'
        hoja.getCell('A2').alignment = {
          horizontal:'center'
        }
      }
      await libro.xlsx.writeFile(`${dir}/${archivo}`)
      await response.header('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await response.header('content-disposition', `attachment; filename=${archivo}`)
      return response.download(`${dir}/${archivo}`, true, (err) => {
        if (err) {
          Logger.error(err.message)
          return response.status(500).send({
            message: 'Error al generar el archivo',
          })
        }
        fs.unlinkSync(`${dir}/${archivo}`)
      })
    } else {
      archivo = `estudiantes_${Math.floor(new Date().getTime() / 1000)}.pdf`
      let pdf: string = ''
      // Encabezado de página
      pdf += '<body style="font-size: 12px; font-family: "Arial", Sans-Serif;">'
      pdf += '<h3 style="text-align: center;">Reporte de Estudiantes</h3>'
      // Cabecera de tabla
      pdf += '<table style="font-size: 10px; table-layout: fixed; width: 100%; border: 1px solid; border-collapse: collapse;">'
      pdf += '<thead>'
      pdf += '<tr style="word-wrap: break-word;">'
      pdf += '<th style="width: 30%; border: 1px solid;">Nombre</th>'
      pdf += '<th style="width: 10%; border: 1px solid;">C.I.</th>'
      pdf += '<th style="width: 10%; border: 1px solid;">Matrícula</th>'
      pdf += '<th style="width: 15%; border: 1px solid;">Tipo de Estudiante</th>'
      pdf += '<th style="width: 20%; border: 1px solid;">Celular</th>'
      pdf += '<th style="width: 15%; border: 1px solid;">Estado</th>'
      pdf += '</tr>'
      pdf += '</thead>'
      pdf += '<tbody>'
      // Datos de tabla
      registros.forEach(item => {
        pdf += '<tr style="word-wrap: break-word;">'
        pdf += `<td style="border: 1px solid;">${[item.persona.nombre, item.persona.apellidoPaterno, item.persona.apellidoMaterno].join(' ') || ''}</td>`
        pdf += `<td style="border: 1px solid;">${[item.persona.cedula, item.persona.cedulaComplemento, item.persona.ciudad.codigo].join(' ') || ''}</td>`
        pdf += `<td style="border: 1px solid;">${item.matricula || ''}</td>`
        pdf += `<td style="border: 1px solid;">${item.tipoEstudiante.nombre || ''}</td>`
        pdf += `<td style="border: 1px solid;">${item.persona.celular || ''}</td>`
        pdf += `<td style="border: 1px solid;">${item.activo ? 'ACTIVO' : 'INACTIVO'}</td>`
        pdf += '</tr>'
      })
      if (registros.length == 0) {
        pdf += '<tr style="word-wrap: break-word;">'
        pdf += `<td style="border: 1px solid; text-align: center;" colspan="6">Sin registros.</td>`
        pdf += '</tr>'
      }
      pdf += '</tbody>'
      pdf += '</table>'
      // Pie de firma visto bueno
      const firmas = await prisma.firma.findMany({
        where: {
          filial: {
            id: filialId,
          },
        },
        orderBy: [
          { posicion: 'asc' },
          { nombre: 'asc' },
        ],
      })
      pdf += '<div style="display: grid; grid-template-columns: 1fr 1fr; width: 100%; margin-top: 114px;">'
      pdf += '<div style="text-align: center;">'
      pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 70%; margin-bottom: -7px;"></p>`
      pdf += `<p style="margin: 0; padding: 0;">${firmas[0].nombre}</p>`
      pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[0].cargo}</p>`
      pdf += '</div>'
      pdf += '<div style="text-align: center;">'
      pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 70%; margin-bottom: -7px;"></p>`
      pdf += `<p style="margin: 0; padding: 0;">${firmas[1].nombre}</p>`
      pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[1].cargo}</p>`
      pdf += '</div>'
      pdf += '</div>'
      // Pie de firma visto bueno
      pdf += '<div style="text-align: center; margin-top: 38px;">'
      pdf += `<p style="margin: 0; padding: 0;">Vo.Bo.</p>`
      pdf += '</div>'
      pdf += '<div style="text-align: center; margin-top: 76px;">'
      pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 35%; margin-bottom: -7px;"></p>`
      pdf += `<p style="margin: 0; padding: 0;">${firmas[2].nombre}</p>`
      pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[2].cargo}</p>`
      pdf += '</div>'
      pdf += '<style>'
      pdf += '@page { margin: 76px; }'
      pdf += '</style>'
      pdf += '</body>'
      const output = await generatePdf(
        {
          content: pdf
        }, {
          format: 'Letter'
        }
      )
      return response.send({
        message: 'Lista de registros',
        payload: {
          pdf: Buffer.from(output).toString('base64'),
          filename: archivo,
        }
      })
    }
  }
}
