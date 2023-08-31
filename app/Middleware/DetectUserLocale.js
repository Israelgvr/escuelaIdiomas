"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const I18n_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Addons/I18n"));
class DetectUserLocale {
    getUserLanguage(ctx) {
        const availableLocales = I18n_1.default.supportedLocales();
        return ctx.request.language(availableLocales) || ctx.request.input('lang');
    }
    async handle(ctx, next) {
        const language = this.getUserLanguage(ctx);
        if (language) {
            ctx.i18n.switchLocale(language);
        }
        await next();
    }
}
exports.default = DetectUserLocale;
//# sourceMappingURL=DetectUserLocale.js.map