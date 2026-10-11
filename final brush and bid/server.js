// ============================================================
// BRUSH AND BID
// Complete Express + MySQL Backend
// ============================================================

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");

// All server-side date/time operations use Indian Standard Time (IST).
process.env.TZ = "Asia/Kolkata";

const app = express();

// ============================================================
// CONFIGURATION
// ============================================================

// Override with an environment variable, e.g. PORT=5011 node server.js
const PORT = Number(process.env.PORT) || 5010;

const DB_CONFIG = {
    host: "localhost",
    user: "root",
    password: "root@123",
    database: "brush_and_bid",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+05:30"
};

// Gmail configuration
// Leave the App Password blank if OTP should be shown
// in the VS Code terminal.
const GMAIL_USER = "joantressathomas5@gmail.com";
// Set GMAIL_APP_PASSWORD="" in the environment to print OTPs
// in the terminal instead of emailing them.
const GMAIL_APP_PASSWORD =
    process.env.GMAIL_APP_PASSWORD !== undefined
        ? process.env.GMAIL_APP_PASSWORD
        : "pvjs yxuz lgak umyi";

// ============================================================
// EXPRESS SETUP
// ============================================================

app.use(cors());

app.use(express.json({
    limit: "10mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));

// Serve all frontend files from the same folder.
app.use(express.static(__dirname));

// ============================================================
// MYSQL POOL
// ============================================================

const db = mysql.createPool(DB_CONFIG);

// ============================================================
// GMAIL TRANSPORTER
// ============================================================

const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizeRole(role) {

    if (!role) {
        return "";
    }

    const value = String(role)
        .toLowerCase()
        .trim();

    if (value === "artist") {
        return "artist";
    }

    if (value === "bidder") {
        return "bidder";
    }

    if (value === "admin") {
        return "admin";
    }

    return value;
}

function isValidRole(role) {

    return [
        "artist",
        "bidder",
        "admin"
    ].includes(
        normalizeRole(role)
    );
}

function generateOTP() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();
}

function otpExpiry() {

    const date = new Date();

    date.setMinutes(
        date.getMinutes() + 10
    );

    return date;
}

function toNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return number;
}

function sendError(
    res,
    status,
    message,
    error = null
) {

    console.error(message);

    if (error) {
        console.error(error);
    }

    return res.status(status).json({

        success: false,

        error: message

    });
}

// ============================================================
// DATABASE TEST
// ============================================================

async function testDatabase() {

    try {

        const connection =
            await db.getConnection();

        console.log("");

        console.log(
            "======================================"
        );

        console.log(
            "      BRUSH AND BID SERVER"
        );

        console.log(
            "======================================"
        );

        console.log("");

        console.log(
            `Website: http://localhost:${PORT}`
        );

        console.log(
            `API:     http://localhost:${PORT}/api`
        );

        console.log("");

        console.log(
            "======================================"
        );

        console.log(
            "MYSQL CONNECTED SUCCESSFULLY"
        );

        console.log(
            "======================================"
        );

        console.log("");

        connection.release();

    } catch (error) {

        console.log("");

        console.log(
            "======================================"
        );

        console.log(
            "MYSQL CONNECTION FAILED"
        );

        console.log(
            "======================================"
        );

        console.log(
            error.message
        );

        console.log("");

        console.log(
            "Check:"
        );

        console.log(
            "1. MySQL server is running."
        );

        console.log(
            "2. Database brush_and_bid exists."
        );

        console.log(
            "3. MySQL username/password are correct."
        );

        console.log("");

    }
}

// ============================================================
// BASIC ROUTES
// ============================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});

app.get("/api", (req, res) => {

    res.json({

        success: true,

        message:
            "BRUSH and BID API is running"

    });

});

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] =
            await db.query(
                "SELECT 1 AS connected"
            );

        res.json({

            success: true,

            message:
                "MySQL connected successfully",

            database:
                DB_CONFIG.database,

            result:
                rows[0]

        });

    } catch (error) {

        sendError(
            res,
            500,
            "MySQL connection failed",
            error
        );

    }

});

app.get("/api/tables", async (req, res) => {

    try {

        const [rows] =
            await db.query(
                "SHOW TABLES"
            );

        res.json({

            success: true,

            tables: rows

        });

    } catch (error) {

        sendError(
            res,
            500,
            "Unable to fetch database tables",
            error
        );

    }

});

// ============================================================
// EMAIL OTP
// ============================================================

async function sendVerificationOTP(
    email,
    fullName,
    otp
) {

    // If Gmail credentials are not configured,
    // print the OTP in the terminal instead.
    if (
        !GMAIL_USER ||
        GMAIL_USER === "YOUR_GMAIL@gmail.com" ||
        !GMAIL_APP_PASSWORD ||
        GMAIL_APP_PASSWORD ===
        "YOUR_16_CHARACTER_APP_PASSWORD"
    ) {

        console.log("");

        console.log(
            "OTP EMAIL NOT CONFIGURED"
        );

        console.log(
            `OTP for ${email}: ${otp}`
        );

        console.log("");

        return;
    }

    await mailTransporter.sendMail({

        from:
            `"BRUSH and BID" <${GMAIL_USER}>`,

        to: email,

        subject:
            "BRUSH and BID - Email Verification OTP",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
                background: #fffaf5;
                border-radius: 15px;
            ">

                <h2 style="color:#013e37;">
                    BRUSH and BID
                </h2>

                <p>
                    Hello
                    <strong>${fullName}</strong>,
                </p>

                <p>
                    Thank you for registering
                    with BRUSH and BID.
                </p>

                <p>
                    Use the OTP below to verify
                    your email address.
                </p>

                <div style="
                    font-size: 32px;
                    letter-spacing: 8px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    margin: 20px 0;
                    background: #f3c6cb;
                    color: #013e37;
                    border-radius: 10px;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP is valid for
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not create this
                    account, you can ignore this email.
                </p>

                <p>
                    Regards,<br>
                    <strong>
                        BRUSH and BID Team
                    </strong>
                </p>

            </div>
        `

    });

}

// ============================================================
// REGISTER BIDDER / ARTIST
// ============================================================

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {
                full_name,
                name,
                email,
                phone,
                password,
                role
            } = req.body;

            const fullName =
                String(
                    full_name ||
                    name ||
                    ""
                ).trim();

            const userEmail =
                String(
                    email ||
                    ""
                )
                .trim()
                .toLowerCase();

            const userRole =
                normalizeRole(role);

            if (
                !fullName ||
                !userEmail ||
                !password ||
                !userRole
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Full name, email, password and role are required."

                });

            }

            if (
                !isValidRole(userRole)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Only Artist and Bidder accounts can be registered here."

                });

            }

            if (
                String(password).length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Password must contain at least 6 characters."

                });

            }

            const [existing] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        email_verified
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [userEmail]
                );

            if (
                existing.length > 0
            ) {

                if (
                    Number(
                        existing[0].email_verified
                    ) === 0
                ) {

                    return res.status(409).json({

                        success: false,

                        error:
                            "This email is already registered but not verified. Please use Resend OTP."

                    });

                }

                return res.status(409).json({

                    success: false,

                    error:
                        "An account with this email already exists."

                });

            }

            const passwordHash =
                await bcrypt.hash(
                    String(password),
                    10
                );

            const otp =
                generateOTP();

            const expiry =
                otpExpiry();

            const [result] =
                await db.query(
                    `
                    INSERT INTO users
                    (
                        full_name,
                        email,
                        phone,
                        password_hash,
                        role,
                        status,
                        email_verified,
                        otp_code,
                        otp_expiry,
                        joined_date,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'Active',
                        0,
                        ?,
                        ?,
                        CURDATE(),
                        NOW(),
                        NOW()
                    )
                    `,
                    [
                        fullName,
                        userEmail,
                        phone || null,
                        passwordHash,
                        userRole,
                        otp,
                        expiry
                    ]
                );

            const userId =
                result.insertId;

            if (
                userRole === "artist"
            ) {

                await db.query(
                    `
                    INSERT INTO artist_profiles
                    (
                        user_id,
                        full_name,
                        email
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        userId,
                        fullName,
                        userEmail
                    ]
                );

            } else {

                await db.query(
                    `
                    INSERT INTO bidder_profiles
                    (
                        user_id,
                        full_name,
                        email
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        userId,
                        fullName,
                        userEmail
                    ]
                );

            }

            try {

                await sendVerificationOTP(
                    userEmail,
                    fullName,
                    otp
                );

            } catch (mailError) {

                console.error(
                    "OTP email failed:",
                    mailError.message
                );

            }

            res.status(201).json({

                success: true,

                message:
                    "Registration successful. Please verify your email using the OTP.",

                user: {

                    user_id:
                        userId,

                    id:
                        userId,

                    full_name:
                        fullName,

                    name:
                        fullName,

                    email:
                        userEmail,

                    role:
                        userRole

                },

                requires_otp: true

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Registration failed.",
                error
            );

        }

    }
);

// ============================================================
// VERIFY OTP
// ============================================================

app.post(
    "/api/verify-otp",
    async (req, res) => {

        try {

            const {
                email,
                otp
            } = req.body;

            const userEmail =
                String(
                    email || ""
                )
                .trim()
                .toLowerCase();

            const enteredOTP =
                String(
                    otp || ""
                ).trim();

            if (
                !userEmail ||
                !enteredOTP
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Email and OTP are required."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        full_name,
                        email,
                        role,
                        otp_code,
                        otp_expiry,
                        email_verified
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [userEmail]
                );

            if (
                rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Account not found."

                });

            }

            const user =
                rows[0];

            if (
                Number(
                    user.email_verified
                ) === 1
            ) {

                return res.json({

                    success: true,

                    message:
                        "Email is already verified."

                });

            }

            if (
                String(
                    user.otp_code
                ) !== enteredOTP
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid OTP."

                });

            }

            if (
                !user.otp_expiry ||
                new Date(
                    user.otp_expiry
                ) < new Date()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "OTP has expired. Please request a new OTP."

                });

            }

            await db.query(
                `
                UPDATE users
                SET
                    email_verified = 1,
                    otp_code = NULL,
                    otp_expiry = NULL,
                    updated_at = NOW()
                WHERE user_id = ?
                `,
                [
                    user.user_id
                ]
            );

            res.json({

                success: true,

                message:
                    "Email verified successfully.",

                user: {

                    user_id:
                        user.user_id,

                    id:
                        user.user_id,

                    full_name:
                        user.full_name,

                    name:
                        user.full_name,

                    email:
                        user.email,

                    role:
                        user.role

                }

            });

        } catch (error) {

            sendError(
                res,
                500,
                "OTP verification failed.",
                error
            );

        }

    }
);

// ============================================================
// RESEND OTP
// ============================================================

app.post(
    "/api/resend-otp",
    async (req, res) => {

        try {

            const {
                email
            } = req.body;

            const userEmail =
                String(
                    email || ""
                )
                .trim()
                .toLowerCase();

            if (!userEmail) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Email is required."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        full_name,
                        email,
                        email_verified
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [userEmail]
                );

            if (
                rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Account not found."

                });

            }

            const user =
                rows[0];

            if (
                Number(
                    user.email_verified
                ) === 1
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "This email is already verified."

                });

            }

            const otp =
                generateOTP();

            const expiry =
                otpExpiry();

            await db.query(
                `
                UPDATE users
                SET
                    otp_code = ?,
                    otp_expiry = ?,
                    updated_at = NOW()
                WHERE user_id = ?
                `,
                [
                    otp,
                    expiry,
                    user.user_id
                ]
            );

            try {

                await sendVerificationOTP(
                    user.email,
                    user.full_name,
                    otp
                );

            } catch (mailError) {

                console.error(
                    "OTP email failed:",
                    mailError.message
                );

            }

            res.json({

                success: true,

                message:
                    "A new OTP has been generated and sent to your email."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to resend OTP.",
                error
            );

        }

    }
);

// ============================================================
// FORGOT PASSWORD
// Step 1: POST /api/forgot-password  { email }
//         Emails a 6-digit reset code (valid 10 minutes).
// Step 2: POST /api/reset-password   { email, otp, password }
//         Checks the code and saves the new password.
// ============================================================

// Same rule as the registration form.
const STRONG_PASSWORD =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// One code request per minute per email.
const RESET_REQUEST_GAP_MS = 60 * 1000;

// Wrong codes allowed before the code is cancelled.
const RESET_MAX_ATTEMPTS = 5;

const resetRequestTimes = new Map();

const resetFailedAttempts = new Map();

// The same reply whether or not the email has an account,
// so this form can't be used to find out who is registered.
const RESET_SENT_MESSAGE =
    "If an account exists for this email, a reset code has been sent.";

async function sendPasswordResetOTP(
    email,
    fullName,
    otp
) {

    // If Gmail credentials are not configured,
    // print the code in the terminal instead.
    if (
        !GMAIL_USER ||
        GMAIL_USER === "YOUR_GMAIL@gmail.com" ||
        !GMAIL_APP_PASSWORD ||
        GMAIL_APP_PASSWORD ===
        "YOUR_16_CHARACTER_APP_PASSWORD"
    ) {

        console.log("");

        console.log(
            "OTP EMAIL NOT CONFIGURED"
        );

        console.log(
            `Password reset code for ${email}: ${otp}`
        );

        console.log("");

        return;
    }

    await mailTransporter.sendMail({

        from:
            `"BRUSH and BID" <${GMAIL_USER}>`,

        to: email,

        subject:
            "BRUSH and BID - Password Reset Code",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
                background: #f3f4ef;
                border-radius: 12px;
            ">

                <h2 style="color:#0f2e2a;">
                    BRUSH and BID
                </h2>

                <p>
                    Hello
                    <strong>${fullName}</strong>,
                </p>

                <p>
                    We received a request to reset the
                    password for your account.
                </p>

                <p>
                    Enter this code to choose a new password:
                </p>

                <div style="
                    font-size: 32px;
                    letter-spacing: 8px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    margin: 20px 0;
                    background: #0f2e2a;
                    color: #d4af5a;
                    border-radius: 8px;
                ">
                    ${otp}
                </div>

                <p>
                    This code is valid for
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not ask to reset your password,
                    you can ignore this email. Your password
                    will not change.
                </p>

                <p>
                    Regards,<br>
                    <strong>
                        BRUSH and BID Team
                    </strong>
                </p>

            </div>
        `

    });

}

