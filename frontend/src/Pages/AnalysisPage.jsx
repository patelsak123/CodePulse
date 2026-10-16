import React, { useState } from "react";
import PanelHeading from "../components/PanelHeading";
import "./Dashboard.css";

// Analysis view handling the AI analysis workflow for a selected repository
function AnalysisPage({ selectedRepo, onBack }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  // Triggers repository source-code collection and AI analysis on the backend
  const handleStartAnalysis = async () => {
    if (!selectedRepo || analyzing) return;
    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5001/api/analysis/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: {
            id: selectedRepo.id,
            name: selectedRepo.name,
            fullName: selectedRepo.fullName,
            description: selectedRepo.description,
            language: selectedRepo.language,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Analysis request failed");
      }

      setAnalysisResult(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Network error occurred while connecting to backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!selectedRepo) {
    return (
      <section className="cp-panel cp-analysis-page">
        <div className="cp-message-state">
          <strong>No repository selected</strong>
          <p>Please select a repository from the repositories list to begin analysis.</p>
          <button className="cp-secondary-button" type="button" onClick={onBack}>
            ← Back to repositories
          </button>
        </div>
      </section>
    );
  }

  const statusTag = analyzing
    ? "ANALYZING WITH GEMINI"
    : analysisResult
    ? "ANALYSIS COMPLETE"
    : "READY";

  return (
    <section className="cp-panel cp-analysis-page">
      <div className="cp-back-wrapper">
        <button className="cp-back-button" type="button" onClick={onBack}>
          ← Back to repositories
        </button>
      </div>

      <PanelHeading
        title={selectedRepo.name}
        subtitle={selectedRepo.fullName}
        tag={statusTag}
      />

      <div className="cp-analysis-workspace">
        {analysisResult && analysisResult.status === "completed" ? (
          <div className="cp-analysis-results">
            <div className="cp-analysis-summary-card">
              <div className="cp-analysis-summary-top">
                <div className="cp-analysis-summary-header">
                  <div className="cp-analysis-icon">✳</div>
                  <div>
                    <h3>AI Executive Summary</h3>
                    <div className="cp-analysis-stats-row">
                      <span className="cp-analysis-badge">
                        <strong>{analysisResult.fileCount || (analysisResult.files ? analysisResult.files.length : 0)}</strong> source files analyzed
                      </span>
                      <span className="cp-analysis-repo-tag">
                        Repository: <code>{analysisResult.repository}</code>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="cp-secondary-button"
                  type="button"
                  disabled={analyzing}
                  onClick={handleStartAnalysis}
                >
                  {analyzing ? (
                    <>
                      <span className="cp-spinner" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    "Re-analyze Repository"
                  )}
                </button>
              </div>

              <p className="cp-analysis-summary-text">{analysisResult.summary}</p>
            </div>

            <div className="cp-analysis-grid-two">
              <div className="cp-analysis-box">
                <div className="cp-analysis-box-header">
                  <div className="cp-analysis-box-title">
                    <span className="cp-analysis-box-icon architecture">▦</span>
                    <strong>Architecture & Patterns</strong>
                  </div>
                </div>
                <p className="cp-analysis-box-text">{analysisResult.architecture}</p>
              </div>

              <div className="cp-analysis-box">
                <div className="cp-analysis-box-header">
                  <div className="cp-analysis-box-title">
                    <span className="cp-analysis-box-icon quality">◇</span>
                    <strong>Code Quality & Standards</strong>
                  </div>
                </div>
                <p className="cp-analysis-box-text">{analysisResult.codeQuality}</p>
              </div>
            </div>

            <div className="cp-analysis-grid-two">
              <div className="cp-analysis-box">
                <div className="cp-analysis-box-header">
                  <div className="cp-analysis-box-title">
                    <span className="cp-analysis-box-icon issues">⚠</span>
                    <strong>Issues & Observations</strong>
                  </div>
                  <span className="cp-analysis-box-count">
                    {analysisResult.issues ? analysisResult.issues.length : 0} items
                  </span>
                </div>

                {analysisResult.issues && analysisResult.issues.length > 0 ? (
                  <ul className="cp-analysis-list">
                    {analysisResult.issues.map((issue, idx) => (
                      <li key={idx} className="cp-analysis-list-item issue">
                        <span className="cp-item-bullet">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cp-analysis-box-text">No critical issues observed in the analyzed files.</p>
                )}
              </div>

              <div className="cp-analysis-box">
                <div className="cp-analysis-box-header">
                  <div className="cp-analysis-box-title">
                    <span className="cp-analysis-box-icon recommendations">↗</span>
                    <strong>Actionable Recommendations</strong>
                  </div>
                  <span className="cp-analysis-box-count">
                    {analysisResult.recommendations ? analysisResult.recommendations.length : 0} suggestions
                  </span>
                </div>

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                  <ul className="cp-analysis-list">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="cp-analysis-list-item recommendation">
                        <span className="cp-item-bullet">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cp-analysis-box-text">No recommendations available for the current source files.</p>
                )}
              </div>
            </div>

            {analysisResult.files && analysisResult.files.length > 0 && (
              <div className="cp-analysis-file-preview">
                <span className="cp-analysis-preview-title">Analyzed Source Files:</span>
                <ul className="cp-analysis-file-list">
                  {analysisResult.files.slice(0, 10).map((file) => (
                    <li key={file.path}>
                      <code>{file.path}</code>
                    </li>
                  ))}
                  {analysisResult.files.length > 10 && (
                    <li className="cp-analysis-more-files">
                      + {analysisResult.files.length - 10} more files
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="cp-analysis-card cp-analysis-ready">
            <div className="cp-analysis-icon">⌘</div>
            <div className="cp-analysis-details">
              <strong>Ready to analyze this repository.</strong>
              <p>
                Initiate the code analysis workflow to collect repository source files and generate an AI-powered architectural and quality evaluation using Google Gemini.
              </p>
            </div>
            <div className="cp-analysis-actions">
              <button
                className="cp-primary-button"
                type="button"
                disabled={analyzing}
                onClick={handleStartAnalysis}
              >
                {analyzing ? (
                  <>
                    <span className="cp-spinner" aria-hidden="true" />
                    Analyzing with Gemini AI…
                  </>
                ) : (
                  <>Start Analysis <span>→</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="cp-analysis-error-banner">
            <span className="cp-error-icon">⚠</span>
            <div className="cp-error-body">
              <strong>Analysis failed</strong>
              <p>{error}</p>
            </div>
            <button
              className="cp-secondary-button"
              type="button"
              onClick={handleStartAnalysis}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default AnalysisPage;
