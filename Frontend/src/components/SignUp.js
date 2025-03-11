import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../reducers/user';
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import styles from '../styles/SignUp.module.css';

function SignUp() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.value);

    const navigate = useNavigate();

    if (user.token) {
        navigate('/');  // Redirection avec navigate
    }

    const [firstName, setFirstName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        fetch('https://tweeter-backend-two.vercel.app/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, username, password }),
        }).then(response => response.json())
            .then(data => {
                data.result && dispatch(login({ token: data.token, username, firstName }));
            });
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Create your Hackatweet account</h3>
            <input type="text" className={styles.input} onChange={(e) => setFirstName(e.target.value)} value={firstName} placeholder="Firstname" />
            <input type="text" className={styles.input} onChange={(e) => setUsername(e.target.value)} value={username} placeholder="Username" />
            <input type="password" className={styles.input} onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Password" />
            <button className={styles.button} onClick={() => handleSubmit()}>Sign up</button>
        </div>
    );
}

export default SignUp;
