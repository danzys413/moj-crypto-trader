const statusText = document.getElementById('status-text');

async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Serwer przetwarza zapytanie i pobiera dane z giełdy...";
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        if (data.error) {
            statusText.innerHTML = "Status: Błąd: " + data.error;
            return;
        }
        
        let tekstAI = data.rawText;
        // Czyszczenie formatowania markdown, jeśli wystąpi
        tekstAI = tekstAI.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const analiza = JSON.parse(tekstAI);
        
        statusText.innerHTML = "Status: Analiza ukończona pomyślnie!";
        
        // --- STRATEGIA 1 ---
        const s1Kierunek = analiza.s1.kierunek.toUpperCase();
        const s1Color = s1Kierunek.includes('LONG') ? '#00ff88' : '#ff4444';
        const s1Emoji = s1Kierunek.includes('LONG') ? '🟢' : '🔴';
        
        document.getElementById('s1-kierunek').innerHTML = `KIERUNEK: <span style="color: ${s1Color};">${s1Kierunek} ${s1Emoji}</span>`;
        document.getElementById('s1-ep').innerText = analiza.s1.ep;
        document.getElementById('s1-tp').innerText = analiza.s1.tp;
        document.getElementById('s1-prob').innerText = analiza.s1.prawdopodobienstwo;
        document.getElementById('s1-sl').innerText = analiza.s1.sl;
        document.getElementById('s1-desc').innerText = analiza.s1.uzasadnienie;
        
        // --- STRATEGIA 2 ---
        const s2Kierunek = analiza.s2.kierunek.toUpperCase();
        const s2Color = s2Kierunek.includes('LONG') ? '#00ff88' : '#ff4444';
        const s2Emoji = s2Kierunek.includes('LONG') ? '🟢' : '🔴';
        
        document.getElementById('s2-kierunek').innerHTML = `KIERUNEK: <span style="color: ${s2Color};">${s2Kierunek} ${s2Emoji}</span>`;
        document.getElementById('s2-ep').innerText = analiza.s2.ep;
        document.getElementById('s2-tp').innerText = analiza.s2.tp;
        document.getElementById('s2-prob').innerText = analiza.s2.prawdopodobienstwo;
        document.getElementById('s2-sl').innerText = analiza.s2.sl;
        document.getElementById('s2-desc').innerText = analiza.s2.uzasadnienie;

    } catch (error) {
        statusText.innerHTML = "Status: Krytyczny błąd przetwarzania odpowiedzi strukturalnej.";
        console.error("Szczegóły:", error);
    }
}

document.getElementById('fetch-btn').addEventListener('click', uruchomAnalizeAI);
