
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "auralis_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
    });

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.json({ message: "PostgreSQL connected successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Database connection failed. Check .env." });
  }
});

app.post("/api/register", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    typeof phone !== "string" ||
    typeof password !== "string" ||
    !fullName.trim() ||
    !email.trim() ||
    !phone.trim() ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      message: "Enter valid details and a password of 8–72 characters."
    });
  }

  try {
    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email`,
      [fullName.trim(), email.trim().toLowerCase(), phone.trim(), hash]
    );

    res.status(201).json({
      message: "Account created successfully!",
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    console.error(error.message);
    res.status(500).json({ message: "Registration failed." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password ||
    password.length > 72
  ) {
    return res.status(400).json({
      message: "Enter a valid email and password."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (
      !result.rows.length ||
      !(await bcrypt.compare(password, result.rows[0].password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    res.json({
      message: "Login successful!",
      user: {
        id: result.rows[0].id,
        fullName: result.rows[0].full_name,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Login failed." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Auralis running at http://localhost:${PORT}`);
});
