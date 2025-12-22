const express = require('express');
const router = express.Router();

const controller = require('../controllers/mercado_pago.controller');


router.get('/', controller.val);
router.post('/proccesPay', controller.proccesPay);


module.exports = router;