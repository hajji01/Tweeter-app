import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Tweet from "./Tweet";
import jwtDecode from "jwt-decode";
import axios from "axios";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { urlContext } from "../index";

function ProfileBody() {
  const [loading, setLoading] = useState(true);
  const [tweets, setTweets] = useState([]);
  const [activeUser, setActiveUser] = useState("");
  const [followers, setFollowers] = useState(0);
  const [followBtn, setFollowBtn] = useState("Follow");
  const [avatar, setAvatar] = useState("default-avatar.png");
  const navigate = useNavigate();
  let { userName } = useParams();
  const isActiveUser = activeUser === userName;
  const url = useContext(urlContext);

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch(`${url}/profile/${userName}`, {
        headers: { "x-access-token": localStorage.getItem("token") },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setActiveUser(data.activeUser);
        setTweets(data.tweets);
        setFollowers(data.followers);
        setFollowBtn(data.followBtn);
        setAvatar(data.avatar);
        setLoading(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  }, [url, userName]); // Ajout des dépendances pour éviter le warning

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const user = jwtDecode(token);
      if (!user) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        fetchProfileData();
      }
    } else navigate("/");
  }, [fetchProfileData, navigate]); // Correction des dépendances

  const handleFollow = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${url}/user/${activeUser}/follow/${userName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setFollowers(data.followers);
      setFollowBtn(data.followBtn);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleAvatarChange = async (e) => {
    const avatarId = e.target.id;
    try {
      const res = await axios.post(`${url}/avatar/${activeUser}`, {
        avatar: `Avatar-${avatarId}.png`,
      });
      if (res.data.status === "ok") {
        setAvatar(res.data.avatar);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  return (
    <div className="container">
      <div className="flex-avatar">
        <img className="profile-avatar" src={`${url}/images/${avatar}`} alt="avatar" />
        {isActiveUser && (
          <Popup trigger={<button className="tweetBtn">Choose avatar</button>} modal position="center">
            {(close) => (
              <div className="choose-avatar-container">
                {[...Array(15).keys()].map((i) => (
                  <img
                    key={i + 1}
                    id={i + 1}
                    className="choose-profile-avatar"
                    src={`${url}/images/Avatar-${i + 1}.png`}
                    onClick={(e) => {
                      close();
                      handleAvatarChange(e);
                    }}
                    alt={`Avatar-${i + 1}`}
                  />
                ))}
              </div>
            )}
          </Popup>
        )}
      </div>
      <div className="userName">{userName}</div>
      <div className="followFollowing">
        <div>
          <b>{followers}</b> Followers
        </div>
      </div>
      {!isActiveUser && (
        <div className="followBtn-div">
          <button className="followBtn" onClick={handleFollow}>
            {followBtn}
          </button>
        </div>
      )}
      <div className="userTweets">
        <div className="userTweets-heading">Tweets</div>
        <ul className="tweet-list">
          {loading ? <p>Loading...</p> : tweets.map((tweet) => <Tweet key={tweet.id} user={activeUser} body={tweet} />)}
        </ul>
      </div>
    </div>
  );
}

export default ProfileBody;
