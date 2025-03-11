import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../reducers/user';
import { loadTweets, addTweet } from '../reducers/tweets';
import LastTweets from './LastTweets';
import Trends from './Trends';
import styles from '../styles/Home.module.css';

function Home() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.value);
    const navigate = useNavigate();

    // Rediriger si l'utilisateur n'est pas connecté
    useEffect(() => {
        if (!user.token) {
            navigate('/login');
        }
    }, [user, navigate]);

    const [newTweet, setNewTweet] = useState('');

    // Charger les tweets au montage
    useEffect(() => {
        fetch('https://tweeter-backend-two.vercel.app/tweets/all')
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    dispatch(loadTweets(data.tweets));
                }
            })
            .catch(error => console.error('Erreur lors du chargement des tweets :', error));
    }, [dispatch]);

    const handleInputChange = (e) => {
        if (newTweet.length < 280 || e.nativeEvent.inputType === 'deleteContentBackward') {
            setNewTweet(e.target.value);
        }
    };

    const handleSubmit = () => {
        fetch('https://tweeter-backend-two.vercel.app/tweets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, content: newTweet }),
        }).then(response => response.json())
            .then(data => {
                if (data.result) {
                    dispatch(addTweet({ ...data.tweet, author: user }));
                    setNewTweet('');
                }
            });
    };

    return (
        <div className={styles.container}>
            {/* Section Gauche */}
            <div className={styles.leftSection}>
                <div>
                    <Link to="/">
                        <img src="/logo.png" alt="Logo" width={50} height={50} className={styles.logo} />
                    </Link>
                </div>
                <div>
                    <div className={styles.userSection}>
                        <img src="/avatar.png" alt="Avatar" width={46} height={46} className={styles.avatar} />
                        <div className={styles.userInfo}>
                            <p className={styles.name}>{user.firstName}</p>
                            <p className={styles.username}>@{user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { dispatch(logout()); navigate('/login'); }}
                        className={styles.logout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Section Milieu */}
            <div className={styles.middleSection}>
                <h2 className={styles.title}>Home</h2>
                <div className={styles.createSection}>
                    <textarea
                        type="text"
                        placeholder="What's up?"
                        className={styles.input}
                        onChange={handleInputChange}
                        value={newTweet}
                    />
                    <div className={styles.validateTweet}>
                        <p>{newTweet.length}/280</p>
                        <button className={styles.button} onClick={handleSubmit}>Tweet</button>
                    </div>
                </div>
                <LastTweets />
            </div>

            {/* Section Droite */}
            <div className={styles.rightSection}>
                <h2 className={styles.title}>Trends</h2>
                <Trends />
            </div>
        </div>
    );
}

export default Home;
