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

// Funkcja sprawdzająca czy użytkownik jest już zalogowany (np. po odświeżeniu strony)
function weryfikujDostep() {
    if (sessionStorage.getItem('isLogged') === 'true') {
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'flex'; // Zmienione na flex, żeby dopasować do stylów CSS
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (mainLayout) mainLayout.style.display = 'none';
    }
}

// Uruchomienie weryfikacji dostępu od razu przy wejściu na stronę
weryfikujDostep();

// Główna funkcja analizy pobierająca dane przez nasz bezpieczny serwer Backend
async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Serwer przetwarza zapytanie i pobiera dane z giełdy...";
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        // Wyciągamy czysty tekst wygenerowany przez Gemini
        const aiResponseText = data.candidates[0].content.parts[0].text;
        
        // Czyścimy tekst z ewentualnych znaczników markdown (```json ... ```), które AI lubi dopisywać
        const cleanJsonText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Konwertujemy tekst JSON na gotowy obiekt JavaScript
        const analiza = JSON.parse(cleanJsonText);
        
        statusText.innerHTML = "Status: Analiza ukończona pomyślnie!";
        
        // --- STRATEGIA 1: PRICE ACTION ---
        const s1Box = document.querySelector('.signal-box:not(.strategy-2)');
        const s1Color = analiza.s1.kierunek === 'LONG' ? '#00ff88' : '#ff4444';
        const s1Emoji = analiza.s1.kierunek === 'LONG' ? '🟢' : '🔴';
        
        s1Box.querySelector('.direction-badge').innerHTML = `KIERUNEK: <span style="color: ${s1Color};">${analiza.s1.kierunek} ${s1Emoji}</span>`;
        s1Box.querySelectorAll('p')[1].innerHTML = `<strong>EP (Entry Price):</strong> $${analiza.s1.ep}`;
        s1Box.querySelectorAll('p')[2].innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s1.tp}`;
        s1Box.querySelectorAll('p')[3].innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color: #00ff88; font-weight: bold;">${analiza.s1.prawdopodobienstwo}%</span>`;
        s1Box.querySelectorAll('p')[4].innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s1.sl}`;
        s1Box.querySelectorAll('p')[5].innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s1.uzasadnienie}`;
        
        // --- STRATEGIA 2: MATEMATYCZNA (EMA/RSI) ---
        const s2Box = document.querySelector('.strategy-2');
        const s2Color = analiza.s2.kierunek === 'LONG' ? '#00ff88' : '#ff4444';
        const s2Emoji = analiza.s2.kierunek === 'LONG' ? '🟢' : '🔴';
        
        s2Box.querySelector('.direction-badge').innerHTML = `KIERUNEK: <span style="color: ${s2Color};">${analiza.s2.kierunek} ${s2Emoji}</span>`;
        s2Box.querySelectorAll('p')[1].innerHTML = `<strong>EP (Entry Price):</strong> $${analiza.s2.ep}`;
        s2Box.querySelectorAll('p')[2].innerHTML = `<strong>TP (Take Profit):</strong> $${analiza.s2.tp}`;
        s2Box.querySelectorAll('p')[3].innerHTML = `<strong>Prawdopodobieństwo TP:</strong> <span style="color: #00bcff; font-weight: bold;">${analiza.s2.prawdopodobienstwo}%</span>`;
        s2Box.querySelectorAll('p')[4].innerHTML = `<strong>SL (Stop Loss):</strong> $${analiza.s2.sl}`;
        s2Box.querySelectorAll('p')[5].innerHTML = `<strong>Uzasadnienie:</strong> ${analiza.s2.uzasadnienie}`;

    } catch (error) {
        statusText.innerHTML = "Status: Krytyczny błąd podczas analizy danych!";
        console.error("Błąd systemu:", error);
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
