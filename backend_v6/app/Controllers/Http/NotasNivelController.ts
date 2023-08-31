
import { prisma } from '@ioc:Adonis/Addons/Prisma'

export default class NotasNivelController {
  public async obtenerNivelesA({ response }) {
    try {
      const niveles = await prisma.nivel.findMany({
        include: {
          idioma: true,
          libros: true,
          cursos: true,
        },
      });

      return response.status(200).json(niveles);
    } catch (error) {
      return response.status(500).json({ message: 'Error al obtener los niveles' });
    }
  }

  public async obtenerNivelesB({ response }) {
    try {
      const niveles = await prisma.nivel.findMany({
        include: {
          idioma: true,
          libros: true,
          cursos: true,
        },
      });

      const nivelesFormateados = niveles.map(nivel => ({
        id: nivel.id,
        nombre: nivel.nombre,
        codigo: nivel.codigo,
        posicion: nivel.posicion,
        idiomaId: nivel.idiomaId,
        librosId: nivel.libros.map(libro => libro.id),
        cursosId: nivel.cursos.map(curso => curso.id),
        createdAt: nivel.createdAt,
        updatedAt: nivel.updatedAt,
        idioma: {
          id: nivel.idioma.id,
          nombre: nivel.idioma.nombre,
          codigo: nivel.idioma.codigo,
          createdAt: nivel.idioma.createdAt,
          updatedAt: nivel.idioma.updatedAt,
        },
        libros: nivel.libros.map(libro => ({
          id: libro.id,
          nombre: libro.nombre,
          codigo: libro.codigo,
          createdAt: libro.createdAt,
          updatedAt: libro.updatedAt,
        })),
        cursos: nivel.cursos.map(curso => ({
          id: curso.id,
          nombre: curso.nombre,
          activo: curso.activo,
          modalidadId: curso.modalidadId,
          idiomaId: curso.idiomaId,
          horaInicial: curso.horaInicial,
          horaFinal: curso.horaFinal,
          createdAt: curso.createdAt,
          updatedAt: curso.updatedAt,
        })),
      }));

      return response.status(200).json(nivelesFormateados);
    } catch (error) {
      return response.status(500).json({ message: 'Error al obtener los niveles' });
    }
  }

  public async obtenerNivelesN({ response }) {
    try {
      const niveles = await prisma.nivel.findMany({
        include: {
          libros: true,
        },
      });

      const librosPorNivel = niveles.map(nivel => nivel.libros);

      return response.status(200).json(librosPorNivel);
    } catch (error) {
      return response.status(500).json({ message: 'Error al obtener los niveles' });
    }
  }

  public async obtenerNiveles({ response }) {
    try {
      const niveles = await prisma.nivel.findMany({
        select: {
          id: true,
          nombre: true,
          codigo: true,
          libros: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      });

      return response.status(200).json(niveles);
    } catch (error) {
      return response.status(500).json({ message: 'Error al obtener los niveles' });
    }
  }




}
