import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countriles";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import useThemeStore from "../../store/themeStore";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { motion, spring } from "framer-motion";
// Using react-icons
import { FaChevronDown } from "react-icons/fa";
import Spinner from "../../utils/Spinner"

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
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setsTheme } = useThemeStore();
  const [showDropdown, setShowDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading,setLoading] = useState(false);

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
          <form className="spacce -y-4">
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

                      {filterCountries.map((country) => (
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
                      ))}

                      {/* {filterCountries.map((country) => (
            <div
              key={country.alpha2}
              onClick={()=>{
                      setSelectCountry(country)
                      setShowDropDown(false)
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
          ))} */}
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
               <input
                  type="email"
                  {...loginRegister("email")}
                  value={phoneNumber}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email(optional)"
                  className={`w-w-full bg-transparent  ${
                    theme === "dark"
                      ? " text-white"
                      : "text-black"
                  } ${
                    loginErrors.email
                      ? "border-red-500"
                      : ""
                  }`}


                />
                 {loginErrors.email && (
                <p className="text-red-500 text-sm">
                  {loginErrors.email.message}
                </p>
              )}         

            </div>

            <button 
             type="submit" 
             className="bg-green-500 w-full py-2 hover:bg-green-600 transition text-white "
             
             >
              {loading ?<Spinner/> :"Send OTP"}
            </button >
            
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
