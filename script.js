// ============================================================
//  Full-Stack App – Client-Side Prototype (script.js)
// ============================================================

const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

// ======================== STORAGE ========================

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // Seed default data
        window.db = {
            accounts: [
                {
                    firstname: 'Admin',
                    lastname: 'User',
                    email: 'admin@example.com',
                    password: 'Password123!',
                    role: 'Admin',
                    verified: true
                }
            ],
            departments: [
                { id: 1, name: 'Engineering', description: 'Software team' },
                { id: 2, name: 'HR', description: 'Human Resources' }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
        return;
    }
    try {
        window.db = JSON.parse(raw);
    } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        loadFromStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// ======================== TOAST ========================

function showToast(message, type) {
    type = type || 'success';
    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-warning';
    const html =
        '<div class="toast align-items-center text-white ' + bgClass + ' border-0" role="alert">' +
        '  <div class="d-flex">' +
        '    <div class="toast-body">' + message + '</div>' +
        '    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
        '  </div>' +
        '</div>';
    const container = document.getElementById('toastContainer');
    container.insertAdjacentHTML('beforeend', html);
    const toastEl = container.lastElementChild;
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', function () {
        toastEl.remove();
    });
}

// ======================== AUTH STATE ========================

function setAuthState(isAuth, user) {
    currentUser = user || null;
    const body = document.body;
    if (isAuth && currentUser) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        document.getElementById('navUsername').textContent = currentUser.firstname || currentUser.email;
        if (currentUser.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        document.getElementById('navUsername').textContent = 'User';
    }
}

// ======================== NAVIGATION / ROUTING ========================

function navigateTo(hash) {
    window.location.hash = hash;
}

const adminRoutes = ['#/employees', '#/departments', '#/accounts'];
const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/departments', '#/accounts'];

function handleRouting() {
    const hash = window.location.hash || '#/';

    // Hide all pages
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });

    // Auth guard
    if (!currentUser && protectedRoutes.indexOf(hash) !== -1) {
        navigateTo('#/login');
        return;
    }
    // Admin guard
    if (currentUser && currentUser.role !== 'Admin' && adminRoutes.indexOf(hash) !== -1) {
        showToast('Access denied – Admin only.', 'danger');
        navigateTo('#/profile');
        return;
    }

    var pageId = '';

    switch (hash) {
        case '#/login':
            pageId = 'login-page';
            break;
        case '#/register':
            pageId = 'register-page';
            break;
        case '#/verify-email':
            pageId = 'verify-email-page';
            var unverified = localStorage.getItem('unverified_email') || '';
            document.getElementById('verifyEmailDisplay').textContent = unverified;
            break;
        case '#/profile':
            pageId = 'profile-page';
            renderProfile();
            break;
        case '#/employees':
            pageId = 'employees-page';
            renderEmployeesTable();
            break;
        case '#/departments':
            pageId = 'departments-page';
            renderDepartmentsList();
            break;
        case '#/accounts':
            pageId = 'accounts-page';
            renderAccountsList();
            break;
        case '#/requests':
            pageId = 'requests-page';
            renderRequests();
            break;
        default:
            pageId = 'home-page';
            break;
    }

    var el = document.getElementById(pageId);
    if (el) el.classList.add('active');
}

window.addEventListener('hashchange', handleRouting);

// ======================== INIT ========================

