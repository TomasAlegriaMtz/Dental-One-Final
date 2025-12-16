const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const User = require('./models/users'); 
const PatientDetails = require('./models/patientDetails');
const MedicalHistory = require('./models/medicalHistory');
const Appointment = require('./models/scheduling');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');

// NOTA: Asegúrate de que la ruta './google-calendar-key.json' sea correcta 
// relativa a donde ejecutas el servidor.
const auth = new google.auth.GoogleAuth({
    keyFile: './google-calendar-prueba.json', // Ruta a tu archivo descargado
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });



const app = express();
const port = 3000;

// Configuración de Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Conexión a MongoDB
const dbURI = 'mongodb+srv://thalberto04_db_user:gKi9XhsI1E5oaO0G@dental-one.9lvmct8.mongodb.net/?appName=Dental-One';
mongoose.connect(dbURI)
    .then(() => {
        app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
        });
    })
    .catch((err) => console.log('Error de conexión a MongoDB:', err));

const jwtSecret = 'nocequevergudap0neRLaf00ck*inNetayacAlLeseALVcachetes23323';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ msg: 'No autorizado, no hay token.' });
    }
    try {
        const decoded = jwt.verify(token, jwtSecret); 
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token no válido.' });
    }
};


app.post('/api/register', async (req, res) => {
    try {
        const { nombre, apellidos, email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ msg: 'El email ya está registrado.' });
        }

        user = new User({ nombre, apellidos, email, password });
        await user.save();

        const payload = {
            user: {
                id: user._id,
                email: user.email
            }
        };

        jwt.sign(
            payload, 
            jwtSecret,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('Error al firmar JWT:', err);
                    return res.status(500).json({ msg: 'Error al generar token.' });
                }
                
                res.status(201).json({ 
                    msg: 'Registro exitoso.', 
                    token: token, 
                    userId: user._id 
                });
            }
        );

    } catch (err) {
        console.error('Error al registrar usuario:', err.message);
        res.status(500).json({ msg: 'Error interno del servidor al registrar.' });
    }
});


app.post('/api/register/patientDetails', async (req, res) => {
    try {
        const {
            email,
            nombre,
            apep,
            apem,
            direccion,
            cp,
            telCasa,
            numcel,
            escolaridad,
            edoCivil,
            estatura,
            peso,
            nacimiento,
            genero
        } = req.body;

        //Verificar si el usuario existe para obtener su ID
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'Usuario principal no encontrado. No se pueden registrar los detalles.' });
        }

        const existingDetails = await PatientDetails.findOne({ user: user._id });
        if (existingDetails) {
            return res.status(409).json({ msg: 'Este usuario ya tiene un registro de detalles de paciente asociado.' });
        }
        const patientDetails = new PatientDetails({
            user: user._id,
            email, 
            nombre,
            apep,
            apem,
            direccion,
            cp,
            telCasa,
            numcel,
            escolaridad,
            edoCivil,
            estatura,
            peso,
            nacimiento,
            genero
        });

        await patientDetails.save();

        res.status(201).json({ 
            msg: 'Detalles del paciente registrados y enlazados exitosamente.', 
            patientDetails: patientDetails // Devuelve el documento guardado
        });

    } catch (err) {
        
        console.error('Error al registrar los datos del paciente:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: 'Error de validación de datos', errors: messages });
        }

        res.status(500).json({ msg: 'Error interno del servidor al registrar los Details.' });
    }
});

app.post('/api/register/histo', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        const{
            salud,
            padecimiento,
            fiebreReumatica,
            enfermedadesCardiovasculares,
            mareos, 
            diabetes,
            hepatitis,
            vih,
            artritis,
            gastritis,
            renales,
            anemia,
            presionArterial,
            sangradoAnormal,
            moretones,
            transfusiones,
            tratamientosPrevios,
            tratamientoMedicoActual,
            tomandoMedicamento,
            alergicoMedicamento,
            adiccion,
            fuma,
            enfermedadNoMencionada,
            embarazo, 
            problemaHormonal
        } = req.body;
        const patientHisto = new MedicalHistory({
            user: userId,
            salud,
            padecimiento,
            fiebreReumatica,
            enfermedadesCardiovasculares,
            mareos,
            diabetes,
            hepatitis,
            vih,
            artritis,
            gastritis,
            renales,
            anemia,
            presionArterial,
            sangradoAnormal,
            moretones,
            transfusiones,
            tratamientosPrevios,
            tratamientoMedicoActual,
            tomandoMedicamento,
            alergicoMedicamento,
            adiccion,
            fuma,
            enfermedadNoMencionada,
            embarazo,
            problemaHormonal
        });

        await patientHisto.save();
        const user = await User.findById(userId).select('-password');//todo lo del usuario menos el password
        res.status(201).json({ 
            msg: 'Historial clinico del paciente guardado exitosamente.', 
            user: user
        });
        
    } catch(err){
        console.error('Error al guardar el historial clinico del paciente', err);
        res.status(500).json({msg: 'Error interno del servidor'});
    }
});


