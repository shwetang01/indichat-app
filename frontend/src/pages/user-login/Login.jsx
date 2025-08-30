import React, { useState } from 'react';
import useLoginStore from '../../store/useLoginStore';
import countries from '../../utils/countriles';
import * as yup from 'yup';
import {yupResolver} from "@hookform/resolvers/yup"
import { useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore';
import {useNavigate} from "react-router-dom";
import useUserStore from '../../store/useUserStore';


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
  const {step,setStep, userPhoneData,setUserPhoneData ,resetLoginState} = useLoginStore
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


  const {
    register:loginRegister,
    handleSubmit: handleLoginSubmit,
    formState:{errors:loginErrors }
  } = useForm({
    resolver:yupResolver(loginValidationSchema)
  })

  const {
    handleSubmit: handleOtpSubmit,
    formState:{errors:otpErrors },
    setValue:setOtpValue
  } = useForm({
    resolver:yupResolver(loginValidationSchema)
  })

   const {
    register:profileRegister,
    handleSubmit: handleProfileSubmit,
    formState:{errors:profileErrors },
   watch
  } = useForm({
    resolver:yupResolver(profileValidationSchema)
  })
  
  
  return (
    <div className={`min-h-screen ${ theme ==='dark' ?"bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500 " } flex items-center justify-center p-4 overflow-hidden `}>
   
   </div>
  )
};

export default Login;

