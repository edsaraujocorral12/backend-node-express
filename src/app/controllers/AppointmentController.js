import Appointment from '../models/Appointments';
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import User from '../models/User';

class AppointmentController {
    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            data: Yup.date().required(),
        });
        if (!(await schema.isValid(req.body))) {
            return res.state(400).json({ error: 'Validation fails' });
        }

        const { provider_id, data } = req.body;

        /**
         * Check if provider_id is a provider
         */
        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true }
        });

        if (!isProvider) {
            return res.status(401).json({ error: 'You can only create appointments with providers' });
        }
        /**
         * Check for past date
         */
        const hourStart = startOfHour(parseISO(data));

        if (isBefore(hourStart, new Date())) {
            return res.status(400).json({ error: 'Past dates are not permitted' });
        }
        /**
         * Check data availability
         */
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                data: hourStart
            },
        });

        if (checkAvailability) {
            return res.status(400).json({ error: 'Appointment date is not avaible' });
        }
        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            data: hourStart
        });

        return res.json(appointment);
    }
}
export default new AppointmentController();
