import {create } from 'zustand';
import {persist} from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) =>({
            theme:'light',
           
            setTheme: (theme) =>set({theme}),
          

        }),
        {
            name: "login-storage",
            partialize :(state) =>({
                step:state.step,
                userPhoneData : state.userPhoneData,

            })
        }

    )

);

export default useThemeStore ;
