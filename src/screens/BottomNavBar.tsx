import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface TabItem {
  key: string;
  label: string;
  icon: any; // material icon name
}

interface BottomNavBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

export default function BottomNavBar({ tabs, activeTab, onTabPress }: BottomNavBarProps) {
  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navButton}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeIndicator} />}
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? "#008560" : "#f7faf8"}
              style={{ opacity: isActive ? 1 : 0.8 }}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: isActive ? "#008560" : "#f7faf8",
                  opacity: isActive ? 1 : 0.8,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 90 : 75,
    backgroundColor: "#181c1c",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: "#2d3130",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 99,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: "100%",
    position: "relative",
    paddingTop: 8,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: "#008560",
    borderRadius: 9999,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
