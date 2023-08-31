import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { prisma } from '@ioc:Adonis/Addons/Prisma'

export default class PermisoMiddleware {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>, props) {
    const rol = await prisma.rol.findFirst({
      where: {
        id: auth.user?.rolId,
      },
      select: {
        id: true,
        nombre: true,
        modulos: true,
      }
    })
    if (rol) {
      if (rol.modulos.some(o => props.includes(o.nombre))) {
        return next()
      } else {
        return response.status(401).json({
          message: 'Acceso no autorizado',
        })
      }
    } else {
      return response.status(401).json({
        message: 'Acceso denegado',
      })
    }
  }
}
