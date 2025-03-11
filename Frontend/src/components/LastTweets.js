import React from 'react';
import { useSelector } from 'react-redux';
import Tweet from './Tweet';
import styles from '../styles/LastTweets.module.css';

function LastTweets() {
    const tweetsData = useSelector((state) => state.tweets.value);

    return (
        <>
            {tweetsData.map((data, i) => (
                <Tweet key={i} {...data} />
            ))}
        </>
    );
}

export default LastTweets;
