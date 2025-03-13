# Twitter Clone - MERN Stack

Un clone de Twitter développé avec la stack MERN (MongoDB, Express, React, Node.js).

## 📌 Fonctionnalités

- **Authentification JWT** : Inscription et connexion sécurisées.
- **Gestion de compte** : Personnalisation du profil avec avatar.
- **Tweets** : Création, édition et suppression de tweets.
- **Commentaires** : Réactions aux tweets avec possibilité d'édition et suppression.
- **Retweets** : Partage de tweets d'autres utilisateurs.
- **Likes** : Aimer des tweets et commentaires.
- **Suivi d'utilisateurs** : Suivre et être suivi par d'autres utilisateurs.
- **Gestion des images** : Ajout d'avatars et d'images aux tweets.
- **Système de topics** : Classement des tweets par sujets.

## 📁 Structure du projet

Le projet est divisé en deux dossiers :

### `backend/`
- Développé avec **Node.js**, **Express**, et **MongoDB**.
- Routes pour l'authentification, la gestion des tweets, des commentaires et des utilisateurs.
- Utilisation de **JWT** pour sécuriser l'API.
- **Multer** pour l'upload des images.
- Tests API avec **Postman**.

### `frontend/`
- Développé avec **React**.
- Interface utilisateur responsive.
- Consommation des API via **Axios**.
- Gestion de l'état avec **React Context API**.
- Routing avec **React Router**.

## 🚀 Installation et exécution

### Prérequis

- **Node.js** installé
- **MongoDB** (local ou **MongoDB Atlas**)
- **npm** ou **yarn**

### 1️⃣ Cloner le dépôt

```sh
$ git clone https://github.com/...
$ cd twitter-clone
```

### 2️⃣ Installation des dépendances

#### Backend
```sh
$ cd backend
$ npm install
```

#### Frontend
```sh
$ cd ../frontend
$ npm install
```

### 3️⃣ Configuration

Créer un fichier `.env` dans le dossier **backend/** et y ajouter :

```env
MONGO_URI=mongodb+srv://zysos:IPSSI2025@tweeter.8eyng.mongodb.net/?retryWrites=true&w=majority&appName=Tweeter
JWT_SECRET=mySuperSecretKey123!
FLASK_API_URL=http://127.0.0.1:5000
```

### 4️⃣ Lancer l'application

#### Démarrer le serveur backend
```sh
$ cd backend
$ nodemon server.js
```

#### Démarrer le client React
```sh
$ cd frontend
$ npm start
```

L'application sera disponible sur `http://localhost:5001`.

## 🛠 Technologies utilisées

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**
- **JWT** (JSON Web Token) pour l'authentification
- **Multer** pour la gestion des images
- **bcryptjs** pour le hachage des mots de passe

### Frontend
- **React.js**
- **React Router** pour la navigation


---

💡 _Projet développé par le Groupe 26
