import { useEffect, useState } from "react";
import RepositoriesPage from "./RepositoriesPage";
import "./Dashboard.css";

// Main Dashboard component handling navigation, repository overview and workspace metrics
function Dashboard({ user, onLogout }) {
  // Navigation and active view state
  const [activePage, setActivePage] = useState("dashboard");
  // Repository dataset and selection state
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoContents, setRepoContents] = useState([]);
  // Global repository load state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Active file content view state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  // Folder directory contents load state
  const [contentsLoading, setContentsLoading] = useState(false);
  const [contentsError, setContentsError] = useState("");

  // Extracted user first name for welcome display
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Developer";

  // Sidebar navigation links configuration
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "repositories", label: "Repositories", icon: "⌘" },
    { id: "analysis", label: "AI Analysis", icon: "✳" },
    { id: "history", label: "History", icon: "↺" },
  ];

  // Fetch all repositories from backend API on initial mount
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/github/repos");
        if (!response.ok) {
          throw new Error("Unable to load GitHub repositories.");
        }
        const data = await response.json();
        setRepositories(data);
        setError("");
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchRepositories();
  }, []);

  // Switch between workspace pages
  const handleNavigation = (page) => setActivePage(page);

  // Fetch directory contents or files for a given repository path
  const fetchRepoContents = async (repo, path = "") => {
    setSelectedRepo(repo);
    setSelectedFile(null);
    setRepoContents([]);
    setContentsError("");
    setContentsLoading(true);
    setActivePage("repositories");
    try {
      const query = path ? `?path=${encodeURIComponent(path)}` : "";
      const response = await fetch(
        `http://localhost:5001/api/github/repos/${repo.fullName}/contents${query}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load repository files.");
      }
      setRepoContents(data.contents || []);
    } catch (err) {
      setContentsError(err.message || "Unable to load repository files.");
      console.error("Repository files error:", err);
    } finally {
      setContentsLoading(false);
    }
  };

  // Load code content of a specific repository file
  const openRepoFile = async (item) => {
    if (!selectedRepo) return;
    setSelectedFile({ name: item.name, path: item.path, content: "" });
    setFileLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/github/repos/${selectedRepo.fullName}/file?path=${encodeURIComponent(item.path)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load file.");
      }
      setSelectedFile(data);
    } catch (err) {
      setSelectedFile({
        name: item.name,
        path: item.path,
        content: `Error: ${err.message}`,
      });
    } finally {
      setFileLoading(false);
    }
  };

  // Compute active page title for top bar
  const pageTitle =
    navItems.find((item) => item.id === activePage)?.label || "Dashboard";

  return (
    <div className="cp-app">
      {/* Sidebar navigation container */}
      <aside className="cp-sidebar">
        {/* Workspace branding logo and title */}
        <div className="cp-brand">
          <div className="cp-brand-icon" />
          <div>
            <h2>CodePulse</h2>
            <span>Developer Intelligence</span>
          </div>
        </div>

        {/* Navigation menu list */}
        <div className="cp-nav-label">WORKSPACE</div>
        <nav className="cp-navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`cp-nav-item ${activePage === item.id ? "cp-nav-active" : ""}`}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="cp-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {["analysis", "history"].includes(item.id) && (
                <span className="cp-coming-soon">Soon</span>
              )}
            </button>
          ))}
        </nav>

        {/* User profile summary and logout button at bottom */}
        <div className="cp-sidebar-bottom">
          <div className="cp-user-avatar">{firstName.charAt(0).toUpperCase()}</div>
          <div className="cp-user-summary">
            <strong>{firstName}</strong>
            <span>CodePulse account</span>
          </div>
          <button
            className="cp-logout"
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
          >
            ↗
          </button>
        </div>
      </aside>

      {/* Main workspace layout area */}
      <main className="cp-main">
        {/* Workspace top navigation bar */}
        <header className="cp-topbar">
          <div>
            <div className="cp-breadcrumb">Workspace / {pageTitle}</div>
            <h1>{pageTitle}</h1>
          </div>
          <div className="cp-topbar-user">
            <span className="cp-status-dot" />
            <span>{user?.name || "Developer"}</span>
          </div>
        </header>

        {/* Dynamic page content container */}
        <div className="cp-content">
          {/* Main dashboard overview view */}
          {activePage === "dashboard" && (
            <>
              {/* Welcome banner section */}
              <section className="cp-welcome">
                <div className="cp-welcome-copy">
                  <span className="cp-eyebrow">ENGINEERING PERFORMANCE WORKSPACE</span>
                  <h2>
                    Your code. Your progress. <span>One pulse.</span>
                  </h2>
                  <p>
                    Welcome back, {firstName}. Explore your GitHub repositories and prepare to turn code into actionable insights.
                  </p>
                  <button
                    className="cp-primary-button"
                    type="button"
                    onClick={() => handleNavigation("repositories")}
                  >
                    Explore repositories <span>↗</span>
                  </button>
                </div>
                <div className="cp-welcome-art" aria-hidden="true" />
              </section>

              {/* Key performance metrics grid */}
              <section className="cp-metrics-grid">
                <MetricCard
                  icon="⌘"
                  label="REPOSITORIES"
                  value={loading ? "…" : error ? "—" : repositories.length}
                  description="Available on GitHub"
                  tone="blue"
                  points="0,32 18,27 36,29 54,17 72,21 90,10 108,15 126,6"
                />
                <MetricCard
                  icon="✳"
                  label="AI INSIGHTS"
                  value="—"
                  description="AI integration pending"
                  tone="purple"
                  points="0,28 18,23 36,26 54,14 72,19 90,11 108,15 126,5"
                />
                <MetricCard
                  icon="◇"
                  label="CODE HEALTH"
                  value="—"
                  description="Analysis not available yet"
                  tone="teal"
                  points="0,29 18,18 36,24 54,13 72,19 90,8 108,13 126,4"
                />
                <MetricCard
                  icon="↗"
                  label="PUBLIC PROJECTS"
                  value={
                    loading
                      ? "…"
                      : error
                      ? "—"
                      : repositories.filter((repo) => !repo.isPrivate).length
                  }
                  description="Public GitHub repositories"
                  tone="blue"
                  points="0,30 18,26 36,22 54,24 72,13 90,17 108,8 126,4"
                />
              </section>

              {/* Analytics overview and quality gauge panel grid */}
              <div className="cp-analytics-grid">
                {/* Repository trends and quick list panel */}
                <section className="cp-panel cp-trends-panel">
                  <PanelHeading
                    title="Repository overview"
                    subtitle="Your connected GitHub workspace"
                    tag={loading ? "SYNCING" : error ? "OFFLINE" : "GITHUB DATA"}
                  />
                  <div className="cp-repo-summary">
                    <div>
                      <span className="cp-summary-label">TOTAL REPOSITORIES</span>
                      <strong>{loading ? "…" : error ? "—" : repositories.length}</strong>
                      <span className="cp-summary-note">
                        {error ? "Could not connect to backend" : "Fetched from GitHub"}
                      </span>
                    </div>
                    <div className="cp-summary-icon">⌘</div>
                  </div>

                  {/* Dynamic repository snapshot listing */}
                  {loading ? (
                    <div className="cp-message-state">Loading your repositories…</div>
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
                    <div className="cp-message-state">No repositories were returned by GitHub.</div>
                  ) : (
                    <div className="cp-mini-repo-list">
                      {repositories.slice(0, 4).map((repo) => (
                        <a
                          className="cp-mini-repo"
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          key={repo.id}
                        >
                          <span className="cp-mini-repo-icon">⌘</span>
                          <span className="cp-mini-repo-info">
                            <strong>{repo.name}</strong>
                            <small>{repo.language || "Language not specified"}</small>
                          </span>
                          <span className="cp-mini-repo-stars">★ {repo.stars}</span>
                          <span className="cp-mini-repo-arrow">↗</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Navigation shortcut to full repositories tab */}
                  {!loading && !error && repositories.length > 4 && (
                    <button
                      className="cp-text-button"
                      type="button"
                      onClick={() => handleNavigation("repositories")}
                    >
                      View all {repositories.length} repositories →
                    </button>
                  )}
                </section>

                {/* Code quality indicators and progress preview */}
                <section className="cp-panel cp-quality-panel">
                  <PanelHeading
                    title="Quality vs speed"
                    subtitle="Engineering performance indicators"
                    tag="PREVIEW"
                  />
                  <div className="cp-gauge-wrap">
                    <div className="cp-gauge">
                      <div className="cp-gauge-inner">
                        <span className="cp-gauge-value">—</span>
                        <span className="cp-gauge-unit">/ 100</span>
                        <span className="cp-gauge-caption">Awaiting analysis</span>
                      </div>
                    </div>
                  </div>
                  <p className="cp-gauge-description">
                    Connect code analysis to calculate a meaningful project score.
                  </p>
                  <div className="cp-quality-stats">
                    <div>
                      <span className="cp-quality-dot blue" />
                      <span>Code quality</span>
                      <strong>—</strong>
                    </div>
                    <div>
                      <span className="cp-quality-dot teal" />
                      <span>Test coverage</span>
                      <strong>—</strong>
                    </div>
                    <div>
                      <span className="cp-quality-dot purple" />
                      <span>Review depth</span>
                      <strong>—</strong>
                    </div>
                  </div>
                </section>
              </div>

              {/* Bottom panels: Insights, language breakdown, and recent repositories */}
              <div className="cp-bottom-grid">
                {/* AI & workspace developer insights panel */}
                <section className="cp-panel cp-insights-panel">
                  <PanelHeading title="Developer insights" subtitle="Your workspace at a glance" />
                  <InsightRow
                    icon="⌘"
                    tone="blue"
                    title="GitHub connected"
                    text={
                      loading
                        ? "Checking repositories…"
                        : error
                        ? "Repository data unavailable"
                        : `${repositories.length} repositories loaded from GitHub`
                    }
                  />
                  <InsightRow
                    icon="✳"
                    tone="purple"
                    title="AI code intelligence"
                    text="Gemini-powered analysis will be added in the next phase."
                  />
                  <InsightRow
                    icon="◇"
                    tone="teal"
                    title="Code health metrics"
                    text="Health scores will appear after repository analysis is implemented."
                  />
                  <InsightRow
                    icon="↗"
                    tone="amber"
                    title="Next milestone"
                    text="Explore a repository and prepare it for codebase analysis."
                  />
                </section>

                {/* Stars counter and repository language breakdown panel */}
                <section className="cp-panel cp-activity-panel">
                  <PanelHeading title="Workspace activity" subtitle="GitHub repository snapshot" />
                  <div className="cp-activity-total">
                    <div>
                      <span className="cp-summary-label">TOTAL STARS</span>
                      <strong>
                        {loading
                          ? "…"
                          : error
                          ? "—"
                          : repositories
                              .reduce((total, repo) => total + (repo.stars || 0), 0)
                              .toLocaleString()}
                      </strong>
                    </div>
                    <span className="cp-activity-icon">★</span>
                  </div>
                  <div className="cp-language-heading">
                    <span>Repository languages</span>
                    <span>COUNT</span>
                  </div>
                  {loading ? (
                    <p className="cp-muted-text">Loading languages…</p>
                  ) : error ? (
                    <p className="cp-muted-text">Language data unavailable.</p>
                  ) : repositories.length === 0 ? (
                    <p className="cp-muted-text">No language data available.</p>
                  ) : (
                    <LanguageBreakdown repositories={repositories} />
                  )}
                </section>

                {/* Quick shortcut to recently updated repositories */}
                <section className="cp-panel cp-recent-panel">
                  <PanelHeading title="Recently available" subtitle="Repositories from your GitHub account" />
                  {loading ? (
                    <p className="cp-muted-text">Loading repositories…</p>
                  ) : error ? (
                    <p className="cp-muted-text">Unable to load repository list.</p>
                  ) : repositories.length === 0 ? (
                    <p className="cp-muted-text">No repositories found.</p>
                  ) : (
                    repositories.slice(0, 3).map((repo) => (
                      <a
                        className="cp-recent-repo"
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        key={repo.id}
                      >
                        <span className="cp-recent-repo-icon" />
                        <span>
                          <strong>{repo.name}</strong>
                          <small>{repo.fullName}</small>
                        </span>
                        <span className="cp-recent-arrow">↗</span>
                      </a>
                    ))
                  )}
                </section>
              </div>

              {/* Workspace footer */}
              <footer className="cp-footer">
                <span>
                  CodePulse <span className="cp-footer-dot">●</span> Developer Intelligence
                </span>
                <span>AI analysis features are under development.</span>
              </footer>
            </>
          )}

          {/* Repositories page delegated to modular component */}
          {activePage === "repositories" && (
            <RepositoriesPage
              loading={loading}
              error={error}
              repositories={repositories}
              selectedRepo={selectedRepo}
              repoContents={repoContents}
              selectedFile={selectedFile}
              fileLoading={fileLoading}
              contentsLoading={contentsLoading}
              contentsError={contentsError}
              fetchRepoContents={fetchRepoContents}
              openRepoFile={openRepoFile}
              setSelectedRepo={setSelectedRepo}
              setRepoContents={setRepoContents}
              setSelectedFile={setSelectedFile}
              setContentsError={setContentsError}
            />
          )}

          {/* Placeholders for upcoming AI analysis and history features */}
          {["analysis", "history"].includes(activePage) && (
            <section className="cp-panel cp-future-panel">
              <div className="cp-future-icon">
                {activePage === "analysis" ? "✳" : "↺"}
              </div>
              <span className="cp-eyebrow">COMING IN THE NEXT PHASE</span>
              <h2>{activePage === "analysis" ? "AI Code Analysis" : "Analysis History"}</h2>
              <p>
                {activePage === "analysis"
                  ? "Gemini-powered codebase summaries, code quality insights and improvement suggestions will live here."
                  : "Your past code analyses and generated recommendations will be stored here once analysis history is implemented."}
              </p>
              <button
                className="cp-secondary-button"
                type="button"
                onClick={() => handleNavigation("repositories")}
              >
                Explore repositories
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// Reusable card showing a single metric with icon, value and sparkline graphic
function MetricCard({ icon, label, value, description, tone, points }) {
  return (
    <article className={`cp-metric-card tone-${tone}`}>
      <div className="cp-metric-heading">
        <span className="cp-metric-icon">{icon}</span>
        <span className="cp-metric-label">{label}</span>
        <span className="cp-metric-menu">•••</span>
      </div>
      <div className="cp-metric-value">{value}</div>
      <p>{description}</p>
      <div className="cp-sparkline" aria-hidden="true">
        <svg viewBox="0 0 130 40" preserveAspectRatio="none">
          <polyline points={points} />
        </svg>
      </div>
    </article>
  );
}

// Reusable panel header for dashboard cards
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

// Single insight row displaying tone icon, title and description
function InsightRow({ icon, tone, title, text }) {
  return (
    <div className="cp-insight-row">
      <span className={`cp-insight-icon tone-${tone}`}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

// Visual breakdown bars for top repository programming languages
function LanguageBreakdown({ repositories }) {
  // Tally repository counts per programming language
  const counts = repositories.reduce((result, repo) => {
    const language = repo.language || "Other";
    result[language] = (result[language] || 0) + 1;
    return result;
  }, {});

  // Extract top 4 languages sorted by frequency
  const languages = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const total = repositories.length;

  return (
    <div className="cp-language-list">
      {languages.map(([language, count], index) => (
        <div className="cp-language-row" key={language}>
          <div className="cp-language-label">
            <span className={`cp-language-color color-${index}`} />
            <span>{language}</span>
            <strong>{count}</strong>
          </div>
          <div className="cp-language-track">
            <span
              className={`cp-language-fill color-${index}`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
