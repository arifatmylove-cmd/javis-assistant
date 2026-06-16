import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface JavisOrbProps {
  state: OrbState;
}

export default function JavisOrb({ state }: JavisOrbProps) {
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (state === "idle") {
      pulse.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        true
      );
      spin.value = withRepeat(
        withTiming(1, { duration: 14000 }),
        -1,
        false
      );
    } else if (state === "listening") {
      pulse.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1,
        true
      );
      spin.value = withRepeat(
        withTiming(1, { duration: 4000 }),
        -1,
        false
      );
    } else if (state === "thinking") {
      pulse.value = withRepeat(
        withTiming(1, { duration: 300 }),
        -1,
        true
      );
      spin.value = withRepeat(
        withTiming(1, { duration: 1800 }),
        -1,
        false
      );
    } else if (state === "speaking") {
      pulse.value = withRepeat(
        withSpring(1, { damping: 6, stiffness: 100 }),
        -1,
        true
      );
      spin.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        false
      );
    }
  }, [state]);

  const outerRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1.0, 1.18]);
    const opacity = interpolate(pulse.value, [0, 1], [0.25, 0.65]);
    return { transform: [{ scale }], opacity };
  });

  const middleRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1.0, 1.08]);
    const opacity = interpolate(pulse.value, [0, 1], [0.5, 1.0]);
    return { transform: [{ scale }], opacity };
  });

  const spinDotStyle = useAnimatedStyle(() => {
    const degrees = interpolate(spin.value, [0, 1], [0, 360]);
    return { transform: [{ rotate: `${degrees}deg` }] };
  });

  const coreStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.96, 1.04]);
    return { transform: [{ scale }] };
  });

  const stateColors: Record<OrbState, string> = {
    idle: "#00C8FF",
    listening: "#FF6B35",
    thinking: "#FFB200",
    speaking: "#00FF99",
  };

  const color = stateColors[state];
  const gradientColors: [string, string, string] =
    state === "idle"
      ? ["#80E8FF", "#00C8FF", "#0055BB"]
      : state === "listening"
        ? ["#FFAA80", "#FF6B35", "#CC3300"]
        : state === "thinking"
          ? ["#FFE080", "#FFB200", "#CC7700"]
          : ["#80FFD0", "#00FF99", "#007744"];

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View
        style={[styles.outerGlow, outerRingStyle, { borderColor: color }]}
      />
      {/* Middle ring */}
      <Animated.View
        style={[styles.middleRing, middleRingStyle, { borderColor: color }]}
      />
      {/* Spinning dot ring */}
      <Animated.View style={[styles.spinRing, spinDotStyle]}>
        <View style={[styles.spinDot, { backgroundColor: color }]} />
      </Animated.View>
      {/* Core orb */}
      <Animated.View style={[styles.core, coreStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.8, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Highlight overlay */}
        <View style={styles.highlight} />
      </Animated.View>
    </View>
  );
}

const SIZE = 120;

const styles = StyleSheet.create({
  container: {
    width: SIZE + 50,
    height: SIZE + 50,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlow: {
    position: "absolute",
    width: SIZE + 44,
    height: SIZE + 44,
    borderRadius: (SIZE + 44) / 2,
    borderWidth: 1,
  },
  middleRing: {
    position: "absolute",
    width: SIZE + 18,
    height: SIZE + 18,
    borderRadius: (SIZE + 18) / 2,
    borderWidth: 1.5,
  },
  spinRing: {
    position: "absolute",
    width: SIZE + 30,
    height: SIZE + 30,
    borderRadius: (SIZE + 30) / 2,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  spinDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  core: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    width: SIZE * 0.45,
    height: SIZE * 0.45,
    borderRadius: (SIZE * 0.45) / 2,
    top: SIZE * 0.1,
    left: SIZE * 0.12,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
