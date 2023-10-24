"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db,auth } from "../firebase";
import { useAuth } from "../auth";
import { Button, user } from "@nextui-org/react";
import InputEmoji from "react-input-emoji";
import firebase from "firebase/app";
import "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function page() {
  const { chat_id, currentUser, friend_id, contaxtMessage, context_messages } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [prevChatId, setPrevChatId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Unread message count
  const messageContainerRef = useRef(null);
  const [messageTimestamps, setMessageTimestamps] = useState({});
  const [unreadMessageCount, setUnreadMessageCount] = useState({}); // Unread message count
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(null);
  const inputRef = useRef(null);
  const messagesRef = useMemo(() => {
    return chat_id ? collection(db, "chats", chat_id, "messages") : null;
  }, [chat_id]);



//   useEffect(()=>{

//     window.addEventListener("online", handleOnlineStatus)
//     window.addEventListener("Offline", handleOfflineStatus)

//     return () => {
//         window.addEventListener("online", handleOnlineStatus)
//     window.addEventListener("Offline", handleOfflineStatus)
//     };
//   },[]);


//   function handleOnlineStatus(){
//     console.log("Online event fired");
//     setIsOnline(true)
// }

// function handleOfflineStatus(){
//     console.log("Offline event fired");
//     setIsOnline(false)
// }

// console.log('User Status ----- ', isOnline)

  useEffect(() => {
    scrollToBottom();
  }, []);
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "unreadCounts", currentUser.uid);

        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUnreadCount(userData.unreadCount || 0);
        }
        if (chat_id) {
          setUnreadCount(0);
          updateUnreadCountInFirestore(0);
        }
      }
    };
    
    fetchUnreadCount();
  }, [currentUser]);

  // User Online/Offline Status Code

  useEffect(()=>{
    // console.log('Dataa')
    const onlineStatusRef = doc(db, "onlineStatus", currentUser.uid);
    setDoc(onlineStatusRef, { online: true });
    // setDoc(onlineStatusRef, { online: false });
  },[currentUser])

  useEffect(() => {
    console.log('friend_id ----- ',friend_id)
    if(friend_id){
 // Listen to changes in the online status document of the chat partner (friend)
 const onlineStatusRef = doc(db, "onlineStatus", friend_id);
 
 onSnapshot(onlineStatusRef, (doc) => {
     const data = doc.data();
     if (data) {
        // console.log('Status ', data.online)
       setIsOnline(data.online);
     }
   });
    
    // Cleanup the listener when the component unmounts
    
}
   
  }, [friend_id]);

  


  useEffect(() => {
    if (chat_id !== prevChatId) {
      fetchChatUserInfo();
      setPrevChatId(chat_id);
      setUnreadCount(0); // Reset unread count when the chat changes
      scrollToBottom();
    }
  }, [chat_id]);

  useEffect(() => {
    if (messagesRef) {
      const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(newMessages);
        contaxtMessage(newMessages);
        console.log('newMessages',newMessages)
        scrollToBottom();

        // Check if the user is currently viewing the chat
        if (chat_id) {
          setUnreadCount(0);
          updateUnreadCountInFirestore(0);
        }
      });

      return () => unsubscribe();
    }
  }, [messagesRef, chat_id]);
  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      const element = messageContainerRef.current;
      const start = element.scrollTop;
      const end = element.scrollHeight;
      const duration = 300; // Adjust the duration for desired smoothness

      const startTime = performance.now();

      const animateScroll = (currentTime) => {
        const elapsedTime = currentTime - startTime;

        if (elapsedTime < duration) {
          element.scrollTop = easeInOutCubic(
            elapsedTime,
            start,
            end - start,
            duration
          );
          requestAnimationFrame(animateScroll);
        } else {
          element.scrollTop = end;
        }
      };

      const easeInOutCubic = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t * t + b;
        t -= 2;
        return (c / 2) * (t * t * t + 2) + b;
      };

      requestAnimationFrame(animateScroll);
    }
  };

  const chatDocRef = chat_id ? doc(db, "chats", chat_id) : null;
  useEffect(() => {
    if (chat_id !== prevChatId) {
      fetchChatUserInfo();
      setPrevChatId(chat_id); // Update prevChatId when chat_id changes
    }
  }, [chat_id, prevChatId]);

  

  const fetchChatUserInfo = async () => {
    if (chat_id) {
      const chatDocSnapshot = await getDoc(chatDocRef);
      if (chatDocSnapshot.exists()) {
        const chatData = chatDocSnapshot.data();
        setLastMessage(chatData.lastMessage);

        const userIds = chatData.users;
        console.log('User Ids ---- ', userIds)
        const otherUserId = userIds.find(
          (userId) => userId !== currentUser.uid
        );
        const userDocRef = doc(db, "users", otherUserId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setChatUser(userData);
          scrollToBottom();
        }
      }
    }
  };

  const sendMessage = async (e) => {
    setMessage("");
    // e.preventDefault();

    if (message.trim() === "") return;

    if (chat_id && messagesRef) {
      const newMessage = {
        text: message,
        sender: currentUser.displayName,
        timestamp: serverTimestamp(),
      };

      await addDoc(messagesRef, newMessage);
      await docUpdate(chatDocRef, { lastMessage: newMessage });
      scrollToBottom();

      // Increment the unread count
      setUnreadCount(unreadCount + 1);
      updateUnreadCountInFirestore(unreadCount + 1);
    }
  };

  const docUpdate = async (docRef, data) => {
    try {
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  useEffect(() => {
    if (messagesRef) {
      const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [messagesRef]);
  const updateUnreadCountInFirestore = async (count) => {
    if (currentUser) {
      const userDocRef = doc(db, "unreadCounts", currentUser.uid);

      await setDoc(userDocRef, { unreadCount: count }, { merge: true });
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "unreadCounts"),
      (snapshot) => {
        const unreadCounts = {};
        snapshot.forEach((doc) => {
          unreadCounts[doc.id] = doc.data().unreadCount;
        });
        setUnreadMessageCount(unreadCounts);
      }
    );
    return () => unsubscribe();
  }, [messages]);

  const sortedMessages = messages.slice().sort((a, b) => {
    if (a.timestamp instanceof Timestamp && b.timestamp instanceof Timestamp) {
      return a.timestamp.toMillis() - b.timestamp.toMillis();
    } else if (a.timestamp instanceof Timestamp) {
      // 'a' has a valid timestamp, but 'b' does not
      return -1; // Place 'a' before 'b'
    } else if (b.timestamp instanceof Timestamp) {
      // 'b' has a valid timestamp, but 'a' does not
      return 1; // Place 'b' before 'a'
    } else {
      // Both 'a' and 'b' are missing valid timestamps, leave order unchanged
      return 0;
    }
  });

  function formatWhatsAppTimestamp(timestamp) {
    if (timestamp) {
      const now = new Date();
      const date = new Date(timestamp.seconds * 1000);

      if (
        now.getDate() === date.getDate() &&
        now.getMonth() === date.getMonth() &&
        now.getFullYear() === date.getFullYear()
      ) {
        // Display time
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      } else {
        // Display the date if it's not today
        const year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
        const day = date.getDate().toString().padStart(2, "0");
        const hours24 = date.getHours();
        const hours12 = hours24 % 12 || 12; // Convert to 12-hour system
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        const ampm = hours24 >= 12 ? "PM" : "AM";
        return `${day}/${month}/${year} ${hours12}:${minutes}:${seconds} ${ampm}`;
      }
    } else {
      // Display the current time if timestamp is not available
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
  }  

  

  return (
    // <div className="w-2/3 border border-[#0000000a] flex flex-col">
    chat_id && chatUser ? (
      // <div className="py-2 px-3 bg-grey-lighter flex flex-row justify-between items-center">
      <div className="w-2/3 border border-[#0000000a] flex flex-col">
        <div className="bg-[#449388] px-1 flex">
          <div className="pt-4">
            <img
              className="h-12 w-12 rounded-full"
              src={chatUser.photoURL}
              alt={chatUser.displayName}
            />
          </div>
          <div className="ml-4 flex-1 py-2">
            <div className="flex items-bottom justify-between">
              <p className="text-white pt-3">{chatUser.displayName}</p>
            </div>
            <p className="mt-1 text-white" style={{ fontSize: "11px" }}>
                {isOnline == true ? 'Online' : 'Offline'}
              {/* Chat is {isChatVisible ? "visible" : "not visible"}. */}
            </p>
          </div>
        </div>
        <div
          className="flex-1 overflow-auto bg-[#DAD3CC]"
          ref={messageContainerRef}
        >
          <div className="py-2 px-3 ">
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`mb-2 flex ${
                  message.sender !== currentUser.displayName
                    ? "flex-row-reverse"
                    : ""
                }`}
              >
                <div
                  className={`rounded w-fit py-2 px-3 ${
                    message.sender === currentUser.displayName
                      ? "bg-[#E2F7CB]"
                      : "bg-[#F2F2F2]"
                  }`}
                >
                  <p className="text-sm mt-1">{message.text}</p>
                  <p
                    className="text-right text-grey-dark mt-1"
                    style={{ fontSize: "10px" }}
                  >
                    {formatWhatsAppTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={(e) => sendMessage(e)}>
          <div className="bg-grey-lighter px-4 py-4 flex items-center">
            <div className="flex-1 justify-end mx-4">
              <InputEmoji
                // className="w-full rounded px-2 py-2 border-none hover:border-none focus:border-none"
                ref={inputRef}
                type="text"
                value={message}
                onChange={setMessage}
                onEnter={() => sendMessage()}
              />
            </div>
            {/* <div>
                    <Button
                    type="submit"
                    radius="none"
                    color="primary"
                    variant="faded"
                    size="lg"
                    style={{ outline: "none", border: "none" }}
                    >
                    Send
                    </Button>
                </div> */}
          </div>
        </form>
      </div>
    ) : (
      // {/* </div> */}
      <div className="w-2/3 border border-[#0000000a] flex flex-col">
        <div className="py-60 px-3 bg-grey-lighter flex flex-row justify-between items-center">
          <div className="p-6 w-full max-w-sm mx-auto justify-center rounded-xl lg:w-auto flex items-center space-x-4">
            <div className="shrink-0 ">
              <img
                className="h-32 w-32"
                src="/whatsapp.png"
                alt="whatsapp"
                style={{ filter: "hue-rotate(55deg)" }}
              />
            </div>
            {/* <div>
                    <div className="text-xl sm:text-xl md:text-2xl lg:text-3xl font-medium text-slate-500">
                    Select Any Chat
                    </div>
                </div> */}
          </div>
        </div>
      </div>
    )
    // </div>
  );
}

export default page;
