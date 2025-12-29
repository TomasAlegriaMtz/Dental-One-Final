const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'montoya.martinez.juan.cb284@gmail.com',
        pass: 'forqaqbytdgvabra',
    },
});


async function enviarCorreoSMTP({ to, subject, html }) {
    const mailOptions = {
        from: '"Clínica Médica" <montoya.martinez.juan.cb284@gmail.com>',
        to,
        subject,
        html,
    };

    console.log(mailOptions);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.messageId);
        return { ok: true };
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return { ok: false, message: error };
    }
}

module.exports = {
    enviarCorreoSMTP,
};
