const express = require("express");
const router = express.Router();
const { getPosts, getUsers } = require("../controllers/wordpressController");

router.get("/posts", getPosts);
router.get("/users", getUsers);

module.exports = router;