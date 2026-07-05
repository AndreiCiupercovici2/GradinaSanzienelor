const nodemailer = require('nodemailer');
const { BASE_URL } = require('./helpers');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (reservationDetails, reservationType) => {
    try {
        const emailText = reservationDetails.email || 'Nu a lăsat email';
        let emailContent = `Ai o rezervare nouă pentru: ${reservationType}\n\n`;

        const adults = parseInt(reservationDetails.adults) || 1;
        const pets = parseInt(reservationDetails.pets) || 0;

        emailContent += `\nCompunerea grupului:\n`;
        emailContent += `- Adulți: ${adults}\n`;
        emailContent += `- Animale de companie: ${pets}\n`;

        if (reservationType === 'cabin') {
            emailContent += `\nData început: ${reservationDetails.start_date}\n`;
            emailContent += `Data sfârșit: ${reservationDetails.end_date}\n`;
            emailContent += `Camere necesare: ${reservationDetails.rooms_needed || 1}\n`;
            emailContent += `Vrea meniu: ${reservationDetails.wants_meal ? 'Da' : 'Nu'}\n`;
            emailContent += `Vrea ciubăr: ${reservationDetails.wants_hottub ? 'Da' : 'Nu'}\n`;
            emailContent += `Consimțământ newsletter: ${reservationDetails.newsletter ? 'Da' : 'Nu'}\n`;
        } else {
            emailContent += `\nData: ${reservationDetails.reservation_date}\n`;
            emailContent += `Ora: ${reservationDetails.reservation_time}\n`;
        }

        emailContent += `\nPentru a vedea detaliile și a aproba sau anula rezervarea, accesează: ${BASE_URL}/portalIntern.html`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Nouă rezervare - ${reservationType}`,
            text: emailContent
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

module.exports = { sendConfirmationEmail};