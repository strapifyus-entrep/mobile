import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from "react-native";
import CaptureScreen from "./src/screens/CaptureScreen";
import GalleryScreen from "./src/screens/GalleryScreen";
import ModelViewerScreen from "./src/screens/ModelViewerScreen";
import { Scan } from "./src/api/client";

type Tab = "capture" | "gallery";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  // Si hay un escaneo seleccionado, mostrar el visor
  if (selectedScan) {
    return (
      <ModelViewerScreen
        scan={selectedScan}
        onBack={() => setSelectedScan(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Poly3D</Text>
        <Text style={styles.logoSub}>Escaneo 3D personal</Text>
      </View>

      {/* Contenido de la tab activa */}
      <View style={styles.content}>
        {activeTab === "capture" ? (
          <CaptureScreen
            onScanComplete={(scan) => {
              setSelectedScan(scan);
              setActiveTab("gallery");
            }}
          />
        ) : (
          <GalleryScreen
            onSelectScan={(scan) => setSelectedScan(scan)}
          />
        )}
      </View>

      {/* Tab bar inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "gallery" && styles.tabActive]}
          onPress={() => setActiveTab("gallery")}
        >
          <Text style={[styles.tabIcon, activeTab === "gallery" && styles.tabIconActive]}>
            [=]
          </Text>
          <Text style={[styles.tabLabel, activeTab === "gallery" && styles.tabLabelActive]}>
            Galeria
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "capture" && styles.tabActive]}
          onPress={() => setActiveTab("capture")}
        >
          <View style={styles.captureTabBtn}>
            <Text style={styles.captureTabIcon}>+</Text>
          </View>
          <Text style={[styles.tabLabel, activeTab === "capture" && styles.tabLabelActive]}>
            Escanear
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  logo: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  logoSub: { color: "#555", fontSize: 11 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row", backgroundColor: "#111",
    borderTopWidth: 1, borderTopColor: "#1e1e1e",
    paddingBottom: 16,
  },
  tab: { flex: 1, alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  tabActive: {},
  tabIcon: { fontSize: 22, color: "#555" },
  tabIconActive: { color: "#6C63FF" },
  tabLabel: { color: "#555", fontSize: 11, marginTop: 4 },
  tabLabelActive: { color: "#6C63FF", fontWeight: "600" },
  captureTabBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#6C63FF",
    justifyContent: "center", alignItems: "center",
    marginTop: -16,
  },
  captureTabIcon: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 32 },
});
