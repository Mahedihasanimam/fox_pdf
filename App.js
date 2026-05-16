import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProProvider } from './src/context/ProContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <ProProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ProProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
