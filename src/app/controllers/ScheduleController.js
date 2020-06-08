import { startOfDay, endOfDay, parseISO } from 'date-fns';
import Appointments from '../models/Appointments';
import User from '../models/User';
import { Op } from 'sequelize';

class ScheduleController {
    async index(req, res) {
        const checkUserProvider = await User.findOne({
            where: {
                id: req.userId, provider: true
            },
        });
        if (!checkUserProvider) {
            return res.status(401).json({ error: 'User is not a provider' });
        }
        const { date } = req.query;
        const parseDate = parseISO(date);

        const appointments = await Appointments.findAll({
            where: {
                provider_id: req.userId,
                canceled_at: null,
                data: {
                    [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
                },
            },
            order: ['data']
        });

        return res.json(appointments);
    }
}
export default new ScheduleController();
