import { useState } from "react";
import "./Register.css";

function Register({ goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server se connection nahi ho raha.");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <h1 className="register-title">Create Account</h1>

        <p className="register-subtitle">
          Create your account to get started
        </p>

        <form className="register-form" onSubmit={handleRegister}>

          <input
            className="register-input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="register-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="register-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="register-button" type="submit">
            Create Account
          </button>

        </form>

        <p className="register-message">{message}</p>

        <p>
          Already have an account?{" "}
          <button onClick={goToLogin}>
            Login
          </button>
        </p>

      </div>
    </div>
  );
}

export default Register;