// Wklej tutaj swój klucz API Gemini (ten zaczynający się na AIza...)
const GEMINI_API_KEY = "AIzaSyAOR6KQ9BM5cf4Of-WlnjUuZbsPsnN02W8"; 

const statusText = document.getElementById('status-text');
const fetchBtn = document.getElementById('fetch-btn');

async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Pobieranie danych z Binance za pośrednictwem serwera...";
    fetchBtn.disabled = true;
    
    try {
        // 1. Pobieramy czyste dane z giełdy przez nasz serwer na Renderze
        const response = await fetch('/api/binance-data');
        const data = await response.json();
        
        if (data.error) {
            statusText.innerHTML = "Status: Błąd Binance: " + data.error;
            fetchBtn.disabled = false;
            return;
        }

        statusText.innerHTML = "Status: Binance OK. Przesyłam dane bezpośrednio do Gemini AI...";

        const promptText = `Jesteś profesjonalnym algorytmem tradera giełdowego. Przeanalizuj poniższe świece 4H dla pary BTC/USDT.
Wytwórz dwie niezależne, logiczne analizy tradingowe:
s1: Na bazie wyłącznie reguł Price Action (wsparcia, opory, formacje świecowe).
s2: Na bazie wskaźników matematycznych (EMA, RSI).

Odpowiedź musisz zwrócić WYŁĄCZNIE jako czysty, poprawny obiekt JSON. Nie dopisuj żadnych wstępów, komentarzy, markdownu ani podsumowań. Nie używaj tagów \`\`\`json. Format odpowiedzi musi wyglądać dokładnie tak:
{
  "s1": { "kierunek": "LONG", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "75%", "sl": "cena", "uzasadnienie": "krótki opis" },
  "s2": { "kierunek": "SHORT", "ep": "cena", "tp": "cena", "prawdopodobienstwo": "60%", "sl": "cena", "uzasadnienie": "krótki opis" }
}

Oto surowe dane świec z Binance: ${JSON.stringify(data.klines)}`;

        // 2. Bezpośrednie, stabilne połączenie z Twojej przeglądarki do Google
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const geminiData = await geminiRes.json();

        if (geminiData.error) {
            statusText.innerHTML = "Status: Błąd Gemini: " + geminiData.error.message;
            fetchBtn.disabled = false;
            return;
        }

        let tekstAI = geminiData.candidates[0].content.parts[0].text;
        tekstAI = tekstAI.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const analiza = JSON.parse(tekstAI);
        statusText.innerHTML = "Status: Analiza ukończona pomyślnie!";
        
        // Strategia 1: Price Action
        const s1Kierunek = analiza.s1.kierunek.toUpperCase();
        document.getElementById('s1-kierunek').innerHTML = `KIERUNEK: <span style="color: ${s1Kierunek.includes('LONG') ? '#00ff88' : '#ff4444'};">${s1Kierunek}</span>`;
        document.getElementById('s1-ep').innerText = analiza.s1.ep;
        document.getElementById('s1-tp').innerText = analiza.s1.tp;
        document.getElementById('s1-prob').innerText = analiza.s1.prawdopodobienstwo;
        document.getElementById('s1-sl').innerText = analiza.s1.sl;
        document.getElementById('s1-desc').innerText = analiza.s1.uzasadnienie;
        
        // Strategia 2: Wskaźniki
        const s2Kierunek = analiza.s2.kierunek.toUpperCase();
        document.getElementById('s2-kierunek').innerHTML = `KIERUNEK: <span style="color: ${s2Kierunek.includes('LONG') ? '#00ff88' : '#ff4444'};">${s2Kierunek}</span>`;
        document.getElementById('s2-ep').innerText = analiza.s2.ep;
        document.getElementById('s2-tp').innerText = analiza.s2.tp;
        document.getElementById('s2-prob').innerText = analiza.s2.prawdopodobienstwo;
        document.getElementById('s2-sl').innerText = analiza.s2.sl;
        document.getElementById('s2-desc').innerText = analiza.s2.uzasadnienie;

    } catch (error) {
        statusText.innerHTML = "Status: Błąd podczas przetwarzania danych.";
        console.error(error);
    } finally {
        fetchBtn.disabled = false;
    }
}

fetchBtn.addEventListener('click', uruchomAnalizeAI);
