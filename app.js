const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

// Configurazione database SQLite
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        appointment_date TEXT,
	appointment_time TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Visualizzare le pagine HTML

app.get('/', (req, res) => {
    res.sendFile('https://mazz19.github.io/prenotazionibot//index.html');
});

app.get('/register', (req, res) => {
    res.sendFile('https://mazz19.github.io/prenotazionibot//register.html');
});

app.get('/login', (req, res) => {
    res.sendFile('https://mazz19.github.io/prenotazionibot//login.html');
});

app.get('/forgot-password', (req, res) => {
    res.sendFile('https://mazz19.github.io/prenotazionibot//forgot-password.html');
});

app.get('/appointment', (req, res) => {
    if (req.cookies.user) {
        res.sendFile('https://mazz19.github.io/prenotazionibot//appointment.html');
    } else {
        res.redirect('/login');
    }
});

// Registrazione
app.post('/register', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.send('Le password non corrispondono.');
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], (err) => {
        if (err) {
            return res.send('Errore nella registrazione.');
        }
        res.redirect('/login');
    });
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.send('Email o password non corretti.');
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return res.send('Email o password non corretti.');
        }
        res.cookie('user', user.id);
        res.redirect('/appointment');
    });
});

// Prenotazione appuntamento con data e orario
app.post('/appointment', (req, res) => {
    const { appointment_date, appointment_time } = req.body;
    const userId = req.cookies.user;

    // Controllo se l'utente è autenticato
    if (!userId) {
        return res.status(401).send('Non autenticato.');
    }

    // Controlla se c'è già una prenotazione per quell'ora e quella data
    db.get(`SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ?`, 
        [appointment_date, appointment_time], (err, row) => {
        if (err) {
            console.error('Errore nella query di selezione:', err.message);
            return res.send('Errore durante la prenotazione.');
        }

        if (row) {
            return res.send('Questo orario è già stato prenotato.');
        }

        // Inserisci l'appuntamento nel database
        db.run(`INSERT INTO appointments (user_id, appointment_date, appointment_time) VALUES (?, ?, ?)`, 
            [userId, appointment_date, appointment_time], function(err) {
            if (err) {
                console.error('Errore durante l\'inserimento:', err.message);
                return res.send('Errore durante la prenotazione.');
            }
            res.send('Appuntamento prenotato con successo!');
        });
    });
});

// API per ottenere gli appuntamenti dell'utente loggato, con data e orario
app.get('/api/appointments', (req, res) => {
    const userId = req.cookies.user;
    if (!userId) {
        return res.status(401).json({ message: 'Non autenticato' });
    }

    db.all(`SELECT appointment_date, appointment_time FROM appointments WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel recupero degli appuntamenti.' });
        }

        const appointments = rows.map(row => ({
            title: `Appuntamento alle ${row.appointment_time}`,
            start: `${row.appointment_date}T${row.appointment_time}:00`
        }));

        res.json(appointments);
    });
});

// Pagina calendario
app.get('/calendar', (req, res) => {
    if (req.cookies.user) {
        res.sendFile(__dirname + '/views/calendar.html');
    } else {
        res.redirect('/login');
    }
});


// Gestione password dimenticata
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.send('Email non trovata.');
        }

        // Invio email per resettare la password (mock)
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'youremail@gmail.com',
                pass: 'Your-PAssword',
            },
        });

        const resetLink = `http://localhost:3000/reset-password?email=${email}`;
        let mailOptions = {
            from: 'youremail@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `Clicca qui per resettare la tua password: ${resetLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.send('Errore durante l\'invio dell\'email.');
            }
            res.send('Email inviata con successo.');
        });
    });
});

// Endpoint per il logout
app.post('/logout', (req, res) => {
    res.clearCookie('user'); // Cancella il cookie di sessione
    res.redirect('/login'); // Reindirizza alla pagina di login
});


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});
