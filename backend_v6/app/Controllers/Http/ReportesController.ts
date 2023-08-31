import * as fs from 'fs'
import flat from 'flat'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import { generatePdf } from 'html-pdf-node-ts'
import Excel from 'exceljs'
import moment from 'moment'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ReportesController {
  public async inscripciones({ request, response }: HttpContextContract) {
    const pagina: number = parseInt(request.input('pagina') || 1)
    const porPagina: number = parseInt(request.input('porPagina') || 8)
    const filialId: string = request.input('filialId') || ''
    if (filialId == '') {
      return response.status(422).send({
        message: 'Debe seleccionar una filial',
      })
    }

    const payload = await request.validate({
      schema: schema.create({
        fechaInicial: schema.date({}, [
          rules.beforeOrEqualToField('fechaFinal'),
        ]),
        fechaFinal: schema.date({}, [
          rules.afterOrEqualToField('fechaFinal'),
        ]),
        excel: schema.boolean(),
        pdf: schema.boolean(),
      }),
      messages: {
        'fechaInicial.beforeOrEqualToField': 'Debe ser menor o igual a la Fecha Final',
        'fechaFinal.afterOrEqualToField': 'Debe ser mayor o igual a la Fecha Inicial',
      }
    })
    if (payload.excel || payload.pdf) {
      let dir: string = ''
      if (payload.excel) {
        dir = './tmp/uploads/excel'
      } else {
        dir = './tmp/uploads/pdf'
      }
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
      }
      const registros = await prisma.inscripcion.findMany({
        include: {
          tipoEstudiante: true,
          filial: true,
          curso: {
            include: {
              idioma: true,
              modalidad: true,
            },
          },
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
        where: {
          filial: {
            id: filialId,
          },
          createdAt: {
            gte: payload.fechaInicial.startOf('day').toJSDate() || new Date(),
            lte: payload.fechaFinal.endOf('day').toJSDate() || new Date(),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
      let archivo: string = ''
      if (payload.excel) {
        archivo = `inscripciones_${Math.floor(new Date().getTime() / 1000)}.xlsx`
        const libro = new Excel.Workbook()
        const hoja = libro.addWorksheet('Inscripciones')
        hoja.columns = [
          { key: 'fechaInscripcion', header: 'Fecha de Inscripción', },
          { key: 'curso.idioma.nombre', header: 'Idioma', },
          { key: 'curso.modalidad.nombre', header: 'Modalidad', },
          { key: 'curso.nombre', header: 'Curso', },
          { key: 'estudiante.matricula', header: 'Matrícula', },
          { key: 'estudiante.persona.nombre', header: 'Nombre', },
          { key: 'estudiante.persona.apellidoPaterno', header: 'Apellido Paterno', },
          { key: 'estudiante.persona.apellidoMaterno', header: 'Apellido Materno', },
          { key: 'estudiante.persona.cedula', header: 'C.I.', },
          { key: 'estudiante.persona.cedulaComplemento', header: 'Complemento C.I.', },
          { key: 'estudiante.persona.ciudad.codigo', header: 'Expedición', },
          { key: 'tipoEstudiante.nombre', header: 'Tipo', },
          { key: 'descuentoPorcentaje', header: 'Descuento[%]', },
          { key: 'depositoRealizado', header: 'Depósito', },
          { key: 'numeroDeposito', header: 'Nro. de Depósito', },
          { key: 'traspasoRealizado', header: 'Traspaso', },
          { key: 'traspasoDesde', header: 'Traspaso desde', },
        ];
        hoja.getRow(1).font = {
          bold: true,
        };
        registros.forEach(item => {
          hoja.addRow(flat({ ...item, ...{
            fechaInscripcion: moment(item.createdAt).format('DD/MM/YYYY'),
            depositoRealizado: item.deposito ? 'SI' : 'NO',
            traspasoRealizado: item.traspaso ? 'SI' : 'NO',
            traspasoDesde: item.traspaso ? item.filial?.nombre : '-',
          }}))
        })
        if (registros.length == 0) {
          hoja.mergeCells('A2:Q2')
          hoja.getCell('A2').value = 'Sin registros.'
          hoja.getCell('A2').alignment = {
            horizontal:'center'
          }
        }
        await libro.xlsx.writeFile(`${dir}/${archivo}`)
        await response.header('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        await response.header('content-disposition', `attachment; filename=${archivo}`)
        return response.download(`${dir}/${archivo}`, true, (err) => {
          if (err) {
            Logger.error(err.message)
            return response.status(500).send({
              message: 'Error al generar el archivo',
            })
          }
          fs.unlinkSync(`${dir}/${archivo}`)
        })
      } else if (payload.pdf) {
        archivo = `inscripciones_${Math.floor(new Date().getTime() / 1000)}.pdf`
        let pdf: string = ''
        // Encabezado de página
        pdf += '<body style="font-size: 12px; font-family: "Arial", Sans-Serif;">'
        pdf += '<h3 style="text-align: center;">Reporte de Inscripciones</h3>'
        pdf += `<h4 style="text-align: center;">De fecha ${moment(payload.fechaInicial.toJSDate()).format('DD/MM/YYYY')} a ${moment(payload.fechaFinal.toJSDate()).format('DD/MM/YYYY')}</h4>`
        // Cabecera de tabla
        pdf += '<table style="font-size: 10px; table-layout: fixed; width: 100%; border: 1px solid; border-collapse: collapse;">'
        pdf += '<thead>'
        pdf += '<tr style="word-wrap: break-word;">'
        pdf += '<th style="width: 30%; border: 1px solid;">Nombre</th>'
        pdf += '<th style="width: 10%; border: 1px solid;">C.I.</th>'
        pdf += '<th style="width: 10%; border: 1px solid;">Matrícula</th>'
        pdf += '<th style="width: 15%; border: 1px solid;">Idioma</th>'
        pdf += '<th style="width: 20%; border: 1px solid;">Curso</th>'
        pdf += '<th style="width: 15%; border: 1px solid;">Modalidad</th>'
        pdf += '</tr>'
        pdf += '</thead>'
        pdf += '<tbody>'
        // Datos de tabla
        registros.forEach(item => {
          pdf += '<tr style="word-wrap: break-word;">'
          pdf += `<td style="border: 1px solid;">${[item.estudiante.persona.nombre, item.estudiante.persona.apellidoPaterno, item.estudiante.persona.apellidoMaterno].join(' ') || ''}</td>`
          pdf += `<td style="border: 1px solid;">${[item.estudiante.persona.cedula, item.estudiante.persona.cedulaComplemento, item.estudiante.persona.ciudad.codigo].join(' ') || ''}</td>`
          pdf += `<td style="border: 1px solid;">${item.estudiante.matricula || ''}</td>`
          pdf += `<td style="border: 1px solid;">${item.curso.idioma.nombre || ''}</td>`
          pdf += `<td style="border: 1px solid;">${item.curso.nombre || ''}</td>`
          pdf += `<td style="border: 1px solid;">${item.curso.modalidad.nombre || ''}</td>`
          pdf += '</tr>'
        })
        if (registros.length == 0) {
          pdf += '<tr style="word-wrap: break-word;">'
          pdf += `<td style="border: 1px solid; text-align: center;" colspan="6">Sin registros.</td>`
          pdf += '</tr>'
        }
        pdf += '</tbody>'
        pdf += '</table>'
        // Pie de firma visto bueno
        const firmas = await prisma.firma.findMany({
          where: {
            filial: {
              id: filialId,
            },
          },
          orderBy: [
            { posicion: 'asc' },
            { nombre: 'asc' },
          ],
        })
        pdf += '<div style="display: grid; grid-template-columns: 1fr 1fr; width: 100%; margin-top: 114px;">'
        pdf += '<div style="text-align: center;">'
        pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 70%; margin-bottom: -7px;"></p>`
        pdf += `<p style="margin: 0; padding: 0;">${firmas[0].nombre}</p>`
        pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[0].cargo}</p>`
        pdf += '</div>'
        pdf += '<div style="text-align: center;">'
        pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 70%; margin-bottom: -7px;"></p>`
        pdf += `<p style="margin: 0; padding: 0;">${firmas[1].nombre}</p>`
        pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[1].cargo}</p>`
        pdf += '</div>'
        pdf += '</div>'
        // Pie de firma visto bueno
        pdf += '<div style="text-align: center; margin-top: 38px;">'
        pdf += `<p style="margin: 0; padding: 0;">Vo.Bo.</p>`
        pdf += '</div>'
        pdf += '<div style="text-align: center; margin-top: 76px;">'
        pdf += `<p style="margin: 0; padding: 0;"><hr style="border: 1px solid black; width: 35%; margin-bottom: -7px;"></p>`
        pdf += `<p style="margin: 0; padding: 0;">${firmas[2].nombre}</p>`
        pdf += `<p style="margin: 0; padding: 0; font-weight: bold;">${firmas[2].cargo}</p>`
        pdf += '</div>'
        pdf += '<style>'
        pdf += '@page { margin: 76px; }'
        pdf += '</style>'
        pdf += '</body>'
        const output = await generatePdf(
          {
            content: pdf
          }, {
            format: 'Letter'
          }
        )
        return response.send({
          message: 'Lista de registros',
          payload: {
            pdf: Buffer.from(output).toString('base64'),
            filename: archivo,
          }
        })
      } else {
        return response.status(422).send({
          message: 'Formato inválido',
        })
      }
    } else {
      const [ data, total ] = await prisma.$transaction([
        prisma.inscripcion.findMany({
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          include: {
            tipoEstudiante: true,
            filial: true,
            curso: {
              include: {
                idioma: true,
                modalidad: true,
              },
            },
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
          where: {
            filial: {
              id: filialId,
            },
            createdAt: {
              gte: payload.fechaInicial.startOf('day').toJSDate() || new Date(),
              lte: payload.fechaFinal.endOf('day').toJSDate() || new Date(),
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
        prisma.inscripcion.count({
          where: {
            createdAt: {
              gte: payload.fechaInicial.startOf('day').toJSDate() || new Date(),
              lte: payload.fechaFinal.endOf('day').toJSDate() || new Date(),
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
}
