import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'
import moment from 'moment'
import Excel from 'exceljs'

export default class NotasController {
  async indexx({ response }) {
    try {
      // Fetch the count of notes and include student and book details
      const notas = await prisma.nota.findMany({
        include: {
          estudiante: true,
          // libro: true,
        },
      });

      // Return the data as a JSON response with a 200 status code
      return response.status(200).json(notas);
    } catch (error) {
      // If an error occurs, log it and return an error message with a 500 status code
      console.error(error);
      return response.status(500).json({ message: 'Something went wrong' });
    }
  }

  async showx({ params, response }) {
    try {
      const nota = await prisma.nota.findFirst({
        where: { id: params.id },
        include: {
          estudiante: true,
          libro: true,
        },
      });

      if (!nota) {
        return response.status(404).json({ message: 'Nota not found' });
      }

      return response.status(200).json(nota);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Something went wrong' });
    }
  }

  async storex({ request, response }) {
    try {
      const data = request.create([
        'nota1',
        'nota2',
        'nota3',
        'nota4',
        'nota5',
        'nota6',
        'estudianteId',
        'libroId',
      ]);

      // Calculate promedio based on weighted grades
      const promedioFinal = (data.nota1 * 0.9 + data.nota2 * 0.05 + (data.nota3 + data.nota4) * 0.025) * 100;
      data.promedioFinal = promedioFinal;

      // Check if the student is eligible for nota5
      if (promedioFinal < 71 && data.nota5) {
        data.promedioFinal = data.nota5;
        data.nota1 = data.nota2 = data.nota3 = data.nota4 = data.nota6 = null;
      }

      const nota = await prisma.nota.create(data);

      return response.status(201).json(nota);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Something went wrong I' });
    }
  }

  async updatex({ params, request, response }) {
    try {
      const nota = await prisma.nota.findFirst(params.id);

      if (!nota) {
        return response.status(404).json({ message: 'Nota not found' });
      }
      const data = request.only([
        'nota1',
        'nota2',
        'nota3',
        'nota4',
        'nota5',
        'nota6',
        'estudianteId',
        'libroId',
      ]);
      const promedioFinal = (data.nota1 * 0.9 + data.nota2 * 0.05 + (data.nota3 + data.nota4) * 0.025) * 100;
      data.promedioFinal = promedioFinal;
      if (promedioFinal < 71 && data.nota5) {
        data.promedioFinal = data.nota5;
        data.nota1 = data.nota2 = data.nota3 = data.nota4 = data.nota6 = null;
      }
      return response.status(200).json(nota);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Something went wrong' });
    }
  }

  async destroyx({ params, response }) {
    try {
      const nota = await prisma.nota.findUniqueOrThrow(params.id);

      if (!nota) {
        return response.status(404).json({ message: 'Nota not found' });
      }

      await prisma.nota.delete({
        where: { id: params.id }, // Replace 'id' with the actual primary key field in your 'Nota' model
      });

      return response.status(204).json(null);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Something went wrong' });
    }
  }
  /////////////////
  public async NotaslibroPost({ request, response }: HttpContextContract) {
    try {
      const validationSchema = schema.create({
        nota1: schema.number(),
        nota2: schema.number(),
        nota3: schema.number(),
        nota4: schema.number(),
        nota5: schema.number(),
        nota6: schema.number(),
        estudianteId: schema.string(),
        libroId: schema.string(),
      });

      const payload = await request.validate({
        schema: validationSchema,
      });

      // Cálculo del promedio final
      const promedioFinal =
        payload.nota1 * 0.9 +
        payload.nota2 * 0.02 +
        payload.nota3 * 0.02 +
        payload.nota4 * 0.02 +
        payload.nota5 * 0.02 +
        payload.nota6 * 0.02;

      // Creación de la nota en la base de datos
      const nuevaNota = await prisma.nota.create({
        data: {
          nota1: payload.nota1,
          nota2: payload.nota2,
          nota3: payload.nota3,
          nota4: payload.nota4,
          nota5: payload.nota5,
          nota6: payload.nota6,
          promedioFinal: promedioFinal,
          estudianteId: payload.estudianteId,
          libroId: payload.libroId,
        },
      });

      return response.created(nuevaNota);
    } catch (error) {
      Logger.error(error);

      return response.badRequest({ message: 'Error al crear la nota' });
    }
  }

