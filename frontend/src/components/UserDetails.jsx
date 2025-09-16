import React, { useEffect, useState } from 'react'
import useUserStore from '../store/useUserStore';
import { updateUserProfile } from '../services/user.service';
import { toast } from "react-toastify";
import useThemeStore from '../store/themeStore';
import Layout from "./Layout";
import { motion } from 'framer-motion';
import { FaCamera } from 'react-icons/fa';


const UserDetails = () => {
  const [name,setName] =useState("");
  const [about,setAbout] = useState("");
  const [profilePicture,setProfilePicture]= useState(null);
  const [preview,setPreview]= useState(null);
  const [loading,setLoading]=useState(false);

  const [isEditingName,setIsEditingName]= useState(false);
  const [isEditingAbout,setIsEditingAbout]= useState(false);
  const [showNameEmoji,setShowNameEmoji]= useState(false);
  const [showAboutEmoji,setShowAboutEmoji]= useState(false);
  const {user,setUser}= useUserStore();
  const {theme} = useThemeStore();

  useEffect(()=>{
    if(user) {
      setName(user.username || "");
      setAbout(user.about || "");
    }
  },[user]);


  const handleImageChange =(e)=>{
    const file = e.target.files[0];
    if(file){
      setProfilePicture(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (field) => {
  try {
    setLoading(true)
    const formData = new FormData(); 
    if (field === 'name') {
      formData.append("username", name);
      setIsEditingName(false);
      setShowNameEmoji(false);
    } else if (field === 'about') {
      formData.append("about", about);
      setIsEditingAbout(false);
      setShowAboutEmoji(false);
    }

    if (profilePicture && field === "profile") {
      formData.append("media", profilePicture);
    }

    const updated = await updateUserProfile(formData);
    setUser(updated?.data?.data);
    setProfilePicture(null);
    setPreview(null);
    toast.success("profile updated");
    setLoading(false);
  } catch (error) {
    console.error(error);
    toast.error("failed to update profile");
  }
};

  const handleEmojiSelect =(emoji,field) =>{
    if(field === 'name'){
      setName((prev) =>prev + emoji.emoji )
      setShowNameEmoji(false)
    }else{
      setAbout((prev) => prev + emoji.emoji)
      setShowAboutEmoji(false)
    }
  }


  return (
    <Layout>
      <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:0.5}}
        className={`w-full min-h-screen flex border-r ${theme ==='dark'?"bg-[rgb(17,27,33)] border-gray-600 text-white":"bg-gray-100 border-gray-200 text-black  "} `}
      
      
      >

      <div className='w-full rounded-lg p-6'>
        <div className='flex items-center mb-6'>
          <h1 className='text-2xl font-bold'>
          Profile
          </h1>
        </div>

        <div className='space-y-6'>
        <div className="flex flex-col items-center" >

        <div className='relative group'>
         <img src={preview || user?.profilePicture}
        
         alt="profile picture" 
         className='w-52 h-52 rounded-full mb-2 object-cover'
         />

        <label htmlFor="profileUpload"
         className='absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
        >

          <div className=" text-white text-center ">
            <FaCamera className='h-8 w-8 mx-auto mb-2 ' />
            <span className='text-sm' >Change</span>
          </div>

          <input type="file" id="profileUpload"  accept="image/*" onChange={handleImageChange}
            className="hidden"
          />

        </label>

          </div>
       </div>

        {preview && (
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={()=>{handleSave("profile")
            }} 

            className="bg-blue-500 hover:bg-blue-800 text-white  px-4 py-2 rounded" >
             {loading ?"Saving...":"change"}
                          
            </button>

            <button 
            onClick={()=>{
              setProfilePicture(null)
              setPreview(null)
            
            }} 
            className="bg-red-400 hover:bg-red-500  text-white px-4 py-2 rounded" >
              Discard
              
            </button>

          </div>


        )}

        <div></div>


        </div>

      </div>


      </motion.div>

    </Layout>

  )
};

export default UserDetails;
