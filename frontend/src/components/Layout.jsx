import React, { useEffect, useState } from 'react'
import useLayoutStore from '../store/layoutStore';
import { useLocation } from 'react-router-dom';
import useThemeStore from '../store/themeStore';
import { motion,AnimatePresence } from 'framer-motion';


const Layout = ({children,isThemeDialogOpen,toggleThemeDialog,isStatusPreviewOpen,statusPreviewContent}) => {

  const selectedContact =useLayoutStore(state =>state.selectedContact);
  const setSelectedContact =useLayoutStore(state =>state.setSelectedContact);
  const location = useLocation();
  const [isMobile,setIsMobile] = useState(window.innerWidth <768)
  const {theme,setTheme} = useThemeStore();

  useEffect(()=>{
    const handleResize = ()=>{
      setIsMobile(window.innerWidth <768)
    }
    window.addEventListener("resize",handleResize);
    return() => window.removeEventListener('resize',handleResize)

  },[])

  return (
    <div className={`min-h-screen ${theme === 'dark' ?"bg-[#111b21] text-white ":"bg-gray-100 text-black"}flex relative`}>
      {!isMobile && <Sidebar/>}
      <div className={`flex-1 flex overflow-hidden ${isMobile ?"flex-col":""}`}>

        <AnimatePresence>
        {(!selectedContact || !isMobile)  (

          <motion.div key="chatList"
          >

          </motion.div>
        )}

        </AnimatePresence>


      </div>

       
    </div>
  )
}

export default Layout
