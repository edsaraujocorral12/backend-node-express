import jwt from 'jsonwebtoken';
import User from '../models/User';

class SessionController {
    async store(req, res) {
        const { email, password} = req.body;
        const user = await User.findOne({ where: { email }});

        if (!user) {
            return res.status(401).json({ error: "User not found"});
        }

        if (!(await user.checkPassword(password))) {
            return res.status(401).json({ error:  'Password does not match'});
        }
        // Se chegou até aqui, então email e password estão ok
        const { id, name } = user;

        return res.json({
            user: {
                id,
                name,
                email
            },
            token: jwt.sign({ id }, 'ed4dd7f62c031616fd549670e70641b6', {
                expiresIn: '7d'
            }),
        });
    }
}

export default new SessionController();
