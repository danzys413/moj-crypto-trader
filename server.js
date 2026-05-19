const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja Twojego tajnego hasła do strony
const TAJNE_HASLO = "TwojeHaslo123"; 

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
            return res.status(500).json({ error: "Brak skonfigurowanego klucza API na serwerze (GEMINI_API_KEY)." });
        }

        // Pobieramy dane z Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        if (!binanceRes.ok) {
            return res.status(500).json({ error: "Nie udało się pobrać danych z Binance." });
        }
        const klines = await binanceRes.json();

        // Rygorystyczny prompt strukturalny
        const promptText = `Jesteś profesjonalnym algorytmem tradera. Przeanalizuj poniższe świece 4H dla BTC/USDT.
Wytwórz dwie niezależne analizy tradingowe:
s1: Na bazie wyłącznie Price Action (wsparcia, opory, formacje świecowe).
s2: Na bazie wskaźników matematycznych (EMA, RSI).

Zwróć odpowiedź WYŁĄCZNIE jako czysty, poprawny obiekt JSON, bez żadnego dodatkowego tekstu, wstępów czy podsumowań. Nie używaj znaczników \`\`\`json \`\`\`. Format ma być dokładnie taki:
{
  "s1": { "kierunek": "LONG", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "75%", "sl": "cena", "uzasadnienie": "krótki opis" },
  "s2": { "kierunek": "SHORT", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "60%", "sl": "cena", "uzasadnienie": "krótki opis" }
}

Oto dane świec z giełdy: ${JSON.stringify(klines)}`;

        // Oficjalny endpoint URL dla modelu gemini-1.5-flash (stabilny i szybki strukturalnie)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const geminiData = await geminiRes.json();

        if (geminiData.error) {
            return res.status(500).json({ error: geminiData.error.message || "Błąd API Gemini" });
        }

        // Wyciągamy wygenerowany tekst i wysyłamy go na front
        const tekstOdAI = geminiData.candidates[0].content.parts[0].text;
        res.json({ success: true, rawText: tekstOdAI });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
