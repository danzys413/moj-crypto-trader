const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja Twojego tajnego hasła do strony
const TAJNE_HASLO = "Zuzanna2019!"; // <-- WPISZ TUTAJ SWOJE HASŁO DO LOGOWANIA

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint do sprawdzania logowania
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === TAJNE_HASLO) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Błędne hasło!" });
    }
});

// Bezpieczny endpoint pośredniczący do Gemini
app.post('/api/analyze', async (req, res) => {
    try {
        // Pobieramy klucz API ze zmiennych środowiskowych serwera
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Brak skonfigurowanego klucza API na serwerze." });
        }

        // Pobieramy dane z Binance (CORS rozwiązany po stronie serwera!)
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        const klines = await binanceRes.json();

        // Przygotowanie promptu dla Gemini
        const promptText = `Przeanalizuj te dane 4H dla BTC/USDT z Binance pod kątem Price Action i EMA/RSI. Zwróć dane w formacie JSON zawierającym: ep, tp, sl, prawdopodobienstwo, uzasadnienie. Dane: ${JSON.stringify(klines)}`;

        // Zapytanie do Google Gemini
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const geminiData = await geminiRes.json();
        res.json(geminiData);

    } catch (error) {
        res.status(500).json({ error: "Błąd serwera: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
