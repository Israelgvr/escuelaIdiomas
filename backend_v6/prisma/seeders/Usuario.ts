import { prisma, PrismaSeederBase } from '@ioc:Adonis/Addons/Prisma'
import Hash from '@ioc:Adonis/Core/Hash'
import { type Filial } from '@prisma/client'

export default class UsuarioSeeder extends PrismaSeederBase {
  public static developmentOnly = false

  public async run() {
    const registros = [
      {
        nombre: 'admin',
        password: 'admin',
        rol: 'ADMINISTRADOR',
        filial: null,
        persona: {
          nombre: 'Super',
          apellidoPaterno: 'Administrador',
          apellidoMaterno: null,
          email: 'super@admin.com',
          cedula: 123456,
          cedulaComplemento: null,
          ciudad: 'LP',
          celular: 6543210,
          telefono: 2345678,
          fechaNacimiento: new Date(),
          contactoNombre: 'Juán Pérez',
          contactoCelular: 7564321,
          contactoTelefono: 3456789,
          parentesco: 'PADRE',
          gestionDiploma: null,
          gestionEgreso: null,
          grado: null,
          nacionalidad: null,
          destinoActual: null,
          direccion: null,
          carnetCossmil: null,
          carnetMilitar: null,
          contactoCarnetCossmil: null,
          contactoCarnetMilitar: null,
        },
      }, {
        nombre: 'academica',
        password: 'academica',
        rol: 'JEFE DE SECCIÓN ACADÉMICA',
        filial: {
          nombre: 'Escuela de Idiomas del Ejército - Achacachi',
          codigo: 'EIE-ACH-01',
        },
        persona: {
          nombre: 'Académica',
          apellidoPaterno: 'Jefe',
          apellidoMaterno: 'Sección',
          email: 'jefe@academica.com',
          cedula: 789456,
          cedulaComplemento: null,
          ciudad: 'LP',
          celular: 7654321,
          telefono: 33445566,
          fechaNacimiento: new Date(),
          contactoNombre: 'Perico de los Palotes',
          contactoCelular: 7456123,
          contactoTelefono: 4321654,
          parentesco: 'HIJO',
          gestionDiploma: null,
          gestionEgreso: null,
          grado: null,
          nacionalidad: null,
          destinoActual: null,
          direccion: null,
          carnetCossmil: null,
          carnetMilitar: null,
          contactoCarnetCossmil: null,
          contactoCarnetMilitar: null,
        },
      }, {
        nombre: 'evaluaciones',
        password: 'evaluaciones',
        rol: 'JEFE DE EVALUACIONES',
        filial: {
          nombre: 'Escuela de Idiomas del Ejército - La Paz',
          codigo: 'EIE-LP-02',
        },
        persona: {
          nombre: 'evaluaciones',
          apellidoPaterno: 'Jefe',
          apellidoMaterno: 'de',
          email: 'jefe@evaluaciones.com',
          cedula: 654321,
          cedulaComplemento: null,
          ciudad: 'LP',
          celular: 6543210,
          telefono: 2345678,
          fechaNacimiento: new Date(),
          contactoNombre: 'JUANA PÉREZ',
          contactoCelular: 7564321,
          contactoTelefono: 3456789,
          parentesco: 'ESPOSA',
          gestionDiploma: null,
          gestionEgreso: null,
          grado: null,
          nacionalidad: null,
          destinoActual: null,
          direccion: null,
          carnetCossmil: null,
          carnetMilitar: null,
          contactoCarnetCossmil: null,
          contactoCarnetMilitar: null,
        },
      }, {
        nombre: 'comandante',
        password: 'comandante',
        rol: 'COMANDANTE',
        filial: {
          nombre: 'Escuela de Idiomas del Ejército - Quillacollo',
          codigo: 'EIE-CB-01',
        },
        persona: {
          nombre: 'comandante',
          apellidoPaterno: null,
          apellidoMaterno: null,
          email: null,
          cedula: 987654,
          cedulaComplemento: '1A',
          ciudad: 'LP',
          celular: null,
          telefono: null,
          fechaNacimiento: new Date(),
          contactoNombre: null,
          contactoCelular: null,
          contactoTelefono: null,
          parentesco: null,
          gestionDiploma: null,
          gestionEgreso: null,
          grado: null,
          nacionalidad: null,
          destinoActual: null,
          direccion: null,
          carnetCossmil: null,
          carnetMilitar: null,
          contactoCarnetCossmil: null,
          contactoCarnetMilitar: null,
        },
      },
    ]
    for await (const registro of registros) {
      const rol = await prisma.rol.findFirst({
        where: {
          nombre: registro.rol
        },
        select: {
          id: true,
        },
      })
      let filial: Filial|null = null
      if (registro.filial) {
        filial = await prisma.filial.findFirst({
          where: registro.filial,
        })
      }
      const ciudad = await prisma.ciudad.findFirst({
        where: {
          codigo: registro.persona.ciudad
        },
        select: {
          id: true,
        },
      })
      let parentesco
      if (registro.persona.parentesco !== null) {
        parentesco = await prisma.parentesco.findFirst({
          where: {
            nombre: registro.persona.parentesco
          },
          select: {
            id: true,
          },
        })
      }
      if (rol && ciudad) {
        const persona = await prisma.persona.upsert({
          where: {
            cedula_ciudadId: {
              cedula: registro.persona.cedula,
              ciudadId: ciudad.id,
            },
          },
          update: {
            nombre: registro.persona.nombre,
            apellidoPaterno: registro.persona.apellidoPaterno,
            apellidoMaterno: registro.persona.apellidoMaterno,
            email: registro.persona.email,
            cedulaComplemento: registro.persona.cedulaComplemento,
            ciudad: {
              connect: ciudad
            },
            celular: registro.persona.celular,
            telefono: registro.persona.telefono,
            fechaNacimiento: registro.persona.fechaNacimiento,
            contactoNombre: registro.persona.contactoNombre,
            contactoCelular: registro.persona.contactoCelular,
            contactoTelefono: registro.persona.contactoTelefono,
            parentesco: {
              connect: parentesco || undefined,
            },
            gestionDiploma: registro.persona.gestionDiploma,
            gestionEgreso: registro.persona.gestionEgreso,
            grado: registro.persona.grado,
            nacionalidad: registro.persona.nacionalidad,
            destinoActual: registro.persona.destinoActual,
            direccion: registro.persona.direccion,
            carnetCossmil: registro.persona.carnetCossmil,
            carnetMilitar: registro.persona.carnetMilitar,
            contactoCarnetCossmil: registro.persona.contactoCarnetCossmil,
            contactoCarnetMilitar: registro.persona.contactoCarnetMilitar,
          },
          create: {
            nombre: registro.persona.nombre,
            apellidoPaterno: registro.persona.apellidoPaterno,
            apellidoMaterno: registro.persona.apellidoMaterno,
            email: registro.persona.email,
            cedula: registro.persona.cedula,
            cedulaComplemento: registro.persona.cedulaComplemento,
            ciudad: {
              connect: ciudad
            },
            celular: registro.persona.celular,
            telefono: registro.persona.telefono,
            fechaNacimiento: registro.persona.fechaNacimiento,
            contactoNombre: registro.persona.contactoNombre,
            contactoCelular: registro.persona.contactoCelular,
            contactoTelefono: registro.persona.contactoTelefono,
            parentesco: {
              connect: parentesco || undefined,
            },
            gestionDiploma: registro.persona.gestionDiploma,
            gestionEgreso: registro.persona.gestionEgreso,
            grado: registro.persona.grado,
            nacionalidad: registro.persona.nacionalidad,
            destinoActual: registro.persona.destinoActual,
            direccion: registro.persona.direccion,
            carnetCossmil: registro.persona.carnetCossmil,
            carnetMilitar: registro.persona.carnetMilitar,
            contactoCarnetCossmil: registro.persona.contactoCarnetCossmil,
            contactoCarnetMilitar: registro.persona.contactoCarnetMilitar,
          },
        })
        if (filial) {
          await prisma.usuario.upsert({
            where: {
              nombre: registro.nombre,
            },
            update: {
              password: await Hash.make(registro.password),
              rememberMeToken: null,
              activo: true,
              rol: {
                connect: { id: rol.id },
              },
              persona: {
                connect: { id: persona.id },
              },
              filial: {
                connect: { id: filial.id },
              },
            },
            create: {
              nombre: registro.nombre,
              password: await Hash.make(registro.password),
              rememberMeToken: null,
              activo: true,
              rol: {
                connect: { id: rol.id },
              },
              persona: {
                connect: { id: persona.id },
              },
              filial: {
                connect: { id: filial.id },
              },
            }
          })
        } else {
          await prisma.usuario.upsert({
            where: {
              nombre: registro.nombre,
            },
            update: {
              password: await Hash.make(registro.password),
              rememberMeToken: null,
              activo: true,
              rol: {
                connect: { id: rol.id },
              },
              persona: {
                connect: { id: persona.id },
              },
            },
            create: {
              nombre: registro.nombre,
              password: await Hash.make(registro.password),
              rememberMeToken: null,
              activo: true,
              rol: {
                connect: { id: rol.id },
              },
              persona: {
                connect: { id: persona.id },
              },
            }
          })
        }
      }
    }
  }
}
