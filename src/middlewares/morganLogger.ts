import morgan from 'morgan';
import { createStream } from 'rotating-file-stream';
import path from 'path';

const logDirectory = path.join(__dirname, '../../logs');

const accessLogStream = createStream('access.log', {
  interval: '1d',
  path: logDirectory,
  compress: 'gzip',
  maxFiles: 30,
  immutable: true,
});

const simpleFormat = '[:date[dd-MMM-yyyy HH:mm:ss]] :method :url → :status :response-time ms';

export const morganLogger = morgan(simpleFormat, {
  stream: accessLogStream,
  skip: (req) => req.url === '/health' || req.url === '/ping',
});