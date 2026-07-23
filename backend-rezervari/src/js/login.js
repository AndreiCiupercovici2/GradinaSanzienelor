const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    try {
        const response = await fetch('http://localhost:3000/api/portalIntern/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);

        window.location.href = '/portalIntern';
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = error.message || 'An error occurred during login. Please try again.';
    }
});