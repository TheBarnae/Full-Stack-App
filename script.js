let currentUser = null;

function navigateTo(hash) {
    window.location.hash = hash;
}

/*Router Logic*/

window.db = {
    accounts: []
};

function handleRouting(){
    const hash = window.location.hash || '#/';

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    let pageID = '';

    switch (hash){
        case '#/login':
            pageID = 'login-page';
        break;

        case '#/register':
            pageID = 'register-page';
        break;

        case '#/profile':
            if (!currentUser){
                navigateTo('#/login');
                return;
            }
            pageID = 'profile-page';
        break;

        case '#/verify-email':
            pageID = "verify-email-page";
            document.getElementById("verifyMessage").textContent = "Verification sent to " + window.unverifiedEmail;
        break;

        default:
            pageID = 'home-page';   
    }
    document.getElementById(pageID).classList.add('active');
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

document.getElementById("registerForm").addEventListener('submit', function(e){
    e.preventDefault();

    const inputs = this.querySelectorAll("input");

    const newUser = {
        firstname: inputs[0].value,
        lastname: inputs[1].value,
        email: inputs[2].value,
        password: inputs[3].value,
        role: "user",
        verified: false
    };

    const exists = window.db.accounts.some(
        acc => acc.email === newUser.email
    );

    if (exists){
        document.getElementById("registerError").textContent = "Email already exists.";
        return;
    }

    window.db.accounts.push(newUser);
    window.unverifiedEmail = newUser.email;
    this.reset();
    navigateTo('#/verify-email');
});

document.getElementById("verifyBtn").addEventListener('click', function(){
    const user = window.db.accounts.find(
        acc => acc.email === window.unverifiedEmail
    );
    if (user) {
        user.verified = true;
        window.unverifiedEmail = null;
        navigateTo('#/login');
    }

    document.getElementById("bcktoLogin").addEventListener('click', function(){
        navigateTo('#/login');
    });
});