import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsTwitter } from "react-icons/bs";
import { useToast } from "@chakra-ui/toast";

function SignupBody() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const successToast = () => {
    toast({
      title: `Successfully registered, please login`,
      position: "top",
      isClosable: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:5001/signup`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ username: userName, password: password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          successToast();
          setUserName("");
          setPassword("");
          setTimeout(() => navigate("/"), 600);
        }
      });
  };

  return (
    <div className="container">
      <div className="homeContainer">
        <div className="homeContainer-logo"><BsTwitter /></div>
        <div className="homeContainer-header"><h2>Join Twitter today</h2></div>
        <form className="homeContainer-form" onSubmit={handleSubmit}>
          <input required type="text" placeholder="Enter Username" value={userName} onChange={(e) => setUserName(e.target.value.toLowerCase())} />
          <input required type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Sign up</button>
        </form>
        <div className="homeContainer-signup">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupBody;
