const portalInternModel = require('../models/portalInternModel');
const { getLanguage, t } = require('../utils/helpers');

const PortalInternController = {

    getAllCabinReservations: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await portalInternModel.getAllCabinReservations();
            res.json(rows);
        } catch (error) {
            console.error('Error fetching cabin reservations:', error);
            res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    getAllMealReservations: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await portalInternModel.getAllMealReservations();
            res.json(rows);
        } catch (error) {
            console.error('Error fetching meal reservations:', error);
            res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    getActiveDrafts: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await portalInternModel.getActiveDrafts();
            res.json(rows);
        } catch (error) {
            console.error('Error fetching active drafts:', error);
            res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    getAdminReservations: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await portalInternModel.getReservations();
            res.json(rows);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    handleDecision: async (req, res) => {
        const lang = getLanguage(req);
        const { id, reservationType, decision } = req.body;

        if (!['cabin', 'meal'].includes(reservationType)) {
            return res.status(400).json({ errors: t('invalid_reservation_type', lang) });
        }
        if (!['confirm', 'reject'].includes(decision)) {
            return res.status(400).json({ errors: t('invalid_decision', lang) });
        }
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ errors: t('invalid_reservation_id', lang) });
        }

        const table = reservationType === 'cabin' ? 'cabin_reservations' : 'meal_reservations';
        const newStatus = decision === 'confirm' ? 'confirmed' : 'rejected';

        try {
            const changes = await portalInternModel.updateReservationStatus(table, id, newStatus);
            if (changes === 0) {
                return res.status(404).json({ errors: t('reservation_not_found', lang) });
            }
            return res.status(200).json({ message: t('reservation_updated', lang) });
        } catch (error) {
            console.error('Error updating reservation status:', error);
            return res.status(500).json({ errors: t('server_error', lang) });
        }
    }
}

module.exports = PortalInternController;