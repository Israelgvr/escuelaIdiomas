"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Prisma_1 = global[Symbol.for('ioc.use')]("Adonis/Addons/Prisma");
class PermisoMiddleware {
    async handle({ auth, response }, next, props) {
        const rol = await Prisma_1.prisma.rol.findFirst({
            where: {
                id: auth.user?.rolId,
            },
            select: {
                id: true,
                nombre: true,
                modulos: true,
            }
        });
        if (rol) {
            if (rol.modulos.some(o => props.includes(o.nombre))) {
                return next();
            }
            else {
                return response.status(401).json({
                    message: 'Acceso no autorizado',
                });
            }
        }
        else {
            return response.status(401).json({
                message: 'Acceso denegado',
            });
        }
    }
}
exports.default = PermisoMiddleware;
//# sourceMappingURL=PermisoMiddleware.js.map