// controllers/mercado_pago.controller.js
const modelMP = require('../models/mercado_pago.model');

const val = (req, res) => {
    res.send('Hola desde vista MP');
}

const proccesPay = async (req, res) => {
    try {
        // DESEMPAQUETAMOS los datos que vienen de Angular
        const data = req.body;
        // data trae: { title, price, name, lastname, email, idUser }

        // Se los pasamos a la función del modelo
        const preferences = await modelMP.crearPreferencia(data);

        res.json(preferences);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error al crear preferencia");
    }
}

module.exports = {
    val,
    proccesPay,
}