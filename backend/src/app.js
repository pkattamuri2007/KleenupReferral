require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const handoffRoutes = require("./routes/handoffRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const adminRoutes = require("./routes/adminRoutes");
const portalRoutes = require("./routes/portalRoutes");
const policyRoutes = require("./routes/policyRoutes");
const wordpressRoutes = require("./routes/wordpressRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", handoffRoutes);
app.use("/api", webhookRoutes);
app.use("/api", adminRoutes);
app.use("/api", portalRoutes);
app.use("/api", policyRoutes);
app.use("/api/wp", wordpressRoutes);

app.use(errorHandler);

module.exports = app;