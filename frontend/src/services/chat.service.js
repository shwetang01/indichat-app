import {io} from 'socket.io-client';
import useUserStore from '../store/useUserStore';

let socket = null;

export const initializeSocket = ()=>{
    const user = useUserStore.getState().user;
    if(!user?._id) return null;

    const token = localStorage.getItem("auth_token");
    const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    if(socket){
        if(!socket.connected){
            socket.auth = { token };
            socket.connect();
        }
        return socket;
    }

    socket = io (BACKEND_URL,{
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // connections event
    socket.on("connect", () => {
        console.log("socket connected", socket.id); 
        const currentUser = useUserStore.getState().user;
        if(currentUser?._id){
            socket.emit("user_connected", currentUser._id);
        }
    });

    socket.on("connect_error",(error)=>{
        console.error("socket connection error", error);
    });

    // disconnect event
    socket.on("disconnect", (reason)=>{
        console.log("socket disconnected", reason);
    });

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
