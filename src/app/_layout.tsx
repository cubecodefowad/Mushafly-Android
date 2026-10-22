import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AudioBar } from "../components/audio/AudioBar";
import { BootScreen } from "../components/ui/BootScreen";
import { ErrorScreen } from "../components/ui/ErrorScreen";
import { AppDatabaseProvider, useAppDatabase } from "../data/AppDatabaseProvider";
import { AudioProvider } from "../features/audio/AudioProvider";
import { LibraryProvider, useLibrary } from "../features/bookmarks/LibraryProvider";
import { SettingsProvider, useSettings } from "../features/settings/SettingsProvider";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { DARK_COLORS, LIGHT_COLORS } from "../theme/palette";

SplashScreen.preventAutoHideAsync().catch(() => {});

function FontFailure({ message }: { message: string }) {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <View style={[styles.fontFailure, { backgroundColor: colors.paper }]}>
      <Image
        source={require("../../assets/images/mark-light.png")}
        style={{ width: 54, height: 54 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.fontFailureTitle, { color: colors.ink }]}>
        The Arabic font could not be loaded
      </Text>
      <Text style={[styles.fontFailureText, { color: colors.muted }]}>
        The bundled Amiri Quran font is required for faithful Arabic rendering
        and the sajdah mark. Reinstall the app or rebuild it from the repository.
      </Text>
      <Text style={[styles.fontFailureText, { color: colors.muted }]} selectable>
        {message}
      </Text>
    </View>
  );
}

function AppShell() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const inTabs = segments[0] === "(tabs)";
  const audioBarBottom = 10 + insets.bottom + (inTabs ? 49 : 0);

  return (
    <>
      {/* The Android navigation bar is hidden for the whole app, not just the
          reader, so the bottom of every screen is free of system chrome. The
          status bar stays visible: WiFi, battery and the clock are wanted. */}
      <NavigationBar hidden />
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[number]" />
        <Stack.Screen name="about" />
        <Stack.Screen name="tajweed" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="privacy" />
      </Stack>
      <AudioBar bottomOffset={audioBarBottom} />
    </>
  );
}

function RootGate() {
  const database = useAppDatabase();
  const { loaded: settingsLoaded } = useSettings();
  const { loaded: libraryLoaded } = useLibrary();

  const ready =
    database.status === "ready" && settingsLoaded && libraryLoaded;
  const failed = database.status === "error";

  useEffect(() => {
    if (ready || failed) SplashScreen.hideAsync().catch(() => {});
  }, [ready, failed]);

  if (failed) {
    return (
      <ErrorScreen
        message={
          database.status === "error"
            ? database.error
            : "The local data could not be initialized."
        }
        onRetry={database.retry}
      />
    );
  }

  if (!ready) return <BootScreen />;
  return <AppShell />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran: require("../../assets/fonts/AmiriQuran-Regular.ttf"),
  });

  if (fontError) {
    return <FontFailure message={fontError.message} />;
  }
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppDatabaseProvider>
          <SettingsProvider>
            <ThemeProvider>
              <LibraryProvider>
                <AudioProvider>
                  <RootGate />
                </AudioProvider>
              </LibraryProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AppDatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fontFailure: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  fontFailureTitle: {
    marginTop: 18,
    fontSize: 22,
    lineHeight: 29,
    textAlign: "center",
  },
  fontFailureText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 420,
  },
});
