const loginContainer = document.getElementById('login-container');
const mainLayout = document.getElementById('main-layout');
const statusText = document.getElementById('status-text');

// Obsługa logowania na serwerze
async function zaloguj() {
    const passwordInput = document.getElementById('server-password').value;
    
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
            alert('Niepoprawne hasło!');
        }
    } catch (e) {
        alert('Błąd połączenia z serwerem logowania');
    }
}

// Funkcja sprawdzająca czy użytkownik jest zalogowany
function weryfikujDostep() {
    if (sessionStorage.getItem('isLogged') === 'true') {
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'flex';
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (mainLayout) mainLayout.style.display = 'none';
    }
}

// Uruchomienie weryfikacji od razu na starcie
weryfikujDostep();

// Główna funkcja analizy pobierająca dane przez nasz serwer
async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Serwer przetwarza zapytanie i pobiera dane z giełdy...";
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        if (data.error) {
            statusText.innerHTML = "Status: Serwer zgłosił błąd: " + data.error;
            return;
        }
        
        // Wyciągamy surowy tekst od Gemini
        let aiResponseText = data.candidates[0].content.parts[0].text;
        
        // Pancerne czyszczenie odpowiedzi ze znaczników markdown
        aiResponseText = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Konwertujemy bezpiecznie na obiekt JavaScript
        const analiza = JSON.parse(aiResponseText);
        
        statusText.innerHTML = "Status: Analiza ukończona pomyślnie!";
        
        // --- STRATEGIA 1: PRICE ACTION ---
        const s1Box = document.querySelector('.signal-box:not(.strategy-2)');
        const s1Kierunek = analiza.s1.kierunek.toUpperCase();
        const s1Color = s1Kierunek.includes('LONG') ? '#00ff88' : '#ff4444';
        const s1Emoji = s1Kierunek.includes('LONG') ? '🟢' : '🔴';
        
        s1Box.querySelector('.direction-badge').innerHTML = `KIERUNEK: <span style="color: ${s1Color};">${s1Kierunek} ${s1Emoji}</span>`;
        s1Box.querySelectorAll('p')[1].innerHTML = `<strong>EP (Entry Price):</strong> $${analiza.s1.ep}`;
        s1Box.querySelectorAll('p')[2].innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s1.tp}`;
        s1Box.querySelectorAll('p')[3].innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color: #00ff88; font-weight: bold;">${analiza.s1.prawdopodobienstwo}%</span>`;
        s1Box.querySelectorAll('p')[4].innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s1.sl}`;
        s1Box.querySelectorAll('p')[5].innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s1.uzasadnienie}`;
        
        // --- STRATEGIA 2: MATEMATYCZNA (EMA/RSI) ---
        const s2Box = document.querySelector('.strategy-2');
        const s2Kierunek = analiza.s2.kierunek.toUpperCase();
        const s2Color = s2Kierunek.includes('LONG') ? '#00ff88' : '#ff4444';
        const s2Emoji = s2Kierunek.includes('LONG') ? '🟢' : '🔴';
        
        s2Box.querySelector('.direction-badge').innerHTML = `KIERUNEK: <span style="color: ${s2Color};">${s2Kierunek} ${s2Emoji}</span>`;
        s2Box.querySelectorAll('p')[1].innerHTML = `<strong>EP (Entry Price):</strong> $${analiza.s2.ep}`;
        s2Box.querySelectorAll('p')[2].innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s2.tp}`;
        s2Box.querySelectorAll('p')[3].innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color: #00bcff; font-weight: bold;">${analiza.s2.prawdopodobienstwo}%</span>`;
        s2Box.querySelectorAll('p')[4].innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s2.sl}`;
        s2Box.querySelectorAll('p')[5].innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s2.uzasadnienie}`;

    } catch (error) {
        statusText.innerHTML = "Status: Krytyczny błąd przetwarzania danych JSON!";
        console.error("Szczegóły błędu:", error);
    }
}

// Podpięcie przycisku generowania analizy
document.getElementById('fetch-btn').addEventListener('click', uruchomAnalizeAI);

// Logowanie za pomocą klawisza Enter w polu hasła
document.getElementById('server-password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        zaloguj();
    }
});
