"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { addDoc, collection, query, where, getDocs, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../auth';
import { useRouter } from 'next/navigation';

function Page({ friends, chats, sideLoad }) {
  const { currentUser, setChat_id,setFriend_id, context_messages } = useAuth();
  const router = useRouter();
  const [chatId, setChatId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message_time, setmessage_time] = useState(null);
  const [show_count, setshow_count] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [matchedFriends, setMatchedFriends] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState({}); // Unread message count
  const [loader, setloader] = useState(false);

  useEffect(() => {
    setloader(true)
    const matchedFriends = friends.map((friend) => {
      const matchedChat = chats.find((chat) => {
        return (
          chat.users.includes(currentUser.uid) && chat.users.includes(friend.id)
        );
      });

      const lastMessage = matchedChat ? matchedChat.lastMessage : null;
      const timestamp = lastMessage ? lastMessage.timestamp : null;
      const formattedTime = formatLastSeen(timestamp);

      return {
        ...friend,
        lastMessage,
        message_time: formattedTime,
        show_count: selectedFriend !== friend.id,
      };
    });
    const sortedMatchedFriends = matchedFriends.slice().sort((a, b) => {
      return b.message_time.localeCompare(a.message_time);
    });
  
    setMatchedFriends(sortedMatchedFriends);
    setloader(false);
  
  }, 
  // [chats]
  [friends, chats, currentUser]
  );


  useEffect(() => {
    
    const unsubscribe = onSnapshot(
      collection(db, 'unreadCounts'),
      (snapshot) => {
        const unreadCounts = {};
        snapshot.forEach((doc) => {
          unreadCounts[doc.id] = doc.data().unreadCount;
        });
        setUnreadMessageCount(unreadCounts);
      }
    );
    return () => unsubscribe();
  }, []);

 // Function to reset unread count and update Firestore
 const resetUnreadCount = (friendId) => {

  const userDocRef = doc(db, 'unreadCounts',friendId);
   setDoc(userDocRef, { unreadCount: 0 }, { merge: true });
};
  // Handle chat selection
  const handleChatSelection = async (friendId) => {
    const newChatId = await createChat(friendId);
    setChatId(newChatId);
    setSelectedFriend(friendId);
    setFriend_id(friendId)
    setChat_id(newChatId);
    setActiveChatId(newChatId);
    // setshow_count(false)
    console.log('unreadMessageCount',unreadMessageCount)
    console.log('friendId',friendId)
    sessionStorage.setItem('newChatId', newChatId);
  
    if (unreadMessageCount.hasOwnProperty(friendId)) {
        resetUnreadCount(friendId)
     }
  };

  const createChat = async (friendId) => {
    // Query for chats that include the current user
    const chatsRef = collection(db, 'chats');
    const currentUserChatQuery = query(
      chatsRef,
      where('users', 'array-contains', currentUser.uid)
    );
    const currentUserChatSnapshot = await getDocs(currentUserChatQuery);

    // Check if the current user is already in a chat with the selected friend
    const isUserInChatWithFriend = currentUserChatSnapshot.docs.some((doc) => {
      const chatData = doc.data();
      return chatData.users.includes(friendId);
    });

    if (isUserInChatWithFriend) {
      // User is already in a chat with the selected friend, return the chat ID
      return currentUserChatSnapshot.docs.find((doc) => {
        const chatData = doc.data();
        return chatData.users.includes(friendId);
      }).id;
    } else {
      // Chat doesn't exist, create a new chat
      const chatDocRef = await addDoc(chatsRef, {
        users: [currentUser.uid, friendId],
      });
      return chatDocRef.id;
    }
  };

  function formatLastSeen(timestamp) {
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
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      } else {
        // Display the date if it's not today
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
        const day = date.getDate().toString().padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
    } else {
      // Display the current time if timestamp is not available
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
  }

  const sortedData = Object.entries(matchedFriends)?.sort((a,b)=> b[1].lastMessage?.timestamp - a[1].lastMessage?.timestamp)
  
  return (
    <div className="bg-white flex-1 overflow-auto">
      {
        sideLoad === 'true' || sideLoad === true ?
        <></>:
        <>
        {
          matchedFriends.map((friend) => (
            <div
            key={friend.id}
            onClick={() => handleChatSelection(friend.id)}
            className={`bg-white px-3 flex items-center hover:bg-slate-200 cursor-pointer ${
              selectedFriend === friend.id ? 'bg-slate-200' : ''
            }`}
          >
            <div>
              <img
                className="h-12 w-12 rounded-full"
                src={friend.photoURL}
                alt={friend.displayName}
              />
            </div>
            <div className="ml-4 flex-1 border-b border-grey-lighter py-4">
              <div className="flex items-bottom justify-between">
                <p className="text-grey-darkest">{friend.displayName}</p>
                <p className="text-xs text-grey-darkest">
                  {friend.message_time}
                </p>

              </div>
              <div className='flex justify-between'>
                  <p className="text-grey-dark mt-1 text-sm">
                    {
                      friend.lastMessage?.text?.length >= 40 ? (
                        `${friend.lastMessage ? friend.lastMessage.text.substring(0,40) : ''}...`
                      ) : (
                        friend.lastMessage ? friend.lastMessage.text.substring(0,40) : ''
                      )
                    }
                   
                  </p>
                  {friend.show_count && unreadMessageCount[friend.id] > 0 ? (
                    <p className="text-grey-darkest  font-semibold		 bg-[#00a189] p-1.5 rounded-full text-white w-7 text-center" style={{fontSize:'11px'}}>
                      {unreadMessageCount[friend.id]}
                    </p>
                  ) : (
                    ''
                  )}       </div>
       
            </div>
          </div>
          ))
        }
        </>
      }
    </div>
  );
}

export default Page;
