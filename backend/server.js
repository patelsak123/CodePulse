const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = 5001;

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Home Route
// =======================
app.get("/", (req, res) => {
  res.status(200).send("HELLO BACKEND");
});

// =======================
// Register API
// =======================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check empty fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);

const newUser = new User({
  name,
  email,
  password: hashedPassword,
});

    // Save user to MongoDB
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
    });
  } catch (error) {
    console.log("Registration Error:", error);

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});
// ========================
// Login API
// ========================

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Login successful
    res.status(200).json({
      message: "Login successful!",
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("Login Error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// Fetches repositories accessible to the configured GitHub token.
app.get("/api/github/repos", async (req, res) => {
  try {
    
const response = await fetch(
  "https://api.github.com/user/repos?sort=updated&per_page=30",
  {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
);

    if (!response.ok) {
      return res.status(response.status).json({
        message: "GitHub API request failed",
      });
    }

    const repos = await response.json();

    res.json(
      repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        isPrivate: repo.private,
        url: repo.html_url,
        stars: repo.stargazers_count,
      }))
    );
  } catch (error) {
    console.error("GitHub API Error:", error.message);
    res.status(500).json({ message: "Unable to fetch repositories" });
  }
});

 // ===============================
 // REPOSITORY FILE TREE API
 // ===============================

app.get("/api/github/repos/:owner/:repo/contents", async (req, res) => {
  try {
    // 1. Check whether GitHub token exists
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({
        message: "GitHub token is not configured",
      });
    }

    // 2. Get owner and repository name from URL
    const { owner, repo } = req.params;

    // 3. Get optional folder path from query
    const path = req.query.path || "";

    // 4. Build GitHub API URL
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");

    const githubUrl =
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents` +
      (encodedPath ? `/${encodedPath}` : "");

    // 5. Request files and folders from GitHub
    const response = await fetch(githubUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // 6. Handle GitHub API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return res.status(response.status).json({
        message: "Failed to fetch repository contents",
        error: errorData.message || "GitHub API request failed",
      });
    }

    // 7. Read GitHub response
    const contents = await response.json();

    // 8. Return a consistent list of file/folder details
    const items = Array.isArray(contents) ? contents : [contents];

    return res.status(200).json({
      owner,
      repository: repo,
      path,
      contents: items.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.html_url,
        downloadUrl: item.download_url,
      })),
    });
  } catch (error) {
    console.error("File Tree API Error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch repository contents",
    });
  }
});


// =======================
// MongoDB Connection
// =======================
mongoose
  .connect("mongodb://127.0.0.1:27017/codepulse")
  .then(() => {
    console.log("MongoDB connected successfully!");

app.get("/api/github/repos/:owner/:repo/file", async (req, res) => {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({
        message: "GitHub token is not configured",
      });
    }

    const { owner, repo } = req.params;
    const path = req.query.path;

    if (!path) {
      return res.status(400).json({
        message: "File path is required",
      });
    }

    const encodedPath = path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const url =
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.message || "Unable to fetch file",
      });
    }

    if (data.type !== "file" || !data.content) {
      return res.status(400).json({
        message: "This path is not a supported file",
      });
    }

    const content = Buffer.from(data.content, "base64").toString("utf8");

    return res.json({
      name: data.name,
      path: data.path,
      content,
    });
  } catch (error) {
    console.error("File Content API Error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch file content",
    });
  }
});


    // Start server after MongoDB connection
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });
  console.log(
  "GitHub token loaded:",
  Boolean(process.env.GITHUB_TOKEN)
);