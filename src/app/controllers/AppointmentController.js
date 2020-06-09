import Appointment from '../models/Appointments';
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
    async index(req, res) {
        const { page = 1 } = req.query;
        const appointments = await Appointment.findAll({
            where: {
                user_id: req.userId,
                canceled_at: null
            },
            order: ['data'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'data'],
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [{
                        model: File,
                        as: 'avatar',
                        attributes: ['id', 'path', 'url']
                    }
                    ]
                }
            ]
        });

        return res.json(appointments);
    }
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
        if (provider_id === req.userId) {
            return res.status(400).json({ error: 'You not can create appointments' });
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
        /**
         * Notify appointments providers
         */
        const user = await User.findByPk(req.userId);
        const formattedDate = format(hourStart,
            "'dia' dd 'de' MMMM', às' H:mm'h'", { locale: pt }
        );

        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formattedDate} `,
            user: provider_id,
        });

        return res.json(appointment);
    }
    async delete(req, res) {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                }
            ]
        });

        if (appointment.user_id !== req.userId) {
            return res.status(401).json(
                { error: "You dont have permission to cancel this appointments" });
        }

        const dateWithSub = subHours(appointment.data, 2);

        if (isBefore(dateWithSub, new Date)) {
            return res.status(401).json(
                { error: 'You can only cancel appointments 2 hours in advance' });
        }

        appointment.canceled_at = new Date();
        await appointment.save();

        await Queue.add(CancellationMail.key, {
            appointment,
        });

        return res.json(appointment);
    }
}
export default new AppointmentController();
