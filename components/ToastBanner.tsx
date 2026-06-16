import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text } from "react-native";

interface ToastBannerProps {
  message: string;
  visible: boolean;
}

export default function ToastBanner({ message, visible }: ToastBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#003A5C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 999,
    borderBottomWidth: 1,
    borderBottomColor: "#00C8FF44",
    pointerEvents: "none",
  },
  text: {
    color: "#E8F4FF",
    fontSize: 13,
  },
});
