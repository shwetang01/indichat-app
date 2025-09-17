import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countriles";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { set,useForm } from "react-hook-form";
import useThemeStore from "../../store/themeStore";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { motion, scale } from "framer-motion";
// Using react-icons
import { FaArrowLeft, FaChevronDown, FaPlus } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import Spinner from "../../utils/Spinner";
import { toast } from "react-toastify";
import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user.service";

// validation schema
const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, "Phone number be digit")
      .transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
      ),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("please enter valid email")
      .transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
      ),
  })
  .test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    }
  );

// otp validaton
const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp mest be exactly 6 digit")
    .required("otp is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "you must agree to the terms"),
});

// avatar
const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectCountry, setSelectCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // const [otp, setOtp] = useState(new Array(6).fill(""));

  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setsTheme } = useThemeStore();
  const [showDropdown, setShowDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === "success") {
          toast.info("OTP send to your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(phoneNumber, selectCountry.dialCode);
        if (response.status === "success") {
          toast.info("OTP is send to phone number");
          setUserPhoneData({
            phoneNumber,
            phoneSuffix: selectCountry.dialCode,
          });
          setStep(2);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("phone or email data is missing");
      }
      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        response = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
          otpString
        );
      }
      if (response.status === "success") {
        toast.success("Otp verify successfully");
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to Indichat");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);
      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }
      await updateUserProfile(formData);
      toast.success("welcome back to Indichat");
      navigate("/");
      resetLoginState();
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const ProgressBar = () => (
    <div
      className={`w-full ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      } rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-400 to-blue-500 "
      } flex items-center justify-center p-4 overflow-hidden `}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          // className="w-24 h-24 bg-yellow-500 rounded-full mx-auto mb-6 flex items-center justify-center"
          className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-white shadow-lg"
        >
          <img src="/chat.png" alt="logo" className="src" />
        </motion.div>

        <h1
          className={`text-3xl font-bold text-center mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Login to Connect
        </h1>
        <h5
          className={`text-1xl font-bold text-center mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Desi roots,Global reach
        </h5>

        <ProgressBar />
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {step === 1 && (
          <form
            className="spacce -y-4"
            onSubmit={handleLoginSubmit(onLoginSubmit)}
          >
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-4`}
            >
              Enter your phone number to receive an Otp
            </p>
            <div className="relative">
              <div className="flex">
                <div className="relative w-1/3">
                  <button
                    type="button"
                    className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${
                      theme === "dark"
                        ? "text-white bg-gray-700 border-gray-600 "
                        : "text-gray-900 bg-gray-100 border-gray-300"
                    } border rounded-s-lg hover:bg-gray-200 focus:right-4 focus:outline-none focus:ring-gray-100 `}
                    onClick={() => setShowDropDown(!showDropdown)}
                  >
                    <span className="mr-2">
                      {selectCountry.flag} {selectCountry.dialCode}
                    </span>
                    <FaChevronDown className="ml-2" />
                  </button>
                  {showDropdown && (
                    <div
                      className={`absolute z-10 w-full mt-1 
                  ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }
                 border rounded-md shadow-lg max-h-60 overflow-auto `}
                    >
                      <div
                        className={`sticky top-0 ${
                          theme === "dark" ? "bg-gray-700 " : "bg-white "
                        } p-2`}
                      >
                        <input
                          type="text"
                          placeholder="Search countries.."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white "
                              : "bg-white border-gray-300"
                          }rounded-md text-sm focus:outline-none focus:ring-green-500`}
                        />
                      </div>

                      {/* {filterCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          className={`w-full text-left px-3 py-2 ${
                            theme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-100"
                          } focus:outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectCountry(country);
                            setShowDropDown(false);
                          }}
                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))} */}

                      {filterCountries.map((country) => (
                        <div
                          key={country.alpha2}
                          onClick={() => {
                            setSelectCountry(country);
                            setShowDropDown(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            cursor: "pointer",
                          }}
                        >
                          <img
                            src={`https://flagcdn.com/24x18/${country.alpha2.toLowerCase()}.png`}
                            alt={country.name}
                            width="24"
                            height="18"
                          />
                          {country.dialCode} {country.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="phone number"
                  className={`w-2/3 px-4 py-2 border ${
                    theme === "dark"
                      ? "bg-gray-700 text-white"
                      : "bg-white border-gray-300"
                  }rounded-md focus:ring-green-500 focus:right-2 focus:outline-none ${
                    loginErrors.phoneNumber
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>
            {/* divider */}
            <div className="flex items-center my-4">
              <div className="flex grow h-px bg-gray-300" />
              <span className="mx-3 font-medium">Or</span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>

            <div
              className={`flex items-center border rounded-md px-3 py-2  ${
                theme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white border-gray-300"
              }`}
            >
              <FaUser className="mr-2" />
              <input
                type="email"
                {...loginRegister("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email(optional)"
                className={`w-full bg-transparent  ${
                  theme === "dark" ? " text-white" : "text-black"
                } ${loginErrors.email ? "border-red-500" : ""}`}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-sm">
                  {loginErrors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="bg-green-500 w-full py-2 hover:bg-green-600 mt-2
             border rounded-md transition text-white "
            >
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-4`}
            >
              Please enter 6-digit OTP send to your{" "}
              {userPhoneData ? userPhoneData.phoneSuffix : "Email"}{" "}
              {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
            </p>
            <div className="flex justify-between">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className={`w-12 h-12 text-center border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-500"
                    } rounded-md focus:ring-2 focus:outline-none focus:ring-green-500 ${
                      otpErrors.otp ? "border-red-500" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {otpErrors.otp && (
              <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>
            )}

            <button
              type="submit"
              className="bg-green-500 w-full py-2 hover:bg-green-600 mt-2
             border rounded-md transition text-white "
            >
              {loading ? <Spinner /> : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className={`w-full mt-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300 "
                  : "bg-gray-200 text-gray-700"
              } phy-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
            >
              <FaArrowLeft className="mr-2" />
              wrong number? Go Back
            </button>
          </form>
        )}

        {step === 3 &&(
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 mb-2">
              <img src={profilePicture || selectedAvatar} 
              alt="profile" 
              className="w-full h-full rounded-full object-cover"
              />
              <label 
              htmlFor="profile-picture"
              className="absolute bottom-0 right-0 bg-green-500 text-p2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300 "
              >
              <FaPlus className="w-4 h-4" />

              </label>
              <input
              type="file"
              id="profile-picture"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"           
              />
            </div>
            <p className={`text-sm ${theme === 'dark'?"text-gray-300":"text-gray-500"}mb-2`} >
              Choose an avatar
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {avatars.map((avatar,index)=>(
                <img 
                key={index}
                src={avatar}
                alt= {`Avatar ${index +1}`}
                className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transition-transform hover:scale-110 ${selectedAvatar === avatar ?"ring-2 ring-green-500 ":""

                } `}
                onClick={()=>setSelectedAvatar(avatar)}
                />

              ))}


            </div>

            </div>
            
            <div className="relative">
              <FaUser 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark'?"text-gray-400":"text-gray-400"}` }/>
              <input 
              {...profileRegister("username")}
              type ="text"
              placeholder="Username"
              className={`w-full pl-10 pr-3 py-2 border ${theme === 'dark' ?"bg-gray-700 border-gray-600 text-white":"text-gray-600"}`}
              />

              {profileErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {profileErrors.username.message}
                </p>
              )}

            </div>

            <div className="flex items-center space-x-2">
              <input 
              {...profileRegister('agreed')}
              type="checkbox"
              className={`rounded ${theme === 'dark'?"text-green-500 bg-gray-700":"text-green-500"}focus:ring-green-500`}

              /> 

              <label 
              htmlFor="terms"
              className={`text-sm ${theme ==='dark' ?"text-gray-300":"text-gray-700"}`}
                >
                  I agree to terms and conditions
                </label>

              {profileErrors.agreed && (
                <p>
                  {profileErrors.agreed.message}
                </p>
              )}

            </div>
            
            <button
              type="submit"
              disabled={!watch("agreed") ||loading}
              className={`bg-green-500 text-white w-full py-2 hover:bg-green-600 mt-2
             border rounded-md transition text-white 
             ${loading ? "opacity-50 cursor-not-allowed":""}
             `}
            >
              {loading ? <Spinner /> : "Create Profile"}
            </button>

          </form>


        )}
      </motion.div>
    </div>
  );
};

export default Login;
