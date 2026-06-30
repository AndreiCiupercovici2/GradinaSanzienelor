const nodemailer = require('nodemailer');
const { BASE_URL } = require('./helpers');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (detaliiRezervare, tipRezervare) => {
    try {
        const emailText = detaliiRezervare.email || 'Nu a lăsat email';
        let continutEmail = `Ai o rezervare nouă pentru: ${tipRezervare}\n\n`;

        const adults = parseInt(detaliiRezervare.adults) || 1;
        const infants = parseInt(detaliiRezervare.infants) || 0;
        const pets = parseInt(detaliiRezervare.pets) || 0;
        const totalPeople = adults + infants;

        continutEmail += `\nCompunerea grupului:\n`;
        continutEmail += `- Adulți: ${adults}\n`;
        continutEmail += `- Animale de companie: ${pets}\n`;
        continutEmail += `Persoane total: ${totalPeople}\n`;

        if (tipRezervare === 'cabana') {
            continutEmail += `\nData început: ${detaliiRezervare.data_inceput}\n`;
            continutEmail += `Data sfârșit: ${detaliiRezervare.data_sfarsit}\n`;
            continutEmail += `Camere necesare: ${detaliiRezervare.rooms_needed || 1}\n`;
            continutEmail += `Vrea meniu: ${detaliiRezervare.vrea_meniu ? 'Da' : 'Nu'}\n`;
            continutEmail += `Vrea ciubăr: ${detaliiRezervare.vrea_hottub ? 'Da' : 'Nu'}\n`;
            continutEmail += `Consimțământ newsletter: ${detaliiRezervare.newsletter ? 'Da' : 'Nu'}\n`;
        } else {
            continutEmail += `\nData: ${detaliiRezervare.data_rezervare}\n`;
            continutEmail += `Ora: ${detaliiRezervare.ora}\n`;
        }

        continutEmail += `\nPentru a vedea detaliile și a aproba sau anula rezervarea, accesează: ${BASE_URL}/admin.html`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Nouă rezervare - ${tipRezervare}`,
            text: continutEmail
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

const sendDraftReminderEmail = async (draft, clientName, reservationType, resumeLink) => {
    try {
        const createdDate = new Date(draft.created_at).toLocaleDateString('ro-RO');
        
        const emailContent = `
Salut ${clientName},

Observă că ai o rezervare nefinalizată pentru ${reservationType}, înregistrată pe ${createdDate}.

Poți continua să completezi formularul accesând următorul link:
${resumeLink}

Datele tale vor fi șterse în 24 de ore din momentul înregistrării.

Dacă ai întrebări, ne poți contacta.

Cu plăcere,
Echipa Grădina Sânzienelor
        `.trim();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: draft.email,
            subject: `Reluare rezervare - ${reservationType}`,
            text: emailContent
        });
    } catch (error) {
        console.error('Reminder email sending failed:', error);
        throw error; // Throw to the controller so it can send a 500 status
    }
};

module.exports = { sendConfirmationEmail, sendDraftReminderEmail };