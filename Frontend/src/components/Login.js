import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../reducers/user';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = () => {
        const user = { token: 'fake-token', username, firstName: 'John' };
        dispatch(login(user));
    };

    return (
        <div>
            <h1>Login</h1>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={handleSubmit}>Login</button>
        </div>
    );
};

export default Login;
