import { validator } from '@ioc:Adonis/Core/Validator'

validator.rule('time', (value, _, options) => {
  let horasMinutos: RegExp = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/
  let horasMinutosSegundos: RegExp = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/

  if (typeof value !== 'string') {
    return
  }

  if (!value.match(horasMinutos) && !value.match(horasMinutosSegundos)) {
    options.errorReporter.report(
      options.pointer,
      'time',
      'time validation failed',
      options.arrayExpressionPointer
    )
  }
})