window.addEventListener('DOMContentLoaded', function () {
    loadFromStorage();

    // Restore session from localStorage auth_token
    var savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
        var user = window.db.accounts.find(function (a) { return a.email === savedToken; });
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        window.location.hash = '#/';
    }
    handleRouting();

    // ──────────────── EVENT LISTENERS ────────────────

    // --- Register ---
    document.getElementById('registerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var firstName = document.getElementById('regFirstName').value.trim();
        var lastName = document.getElementById('regLastName').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value;

        var errEl = document.getElementById('registerError');
        errEl.textContent = '';

        if (password.length < 6) {
            errEl.textContent = 'Password must be at least 6 characters.';
            return;
        }

        var exists = window.db.accounts.some(function (a) { return a.email === email; });
        if (exists) {
            errEl.textContent = 'Email already exists.';
            return;
        }

        window.db.accounts.push({
            firstname: firstName,
            lastname: lastName,
            email: email,
            password: password,
            role: 'User',
            verified: false
        });
        saveToStorage();

        localStorage.setItem('unverified_email', email);
        this.reset();
        showToast('Account created! Please verify your email.', 'success');
        navigateTo('#/verify-email');
    });

    // --- Verify Email ---
    document.getElementById('verifyBtn').addEventListener('click', function () {
        var unverifiedEmail = localStorage.getItem('unverified_email');
        var user = window.db.accounts.find(function (a) { return a.email === unverifiedEmail; });
        if (user) {
            user.verified = true;
            saveToStorage();
            localStorage.removeItem('unverified_email');
            showToast('Email verified! You may now log in.', 'success');
            navigateTo('#/login');
        } else {
            showToast('No account found for verification.', 'danger');
        }
    });

    document.getElementById('bcktoLogin').addEventListener('click', function () {
        navigateTo('#/login');
    });

    // --- Login ---
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('loginEmail').value.trim();
        var password = document.getElementById('loginPassword').value;
        var errEl = document.getElementById('loginError');
        errEl.textContent = '';

        var user = window.db.accounts.find(function (a) {
            return a.email === email && a.password === password && a.verified === true;
        });

        if (!user) {
            errEl.textContent = 'Invalid credentials or email not verified.';
            return;
        }

        localStorage.setItem('auth_token', user.email);
        setAuthState(true, user);
        this.reset();
        showToast('Welcome back, ' + user.firstname + '!', 'success');
        navigateTo('#/profile');
    });

    // --- Logout ---
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('auth_token');
        setAuthState(false);
        showToast('Logged out.', 'success');
        navigateTo('#/');
    });

    // --- Edit Profile ---
    document.getElementById('editProfileBtn').addEventListener('click', function () {
        alert('Edit Profile – feature coming soon!');
    });

    // ──────────── EMPLOYEES ────────────
    document.getElementById('addEmployeeBtn').addEventListener('click', function () {
        showEmployeeForm();
    });
    document.getElementById('cancelEmployeeBtn').addEventListener('click', function () {
        document.getElementById('employeeFormContainer').style.display = 'none';
    });
    document.getElementById('employeeForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveEmployee();
    });

    // ──────────── DEPARTMENTS ────────────
    document.getElementById('addDepartmentBtn').addEventListener('click', function () {
        showDepartmentForm();
    });
    document.getElementById('cancelDepartmentBtn').addEventListener('click', function () {
        document.getElementById('departmentFormContainer').style.display = 'none';
    });
    document.getElementById('departmentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveDepartment();
    });

    // ──────────── ACCOUNTS ────────────
    document.getElementById('addAccountBtn').addEventListener('click', function () {
        showAccountForm();
    });
    document.getElementById('cancelAccountBtn').addEventListener('click', function () {
        document.getElementById('accountFormContainer').style.display = 'none';
    });
    document.getElementById('accountForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveAccount();
    });

    // ──────────── REQUESTS ────────────
    document.getElementById('newRequestBtn').addEventListener('click', openRequestModal);
    document.getElementById('createRequestBtn').addEventListener('click', openRequestModal);
    document.getElementById('addRequestItemBtn').addEventListener('click', addRequestItemRow);
    document.getElementById('submitRequestBtn').addEventListener('click', submitRequest);
});

// ======================== PROFILE ========================

function renderProfile() {
    if (!currentUser) return;
    document.getElementById('profileName').textContent = currentUser.firstname + ' ' + currentUser.lastname;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role;
}