  public async getEstudiantesNotasLibros({ response }: HttpContextContract) {
    try {
      // Realizar la consulta a la base de datos para obtener todos los estudiantes con notas, libros y nombre/apellidos.
      const estudiantesNotasLibros = await prisma.estudiante.findMany({
        include: {
          persona: true,
          notas: {
            include: {
              libro: true,
            },
          },
          // Incluye la información de la persona relacionada
        },
      });

      // Verificar si se encontraron registros
      if (!estudiantesNotasLibros || estudiantesNotasLibros.length === 0) {
        return response.notFound({ message: 'No se encontraron estudiantes con notas, libros y nombre/apellidos asociados.' });
      }

      return response.ok(estudiantesNotasLibros);
    } catch (error) {
      Logger.error(error);
      return response.internalServerError({ message: 'Error al obtener los estudiantes con notas, libros y nombre/apellidos.' });
    }
  }
  public async getEstudiantesNotasLibrosB({ response }: HttpContextContract) {
    try {
      // Realizar la consulta a la base de datos para obtener todos los estudiantes con notas y libros.
      const estudiantesNotasLibros = await prisma.estudiante.findMany({
        include: {
          notas: {
            include: {
              libro: true,
            },
          },
        },
      });

      // Verificar si se encontraron registros
      if (!estudiantesNotasLibros || estudiantesNotasLibros.length === 0) {
        return response.notFound({ message: 'No se encontraron estudiantes con notas y libros asociados.' });
      }

      return response.ok(estudiantesNotasLibros);
    } catch (error) {
      Logger.error(error);
      return response.internalServerError({ message: 'Error al obtener los estudiantes con notas y libros.' });
    }
  }

  public async getEstudiantesNotasLibrosA({ response }: HttpContextContract) {
    try {
      // Realizar la consulta a la base de datos para obtener todos los estudiantes, notas y libros.
      const estudiantesNotasLibros = await prisma.estudiante.findMany({
        include: {
          notas: true,
        },
      });

      // Verificar si se encontraron registros
      if (!estudiantesNotasLibros || estudiantesNotasLibros.length === 0) {
        return response.notFound({ message: 'No se encontraron estudiantes con notas y libros asociados.' });
      }

      return response.ok(estudiantesNotasLibros);
    } catch (error) {
      Logger.error(error);
      return response.internalServerError({ message: 'Error al obtener los estudiantes con notas y libros.' });
    }
  }




  public async getAllNotas({ response }: HttpContextContract) {
    try {
      const notas = await prisma.nota.findMany({
        include: {
          estudiante: {
            select: {
              id: true,
              persona: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                },
              },
            },
          },
        },
      });

