import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export interface Message {
  id: string;
  role: "user" | "javis";
  text: string;
  action?: string | null;
  timestamp: number;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.role === "user";

  const timeStr = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const actionLabels: Record<string, string> = {
    CONFIRM_SEND: "⬡ Awaiting confirmation",
    OPEN_WHATSAPP: "⬡ Opening WhatsApp",
    OPEN_WHATSAPP_SEND: "⬡ Sending via WhatsApp",
  };

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowJavis]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>J</Text>
        </View>
      )}
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: colors.userBubble, borderColor: colors.primary + "50" }]
              : [styles.bubbleJavis, { backgroundColor: colors.javisBubble, borderColor: colors.border }],
          ]}
        >
          <Text style={[styles.text, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            {message.text}
          </Text>
          {message.action && actionLabels[message.action] && (
            <Text style={[styles.actionTag, { color: colors.accent }]}>
              {actionLabels[message.action]}
            </Text>
          )}
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
    marginHorizontal: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  rowUser: {
    flexDirection: "row-reverse",
  },
  rowJavis: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  bubbleWrapper: {
    maxWidth: "75%",
    gap: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleJavis: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionTag: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    alignSelf: "flex-end",
    paddingHorizontal: 4,
  },
});
