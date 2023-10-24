const OnlineStatus = ({ userId }) => {
    const [isOnline, setIsOnline] = useState(null);
  
    useEffect(() => {
      // Reference to the user's presence in the database
      const userStatusRef = firebase.database().ref(`/status/${userId}`);
  
      // Reference to the Firestore object that represents the user's connection status
      const connectedRef = firebase.database().ref(".info/connected");
  
      // Listen for changes in the user's online/offline status
      userStatusRef.on("value", (snapshot) => {
        if (snapshot.exists()) {
          setIsOnline(snapshot.val().state === "online");
        } else {
          setIsOnline(false);
        }
      });
  
      // Listen for changes in the user's connection status (online/offline)
      connectedRef.on("value", (snapshot) => {
        if (snapshot.val() === true) {
          // User is online
          userStatusRef
            .onDisconnect()
            .set({ state: "offline", last_changed: firebase.database.ServerValue.TIMESTAMP })
            .then(() => {
              userStatusRef.set({ state: "online", last_changed: firebase.database.ServerValue.TIMESTAMP });
            });
        } else {
          // User is offline
          userStatusRef.set({ state: "offline", last_changed: firebase.database.ServerValue.TIMESTAMP });
        }
      });
  
      return () => {
        // Clean up the listeners when the component unmounts
        userStatusRef.off();
        connectedRef.off();
      };
    }, [userId]);
  
    return <div>User is {isOnline ? "online" : "offline"}</div>;
  };
  
  export default OnlineStatus;
  