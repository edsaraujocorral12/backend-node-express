import { Router } from 'express';
import User from './app/models/User';

import UserController from './app/controllers/UserController';

const routes = new Router();

routes.post('/Users', UserController.store);

export default routes;
