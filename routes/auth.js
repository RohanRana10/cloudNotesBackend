const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

// const JWT_SECRET = 'ThisIsMySecrestString';
const JWT_SECRET = process.env.JWT_SECRET;


//Route 1 : create a user using: POST "/api/auth/createuser". No Login required

//array below in between is for express-validator
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be of 5 alteast characters').isLength({ min: 5 })
], async (req, res) => {
    let success = false;
    // if errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        //check whether the user with this email exists alerady
        let user = await User.findOne({ email: req.body.email });
        console.log(user);
        if (user) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        //create a new user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        })

        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });//es6 std shorthand for authtoken: authtoken

    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }
})

//Route 2: Authenticate a user using: POST "/api/auth/login". No Login required

router.post('/login', [
    body('email', 'Please enter a valid email!').isEmail(),
    body('password', 'Password cannot be blank!').exists()
], async (req, res) => {
    let success = false;
    // if errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ success, error: "Invalid credentials!" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            success = false;
            return res.status(400).json({ success, error: "Invalid credentials!" });
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });//es6 std shorthand for authtoken: authtoken
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");

    }
})

//Route 3: Get logged in user details: POST "/api/auth/getuser"> Login required
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        let userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        // const user = await User.findById(userId);
        res.send(user);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }
})

router.post('/updateuser', fetchuser, async (req, res) => {
    const { username, email } = req.body;
    let success = false;
    try {
        const newuser = {};
        if (username) {
            newuser.name = username
        }
        if (email) {
            newuser.email = email
        }
        let userId = req.user.id;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({success, error: "User does not exist"});
        }
        user = await User.findByIdAndUpdate(userId, { $set: newuser }, { new: true })
        success = true;
        res.json({success, user});
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }
})

module.exports = router;