import { AuthConfig } from '@ioc:Adonis/Addons/Auth'

const authConfig: AuthConfig = {
  guard: 'api',

  guards: {
    api: {
      driver: 'oat',
      tokenProvider: {
        type: 'api',
        driver: 'database',
        table: 'apiTokens',
        foreignKey: 'usuarioId',
      },
      provider: {
        driver: 'prisma',
        identifierKey: 'id',
        uids: ['nombre'],
        model: 'usuario',
      },
    },
  },
}

export default authConfig