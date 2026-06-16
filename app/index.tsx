import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
  StatusBar,
  PermissionsAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useColors } from "@/hooks/useColors";
import JavisOrb from "@/components/JavisOrb";
import MessageBubble, { type Message } from "@/components/MessageBubble";
import FloatingJavisButton from "@/components/FloatingJavisButton";
import ToastBanner from "@/components/ToastBanner";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const JAVIS_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function askJavis(text: string): Promise<{ reply: string; action: string | null; data: unknown }> {
  const res = await fetch(`${JAVIS_API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("JAVIS brain offline");
  return res.json();
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

async function requestAndroidPermissions() {
  if (Platform.OS !== "android") return;
  try {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);
  } catch {
    // Non-critical
  }
}

export default function JavisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "javis",
      text: "Online and ready. How can I assist you?",
      action: null,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState({ visible: false, text: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    requestAndroidPermissions();
  }, []);

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, text });
    toastTimer.current = setTimeout(() => setToast({ visible: false, text: "" }), 3500);
  }, []);

  const speakReply = useCallback((text: string) => {
    if (Platform.OS === "web") return;
    Speech.stop();
    setOrbState("speaking");
    Speech.speak(text, {
      language: "en-US",
      pitch: 0.85,
      rate: 0.95,
      onDone: () => setOrbState("idle"),
      onStopped: () => setOrbState("idle"),
      onError: () => setOrbState("idle"),
    });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    Keyboard.dismiss();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: Message = {
      id: makeId(),
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [userMsg, ...prev]);
    setOrbState("thinking");
    setLoading(true);

    try {
      const result = await askJavis(trimmed);
      const javisMsg: Message = {
        id: makeId(),
        role: "javis",
        text: result.reply,
        action: result.action,
        timestamp: Date.now(),
      };
      setMessages((prev) => [javisMsg, ...prev]);
      showToast(`JAVIS: ${result.reply.slice(0, 80)}${result.reply.length > 80 ? "…" : ""}`);

      if (Platform.OS !== "web") {
        speakReply(result.reply);
      } else {
        setOrbState("idle");
      }

      if (result.action === "OPEN_WHATSAPP" || result.action === "OPEN_WHATSAPP_SEND") {
        setTimeout(() => {
          Alert.alert(
            "WhatsApp Action",
            result.action === "OPEN_WHATSAPP_SEND"
              ? "On your phone, JAVIS will open WhatsApp to send the message."
              : "On your phone, JAVIS will open WhatsApp.",
            [{ text: "Got it" }]
          );
        }, 600);
      }
    } catch {
      const errMsg: Message = {
        id: makeId(),
        role: "javis",
        text: "My connection is disrupted. Please check your network.",
        action: null,
        timestamp: Date.now(),
      };
      setMessages((prev) => [errMsg, ...prev]);
      setOrbState("idle");
    } finally {
      setLoading(false);
    }
  }, [loading, speakReply, showToast]);

  const startRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Voice Input", "Voice recording is available on Android and iOS.");
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Microphone access is required for voice input.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setOrbState("listening");
    } catch {
      Alert.alert("Error", "Could not start recording. Please check microphone permissions.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setIsRecording(false);
    setOrbState("thinking");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) { setOrbState("idle"); return; }

      const groqKey = process.env.EXPO_PUBLIC_GROQ_KEY;
      if (!groqKey) {
        setOrbState("idle");
        Alert.alert(
          "Voice Transcription",
          "Add EXPO_PUBLIC_GROQ_KEY to your environment to enable voice-to-text. You can still type messages."
        );
        return;
      }

      const form = new FormData();
      form.append("file", { uri, name: "voice.m4a", type: "audio/m4a" } as unknown as Blob);
      form.append("model", "whisper-large-v3");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: form,
      });

      if (!res.ok) throw new Error("Transcription failed");
      const data = (await res.json()) as { text: string };
      if (data.text?.trim()) {
        await sendMessage(data.text.trim());
      } else {
        setOrbState("idle");
      }
    } catch {
      setOrbState("idle");
      Alert.alert("Error", "Could not transcribe. Please type your message.");
    }
  }, [recording, sendMessage]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const statusLabel: Record<OrbState, string> = {
    idle: "STANDBY",
    listening: "LISTENING",
    thinking: "PROCESSING",
    speaking: "RESPONDING",
  };

  const statusColor: Record<OrbState, string> = {
    idle: colors.mutedForeground,
    listening: "#FF6B35",
    thinking: "#FFB200",
    speaking: "#00FF99",
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Toast banner */}
      <ToastBanner message={toast.text} visible={toast.visible} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            JAVIS
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            AI Assistant
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: colors.secondary }]}
          onPress={async () => {
            try { await fetch(`${JAVIS_API_BASE}/memory`, { method: "DELETE" }); } catch { /* ignore */ }
            setMessages([{ id: makeId(), role: "javis", text: "Memory cleared. Ready for new session.", action: null, timestamp: Date.now() }]);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <Feather name="refresh-ccw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Orb + status */}
      <View style={styles.orbSection}>
        <JavisOrb state={orbState} />
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor[orbState] }]} />
          <Text style={[styles.statusText, { color: statusColor[orbState], fontFamily: "Inter_500Medium" }]}>
            {statusLabel[orbState]}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      />

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 8,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: colors.border,
              fontFamily: "Inter_400Regular",
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask JAVIS anything..."
          placeholderTextColor={colors.mutedForeground}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          editable={!loading}
        />

        {input.trim().length > 0 ? (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={() => sendMessage(input)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Feather name="send" size={20} color={colors.background} />
            )}
          </TouchableOpacity>
        ) : (
          <FloatingJavisButton
            isListening={isRecording}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: 5,
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  orbSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 3,
  },
  list: { flex: 1 },
  messagesList: { paddingVertical: 8 },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
