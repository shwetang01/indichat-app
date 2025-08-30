import React, { useState } from 'react';
import useLoginStore from '../../store/useLoginStore';
import countries from '../../utils/countriles';
import * as yup from 'yup';
import {yupResolver} from "@hookform/resolvers/yup"

// validation schema
const loginValidationSchema = yup
.object()
.shape({
  phoneNumber:yup.string().nullable().notRequired().matches(/^\d+$/, "Phone number be digit").transform((value,originalValue)=>{
    originalValue.trim() === ""? null :value
  }),
   email:yup.string().nullable().notRequired().email("please enter valid email").transform((value,originalValue)=>{
    originalValue.trim() === ""? null :value
  })

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







const Login = () => {
  const {step,setStep, userPhoneData,setUserPhoneData ,resetLoginState} = useLoginStore
  const [phoneNumber,setPhoneNumber] = useState("");
  const [selectCountry,setSelectCountry] = useState(countries[0]);
  const [otp,setOtp] = useState([ "", "", "", "", "", ""])
  const [email,setEmail] = useState("");
  


  return (
    <div>
      Login page
      
    </div>
  )
}

export default Login