app.post(
    "/api/forgot-password",
    async (req, res) => {

        try {

            const userEmail =
                String(
                    req.body.email || ""
                )
                .trim()
                .toLowerCase();

            if (!userEmail) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Enter the email address you registered with."

                });

            }

            const lastRequest =
                resetRequestTimes.get(userEmail) || 0;

            const waitMs =
                RESET_REQUEST_GAP_MS -
                (Date.now() - lastRequest);

            if (waitMs > 0) {

                return res.status(429).json({

                    success: false,

                    error:
                        `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`

                });

            }

            resetRequestTimes.set(
                userEmail,
                Date.now()
            );

            const [rows] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        full_name,
                        status
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [userEmail]
                );

            const user =
                rows[0];

            if (
                user &&
                String(user.status).toLowerCase() === "active"
            ) {

                const otp =
                    generateOTP();

                await db.query(
                    `
                    UPDATE users
                    SET
                        otp_code = ?,
                        otp_expiry = ?,
                        updated_at = NOW()
                    WHERE user_id = ?
                    `,
                    [
                        otp,
                        otpExpiry(),
                        user.user_id
                    ]
                );

                resetFailedAttempts.delete(userEmail);

                try {

                    await sendPasswordResetOTP(
                        userEmail,
                        user.full_name,
                        otp
                    );

                } catch (mailError) {

                    console.error(
                        "Password reset email failed:",
                        mailError.message
                    );

                    console.log(
                        `Password reset code for ${userEmail}: ${otp}`
                    );

                }

            }

            res.json({

                success: true,

                message:
                    RESET_SENT_MESSAGE

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to send a reset code.",
                error
            );

        }

    }
);

app.post(
    "/api/reset-password",
    async (req, res) => {

        try {

            const userEmail =
                String(
                    req.body.email || ""
                )
                .trim()
                .toLowerCase();

            const enteredOTP =
                String(
                    req.body.otp || ""
                ).trim();

            const newPassword =
                String(
                    req.body.password || ""
                );

            if (
                !userEmail ||
                !enteredOTP ||
                !newPassword
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Email, reset code and new password are required."

                });

            }

            if (
                !STRONG_PASSWORD.test(newPassword)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Password must have at least 8 characters, including an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&)."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        otp_code,
                        otp_expiry,
                        status
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [userEmail]
                );

            const user =
                rows[0];

            const invalidCode = () =>
                res.status(400).json({

                    success: false,

                    error:
                        "This reset code is wrong or has expired. Request a new code and try again."

                });

            if (
                !user ||
                !user.otp_code ||
                String(user.status).toLowerCase() !== "active"
            ) {

                return invalidCode();

            }

            if (
                !user.otp_expiry ||
                new Date(user.otp_expiry) < new Date()
            ) {

                return invalidCode();

            }

            if (
                String(user.otp_code) !== enteredOTP
            ) {

                const attempts =
                    (resetFailedAttempts.get(userEmail) || 0) + 1;

                resetFailedAttempts.set(
                    userEmail,
                    attempts
                );

                // Too many wrong codes: cancel this code.
                if (
                    attempts >= RESET_MAX_ATTEMPTS
                ) {

                    await db.query(
                        `
                        UPDATE users
                        SET
                            otp_code = NULL,
                            otp_expiry = NULL
                        WHERE user_id = ?
                        `,
                        [user.user_id]
                    );

                    resetFailedAttempts.delete(userEmail);

                    return res.status(400).json({

                        success: false,

                        error:
                            "Too many wrong codes. Request a new reset code."

                    });

                }

                return invalidCode();

            }

            const passwordHash =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            // Entering the emailed code also proves the
            // user owns this email, so mark it verified.
            await db.query(
                `
                UPDATE users
                SET
                    password_hash = ?,
                    otp_code = NULL,
                    otp_expiry = NULL,
                    email_verified = 1,
                    updated_at = NOW()
                WHERE user_id = ?
                `,
                [
                    passwordHash,
                    user.user_id
                ]
            );

            resetFailedAttempts.delete(userEmail);

            res.json({

                success: true,

                message:
                    "Your password has been reset. You can now log in with your new password."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to reset the password.",
                error
            );

        }

    }
);

// ============================================================
// LOGIN - BIDDER / ARTIST
// ============================================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password,
                role
            } = req.body;

            const userEmail =
                String(
                    email || ""
                )
                .trim()
                .toLowerCase();

            const userPassword =
                String(
                    password || ""
                );

            const requestedRole =
                normalizeRole(role);
            if (
                !userEmail ||
                !userPassword
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Email and password are required."

                });

            }

            if (
                requestedRole &&
                !isValidRole(requestedRole)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid user role."

                });

            }

            let query = `
                SELECT
                    user_id,
                    full_name,
                    email,
                    password_hash,
                    role,
                    status,
                    email_verified
                FROM users
                WHERE LOWER(email) = ?
            `;

            const params = [
                userEmail
            ];

            if (requestedRole) {

                query += `
                    AND role = ?
                `;

                params.push(
                    requestedRole
                );

            }

            query += `
                LIMIT 1
            `;

            const [rows] =
                await db.query(
                    query,
                    params
                );

            if (
                rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Invalid email, password or role."

                });

            }

            const user =
                rows[0];

            if (
                String(
                    user.status
                ).toLowerCase() !== "active"
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Your account is inactive. Please contact the administrator."

                });

            }

            if (
                Number(
                    user.email_verified
                ) !== 1
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Please verify your email before logging in.",

                    requires_otp: true,

                    email:
                        user.email

                });

            }

            const passwordMatch =
                await bcrypt.compare(
                    userPassword,
                    user.password_hash
                );

            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Invalid email or password."

                });

            }

            res.json({

                success: true,

                message:
                    "Login successful.",

                user: {

                    user_id:
                        user.user_id,

                    id:
                        user.user_id,

                    full_name:
                        user.full_name,

                    name:
                        user.full_name,

                    email:
                        user.email,

                    role:
                        user.role,

                    status:
                        user.status

                }

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Login failed.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN LOGIN
// IMPORTANT:
// There is NO ADMIN REGISTRATION.
// An administrator must already exist in users table
// with role = 'admin'.
// ============================================================

app.post(
    "/api/admin/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            const adminEmail =
                String(
                    email || ""
                )
                .trim()
                .toLowerCase();

            const adminPassword =
                String(
                    password || ""
                );

            if (
                !adminEmail ||
                !adminPassword
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Email and password are required."

                });

            }

const [rows] =
    await db.query(
        `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.password_hash,
            u.role,
            u.status,
            u.email_verified
        FROM users u
        INNER JOIN admin_emails ae
            ON LOWER(u.email) = LOWER(ae.email)
        WHERE LOWER(u.email) = ?
          AND u.role = 'admin'
          AND u.status = 'Active'
          AND ae.status = 'Active'
        LIMIT 1
        `,
        [adminEmail]
    );
    
            // This also prevents bidder/artist accounts
            // from accessing the admin dashboard.
            if (
                rows.length === 0
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Access Denied"

                });

            }

            const admin =
                rows[0];

            if (
                String(
                    admin.status
                ).toLowerCase() !== "active"
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Access Denied"

                });

            }

            const passwordMatch =
                await bcrypt.compare(
                    adminPassword,
                    admin.password_hash
                );

            if (!passwordMatch) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Access Denied"

                });

            }

            res.json({

                success: true,

                message:
                    "Admin login successful.",

                user: {

                    user_id:
                        admin.user_id,

                    id:
                        admin.user_id,

                    full_name:
                        admin.full_name,

                    name:
                        admin.full_name,

                    email:
                        admin.email,

                    role:
                        "admin",

                    status:
                        admin.status

                }

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Admin login failed.",
                error
            );

        }

    }
);

// ============================================================
// GET ALL USERS
// ============================================================

