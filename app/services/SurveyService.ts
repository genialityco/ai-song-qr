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
  Timestamp as FsTimestamp, // para instanceof
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { UserDoc, ProjectsMap } from "../survey/interfaces";

/** Normaliza un teléfono dejando solo dígitos */
const normalizePhone = (s: string) => String(s || "").replace(/[^\d]/g, "");

/** Type guard para Timestamp de Firestore (sin usar any) */
const isFsTimestamp = (v: unknown): v is FsTimestamp => v instanceof FsTimestamp;

/** Convierte Timestamp a millis (0 si no es Timestamp) */
const tsToMillis = (v: unknown): number => (isFsTimestamp(v) ? v.toMillis() : 0);

/** Mapea un doc a tu modelo tipado */
function mapUserDoc(docSnap: QueryDocumentSnapshot<DocumentData>) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    LastUpdated: data?.LastUpdated,
    phone: data?.phone ?? docSnap.id,
    projects: data?.projects ?? {},
  } as UserDoc & { id: string };
}

class UsersService {
  private collectionName = "users";

  /**
   * Crea o reemplaza COMPLETAMENTE el documento del usuario.
   * Solo deja: { LastUpdated, phone, projects }
   * Usa el phone normalizado como ID del documento.
   */
  async saveUserDoc(params: { phone: string; projects?: ProjectsMap }): Promise<string> {
    const phone = normalizePhone(params.phone);
    const ref = doc(db, this.collectionName, phone);

    const payload: UserDoc = {
      LastUpdated: serverTimestamp(),
      phone,
      projects: params.projects ?? {},
    };

    // merge:false => reemplaza todo (elimina campos viejos)
    await setDoc(ref, payload, { merge: false });
    return ref.id; // = phone
  }

  /** Devuelve un usuario por phone (id = phone normalizado). */
  async getUserByPhone(phone: string): Promise<(UserDoc & { id: string }) | null> {
    const id = normalizePhone(phone);
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as DocumentData;
    return {
      id: snap.id,
      LastUpdated: data?.LastUpdated,
      phone: data?.phone ?? id,
      projects: data?.projects ?? {},
    };
  }

  /**
   * Lista todos los usuarios (intenta ordenar por LastUpdated desc).
   * Si no existe el campo/índice, trae todo y ordena en cliente.
   */
  async getAllUsers(): Promise<Array<UserDoc & { id: string }>> {
    const coll = collection(db, this.collectionName);

    // 1) Intento ordenar en servidor por LastUpdated
    try {
      const q1 = query(coll, orderBy("LastUpdated", "desc"));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        return snap1.docs.map(mapUserDoc);
      }
    } catch {
      // sin índice/campo: caemos al fallback
    }

    // 2) Fallback: traer todo y ordenar en cliente por LastUpdated desc
    const snap2 = await getDocs(coll);
    const records = snap2.docs.map(mapUserDoc);

    records.sort((a, b) => {
      const ta = tsToMillis(a.LastUpdated);
      const tb = tsToMillis(b.LastUpdated);
      return tb - ta; // desc
    });

    return records;
  }

  /**
   * Paginación con cursor usando documentId() (estable).
   * Luego ordena visualmente por LastUpdated desc.
   */
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

    // Orden visual por LastUpdated desc (sin any)
    records.sort((a, b) => {
      const ta = tsToMillis(a.LastUpdated);
      const tb = tsToMillis(b.LastUpdated);
      return tb - ta;
    });

    const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;
    return { records, nextCursor };
  }

  /** Conteo total (sin traer todos los docs). */
  async getUsersCount(): Promise<number> {
    const coll = collection(db, this.collectionName);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  }

  /** Actualiza solo projects.goatMusic con URL y timestamp. */
  async upsertGoatMusicUrl(params: { phone: string; url: string }) {
    const phone = normalizePhone(params.phone);
    const current = await this.getUserByPhone(phone);
    const prevProjects: ProjectsMap = current?.projects ?? {};

    const newProjects: ProjectsMap = {
      ...prevProjects,
      goatMusic: {
        updatedAt: serverTimestamp(),
        url: params.url,
      },
    };

    await this.saveUserDoc({ phone, projects: newProjects });
  }
}

// Instancia única (singleton)
const surveyService = new UsersService();

// Exporta la MISMA instancia como default y como nombrada (para que ambas imports funcionen)
export default surveyService;
export { surveyService, UsersService };
