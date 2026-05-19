const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Twoje stałe hasło dostępowe do panelu
const TAJNE_HASLO = "20021990"; 

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint logowania
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === TAJNE_HASLO) {
        return res.json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: "Błędne hasło!" });
    }
});

// Bezpieczny endpoint pośredniczący do Gemini
app.post('/api/analyze', async (req, res) => {
    try {
        // Serwer bezpiecznie pobiera nowy klucz z panelu Render
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Brak klucza API w ustawieniach Environment na Renderze!" });
        }

        // Pobieramy świeże dane rynkowe z giełdy Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        if (!binanceRes.ok) {
            return res.status(500).json({ error: "Nie udało się pobrać danych z Binance." });
        }
        const klines = await binanceRes.json();

        // Prompt strukturalny
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

        // Stabilny, oficjalny endpoint produkcyjny v1
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

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
            return res.status(500).json({ error: geminiData.error.message || "Błąd API Gemini." });
        }

        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
            return res.status(500).json({ error: "Gemini zwróciło niepełną strukturę danych." });
        }

        const tekstOdAI = geminiData.candidates[0].content.parts[0].text;
        return res.json({ success: true, rawText: tekstOdAI });

    } catch (error) {
        return res.status(500).json({ error: "Błąd serwera: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer działa poprawnie na porcie ${PORT}`);
});
