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
const http = require('http');
const socketIo = require('socket.io');
const axios = require("axios");

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("build"));
app.use("/images", express.static("images"));
app.use("./tweetImages", express.static("tweetImages"));

const flaskApiUrl = process.env.FLASK_API_URL || "http://127.0.0.1:5000";

mongoose.set('strictQuery', true);
// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connecté : ${process.env.MONGO_URI}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

connectDB();
// Créer un serveur HTTP
const server = http.createServer(app); // Crée ton serveur HTTP avec Express
const io = socketIo(server, { // Utilise socketIo pour initialiser le serveur WebSocket
  cors: {
    origin: "http://localhost:3000", // Ajuste en fonction de ton frontend
    methods: ["GET", "POST"]
  }
});

// ton code de gestion des notifications
io.on("connection", (socket) => {
    console.log(`Nouvel utilisateur connecté : ${socket.id}`);

    socket.on("registerUser", (userId) => {
        usersSockets[userId] = socket.id;
        console.log(`Utilisateur ${userId} enregistré avec le socket ${socket.id}`);
    });

    socket.on("sendNotification", ({ recipientId, message }) => {
        console.log(`Notification pour ${recipientId}: ${message}`);

        if (usersSockets[recipientId]) {
            io.to(usersSockets[recipientId]).emit("receiveNotification", { message });
            console.log(`Notification envoyée à ${recipientId}`);
        } else {
            console.log(`L'utilisateur ${recipientId} est hors ligne`);
        }
    });

    socket.on("disconnect", () => {
        for (const userId in usersSockets) {
            if (usersSockets[userId] === socket.id) {
                console.log(`Utilisateur ${userId} déconnecté`);
                delete usersSockets[userId];
                break;
            }
        }
    });
});

server.listen(5000, () => {
    console.log("Serveur WebSocket et API en ligne sur http://localhost:5000");
});
//Connexion
app.post("/", (req, res) => {
  const userLogin = req.body;
  User.findOne({ username: userLogin.username }).then((dbUser) => {
    if (!dbUser) {
      return res.json({
        status: "error",
        error: "Invalid login",
      });
    }
    bcrypt.compare(userLogin.password, dbUser.password).then((isCorrect) => {
      if (isCorrect) {
        const payload = {
          id: dbUser._id,
          username: dbUser.username,
        };

        // Génération du token
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
          expiresIn: 86400, // 1 jour d'expiration
        });

        return res.json({ status: "ok", user: token });
      } else {
        return res.json({ status: "error", user: false });
      }
    });
  });
});

//inscription
app.post("/signup", async (req, res) => {
  const user = req.body;
  const takenUsername = await User.findOne({ username: user.username });

  if (takenUsername) {
    return res.json({ status: "error", error: "username already taken" });
  } else {
    user.password = await bcrypt.hash(req.body.password, 10);

    const dbUser = new User({
      username: user.username.toLowerCase(),
      password: user.password,
      avatar: "initial-avatar.png",
    });

    dbUser.save();
    return res.json({ status: "ok" });
  }
});

// deconnexion 
app.post("/logout", (req, res) => {
  return res.json({ status: "ok", message: "Successfully logged out" });
});

//feed
app.get("/feed", async (req, res) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ status: "error", error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const username = decoded.username;
    const user = await User.findOne({ username: username });

    const tweetsToSkip = req.query.t || 0;

    // récupérer les tweets
    Tweet.find({ isRetweeted: false })
      .populate("postedBy")
      .populate("comments")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(20)
      .exec((err, docs) => {
        if (!err) {
          docs.forEach((doc) => {
            // vrifier si un tweet ou un commentaire est apprécié
            doc.likeTweetBtn = doc.likes.includes(username) ? "deeppink" : "black";
            doc.comments.forEach((comment) => {
              comment.likeCommentBtn = comment.likes.includes(username) ? "deeppink" : "black";
            });
            doc.retweetBtn = doc.retweets.includes(username) ? "green" : "black";
            doc.save();
          });

          return res.json({
            status: "ok",
            tweets: docs,
            activeUser: user,
          });
        } else {
          return res.json({ status: "error", error: "Error fetching tweets" });
        }
      });
  } catch (error) {
    return res.json({ status: "error", error: "Session ended :(" });
  }
});

//rédiger un tweet

