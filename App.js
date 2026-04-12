// App.js
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
