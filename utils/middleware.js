const logger = require("./logger");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const requestLogger = (req, res, next) => {
	logger.info("Method:", req.method);
	logger.info("Path:  ", req.path);
	logger.info("Body:  ", req.body);
	logger.info("---");
	next();
};

const unknownEndpoint = (req, res) => {
	res.status(404).send({ error: "unknown endpoint" });
};

const getTokenFrom = (req, res, next) => {
	const authorization = req.get("authorization");
	if (authorization && authorization.startsWith("Bearer ")) {
		req.token = authorization.replace("Bearer ", "");
	}
	next();
};

const userExtractor = async (req, res, next) => {
	if (req.token) {
		const decodedToken = jwt.verify(req.token, process.env.SECRET);
		const user = await User.findById(decodedToken.id);
		req.user = user;
	}
	next();
};

const errorHandler = (error, req, res, next) => {
	logger.error(error.message);

	if (error.name === "CastError") {
		return res.status(400).send({ error: "malformatted id" });
	} else if (error.name === "ValidationError") {
		return res.status(400).json({ error: error.message });
	} else if (error.name === "JsonWebTokenError") {
		return res.status(401).json({ error: error.message });
	}

	next(error);
};

module.exports = {
	requestLogger,
	unknownEndpoint,
	errorHandler,
	getTokenFrom,
	userExtractor
};
