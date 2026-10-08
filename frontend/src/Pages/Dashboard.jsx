import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-card">

        <div className="dashboard-icon">
          👋
        </div>

        <h1>Welcome Back!</h1>

        <p className="dashboard-subtitle">
          You are successfully logged in.
        </p>

        <div className="user-info">
          <p>
            <span>Name</span>
            {user?.name || "User"}
          </p>

          <p>
            <span>Email</span>
            {user?.email || "No email"}
          </p>
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default Dashboard;