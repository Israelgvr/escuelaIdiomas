import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import * as moment from 'moment'
import 'moment/locale/es-mx'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    moment.locale('es')
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