app.post("/feed", async (req, res) => {
  const info = req.body;
  const tweetInfo = req.body.tweet;

  if (!tweetInfo || !tweetInfo.content || !tweetInfo.postedBy) {
    return res.status(400).json({ status: "error", error: "Missing required fields" });
  }

  try {
    // Créer un nouveau tweet
    const newTweet = new Tweet({
      content: tweetInfo.content,
      retweets: [],
      tag: tweetInfo.tag,
      postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });

    if (info.image) {
      newTweet.image = info.image;
    } else {
      console.log("No image found");
    }

    // Récupérer l'utilisateur
    const user = await User.findOne({ username: tweetInfo.postedBy.username });
    if (!user) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    // Assigner l'utilisateur au tweet
    newTweet.postedBy = user._id;

    // Sauvegarder le tweet
    await newTweet.save();

    // Ajouter le tweet à la liste des tweets de l'utilisateur
    user.tweets.unshift(newTweet._id);
    await user.save();

    return res.json({ status: "ok", tweet: newTweet, image: info.image || null });

  } catch (error) {
    console.error("Error occurred while posting tweet:", error);
    return res.status(500).json({ status: "error", error: "An error occurred" });
  }
});


//compose comment
app.post("/feed/comment/:tweetId", (req, res) => {
  // Création du commentaire
  Comment.create(
    {
      content: req.body.content,
      postedCommentTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    (err, newComment) => {
      if (err) {
        return res.json({ status: "error", error: "An error occurred while creating the comment" });
      }

      // Recherche du tweet par son ID (pas `postedTweetTime`)
      Tweet.findById(req.params.tweetId, (err, doc) => {
        if (err || !doc) {
          return res.json({ status: "error", error: "Tweet not found" });
        }

        // Recherche de l'utilisateur pour le commentaire
        User.findOne({ username: req.body.postedBy.username }, (err, user) => {
          if (err || !user) {
            return res.json({ status: "error", error: "User not found" });
          }

          // Ajout de l'utilisateur au commentaire
          newComment.postedBy = user._id;

          // Sauvegarde du commentaire
          newComment.save((err) => {
            if (err) {
              return res.json({ status: "error", error: "Failed to save comment" });
            }

            // Ajout du commentaire à la liste des commentaires du tweet
            doc.comments.unshift(newComment._id);
            doc.save((err) => {
              if (err) {
                return res.json({ status: "error", error: "Failed to update tweet with comment" });
              }

              // Retourner les données après une sauvegarde réussie
              return res.json({
                status: "ok",
                comments: doc.comments.length,
                newComment: newComment, // Optionnel: inclure le commentaire ajouté dans la réponse
              });
            });
          });
        });
      });
    }
  );
});

//retweet
app.route("/post/:userName/retweet/:tweetId").post(async (req, res) => {
  try {
    // Recherche du tweet avec l'ObjectId du tweet
    const tweetId = req.params.tweetId; // Récupère l'ID du tweet passé dans l'URL
    const doc = await Tweet.findById(tweetId);  // Utilise findById pour rechercher par _id MongoDB

    if (!doc) {
      return res.status(404).json({ status: "error", message: "Tweet not found" });
    }

    const userName = req.params.userName;

    if (!doc.retweets.includes(userName)) {
      // Créer un nouveau retweet
      const newTweet = await Tweet.create({
        content: doc.content,
        postedBy: doc.postedBy,
        likes: doc.likes,
        likeTweetBtn: doc.likeTweetBtn,
        image: doc.image,
        postedTweetTime: doc.postedTweetTime,
        retweetedByUser: userName,
        isRetweeted: true,
        retweetBtn: "green",
        retweets: [userName],
      });

      // Ajouter le nouveau retweet au tweet de l'utilisateur
      const user = await User.findOne({ username: userName });
      if (user) {
        user.tweets.unshift(newTweet._id);
        await user.save();
      } else {
        return res.status(404).json({ status: "error", message: "User not found" });
      }

      // Mettre à jour le tweet original pour ajouter le retweet
      doc.retweets.push(userName);
      doc.retweetBtn = "green";
      await doc.save();

      return res.json({
        status: "success",
        message: "Retweet created successfully",
        retweetId: newTweet._id,
      });
    } else {
      // Retirer un retweet existant
      const user = await User.findOne({ username: userName });
      if (user) {
        const deletedTweet = await Tweet.deleteOne({
          postedBy: user._id,
          content: doc.content,
          isRetweeted: true,
        });

        // Vérifier si le tweet a été supprimé
        if (deletedTweet.deletedCount === 0) {
          return res.status(404).json({ status: "error", message: "Retweet not found to delete" });
        }

        // Retirer l'utilisateur du tableau des retweets et mettre à jour le bouton
        const indexForRetweets = doc.retweets.indexOf(userName);
        if (indexForRetweets > -1) {
          doc.retweets.splice(indexForRetweets, 1);
          doc.retweetBtn = "black";
          await doc.save();

          return res.json({
            status: "success",
            message: "Retweet removed successfully",
          });
        } else {
          return res.status(404).json({ status: "error", message: "User did not retweet this tweet" });
        }
      } else {
        return res.status(404).json({ status: "error", message: "User not found" });
      }
    }
  } catch (err) {
    console.error("Error handling retweet:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Like/unlike pour un tweet
app.route("/post/:userName/like/:tweetId").post((req, res) => {
  // Recherche du tweet avec l'ID spécifique
  Tweet.findById(req.params.tweetId, (err, doc) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Error finding tweet" });
    }
    if (!doc) {
      return res.status(404).json({ status: "error", message: "Tweet not found" });
    }

    // Ajout ou suppression du like
    if (!doc.likes.includes(req.params.userName)) {
      doc.likes.push(req.params.userName);  // Ajout du like
      doc.likeTweetBtn = "deeppink";  // Mise à jour de la couleur du bouton
    } else {
      const indexForLikes = doc.likes.indexOf(req.params.userName);
      doc.likes.splice(indexForLikes, 1);  // Suppression du like
      doc.likeTweetBtn = "black";  // Réinitialisation de la couleur du bouton
    }

    // Sauvegarde du tweet après modification
    doc.save((saveErr, updatedTweet) => {
      if (saveErr) {
        return res.status(500).json({ status: "error", message: "Error saving tweet" });
      }
      return res.json({ status: "success", likes: updatedTweet.likes.length, btnColor: updatedTweet.likeTweetBtn });
    });
  });
});

// Like/unlike pour un commentaire
app.route("/comment/:userName/like/:commentId").post((req, res) => {
  // Recherche du commentaire par son ID
  Comment.findOne({ postedCommentTime: req.params.commentId }, (err, doc) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Error finding comment" });
    }
    if (!doc) {
      return res.status(404).json({ status: "error", message: "Comment not found" });
    }

    // Ajout ou suppression du like sur le commentaire
    if (!doc.likes.includes(req.params.userName)) {
      doc.likes.push(req.params.userName);  // Ajout du like
      doc.likeCommentBtn = "deeppink";  // Mise à jour de la couleur du bouton
    } else {
      const indexForLikes = doc.likes.indexOf(req.params.userName);
      doc.likes.splice(indexForLikes, 1);  // Suppression du like
      doc.likeCommentBtn = "black";  // Réinitialisation de la couleur du bouton
    }

    // Sauvegarde du commentaire après modification
    doc.save((saveErr, updatedComment) => {
      if (saveErr) {
        return res.status(500).json({ status: "error", message: "Error saving comment" });
      }
      return res.json({ status: "success", likes: updatedComment.likes.length, btnColor: updatedComment.likeCommentBtn });
    });
  });
});


//delete tweet
app.route("/deleteTweet/:tweetId").post((req, res) => {
  Tweet.findOneAndDelete({ postedTweetTime: req.params.tweetId }, (err) => {
    if (!err) {
      return res.json({
        status: "ok",
      });
    } else console.log(err);
  });
});

//delete comment
app.route("/deleteComment/:commentId").post((req, res) => {
  Comment.findOneAndDelete(
    { postedCommentTime: req.params.commentId },
    (err) => {
      if (!err) {
        return res.json({
          status: "ok",
        });
      } else console.log(err);
    }
  );
});

//edit tweet
app.route("/editTweet/:tweetId").post((req, res) => {
  Tweet.findOne({ postedTweetTime: req.params.tweetId }, (err, doc) => {
    doc.content = req.body.content;
    doc.isEdited = true;
    doc.save();
    return res.json({
      status: "ok",
    });
  });
});

//edit comment
app.route("/editComment/:commentId").post((req, res) => {
  Comment.findOne({ postedCommentTime: req.params.commentId }, (err, doc) => {
    doc.content = req.body.content;
    doc.isEdited = true;
    doc.save();
    return res.json({
      status: "ok",
    });
  });
});

app.post("/avatar/:userName", (req, res) => {
  User.findOne({ username: req.params.userName }, (err, user) => {
    if (!err) {
      user.avatar = req.body.avatar;
      if (user.avatar) {
        user.save();
        return res.json({ status: "ok", avatar: req.body.avatar });
      }
    } else return res.json({ status: "error", error: "Please choose again" });
  });
});

//profil utilisateur

app.get("/profile/:userName", async (req, res) => {
  const token = req.headers["x-access-token"];
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept"
  // );

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const username = decoded.username;
    User.findOne({ username: req.params.userName })
      .populate({
        path: "tweets",
        populate: [
          { path: "postedBy" },
          { path: "comments", populate: [{ path: "postedBy" }] },
        ],
      })

      .exec((err, doc) => {
        if (!err) {
          if (!doc.followers.includes(username)) {
            doc.followBtn = "Follow";
          } else doc.followBtn = "Following";

          doc.tweets.forEach((tweet) => {
            if (!tweet.likes.includes(username)) {
              tweet.likeTweetBtn = "black";
            } else tweet.likeTweetBtn = "deeppink";
          });

          doc.tweets.forEach((tweet) => {
            if (!tweet.retweets.includes(username)) {
              tweet.retweetBtn = "black";
            } else tweet.retweetBtn = "green";
          });

          return res.json({
            status: "ok",
            tweets: doc.tweets,
            followers: doc.followers.length,
            followBtn: doc.followBtn,
            activeUser: username,
            avatar: doc.avatar,
          });
        } else console.log(err);
      });
  } catch (error) {
    return res.json({ status: "error", error: "invalid token" });
  }
});

