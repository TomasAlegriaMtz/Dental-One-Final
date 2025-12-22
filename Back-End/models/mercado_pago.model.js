const { MercadoPagoConfig, Preference } = require('mercadopago');

// Crear cliente con access token
const client = new MercadoPagoConfig({
    accessToken: 'TEST-5705468328575025-121220-2600385bb4963b1d8adbbbdf855327ed-3061867681'
});

// Crear instancia de Preference
const preference = new Preference(client);

const crearPreferencia = async (datos) => {
    try {
        const preferenceData = {
            items: [
                {
                    title: datos.title,
                    quantity: 1,
                    unit_price: Number(datos.price),
                    currency_id: 'MXN'
                }
            ],
            payer: {
                name: datos.name,
                surname: datos.lastname || '-',
                email: datos.email
            },
            external_reference: datos.idUser,
            back_urls: {
                success: "http://localhost:4200/calendar",
                failure: "http://localhost:4200/calendar",
                pending: "http://localhost:4200/calendar"
            },
            //auto_return: "approved"
        };

        const result = await preference.create({ body: preferenceData });

        return {
            id: result.id,
            init_point: result.init_point
        };

    } catch (error) {
        console.error("Error creando preferencia:", error);
        throw error;
    }
};

module.exports = {
    crearPreferencia
};
