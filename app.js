const statusText = document.getElementById('status-text');
const fetchBtn = document.getElementById('fetch-btn');

async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Pobieranie danych z Binance i generowanie analizy przez AI...";
    fetchBtn.disabled = true;
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        if (data.error) {
            statusText.innerHTML = "Status: Błąd: " + data.error;
            fetchBtn.disabled = false;
            return;
        }
        
        // Czyszczenie tekstu na wypadek gdyby AI jednak użyło formatowania markdown
        let tekstAI = data.rawText;
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
        statusText.innerHTML = "Status: Błąd podczas przetwarzania odpowiedzi formatu JSON.";
        console.error(error);
    } finally {
        fetchBtn.disabled = false;
    }
}

fetchBtn.addEventListener('click', uruchomAnalizeAI);
