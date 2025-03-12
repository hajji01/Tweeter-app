const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const cors = require("cors");
const { User, Tweet, Comment } = require("./models/File");
const app = express();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
let path = require("path");
require("dotenv").config();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("build"));
app.use("/images", express.static("images"));
app.use("/tweetImages", express.static("tweetImages"));

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connecté : ${process.env.MONGO_URI}`);
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
};

connectDB();

// Création d'un tweet
app.post("/feed", async (req, res) => {
  const info = req.body;
  const tweetInfo = req.body.tweet;

  if (!tweetInfo || !tweetInfo.content || !tweetInfo.postedBy) {
    return res.status(400).json({ status: "error", error: "Champs requis manquants" });
  }

  try {
    const newTweet = new Tweet({
      content: tweetInfo.content,
      retweets: [],
      tag: tweetInfo.tag,
      postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });

    if (info.image) {
      newTweet.image = info.image;
    }

    // Vérifier si postedBy est un ID ou un objet
    let user;
    if (typeof tweetInfo.postedBy === "string") {
      user = await User.findById(tweetInfo.postedBy);
    } else {
      user = await User.findOne({ username: tweetInfo.postedBy.username });
    }

    if (!user) {
      return res.status(404).json({ status: "error", error: "Utilisateur introuvable" });
    }

    newTweet.postedBy = user._id;

    await newTweet.save(); // Assurer l'enregistrement

    user.tweets.unshift(newTweet._id);
    await user.save();

    return res.json({ status: "ok", tweet: newTweet, image: info.image || null });

  } catch (error) {
    console.error("Erreur lors de la création du tweet:", error);
    return res.status(500).json({ status: "error", error: "Une erreur est survenue" });
  }
});

// Création d'un commentaire
app.post("/feed/comment/:tweetId", async (req, res) => {
  const { content, postedBy } = req.body;
  const { tweetId } = req.params;

  if (!content || !postedBy) {
    return res.status(400).json({ status: "error", error: "Champs requis manquants" });
  }

  try {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ status: "error", error: "Tweet introuvable" });
    }

    let user;
    if (typeof postedBy === "string") {
      user = await User.findById(postedBy);
    } else {
      user = await User.findOne({ username: postedBy.username });
    }

    if (!user) {
      return res.status(404).json({ status: "error", error: "Utilisateur introuvable" });
    }

    const newComment = new Comment({
      content,
      postedBy: user._id,
      postedCommentTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });

    await newComment.save();
    tweet.comments.unshift(newComment._id);
    await tweet.save();

    return res.json({ status: "ok", newComment });

  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    return res.status(500).json({ status: "error", error: "Une erreur est survenue" });
  }
});

app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
