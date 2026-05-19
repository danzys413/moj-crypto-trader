const loginContainer = document.getElementById('login-container');
const mainLayout = document.getElementById('main-layout');
const statusText = document.getElementById('status-text');

// Twoje zapisane hasło do automatycznego logowania
const MOJE_HASLO = "20021990";

// Funkcja logująca użytkownika na serwerze
async function zaloguj(wymuszoneHaslo = null) {
    const passwordInput = wymuszoneHaslo || document.getElementById('server-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordInput })
        });
        
        const data = await response.json();
        if (data.success) {
            sessionStorage.setItem('isLogged', 'true');
            weryfikujDostep();
        } else {
            if (!wymuszoneHaslo) alert('Niepoprawne hasło!');
        }
    } catch (e) {
        console.error('Błąd połączenia podczas logowania:', e);
    }
}

// Funkcja zarządzająca widocznością paneli
function weryfikujDostep() {
    if (sessionStorage.getItem('isLogged') === 'true') {
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'flex';
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (mainLayout) mainLayout.style.display = 'none';
        // Automatyczne wywołanie logowania Twoim hasłem
        zaloguj(MOJE_HASLO);
    }
}

// Uruchomienie procedury sprawdzania dostępu na starcie
weryfikujDostep();

// Funkcja pobierania analizy tradingowej z serwera
async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Serwer przetwarza zapytanie i pobiera dane z giełdy...";
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        if (data.error) {
            statusText.innerHTML = "Status: Błąd: " + data.error;
            return;
        }
        
        // Czyszczenie tekstu z ewentualnych znaczników markdownu, jeśli AI je dodało
        let tekstAI = data.rawText;
        tekstAI = tekstAI.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Przekształcenie tekstu na obiekt JSON
        const analiza = JSON.parse(tekstAI);
        
        statusText.innerHTML = "Status: Analiza ukończona pomyślnie!";
        
        // --- ODŚWIEŻENIE STRATEGII 1 (PRICE ACTION) ---
        const s1Kierunek = analiza.s1.kierunek.toUpperCase();
        const s1Color = s1Kierunek.includes('LONG') ? '#00ff88' : '#ff4444';
        const s1Emoji = s1Kierunek.includes('LONG') ? '🟢' : '🔴';
        
        document.getElementById('s1-kierunek').innerHTML = `KIERUNEK: <span style="color: ${s1Color};">${s1Kierunek} ${s1Emoji}</span>`;
        document.getElementById('s1-ep').innerText = analiza.s1.ep;
        document.getElementById('s1-tp').innerText = analiza.s1.tp;
        document.getElementById('s1-prob').innerText = analiza.s1.prawdopodobienstwo;
        document.getElementById('s1-sl').innerText = analiza.s1.sl;
        document.getElementById('s1-desc').innerText = analiza.s1.uzasadnienie;
        
        // --- ODŚWIEŻENIE STRATEGII 2 (MATEMATYCZNA) ---
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
        statusText.innerHTML = "Status: Błąd parsowania struktury danych JSON.";
        console.error("Szczegóły błędu:", error);
    }
}

// Rejestracja kliknięcia w przycisk generowania
document.getElementById('fetch-btn').addEventListener('click', uruchomAnalizeAI);

// Możliwość ręcznego wpisania i zatwierdzenia hasła enterem
document.getElementById('server-password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        zaloguj();
    }
});
