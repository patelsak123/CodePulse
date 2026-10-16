import React, { useState, useEffect, useRef } from "react";
import PanelHeading from "../components/PanelHeading";
import "./Dashboard.css";

// Displays repository details, language tag, stars, and navigation actions
function RepositoryCard({ repo, onExplore, onAnalyze }) {
  return (
    <article className="cp-repo-card">
      <div className="cp-repo-card-top">
        <span className="cp-repo-icon">⌘</span>
        <span>{repo.name}</span>
      </div>
      <h3>{repo.name}</h3>
      <div className="cp-repo-fullname">{repo.fullName}</div>
      <p className="cp-repo-description">{repo.description || "No description provided."}</p>
      <div className="cp-repo-meta">
        <span>
          <span className="cp-language-dot" /> {repo.language || "Other"}
        </span>
        <span>★ {repo.stars}</span>
        <button
          className="cp-primary-button"
          type="button"
          onClick={() => onAnalyze(repo)}
        >
          Analyze Repository
        </button>
      </div>
    </article>
  );
}

// Repositories view handling repository browsing, file exploration, code viewing, and image rendering
function RepositoriesPage({
  loading,
  error,
  repositories,
  selectedRepo,
  repoContents,
  selectedFile,
  fileLoading,
  contentsLoading,
  contentsError,
  fetchRepoContents,
  openRepoFile,
  setSelectedRepo,
  setRepoContents,
  setSelectedFile,
  setContentsError,
  onAnalyze,
}) {
  const [imageCache, setImageCache] = useState({});
  const createdUrlsRef = useRef([]);

  // Revokes created image object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
    };
  }, []);

  // Checks whether a filename has a supported raster or vector image extension
  const isImageFile = (fileName) => {
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(fileName || "");
  };

  // Loads repository image from backend proxy and creates an object URL preview
  const openImageFile = async (item) => {
    if (!selectedRepo) return;
    const cacheKey = `${selectedRepo.fullName}:${item.path}`;

    if (imageCache[cacheKey]) {
      setSelectedFile({
        name: item.name,
        path: item.path,
        isImage: true,
        imageUrl: imageCache[cacheKey],
        loading: false,
      });
      return;
    }

    setSelectedFile({
      name: item.name,
      path: item.path,
      isImage: true,
      imageUrl: null,
      loading: true,
    });

    try {
      const response = await fetch(
        `http://localhost:5001/api/github/repos/${selectedRepo.fullName}/image?path=${encodeURIComponent(item.path)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load image (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      createdUrlsRef.current.push(objectUrl);

      setImageCache((prev) => ({ ...prev, [cacheKey]: objectUrl }));
      setSelectedFile({
        name: item.name,
        path: item.path,
        isImage: true,
        imageUrl: objectUrl,
        loading: false,
      });
    } catch (err) {
      setSelectedFile({
        name: item.name,
        path: item.path,
        isImage: true,
        imageUrl: null,
        error: err.message || "Failed to load image",
        loading: false,
      });
    }
  };

  return (
    <section className="cp-panel cp-repositories-page">
      {selectedRepo ? (
        <>
          <div className="cp-back-wrapper">
            <button
              className="cp-back-button"
              type="button"
              onClick={() => {
                setSelectedRepo(null);
                setRepoContents([]);
                setSelectedFile(null);
                setContentsError("");
              }}
            >
              ← Back to repositories
            </button>
          </div>

          <PanelHeading
            title={selectedRepo.name}
            subtitle={selectedRepo.fullName}
            tag="FILE EXPLORER"
          />

          {contentsLoading ? (
            <div className="cp-message-state">Loading repository files…</div>
          ) : contentsError ? (
            <div className="cp-message-state">
              <p>{contentsError}</p>
              <button
                className="cp-secondary-button"
                type="button"
                onClick={() => fetchRepoContents(selectedRepo)}
              >
                Retry loading files
              </button>
            </div>
          ) : (
            <>
              {selectedFile && (
                <div className="cp-file-viewer">
                  <div className="cp-file-viewer-header">
                    <div>
                      <strong>{selectedFile.name}</strong>
                      <p>{selectedFile.path}</p>
                    </div>
                    <button
                      className="cp-secondary-button"
                      type="button"
                      onClick={() => setSelectedFile(null)}
                    >
                      Close ×
                    </button>
                  </div>
                  <div className="cp-file-code">
                    {selectedFile.isImage ? (
                      selectedFile.loading ? (
                        <div className="cp-message-state" style={{ padding: "40px" }}>
                          <p>Loading image preview…</p>
                        </div>
                      ) : selectedFile.error ? (
                        <div className="cp-message-state" style={{ padding: "40px" }}>
                          <p style={{ color: "#ef4444", marginBottom: "12px" }}>
                            {selectedFile.error}
                          </p>
                          <button
                            className="cp-secondary-button"
                            type="button"
                            onClick={() =>
                              openImageFile({
                                name: selectedFile.name,
                                path: selectedFile.path,
                              })
                            }
                          >
                            Retry loading image
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cp-image-preview-wrapper"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "24px 16px",
                            background: "#0d111a",
                            borderRadius: "8px",
                          }}
                        >
                          <img
                            src={selectedFile.imageUrl}
                            alt={selectedFile.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "520px",
                              objectFit: "contain",
                              borderRadius: "6px",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                            }}
                          />
                        </div>
                      )
                    ) : fileLoading ? (
                      <p>Loading file content…</p>
                    ) : (
                      <pre>
                        <code>{selectedFile.content}</code>
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {repoContents.length === 0 ? (
                <div className="cp-message-state">
                  This folder is empty, or it contains no accessible files.
                </div>
              ) : (
                <div className="cp-mini-repo-list">
                  {repoContents.map((item) => {
                    const isImage = isImageFile(item.name);
                    return (
                      <button
                        className="cp-mini-repo"
                        key={item.path}
                        type="button"
                        onClick={() => {
                          if (item.type === "dir") {
                            fetchRepoContents(selectedRepo, item.path);
                          } else if (isImage) {
                            openImageFile(item);
                          } else {
                            openRepoFile(item);
                          }
                        }}
                      >
                        <span className="cp-mini-repo-icon">
                          {item.type === "dir" ? "📁" : isImage ? "🖼️" : "📄"}
                        </span>
                        <span className="cp-mini-repo-info">
                          <strong>{item.name}</strong>
                          <small>
                            {item.type === "dir"
                              ? "Folder"
                              : isImage
                              ? "Image"
                              : "File"}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <PanelHeading
            title="Your repositories"
            subtitle="Repositories accessible to your configured GitHub token"
            tag={loading ? "SYNCING" : error ? "OFFLINE" : "CONNECTED"}
          />

          {loading ? (
            <div className="cp-message-state">Loading repositories…</div>
          ) : error ? (
            <div className="cp-message-state">
              <p>{error}</p>
              <button
                className="cp-secondary-button"
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry connection
              </button>
            </div>
          ) : repositories.length === 0 ? (
            <div className="cp-message-state">
              No repositories found. Check your GitHub token permissions.
            </div>
          ) : (
            <div className="cp-repository-grid">
              {repositories.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  repo={repo}
                  onExplore={fetchRepoContents}
                  onAnalyze={onAnalyze}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RepositoriesPage;
