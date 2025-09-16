import {io} from 'socket.io-client';
import useUserStore from '../store/useUserStore';

let socket = null;


export const initializeSocket = ()=>{
    if(socket) return socket;



    // const user = useUserStore.getState().user;

    const BACKEND_URL = process.env.REACT_APP_API_URL;

    socket = io (BACKEND_URL,{
        withCredentials:true,
        transports:["websocket","polling"],
        reconnectionAttempts:5,
        reconnectionDelay:1000,
    });

    // connections event

    socket.on("connect", () => {
    console.log("socket connected", socket.id);

    const user = useUserStore.getState().user;
    if (user && user._id) {
      socket.emit("user_connected", user._id);
    } else {
      console.warn("⚠️ No user available at connect, skipping emit");
    }
  });

    socket.on("connect_error",(error)=>{
        console.error("socket connection error",error)
        
    })

    // disconnect event
    socket.on("disconnect", (reason)=>{
        console.log("socket disconnected",reason)
        
    })

//      useUserStore.subscribe((state) => {
//     if (socket && socket.connected && state.user?._id) {
//       console.log("User changed, re-emitting user_connected", state.user._id);
//       socket.emit("user_connected", state.user._id);
//     }
//   });

    return socket;
    

};

export const getSocket = () =>{
    if(!socket){
        return initializeSocket();
    }
    return socket;
}


export const disconnectSocket = ()=>{
    if(socket){
        socket.disconnect();
        socket = null;
    }

};
