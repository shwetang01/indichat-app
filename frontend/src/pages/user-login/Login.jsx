import React, { useState } from 'react';
import useLoginStore from '../../store/useLoginStore';
import countries from '../../utils/countriles';
import * as yup from 'yup';
import {yupResolver} from "@hookform/resolvers/yup"
import { useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore';
import {useNavigate} from "react-router-dom";
import useUserStore from '../../store/useUserStore';
import {motion, spring} from 'framer-motion';


// validation schema
const loginValidationSchema = yup
.object()
.shape({
  phoneNumber:yup.string().nullable().notRequired().matches(/^\d+$/, "Phone number be digit").transform((value,originalValue)=>
    originalValue.trim() === ""? null :value
  ),
   email:yup.string().nullable().notRequired().email("please enter valid email").transform((value,originalValue)=>
    originalValue.trim() === ""? null :value
  )

}).test(
    "at-least-one",
    "Either email or phone number is required",
    function (value){
      return !!(value.phoneNumber || value.email);
    }
  );

  // otp validaton
 const otpValidationSchema = yup.object().shape({
  otp:yup.string().length(6,"otp mest be exactly 6 digit").required("otp is required")
 });

 const profileValidationSchema = yup.object().shape({
  username:yup.string().required("username is required"),
  agreed : yup.bool().oneOf([true],"you must agree to the terms")

 });

// avatar
  const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]



const Login = () => {
  const {step,setStep, userPhoneData,setUserPhoneData ,resetLoginState} = useLoginStore();
  const [phoneNumber,setPhoneNumber] = useState("");
  const [selectCountry,setSelectCountry] = useState(countries[0]);
  const [otp,setOtp] = useState([ "", "", "", "", "", ""])
  const [email,setEmail] = useState("");
  const [profilePicture,setProfilePicture] =  useState(null);
  const [selectAvatar,setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile,setProfilePictureFile] = useState(null);
  const [error,setError ]= useState("");
  const navigate = useNavigate();
  const {setUser} = useUserStore();
  const {theme,setsTheme} = useThemeStore();
  const [showDropdown,setShowDropDown] = useState(false);
  const [searchterm,setSearchTerm]= useState("")

  const {
    register:loginRegister,
    handleSubmit: handleLoginSubmit,
    formState:{errors:loginErrors }
  } = useForm({
    resolver:yupResolver(loginValidationSchema)
  });
  const filterCountries = countries.filter(
    (country) => country.name.toLowerCase().includes(searchterm.toLowerCase()) || country.dialCode.includes(searchterm)
  )

  const {
    handleSubmit: handleOtpSubmit,
    formState:{errors:otpErrors },
    setValue:setOtpValue
  } = useForm({
    resolver:yupResolver(otpValidationSchema)
  })

   const {
    register:profileRegister,
    handleSubmit: handleProfileSubmit,
    formState:{errors:profileErrors },
   watch
  } = useForm({
    resolver:yupResolver(profileValidationSchema)
  });

  const ProgressBar = ()=>(
    <div className={`w-full ${theme === 'dark' ? "bg-gray-700" :"bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
      style={{width:`${(step/3)*100}%`}}

      />
    </div>
  )
  
  
  return (
    <div className={`min-h-screen ${ theme ==='dark' ?"bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500 " } flex items-center justify-center p-4 overflow-hidden `}>
   
    <motion.div initial ={{opacity:0,y:-50}}
    animate={{opacity:1,y:0}}
    transition={{duration:0.5}}
    className={`${theme === 'dark' ? "bg-gray-800 text-white": "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}>

        <motion.div initial ={{scale:0}}
        animate={{scale:1,}}
        transition={{duration:0.2,type :'spring', stiffness:260 ,damping:20}}
        // className="w-24 h-24 bg-yellow-500 rounded-full mx-auto mb-6 flex items-center justify-center" 
        className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-white shadow-lg"      >
      
        <img src="/chat.png" alt="logo" className="src" />

      </motion.div>
      
      <h1 className={`text-3xl font-bold text-center mb-6 ${theme ==="dark" ? "text-white":"text-gray-800" }`}>
      Login to Connect
      </h1>
       <h5 className={`text-1xl font-bold text-center mb-6 ${theme ==="dark" ? "text-white":"text-gray-800" }`}>
       Desi roots,Global reach
      </h5>

      <ProgressBar/>
      {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

      {step === 1 && }

    </motion.div> 

    


   </div>
  )
};

export default Login;

