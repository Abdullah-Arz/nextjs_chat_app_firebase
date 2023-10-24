import { getAuth} from "@firebase/auth"
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
const getFriendData = async (users) => {
const {currentUser} = getAuth();
const friendId = users?.filter(user => user !== currentUser?.uid)
console.log('friendid', friendId);
const docRef = doc(db, "users", friendId [0])
const docSnap = await getDoc (docRef)
return docSnap.data()
}
export default getFriendData;