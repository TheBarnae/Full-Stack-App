let currentUser = null;

function navigateTo(page) {
    window.location.hash = hash;
}

/*Router Logic*/

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
        default:
            pageID = 'home-page';   
    }
    document.getElementById(pageID).classList.add('active');
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
