/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import Application from '@ioc:Adonis/Core/Application'
import Route from '@ioc:Adonis/Core/Route'

Route.get('uploads/:carpeta/:archivo', async ({ response, params }) => {
  response.download(Application.makePath(`../storage/uploads/${params.carpeta}`, params.archivo))
})

Route.group(() => {
  Route.post('login', 'AuthController.store')
  Route.post('reset_token', 'AuthController.resetPasswordToken')
  Route.post('reset_password', 'AuthController.resetPassword')
  Route.get('filiales', 'FilialesController.index')
  Route.get('idiomas', 'IdiomasController.index')
  Route.get('modalidades', 'ModalidadesController.index')
  Route.get('ciudades', 'CiudadesController.index')
  Route.post('pre_inscripciones', 'PreInscripcionesController.store')

  Route.group(() => {
    Route.get('me', 'AuthController.index')
    Route.post('logout', 'AuthController.destroy')
    Route.put('perfil/:id', 'AuthController.update')

    Route.get('parentescos', 'ParentescosController.index').middleware(['permiso:ESTUDIANTES,USUARIOS,PARAMETROS'])
    Route.get('libros', 'LibrosController.index').middleware(['permiso:LIBROS,IDIOMAS'])
    Route.get('roles', 'RolesController.index').middleware(['permiso:USUARIOS,PARAMETROS'])
    Route.get('idiomas/:idiomaId/niveles', 'NivelesController.index').middleware(['permiso:IDIOMAS,CURSOS,PREINSCRIPCIONES'])
    Route.get('fuerzas', 'FuerzasController.index').middleware(['permiso:ESTUDIANTES,PARAMETROS'])
    Route.get('tipos_estudiante', 'TiposEstudianteController.index').middleware(['permiso:ESTUDIANTES,TIPOS DE ESTUDIANTE'])

    Route.group(() => {
      Route.post('ciudades', 'CiudadesController.store')
      Route.get('ciudades/:id', 'CiudadesController.show')
      Route.put('ciudades/:id', 'CiudadesController.update')
      Route.delete('ciudades/:id', 'CiudadesController.destroy')
      Route.post('parentescos', 'ParentescosController.store')
      Route.get('parentescos/:id', 'ParentescosController.show')
      Route.put('parentescos/:id', 'ParentescosController.update')
      Route.delete('parentescos/:id', 'ParentescosController.destroy')
      Route.post('modalidades', 'ModalidadesController.store')
      Route.get('modalidades/:id', 'ModalidadesController.show')
      Route.put('modalidades/:id', 'ModalidadesController.update')
      Route.delete('modalidades/:id', 'ModalidadesController.destroy')
      Route.post('fuerzas', 'FuerzasController.store')
      Route.get('fuerzas/:id', 'FuerzasController.show')
      Route.put('fuerzas/:id', 'FuerzasController.update')
      Route.delete('fuerzas/:id', 'FuerzasController.destroy')
      Route.resource('modulos', 'ModulosController')
      Route.get('excel/modulos', 'ModulosController.excel')
      Route.post('roles', 'RolesController.store')
      Route.get('roles/:id', 'RolesController.show')
      Route.put('roles/:id', 'RolesController.update')
      Route.delete('roles/:id', 'RolesController.destroy')
    }).middleware(['permiso:PARAMETROS'])

    Route.group(() => {
      Route.post('tipos_estudiante', 'TiposEstudianteController.store')
      Route.get('tipos_estudiante/:id', 'TiposEstudianteController.show')
      Route.put('tipos_estudiante/:id', 'TiposEstudianteController.update')
      Route.delete('tipos_estudiante/:id', 'TiposEstudianteController.destroy')
    }).middleware(['permiso:TIPOS DE ESTUDIANTE'])

    Route.group(() => {
      Route.get('excel/libros', 'LibrosController.excel')
      Route.post('libros', 'LibrosController.store')
      Route.get('libros/:id', 'LibrosController.show')
      Route.put('libros/:id', 'LibrosController.update')
      Route.delete('libros/:id', 'LibrosController.destroy')
    }).middleware(['permiso:LIBROS'])

    Route.group(() => {
      Route.get('excel/usuarios', 'UsuariosController.excel')
      Route.resource('usuarios', 'UsuariosController')
    }).middleware(['permiso:USUARIOS'])

    Route.group(() => {
      Route.get('excel/filiales', 'FilialesController.excel')
      Route.post('filiales', 'FilialesController.store')
      Route.get('filiales/:id', 'FilialesController.show')
      Route.put('filiales/:id', 'FilialesController.update')
      Route.delete('filiales/:id', 'FilialesController.destroy')
    }).middleware(['permiso:FILIALES'])

    Route.group(() => {
      Route.get('excel/idiomas', 'IdiomasController.excel')
      Route.post('idiomas', 'IdiomasController.store')
      Route.get('idiomas/:id', 'IdiomasController.show')
      Route.put('idiomas/:id', 'IdiomasController.update')
      Route.delete('idiomas/:id', 'IdiomasController.destroy')
      Route.post('idiomas/:idiomaId/niveles', 'NivelesController.store')
      Route.get('idiomas/:idiomaId/niveles/:nivelId', 'NivelesController.show')
      Route.put('idiomas/:idiomaId/niveles/:nivelId', 'NivelesController.update')
      Route.delete('idiomas/:idiomaId/niveles/:nivelId', 'NivelesController.destroy')
    }).middleware(['permiso:IDIOMAS'])

    Route.group(() => {
      Route.get('excel/cursos', 'CursosController.excel')
      Route.get('idiomas/:id/cursos', 'IdiomasController.cursos')
      Route.resource('cursos', 'CursosController')
    }).middleware(['permiso:CURSOS'])

    Route.group(() => {
      Route.get('imprimir/estudiantes', 'EstudiantesController.imprimir')
      Route.resource('estudiantes', 'EstudiantesController')
      Route.get('nacionalidades', 'UsuariosController.nacionalidades')
      Route.get('grados', 'UsuariosController.grados')
      Route.get('inscripciones/estudiantes', 'InscripcionesController.estudiantes')
      Route.get('inscripciones', 'InscripcionesController.index')
      Route.get('cursos/:cursoId/inscripciones', 'InscripcionesController.indexA')
      Route.post('inscripciones', 'InscripcionesController.store')
      Route.get('inscripciones/:inscripcionId', 'InscripcionesController.show')
      Route.put('inscripciones/:inscripcionId', 'InscripcionesController.update')
      Route.delete('inscripciones/:inscripcionId', 'InscripcionesController.destroy')

      /*NIVELES*/
      Route.get('NivelesLibros', 'NotasNivelController.obtenerNiveles')

      Route.post('NotasLibro', 'NotasController.NotaslibroPost')

    }).middleware(['permiso:ESTUDIANTES'])

    Route.group(() => {
      Route.get('reportes/inscripciones', 'ReportesController.inscripciones')
    }).middleware(['permiso:REPORTES'])

    Route.group(() => {
      Route.resource('firmas', 'FirmasController')
    }).middleware(['permiso:FIRMAS'])

    Route.group(() => {
      Route.get('pre_inscripciones', 'PreInscripcionesController.index')
      Route.get('pre_inscripciones/:id', 'PreInscripcionesController.show')
      Route.put('pre_inscripciones/:id', 'PreInscripcionesController.update')
      Route.delete('pre_inscripciones/:id', 'PreInscripcionesController.destroy')
    }).middleware(['permiso:PREINSCRIPCIONES'])
  }).middleware('auth')
}).prefix('/api')
