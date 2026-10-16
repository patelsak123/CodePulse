const GITHUB_API_BASE = "https://api.github.com";

// Directories excluded from code analysis traversal
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  "coverage",
  "vendor",
  "__pycache__",
  ".cache",
  ".vscode",
  ".idea",
]);

// File extensions excluded from code analysis
const IGNORED_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif",
  "mp4", "mp3", "mov", "avi", "wav", "webm",
  "zip", "tar", "gz", "7z", "rar",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "exe", "dll", "so", "dylib", "bin",
  "woff", "woff2", "ttf", "eot", "otf",
  "lock", "map",
]);

// Supported source-code file extensions for analysis
const ALLOWED_EXTS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "rb", "php",
  "html", "css", "scss", "sass", "less",
  "json", "yaml", "yml", "xml", "md", "sql", "sh", "bash",
]);

// Content-type mappings for supported image file extensions
const IMAGE_MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
};

// Builds standard headers required for GitHub REST API requests
function getGitHubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token is not configured on the server");
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Fetches user repositories from GitHub sorted by latest updates
async function fetchUserRepositories() {
  const response = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=30`, {
    headers: getGitHubHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API request failed (${response.status})`);
  }

  const repos = await response.json();
  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language,
    isPrivate: repo.private,
    url: repo.html_url,
    stars: repo.stargazers_count,
  }));
}

// Fetches file and directory listings for a repository path
async function fetchRepositoryContents(owner, repo, folderPath = "") {
  const encodedPath = folderPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${encodedPath ? `/${encodedPath}` : ""}`;
  const response = await fetch(url, { headers: getGitHubHeaders() });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch contents (${response.status})`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : [data];

  return items.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    size: item.size,
    url: item.html_url,
    downloadUrl: item.download_url,
  }));
}

// Fetches and decodes the UTF-8 text content of a single repository file
async function fetchFileContent(owner, repo, filePath) {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
  const response = await fetch(url, { headers: getGitHubHeaders() });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Unable to fetch file (${response.status})`);
  }

  const data = await response.json();
  if (data.type !== "file" || !data.content) {
    throw new Error("This path is not a supported file");
  }

  return {
    name: data.name,
    path: data.path,
    content: Buffer.from(data.content, "base64").toString("utf8"),
  };
}

// Fetches raw image buffer and resolves matching MIME type
async function fetchImageBuffer(owner, repo, imagePath) {
  const encodedPath = imagePath.split("/").map(encodeURIComponent).join("/");
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
  const response = await fetch(url, { headers: getGitHubHeaders() });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Unable to fetch file (${response.status})`);
  }

  const data = await response.json();
  if (data.type !== "file") {
    throw new Error("Path is not a file");
  }

  let buffer;
  if (data.content) {
    buffer = Buffer.from(data.content.replace(/\s/g, ""), "base64");
  } else if (data.download_url) {
    const downloadResponse = await fetch(data.download_url, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    });
    if (!downloadResponse.ok) {
      throw new Error("Unable to download image binary");
    }
    const arrayBuffer = await downloadResponse.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error("Image content not available");
  }

  const ext = imagePath.split(".").pop().toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[ext] || "application/octet-stream";

  return { buffer, mimeType };
}

// Traverses repository tree and collects relevant source files within safety limits
async function collectRepositorySource(owner, repo) {
  const MAX_FILES = 25;
  const MAX_FILE_SIZE = 100 * 1024;
  const MAX_TOTAL_SIZE = 500 * 1024;

  const collectedFiles = [];
  let totalSize = 0;
  const queue = [""];

  while (queue.length > 0 && collectedFiles.length < MAX_FILES && totalSize < MAX_TOTAL_SIZE) {
    const currentDir = queue.shift();
    let items;
    try {
      items = await fetchRepositoryContents(owner, repo, currentDir);
    } catch (_) {
      continue;
    }

    for (const item of items) {
      if (collectedFiles.length >= MAX_FILES || totalSize >= MAX_TOTAL_SIZE) break;

      if (item.type === "dir") {
        if (!IGNORED_DIRS.has(item.name.toLowerCase()) && !item.name.startsWith(".")) {
          queue.push(item.path);
        }
      } else if (item.type === "file") {
        const parts = item.name.split(".");
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";

        if (IGNORED_EXTS.has(ext) || !ALLOWED_EXTS.has(ext)) continue;
        if (item.size && item.size > MAX_FILE_SIZE) continue;

        try {
          const fileData = await fetchFileContent(owner, repo, item.path);
          const fileBytes = Buffer.byteLength(fileData.content, "utf8");
          if (totalSize + fileBytes > MAX_TOTAL_SIZE) break;

          collectedFiles.push({ path: item.path, content: fileData.content });
          totalSize += fileBytes;
        } catch (_) {
          continue;
        }
      }
    }
  }

  return collectedFiles;
}

module.exports = {
  fetchUserRepositories,
  fetchRepositoryContents,
  fetchFileContent,
  fetchImageBuffer,
  collectRepositorySource,
};