// ======================== ACCOUNTS (Admin CRUD) ========================

function renderAccountsList() {
    var tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';
    document.getElementById('accountFormContainer').style.display = 'none';

    window.db.accounts.forEach(function (acc, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + acc.firstname + ' ' + acc.lastname + '</td>' +
            '<td>' + acc.email + '</td>' +
            '<td>' + acc.role + '</td>' +
            '<td>' + (acc.verified ? '✅' : '—') + '</td>' +
            '<td>' +
            '  <button class="btn btn-sm btn-warning" onclick="editAccount(' + i + ')">Edit</button>' +
            '  <button class="btn btn-sm btn-info" onclick="resetPassword(' + i + ')">Reset Password</button>' +
            '  <button class="btn btn-sm btn-danger" onclick="deleteAccount(' + i + ')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function showAccountForm(index) {
    var container = document.getElementById('accountFormContainer');
    container.style.display = 'block';
    document.getElementById('accEditIndex').value = index !== undefined ? index : -1;
    document.getElementById('accPassword').required = index === undefined; // required only for new

    if (index !== undefined) {
        var acc = window.db.accounts[index];
        document.getElementById('accFirstName').value = acc.firstname;
        document.getElementById('accLastName').value = acc.lastname;
        document.getElementById('accEmail').value = acc.email;
        document.getElementById('accPassword').value = '';
        document.getElementById('accRole').value = acc.role;
        document.getElementById('accVerified').checked = acc.verified;
    } else {
        document.getElementById('accountForm').reset();
        document.getElementById('accPassword').required = true;
    }
}

function editAccount(i) {
    showAccountForm(i);
}

function saveAccount() {
    var idx = parseInt(document.getElementById('accEditIndex').value);
    var firstName = document.getElementById('accFirstName').value.trim();
    var lastName = document.getElementById('accLastName').value.trim();
    var email = document.getElementById('accEmail').value.trim();
    var password = document.getElementById('accPassword').value;
    var role = document.getElementById('accRole').value;
    var verified = document.getElementById('accVerified').checked;

    if (idx === -1) {
        // New account
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'danger');
            return;
        }
        var exists = window.db.accounts.some(function (a) { return a.email === email; });
        if (exists) {
            showToast('Email already in use.', 'danger');
            return;
        }
        window.db.accounts.push({
            firstname: firstName,
            lastname: lastName,
            email: email,
            password: password,
            role: role,
            verified: verified
        });
        showToast('Account created.', 'success');
    } else {
        // Edit existing
        var acc = window.db.accounts[idx];
        acc.firstname = firstName;
        acc.lastname = lastName;
        acc.email = email;
        if (password.length > 0) {
            if (password.length < 6) {
                showToast('Password must be at least 6 characters.', 'danger');
                return;
            }
            acc.password = password;
        }
        acc.role = role;
        acc.verified = verified;
        showToast('Account updated.', 'success');
    }
    saveToStorage();
    renderAccountsList();
}

function resetPassword(i) {
    var newPw = prompt('Enter new password (min 6 characters):');
    if (!newPw || newPw.length < 6) {
        showToast('Password must be at least 6 characters.', 'danger');
        return;
    }
    window.db.accounts[i].password = newPw;
    saveToStorage();
    showToast('Password reset successfully.', 'success');
}

function deleteAccount(i) {
    var acc = window.db.accounts[i];
    if (currentUser && acc.email === currentUser.email) {
        showToast('You cannot delete your own account!', 'danger');
        return;
    }
    if (!confirm('Delete account for ' + acc.email + '?')) return;
    window.db.accounts.splice(i, 1);
    saveToStorage();
    showToast('Account deleted.', 'success');
    renderAccountsList();
}

// ======================== DEPARTMENTS (Admin CRUD) ========================

