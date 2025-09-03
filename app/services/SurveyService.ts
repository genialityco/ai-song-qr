// app/services/SurveyService.ts
"use client";

import { db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Query,
  QueryDocumentSnapshot,
  Unsubscribe,
  where,
  DocumentData,
  getFirestore,
} from "firebase/firestore";

/** Colección donde guardas los registros (ajústala si usas otro nombre) */
export const SURVEYS_COLLECTION = "surveys";

/** Proyectos permitidos */
export type AllowedProject = "goatHeart" | "goatMusic" | "goatBody";

/** Body para el endpoint /api/save-media */
export interface SaveMediaBody {
  phone: string;
  project: AllowedProject;
  originalUrl: string;
}

/** Respuesta esperada de /api/save-media */
export type SaveMediaResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Modelo de un registro en Firestore */
export interface Survey {
  id: string;
  phone: string;
  project: AllowedProject;
  originalUrl: string;
  status?: "queued" | "processing" | "done" | "error";
  createdAt?: number; // epoch ms
  updatedAt?: number; // epoch ms
}

/** Valida el body antes de enviar */
export function isSaveMediaBody(x: unknown): x is SaveMediaBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.phone === "string" &&
    typeof o.project === "string" &&
    typeof o.originalUrl === "string"
  );
}

/** Normaliza un snapshot de Firestore a Survey */
function mapSnap(docSnap: QueryDocumentSnapshot<DocumentData>): Survey {
  const data = docSnap.data();

  const survey: Survey = {
    id: docSnap.id,
    phone: String(data.phone ?? ""),
    project: (data.project ?? "") as AllowedProject,
    originalUrl: String(data.originalUrl ?? ""),
  };

  if (data.status) survey.status = data.status as Survey["status"];

  if (data.createdAt) {
    // Soporta Timestamp y number
    const v = (data.createdAt as unknown) as { toMillis?: () => number } | number;
    survey.createdAt = typeof v === "number" ? v : v?.toMillis?.();
  }
  if (data.updatedAt) {
    const v = (data.updatedAt as unknown) as { toMillis?: () => number } | number;
    survey.updatedAt = typeof v === "number" ? v : v?.toMillis?.();
  }

  return survey;
}

/** POST a /api/save-media */
export async function saveMedia(body: SaveMediaBody): Promise<SaveMediaResponse> {
  if (!isSaveMediaBody(body)) {
    return { ok: false, error: "Invalid payload for saveMedia" };
  }

  const res = await fetch("/api/save-media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as SaveMediaResponse;

  if (!res.ok) {
    return "error" in json ? json : { ok: false, error: `Request failed: ${res.status}` };
  }
  return json;
}

/** Lista los N últimos surveys (ordenados por updatedAt desc) */
export async function listSurveys(limitN = 20): Promise<Survey[]> {
  const colRef = collection(db, SURVEYS_COLLECTION);

  // Si no tienes updatedAt en todos tus docs, crea un índice o ajusta el orderBy
  const q: Query<DocumentData> = query(colRef, orderBy("updatedAt", "desc"), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map(mapSnap);
}

/** Obtiene el último survey por teléfono */
export async function getLatestSurveyByPhone(phone: string): Promise<Survey | null> {
  const colRef = collection(db, SURVEYS_COLLECTION);
  const q = query(
    colRef,
    where("phone", "==", phone),
    orderBy("updatedAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return mapSnap(snap.docs[0]);
}

/** Suscripción en tiempo real al último survey por teléfono */
export function onLatestSurveyByPhone(
  phone: string,
  cb: (survey: Survey | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, SURVEYS_COLLECTION);
  const q = query(
    colRef,
    where("phone", "==", phone),
    orderBy("updatedAt", "desc"),
    limit(1)
  );

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        cb(null);
        return;
      }
      cb(mapSnap(snap.docs[0]));
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function getSurveyDocRef(id: string) {
  return doc(getFirestore(), SURVEYS_COLLECTION, id);
}
