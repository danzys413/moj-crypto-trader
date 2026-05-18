const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja Twojego tajnego hasła do strony
const TAJNE_HASLO = "20021990"; 

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint logowania
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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Brak skonfigurowanego klucza API na serwerze." });
        }

        // Pobieramy dane z Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        const klines = await binanceRes.json();

        // Rygorystyczny prompt strukturalny - wymusza czysty format JSON bez dodatkowego tekstu
        const promptText = `Jesteś profesjonalnym algorytmem tradera. Przeanalizuj poniższe świece 4H dla BTC/USDT.
Wytwórz dwie niezależne analizy:
s1: Na bazie wyłącznie Price Action (wsparcia, opory, formacje świecowe).
s2: Na bazie wskaźników matematycznych (EMA, RSI).

Zwróć odpowiedź WYŁĄCZNIE jako czysty obiekt JSON, bez żadnego dodatkowego tekstu, bez owijania w markdown \`\`\`json. Format ma być dokładnie taki:
{
  "s1": { "kierunek": "LONG", "ep": "cena", "tp": "cena", "prawdopodobienstwo": 75, "sl": "cena", "uzasadnienie": "krótki opis" },
  "s2": { "kierunek": "SHORT", "ep": "cena", "tp": "cena", "prawdopodobienstwo": 60, "sl": "cena", "uzasadnienie": "krótki opis" }
}

Oto dane z giełdy: ${JSON.stringify(klines)}`;

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
