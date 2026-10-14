import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

const specPath = path.join(import.meta.dirname, '..', 'docs', 'openapi.yaml');
const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));

const router = Router();

// Raw spec, e.g. for importing into Postman/Insomnia or generating a client
router.get('/openapi.json', (req, res) => res.json(spec));
router.get('/openapi.yaml', (req, res) => res.type('application/yaml').sendFile(specPath));

router.use('/', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Warehouse Inventory API' }));

export default router;
