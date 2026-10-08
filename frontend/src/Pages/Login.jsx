import { useState } from "react";
import "./Login.css";

function Login({ goToRegister, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);

        // Login successful → Dashboard
        onLogin({
          name: data.user.name,
          email: data.user.email,
        });

        setEmail("");
        setPassword("");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.log(error);
      setMessage("Server se connection nahi ho raha.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1 className="login-title">Welcome Back</h1>

        <p className="login-subtitle">
          Login to your account
        </p>

        <form className="login-form" onSubmit={handleLogin}>

          <input
            className="login-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="login-button" type="submit">
            Login
          </button>

        </form>

        <p className="login-message">
          {message}
        </p>

        <p>
          Don't have an account?{" "}
          <button onClick={goToRegister}>
            Create Account
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;