import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking,
} from "react-native";
import { Scan, getModelUrl } from "../api/client";

interface Props {
  scan: Scan;
  onBack: () => void;
}

export default function ModelViewerScreen({ scan, onBack }: Props) {
  const glbUrl = getModelUrl(scan.id, "glb");
  const usdzUrl = getModelUrl(scan.id, "usdz");

  // Abrir USDZ en AR Quick Look nativo del iPhone
  const openInAR = () => {
    Linking.openURL(usdzUrl);
  };

  // Abrir GLB en el navegador con un visor 3D web
  const openInBrowser = () => {
    const viewerUrl = `https://modelviewer.dev/editor/?src=${encodeURIComponent(glbUrl)}`;
    Linking.openURL(viewerUrl);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'<- Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{scan.name}</Text>
      </View>

      {/* Preview placeholder (Three.js WebGL viewer se agrega en fase 2) */}
      <View style={styles.viewerPlaceholder}>
        <Text style={styles.viewerIcon}>[GLB]</Text>
        <Text style={styles.viewerText}>Modelo 3D listo</Text>
        <Text style={styles.viewerSub}>
          {(scan.triangle_count / 1000).toFixed(0)}K triangulos
        </Text>
      </View>

      {/* Info del escaneo */}
      <ScrollView style={styles.info} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitle}>Detalles del escaneo</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Fotos" value={scan.image_count.toString()} />
          <StatCard label="Triangulos" value={`${(scan.triangle_count/1000).toFixed(0)}K`} />
          {scan.bbox.x && (
            <StatCard label="Tam. X" value={`${(scan.bbox.x * 100).toFixed(1)} cm`} />
          )}
          {scan.bbox.y && (
            <StatCard label="Tam. Y" value={`${(scan.bbox.y * 100).toFixed(1)} cm`} />
          )}
        </View>

        <Text style={styles.sectionTitle}>Abrir modelo</Text>

        {/* AR Quick Look (USDZ en iPhone es nativo, sin instalar nada) */}
        <TouchableOpacity style={styles.actionBtn} onPress={openInAR}>
          <View style={styles.actionIcon}><Text style={styles.actionIconText}>AR</Text></View>
          <View>
            <Text style={styles.actionTitle}>Ver en Realidad Aumentada</Text>
            <Text style={styles.actionSub}>AR Quick Look - nativo del iPhone</Text>
          </View>
        </TouchableOpacity>

        {/* Visor 3D web */}
        <TouchableOpacity style={styles.actionBtn} onPress={openInBrowser}>
          <View style={[styles.actionIcon, { backgroundColor: "#1e3a5f" }]}>
            <Text style={styles.actionIconText}>3D</Text>
          </View>
          <View>
            <Text style={styles.actionTitle}>Ver en visor 3D web</Text>
            <Text style={styles.actionSub}>model-viewer en el navegador</Text>
          </View>
        </TouchableOpacity>

        {/* URLs de descarga */}
        <Text style={styles.sectionTitle}>Descargar</Text>

        <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(glbUrl)}>
          <Text style={styles.downloadText}>Descargar .GLB (Blender, Unity, web)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(usdzUrl)}>
          <Text style={styles.downloadText}>Descargar .USDZ (AR iPhone)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#111",
  },
  backBtn: { marginRight: 12 },
  backText: { color: "#6C63FF", fontSize: 15, fontWeight: "600" },
  title: { flex: 1, color: "#fff", fontSize: 17, fontWeight: "700" },
  viewerPlaceholder: {
    height: 240, backgroundColor: "#1a1a1a",
    justifyContent: "center", alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: "#222",
  },
  viewerIcon: { fontSize: 48, color: "#6C63FF", marginBottom: 8 },
  viewerText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  viewerSub: { color: "#666", fontSize: 13, marginTop: 4 },
  info: { flex: 1 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 12, marginTop: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1, minWidth: 80, backgroundColor: "#1a1a1a",
    borderRadius: 12, padding: 14, alignItems: "center",
  },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statLabel: { color: "#666", fontSize: 11, marginTop: 2 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 10,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: "#2d1f5e", justifyContent: "center", alignItems: "center",
  },
  actionIconText: { color: "#6C63FF", fontWeight: "bold", fontSize: 14 },
  actionTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
  actionSub: { color: "#666", fontSize: 12, marginTop: 2 },
  downloadBtn: {
    borderColor: "#333", borderWidth: 1, borderRadius: 10,
    padding: 14, marginBottom: 8,
  },
  downloadText: { color: "#6C63FF", fontSize: 14 },
});
