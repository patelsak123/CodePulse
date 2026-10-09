
import { useEffect, useState } from "react";
import "./Dashboard.css";

// Renders the CodePulse analytics dashboard and workspace navigation.
function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Developer";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "repositories", label: "Repositories", icon: "⌘" },
    { id: "analysis", label: "AI Analysis", icon: "✳" },
    { id: "history", label: "History", icon: "↺" },
  ];

  // Loads repository details from the existing backend endpoint.
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/github/repos");
        if (!response.ok) throw new Error("Unable to load GitHub repositories.");
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

  // Changes the active workspace page.
  const handleNavigation = (page) => setActivePage(page);

  const pageTitle =
    navItems.find((item) => item.id === activePage)?.label || "Dashboard";

  return (
    <div className="cp-app">
      <aside className="cp-sidebar">
        <div className="cp-brand">
          <div className="cp-brand-icon">&lt;/&gt;</div>
          <div>
            <h2>CodePulse</h2>
            <span>Developer Intelligence</span>
          </div>
        </div>

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

        <div className="cp-sidebar-bottom">
          <div className="cp-user-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
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

      <main className="cp-main">
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

        <div className="cp-content">
          {activePage === "dashboard" && (
            <>
              <section className="cp-welcome">
                <div className="cp-welcome-copy">
                  <span className="cp-eyebrow">ENGINEERING PERFORMANCE WORKSPACE</span>
                  <h2>Your code. Your progress. <span>One pulse.</span></h2>
                  <p>
                    Welcome back, {firstName}. Explore your GitHub repositories
                    and prepare to turn code into actionable insights.
                  </p>
                  <button
                    className="cp-primary-button"
                    type="button"
                    onClick={() => handleNavigation("repositories")}
                  >
                    Explore repositories <span>↗</span>
                  </button>
                </div>
                <div className="cp-welcome-art" aria-hidden="true">
                  <div className="cp-art-ring cp-art-ring-one" />
                  <div className="cp-art-ring cp-art-ring-two" />
                  <div className="cp-art-core">&lt;/&gt;</div>
                  <span className="cp-art-dot cp-art-dot-one" />
                  <span className="cp-art-dot cp-art-dot-two" />
                </div>
              </section>

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

              <div className="cp-analytics-grid">
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
                    <div><span className="cp-quality-dot blue" /><span>Code quality</span><strong>—</strong></div>
                    <div><span className="cp-quality-dot teal" /><span>Test coverage</span><strong>—</strong></div>
                    <div><span className="cp-quality-dot purple" /><span>Review depth</span><strong>—</strong></div>
                  </div>
                </section>
              </div>

              <div className="cp-bottom-grid">
                <section className="cp-panel cp-insights-panel">
                  <PanelHeading
                    title="Developer insights"
                    subtitle="Your workspace at a glance"
                  />
                  <InsightRow icon="⌘" tone="blue" title="GitHub connected" text={`${loading ? "Checking repositories…" : error ? "Repository data unavailable" : `${repositories.length} repositories loaded from GitHub`}`} />
                  <InsightRow icon="✳" tone="purple" title="AI code intelligence" text="Gemini-powered analysis will be added in the next phase." />
                  <InsightRow icon="◇" tone="teal" title="Code health metrics" text="Health scores will appear after repository analysis is implemented." />
                  <InsightRow icon="↗" tone="amber" title="Next milestone" text="Explore a repository and prepare it for codebase analysis." />
                </section>

                <section className="cp-panel cp-activity-panel">
                  <PanelHeading
                    title="Workspace activity"
                    subtitle="GitHub repository snapshot"
                  />
                  <div className="cp-activity-total">
                    <div>
                      <span className="cp-summary-label">TOTAL STARS</span>
                      <strong>
                        {loading
                          ? "…"
                          : error
                            ? "—"
                            : repositories.reduce((total, repo) => total + (repo.stars || 0), 0).toLocaleString()}
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

                <section className="cp-panel cp-recent-panel">
                  <PanelHeading
                    title="Recently available"
                    subtitle="Repositories from your GitHub account"
                  />
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
                        <span className="cp-recent-repo-icon">&lt;/&gt;</span>
                        <span><strong>{repo.name}</strong><small>{repo.fullName}</small></span>
                        <span className="cp-recent-arrow">↗</span>
                      </a>
                    ))
                  )}
                </section>
              </div>

              <footer className="cp-footer">
                <span>CodePulse <span className="cp-footer-dot">●</span> Developer Intelligence</span>
                <span>AI analysis features are under development.</span>
              </footer>
            </>
          )}

          {activePage === "repositories" && (
            <section className="cp-panel cp-repositories-page">
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
                <div className="cp-message-state">No repositories found. Check your GitHub token permissions.</div>
              ) : (
                <div className="cp-repository-grid">
                  {repositories.map((repo) => (
                    <RepositoryCard key={repo.id} repo={repo} />
                  ))}
                </div>
              )}
            </section>
          )}

          {["analysis", "history"].includes(activePage) && (
            <section className="cp-panel cp-future-panel">
              <div className="cp-future-icon">{activePage === "analysis" ? "✳" : "↺"}</div>
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

// Displays a metric card with a decorative trend line, not live analytics.
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

// Displays a reusable section title and optional status label.
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

// Displays one short insight row.
function InsightRow({ icon, tone, title, text }) {
  return (
    <div className="cp-insight-row">
      <span className={`cp-insight-icon tone-${tone}`}>{icon}</span>
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}

// Calculates repository language counts from the GitHub API response.
function LanguageBreakdown({ repositories }) {
  const counts = repositories.reduce((result, repo) => {
    const language = repo.language || "Other";
    result[language] = (result[language] || 0) + 1;
    return result;
  }, {});

  const languages = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
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

// Displays a repository card with actual GitHub metadata.
function RepositoryCard({ repo }) {
  return (
    <article className="cp-repo-card">
      <div className="cp-repo-card-top">
        <span className="cp-repo-icon">⌘</span>
        <span className={`cp-repo-visibility ${repo.isPrivate ? "private" : ""}`}>
          {repo.isPrivate ? "Private" : "Public"}
        </span>
      </div>
      <h3>{repo.name}</h3>
      <p className="cp-repo-fullname">{repo.fullName}</p>
      <p className="cp-repo-description">{repo.description || "No description provided."}</p>
      <div className="cp-repo-meta">
        <span><span className="cp-language-dot" />{repo.language || "Not specified"}</span>
        <span>★ {repo.stars}</span>
      </div>
      <a className="cp-repo-link" href={repo.url} target="_blank" rel="noreferrer">
        Open on GitHub ↗
      </a>
    </article>
  );
}

export default Dashboard;