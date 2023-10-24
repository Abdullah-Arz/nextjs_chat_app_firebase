"use client"
import React from "react";
import {Button} from "@nextui-org/react";
import {UserIcon} from './UserIcon';
import {auth,provider} from '../firebase'
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter(); // Initialize the router

    const loginWithGoogle=async ()=>{
      try {
        // Sign in with Google
        await signInWithPopup(auth, provider);
        
        // After a successful login, navigate to the chat page
        router.push("/chat"); // Specify the chat page route

      } catch (error) {
        console.error("Google login error", error);
      }
    }
  return (
    <div className="flex pt-60 justify-center">

<button 
          className="px-4 py-2 border flex gap-2 border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150" 
          onClick={loginWithGoogle}
          >
            <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
            <span>Login with Google</span>
          </button>

      {/* <Button color="danger" variant="bordered" onClick={loginWithGoogle} startContent={<UserIcon/>}>
        Login With Google
      </Button> */}
    </div>
  );
}
