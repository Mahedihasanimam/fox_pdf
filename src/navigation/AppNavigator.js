import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import ImageToPdfScreen from '../screens/ImageToPdfScreen';
import MergePdfScreen from '../screens/MergePdfScreen';
import SplitPdfScreen from '../screens/SplitPdfScreen';
import CompressPdfScreen from '../screens/CompressPdfScreen';
import FilesScreen from '../screens/FilesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CameraScanScreen from '../screens/CameraScanScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import ESignatureScreen from '../screens/ESignatureScreen';
import WatermarkScreen from '../screens/WatermarkScreen';
import PageManagerScreen from '../screens/PageManagerScreen';
import HandwritingScreen from '../screens/HandwritingScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const FilesStack = createStackNavigator();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animationEnabled: true, gestureEnabled: true }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ImageToPdf" component={ImageToPdfScreen} />
      <HomeStack.Screen name="MergePdf" component={MergePdfScreen} />
      <HomeStack.Screen name="SplitPdf" component={SplitPdfScreen} />
      <HomeStack.Screen name="CompressPdf" component={CompressPdfScreen} />
      <HomeStack.Screen name="CameraScan" component={CameraScanScreen} />
      <HomeStack.Screen name="ESignature" component={ESignatureScreen} />
      <HomeStack.Screen name="Watermark" component={WatermarkScreen} />
      <HomeStack.Screen name="PageManager" component={PageManagerScreen} />
      <HomeStack.Screen name="Handwriting" component={HandwritingScreen} />
      <HomeStack.Screen name="PdfViewer" component={PdfViewerScreen} />
    </HomeStack.Navigator>
  );
}

function FilesStackNav() {
  return (
    <FilesStack.Navigator screenOptions={{ headerShown: false, animationEnabled: true, gestureEnabled: true }}>
      <FilesStack.Screen name="Files" component={FilesScreen} />
      <FilesStack.Screen name="PdfViewer" component={PdfViewerScreen} />
    </FilesStack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'ToolsTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'FilesTab') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ToolsTab" component={HomeStackNav} options={{ title: 'Tools' }} />
      <Tab.Screen name="FilesTab" component={FilesStackNav} options={{ title: 'Files' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
