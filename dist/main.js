"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nest_winston_1 = require("nest-winston");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const api_key_guard_1 = require("./auth/api-key.guard");
const logger_config_1 = require("./config/logger.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: nest_winston_1.WinstonModule.createLogger(logger_config_1.winstonConfig),
    });
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalGuards(new api_key_guard_1.ApiKeyGuard(configService));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ContactShip Mini API')
        .setDescription('Microservicio de gestión de leads con sincronización automática y soporte de IA.')
        .setVersion('1.0')
        .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map