function renderDepartmentsList() {
    var tbody = document.getElementById('departmentsTableBody');
    tbody.innerHTML = '';
    document.getElementById('departmentFormContainer').style.display = 'none';

    window.db.departments.forEach(function (dept, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + dept.name + '</td>' +
            '<td>' + (dept.description || '') + '</td>' +
            '<td>' +
            '  <button class="btn btn-sm btn-warning" onclick="editDepartment(' + i + ')">Edit</button>' +
            '  <button class="btn btn-sm btn-danger" onclick="deleteDepartment(' + i + ')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function showDepartmentForm(index) {
    var container = document.getElementById('departmentFormContainer');
    container.style.display = 'block';
    document.getElementById('deptEditIndex').value = index !== undefined ? index : -1;

    if (index !== undefined) {
        var dept = window.db.departments[index];
        document.getElementById('deptName').value = dept.name;
        document.getElementById('deptDesc').value = dept.description || '';
        document.getElementById('deptFormTitle').textContent = 'Edit Department';
    } else {
        document.getElementById('departmentForm').reset();
        document.getElementById('deptFormTitle').textContent = 'Add Department';
    }
}

function editDepartment(i) {
    showDepartmentForm(i);
}

function saveDepartment() {
    var idx = parseInt(document.getElementById('deptEditIndex').value);
    var name = document.getElementById('deptName').value.trim();
    var desc = document.getElementById('deptDesc').value.trim();

    if (idx === -1) {
        var newId = window.db.departments.length > 0
            ? Math.max.apply(null, window.db.departments.map(function (d) { return d.id; })) + 1
            : 1;
        window.db.departments.push({ id: newId, name: name, description: desc });
        showToast('Department added.', 'success');
    } else {
        window.db.departments[idx].name = name;
        window.db.departments[idx].description = desc;
        showToast('Department updated.', 'success');
    }
    saveToStorage();
    renderDepartmentsList();
}

function deleteDepartment(i) {
    if (!confirm('Delete department "' + window.db.departments[i].name + '"?')) return;
    window.db.departments.splice(i, 1);
    saveToStorage();
    showToast('Department deleted.', 'success');
    renderDepartmentsList();
}

// ======================== EMPLOYEES (Admin CRUD) ========================

function populateDeptDropdown() {
    var sel = document.getElementById('empDept');
    sel.innerHTML = '';
    window.db.departments.forEach(function (d) {
        var opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        sel.appendChild(opt);
    });
}

function renderEmployeesTable() {
    var tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = '';
    document.getElementById('employeeFormContainer').style.display = 'none';

    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees.</td></tr>';
        return;
    }

    window.db.employees.forEach(function (emp, i) {
        var deptName = '';
        var dept = window.db.departments.find(function (d) { return d.id === emp.deptId; });
        if (dept) deptName = dept.name;

        // Get user name from accounts
        var account = window.db.accounts.find(function (a) { return a.email === emp.email; });
        var name = account ? (account.firstname + ' ' + account.lastname) : emp.email;

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + emp.employeeId + '</td>' +
            '<td>' + name + '</td>' +
            '<td>' + emp.position + '</td>' +
            '<td>' + deptName + '</td>' +
            '<td>' +
            '  <button class="btn btn-sm btn-warning" onclick="editEmployee(' + i + ')">Edit</button>' +
            '  <button class="btn btn-sm btn-danger" onclick="deleteEmployee(' + i + ')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function showEmployeeForm(index) {
    populateDeptDropdown();
    var container = document.getElementById('employeeFormContainer');
    container.style.display = 'block';
    document.getElementById('empEditIndex').value = index !== undefined ? index : -1;

    if (index !== undefined) {
        var emp = window.db.employees[index];
        document.getElementById('empId').value = emp.employeeId;
        document.getElementById('empEmail').value = emp.email;
        document.getElementById('empPosition').value = emp.position;
        document.getElementById('empDept').value = emp.deptId;
        document.getElementById('empHireDate').value = emp.hireDate || '';
    } else {
        document.getElementById('employeeForm').reset();
        populateDeptDropdown();
    }
}

function editEmployee(i) {
    showEmployeeForm(i);
}

function saveEmployee() {
    var idx = parseInt(document.getElementById('empEditIndex').value);
    var employeeId = document.getElementById('empId').value.trim();
    var email = document.getElementById('empEmail').value.trim();
    var position = document.getElementById('empPosition').value.trim();
    var deptId = parseInt(document.getElementById('empDept').value);
    var hireDate = document.getElementById('empHireDate').value;

    // Validate email matches an existing account
    var account = window.db.accounts.find(function (a) { return a.email === email; });
    if (!account) {
        showToast('User email must match an existing account.', 'danger');
        return;
    }

    var empObj = {
        employeeId: employeeId,
        email: email,
        position: position,
        deptId: deptId,
        hireDate: hireDate
    };

    if (idx === -1) {
        window.db.employees.push(empObj);
        showToast('Employee added.', 'success');
    } else {
        window.db.employees[idx] = empObj;
        showToast('Employee updated.', 'success');
    }
    saveToStorage();
    renderEmployeesTable();
}

function deleteEmployee(i) {
    if (!confirm('Delete this employee record?')) return;
    window.db.employees.splice(i, 1);
    saveToStorage();
    showToast('Employee deleted.', 'success');
    renderEmployeesTable();
}

// ======================== REQUESTS ========================

function renderRequests() {
    if (!currentUser) return;

    var myRequests = window.db.requests.filter(function (r) {
        return r.employeeEmail === currentUser.email;
    });

    var emptyDiv = document.getElementById('requestsEmpty');
    var tableEl = document.getElementById('requestsTable');
    var tbody = document.getElementById('requestsTableBody');

    if (myRequests.length === 0) {
        emptyDiv.style.display = 'block';
        tableEl.style.display = 'none';
        return;
    }

    emptyDiv.style.display = 'none';
    tableEl.style.display = 'table';
    tbody.innerHTML = '';

    myRequests.forEach(function (req, i) {
        var itemsText = req.items.map(function (it) { return it.name + ' ×' + it.qty; }).join(', ');
        var badgeClass = 'bg-warning text-dark';
        if (req.status === 'Approved') badgeClass = 'bg-success';
        if (req.status === 'Rejected') badgeClass = 'bg-danger';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + (i + 1) + '</td>' +
            '<td>' + req.type + '</td>' +
            '<td>' + itemsText + '</td>' +
            '<td>' + req.date + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + req.status + '</span></td>';
        tbody.appendChild(tr);
    });
}

function openRequestModal() {
    var itemsContainer = document.getElementById('requestItems');
    itemsContainer.innerHTML = '';
    // Add 4 default rows
    for (var n = 0; n < 4; n++) {
        addRequestItemRow();
    }
    var modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
}

function addRequestItemRow() {
    var container = document.getElementById('requestItems');
    var row = document.createElement('div');
    row.className = 'request-item-row';
    row.innerHTML =
        '<input type="text" class="form-control" placeholder="Item name">' +
        '<input type="number" class="form-control" value="1" min="1">' +
        '<button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">×</button>';
    container.appendChild(row);
}

function submitRequest() {
    var type = document.getElementById('reqType').value;
    var rows = document.querySelectorAll('#requestItems .request-item-row');
    var items = [];

    rows.forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        var name = inputs[0].value.trim();
        var qty = parseInt(inputs[1].value) || 0;
        if (name && qty > 0) {
            items.push({ name: name, qty: qty });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one item.', 'danger');
        return;
    }

    window.db.requests.push({
        type: type,
        items: items,
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
        employeeEmail: currentUser.email
    });
    saveToStorage();

    // Close modal
    var modalEl = document.getElementById('requestModal');
    var bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    showToast('Request submitted!', 'success');
    renderRequests();
}
