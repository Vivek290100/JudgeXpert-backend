// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\dist\app.js
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\app.ts
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ Security Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, express_mongo_sanitize_1.default)()); // Prevent NoSQL injection
// ✅ CORS Configuration
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "https://yourfrontend.com"], // Trusted domains
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, res, next) => {
    res.cookie("token", "your_jwt_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    next();
});
// ✅ Secure Route Example (Prevents XSS Attacks)
app.post("/submit", [
    (0, express_validator_1.body)("name").trim().escape(), // Prevents XSS
    (0, express_validator_1.body)("email").isEmail().normalizeEmail(), // Validates email
], (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Ensure function exits
    }
    res.send("✅ Data received safely!");
    next(); // Call next middleware if needed
});

exports.default = app;
