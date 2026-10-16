import { useState } from "react";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";

// Root application component managing authentication state and top-level view routing
function App() {
  const [page, setPage] = useState("register");
  const [user, setUser] = useState(null);

  // Updates authenticated user state and navigates to the dashboard view
  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  // Clears user session data and returns to the login screen
  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  return (
    <>
      {page === "register" && (
        <Register goToLogin={() => setPage("login")} />
      )}

      {page === "login" && (
        <Login
          goToRegister={() => setPage("register")}
          onLogin={handleLogin}
        />
      )}

      {page === "dashboard" && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;