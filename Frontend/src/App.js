import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Feed from "./components/Feed";
import Home from "./routes/home";
import Profile from "./routes/profile";
import Search from "./routes/search";
import SignUp from "./routes/signUp";
import Topic from "./routes/topic";

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="HeaderAndFeed">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/topic" element={<Topic />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
 
export default App;