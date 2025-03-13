import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./routes/home";
import Topic from "./routes/topic";
import Profile from "./routes/profile";
import SignUp from "./routes/signUp";
import Search from "./routes/search";
import { ChakraProvider } from "@chakra-ui/react";
import { useContext, createContext } from "react";

// export const urlContext = createContext("");
export const nodeUrlContext = createContext("http://localhost:5001");
export const flaskUrlContext = createContext("http://localhost:5000");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <nodeUrlContext.Provider value="https://twitter-backend-ilpr.onrender.com">
    <flaskUrlContext.Provider value="http://localhost:5000">
      <ChakraProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<App />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/topic/" element={<Topic />} />
            <Route path="/topic/:tag" element={<Topic />} />
            <Route path="/profile/:userName" element={<Profile />} />
          </Routes>
        </BrowserRouter>
      </ChakraProvider>
    </flaskUrlContext.Provider>
  </nodeUrlContext.Provider>
);
