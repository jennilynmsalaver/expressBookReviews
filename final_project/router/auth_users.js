const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
let users = [];


function isValid(username){
    return users.some(u => u.username === username);
}


const authenticatedUser = (username, password) => {
    return users.some(u => u.username === username && u.password === password);
};



regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: "Username and password required" });

    if (!authenticatedUser(username, password))
        return res.status(401).json({ message: "Invalid login credentials" });

    // Generate token
    const token = jwt.sign(
        { username: username },
        "access_token_secret",
        { expiresIn: "1h" }
    );

    return res.status(200).json({
        message: "Login successful",
        token: token
    });
});



function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token)
        return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, "access_token_secret", (err, decoded) => {
        if (err)
            return res.status(401).json({ message: "Invalid or expired token" });

        req.username = decoded.username;
        next();
    });
}



regd_users.put("/auth/review/:isbn", verifyToken, (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.username;

    if (!books[isbn])
        return res.status(404).json({ message: "Book not found" });

    // Add or update review
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: "Review added/updated successfully",
        reviews: books[isbn].reviews
    });
});


regd_users.delete("/auth/review/:isbn", verifyToken, (req, res) => {
    const isbn = req.params.isbn;
    const username = req.username;

    if (!books[isbn])
        return res.status(404).json({ message: "Book not found" });

    delete books[isbn].reviews[username];

    return res.status(200).json({
        message: "Review deleted successfully",
        reviews: books[isbn].reviews
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