app.get(
    "/api/users",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        u.user_id,
                        u.full_name,
                        u.email,
                        u.phone,
                        u.role,
                        ap.specialization,
                        ap.bio,
                        ap.profile_image,
                        u.status,
                        email_verified,
                        joined_date,
                        created_at,
                        updated_at
                    FROM users u
                    LEFT JOIN artist_profiles ap ON u.user_id = ap.user_id
                    ORDER BY u.user_id DESC
                    `
                );

            res.json({

                success: true,

                users:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch users.",
                error
            );

        }

    }
);

// ============================================================
// USER SUMMARY
// ============================================================

app.get(
    "/api/users/summary",
    async (req, res) => {

        try {

            const [
                totalResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS total_users
                FROM users
                `
            );

            const [
                bidderResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS total_bidders
                FROM users
                WHERE role = 'bidder'
                `
            );

            const [
                artistResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS total_artists
                FROM users
                WHERE role = 'artist'
                `
            );

            const [
                adminResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS total_admins
                FROM users
                WHERE role = 'admin'
                `
            );

            const [
                activeResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS active_users
                FROM users
                WHERE LOWER(status) = 'active'
                `
            );

            const [
                verifiedResult
            ] = await db.query(
                `
                SELECT COUNT(*) AS verified_users
                FROM users
                WHERE email_verified = 1
                `
            );

            res.json({

                success: true,

                summary: {

                    total_users:
                        Number(
                            totalResult[0].total_users
                        ),

                    total_bidders:
                        Number(
                            bidderResult[0].total_bidders
                        ),

                    total_artists:
                        Number(
                            artistResult[0].total_artists
                        ),

                    total_admins:
                        Number(
                            adminResult[0].total_admins
                        ),

                    active_users:
                        Number(
                            activeResult[0].active_users
                        ),

                    verified_users:
                        Number(
                            verifiedResult[0].verified_users
                        )

                }

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch user summary.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - GET USERS
// ============================================================

app.get(
    "/api/admin/users",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        u.user_id,
                        u.full_name,
                        u.email,
                        u.role,
                        u.status,
                        u.email_verified,
                        u.joined_date,
                        u.created_at,
                        u.updated_at,

                        CASE
                            WHEN u.role = 'artist'
                            THEN ap.artist_id
                            ELSE NULL
                        END AS artist_id,

                        CASE
                            WHEN u.role = 'bidder'
                            THEN bp.bidder_id
                            ELSE NULL
                        END AS bidder_id

                    FROM users u

                    LEFT JOIN artist_profiles ap
                        ON u.user_id = ap.user_id

                    LEFT JOIN bidder_profiles bp
                        ON u.user_id = bp.user_id

                    ORDER BY
                        u.user_id DESC
                    `
                );

            res.json({

                success: true,

                users:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch admin users.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - UPDATE USER STATUS
// ============================================================

app.put(
    "/api/admin/users/:id/status",
    async (req, res) => {

        try {

            const userId =
                Number(
                    req.params.id
                );

            const {
                status
            } = req.body;

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid user ID."

                });

            }

            const newStatus =
                String(
                    status || ""
                )
                .trim();

            if (
                ![
                    "Active",
                    "Inactive"
                ].includes(newStatus)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Status must be Active or Inactive."

                });

            }

            const [
                existing
            ] = await db.query(
                `
                SELECT
                    user_id,
                    role
                FROM users
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );

            if (
                existing.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "User not found."

                });

            }

            // Prevent accidental deactivation
            // of an administrator through this route.
            if (
                existing[0].role === "admin"
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Administrator status cannot be changed here."

                });

            }

            await db.query(
                `
                UPDATE users
                SET
                    status = ?,
                    updated_at = NOW()
                WHERE user_id = ?
                `,
                [
                    newStatus,
                    userId
                ]
            );

            res.json({

                success: true,

                message:
                    "User status updated successfully."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to update user status.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - DELETE USER
// ============================================================

app.delete(
    "/api/admin/users/:id",
    async (req, res) => {

        let connection;

        try {

            const userId =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid user ID."

                });

            }

            connection =
                await db.getConnection();

            await connection.beginTransaction();

            const [
                users
            ] = await connection.query(
                `
                SELECT
                    user_id,
                    role
                FROM users
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );

            if (
                users.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    error:
                        "User not found."

                });

            }

            // Never allow an admin to be deleted
            // through the normal user-management route.
            if (
                users[0].role === "admin"
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "Administrator accounts cannot be deleted here."

                });

            }

            // Delete dependent records first.

            await connection.query(
                `
                DELETE FROM shipping_details
                WHERE bidder_id = ?
                `,
                [userId]
            );

            await connection.query(
                `
                DELETE FROM bids
                WHERE bidder_id = ?
                `,
                [userId]
            );

            // Get artworks belonging to artist.
            const [
                artworks
            ] = await connection.query(
                `
                SELECT artwork_id
                FROM artworks
                WHERE artist_id = ?
                `,
                [userId]
            );

            for (
                const artwork of artworks
            ) {

                await connection.query(
                    `
                    DELETE FROM bids
                    WHERE artwork_id = ?
                    `,
                    [
                        artwork.artwork_id
                    ]
                );

            }

            await connection.query(
                `
                DELETE FROM artworks
                WHERE artist_id = ?
                `,
                [userId]
            );

            await connection.query(
                `
                DELETE FROM artist_profiles
                WHERE user_id = ?
                `,
                [userId]
            );

            await connection.query(
                `
                DELETE FROM bidder_profiles
                WHERE user_id = ?
                `,
                [userId]
            );

            await connection.query(
                `
                DELETE FROM users
                WHERE user_id = ?
                `,
                [userId]
            );

            await connection.commit();

            res.json({

                success: true,

                message:
                    "User deleted successfully."

            });

        } catch (error) {

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        "Rollback error:",
                        rollbackError
                    );

                }

            }

            sendError(
                res,
                500,
                "Unable to delete user.",
                error
            );

        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);
// ============================================================
// ARTIST PROFILE - GET
// ============================================================

app.get(
    "/api/artist-profile/:user_id",
    async (req, res) => {

        try {

            const userId =
                Number(req.params.user_id);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid user ID."
                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        ap.*,
                        u.full_name,
                        u.email,
                        u.status
                    FROM artist_profiles ap
                    INNER JOIN users u
                        ON ap.user_id = u.user_id
                    WHERE ap.user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Artist profile not found."
                });

            }

            res.json({
                success: true,
                profile: rows[0]
            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artist profile.",
                error
            );

        }

    }
);

// ============================================================
// ARTIST PROFILE - CREATE / UPDATE
// ============================================================

app.post(
    "/api/artist-profile",
    async (req, res) => {

        try {

            const {
                user_id,
                bio,
                phone,
                specialization,
                experience_years,
                portfolio_link,
                address,
                city,
                state,
                country,
                profile_image
            } = req.body;

            const userId =
                Number(user_id);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Valid user ID is required."
                });

            }

            const [users] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        full_name,
                        email,
                        role
                    FROM users
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "User not found."
                });

            }

            if (users[0].role !== "artist") {

                return res.status(403).json({
                    success: false,
                    error: "Only artists can have an artist profile."
                });

            }

            const [existing] =
                await db.query(
                    `
                    SELECT artist_id
                    FROM artist_profiles
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (existing.length === 0) {

                await db.query(
                    `
                    INSERT INTO artist_profiles
                    (
                        user_id,
                        full_name,
                        email,
                        bio,
                        phone,
                        specialization,
                        experience_years,
                        portfolio_link,
                        address,
                        city,
                        state,
                        country,
                        profile_image
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        users[0].full_name,
                        users[0].email,
                        bio || null,
                        phone || null,
                        specialization || null,
                        experience_years || null,
                        portfolio_link || null,
                        address || null,
                        city || null,
                        state || null,
                        country || null,
                        profile_image || null
                    ]
                );

            } else {

                await db.query(
                    `
                    UPDATE artist_profiles
                    SET
                        bio = ?,
                        phone = ?,
                        specialization = ?,
                        experience_years = ?,
                        portfolio_link = ?,
                        address = ?,
                        city = ?,
                        state = ?,
                        country = ?,
                        profile_image = COALESCE(?, profile_image)
                    WHERE user_id = ?
                    `,
                    [
                        bio || null,
                        phone || null,
                        specialization || null,
                        experience_years || null,
                        portfolio_link || null,
                        address || null,
                        city || null,
                        state || null,
                        country || null,
                        profile_image || null,
                        userId
                    ]
                );

            }

            const [profile] =
                await db.query(
                    `
                    SELECT *
                    FROM artist_profiles
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            res.json({
                success: true,
                message: "Artist profile saved successfully.",
                profile: profile[0]
            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to save artist profile.",
                error
            );

        }

    }
);

// ============================================================
// BIDDER PROFILE - GET
// ============================================================

app.get(
    "/api/bidder-profile/:user_id",
    async (req, res) => {

        try {

            const userId =
                Number(req.params.user_id);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid user ID."
                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        bp.*,
                        u.full_name,
                        u.email,
                        u.status
                    FROM bidder_profiles bp
                    INNER JOIN users u
                        ON bp.user_id = u.user_id
                    WHERE bp.user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Bidder profile not found."
                });

            }

            res.json({
                success: true,
                profile: rows[0]
            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch bidder profile.",
                error
            );

        }

    }
);

// ============================================================
// BIDDER PROFILE - CREATE / UPDATE
// ============================================================

app.post(
    "/api/bidder-profile",
    async (req, res) => {

        try {

            const {
                user_id,
                phone,
                date_of_birth,
                gender,
                address,
                city,
                state,
                country,
                pincode,
                profile_image
            } = req.body;

            const userId =
                Number(user_id);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Valid user ID is required."
                });

            }

            const [users] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        full_name,
                        email,
                        role
                    FROM users
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "User not found."
                });

            }

            if (users[0].role !== "bidder") {

                return res.status(403).json({
                    success: false,
                    error: "Only bidders can have a bidder profile."
                });

            }

            const [existing] =
                await db.query(
                    `
                    SELECT bidder_id
                    FROM bidder_profiles
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            if (existing.length === 0) {

                await db.query(
                    `
                    INSERT INTO bidder_profiles
                    (
                        user_id,
                        full_name,
                        email,
                        phone,
                        date_of_birth,
                        gender,
                        address,
                        city,
                        state,
                        country,
                        pincode,
                        profile_image
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        users[0].full_name,
                        users[0].email,
                        phone || null,
                        date_of_birth || null,
                        gender || null,
                        address || null,
                        city || null,
                        state || null,
                        country || null,
                        pincode || null,
                        profile_image || null
                    ]
                );

            } else {

                await db.query(
                    `
                    UPDATE bidder_profiles
                    SET
                        phone = ?,
                        date_of_birth = ?,
                        gender = ?,
                        address = ?,
                        city = ?,
                        state = ?,
                        country = ?,
                        pincode = ?,
                        profile_image = ?
                    WHERE user_id = ?
                    `,
                    [
                        phone || null,
                        date_of_birth || null,
                        gender || null,
                        address || null,
                        city || null,
                        state || null,
                        country || null,
                        pincode || null,
                        profile_image || null,
                        userId
                    ]
                );

            }

            const [profile] =
                await db.query(
                    `
                    SELECT *
                    FROM bidder_profiles
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [userId]
                );

            res.json({
                success: true,
                message: "Bidder profile saved successfully.",
                profile: profile[0]
            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to save bidder profile.",
                error
            );

        }

    }
);

// ============================================================
// GET ALL ARTWORKS
// ============================================================

app.get(
    "/api/artworks",
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        a.*,
                        u.full_name AS artist_name,
                        u.email AS artist_email,
                        au.status AS auction_status,
                        au.start_time AS auction_start_time,
                        au.end_time AS auction_end_time
                    FROM artworks a
                    INNER JOIN users u
                        ON a.artist_id = u.user_id
                    LEFT JOIN auctions au
                        ON a.auction_id = au.auction_id
                    WHERE LOWER(COALESCE(a.status, '')) IN
                        ('approved', 'active', 'available')
                    ORDER BY
                        a.created_at DESC,
                        a.artwork_id DESC
                    `
                );

            res.json({

                success: true,

                artworks:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artworks.",
                error
            );

        }

    }
);

