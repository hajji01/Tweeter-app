
import React from 'react';
import 'antd/dist/antd.css';
import './index.css';
import './styles/globals.css';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { persistStore, persistReducer } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import storage from 'redux-persist/lib/storage';
import user from './reducers/user';
import tweets from './reducers/tweets';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';

const reducers = combineReducers({ user, tweets });
const persistConfig = {
  key: 'hackatweet',
  storage,
  blacklist: ['tweets'],
};

const store = configureStore({
  reducer: persistReducer(persistConfig, reducers),
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

const persistor = persistStore(store);

function App() {
  console.log("App.js is rendering...");

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
