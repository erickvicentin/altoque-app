import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import HomeCliente from "./src/screens/HomeCliente";
import HomeProfesional from "./src/screens/HomeProfesional";
import RegisterScreen from './src/screens/RegisterScreen';
import ProfessionalAddressScreen from "./src/screens/ProfessionalAddressScreen";
import ClientAddressScreen from "./src/screens/ClientAddressScreen";
import EditPhoneScreen from "./src/screens/EditPhoneScreen";
import SearchResultsScreen from "./src/screens/SearchResultsScreen";
import ProfessionalProfileScreen from "./src/screens/ProfessionalProfileScreen";
import ClientAppointmentsScreen from "./src/screens/ClientAppointmentsScreen";
import DisponibilidadScreen from "./src/screens/DisponibilidadScreen";
import ConfirmarReservaScreen from "./src/screens/ConfirmarReservaScreen";
import SolicitudesScreen from "./src/screens/SolicitudesScreen";
import TurnoDetailScreen from "./src/screens/TurnoDetailScreen";
import CalendarioProfesional from "./src/screens/CalendarioProfesional";
import BloquearSlot from "./src/screens/BloquearSlot";
import ProfessionalAppointmentsScreen from "./src/screens/ProfessionalAppointmentsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeCliente" component={HomeCliente} />
        <Stack.Screen name="HomeProfesional" component={HomeProfesional} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ProfessionalAddress" component={ProfessionalAddressScreen} />
        <Stack.Screen name="ClientAddress" component={ClientAddressScreen} />
        <Stack.Screen name="EditPhone" component={EditPhoneScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
        <Stack.Screen name="ClientAppointments" component={ClientAppointmentsScreen} />
        <Stack.Screen name="Disponibilidad" component={DisponibilidadScreen} />
        <Stack.Screen name="ConfirmarReserva" component={ConfirmarReservaScreen} />
        <Stack.Screen name="Solicitudes" component={SolicitudesScreen} />
        <Stack.Screen name="TurnoDetail" component={TurnoDetailScreen} />
        <Stack.Screen name="CalendarioProfesional" component={CalendarioProfesional} />
        <Stack.Screen name="BloquearSlot" component={BloquearSlot} />
        <Stack.Screen name="ProfessionalAppointments" component={ProfessionalAppointmentsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
