const express = require('express');
const path = require('path');
// Zmiana importu na oficjalny standard GoogleGenAI
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/analyze', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Brak klucza API (GEMINI_API_KEY) w Environment na Renderze!" });
        }

        // 1. Pobieranie danych rynkowych z Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20');
        if (!binanceRes.ok) {
            return res.status(500).json({ error: "Nie udało się pobrać danych z giełdy Binance." });
        }
        const klines = await binanceRes.json();

        // 2. POPRAWIONA INICJALIZACJA API GOOGLE
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        // 3. Wywołanie modelu
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const responseText = response.text();
        
        return res.json({ success: true, rawText: responseText });

    } catch (error) {
        console.error("Błąd serwera:", error);
        return res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer wystartował poprawnie na porcie ${PORT}`);
});
