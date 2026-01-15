import * as winston from 'winston';
import 'winston-daily-rotate-file';
export declare const winstonConfig: {
    level: string;
    format: winston.Logform.Format;
    transports: (winston.transports.ConsoleTransportInstance | import("winston-daily-rotate-file"))[];
};
