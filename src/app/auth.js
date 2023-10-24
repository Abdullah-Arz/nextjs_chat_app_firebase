"use client"

import { useEffect, createContext, useState, useContext } from "react";
import { auth, db } from "./firebase";
import Login from './Login/page';
import { doc, setDoc } from "firebase/firestore";
import Loading from './Loading/page'

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chat_id, setChat_id] = useState(null);
  const [friend_id, setFriend_id] = useState(null);
  const [currentActive, setcurrentActive] = useState({});
  const [context_messages, setcontext_Messages] = useState();

  const contaxtMessage = (newData) => {
    setcontext_Messages(newData)
  }


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is logged in
        const userData = {
          displayName: user.displayName,
          email: user.email,
          lastSeen: user.metadata.lastSignInTime,
          photoURL: user.photoURL,
        };

        // Set the user data in Firestore
        await setDoc(doc(db, 'users', user.uid), userData);
        setCurrentUser(user);
      } else {
        // User is logged out
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return unsubscribe; // Unsubscribe when the component unmounts
  }, []);

  if (loading) {
    return <Loading/>;
  }

  if (!currentUser) {
    return <Login />;

  }

  return (
    <AuthContext.Provider value={{ currentUser,chat_id, setChat_id,friend_id, setFriend_id ,currentActive, setcurrentActive, contaxtMessage, context_messages }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);