import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import config from './config/index.js';
import routes from './routes/index.js';
import requestLogger from './middlewares/requestLogger.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, exposedHeaders: ['X-Request-Id'] }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
