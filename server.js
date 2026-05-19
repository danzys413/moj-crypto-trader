const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/analyze', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Brak klucza API w ustawieniach Environment na Renderze!" });
        }

        // 1. Pobieranie danych rynkowych z Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        if (!binanceRes.ok) {
            return res.status(500).json({ error: "Nie udało się pobrać danych z giełdy Binance." });
        }
        const klines = await binanceRes.json();

        const promptText = `Jesteś profesjonalnym algorytmem tradera giełdowego. Przeanalizuj poniższe świece 4H dla pary BTC/USDT.
Wytwórz dwie niezależne, logiczne analizy tradingowe:
s1: Na bazie wyłącznie reguł Price Action (wsparcia, opory, formacje świecowe).
s2: Na bazie wskaźników matematycznych (EMA, RSI).

Odpowiedź musisz zwrócić WYŁĄCZNIE jako czysty, poprawny obiekt JSON. Nie dopisuj żadnych wstępów, komentarzy, markdownu ani podsumowań. Nie używaj tagów \`\`\`json. Format odpowiedzi musi wyglądać dokładnie tak:
{
  "s1": { "kierunek": "LONG", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "75%", "sl": "cena", "uzasadnienie": "krótki opis" },
  "s2": { "kierunek": "SHORT", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "60%", "sl": "cena", "uzasadnienie": "krótki opis" }
}

Oto surowe dane świec z Binance: ${JSON.stringify(klines)}`;

        // Stabilny, produkcyjny url v1 z modelem bazowym gemini-pro (najbardziej bezawaryjny na serwerach cloud)
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

        // Bezpieczne sprawdzanie błędów z Google, zapobiegające wyświetlaniu [object Object]
        if (geminiData.error) {
            const errorMsg = geminiData.error.message || JSON.stringify(geminiData.error);
            return res.status(500).json({ error: `Błąd Google API: ${errorMsg}` });
        }

        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
            return res.status(500).json({ error: "Model zwrócił pustą odpowiedź lub został zablokowany." });
        }

        const tekstOdAI = geminiData.candidates[0].content.parts[0].text;
        return res.json({ success: true, rawText: tekstOdAI });

    } catch (error) {
        console.error("Błąd serwera:", error);
        return res.status(500).json({ error: error.message || "Nieznany błąd serwera." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
