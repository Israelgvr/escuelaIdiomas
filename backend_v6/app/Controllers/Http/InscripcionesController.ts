import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'

export default class InscripcionesController {


  public async index({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''
    const filtroCurso: string = request.input('cursoId') || ''
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    if (filtroCurso != '') {
      const [ data, total ] = await prisma.$transaction([
        prisma.inscripcion.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          include: {
            tipoEstudiante: true,
            traspasoFilial: true,
            estudiante: {
              include: {
                fuerza: true,
                persona: {
                  include: {
                    ciudad: true,
                    parentesco: true,
                  },
                },
              },
            },
            curso: {
              include: {
                idioma: true,
              },
            },
          },
          orderBy: {
            estudiante: {
              persona: {
                nombre: 'asc',
              }
            },
          },
          where: {
            curso: {
              id: filtroCurso,
            },
            filial: {
              id: filialId,
            },
            estudiante: {
              OR: [
                {
                  matricula: {
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
          },
        }),
        prisma.inscripcion.count({
          where: {
            curso: {
              id: filtroCurso,
            },
            filial: {
              id: filialId,
            },
            estudiante: {
              OR: [
                {
                  matricula: {
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
        prisma.inscripcion.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          include: {
            tipoEstudiante: true,
            traspasoFilial: true,
            estudiante: {
              include: {
                fuerza: true,
                persona: {
                  include: {
                    ciudad: true,
                    parentesco: true,
                  },
                },
              },
            },
            curso: {
              include: {
                idioma: true,
              },
            },
          },
          orderBy: {
            estudiante: {
              persona: {
                nombre: 'asc',
              }
            },
          },
          where: {
            filial: {
              id: filialId,
            },
            estudiante: {
              OR: [
                {
                  matricula: {
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
          },
        }),
        prisma.inscripcion.count({
          where: {
            filial: {
              id: filialId,
            },
            estudiante: {
              OR: [
                {
                  matricula: {
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

  public async indexA({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const buscar: string = request.input('buscar') || ''

    const [ data, total ] = await prisma.$transaction([
      prisma.inscripcion.findMany({
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          tipoEstudiante: true,
          filial: true,
          estudiante: {
            include: {
              fuerza: true,
              persona: {
                include: {
                  ciudad: true,
                  parentesco: true,
                },
              },
            },
          },
        },
        orderBy: {
          estudiante: {
            persona: {
              apellidoPaterno: 'asc',
            },
          },
        },
        where: {
          cursoId: request.param('cursoId'),
          estudiante: {
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
        },
      }),
      prisma.inscripcion.count({
        where: {
          cursoId: request.param('cursoId'),
          estudiante: {
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
        deposito: schema.boolean(),
        numeroDeposito: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        traspaso: schema.boolean(),
        traspasoFilialId: schema.string.nullable([
          rules.requiredWhen('traspaso', '=', true),
        ]),
        estudianteId: schema.string(),
        tipoEstudianteId: schema.string(),
        descuentoPorcentaje: schema.number([
          rules.range(0, 100),
        ]),
        filialId: schema.string(),
        cursoId: schema.string(),
      }),
      messages: {
        'filialId.requiredWhen': 'La filial de traspaso es requerida',
      }
    })
    const registro = await prisma.inscripcion.findFirst({
      where: {
        cursoId: payload.cursoId,
        estudianteId: payload.estudianteId,
      },
    })
    if (registro !== null) {
      return response.status(422).send({
        message: 'Registro duplicado',
        errors: {
          estudianteId: ['El estudiante ya está inscrito en el curso'],
        },
      })
    }
    try {
      const inscripcion = await prisma.inscripcion.create({
        data: {
          deposito: payload.deposito,
          numeroDeposito: payload.numeroDeposito,
          traspaso: payload.traspaso,
          estudiante: {
            connect: { id: payload.estudianteId },
          },
          tipoEstudiante: {
            connect: { id: payload.tipoEstudianteId },
          },
          curso: {
            connect: { id: payload.cursoId },
          },
          descuentoPorcentaje: payload.descuentoPorcentaje,
          // TODO: calcular descuento en monto efectivo
          descuento: 0,
          filial: {
            connect: { id: payload.filialId },
          },
        },
      })
      if (payload.traspaso && payload.traspasoFilialId) {
        await prisma.inscripcion.update({
          where: {
            id: inscripcion.id,
          },
          data: {
            traspasoFilial: {
              connect: { id: payload.traspasoFilialId },
            },
          },
        })
      }
      return response.send({
        message: 'Registro almacenado',
        payload: inscripcion,
      })
    } catch(err) {
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async show({ request, response }: HttpContextContract) {
    try {
      return response.send({
        message: 'Detalle del registro',
        payload: await prisma.inscripcion.findUniqueOrThrow({
          where: {
            id: request.param('inscripcionId'),
          },
          include: {
            tipoEstudiante: true,
            traspasoFilial: true,
            estudiante: {
              include: {
                fuerza: true,
                persona: {
                  include: {
                    ciudad: true,
                    parentesco: true,
                  },
                },
              },
            },
            curso: {
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
    if ((await prisma.inscripcion.count({
      where: {
        id: request.param('inscripcionId'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    const payload = await request.validate({
      schema: schema.create({
        deposito: schema.boolean(),
        numeroDeposito: schema.string.nullable([
          rules.maxLength(255),
          rules.trim(),
        ]),
        traspaso: schema.boolean(),
        traspasoFilialId: schema.string.nullable([
          rules.requiredWhen('traspaso', '=', true),
        ]),
        tipoEstudianteId: schema.string(),
        descuentoPorcentaje: schema.number([
          rules.range(0, 100),
        ]),
        filialId: schema.string(),
        cursoId: schema.string(),
      }),
      messages: {
        'filialId.requiredWhen': 'La filial de traspaso es requerida',
      }
    })
    try {
      const inscripcion = await prisma.inscripcion.update({
        where: {
          id: request.param('inscripcionId'),
        },
        data: {
          deposito: payload.deposito,
          numeroDeposito: payload.numeroDeposito,
          traspaso: payload.traspaso,
          tipoEstudiante: {
            connect: { id: payload.tipoEstudianteId },
          },
          curso: {
            connect: { id: payload.cursoId },
          },
          descuentoPorcentaje: payload.descuentoPorcentaje,
          // TODO: calcular descuento en monto efectivo
          descuento: 0,
          filial: {
            connect: { id: payload.filialId },
          },
        },
      })
      if (payload.traspaso && payload.traspasoFilialId) {
        await prisma.inscripcion.update({
          where: {
            id: inscripcion.id,
          },
          data: {
            traspasoFilial: {
              connect: { id: payload.traspasoFilialId },
            },
          },
        })
      } else {
        await prisma.inscripcion.update({
          where: {
            id: inscripcion.id,
          },
          data: {
            traspasoFilial: {
              disconnect: true,
            },
          },
        })
      }
      return response.send({
        message: 'Registro actualizado',
        payload: inscripcion,
      })
    } catch(err) {
      Logger.error(err)
      return response.status(500).send({
        message: 'Error al almacenar el registro',
      })
    }
  }

  public async destroy({ request, response }: HttpContextContract) {
    if ((await prisma.inscripcion.count({
      where: {
        id: request.param('inscripcionId'),
      },
    })) !== 1) {
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
    await prisma.inscripcion.delete({
      where: {
        id: request.param('inscripcionId'),
      },
    })
    return response.send({
      message: 'Registro eliminado',
    })
  }

  public async estudiantes({ request, response }: HttpContextContract) {
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }
    const cursoId: string = request.input('cursoId') || ''
    if (cursoId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar un curso',
      })
    }
    const buscar: string = request.input('buscar') || ''

    let inscritos: Array<string> = []
    try {
      const curso = await prisma.curso.findUniqueOrThrow({
        where: {
          id: cursoId,
        },
        include: {
          inscripciones: {
            where: {
              estudiante: {
                matricula: {
                  not: null
                },
              },
            },
            include: {
              estudiante: true,
            },
          },
        },
      })
      if (curso.inscripciones.length > 0) {
        inscritos = curso.inscripciones.map(o => o.estudiante.id)
      }
      return response.send({
        message: 'Estudiantes disponibles',
        payload: await prisma.estudiante.findMany({
          include: {
            tipoEstudiante: true,
            fuerza: true,
            persona: {
              include: {
                ciudad: true,
                parentesco: true,
              },
            },
          },
          where: {
            filial: {
              id: filialId,
            },
            id: {
              notIn: inscritos,
            },
            OR: [
              {
                matricula: {
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
        })
      })
    } catch(err) {
      Logger.error(err)
      return response.status(404).send({
        message: 'Registro inexistente',
      })
    }
  }
}
