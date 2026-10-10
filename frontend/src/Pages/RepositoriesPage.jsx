import React from "react";
import "./Dashboard.css";

// Reusable section header displaying title, subtitle and an optional status tag
function PanelHeading({ title, subtitle, tag }) {
  return (
    <div className="cp-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {tag && <span className="cp-panel-tag">{tag}</span>}
    </div>
  );
}

// Card displaying repository details, stars, language badge and explore button
function RepositoryCard({ repo, onExplore }) {
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
          className="cp-secondary-button"
          type="button"
          onClick={() => onExplore(repo)}
        >
          Explore
        </button>
      </div>
    </article>
  );
}

// Repositories view handling repository browsing, file navigation and code viewing
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
}) {
  return (
    <section className="cp-panel cp-repositories-page">
      {selectedRepo ? (
        <>
          {/* Back button aligned to top-left corner */}
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

          {/* Repository file explorer header */}
          <PanelHeading
            title={selectedRepo.name}
            subtitle={selectedRepo.fullName}
            tag="FILE EXPLORER"
          />

          {/* Conditional rendering for loading, error or folder contents */}
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
              {/* File content viewer modal/box */}
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
                    {fileLoading ? (
                      <p>Loading file content…</p>
                    ) : (
                      <pre>
                        <code>{selectedFile.content}</code>
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* List of files and subdirectories */}
              {repoContents.length === 0 ? (
                <div className="cp-message-state">
                  This folder is empty, or it contains no accessible files.
                </div>
              ) : (
                <div className="cp-mini-repo-list">
                  {repoContents.map((item) => (
                    <button
                      className="cp-mini-repo"
                      key={item.path}
                      type="button"
                      onClick={() => {
                        if (item.type === "dir") {
                          fetchRepoContents(selectedRepo, item.path);
                        } else {
                          openRepoFile(item);
                        }
                      }}
                    >
                      <span className="cp-mini-repo-icon">
                        {item.type === "dir" ? "📁" : "📄"}
                      </span>
                      <span className="cp-mini-repo-info">
                        <strong>{item.name}</strong>
                        <small>{item.type === "dir" ? "Folder" : "File"}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {/* Main repositories header */}
          <PanelHeading
            title="Your repositories"
            subtitle="Repositories accessible to your configured GitHub token"
            tag={loading ? "SYNCING" : error ? "OFFLINE" : "CONNECTED"}
          />

          {/* Conditional rendering for repository listing states */}
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