      return response.send({
        message: 'Lista de notas',
        payload: notas,
      });
    } catch (error) {
      return response.status(500).send({
        message: 'Error al obtener la lista de notas',
        error: error.message,
      });
    }
  }
  public async getAllNotaA({ response }: HttpContextContract) {
    try {
      const notas = await prisma.nota.findMany({
        include: {
          estudiante: {
            include: {
              persona: true,
            },
          },
        },
      });

      return response.send({
        message: 'Lista de notas con información del estudiante',
        payload: notas,
      });
    } catch (error) {
      return response.status(500).send({
        message: 'Error al obtener la lista de notas con información del estudiante',
        error: error.message,
      });
    }
  }
  //////////////////
  public async getNotas({ response }: HttpContextContract) {
    try {
      // Obtener todas las notas desde la base de datos, incluyendo los detalles del estudiante y el libro
      const notas = await prisma.nota.findMany({
        include: {
          estudiante: true,
          libro: true,
        },
      });

      return response.ok(notas);
    } catch (error) {
      Logger.error(error);

      return response.badRequest({ message: 'Error al obtener las notas' });
    }
  }
  //////////////////
  public async getAllNota({ response }: HttpContextContract) {
    try {
      const students = await prisma.estudiante.findMany({
        select: {
          id: true,
          persona: {
            select: {
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
            },
          },
          notas: true,
        },
      });

      return response.send({
        message: 'Lista de estudiantes con notas',
        payload: students,
      });
    } catch (error) {
      return response.status(500).send({
        message: 'Error al obtener la lista de estudiantes con notas',
        error: error.message,
      });
    }
  }


  ////////////////


  ////
  public async getAllStudent({ response }: HttpContextContract) {
    try {
      const students = await prisma.estudiante.findMany({
        select: {
          id: true,
          persona: {
            select: {
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
            },
          },
          notas: {
            select: {
              id: true,
              nota1: true,
              nota2: true,
              nota3: true,
              nota4: true,
              nota5: true,
              nota6: true,
              promedioFinal: true,
              libro: {
                select: {
                  nombre: true, // Assuming "nombre" is the field representing the name of the book
                },
              },
            },
          },
        },
      });

      return response.send({
        message: 'Lista de estudiantes',
        payload: students,
      });
    } catch (error) {
      return response.status(500).send({
        message: 'Error al obtener la lista de estudiantes',
        error: error.message,
      });
    }
  }
  ////////////
  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''

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
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            persona: {
              nombre: 'asc',
            },
          },
        ],
        where: {
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
          rules.escape(),
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
        email: schema.string.nullable([
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
          rules.escape(),
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
          rules.escape(),
          rules.trim(),
        ]),
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
          persona: {
            connectOrCreate: {
              where: {
                cedula: payload.cedula,
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
                fechaNacimiento: payload.fechaNacimiento ? moment(payload.fechaNacimiento).toDate() : null,
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
    } catch (err) {
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
    } catch {
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
    } catch {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    const payload = await request.validate({
      schema: schema.create({
        activo: schema.boolean(),
        matricula: schema.string.nullable([
          rules.maxLength(255),
          rules.escape(),
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
        email: schema.string.nullable([
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
          rules.escape(),
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
          rules.escape(),
          rules.trim(),
        ]),
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
          AND: [
            {
              matricula: payload.matricula,
            }, {
              id: {
                not: request.param('id'),
              },
            },
          ]
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
        AND: [
          {
            cedula: payload.cedula,
          }, {
            id: {
              not: estudiante.persona.id,
            },
          },
        ]
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
        AND: [
          {
            carnetCossmil: payload.carnetCossmil,
          }, {
            id: {
              not: estudiante.persona.id,
            },
          },
        ],
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
        AND: [
          {
            carnetMilitar: payload.carnetMilitar,
          }, {
            id: {
              not: estudiante.persona.id,
            },
          },
        ],
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
              fechaNacimiento: payload.fechaNacimiento ? moment(payload.fechaNacimiento).toDate() : null,
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
        message: 'Registro actualizado',
        payload: {
          estudiante: estudiante,
        },
      })
    } catch (err) {
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
    } catch {
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

  public async excel({ request, response }) {
    const dir = './tmp/uploads/excel'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true })
    }
    const archivo = `estudiantes_${Math.floor(new Date().getTime() / 1000)}.xlsx`
    const libro = new Excel.Workbook()
    const hoja = libro.addWorksheet('Estudiantes')
    hoja.columns = [
      { key: 'matricula', header: 'Matrícula', },
      { key: 'tipoEstudiante', header: 'Tipo de Estudiante', },
      { key: 'estado', header: 'Estado', },
      { key: 'apellidoPaterno', header: 'Apellido Paterno', },
      { key: 'apellidoMaterno', header: 'Apellido Materno', },
      { key: 'nombre', header: 'Nombre', },
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
    if (request.input('id') !== undefined && request.input('id') !== null && request.input('id') !== '') {
      (await prisma.estudiante.findMany({
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
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            persona: {
              nombre: 'asc',
            },
          },
        ],
        where: {
          id: request.input('id'),
        },
      })).forEach(item => {
        hoja.addRow({
          matricula: item.matricula,
          tipoEstudiante: item.tipoEstudiante.nombre,
          estado: item.activo ? 'ACTIVO' : 'INACTIVO',
          apellidoPaterno: item.persona.apellidoPaterno,
          apellidoMaterno: item.persona.apellidoMaterno,
          nombre: item.persona.nombre,
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
    } else {
      (await prisma.estudiante.findMany({
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
              apellidoPaterno: 'asc',
            },
          }, {
            persona: {
              apellidoMaterno: 'asc',
            },
          }, {
            persona: {
              nombre: 'asc',
            },
          },
        ],
      })).forEach(item => {
        hoja.addRow({
          matricula: item.matricula,
          tipoEstudiante: item.tipoEstudiante.nombre,
          estado: item.activo ? 'ACTIVO' : 'INACTIVO',
          apellidoPaterno: item.persona.apellidoPaterno,
          apellidoMaterno: item.persona.apellidoMaterno,
          nombre: item.persona.nombre,
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
