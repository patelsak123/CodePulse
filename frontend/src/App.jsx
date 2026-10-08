import { useState } from "react";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";

function App() {
  const [page, setPage] = useState("register");
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

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