//Appointments -----------------------------------------------------------------------------------------------------------------
app.post('/api/register/appointment', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Desestructuración de datos recibidos del Front
        let {
            dateTime,
            hour,
            durationMinutes,
            patientName,
            patientId,
            contactNumber,
            email,
            reason,
            providerName,
            status,
            notes
        } = req.body;

        // 2. Lógica para vincular paciente (si existe)
        let finalPatientId = patientId;
        if (!finalPatientId && email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) finalPatientId = existingUser._id;
        }

        // =================================================================================
        // 🛡️ BLOQUE DE VALIDACIÓN DE HORARIO (Anti-solapamiento)
        // =================================================================================
        
        // A. Preparamos las fechas de inicio y fin de la NUEVA cita
        // Convertimos dateTime a string YYYY-MM-DD para evitar problemas de zona horaria al combinar
        const dateOnlyString = new Date(dateTime).toISOString().split('T')[0]; 
        
        // Creamos la fecha exacta de inicio combinando fecha + hora seleccionada
        const newStart = new Date(`${dateOnlyString}T${hour}:00`); 
        // Calculamos la fecha exacta de fin sumando los minutos de duración
        const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

        // B. Buscamos citas existentes ese mismo día para ese doctor
        const startOfDay = new Date(dateOnlyString);
        const endOfDay = new Date(dateOnlyString);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
            providerName: providerName,       // Solo checamos el doctor seleccionado
            status: { $ne: 'Canceled' },      // Ignoramos citas canceladas
            dateTime: {                       // Filtramos por el rango del día
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // C. Verificamos si hay choque matemático
        const conflict = existingAppointments.find(app => {
            // Reconstruimos el inicio y fin de la cita guardada en BD
            const appDateStr = new Date(app.dateTime).toISOString().split('T')[0];
            const appStart = new Date(`${appDateStr}T${app.hour}:00`);
            const appEnd = new Date(appStart.getTime() + app.durationMinutes * 60000);

            // FÓRMULA DE COLISIÓN:
            // (NuevaEmpieza < ViejaTermina) Y (NuevaTermina > ViejaEmpieza)
            return (newStart < appEnd && newEnd > appStart);
        });

        // D. Si hay conflicto, devolvemos error 409 y PARAMOS la ejecución
        if (conflict) {
            return res.status(409).json({ 
                msg: `El especialista ${providerName} ya tiene una cita ocupada a las ${conflict.hour}. Por favor selecciona otro horario.` 
            });
        }
        // =================================================================================
        // 🏁 FIN VALIDACIÓN - SI LLEGA AQUÍ, EL HORARIO ESTÁ LIBRE
        // =================================================================================

        // 3. Crear la instancia del modelo
        const newAppointment = new Appointment({
            user: userId,
            dateTime, // Guardamos la fecha base
            hour,     // Guardamos la hora string
            durationMinutes,
            patientName,
            patientId: finalPatientId,
            contactNumber,
            email,
            reason,
            providerName,
            status: status || 'Scheduled',
            notes
        });

        // 4. Guardar en MongoDB
        await newAppointment.save();

        // 5. Integración Google Calendar
        try {
            // Reutilizamos newStart y newEnd calculados arriba
            const event = {
                summary: `Cita: ${patientName}`,
                description: `Motivo: ${reason}\nDoctor: ${providerName}\nNotas: ${notes || 'Ninguna'}`,
                start: {
                    dateTime: newStart.toISOString(),
                    timeZone: 'America/Mexico_City',
                },
                end: {
                    dateTime: newEnd.toISOString(),
                    timeZone: 'America/Mexico_City',
                },
            };

            // Asegúrate de que 'calendar' esté configurado e importado al inicio de tu archivo
            await calendar.events.insert({
                calendarId: '40e6ec70fd4ef4b7c0703080621d41963c106526d7a02a9026149384e3105910@group.calendar.google.com', 
                resource: event,
            });

            console.log('✅ Evento creado en Google Calendar');

        } catch (googleError) {
            // No detenemos el request si falla Google, solo logueamos
            console.error('❌ Error creando evento en Google:', googleError);
        }
        
        // 6. Respuesta Final Exitosa
        res.status(201).json({ 
            msg: 'Cita registrada exitosamente.', 
            appointment: newAppointment 
        });

    } catch (err) {
        console.error('Error al registrar la cita:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: 'Error de validación', errors: messages });
        }
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});
app.get('/api/user/appointment', authMiddleware, async (req,res) =>{
    try{
        const userId = req.user.id;

        const appointments = await Appointment.find({user: userId})
        res.json(appointments);
    }catch{
        console.error(err.message);
        res.status(500).send('Error del servidor al obtener citas');
    }

});
// Obtener TODAS las citas (Solo para Admins)
app.get('/api/admin/appointments', authMiddleware, async (req, res) => {
    try {
        // 1. Verificar si es admin (El rol viene del token en authMiddleware)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de administrador.' });
        }

        // 2. Traer TODAS las citas de la colección (sin filtro de usuario)
        const appointments = await Appointment.find({});
        
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener citas globales');
    }
});
//--------------------------------------------------------------------------------------------------------------------------------------
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        res.status(200).json(user);

    } catch (err) {
        console.error('Error al obtener el perfil:', err.message);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});



