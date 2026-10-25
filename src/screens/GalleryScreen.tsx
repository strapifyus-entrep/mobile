import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { listScans, deleteScan, Scan, API_BASE_URL } from "../api/client";

interface Props {
  onSelectScan: (scan: Scan) => void;
}

const STATUS_COLORS: Record<string, string> = {
  done: "#4ade80",
  processing: "#facc15",
  queued: "#fb923c",
  uploading: "#60a5fa",
  error: "#f87171",
  pending: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  done: "Listo",
  processing: "Procesando...",
  queued: "En cola",
  uploading: "Subiendo",
  error: "Error",
  pending: "Pendiente",
};

export default function GalleryScreen({ onSelectScan }: Props) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScans = useCallback(async () => {
    try {
      setError(null);
      const data = await listScans();
      setScans(data);
    } catch (e: any) {
      setError("No se pudo conectar al backend.\nVerifica que el servidor este corriendo en tu PC.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadScans(); }, [loadScans]);

  const onRefresh = () => { setRefreshing(true); loadScans(); };

  const confirmDelete = (scan: Scan) => {
    Alert.alert(
      "Eliminar escaneo",
      `Eliminar "${scan.name}"? Esta accion no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive",
          onPress: async () => {
            await deleteScan(scan.id);
            loadScans();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando escaneos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.serverUrl}>Servidor: {API_BASE_URL}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadScans}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>[3D]</Text>
        <Text style={styles.emptyTitle}>Sin escaneos aun</Text>
        <Text style={styles.emptyText}>
          Ve a la pestana de captura y toma fotos de un objeto para crear tu primer escaneo 3D.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={scans}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => item.status === "done" && onSelectScan(item)}
          onLongPress={() => confirmDelete(item)}
          activeOpacity={0.8}
        >
          {/* Thumbnail placeholder */}
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailText}>3D</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? "#888" }]} />
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? "#888" }]}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>

            {item.status === "processing" && (
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { width: `${Math.round(item.progress * 100)}%` }]} />
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.image_count} fotos</Text>
              {item.triangle_count > 0 && (
                <Text style={styles.metaText}>{(item.triangle_count / 1000).toFixed(0)}K triangulos</Text>
              )}
              <Text style={styles.metaText}>
                {new Date(item.created_at).toLocaleDateString("es-MX")}
              </Text>
            </View>

            {item.status === "error" && item.error_message && (
              <Text style={styles.errorMsg} numberOfLines={2}>{item.error_message}</Text>
            )}

            {item.status === "done" && (
              <Text style={styles.tapHint}>Toca para ver el modelo 3D</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#0a0a0a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0a0a0a" },
  loadingText: { color: "#aaa", marginTop: 12 },
  errorIcon: { fontSize: 40, color: "#f87171", marginBottom: 12 },
  errorText: { color: "#f87171", textAlign: "center", fontSize: 14, lineHeight: 22 },
  serverUrl: { color: "#555", fontSize: 11, marginTop: 8 },
  retryBtn: { marginTop: 16, backgroundColor: "#6C63FF", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyIcon: { fontSize: 36, color: "#444", marginBottom: 12 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  emptyText: { color: "#888", textAlign: "center", fontSize: 14, lineHeight: 22 },
  card: {
    flexDirection: "row", backgroundColor: "#1a1a1a",
    borderRadius: 16, marginBottom: 12, overflow: "hidden",
  },
  thumbnail: {
    width: 80, backgroundColor: "#222",
    justifyContent: "center", alignItems: "center",
  },
  thumbnailText: { color: "#555", fontSize: 20, fontWeight: "bold" },
  cardInfo: { flex: 1, padding: 14 },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: "500" },
  miniProgress: { height: 3, backgroundColor: "#333", borderRadius: 2, marginVertical: 6 },
  miniProgressFill: { height: 3, backgroundColor: "#facc15", borderRadius: 2 },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  metaText: { color: "#666", fontSize: 11 },
  errorMsg: { color: "#f87171", fontSize: 11, marginTop: 4 },
  tapHint: { color: "#6C63FF", fontSize: 11, marginTop: 4 },
});
