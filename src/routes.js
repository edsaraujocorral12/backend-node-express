import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
    const user = await User.create({
        name: 'Edson Corral',
        email: 'edsaraujocorral12@gmail.com',
        password_hash: '123123123'
    });

    res.json(user);
});

export default routes;