//suivre
//nom d'utilisateur = utilisateur actif
//utilisateur = profil
app.route("/user/:user/follow/:userName").post((req, res) => {
  User.findOne({ username: req.params.userName }, (err, doc) => {
    if (!err) {
      if (doc.username !== req.params.user) {
        if (!doc.followers.includes(req.params.user)) {
          doc.followers.push(req.params.user);
          doc.followBtn = "Following";
          doc.save();
        } else {
          let indexForUnFollow = doc.followers.indexOf(req.params.user);
          doc.followers.splice(indexForUnFollow, 1);
          doc.followBtn = "Follow";
          doc.save();
        }
        return res.json({
          followers: doc.followers.length,
          followBtn: doc.followBtn,
        });
      }
    }
  });
});

// page de recherche

app.get("/search/:user", (req, res) => {
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept"
  // );

  User.find(
    { username: { $regex: `${req.params.user}`, $options: "i" } },
    function (err, docs) {
      if (!err) {
        return res.json({ status: "ok", users: docs });
      } else return res.json({ status: "error", error: err });
    }
  );
});

app.get("/topic/:tag", async (req, res) => {
  const token = req.headers["x-access-token"];

  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept"
  // );

  const tweetsToSkip = req.query.t || 0;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const username = decoded.username;
    const user = await User.findOne({ username: username });
    Tweet.find({ isRetweeted: false, tag: req.params.tag })
      .populate("postedBy")
      .populate("comments")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(20)
      .exec((err, docs) => {
        if (!err) {
          //pour savoir si une personne a aimé un tweet
          docs.forEach((doc) => {
            if (!doc.likes.includes(username)) {
              doc.likeTweetBtn = "black";
              doc.save();
            } else {
              doc.likeTweetBtn = "deeppink";
              doc.save();
            }
          });

          //savoir si une personne a aimé le commentaire
          docs.forEach((doc) => {
            doc.comments.forEach((docComment) => {
              if (!docComment.likes.includes(username)) {
                docComment.likeCommentBtn = "black";
                docComment.save();
              } else {
                docComment.likeCommentBtn = "deeppink";
                docComment.save();
              }
            });
          });

          //savoir si une personne a retweeté le tweet
          docs.forEach((doc) => {
            if (!doc.retweets.includes(username)) {
              doc.retweetBtn = "black";
            } else {
              doc.retweetBtn = "green";
            }
          });

          return res.json({
            status: "ok",
            tweets: docs,
            activeUser: user,
          });
        }
      });
  } catch (error) {
    return res.json({ status: "error", error: "Session ended :(" });
  }
});

// Servir les fichiers du frontend en production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
};


// Démarrer la détection d'émotions via Flask
app.post("/start-detection", async (req, res) => {
  try {
    const response = await axios.post(`${flaskApiUrl}/debut_detection`);
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors du démarrage de la détection:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Arrêter la détection d'émotions via Flask
app.post("/stop-detection", async (req, res) => {
  try {
    const response = await axios.post(`${flaskApiUrl}/stop_detection`);
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de l'arrêt de la détection:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Obtenir l'émotion la plus courante via Flask
app.get("/get-most-common-emotion", async (req, res) => {
  try {
    const response = await axios.get(`${flaskApiUrl}/emotion_detecte`);
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'émotion:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});


app.listen(port, () => {
  console.log("server running on port " + port);
});
