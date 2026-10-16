import React from "react";

// Reusable section header displaying a title, subtitle, and an optional status tag
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

export default PanelHeading;
