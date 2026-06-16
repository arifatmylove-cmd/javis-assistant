import React, { useCallback } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface FloatingJavisButtonProps {
  isListening: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export default function FloatingJavisButton({
  isListening,
  onPressIn,
  onPressOut,
}: FloatingJavisButtonProps) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (isListening) {
      scale.value = withSpring(1.15, { damping: 8, stiffness: 120 });
      pulse.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
    } else {
      scale.value = withSpring(1, { damping: 10, stiffness: 150 });
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isListening]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => {
    const ringScale = interpolate(pulse.value, [0, 1], [1, 1.6]);
    const opacity = interpolate(pulse.value, [0, 1], [0.6, 0]);
    return {
      transform: [{ scale: ringScale }],
      opacity,
    };
  });

  const handlePressIn = useCallback(() => {
    if (Platform.OS !== "web") Vibration.vibrate(40);
    onPressIn();
  }, [onPressIn]);

  const handlePressOut = useCallback(() => {
    if (Platform.OS !== "web") Vibration.vibrate(20);
    onPressOut();
  }, [onPressOut]);

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring behind button */}
      <Animated.View
        style={[
          styles.pulseRing,
          { borderColor: isListening ? "#FF6B35" : "#00C8FF" },
          ringStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isListening ? "#FF4040" : "#00C8FF",
              shadowColor: isListening ? "#FF4040" : "#00C8FF",
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isListening ? "microphone" : "microphone-outline"}
            size={28}
            color="#050A14"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 72,
  },
  pulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
});
