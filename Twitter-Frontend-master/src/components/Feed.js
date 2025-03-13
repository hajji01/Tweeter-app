import React, { useState, useEffect, useContext } from "react";
import Tweet from "./Tweet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jwtDecode from "jwt-decode";
import moment from "moment";
import { flaskUrlContext, nodeUrlContext } from "../index";

function Feed() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState("");
  const navigate = useNavigate();
  const [tweetCount, setTweetCount] = useState(20);
  const FlaskUrl = useContext(flaskUrlContext);
  const url = useContext(nodeUrlContext);

  // Démarrer la détection
  const startDetection = async () => {
    try {
      const response = await axios.post(`${FlaskUrl}/start-detection`);
      console.log(response.data.message);
    } catch (error) {
      console.error("Erreur de démarrage de la détection:", error.message);
    }
  };

  // Récupérer l'émotion
  const getEmotion = async () => {
    try {
      const response = await axios.get(`${FlaskUrl}/get-most-common-emotion`);
      console.log("Émotion détectée:", response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'émotion:", error.message);
    }
  };

  // ✅ Fonction pour arrêter la détection d'émotions
  const stopDetection = async () => {
    try {
      const response = await axios.post(`${FlaskUrl}/stop-detection`);
      console.log("Détection arrêtée :", response.data.message);
    } catch (error) {
      console.error("Erreur lors de l'arrêt de la détection :", error.message);
    }
  };

  // ✅ Fonction pour charger les tweets
  async function populateTweets() {
    try {
      const req = await axios.get(`${url}/feed`, {
        headers: {
          "x-access-token": localStorage.getItem("token"),
        },
      });

      if (req.data.status === "ok") {
        setTweets(req.data.tweets);
        setActiveUser(req.data.activeUser.username);
        setLoading(false);
      } else {
        alert(req.data.error);
        navigate("/");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des tweets :", error.message);
    }
  }

  // ✅ Fonction pour charger plus de tweets
  async function addTweets(e) {
    e.preventDefault();
    try {
      const req = await axios.get(`${url}/feed?t=${tweetCount}`, {
        headers: {
          "x-access-token": localStorage.getItem("token"),
        },
      });

      if (req.data.status === "ok") {
        setTweets((prevTweets) => [...prevTweets, ...req.data.tweets]);
        setTweetCount((prevValue) => parseInt(prevValue) + 20);
      } else {
        alert(req.data.error);
        navigate("/");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de tweets :", error.message);
    }
  }

  // ✅ Utilisation des hooks
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const user = jwtDecode(token);
      if (!user) {
        localStorage.removeItem("token");
      } else {
        populateTweets();
      }
    } else {
      navigate("/");
    }

    // Démarrage de la détection d'émotions
    startDetection();

    // Récupérer les émotions toutes les 5 secondes
    const interval = setInterval(() => {
      getEmotion();
    }, 5000);

    // Nettoyage lors du démontage du composant
    return () => {
      stopDetection();
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <div className="tweets">
        <ul className="tweet-list">
          {loading ? (
            <div
              style={{ marginTop: "50px", marginLeft: "250px" }}
              className="loadingio-spinner-rolling-uzhdebhewyj"
            >
              <div className="ldio-gkgg43sozzi">
                <div></div>
              </div>
            </div>
          ) : (
            tweets.map((tweet) => (
              <Tweet
                key={tweet._id}
                updateLoading={setLoading}
                user={activeUser}
                body={tweet}
              />
            ))
          )}
        </ul>
      </div>
      <form className="showMore-form" onSubmit={addTweets}>
        <button className="showMore" type="submit">
          Show more tweets
        </button>
      </form>
    </div>
  );
}

export default Feed;
