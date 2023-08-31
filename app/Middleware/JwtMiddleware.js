"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Prisma_1 = global[Symbol.for('ioc.use')]("Adonis/Addons/Prisma");
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Config"));
class JwtMiddleware {
    async handle({ auth, request, response }, next) {
        const bearerToken = request.header('authorization');
        let partes = bearerToken?.split(' ') || [];
        if (bearerToken) {
            if (partes.length !== 2) {
                return response.status(401).json({
                    message: 'El token enviado es inválido',
                });
            }
            else {
                if (partes[0].toLowerCase() !== 'bearer') {
                    return response.status(401).json({
                        message: 'La autenticación debe estar en formato bearer',
                    });
                }
                else {
                    const token = partes[1];
                    try {
                        const datos = jsonwebtoken_1.default.verify(token, Config_1.default.get('app.appKey'));
                        const usuario = await Prisma_1.prisma.usuario.findFirst({
                            where: {
                                id: datos.id,
                                nombre: datos.nombre,
                                rememberMeToken: token,
                            },
                        });
                        if (usuario) {
                            auth.use('api').user = usuario;
                            return next();
                        }
                        else {
                            return response.status(401).send({
                                message: 'Debe iniciar sesión',
                            });
                        }
                    }
                    catch (err) {
                        if (err.name == 'TokenExpiredError') {
                            return response.status(401).json({
                                message: 'Sesión expirada',
                            });
                        }
                        else {
                            return response.status(401).json({
                                message: 'Acceso no autorizado',
                            });
                        }
                    }
                }
            }
        }
        else {
            return response.status(401).json({
                message: 'Acceso no autorizado',
            });
        }
    }
}
exports.default = JwtMiddleware;
//# sourceMappingURL=JwtMiddleware.js.map