const fetchBtn = document.getElementById('fetch-btn');
const statusText = document.getElementById('status-text');

// Strategia 1 (Price Action)
const s1_dir = document.querySelector('.signal-box:not(.strategy-2) .direction-badge');
const s1_ep = document.querySelector('.signal-box:not(.strategy-2) p:nth-of-type(2)');
const s1_tp = document.querySelector('.signal-box:not(.strategy-2) p:nth-of-type(3)');
const s1_prob = document.querySelector('.signal-box:not(.strategy-2) p:nth-of-type(4)');
const s1_sl = document.querySelector('.signal-box:not(.strategy-2) p:nth-of-type(5)');
const s1_reason = document.querySelector('.signal-box:not(.strategy-2) p:nth-of-type(6)');

// Strategia 2 (EMA + RSI)
const s2_dir = document.querySelector('.strategy-2 .direction-badge');
const s2_ep = document.querySelector('.strategy-2 p:nth-of-type(2)');
const s2_tp = document.querySelector('.strategy-2 p:nth-of-type(3)');
const s2_prob = document.querySelector('.strategy-2 p:nth-of-type(4)');
const s2_sl = document.querySelector('.strategy-2 p:nth-of-type(5)');
const s2_reason = document.querySelector('.strategy-2 p:nth-of-type(6)');

const GEMINI_API_KEY = "AIzaSyB8SVyocN_R-dZ8Lx4e-9lIZJfchqzfO7I";

async function uruchomAnalizeAI() {
    statusText.innerText = "Status: Pobieranie świeżych danych z Binance...";
    
    const binanceUrl = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=20';

    try {
        const responseBinance = await fetch(binanceUrl);
        const candleData = await responseBinance.json();
        
        const sformatowanyWykres = candleData.map(c => {
            return `Open: ${parseFloat(c[1])}, High: ${parseFloat(c[2])}, Low: ${parseFloat(c[3])}, Close: ${parseFloat(c[4])}`;
        }).join('\n');

        const aktualnaCena = parseFloat(candleData[candleData.length - 1][4]).toFixed(2);
        statusText.innerText = `Status: AI kalkuluje kierunki pozycji dla ceny $${aktualnaCena}...`;

        const promptText = `Jesteś profesjonalnym systemem transakcyjnym. Przeanalizuj 20 świec 4H dla BTC/USDT. Aktualna cena: $${aktualnaCena}.
Dane:
${sformatowanyWykres}

Zadanie:
Wyznacz niezależne sygnały dla dwóch strategii:
1. Price Action (wsparcie/opór/świece).
2. Matematyczna (EMA/RSI).

Dla każdej strategii MUSISZ określić kierunek pozycji ("LONG" jeśli przewidujesz wzrosty, "SHORT" jeśli przewidujesz spadki).

Zwróć WYŁĄCZNIE czysty JSON dopasowany do schematu:
{
  "s1": { "kierunek": "LONG lub SHORT", "ep": "...", "tp": "...", "sl": "...", "prawdopodobienstwo": "liczba 1-100", "uzasadnienie": "max 2 zdania" },
  "s2": { "kierunek": "LONG lub SHORT", "ep": "...", "tp": "...", "sl": "...", "prawdopodobienstwo": "liczba 1-100", "uzasadnienie": "max 2 zdania" }
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const responseGemini = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const geminiData = await responseGemini.json();
        const aiResponseText = geminiData.candidates[0].content.parts[0].text;
        const analiza = JSON.parse(aiResponseText);

        statusText.innerText = `Status: Analiza ukończona pomyślnie dla $${aktualnaCena}!`;
        
        // Wyświetlanie Strategii 1
        const kolorS1 = analiza.s1.kierunek === 'LONG' ? '#00ff88' : '#ff4444';
        s1_dir.innerHTML = `KIERUNEK: <span style="color: ${kolorS1};">${analiza.s1.kierunek} ${analiza.s1.kierunek === 'LONG' ? '🟢' : '🔴'}</span>`;
        s1_ep.innerHTML = `<strong>EP (Entry Price):</strong> ${analiza.s1.ep}`;
        s1_tp.innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s1.tp}`;
        s1_prob.innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color:#00ff88; font-weight:bold;">${analiza.s1.prawdopodobienstwo}%</span>`;
        s1_sl.innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s1.sl}`;
        s1_reason.innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s1.uzasadnienie}`;

        // Wyświetlanie Strategii 2
        const kolorS2 = analiza.s2.kierunek === 'LONG' ? '#00ff88' : '#ff4444';
        s2_dir.innerHTML = `KIERUNEK: <span style="color: ${kolorS2};">${analiza.s2.kierunek} ${analiza.s2.kierunek === 'LONG' ? '🟢' : '🔴'}</span>`;
        s2_ep.innerHTML = `<strong>EP (Entry Price):</strong> ${analiza.s2.ep}`;
        s2_tp.innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s2.tp}`;
        s2_prob.innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color:#00bcff; font-weight:bold;">${analiza.s2.prawdopodobienstwo}%</span>`;
        s2_sl.innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s2.sl}`;
        s2_reason.innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s2.uzasadnienie}`;

    } catch (error) {
        statusText.innerText = "Status: Krytyczny błąd systemu!";
        console.error(error);
    }
}

fetchBtn.addEventListener('click', uruchomAnalizeAI);