// ============================================================
// GET SINGLE ARTWORK
// ============================================================

// ============================================================

app.get(
    "/api/artworks/summary",
    async (req, res) => {

        try {

            const [
                total
            ] = await db.query(
                `
                SELECT COUNT(*) AS count
                FROM artworks
                `
            );

            const [
                approved
            ] = await db.query(
                `
                SELECT COUNT(*) AS count
                FROM artworks
                WHERE LOWER(status) = 'approved'
                `
            );

            const [
                pending
            ] = await db.query(
                `
                SELECT COUNT(*) AS count
                FROM artworks
                WHERE LOWER(status) = 'pending'
                `
            );

            const [
                rejected
            ] = await db.query(
                `
                SELECT COUNT(*) AS count
                FROM artworks
                WHERE LOWER(status) = 'rejected'
                `
            );

            res.json({

                success: true,

                summary: {

                    total_artworks:
                        Number(
                            total[0].count
                        ),

                    approved_artworks:
                        Number(
                            approved[0].count
                        ),

                    pending_artworks:
                        Number(
                            pending[0].count
                        ),

                    rejected_artworks:
                        Number(
                            rejected[0].count
                        ),

selected_artwork:
    (await db.query(`
        SELECT
            a.artwork_id,
            a.title,
            a.artist_id,
            u.full_name AS artist_name,
            au.status AS auction_status,

            CASE
                WHEN au.status = 'Closed'
                     AND EXISTS (
                         SELECT 1
                         FROM bids b
                         WHERE b.auction_id = au.auction_id
                     )
                THEN 'Sold'

                WHEN au.status = 'Closed'
                     AND NOT EXISTS (
                         SELECT 1
                         FROM bids b
                         WHERE b.auction_id = au.auction_id
                     )
                THEN 'Unsold'

                ELSE 'Available'
            END AS auction_result

        FROM artworks a

        INNER JOIN users u
            ON a.artist_id = u.user_id

        INNER JOIN auctions au
            ON a.auction_id = au.auction_id

        WHERE au.status IN ('Scheduled', 'Active')

        ORDER BY
            au.start_time DESC,
            au.auction_id DESC

        LIMIT 1
    `))[0][0] || null
                }

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artwork summary.",
                error
            );

        }

    }
);

app.get(
    "/api/artworks/:id",
    async (req, res) => {

        try {

            const artworkId =
                Number(req.params.id);

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid artwork ID."
                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        a.*,
                        u.full_name AS artist_name,
                        u.email AS artist_email,

                        ap.bio AS artist_bio,
                        ap.phone AS artist_phone,
                        ap.city AS artist_city,
                        ap.state AS artist_state,
                        ap.country AS artist_country,
                        ap.profile_image AS artist_profile_image,

                        au.auction_id AS auction_ref_id,
                        au.title AS auction_title,
                        au.description AS auction_description,
                        au.status AS auction_status,
                        au.start_time AS auction_start_time,
                        au.end_time AS auction_end_time,
                        DATE(au.start_time) AS auction_start_date,
                        DATE(au.end_time) AS auction_end_date,
                        TIME(au.start_time) AS auction_start_time_only,
                        TIME(au.end_time) AS auction_end_time_only

                    FROM artworks a

                    INNER JOIN users u
                        ON a.artist_id = u.user_id

                    LEFT JOIN artist_profiles ap
                        ON a.artist_id = ap.user_id

                    LEFT JOIN auctions au
                        ON a.auction_id = au.auction_id

                    WHERE a.artwork_id = ?
                    LIMIT 1
                    `,
                    [artworkId]
                );

            if (rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Artwork not found."
                });

            }

            const artwork = rows[0];

            if (artwork.auction_ref_id) {
                artwork.auction = {
                    auction_id: artwork.auction_ref_id,
                    title: artwork.auction_title,
                    description: artwork.auction_description,
                    status: artwork.auction_status,
                    start_time: artwork.auction_start_time,
                    end_time: artwork.auction_end_time,
                    start_date: artwork.auction_start_date,
                    end_date: artwork.auction_end_date,
                    start_time_only: artwork.auction_start_time_only,
                    end_time_only: artwork.auction_end_time_only
                };
            } else {
                artwork.auction = null;
            }

            delete artwork.auction_ref_id;
            delete artwork.auction_title;
            delete artwork.auction_description;
            delete artwork.auction_status;
            delete artwork.auction_start_time;
            delete artwork.auction_end_time;
            delete artwork.auction_start_date;
            delete artwork.auction_end_date;
            delete artwork.auction_start_time_only;
            delete artwork.auction_end_time_only;

            res.json({

                success: true,

                artwork

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artwork.",
                error
            );

        }

    }
);

// ============================================================
// GET ARTWORKS BY ARTIST
// ============================================================

app.get(
    "/api/artworks/artist/:artistId",
    async (req, res) => {

        try {

            const artistId =
                Number(req.params.artistId);

            if (
                !Number.isInteger(artistId) ||
                artistId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid artist ID."
                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        a.*,
                        u.full_name AS artist_name,
                        au.title AS auction_title,
                        au.start_time,
                        au.end_time,
                        au.status AS auction_status,
                        CASE WHEN au.auction_id IS NOT NULL THEN 1 ELSE 0 END AS selected_for_auction,
                        DATE(au.start_time) AS start_date,
                        DATE(au.end_time) AS end_date,
                        TIME(au.start_time) AS auction_start_time,
                        TIME(au.end_time) AS auction_end_time
                    FROM artworks a
                    INNER JOIN users u ON a.artist_id = u.user_id
                    LEFT JOIN auctions au ON a.auction_id = au.auction_id
                    WHERE a.artist_id = ?
                    ORDER BY
                        a.created_at DESC,
                        a.artwork_id DESC
                    `,
                    [artistId]
                );

            res.json({

                success: true,

                artworks:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artist artworks.",
                error
            );

        }

    }
);

// ============================================================
// UPLOAD ARTWORK
// ============================================================

app.post(
    "/api/artworks",
    async (req, res) => {

        try {

            const {
                artist_id,
                title,
                description,
                category,
                medium,
                dimensions,
                year_created,
                starting_price,
                image_url,
                image,
                status
            } = req.body;

            const artistId =
                Number(artist_id);

            if (
                !Number.isInteger(artistId) ||
                artistId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Valid artist ID is required."
                });

            }

            if (
                !title ||
                !String(title).trim()
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Artwork title is required."
                });

            }

            const price =
                toNumber(starting_price);

            if (
                price === null ||
                price < 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Valid starting price is required."
                });

            }

            const [artists] =
                await db.query(
                    `
                    SELECT
                        user_id,
                        role,
                        status
                    FROM users
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [artistId]
                );

            if (artists.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Artist account not found."
                });

            }

            if (
                artists[0].role !== "artist"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "Only artists can upload artworks."
                });

            }

            if (
                String(
                    artists[0].status
                ).toLowerCase() !== "active"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "Artist account is inactive."
                });

            }

            /*
             * New artworks are submitted as Pending.
             * Admin must approve them before they appear
             * in the public artwork gallery.
             */

            const artworkStatus =
                status &&
                String(status).toLowerCase() === "approved"
                    ? "Pending"
                    : "Pending";

            const artworkImage =
                image_url ||
                image ||
                null;

            const [result] =
                await db.query(
                    `
                    INSERT INTO artworks
                    (
                        artist_id,
                        title,
                        description,
                        category,
                        medium,
                        dimensions,
                        year_created,
                        starting_price,
                        current_bid,
                        image_url,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `,
                    [
                        artistId,
                        String(title).trim(),
                        description || null,
                        category || null,
                        medium || null,
                        dimensions || null,
                        year_created || null,
                        price,
                        price,
                        artworkImage,
                        artworkStatus
                    ]
                );

            const [artwork] =
                await db.query(
                    `
                    SELECT
                        a.*,
                        u.full_name AS artist_name
                    FROM artworks a
                    INNER JOIN users u
                        ON a.artist_id = u.user_id
                    WHERE a.artwork_id = ?
                    LIMIT 1
                    `,
                    [result.insertId]
                );

            res.status(201).json({

                success: true,

                message:
                    "Artwork uploaded successfully and submitted for admin approval.",

                artwork:
                    artwork[0]

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Artwork upload failed.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - GET ALL ARTWORKS
// ============================================================

app.get(
    "/api/admin/artworks",
    async (req, res) => {

        try {

            const requestedStatus =
                String(req.query.status || "").trim();

            const allowedStatuses = [
                "Pending",
                "Approved",
                "Rejected"
            ];

            const statusFilter =
                allowedStatuses.includes(requestedStatus)
                    ? requestedStatus
                    : null;

            const [rows] =
                await db.query(
                    `
SELECT
    a.*,

    u.full_name AS artist_name,
    u.email AS artist_email,

    CASE
        WHEN au.status IN ('Scheduled', 'Active')
        THEN 1
        ELSE 0
    END AS selected_for_auction,

    au.status AS auction_status,

    CASE
        WHEN au.status = 'Closed'
             AND EXISTS (
                 SELECT 1
                 FROM bids sold_bid
                 WHERE sold_bid.auction_id = au.auction_id
             )
        THEN 'Sold'

        WHEN au.status = 'Closed'
             AND NOT EXISTS (
                 SELECT 1
                 FROM bids unsold_bid
                 WHERE unsold_bid.auction_id = au.auction_id
             )
        THEN 'Unsold'

        ELSE 'Available'
    END AS auction_result,

    (
        SELECT COUNT(*)
        FROM bids b
        WHERE b.artwork_id = a.artwork_id
    ) AS bid_count,

    (
        SELECT MAX(b.bid_amount)
        FROM bids b
        WHERE b.artwork_id = a.artwork_id
    ) AS highest_bid 
                    FROM artworks a

                    INNER JOIN users u
                        ON a.artist_id = u.user_id
                    LEFT JOIN auctions au ON a.auction_id = au.auction_id

                    WHERE (? IS NULL OR a.status = ?)

                    ORDER BY
                        a.created_at DESC,
                        a.artwork_id DESC
                    `,
                    [statusFilter, statusFilter]
                );

            res.json({

                success: true,

                artworks:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch admin artworks.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - UPDATE ARTWORK STATUS
// ============================================================

app.put(
    "/api/artworks/:id/status",
    async (req, res) => {
        try {
            const artworkId = Number(req.params.id);
            const status = String(req.body.status || "").trim();

            if (!Number.isInteger(artworkId) || artworkId <= 0) {
                return res.status(400).json({ success: false, error: "Invalid artwork ID." });
            }

            if (!["Pending", "Approved", "Rejected"].includes(status)) {
                return res.status(400).json({ success: false, error: "Invalid artwork status." });
            }

            const [result] = await db.query(
                `UPDATE artworks SET status = ?, updated_at = NOW() WHERE artwork_id = ?`,
                [status, artworkId]
            );

            if (!result.affectedRows) {
                return res.status(404).json({ success: false, error: "Artwork not found." });
            }

            res.json({ success: true, message: "Artwork status updated successfully." });
        } catch (error) {
            sendError(res, 500, "Unable to update artwork status.", error);
        }
    }
);

// ============================================================
// ADMIN - SELECT ARTWORK FOR AUCTION
// ============================================================

app.put(
    "/api/artworks/:id/select",
    async (req, res) => {
        try {
            const artworkId = Number(req.params.id);
            const selected = req.body.selected;
            const auctionId = Number(req.body.auction_id || req.body.auctionId || 0);

            if (!Number.isInteger(artworkId) || artworkId <= 0) {
                return res.status(400).json({ success: false, error: "Invalid artwork ID." });
            }

            // Allow the endpoint to deselect an artwork as well.
            if (selected === false || selected === 0 || String(selected).toLowerCase() === "false") {
                const [result] = await db.query(
                    `UPDATE artworks SET auction_id = NULL, updated_at = NOW() WHERE artwork_id = ?`,
                    [artworkId]
                );
                if (!result.affectedRows) {
                    return res.status(404).json({ success: false, error: "Artwork not found." });
                }
                return res.json({ success: true, message: "Artwork removed from auction successfully." });
            }

            if (!Number.isInteger(auctionId) || auctionId <= 0) {
                return res.status(400).json({ success: false, error: "Valid auction ID is required." });
            }

            const [artworks] = await db.query(
                `SELECT artwork_id, status FROM artworks WHERE artwork_id = ? LIMIT 1`,
                [artworkId]
            );
            if (!artworks.length) {
                return res.status(404).json({ success: false, error: "Artwork not found." });
            }

            const [auctions] = await db.query(
                `SELECT auction_id FROM auctions WHERE auction_id = ? LIMIT 1`,
                [auctionId]
            );
            if (!auctions.length) {
                return res.status(404).json({ success: false, error: "Auction not found." });
            }

            await db.query(
                `UPDATE artworks SET auction_id = ?, updated_at = NOW() WHERE artwork_id = ?`,
                [auctionId, artworkId]
            );

            res.json({ success: true, message: "Artwork selected for auction successfully." });
        } catch (error) {
            sendError(res, 500, "Unable to select artwork for auction.", error);
        }
    }
);

// ============================================================
// ADMIN - APPROVE ARTWORK
// ============================================================

app.put(
    "/api/admin/artworks/:id/approve",
    async (req, res) => {

        try {

            const artworkId =
                Number(req.params.id);

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid artwork ID."
                });

            }

            const [existing] =
                await db.query(
                    `
                    SELECT
                        artwork_id,
                        status
                    FROM artworks
                    WHERE artwork_id = ?
                    LIMIT 1
                    `,
                    [artworkId]
                );

            if (existing.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Artwork not found."
                });

            }

            await db.query(
                `
                UPDATE artworks
                SET
                    status = 'Approved',
                    updated_at = NOW()
                WHERE artwork_id = ?
                `,
                [artworkId]
            );

            res.json({

                success: true,

                message:
                    "Artwork approved successfully."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to approve artwork.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - REJECT ARTWORK
// ============================================================

app.put(
    "/api/admin/artworks/:id/reject",
    async (req, res) => {

        try {

            const artworkId =
                Number(req.params.id);

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid artwork ID."
                });

            }

            const [existing] =
                await db.query(
                    `
                    SELECT artwork_id
                    FROM artworks
                    WHERE artwork_id = ?
                    LIMIT 1
                    `,
                    [artworkId]
                );

            if (existing.length === 0) {

                return res.status(404).json({
                    success: false,
                    error: "Artwork not found."
                });

            }

            await db.query(
                `
                UPDATE artworks
                SET
                    status = 'Rejected',
                    updated_at = NOW()
                WHERE artwork_id = ?
                `,
                [artworkId]
            );

            res.json({

                success: true,

                message:
                    "Artwork rejected successfully."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to reject artwork.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - DELETE ARTWORK
// ============================================================

app.delete(
    "/api/admin/artworks/:id",
    async (req, res) => {

        let connection;

        try {

            const artworkId =
                Number(req.params.id);

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid artwork ID."
                });

            }

            connection =
                await db.getConnection();

            await connection.beginTransaction();

            const [existing] =
                await connection.query(
                    `
                    SELECT artwork_id
                    FROM artworks
                    WHERE artwork_id = ?
                    LIMIT 1
                    `,
                    [artworkId]
                );

            if (existing.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    error: "Artwork not found."
                });

            }

            // Remove bids connected to the artwork first.
            await connection.query(
                `
                DELETE FROM bids
                WHERE artwork_id = ?
                `,
                [artworkId]
            );

            await connection.query(
                `
                DELETE FROM artworks
                WHERE artwork_id = ?
                `,
                [artworkId]
            );

            await connection.commit();

            res.json({

                success: true,

                message:
                    "Artwork deleted successfully."

            });

        } catch (error) {

            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Rollback error:",
                        rollbackError
                    );
                }

            }

            sendError(
                res,
                500,
                "Unable to delete artwork.",
                error
            );

        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// ============================================================
// ARTWORK SUMMARY
// ============================================================
// AUCTION HELPER
// Automatically closes auctions whose end time has passed.
// ============================================================

async function autoCloseExpiredAuctions() {

    try {

        // Automatically start scheduled auctions
        // when their start time has arrived.
        await db.query(
            `
            UPDATE auctions
            SET
                status = 'Active',
                updated_at = NOW()
            WHERE status = 'Scheduled'
              AND start_time IS NOT NULL
              AND start_time <= NOW()
            `
        );


        // Automatically close active auctions
        // when their end time has arrived.
        await db.query(
            `
            UPDATE auctions
            SET
                status = 'Closed',
                updated_at = NOW()
            WHERE status = 'Active'
              AND end_time IS NOT NULL
              AND end_time <= NOW()
            `
        );

    } catch (error) {

        console.error(
            "Auto-close auction error:",
            error.message
        );

    }

}
// ============================================================
// GET CURRENT AUCTION
// ============================================================

app.get(
    "/api/auction/current",
    async (req, res) => {

        try {

            await autoCloseExpiredAuctions();

            const requestedArtworkId = req.query.artwork_id
                ? Number(req.query.artwork_id)
                : null;

            let query = `
                SELECT
                    a.auction_id,
                    a.title,
                    a.description,
                    a.start_time,
                    a.end_time,
                    a.status,
                    aw.artwork_id,
                    aw.title AS artwork_name,
                    u.full_name AS artist_name,
                    COALESCE(MAX(b.bid_amount), aw.current_bid, aw.starting_price, 0) AS current_bid,
                    (SELECT u2.full_name
                     FROM bids hb
                     INNER JOIN users u2 ON hb.bidder_id = u2.user_id
                     WHERE hb.auction_id = a.auction_id
                       AND hb.artwork_id = aw.artwork_id
                     ORDER BY hb.bid_amount DESC, hb.bid_time ASC
                     LIMIT 1) AS highest_bidder
                FROM auctions a
                INNER JOIN artworks aw ON aw.auction_id = a.auction_id
                INNER JOIN users u ON aw.artist_id = u.user_id
                LEFT JOIN bids b ON b.auction_id = a.auction_id
                                AND b.artwork_id = aw.artwork_id
                WHERE a.status = 'Active'
            `;

            const params = [];

            if (Number.isInteger(requestedArtworkId) && requestedArtworkId > 0) {
                query += ` AND aw.artwork_id = ? `;
                params.push(requestedArtworkId);
            }

            query += `
                GROUP BY
                    a.auction_id, a.title, a.description, a.start_time, a.end_time,
                    a.status, aw.artwork_id, aw.title, aw.current_bid, aw.starting_price, u.full_name
                ORDER BY a.start_time DESC, a.auction_id DESC
                LIMIT 1
            `;

            const [rows] = await db.query(query, params);

            if (rows.length === 0) {
                return res.json({
                    success: true,
                    auction: null,
                    message: requestedArtworkId
                        ? "This artwork is not part of the current active auction."
                        : "No active auction is currently available."
                });
            }

            res.json({ success: true, auction: rows[0] });

        } catch (error) {

            sendError(res, 500, "Unable to fetch current auction.", error);

        }

    }
);

// ============================================================
// ADMIN - GET CURRENT AUCTION
// ============================================================

app.get(
    "/api/admin/auction/current",
    async (req, res) => {

        try {

            await autoCloseExpiredAuctions();

            const [rows] =
                await db.query(
                    `
                    SELECT
                        a.*,
                        MIN(aw.artwork_id) AS artwork_id,
                        MIN(aw.title) AS artwork_name,
                        MIN(artist.full_name) AS artist_name,
                        DATE(a.start_time) AS start_date,
                        DATE(a.end_time) AS end_date,
                        TIME(a.start_time) AS start_time_only,
                        TIME(a.end_time) AS end_time_only,

                        COUNT(
                            DISTINCT aw.artwork_id
                        ) AS artwork_count,

                        COUNT(
                            DISTINCT b.bid_id
                        ) AS bid_count,

                        COALESCE(
                            MAX(b.bid_amount),
                            0
                        ) AS highest_bid,
                        COALESCE(MAX(b.bid_amount),0) AS current_bid,
                        COUNT(DISTINCT b.bid_id) AS total_bids,
                        (SELECT u2.full_name FROM bids hb INNER JOIN users u2 ON hb.bidder_id=u2.user_id WHERE hb.auction_id=a.auction_id ORDER BY hb.bid_amount DESC, hb.bid_time ASC LIMIT 1) AS highest_bidder

                    FROM auctions a

                    LEFT JOIN artworks aw
                        ON aw.auction_id = a.auction_id

                    LEFT JOIN bids b ON b.auction_id = a.auction_id
                    LEFT JOIN users artist ON aw.artist_id = artist.user_id

                    GROUP BY
                        a.auction_id

                    ORDER BY
                        a.auction_id DESC
                    `
                );

            res.json({

                success: true,

                auctions:
                    rows,

                auction:
                    (rows[0] || null)

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch admin auctions.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - CREATE AUCTION
// ============================================================

// ------------------------------------------------------------
// Convert a JS Date into a MySQL-compatible DATETIME string
// (MySQL DATETIME columns reject ISO strings that contain
// "T", "Z" or milliseconds, which is what toISOString() and
// raw "YYYY-MM-DDTHH:MM" strings produce).
// ------------------------------------------------------------

function toMySQLDateTime(date) {

    const pad = n => String(n).padStart(2, "0");

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );

}

app.post(
    "/api/admin/auctions",
    async (req, res) => {

        try {

            let { title, description, start_time, end_time, status, artwork_id, start_date } = req.body;

            if (artwork_id) {

                const [art] = await db.query(
                    `SELECT title, description FROM artworks WHERE artwork_id = ? LIMIT 1`,
                    [Number(artwork_id)]
                );

                if (!art.length) {
                    return res.status(404).json({ success: false, error: "Artwork not found." });
                }

                title = title || art[0].title;
                description = description || art[0].description;
// Prevent an artwork that has already been sold
// from being auctioned again.
const [soldArtwork] = await db.query(
    `
    SELECT
        au.auction_id
    FROM artworks aw

    INNER JOIN auctions au
        ON aw.auction_id = au.auction_id

    INNER JOIN bids b
        ON b.auction_id = au.auction_id

    WHERE aw.artwork_id = ?
      AND au.status = 'Closed'

    LIMIT 1
    `,
    [Number(artwork_id)]
);

if (soldArtwork.length > 0) {

    return res.status(409).json({
        success: false,
        error:
            "This artwork has already been sold and cannot be auctioned again."
    });

}
                // Combine separate date + time fields (as sent by
                // manageauctions.html) into one parseable string.
                if (start_date && start_time && !String(start_time).includes("T")) {
                    start_time = `${start_date}T${start_time}`;
                }

            }

            if (
                !title ||
                !String(title).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Auction title is required."

                });

            }

            if (!start_time) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Auction start time is required."

                });

            }

            const startDate =
                new Date(start_time);

            if (
                Number.isNaN(
                    startDate.getTime()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid auction start date."

                });

            }

            // If no explicit end_time was supplied, default to
            // exactly 24 hours after the start time.
            let endDate;

            if (end_time) {

                endDate = new Date(end_time);

                if (
                    Number.isNaN(
                        endDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        error:
                            "Invalid auction end date."

                    });

                }

            } else {

                endDate =
                    new Date(
                        startDate.getTime() +
                        24 * 60 * 60 * 1000
                    );

            }

            // Auction start must never be in the past (IST).
            if (startDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: "Auction start date/time cannot be in the past. Please select the current or a future IST date/time."
                });
            }

            if (
                endDate <= startDate
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "End time must be after start time."

                });

            }

            let auctionStatus =
                String(
                    status || "Scheduled"
                )
                .trim();

            if (
                ![
                    "Scheduled",
                    "Active",
                    "Closed"
                ].includes(auctionStatus)
            ) {

                auctionStatus =
                    "Scheduled";

            }

            // If another auction is active,
            // do not create another active auction.
            if (
                auctionStatus === "Active"
            ) {

                const [
                    active
                ] = await db.query(
                    `
                    SELECT auction_id
                    FROM auctions
                    WHERE status = 'Active'
                    LIMIT 1
                    `
                );

                if (active.length > 0) {

                    return res.status(409).json({

                        success: false,

                        error:
                            "Another auction is already active."

                    });

                }

            }

            // ---- THE FIX: store real MySQL DATETIME strings ----
            const startTimeSQL =
                toMySQLDateTime(startDate);

            const endTimeSQL =
                toMySQLDateTime(endDate);

            const [result] =
                await db.query(
                    `
                    INSERT INTO auctions
                    (
                        title,
                        description,
                        start_time,
                        end_time,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (?, ?, ?, ?, ?, NOW(), NOW())
                    `,
                    [
                        String(title).trim(),
                        description || null,
                        startTimeSQL,
                        endTimeSQL,
                        auctionStatus
                    ]
                );

            if (artwork_id) {

                await db.query(
                    `UPDATE artworks SET auction_id = ? WHERE artwork_id = ?`,
                    [result.insertId, Number(artwork_id)]
                );

            }

            const [auction] =
                await db.query(
                    `
                    SELECT *
                    FROM auctions
                    WHERE auction_id = ?
                    LIMIT 1
                    `,
                    [result.insertId]
                );

            res.status(201).json({

                success: true,

                message:
                    "Auction created successfully.",

                auction:
                    auction[0]

            });

        } catch (error) {

            /*
             * TEMPORARY DIAGNOSTIC CHANGE:
             * Surface the real database/JS error message
             * to the browser instead of a generic string,
             * so the exact cause of a failed auction
             * creation is visible without having to check
             * the terminal. Safe to revert later by
             * changing this back to a fixed string.
             */

            sendError(
                res,
                500,
                error.message ||
                    "Unable to create auction.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - START AUCTION
// ============================================================

app.put(
    "/api/admin/auctions/:id/start",
    async (req, res) => {

        try {

            const auctionId =
                Number(req.params.id);

            if (
                !Number.isInteger(auctionId) ||
                auctionId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid auction ID."

                });

            }

            const [
                existingActive
            ] = await db.query(
                `
                SELECT auction_id
                FROM auctions
                WHERE status = 'Active'
                  AND auction_id <> ?
                LIMIT 1
                `,
                [auctionId]
            );

            if (
                existingActive.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    error:
                        "Another auction is already active."

                });

            }

            const [result] =
                await db.query(
                    `
                    UPDATE auctions
                    SET
                        status = 'Active',
                        start_time =
                            CASE
                                WHEN start_time IS NULL
                                THEN NOW()
                                ELSE start_time
                            END,
                        updated_at = NOW()
                    WHERE auction_id = ?
                      AND status <> 'Closed'
                    `,
                    [auctionId]
                );

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Auction not found or already closed."

                });

            }

            res.json({

                success: true,

                message:
                    "Auction started successfully."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to start auction.",
                error
            );

        }

    }
);

// ============================================================
// ADMIN - CLOSE AUCTION
// ============================================================

app.put(
    "/api/admin/auctions/:id/close",
    async (req, res) => {

        try {

            const auctionId =
                Number(req.params.id);

            if (
                !Number.isInteger(auctionId) ||
                auctionId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid auction ID."

                });

            }

            const [result] =
                await db.query(
                    `
                    UPDATE auctions
                    SET
                        status = 'Closed',
                        updated_at = NOW()
                    WHERE auction_id = ?
                    `,
                    [auctionId]
                );

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Auction not found."

                });

            }

            res.json({

                success: true,

                message:
                    "Auction closed successfully."

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to close auction.",
                error
            );

        }

    }
);

// ============================================================
// GET ALL BIDS
// ============================================================

app.get(
    "/api/bids",
    async (req, res) => {

        try {

const [rows] =
    await db.query(
        `
        SELECT
            b.*,

            u.full_name AS bidder_name,
            u.email AS bidder_email,

            aw.title AS artwork_name,
            aw.image_url AS artwork_image,

            ar.full_name AS artist_name,

            au.title AS auction_title,
            au.status AS auction_status,

            b.bid_time AS bid_datetime

        FROM bids b

        INNER JOIN users u
            ON b.bidder_id = u.user_id

        INNER JOIN artworks aw
            ON b.artwork_id = aw.artwork_id

        INNER JOIN users ar
            ON aw.artist_id = ar.user_id

        LEFT JOIN auctions au
            ON b.auction_id = au.auction_id

        ORDER BY
            b.bid_time DESC,
            b.bid_id DESC
        `
    );
            res.json({

                success: true,

                bids:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch bids.",
                error
            );

        }

    }
);

// ============================================================
// GET BIDS BY USER
// ============================================================

app.get(
    "/api/bids/user/:userId",
    async (req, res) => {

        try {

            const userId =
                Number(req.params.userId);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid user ID."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        b.*,

                        aw.title AS artwork_title,
                        aw.image_url AS artwork_image,
                        aw.status AS artwork_status,

                        u.full_name AS artist_name,

                        au.title AS auction_title,
                        au.status AS auction_status,
                        au.end_time AS auction_end_time,
                        COALESCE((SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.auction_id = b.auction_id), aw.current_bid, aw.starting_price) AS current_bid,
                        CASE WHEN au.status = 'Closed' AND b.bid_amount = (SELECT MAX(b3.bid_amount) FROM bids b3 WHERE b3.auction_id = b.auction_id) THEN 1 ELSE 0 END AS is_winner

                    FROM bids b

                    INNER JOIN artworks aw
                        ON b.artwork_id =
                           aw.artwork_id

                    INNER JOIN users u
                        ON aw.artist_id =
                           u.user_id

                    LEFT JOIN auctions au
                        ON b.auction_id =
                           au.auction_id

                    WHERE b.bidder_id = ?

                    ORDER BY
                        b.bid_time DESC,
                        b.bid_id DESC
                    `,
                    [userId]
                );

            res.json({

                success: true,

                bids:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch user bids.",
                error
            );

        }

    }
);