app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // 1. Primero verificamos si el usuario existe
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // 2. Verificamos la contraseña
        const isPassword = await bcrypt.compare(password, user.password);
        if (!isPassword) {
            return res.status(400).json({ msg: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 3. Buscamos los detalles adicionales
        const pDetails = await PatientDetails.findOne({ user: user._id });

        // 4. Construimos el Payload (Incluimos el ROL aquí para seguridad del backend)
        const payload = {
            user: {
                id: user._id,
                email: user.email,
                role: user.role // <--- NUEVO: El rol viaja dentro del token encriptado
            }
        };

        jwt.sign(
            payload,
            jwtSecret, 
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                
                // 5. Respondemos al Frontend
                res.json({
                    msg: 'Inicio de sesion exitoso',
                    token: token,
                    userId: user._id,
                    nombre: user.nombre,
                    numcel: pDetails?.numcel || null,
                    email: user.email,
                    role: user.role // <--- NUEVO: Enviamos el rol explícito para que Angular lo use fácil
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});



//google sign-in
app.post('/api/login', (req, res) => {
    console.log('Token recibido. Se intentará redirigir:', req.body.token);
    googleLogIn(req, res);
});
async function googleLogIn(req, res){
    console.log
    try{
        const ticket = await client.verifyIdToken({
            idToken: req.body.token,
            audience: '305375866482-j66uhnuh0t4hjk67bb7dd2js5glqn6hg.apps.googleusercontent.com'
        });

        //extraemos los datos seguros
        const payloadG = ticket.getPayload();

        const email = payloadG.email;

        const user = await User.findOne({email}).select('-password');
        if(user){
            const payload = {
                user: {
                    id: user._id,
                    email: user.email
                }
            };
            jwt.sign(
                payload,
                jwtSecret,
                {expiresIn: '1h'},
                (err, token) => {
                    if(err) throw err;
                    res.json({
                        msg: 'Inicio de sesion exitoso',
                        token: token,
                        user: user
                    });
                }
            );
        }
        else{
            return res.status(404).json({ 
                msg: 'El usuario no está registrado',
                needRegister: true, // Una bandera útil para tu frontend
                prefillData: {      // Datos útiles para el registro
                    email: userEmail,
                    name: payloadG.name,
                    picture: payloadG.picture
                }
            });
        }
    }
    catch (err){
        res.status(401).json({ message: "Token inválido" });
    }
}