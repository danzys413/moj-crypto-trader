const loginContainer = document.getElementById('login-container'); // Musisz mieć taki div w index.html wokół formularza logowania
const mainLayout = document.getElementById('main-layout'); // Cały główny panel aplikacji
const statusText = document.getElementById('status-text');

// Obsługa logowania
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

function weryfikujDostep() {
    if (sessionStorage.getItem('isLogged') === 'true') {
        if(loginContainer) loginContainer.style.display = 'none';
        if(mainLayout) mainLayout.style.display = 'block';
    } else {
        if(loginContainer) loginContainer.style.display = 'block';
        if(mainLayout) mainLayout.style.display = 'none';
    }
}

// Wywołaj przy starcie strony
weryfikujDostep();

// Funkcja analizy
async function uruchomAnalizeAI() {
    statusText.innerHTML = "Status: Serwer przetwarza zapytanie i pobiera dane...";
    
    try {
        const response = await fetch('/api/analyze', { method: 'POST' });
        const data = await response.json();
        
        // Tutaj wstaw swoją dotychczasową logikę wyciągania tekstu i uzupełniania pól (ep, tp, sl, uzasadnienie)
        // ...
        statusText.innerHTML = "Status: Analiza gotowa!";
    } catch (error) {
        statusText.innerHTML = "Status: Wystąpił błąd podczas analizy!";
        console.error(error);
    }
}

document.getElementById('fetch-btn').addEventListener('click', uruchomAnalizeAI);
