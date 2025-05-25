import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import IntroScreen from "./Intro";
import SplashScreen from "./SplashScreen";
import LoginScreen from "./Patient/LoginScreen";
import SignupScreenStep1 from "./Patient/SignUpScreenStep1";
import SignupScreenStep2 from "./Patient/SignUpScreenStep2";
import ForgotPasswordScreen1 from "./Patient/ForgotPasswordScreen1";
import ForgotPasswordScreen2 from "./Patient/ForgotPasswordScreen2";
import HomeScreen from "./Patient/HomeScreen";
import AvailableDoctors from "./Patient/AvailableDoctors";
import BookingScreen from "./Patient/BookingScreen";
import ChatHomeScreen from "./Patient/ChatHome";
import PatientTable from "./Patient/table";
import PatientSettings from "./Patient/PatientSettings";
import PatientChangePassword from "./Patient/ChangePassword";
import DoctorLoginScreen from "./Doctor/LoginScreen";
import DoctorSignUpScreenStep1 from "./Doctor/SignUpScreenStep1";
import DoctorSignUpScreenStep2 from "./Doctor/SignUpScreenStep2";
import DoctorSignUpScreenStep3 from "./Doctor/SignUpScreenStep3";
import DocHomeScreen from "./Doctor/DocHomeScreen";
import DocChatHome from "./Doctor/DocChatHome";
import DoctorTable from "./Doctor/DoctorTable";
import DocSettings from "./Doctor/DocSettings";
import DoctorChangePassword from "./Doctor/DoctorChangePassword";
import AIChatbot from "./Patient/AIChatbot";
import MedicalHistory from "./Patient/MedicalHistory";
import Message from "./Message";

export type Doctor = {
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  picture?: string;
};

export type RootStackParamList = {
  Message: {
    currentUser: { id: string; name: string };
    selectedDoctor: { id: string; name: string; specialty: string };
  };
  IntroScreen: undefined;
  Splash: {role: string};
  Login: undefined;
  SignupStep1: undefined;
  SignupStep2: {
    firstName: string;
    lastName: string;
    dob: { month: string; day: string; year: string };
    gender: string;
    address: string;
  };
  ForgotPassword1: undefined;
  ForgotPassword2: { email: string };
  Home: {userId: string;};
  AvailableDoctors: { userId: string };
  BookingScreen: { doctor: Doctor; userId: string };
  ChatHome: { userId: string ,patientName: string };
  PatientTable: { userId: string };
  PatientSettings: { userId: string };
  PatientChangePassword: { userId: string };
  DoctorLogin: undefined;
  DoctorSignUpStep1: undefined;
  DoctorSignUpStep2: {
    firstName: string;
    lastName: string;
    dob: { month: string; day: string; year: string };
    gender: string;
    mobileNumber: string;
    cnic: string;
    email: string;
    password: string;
  };
  DoctorSignUpStep3: {
    firstName: string;
    lastName: string;
    dob: { month: string; day: string; year: string };
    gender: string;
    mobileNumber: string;
    cnic: string;
    email: string;
    password: string;
    education: {
      degreeName: string;
      institution: string;
      graduationYear: string;
    };
    specialization: string;
    hospitalName: string;
  };
  DocHomeScreen: undefined;
  DoctorTable: { userId: string };
  DocSettings: { userId: string };
  DoctorChangePassword: { userId: string };
  DocChatHome: {useId:string , doctorName:string};
  PatientRecord: { patientId: string };
  AIChatbot: undefined;
  MedicalHistory: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="IntroScreen">
      <Stack.Screen name="IntroScreen" component={IntroScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignupStep1" component={SignupScreenStep1} options={{ headerShown: false }} />
      <Stack.Screen name="SignupStep2" component={SignupScreenStep2} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword1" component={ForgotPasswordScreen1} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword2" component={ForgotPasswordScreen2} options={{headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{headerShown: false }} />
      <Stack.Screen name="AvailableDoctors" component={AvailableDoctors} options={{ headerShown: false }} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatHome" component={ChatHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PatientTable" component={PatientTable} options={{ headerShown: false }} />
      <Stack.Screen name="PatientSettings" component={PatientSettings} options={{ headerShown: false }} />
      <Stack.Screen name="PatientChangePassword" component={PatientChangePassword} options={{ presentation: "modal" }}/>
      <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorSignUpStep1" component={DoctorSignUpScreenStep1} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorSignUpStep2" component={DoctorSignUpScreenStep2} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorSignUpStep3" component={DoctorSignUpScreenStep3} options={{ headerShown: false }} />
      <Stack.Screen name="DocHomeScreen" component={DocHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DocChatHome" component={DocChatHome} options={{ headerShown: false}} />
      <Stack.Screen name="DoctorTable" component={DoctorTable} options={{ headerShown: false }} />
      <Stack.Screen name="DocSettings" component={DocSettings} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorChangePassword" component={DoctorChangePassword} options={{ title: "Change Password" }} />
      <Stack.Screen name="AIChatbot" component={AIChatbot} options={{ headerShown: false }} />
      <Stack.Screen name="MedicalHistory" component={MedicalHistory} options={{ headerShown: false }} />
      <Stack.Screen name="Message" component={Message} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}