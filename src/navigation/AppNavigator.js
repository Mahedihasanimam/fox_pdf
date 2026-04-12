// src/navigation/AppNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/HomeScreen";
import ImageToPdfScreen from "../screens/ImageToPdfScreen";
import MergePdfScreen from "../screens/MergePdfScreen";
import SplitPdfScreen from "../screens/SplitPdfScreen";
import CompressPdfScreen from "../screens/CompressPdfScreen";
import FilesScreen from "../screens/FilesScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#F7F8FC" },
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ImageToPdf" component={ImageToPdfScreen} />
      <Stack.Screen name="MergePdf" component={MergePdfScreen} />
      <Stack.Screen name="SplitPdf" component={SplitPdfScreen} />
      <Stack.Screen name="CompressPdf" component={CompressPdfScreen} />
      <Stack.Screen name="Files" component={FilesScreen} />
    </Stack.Navigator>
  );
}
