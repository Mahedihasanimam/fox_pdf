/**
 * AdBanner — placeholder ready for real AdMob integration.
 *
 * To activate real ads:
 * 1. npm install react-native-google-mobile-ads
 * 2. Use EAS Build (Expo Go does NOT support native ad SDKs)
 * 3. Add to app.json plugins: ["react-native-google-mobile-ads", { "androidAppId": "ca-app-pub-xxx~xxx", "iosAppId": "ca-app-pub-xxx~xxx" }]
 * 4. Replace BANNER_ID below with your real ad unit ID
 * 5. Uncomment the BannerAd import and swap the placeholder View for it
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../utils/theme';

// Test ad unit IDs (safe to use in dev, show test creatives)
// const BANNER_ID = __DEV__
//   ? 'ca-app-pub-3940256099942544/6300978111'   // Google test banner
//   : 'YOUR_REAL_BANNER_UNIT_ID';

export default function AdBanner() {
  const { colors, isDark } = useTheme();

  // Once react-native-google-mobile-ads is set up, replace this with:
  // import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
  // return <BannerAd unitId={BANNER_ID} size={BannerAdSize.BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />;

  if (__DEV__) {
    return (
      <View style={[styles.placeholder, { backgroundColor: isDark ? '#1A1A2A' : '#F0F2F8', borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textLight }]}>📢 Ad · 320×50 · AdMob setup required</Text>
      </View>
    );
  }

  // In production without real AdMob setup, show nothing
  return null;
}

const styles = StyleSheet.create({
  placeholder: {
    height: 50,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
});
