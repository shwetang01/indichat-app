import {create } from 'zustand';
import {persist} from 'zustand/middleware';

const useUserStore = create(
    persist(
        (set) =>({
           user:null,
          isAuthenticated: false,
            setUser: (userdata) => set({ user:userdata,isAuthenticated:true }),
            clearUser : () =>set({user:null,isAuthenticated:false }),    // to remove user from local storage

        }),
        {
            name: "login-storage",
            getStorage: ()=> localStorage
           
        }

    )

);

export default useUserStore ;
