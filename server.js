const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Twoje stałe hasło dostępowe
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
            return res.status(500).json({ error: "Brak skonfigurowanego klucza API (GEMINI_API_KEY) w panelu Render." });
        }

        // Pobieramy świeże dane rynkowe z giełdy Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        if (!binanceRes.ok) {
            return res.status(500).json({ error: "Błąd podczas pobierania danych z giełdy Binance." });
        }
        const klines = await binanceRes.json();

        // Rygorystyczny prompt wymuszający strukturę i brak zbędnych tekstów od AI
        const promptText = `Jesteś profesjonalnym algorytmem tradera giełdowego. Przeanalizuj poniższe świece 4H dla pary BTC/USDT.
Wytwórz dwie niezależne, logiczne analizy tradingowe:
s1: Na bazie wyłącznie reguł Price Action (wsparcia, opory, formacje świecowe).
s2: Na bazie wskaźników matematycznych (EMA, RSI).

Odpowiedź musisz zwrócić WYŁĄCZNIE jako czysty, poprawny obiekt JSON. Nie dopisuj żadnych wstępów, komentarzy ani podsumowań. Nie używaj tagów \`\`\`json. Format odpowiedzi musi wyglądać dokładnie tak:
{
  "s1": { "kierunek": "LONG", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "75%", "sl": "cena", "uzasadnienie": "krótki opis" },
  "s2": { "kierunek": "SHORT", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "60%", "sl": "cena", "uzasadnienie": "krótki opis" }
}

Oto surowe dane świec z Binance: ${JSON.stringify(klines)}`;

        // Stabilny i sprawdzony endpoint URL dla modelu gemini-pro
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

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
            return res.status(500).json({ error: geminiData.error.message || "Błąd wewnętrzny API Gemini." });
        }

        // Sprawdzamy czy struktura odpowiedzi z Gemini jest poprawna
        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
            return res.status(500).json({ error: "Gemini nie zwróciło poprawnej odpowiedzi. Spróbuj ponownie." });
        }

        const tekstOdAI = geminiData.candidates[0].content.parts[0].text;
        res.json({ success: true, rawText: tekstOdAI });

    } catch (error) {
        res.status(500).json({ error: "Błąd serwera: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer wystartował poprawnie na porcie ${PORT}`);
});
