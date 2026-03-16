const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-very-secure-secret';

app.use(cors({
    origin: [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/]
}));

app.use(express.json());

let users = [
    {id: 1, username: 'admin', password: '$2a$10...', role: 'admin'},
    {id: 2, username: 'user', password: '$2a$10...', role: 'user'}
];

users[0].password = bcrypt.hashSync('admin123', 10);
users[1].password = bcrypt.hashSync('user123', 10);

//POST /api/register - Register a new user
app.post('/api/register', async (req, res) =>{
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({error: 'Username and password required'});
    }

    //check if user already exists
    const existing = users.find(u => u.username === username);
        if (existing) {
            return res.status(400).json({error: 'Username already exists'});
        }

    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        role: 'user'
    };

    users.push(newUser);
    res.status(201).json({message: 'User registered successfully', username, role: newUser.role});
});

//POST /api/login - Authenticate user and return JWT
app.post('/api/login', async (req, res) => {
    const {username, password} = req.body;

    const user = users.find(u => u.username === username);
        if (!user || !await bcrypt.compare(password,user.password)){
            return res.status(401).json({error: 'Invalid username or password'});
        } 

    //Generate JWT token 
    const token = jwt.sign(
        {id: user.id, username: user.username, role: user.role},
        SECRET_KEY,
        {expiresIn: '1h'}
    );
    
    res.json ({token, user: {username: user.username, role: user.role}});
});

//Protected route: GET user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({user: req.user});
});

//Role-based protected route: GET admin dashboard
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({message: 'Welcome to the admin dashboard', data: 'Secret admin info'});
});

//Public route: guest content
app.get('/api/content/guest', (req, res) => {
    res.json({message: 'Public content for all visitors'});
});

//Middleware to authenticate JWT token
function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];//Bearer TOKEN

    if (!token){
        return res.status(401).json({error: 'Access token required'});
    }

    jwt.verify(token,SECRET_KEY, (err,user) => {
        if (err) return res.status(403).json({error: 'Invalid or expired token'});
        req.user = user;
        next();
    });
}

//Role authorization middleware
function authorizeRole(role){
    return (req,res,next) => {
        if (req.user.role !== role){
            return res.status(403).json({error: 'Access denied: Insufficient permissions'});
        }
        next();
    }
}

//start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('try logging in with: ');
    console.log('Admin: username: admin, password: admin123');
    console.log('User: username: user, password: user123');
});