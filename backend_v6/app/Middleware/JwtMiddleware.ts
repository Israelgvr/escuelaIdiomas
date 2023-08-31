import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import jwt from 'jsonwebtoken'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Config from '@ioc:Adonis/Core/Config'

interface DatosJwt extends jwt.JwtPayload {
  id: string
  nombre: string,
  iat: number,
  exp: number
}

export default class JwtMiddleware {
  public async handle({ auth, request, response }: HttpContextContract, next: () => Promise<void>) {
    const bearerToken = request.header('authorization')
    let partes = bearerToken?.split(' ') || []
    if (bearerToken) {
      if (partes.length !== 2) {
        return response.status(401).json({
          message: 'El token enviado es inválido',
        })
      } else {
        if (partes[0].toLowerCase() !== 'bearer') {
          return response.status(401).json({
            message: 'La autenticación debe estar en formato bearer',
          })
        } else {
          const token = partes[1]
          try {
            const datos = <DatosJwt>jwt.verify(token, Config.get('app.appKey'))
            const usuario = await prisma.usuario.findFirst({
              where: {
                id: datos.id,
                nombre: datos.nombre,
                rememberMeToken: token,
              },
            })
            if (usuario) {
              auth.use('api').user = usuario
              return next()
            } else {
              return response.status(401).send({
                message: 'Debe iniciar sesión',
              })
            }
          } catch(err) {
            if (err.name == 'TokenExpiredError') {
              return response.status(401).json({
                message: 'Sesión expirada',
              })
            } else {
              return response.status(401).json({
                message: 'Acceso no autorizado',
              })
            }
          }
        }
      }
    } else {
      return response.status(401).json({
        message: 'Acceso no autorizado',
      })
    }
  }
}
