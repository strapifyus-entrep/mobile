import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { createScan, uploadImages, startProcessing, pollUntilDone, Scan } from "../api/client";

interface Props {
  onScanComplete: (scan: Scan) => void;
}

type CaptureState = "idle" | "capturing" | "uploading" | "processing" | "done";

export default function CaptureScreen({ onScanComplete }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<CaptureState>("idle");
  const [photos, setPhotos] = useState<string[]>([]);
  const [scanName, setScanName] = useState("Escaneo " + new Date().toLocaleDateString("es-MX"));
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const cameraRef = useRef<CameraView>(null);

  // Tomar una foto con la camara
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo) {
        setPhotos((prev) => [...prev, photo.uri]);
      }
    } catch (e) {
      console.error("Error tomando foto:", e);
    }
  };

  // Seleccionar fotos existentes de la galeria (util para pruebas)
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  // Pipeline completo: subir fotos al backend y procesar
  const processPhotos = async () => {
    if (photos.length < 5) {
      Alert.alert(
        "Pocas fotos",
        "Necesitas al menos 5 fotos para una buena reconstruccion 3D. Se recomiendan 30-80 fotos."
      );
      return;
    }

    try {
      // 1. Crear sesion de escaneo en el backend
      setState("uploading");
      setStatusMsg("Creando escaneo...");
      const scan = await createScan(scanName);

      // 2. Subir todas las fotos
      setStatusMsg(`Subiendo ${photos.length} fotos...`);
      await uploadImages(scan.id, photos, (sent, total) => {
        setProgress(sent / total * 0.5); // 0% - 50% del progreso
        setStatusMsg(`Subiendo fotos... ${sent}/${total}`);
      });

      // 3. Iniciar reconstruccion 3D
      setState("processing");
      setStatusMsg("Iniciando reconstruccion 3D...");
      await startProcessing(scan.id);

      // 4. Esperar hasta que el modelo este listo
      setStatusMsg("Procesando en tu PC...");
      const completedScan = await pollUntilDone(
        scan.id,
        (prog, status) => {
          setProgress(0.5 + prog * 0.5); // 50% - 100%
          const msgs: Record<string, string> = {
            queued: "En cola de procesamiento...",
            processing: "Reconstruyendo modelo 3D...",
            done: "Modelo listo!",
          };
          setStatusMsg(msgs[status] ?? status);
        }
      );

      setState("done");
      onScanComplete(completedScan);

    } catch (error: any) {
      setState("idle");
      Alert.alert("Error", error.message ?? "Error desconocido");
    }
  };

  const resetCapture = () => {
    setPhotos([]);
    setState("idle");
    setProgress(0);
    setStatusMsg("");
  };

  // Pedir permiso de camara
  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Camara requerida</Text>
        <Text style={styles.permText}>
          Poly3D necesita acceso a la camara para capturar fotos del objeto a escanear.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnText}>Dar permiso de camara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pantalla de progreso (subiendo / procesando)
  if (state === "uploading" || state === "processing") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.progressTitle}>{statusMsg}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        {state === "processing" && (
          <Text style={styles.hint}>
            Tu PC esta procesando el modelo 3D.{"\n"}
            Esto puede tardar 2-5 minutos.
          </Text>
        )}
      </View>
    );
  }

  // Pantalla de captura principal
  return (
    <View style={styles.container}>
      {/* Camara */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Guia de captura */}
          <View style={styles.guide}>
            <View style={styles.guideCircle} />
            <Text style={styles.guideText}>
              Rodea el objeto lentamente
            </Text>
          </View>

          {/* Contador de fotos */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>{photos.length} fotos</Text>
            {photos.length >= 30 && (
              <Text style={styles.counterGood}>Buena cantidad</Text>
            )}
          </View>
        </CameraView>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {/* Barra de progreso de captura */}
        <View style={styles.captureProgress}>
          <View style={[
            styles.captureProgressFill,
            { width: `${Math.min(photos.length / 80 * 100, 100)}%` }
          ]} />
        </View>
        <Text style={styles.captureHint}>
          {photos.length < 15 ? "Toma mas fotos" :
           photos.length < 40 ? "Buen inicio, sigue rodeando" :
           "Excelente cobertura!"}
        </Text>

        <View style={styles.btnRow}>
          {/* Boton de captura */}
          <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickFromGallery}>
            <Text style={styles.btnSecondaryText}>Desde galeria</Text>
          </TouchableOpacity>

          {photos.length > 0 && (
            <TouchableOpacity style={styles.btnSecondary} onPress={resetCapture}>
              <Text style={styles.btnSecondaryText}>Reiniciar ({photos.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {photos.length >= 5 && (
          <TouchableOpacity style={styles.btnPrimary} onPress={processPhotos}>
            <Text style={styles.btnText}>
              Procesar {photos.length} fotos {"->"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0a0a0a" },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  guide: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  guideCircle: {
    width: 220, height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "rgba(108,99,255,0.7)",
    borderStyle: "dashed",
  },
  guideText: { color: "rgba(255,255,255,0.8)", marginTop: 12, fontSize: 14, fontWeight: "500" },
  counter: {
    position: "absolute", top: 16, right: 16,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, padding: 8, alignItems: "center",
  },
  counterText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  counterGood: { color: "#4ade80", fontSize: 11, marginTop: 2 },
  controls: { backgroundColor: "#111", padding: 16, paddingBottom: 32 },
  captureProgress: { height: 4, backgroundColor: "#333", borderRadius: 2, marginBottom: 6 },
  captureProgressFill: { height: 4, backgroundColor: "#6C63FF", borderRadius: 2 },
  captureHint: { color: "#aaa", fontSize: 12, textAlign: "center", marginBottom: 16 },
  btnRow: { alignItems: "center", marginBottom: 12 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: "#6C63FF",
    justifyContent: "center", alignItems: "center",
  },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  actionRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  btnPrimary: {
    backgroundColor: "#6C63FF", borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    borderColor: "#444", borderWidth: 1, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  btnSecondaryText: { color: "#aaa", fontSize: 13 },
  progressTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 20, textAlign: "center" },
  progressBar: { width: "80%", height: 8, backgroundColor: "#333", borderRadius: 4, marginTop: 20 },
  progressFill: { height: 8, backgroundColor: "#6C63FF", borderRadius: 4 },
  progressPct: { color: "#6C63FF", fontSize: 24, fontWeight: "bold", marginTop: 8 },
  hint: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 20, lineHeight: 20 },
  permTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  permText: { color: "#aaa", fontSize: 15, textAlign: "center", marginBottom: 24 },
});
