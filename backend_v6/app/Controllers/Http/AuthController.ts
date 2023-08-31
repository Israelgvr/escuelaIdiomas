import Hash from '@ioc:Adonis/Core/Hash'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Env from '@ioc:Adonis/Core/Env'
import nodemailer from 'nodemailer'
import Config from '@ioc:Adonis/Core/Config'
import jwt from 'jsonwebtoken'
import Logger from '@ioc:Adonis/Core/Logger'
import moment from 'moment'

export default class AuthController {
  public async index({ auth, response }: HttpContextContract) {
    const registro = await prisma.usuario.findUnique({
      where: {
        id: auth.user?.id,
      },
      select: {
        id: true,
        nombre: true,
        password: true,
        activo: true,
        rememberMeToken: true,
        persona: {
          select:
          {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            email: true,
            cedula: true,
            cedulaComplemento: true,
            ciudad: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
            celular: true,
            telefono: true,
            fechaNacimiento: true,
            contactoNombre: true,
            contactoCelular: true,
            contactoTelefono: true,
            parentesco: {
              select: {
                id: true,
                nombre: true,
              },
            },
            gestionDiploma: true,
            gestionEgreso: true,
            grado: true,
            nacionalidad: true,
            destinoActual: true,
            direccion: true,
            carnetCossmil: true,
            carnetMilitar: true,
            contactoCarnetCossmil: true,
            contactoCarnetMilitar: true,
          },
        },
        rol: {
          select: {
            id: true,
            nombre: true,
            modulos: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        filial: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            localidad: true,
            direccion: true,
            celular: true,
            telefono: true,
            ciudad: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
    })
    return response.send({
      message: 'Usuario autenticado',
      payload: registro,
    })
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        password: schema.string([
          rules.maxLength(180),
          rules.trim(),
        ]),
      }),
    })
    const usuario = await prisma.usuario.findUnique({
      where: {
        nombre: payload.nombre,
      },
    })
    if (usuario) {
      if (usuario.activo) {
        if (!(await Hash.verify(usuario.password, payload.password))) {
          return response.status(422).send({
            message: 'Acceso denegado',
            errors: {
              password: ['Credenciales incorrectas'],
            },
          })
        }
        try {
          const token = jwt.sign({ id: usuario.id.toString(), nombre: usuario.nombre }, Config.get('app.appKey'), {
            expiresIn: '365 days',
          })
          return response.send({
            message: 'Bienvenido',
            payload: {
              ...{
                type: 'Bearer',
                token: token
              },
              usuario: await prisma.usuario.update({
                where: {
                  id: usuario.id,
                },
                data: {
                  rememberMeToken: token,
                  resetPasswordToken: null,
                  resetPasswordLimite: null,
                },
                select: {
                  id: true,
                  nombre: true,
                  password: true,
                  activo: true,
                  rememberMeToken: true,
                  persona: {
                    select:
                    {
                      id: true,
                      nombre: true,
                      apellidoPaterno: true,
                      apellidoMaterno: true,
                      email: true,
                      cedula: true,
                      cedulaComplemento: true,
                      ciudad: {
                        select: {
                          id: true,
                          nombre: true,
                          codigo: true,
                        },
                      },
                      celular: true,
                      telefono: true,
                      fechaNacimiento: true,
                      contactoNombre: true,
                      contactoCelular: true,
                      contactoTelefono: true,
                      parentesco: {
                        select: {
                          id: true,
                          nombre: true,
                        },
                      },
                      gestionDiploma: true,
                      gestionEgreso: true,
                      grado: true,
                      nacionalidad: true,
                      destinoActual: true,
                      direccion: true,
                      carnetCossmil: true,
                      carnetMilitar: true,
                      contactoCarnetCossmil: true,
                      contactoCarnetMilitar: true,
                    },
                  },
                  rol: {
                    select: {
                      id: true,
                      nombre: true,
                      modulos: {
                        select: {
                          id: true,
                          nombre: true,
                        },
                      },
                    },
                  },
                  filial: {
                    select: {
                      id: true,
                      nombre: true,
                      codigo: true,
                      localidad: true,
                      direccion: true,
                      celular: true,
                      telefono: true,
                      ciudad: {
                        select: {
                          id: true,
                          nombre: true,
                          codigo: true,
                        },
                      },
                    },
                  },
                },
              }),
            }
          })
        } catch(err) {
          return response.status(422).send({
            message: 'Acceso denegado',
            errors: {
              password: ['Credenciales incorrectas'],
            },
          })
        }
      } else {
        return response.status(422).send({
          message: 'Acceso denegado',
          errors: {
            nombre: ['Usuario inactivo'],
          },
        })
      }
    } else {
      return response.status(422).send({
        message: 'Acceso denegado',
        errors: {
          nombre: ['Usuario inexistente'],
        },
      })
    }
  }

  public async show({}: HttpContextContract) {}

  public async update({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        passwordAnterior: schema.string([
          rules.maxLength(180),
          rules.trim(),
        ]),
        password: schema.string([
          rules.maxLength(180),
          rules.trim(),
          rules.confirmed('passwordConfirmacion'),
        ]),
      }),
    })
    if (auth.user) {
      if (auth.user.id == request.param('id')) {
        if ((await Hash.verify(auth.user.password, payload.passwordAnterior))) {
          await prisma.usuario.update({
            where: {
              id: auth.user.id,
            },
            data: {
              password: await Hash.make(payload.password),
              resetPasswordToken: null,
              resetPasswordLimite: null,
            },
          })
          return response.send({
            message: 'Contraseña modificada',
          })
        } else {
          return response.status(422).send({
            message: 'Error',
            errors: {
              passwordAnterior: ['Contraseña anterior incorrecta'],
            },
          })
        }
      } else {
        return response.status(401).send({
          message: 'Acceso denegado',
        })
      }
    } else {
      return response.status(401).send({
        message: 'Acceso denegado',
      })
    }
  }

  public async destroy({ auth, response }: HttpContextContract) {
    if (auth.user) {
      await prisma.usuario.update({
        where: {
          id: auth.user?.id,
        },
        data: {
          rememberMeToken: null,
        },
      })
      return response.send({
        message: 'Sesión finalizada',
      })
    } else {
      return response.status(422).send({
        message: 'Debe iniciar sesión',
      })
    }
  }

  public async resetPasswordToken({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
      }),
    })
    const registro = await prisma.usuario.findFirst({
      where: {
        nombre: payload.nombre,
      },
      include: {
        persona: true,
      },
    })
    if (!registro) {
      return response.status(422).send({
        message: 'Acceso denegado',
        errors: {
          nombre: ['Usuario inexistente'],
        },
      })
    }
    if (!registro.activo) {
      return response.status(422).send({
        message: 'Acceso denegado',
        errors: {
          nombre: ['Usuario inactivo'],
        },
      })
    }
    if (!registro.persona.email) {
      return response.status(422).send({
        message: 'Acceso denegado',
        errors: {
          nombre: ['El usuario no cuenta con un email válido'],
        },
      })
    }
    try {
      const token = Math.floor(Math.random() * (999999 - 100000) + 100000)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: Env.get('GMAIL_USUARIO'),
          pass: Env.get('GMAIL_KEY'),
        },
      })
      await transporter.sendMail({
        from: Env.get('GMAIL_USUARIO'),
        to: registro.persona.email,
        subject: 'Recuperación de contraseña EIE',
        text: `Para recuperar su contraseña debe usar el siguiente enlace: ${Env.get('FRONTEND_URL')}/recuperacion?q=${token}&u=${payload.nombre}\nEl enlace expira en 30 minutos.`,
        html: `<p>Para recuperar su contraseña debe usar <a href="${Env.get('FRONTEND_URL')}/recuperacion?q=${token}&u=${payload.nombre}">ESTE ENLACE</a></p><p>El enlace expira en 30 minutos</p>`,
        amp: `<!doctype html>
          <html ⚡4email>
            <head>
              <meta charset="utf-8">
              <style amp4email-boilerplate>body{visibility:hidden}</style>
              <script async src="https://cdn.ampproject.org/v0.js"></script>
              <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
            </head>
            <body>
              <p>Para recuperar su contraseña debe usar <a href="${Env.get('FRONTEND_URL')}/recuperacion?q=${token}&u=${payload.nombre}">ESTE ENLACE</a></p>
              <p>El enlace expira en 30 minutos</p>
            </body>
          </html>`
      })
      await prisma.usuario.update({
        where: {
          id: registro.id,
        },
        data: {
          resetPasswordToken: token,
          resetPasswordLimite: moment().add(30, 'minutes').toISOString(),
        },
      })
      return response.send({
        message: 'Revise su email para recuperar la contraseña',
      })
    } catch(err) {
      Logger.error(err)
      return {
        error: true
      }
    }
  }

  public async resetPassword({ request, response }: HttpContextContract) {
    const payload = await request.validate({
      schema: schema.create({
        nombre: schema.string([
          rules.maxLength(255),
          rules.trim(),
        ]),
        resetPasswordToken: schema.number([
          rules.range(100000, 999999),
        ]),
        password: schema.string([
          rules.maxLength(180),
          rules.trim(),
          rules.confirmed('passwordConfirmacion'),
        ]),
      }),
    })
    const registro = await prisma.usuario.findFirst({
      where: {
        nombre: payload.nombre,
      },
      include: {
        persona: true,
      },
    })
    if (!registro) {
      return response.status(422).send({
        message: 'Usuario inexistente',
      })
    }
    if (!registro.activo) {
      return response.status(422).send({
        message: 'Usuario inactivo',
      })
    }
    if (registro.resetPasswordToken != payload.resetPasswordToken) {
      return response.status(422).send({
        message: 'Acceso denegado',
        errors: {
          password: ['Código incorrecto'],
        },
      })
    }
    if (registro.resetPasswordLimite) {
      if (moment().diff(moment(registro.resetPasswordLimite.toISOString(), moment.ISO_8601), 'minutes') > 30) {
        return response.status(422).send({
          message: 'Acceso denegado',
          errors: {
            password: ['Código expirado'],
          },
        })
      }
    }
    const token = jwt.sign({ id: registro.id.toString(), nombre: registro.nombre }, Config.get('app.appKey'), {
      expiresIn: '365 days',
    })
    return response.send({
      message: 'Contraseña modificada',
      payload: {
        ...{
          type: 'Bearer',
          token: token
        },
        usuario: await prisma.usuario.update({
          where: {
            id: registro.id,
          },
          data: {
            password: await Hash.make(payload.password),
            rememberMeToken: token,
            resetPasswordToken: null,
            resetPasswordLimite: null,
          },
          select: {
            id: true,
            nombre: true,
            password: true,
            activo: true,
            rememberMeToken: true,
            persona: {
              select:
              {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                email: true,
                cedula: true,
                cedulaComplemento: true,
                ciudad: {
                  select: {
                    id: true,
                    nombre: true,
                    codigo: true,
                  },
                },
                celular: true,
                telefono: true,
                fechaNacimiento: true,
                contactoNombre: true,
                contactoCelular: true,
                contactoTelefono: true,
                parentesco: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
                gestionDiploma: true,
                gestionEgreso: true,
                grado: true,
                nacionalidad: true,
                destinoActual: true,
                direccion: true,
                carnetCossmil: true,
                carnetMilitar: true,
                contactoCarnetCossmil: true,
                contactoCarnetMilitar: true,
              },
            },
            rol: {
              select: {
                id: true,
                nombre: true,
                modulos: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            filial: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                localidad: true,
                direccion: true,
                celular: true,
                telefono: true,
                ciudad: {
                  select: {
                    id: true,
                    nombre: true,
                    codigo: true,
                  },
                },
              },
            },
          },
        }),
      }
    })
  }
}