// ============================================================
// GET BIDS BY ARTWORK
// ============================================================

app.get(
    "/api/bids/artwork/:artworkId",
    async (req, res) => {

        try {

            const artworkId =
                Number(req.params.artworkId);

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid artwork ID."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        b.bid_id,
                        b.bidder_id,
                        b.artwork_id,
                        b.auction_id,
                        b.bid_amount,
                        b.bid_time,

                        u.full_name AS bidder_name

                    FROM bids b

                    INNER JOIN users u
                        ON b.bidder_id =
                           u.user_id

                    WHERE b.artwork_id = ?

                    ORDER BY
                        b.bid_amount DESC,
                        b.bid_time DESC
                    `,
                    [artworkId]
                );

            res.json({

                success: true,

                bids:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch artwork bids.",
                error
            );

        }

    }
);

// ============================================================
// PLACE BID
// ============================================================

app.post(
    "/api/bids",
    async (req, res) => {

        let connection;

        try {

            const {
                bidder_id,
                user_id,
                artwork_id,
                auction_id,
                bid_amount
            } = req.body;

            const bidderId =
                Number(
                    bidder_id ||
                    user_id
                );

            const artworkId =
                Number(
                    artwork_id
                );

            const amount =
                toNumber(
                    bid_amount
                );

            if (
                !Number.isInteger(bidderId) ||
                bidderId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Valid bidder ID is required."

                });

            }

            if (
                !Number.isInteger(artworkId) ||
                artworkId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Valid artwork ID is required."

                });

            }

            if (
                amount === null ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Bid amount must be greater than zero."

                });

            }

            connection =
                await db.getConnection();

            await connection.beginTransaction();

            // ------------------------------------------------
            // CHECK BIDDER
            // ------------------------------------------------

            const [
                bidders
            ] = await connection.query(
                `
                SELECT
                    user_id,
                    role,
                    status,
                    email_verified
                FROM users
                WHERE user_id = ?
                LIMIT 1
                `,
                [bidderId]
            );

            if (
                bidders.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    error:
                        "Bidder account not found."

                });

            }

            if (
                bidders[0].role !== "bidder"
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "Only bidders can place bids."

                });

            }

            if (
                String(
                    bidders[0].status
                ).toLowerCase() !== "active"
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "Your account is inactive."

                });

            }

            if (
                Number(
                    bidders[0].email_verified
                ) !== 1
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "Please verify your email before placing a bid."

                });

            }

            // ------------------------------------------------
            // CHECK ARTWORK
            // ------------------------------------------------

            const [
                artworks
            ] = await connection.query(
                `
                SELECT
                    artwork_id,
                    artist_id,
                    title,
                    starting_price,
                    current_bid,
                    status,
                    auction_id
                FROM artworks
                WHERE artwork_id = ?
                FOR UPDATE
                `,
                [artworkId]
            );

            if (
                artworks.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    error:
                        "Artwork not found."

                });

            }

            const artwork =
                artworks[0];

            if (
                String(
                    artwork.status
                ).toLowerCase() !==
                "approved"
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "This artwork is not available for bidding."

                });

            }

            if (
                Number(
                    artwork.artist_id
                ) === bidderId
            ) {

                await connection.rollback();

                return res.status(403).json({

                    success: false,

                    error:
                        "Artists cannot bid on their own artwork."

                });

            }

            // ------------------------------------------------
            // DETERMINE AUCTION
            // ------------------------------------------------

            let auctionId =
                Number(
                    auction_id ||
                    artwork.auction_id ||
                    0
                );

            let auction = null;

            if (auctionId > 0) {

                const [
                    auctions
                ] = await connection.query(
                    `
                    SELECT
                        auction_id,
                        title,
                        status,
                        start_time,
                        end_time
                    FROM auctions
                    WHERE auction_id = ?
                    LIMIT 1
                    `,
                    [auctionId]
                );

                if (
                    auctions.length > 0
                ) {

                    auction =
                        auctions[0];

                }

            }

            // If artwork does not specify an auction,
            // automatically use the current active auction.
            if (!auction) {

                const [
                    activeAuctions
                ] = await connection.query(
                    `
                    SELECT
                        auction_id,
                        title,
                        status,
                        start_time,
                        end_time
                    FROM auctions
                    WHERE status = 'Active'
                    ORDER BY
                        start_time DESC,
                        auction_id DESC
                    LIMIT 1
                    `
                );

                if (
                    activeAuctions.length > 0
                ) {

                    auction =
                        activeAuctions[0];

                    auctionId =
                        auction.auction_id;

                }

            }

            if (!auction) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    error:
                        "There is no active auction available for this artwork."

                });

            }

            if (
                String(
                    auction.status
                ).toLowerCase() !==
                "active"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    error:
                        "This auction is not currently active."

                });

            }

            if (
                auction.start_time &&
                new Date(
                    auction.start_time
                ) > new Date()
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    error:
                        "This auction has not started yet."

                });

            }

            if (
                auction.end_time &&
                new Date(
                    auction.end_time
                ) <= new Date()
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    error:
                        "This auction has already ended."

                });

            }

            // ------------------------------------------------
            // CHECK HIGHEST CURRENT BID
            // ------------------------------------------------

            const [
                highest
            ] = await connection.query(
                `
                SELECT
                    COALESCE(
                        MAX(bid_amount),
                        0
                    ) AS highest_bid
                FROM bids
                WHERE artwork_id = ?
                `,
                [artworkId]
            );

            const highestBid =
                Number(
                    highest[0].highest_bid || 0
                );

            const startingPrice =
                Number(
                    artwork.starting_price || 0
                );

            const currentBid =
                Math.max(
                    highestBid,
                    Number(
                        artwork.current_bid || 0
                    ),
                    startingPrice
                );

            if (
                amount <= currentBid
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    error:
                        `Your bid must be greater than the current bid of ₹${currentBid}.`

                });

            }

            // ------------------------------------------------
            // INSERT BID
            // ------------------------------------------------

            const [
                result
            ] = await connection.query(
                `
                INSERT INTO bids
                (
                    bidder_id,
                    artwork_id,
                    auction_id,
                    bid_amount,
                    bid_time
                )
                VALUES
                (?, ?, ?, ?, NOW())
                `,
                [
                    bidderId,
                    artworkId,
                    auctionId,
                    amount
                ]
            );

            // ------------------------------------------------
            // UPDATE CURRENT ARTWORK BID
            // ------------------------------------------------

            await connection.query(
                `
                UPDATE artworks
                SET
                    current_bid = ?,
                    auction_id = ?,
                    updated_at = NOW()
                WHERE artwork_id = ?
                `,
                [
                    amount,
                    auctionId,
                    artworkId
                ]
            );

            await connection.commit();

            res.status(201).json({

                success: true,

                message:
                    "Bid placed successfully.",

                bid: {

                    bid_id:
                        result.insertId,

                    bidder_id:
                        bidderId,

                    artwork_id:
                        artworkId,

                    auction_id:
                        auctionId,

                    bid_amount:
                        amount

                }

            });

        } catch (error) {

            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Rollback error:",
                        rollbackError
                    );
                }

            }

            sendError(
                res,
                500,
                "Unable to place bid.",
                error
            );

        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// ============================================================
// SHIPPING - GET
// ============================================================

app.get(
    "/api/shipping/:bidderId",
    async (req, res) => {

        try {

            const bidderId =
                Number(req.params.bidderId);

            if (
                !Number.isInteger(bidderId) ||
                bidderId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid bidder ID."

                });

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        sd.*,

                        b.bid_id,
                        b.artwork_id,
                        b.bid_amount,

                        aw.title AS artwork_title,
                        aw.image_url AS artwork_image

                    FROM shipping_details sd

                    LEFT JOIN bids b
                        ON sd.bid_id = b.bid_id

                    LEFT JOIN artworks aw
                        ON b.artwork_id =
                           aw.artwork_id

                    WHERE sd.bidder_id = ?

                    ORDER BY
                        sd.created_at DESC,
                        sd.shipping_id DESC
                    `,
                    [bidderId]
                );

            res.json({

                success: true,

                shipping:
                    (rows[0] || null),

                shipping_records:
                    rows

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to fetch shipping details.",
                error
            );

        }

    }
);

