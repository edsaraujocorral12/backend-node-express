import { Router } from 'express';

const routes = new Router();

routes.get('/', (req, res) => res.json({ msg: 'Hello Guy' }));

export default routes;
