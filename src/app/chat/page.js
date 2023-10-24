'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SideBar from '../sidebar/page'
import Message from '../message/page'
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth'
import { useAuth } from '../auth'

function page() {

    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [sideLoad, setSideLoad] = useState(false);
    const [friends, setFriends] = useState([]);
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedFriends, setSearchedFriends] = useState([]);
    const router = useRouter()
   
    const logOut=()=>{
        signOut(auth)
        router.push('/')

        const onlineStatusRef = doc(db, "onlineStatus", currentUser.uid);
        setDoc(onlineStatusRef, { online: false });
       
    }

    useEffect(()=>{
        setSideLoad(true)
        setLoading(true)
       if(!currentUser){
        router.push('/')
       }
       async function fetchFriends(){
        const usersRef=collection(db,"users");
        const q =query(usersRef,where("email","!=",currentUser?.email));
        const querySnapshot=await getDocs(q);
        const chatsRef = collection(db, "chats");
        const q2 = query(chatsRef, where("users", "array-contains", currentUser.uid));
      
        const unsubscribe = onSnapshot(q2, (querySnapshot) => {
          setChats(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        });
      
        setFriends(querySnapshot.docs.map(doc=>({...doc.data(),id:doc.id})))
        return unsubscribe;

    }
    fetchFriends()
       setSideLoad(false)
       setLoading(false)
    },[])
    useEffect(() => {
        // Implement search functionality
        if (friends && searchQuery) {
          const filteredFriends = friends.filter((friend) =>
            friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchedFriends(filteredFriends);
        } else {
          setSearchedFriends([]);
        }
      }, [friends, searchQuery]);
      const clearSearch = () => {
        setSearchQuery('');
      };
  return (
    <div>
        {
            loading?<h1>loading</h1>
            :<div className='bg-[#DAD3CC]'>
            <div className="w-full h-32 bg-[#449388]" ></div>
    
            <div className="container mx-auto -mt-32" >
                <div className="py-6 h-screen">
                    <div className="flex rounded h-full" style={{boxShadow:'1px 1px 12px 2px #000000a1'}}>
    
                    <div className="w-1/3 border border-[#0000000a] flex flex-col">
    
    <div className="py-2 px-3 bg-grey-lighter flex flex-row justify-between items-center">
        <div>
            <img className="w-10 h-10 rounded-full" src={currentUser.photoURL}/>
        </div>

        <div className="flex">
            {/* <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#727A7E" d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.944-1.229 7.26 7.26 0 0 0-4.8-8.804.977.977 0 0 1 .594-1.86 9.212 9.212 0 0 1 6.092 11.169.976.976 0 0 1-.942.724zm-16.025-.39a.977.977 0 0 1-.953-.769 9.21 9.21 0 0 1 6.626-10.86.975.975 0 1 1 .52 1.882l-.015.004a7.259 7.259 0 0 0-5.223 8.558.978.978 0 0 1-.955 1.185z"></path></svg>
            </div>
            <div className="ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path opacity=".55" fill="#263238" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path></svg>
            </div> */}
            <div className="ml-4" >
                <button onClick={()=>logOut()} className='text-gray-900 font-semibold text-md m-2' >
                    
                    <img width="20" height="20" src="https://img.icons8.com/android/24/logout-rounded-up.png" alt="logout-rounded-up" style={{filter:'invert(1)'}}/>
                {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#263238" fillOpacity=".6" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg> */}
                </button>
            </div>
        </div>
    </div>

        <div className="py-2 px-2 bg-grey-lightest">
        <div className="relative">
            <input
            type="text"
            className="w-full px-2 py-2 bottom-none text-sm "
            focus-visible='none'
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
            <button
                className="absolute top-2 right-2"
                onClick={clearSearch}
            >
             <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
            </svg>            </button>
            )}
        </div>
        </div>
              <SideBar  chats={chats} friends={searchQuery ? searchedFriends : friends} sideLoad={sideLoad}/>
        </div>
              <Message  friends={friends}/>
                       
    
                    </div>
                </div>
            </div>
             </div>
        }
        
    </div>
  )
}

export default page