// ============================================================
// SHIPPING - SAVE
// ============================================================

app.post(
    "/api/shipping",
    async (req, res) => {

        try {

            const {
                bidder_id,
                user_id,
                bid_id,
                full_name,
                phone,
                email,
                address,
                city,
                state,
                country,
                pincode,
                postal_code
            } = req.body;

            const bidderId =
                Number(
                    bidder_id ||
                    user_id
                );

            let bidId =
                Number(
                    bid_id
                );

            const finalPincode =
                pincode ||
                postal_code ||
                null;

            if (
                !Number.isInteger(bidderId) ||
                bidderId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Valid bidder ID is required."

                });

            }

            if (!Number.isInteger(bidId) || bidId <= 0) {
                const [winnerBids] = await db.query(`
                    SELECT b.bid_id
                    FROM bids b
                    INNER JOIN auctions a ON b.auction_id = a.auction_id
                    WHERE b.bidder_id = ?
                      AND a.status = 'Closed'
                      AND b.bid_amount = (SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.auction_id = b.auction_id)
                    ORDER BY b.bid_time DESC, b.bid_id DESC
                    LIMIT 1
                `, [bidderId]);
                if (winnerBids.length) {
                    bidId = Number(winnerBids[0].bid_id);
                } else {
                    return res.status(400).json({ success:false, error:"A winning bid is required for shipping details." });
                }
            }

            if (
                !full_name ||
                !String(full_name).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Full name is required."

                });

            }

            if (
                !address ||
                !String(address).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Address is required."

                });

            }

            if (
                !city ||
                !String(city).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "City is required."

                });

            }

            if (
                !state ||
                !String(state).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "State is required."

                });

            }

            if (
                !finalPincode ||
                !String(finalPincode).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Pincode is required."

                });

            }

            const [
                bids
            ] = await db.query(
                `
                SELECT
                    bid_id,
                    bidder_id
                FROM bids
                WHERE bid_id = ?
                LIMIT 1
                `,
                [bidId]
            );

            if (
                bids.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Bid not found."

                });

            }

            if (
                Number(
                    bids[0].bidder_id
                ) !== bidderId
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "This bid does not belong to the selected bidder."

                });

            }

            const [
                existing
            ] = await db.query(
                `
                SELECT
                    shipping_id
                FROM shipping_details
                WHERE bid_id = ?
                LIMIT 1
                `,
                [bidId]
            );

            if (
                existing.length > 0
            ) {

                await db.query(
                    `
                    UPDATE shipping_details
                    SET
                        full_name = ?,
                        phone = ?,
                        email = ?,
                        address = ?,
                        city = ?,
                        state = ?,
                        country = ?,
                        pincode = ?,
                        updated_at = NOW()
                    WHERE bid_id = ?
                    `,
                    [
                        String(
                            full_name
                        ).trim(),

                        phone || null,

                        email || null,

                        String(
                            address
                        ).trim(),

                        String(
                            city
                        ).trim(),

                        String(
                            state
                        ).trim(),

                        country || null,

                        String(
                            finalPincode
                        ).trim(),

                        bidId
                    ]
                );

            } else {

                await db.query(
                    `
                    INSERT INTO shipping_details
                    (
                        bidder_id,
                        bid_id,
                        full_name,
                        phone,
                        email,
                        address,
                        city,
                        state,
                        country,
                        pincode,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `,
                    [
                        bidderId,
                        bidId,

                        String(
                            full_name
                        ).trim(),

                        phone || null,

                        email || null,

                        String(
                            address
                        ).trim(),

                        String(
                            city
                        ).trim(),

                        String(
                            state
                        ).trim(),

                        country || null,

                        String(
                            finalPincode
                        ).trim()
                    ]
                );

            }

            const [
                shipping
            ] = await db.query(
                `
                SELECT *
                FROM shipping_details
                WHERE bid_id = ?
                LIMIT 1
                `,
                [bidId]
            );

            res.json({

                success: true,

                message:
                    "Shipping details saved successfully.",

                shipping:
                    shipping[0]

            });

        } catch (error) {

            sendError(
                res,
                500,
                "Unable to save shipping details.",
                error
            );

        }

    }
);
// ============================================================
// ADMIN / GENERAL DASHBOARD
// ============================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        try {

            await autoCloseExpiredAuctions();

            // ---------------------------------------------
            // TOTAL USERS
            // ---------------------------------------------

            const [userCounts] =
                await db.query(`
                    SELECT
                        COUNT(*) AS total_users,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN LOWER(role) = 'artist'
                                    THEN 1
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS total_artists,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN LOWER(role) = 'bidder'
                                    THEN 1
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS total_bidders

                    FROM users
                `);


            // ---------------------------------------------
            // TOTAL ARTWORKS
            // ---------------------------------------------

            const [artworkCounts] =
                await db.query(`
                    SELECT
                        COUNT(*) AS total_artworks
                    FROM artworks
                `);


            // ---------------------------------------------
            // TOTAL BIDS
            // ---------------------------------------------

            const [bidCounts] =
                await db.query(`
                    SELECT
                        COUNT(*) AS total_bids,
                        COALESCE(
                            MAX(bid_amount),
                            0
                        ) AS highest_bid
                    FROM bids
                `);


            // ---------------------------------------------
            // ACTIVE AUCTIONS
            // ---------------------------------------------

            const [auctionCounts] =
                await db.query(`
                    SELECT
                        COUNT(*) AS active_auctions
                    FROM auctions
                    WHERE LOWER(status) = 'active'
                `);


            // ---------------------------------------------
            // CURRENT ACTIVE AUCTION
            // ---------------------------------------------

            const [currentAuction] =
                await db.query(`
                    SELECT

                        a.auction_id,

                        a.title AS auction_title,

                        a.description,

                        a.start_time,

                        a.end_time,

                        a.status,

                        aw.artwork_id,

                        aw.title AS artwork_name,

                        artist.full_name AS artist_name,

                        COALESCE(
                            (
                                SELECT MAX(b.bid_amount)
                                FROM bids b
                                WHERE b.auction_id =
                                      a.auction_id
                            ),
                            aw.current_bid,
                            aw.starting_price,
                            0
                        ) AS highest_bid

                    FROM auctions a

                    LEFT JOIN artworks aw
                        ON aw.auction_id =
                           a.auction_id

                    LEFT JOIN users artist
                        ON aw.artist_id =
                           artist.user_id

                    WHERE LOWER(a.status) = 'active'

                    ORDER BY
                        a.start_time DESC,
                        a.auction_id DESC

                    LIMIT 1
                `);


            // ---------------------------------------------
            // PREPARE CURRENT AUCTION
            // ---------------------------------------------

            let auction = null;

            if (currentAuction.length > 0) {

                const current =
                    currentAuction[0];

                let duration = null;

                if (
                    current.start_time &&
                    current.end_time
                ) {

                    duration =
                        Math.round(
                            (
                                new Date(
                                    current.end_time
                                ).getTime()
                                -
                                new Date(
                                    current.start_time
                                ).getTime()
                            )
                            /
                            60000
                        );

                }


                auction = {

                    auction_id:
                        current.auction_id,

                    artwork_id:
                        current.artwork_id,

                    artwork_name:
                        current.artwork_name ||
                        "No Artwork Selected",

                    artist_name:
                        current.artist_name ||
                        "Unknown Artist",

                    status:
                        current.status,

                    start_time:
                        current.start_time,

                    end_time:
                        current.end_time,

                    highest_bid:
                        Number(
                            current.highest_bid || 0
                        ),

                    auction_duration:
                        duration

                };

            }


            // ---------------------------------------------
            // SEND RESPONSE
            // ---------------------------------------------

            res.json({

                success: true,

                users: {

                    total:
                        Number(
                            userCounts[0]
                                .total_users || 0
                        ),

                    artists:
                        Number(
                            userCounts[0]
                                .total_artists || 0
                        ),

                    bidders:
                        Number(
                            userCounts[0]
                                .total_bidders || 0
                        )

                },

                artworks: {

                    total:
                        Number(
                            artworkCounts[0]
                                .total_artworks || 0
                        )

                },

                bids: {

                    total:
                        Number(
                            bidCounts[0]
                                .total_bids || 0
                        ),

                    highest:
                        Number(
                            bidCounts[0]
                                .highest_bid || 0
                        )

                },

                auctions: {

                    active:
                        Number(
                            auctionCounts[0]
                                .active_auctions || 0
                        )

                },

                // -----------------------------------------
                // Fields used by admindashboard.html
                // -----------------------------------------

                total_users:
                    Number(
                        userCounts[0]
                            .total_users || 0
                    ),

                total_artists:
                    Number(
                        userCounts[0]
                            .total_artists || 0
                    ),

                total_bidders:
                    Number(
                        userCounts[0]
                            .total_bidders || 0
                    ),

                total_artworks:
                    Number(
                        artworkCounts[0]
                            .total_artworks || 0
                    ),

                total_bids:
                    Number(
                        bidCounts[0]
                            .total_bids || 0
                    ),

                active_auctions:
                    Number(
                        auctionCounts[0]
                            .active_auctions || 0
                    ),

                highest_bid:
                    auction
                        ? auction.highest_bid
                        : Number(
                            bidCounts[0]
                                .highest_bid || 0
                        ),

                current_artwork:
                    auction
                        ? auction.artwork_name
                        : "No Active Auction",

                auction_status:
                    auction
                        ? auction.status
                        : "No Active Auction",

                auction_duration:
                    auction
                        ? auction.auction_duration
                        : null,

                current_auction:
                    auction

            });

        }

        catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );

            sendError(
                res,
                500,
                "Unable to load dashboard.",
                error
            );

        }

    }
);
// ============================================================
// PAYMENT / BILLING
// Records a payment transaction for a bidder's winning bid.
// This is a database transaction record, not a live payment gateway.
// ============================================================

