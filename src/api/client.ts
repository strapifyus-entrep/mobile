/**
 * Cliente API para comunicarse con el backend Poly3D en la PC
 * Cambia API_BASE_URL a la IP de tu PC en la red WiFi local
 */

// IMPORTANTE: Cambia esta IP a la de tu PC
// En Windows: abre cmd y escribe "ipconfig" -> busca "Direccion IPv4"
export const API_BASE_URL = "http://192.168.78.111:8000";

export interface Scan {
  id: string;
  name: string;
  status: "pending" | "uploading" | "queued" | "processing" | "done" | "error";
  image_count: number;
  point_count: number;
  triangle_count: number;
  progress: number;
  error_message: string | null;
  output_glb: string | null;
  output_usdz: string | null;
  created_at: string;
  completed_at: string | null;
  bbox: { x: number | null; y: number | null; z: number | null };
}

// Crear nuevo escaneo
export async function createScan(name: string): Promise<Scan> {
  const form = new FormData();
  form.append("name", name);
  const res = await fetch(`${API_BASE_URL}/api/scans/`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Error creando escaneo: ${res.status}`);
  return res.json();
}

export async function getScan(scanId: string): Promise<Scan> {
  const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}`);
  if (!res.ok) throw new Error(`Escaneo no encontrado: ${res.status}`);
  return res.json();
}

export async function listScans(): Promise<Scan[]> {
  const res = await fetch(`${API_BASE_URL}/api/scans/`);
  if (!res.ok) throw new Error(`Error listando escaneos: ${res.status}`);
  return res.json();
}

export async function deleteScan(scanId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/scans/${scanId}`, { method: "DELETE" });
}

export async function getScanStatus(
  scanId: string
): Promise<{ status: string; progress: number; error: string | null }> {
  const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/status`);
  if (!res.ok) throw new Error(`Error consultando estado: ${res.status}`);
  return res.json();
}

// Upload de fotos al backend
export async function uploadImages(
  scanId: string,
  imageUris: string[],
  onProgress?: (sent: number, total: number) => void
): Promise<{ uploaded: number; total_images: number }> {
  const form = new FormData();
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    const filename = uri.split("/").pop() ?? `photo_${i}.jpg`;
    form.append("files", { uri, name: filename, type: "image/jpeg" } as any);
    onProgress?.(i + 1, imageUris.length);
  }
  const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/images`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Error subiendo imagenes: ${res.status}`);
  return res.json();
}

// Iniciar procesamiento 3D en el backend
export async function startProcessing(scanId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}/process`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Error iniciando procesamiento: ${res.status}`);
}

// URL del modelo 3D para descargarlo
export function getModelUrl(scanId: string, format: "glb" | "usdz" | "ply"): string {
  return `${API_BASE_URL}/api/models/${scanId}/${format}`;
}

// Polling hasta que el procesamiento termine
export async function pollUntilDone(
  scanId: string,
  onProgress: (progress: number, status: string) => void,
  intervalMs = 2500
): Promise<Scan> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const { status, progress, error } = await getScanStatus(scanId);
        onProgress(progress, status);
        if (status === "done") {
          clearInterval(interval);
          resolve(await getScan(scanId));
        } else if (status === "error") {
          clearInterval(interval);
          reject(new Error(error ?? "Error desconocido en el procesamiento"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, intervalMs);
  });
}
