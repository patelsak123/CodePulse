const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const {
  fetchUserRepositories,
  fetchRepositoryContents,
  fetchFileContent,
  fetchImageBuffer,
  collectRepositorySource,
} = require("./services/githubService");
const { analyzeRepositoryWithGemini } = require("./services/geminiService");

const app = express();
const PORT = process.env.PORT || 5001;

// Configures CORS and JSON body-parsing middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get("/", (req, res) => {
  res.status(200).send("HELLO BACKEND");
});

// Registers a new user with hashed password credentials
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration Error:", error.message);
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// Authenticates user credentials and returns session user details
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      message: "Login successful!",
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Retrieves repositories accessible to the configured GitHub token
app.get("/api/github/repos", async (req, res) => {
  try {
    const repos = await fetchUserRepositories();
    return res.status(200).json(repos);
  } catch (error) {
    console.error("GitHub Repos Error:", error.message);
    return res.status(500).json({ message: error.message || "Unable to fetch repositories" });
  }
});

// Lists repository files and folders for a given directory path
app.get("/api/github/repos/:owner/:repo/contents", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const folderPath = req.query.path || "";
    const items = await fetchRepositoryContents(owner, repo, folderPath);

    return res.status(200).json({
      owner,
      repository: repo,
      path: folderPath,
      contents: items,
    });
  } catch (error) {
    console.error("Repository Contents Error:", error.message);
    return res.status(500).json({ message: error.message || "Unable to fetch repository contents" });
  }
});

// Retrieves the decoded text content of a single repository file
app.get("/api/github/repos/:owner/:repo/file", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    const fileData = await fetchFileContent(owner, repo, filePath);
    return res.status(200).json(fileData);
  } catch (error) {
    console.error("Repository File Error:", error.message);
    return res.status(500).json({ message: error.message || "Unable to fetch file content" });
  }
});

// Streams raw image binary with matching Content-Type header
app.get("/api/github/repos/:owner/:repo/image", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const imagePath = req.query.path;

    if (!imagePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    const { buffer, mimeType } = await fetchImageBuffer(owner, repo, imagePath);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Repository Image Error:", error.message);
    return res.status(500).json({ message: error.message || "Unable to fetch image" });
  }
});

// Collects repository source files and runs AI code analysis
app.post("/api/analysis/start", async (req, res) => {
  try {
    const { repository } = req.body;

    if (!repository || !repository.fullName || !repository.name) {
      return res.status(400).json({ message: "Invalid repository information provided" });
    }

    const [owner, repoName] = repository.fullName.split("/");
    if (!owner || !repoName) {
      return res.status(400).json({ message: "Invalid repository full name format (expected owner/repo)" });
    }

    const collectedFiles = await collectRepositorySource(owner, repoName);
    if (collectedFiles.length === 0) {
      return res.status(400).json({
        message: "No supported source-code files were found in this repository.",
      });
    }

    const analysis = await analyzeRepositoryWithGemini(repository.fullName, collectedFiles);

    return res.status(200).json({
      status: "completed",
      repository: repository.fullName,
      summary: analysis.summary,
      architecture: analysis.architecture,
      codeQuality: analysis.codeQuality,
      issues: analysis.issues,
      recommendations: analysis.recommendations,
      fileCount: collectedFiles.length,
      files: collectedFiles.map((f) => ({ path: f.path })),
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis Workflow Error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to analyze repository" });
  }
});

// Establishes connection to MongoDB database
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codepulse";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Starts Express server on configured port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("GitHub token loaded:", Boolean(process.env.GITHUB_TOKEN));
});