app.get(
    "/api/payment/:bidderId",
    async (req, res) => {
        try {
            const bidderId = Number(req.params.bidderId);
            const requestedBidId = Number(req.query.bid_id || 0);
            if (!Number.isInteger(bidderId) || bidderId <= 0) {
                return res.status(400).json({ success: false, error: "Invalid bidder ID." });
            }

            const [rows] = await db.query(`
                SELECT
                    p.*,
                    b.bid_amount,
                    aw.title AS artwork_name
                FROM payment_transactions p
                INNER JOIN bids b ON p.bid_id = b.bid_id
                INNER JOIN artworks aw ON b.artwork_id = aw.artwork_id
                WHERE p.bidder_id = ?
                  AND (? = 0 OR p.bid_id = ?)
                ORDER BY p.paid_at DESC, p.transaction_id DESC
            `, [bidderId, requestedBidId, requestedBidId]);

            res.json({ success: true, payments: rows });
        } catch (error) {
            sendError(res, 500, "Unable to fetch payment transactions.", error);
        }
    }
);

app.post(
    "/api/payment",
    async (req, res) => {
        try {
            const bidderId = Number(req.body.bidder_id);
            const bidId = Number(req.body.bid_id);
            const paymentMethod = String(req.body.payment_method || "").trim();

            if (!Number.isInteger(bidderId) || bidderId <= 0 || !Number.isInteger(bidId) || bidId <= 0) {
                return res.status(400).json({ success: false, error: "Valid bidder and bid IDs are required." });
            }

            if (!["UPI", "Card", "Net Banking"].includes(paymentMethod)) {
                return res.status(400).json({ success: false, error: "Please select a valid payment method." });
            }

            const [rows] = await db.query(`
                SELECT
                    b.bid_id, b.bidder_id, b.bid_amount, b.auction_id,
                    (SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.auction_id = b.auction_id) AS auction_highest
                FROM bids b
                INNER JOIN auctions a ON b.auction_id = a.auction_id
                WHERE b.bid_id = ? AND b.bidder_id = ? AND a.status = 'Closed'
                LIMIT 1
            `, [bidId, bidderId]);

            if (!rows.length) {
                return res.status(400).json({ success: false, error: "Payment is available only for your winning bid after the auction closes." });
            }

            const bid = rows[0];
            if (Number(bid.bid_amount) !== Number(bid.auction_highest)) {
                return res.status(403).json({ success: false, error: "Only the winning bid can be paid." });
            }

            const [existing] = await db.query(
                `SELECT * FROM payment_transactions WHERE bid_id = ? AND bidder_id = ? ORDER BY transaction_id DESC LIMIT 1`,
                [bidId, bidderId]
            );

            if (existing.length) {
                return res.json({ success: true, message: "Payment is already recorded for this bid.", payment: existing[0] });
            }

            const reference = `BB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const [result] = await db.query(`
                INSERT INTO payment_transactions
                    (bidder_id, bid_id, amount, payment_method, transaction_reference, payment_status, paid_at)
                VALUES (?, ?, ?, ?, ?, 'Paid', NOW())
            `, [bidderId, bidId, bid.bid_amount, paymentMethod, reference]);

            const [payment] = await db.query(
                `SELECT * FROM payment_transactions WHERE transaction_id = ? LIMIT 1`,
                [result.insertId]
            );

            res.status(201).json({ success: true, message: "Payment transaction recorded successfully.", payment: payment[0] });
        } catch (error) {
            sendError(res, 500, "Unable to record payment transaction.", error);
        }
    }
);

// ============================================================
// ADMIN - SHIPPING TRACKING
// ============================================================

app.get(
    "/api/admin/shipping",
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT
                    sd.*,
                    b.bid_amount,
                    aw.title AS artwork_name,
                    u.full_name AS bidder_name,
                    u.email AS bidder_email,
                    pt.transaction_id,
                    pt.payment_status,
                    pt.payment_method,
                    pt.transaction_reference,
                    pt.paid_at
                FROM shipping_details sd
                INNER JOIN bids b ON sd.bid_id = b.bid_id
                INNER JOIN artworks aw ON b.artwork_id = aw.artwork_id
                INNER JOIN users u ON sd.bidder_id = u.user_id
                LEFT JOIN payment_transactions pt ON pt.bid_id = b.bid_id
                ORDER BY sd.updated_at DESC, sd.shipping_id DESC
            `);
            res.json({ success: true, shipping: rows });
        } catch (error) {
            sendError(res, 500, "Unable to fetch admin shipping details.", error);
        }
    }
);

