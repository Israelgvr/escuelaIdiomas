/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: any, ctx: HttpContextContract) {
    if (error.code === 'E_ROW_NOT_FOUND') {
      return ctx.response.status(404).send({
        message: 'Registro inexistente',
      })
    } else if (error.code === 'E_VALIDATION_FAILURE') {
      let errors = error.messages.errors
      errors.forEach(function(v){ delete v.rule })
      return ctx.response.status(422).send({
        message: 'Error de validación',
        errors: errors.reduce(function(r,a){r[a.field] = r[a.field] || []; r[a.field].push(a.message); return r; }, Object.create(null)),
      })
    }

    return super.handle(error, ctx)
  }
}
