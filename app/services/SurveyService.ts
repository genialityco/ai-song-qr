// src/services/usersService.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  startAfter,
  limit as limitFn,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
  documentId,
  Timestamp as FsTimestamp,
  updateDoc,
} from "firebase/firestore";

// ⚠️ Ajusta esta ruta a tu inicialización real:
import { db } from "@/firebaseConfig";

// ✅ Si ya tienes estos tipos en "../survey/interfaces", usa el import y
// borra las definiciones de abajo.
// import type { UserDoc, ProjectsMap, TypeProject } from "../survey/interfaces";

// ---- Tipos mínimos por si no importas los tuyos ----
export interface TypeProject {
  updatedAt: FsTimestamp | any;
  url: string;
}
export type ProjectsMap = {
  goatHeart?: TypeProject;
  goatMusic?: TypeProject;
  goatBody?: TypeProject;
  [k: string]: TypeProject | undefined;
};
export interface UserDoc {
  lastUpdated: FsTimestamp | any;
  phone: string;
  projects: ProjectsMap;
}
// ----------------------------------------------------

/** Normaliza un teléfono dejando solo dígitos */
const normalizePhone = (s: string) => String(s || "").replace(/[^\d]/g, "");

/** Type guard para Timestamp de Firestore */
const isFsTimestamp = (v: unknown): v is FsTimestamp => v instanceof FsTimestamp;
/** Convierte Timestamp a millis (0 si no es Timestamp) */
const tsToMillis = (v: unknown): number => (isFsTimestamp(v) ? v.toMillis() : 0);

/** Mapea un doc a tu modelo tipado (usa lastUpdated en minúsculas) */
function mapUserDoc(docSnap: QueryDocumentSnapshot<DocumentData>) {
  const data = docSnap.data() as DocumentData;
  return {
    id: docSnap.id,
    lastUpdated: data?.lastUpdated,
    phone: data?.phone ?? docSnap.id,
    projects: (data?.projects ?? {}) as ProjectsMap,
  } as UserDoc & { id: string };
}

class UsersService {
  private collectionName = "users";

  /** Garantiza doc base sin borrar nada (nunca toca projects.*) */
  private async ensureDocExists(phoneRaw: string) {
    const phone = normalizePhone(phoneRaw);
    const ref = doc(db, this.collectionName, phone);
    await setDoc(ref, { phone }, { merge: true }); // NO borra ni projects ni otros campos
    return ref;
  }

  /** Lectura por phone (id = phone normalizado) */
  async getUserByPhone(phoneRaw: string): Promise<(UserDoc & { id: string }) | null> {
    const id = normalizePhone(phoneRaw);
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as DocumentData;
    return {
      id: snap.id,
      lastUpdated: data?.lastUpdated,
      phone: data?.phone ?? id,
      projects: (data?.projects ?? {}) as ProjectsMap,
    };
  }

  /** Lista todos con intento de orderBy(lastUpdated desc); si no, ordena en cliente */
  async getAllUsers(): Promise<Array<UserDoc & { id: string }>> {
    const coll = collection(db, this.collectionName);
    try {
      const q1 = query(coll, orderBy("lastUpdated", "desc"));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) return snap1.docs.map(mapUserDoc);
    } catch { }
    const snap2 = await getDocs(coll);
    const records = snap2.docs.map(mapUserDoc);
    records.sort((a, b) => tsToMillis(b.lastUpdated) - tsToMillis(a.lastUpdated));
    return records;
  }

  /** Paginación por documentId; orden visual por lastUpdated desc en cliente */
  async getUsersPaginated(options?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
  }): Promise<{
    records: Array<UserDoc & { id: string }>;
    nextCursor?: QueryDocumentSnapshot<DocumentData>;
  }> {
    const pageSize = options?.pageSize ?? 10;
    const coll = collection(db, this.collectionName);

    const base = query(coll, orderBy(documentId()), limitFn(pageSize));
    const q = options?.cursor ? query(base, startAfter(options.cursor)) : base;

    const snap = await getDocs(q);
    const records = snap.docs.map(mapUserDoc);
    records.sort((a, b) => tsToMillis(b.lastUpdated) - tsToMillis(a.lastUpdated));

    const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;
    return { records, nextCursor };
  }

  /** Conteo total */
  async getUsersCount(): Promise<number> {
    const coll = collection(db, this.collectionName);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  }

  /**
   * 🚫 Política estricta: NUNCA toca goatHeart ni goatBody.
   * ✅ Solo crea/actualiza goatMusic (sobrescribe url y updatedAt).
   */
  async upsertGoatMusicUrl(params: { phone: string; url: string }) {
    const ref = await this.ensureDocExists(params.phone);
    await updateDoc(ref, {
      "projects.goatMusic.url": params.url,
      "projects.goatMusic.updatedAt": serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
  }
}

// Singleton
const usersService = new UsersService();
export default usersService;
export { usersService, UsersService };