app.put(
    "/api/admin/shipping/:id",
    async (req, res) => {
        try {
            const shippingId = Number(req.params.id);
            const shippingStatus = String(req.body.shipping_status || "").trim();
            const trackingNumber = String(req.body.tracking_number || "").trim() || null;
            const allowed = [
                "Order Confirmed",
                "Packing",
                "Shipped",
                "Out for Delivery",
                "Delivered"
            ];

            if (!Number.isInteger(shippingId) || shippingId <= 0 || !allowed.includes(shippingStatus)) {
                return res.status(400).json({ success: false, error: "Invalid shipping status or shipping ID." });
            }

            const [result] = await db.query(`
                UPDATE shipping_details
                SET
                    shipping_status = ?,
                    tracking_number = ?,
                    order_confirmed_at = CASE WHEN ? = 'Order Confirmed' THEN COALESCE(order_confirmed_at, NOW()) ELSE order_confirmed_at END,
                    packing_at = CASE WHEN ? = 'Packing' THEN COALESCE(packing_at, NOW()) ELSE packing_at END,
                    shipped_at = CASE WHEN ? = 'Shipped' THEN COALESCE(shipped_at, NOW()) ELSE shipped_at END,
                    out_for_delivery_at = CASE WHEN ? = 'Out for Delivery' THEN COALESCE(out_for_delivery_at, NOW()) ELSE out_for_delivery_at END,
                    delivered_at = CASE WHEN ? = 'Delivered' THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END,
                    updated_at = NOW()
                WHERE shipping_id = ?
            `, [
                shippingStatus,
                trackingNumber,
                shippingStatus,
                shippingStatus,
                shippingStatus,
                shippingStatus,
                shippingStatus,
                shippingId
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: "Shipping record not found." });
            }

            res.json({ success: true, message: "Shipping tracking updated successfully." });
        } catch (error) {
            sendError(res, 500, "Unable to update shipping tracking.", error);
        }
    }
);

// ============================================================
// ADMIN - PAYMENT TRANSACTIONS
// ============================================================

app.get(
    "/api/admin/payments",
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT
                    pt.*,
                    b.bid_amount,
                    aw.title AS artwork_name,
                    u.full_name AS bidder_name,
                    u.email AS bidder_email
                FROM payment_transactions pt
                INNER JOIN bids b ON pt.bid_id = b.bid_id
                INNER JOIN artworks aw ON b.artwork_id = aw.artwork_id
                INNER JOIN users u ON pt.bidder_id = u.user_id
                ORDER BY pt.updated_at DESC, pt.transaction_id DESC
            `);
            res.json({ success: true, payments: rows });
        } catch (error) {
            sendError(res, 500, "Unable to fetch payment transactions.", error);
        }
    }
);

app.put(
    "/api/admin/payments/:id",
    async (req, res) => {
        try {
            const transactionId = Number(req.params.id);
            const paymentStatus = String(req.body.payment_status || "").trim();

            if (!Number.isInteger(transactionId) || transactionId <= 0 ||
                !["Pending", "Paid", "Failed"].includes(paymentStatus)) {
                return res.status(400).json({ success: false, error: "Invalid payment status or transaction ID." });
            }

            const [result] = await db.query(`
                UPDATE payment_transactions
                SET
                    payment_status = ?,
                    paid_at = CASE WHEN ? = 'Paid' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
                    updated_at = NOW()
                WHERE transaction_id = ?
            `, [paymentStatus, paymentStatus, transactionId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: "Payment transaction not found." });
            }

            res.json({ success: true, message: "Payment status updated successfully." });
        } catch (error) {
            sendError(res, 500, "Unable to update payment status.", error);
        }
    }
);

// ============================================================
// 404 HANDLER FOR API ROUTES
// ============================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "API endpoint not found.",

            path:
                req.originalUrl

        });

    }
);

// ============================================================
// GENERAL ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:"
        );

        console.error(
            error
        );

        if (
            res.headersSent
        ) {

            return next(error);

        }

        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);

// ============================================================
// START SERVER
// ============================================================

async function startServer() {

    await testDatabase();

    app.listen(
        PORT,
        () => {

            console.log("");

            console.log(
                "======================================"
            );

            console.log(
                "BRUSH AND BID SERVER STARTED"
            );

            console.log(
                "======================================"
            );

            console.log("");

            console.log(
                `Website: http://localhost:${PORT}`
            );

            console.log(
                `API:     http://localhost:${PORT}/api`
            );

            console.log("");

            console.log(
                "Press Ctrl + C to stop the server."
            );

            console.log("");

        }
    );

}

startServer();