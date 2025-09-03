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
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { UserDoc, ProjectsMap } from "../survey/interfaces"; // ajusta la ruta

/** Normaliza un teléfono dejando solo dígitos */
const normalizePhone = (s: string) => String(s || "").replace(/[^\d]/g, "");

class UsersService {
    private collectionName = "users";

    /**
     * Crea o reemplaza COMPLETAMENTE el documento del usuario.
     * Solo deja: { LastUpdated, phone, projects }
     * Usa el phone normalizado como ID del documento.
     */
    async saveUserDoc(params: {
        phone: string;
        projects?: ProjectsMap; // opcional; por defecto {}
    }): Promise<string> {
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

    /**
     * Devuelve un usuario por phone (id = phone normalizado).
     */
    async getUserByPhone(phone: string): Promise<(UserDoc & { id: string }) | null> {
        const id = normalizePhone(phone);
        const ref = doc(db, this.collectionName, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;

        const data = snap.data() as DocumentData;
        return {
            id: snap.id,
            LastUpdated: data.LastUpdated,
            phone: data.phone ?? id,
            projects: data.projects ?? {},
        };
    }

    /**
     * Lista todos los usuarios ordenados por LastUpdated desc.
     */
    async getAllUsers(): Promise<Array<UserDoc & { id: string }>> {
        const q = query(
            collection(db, this.collectionName),
            orderBy("lastUpdated", "desc")
        );
        const querySnapshot = await getDocs(q);
        const records: Array<UserDoc & { id: string }> = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as DocumentData;
            records.push({
                id: docSnap.id,
                LastUpdated: data.LastUpdated,
                phone: data.phone ?? docSnap.id,
                projects: data.projects ?? {},
            });
        });

        return records;
    }

    /**
     * Paginación real con cursor.
     * - pageSize: tamaño de página
     * - cursor: último doc de la página anterior (usa el que devuelve esta misma función)
     *
     * Retorna los registros y el próximo cursor (si existe).
     */
    async getUsersPaginated(options?: {
        pageSize?: number;
        cursor?: QueryDocumentSnapshot<DocumentData>;
    }): Promise<{
        records: Array<UserDoc & { id: string }>;
        nextCursor?: QueryDocumentSnapshot<DocumentData>;
    }> {
        const pageSize = options?.pageSize ?? 10;

        const baseQuery = query(
            collection(db, this.collectionName),
            orderBy("LastUpdated", "desc"),
            limitFn(pageSize)
        );

        const q = options?.cursor
            ? query(baseQuery, startAfter(options.cursor))
            : baseQuery;

        const snap = await getDocs(q);

        const records: Array<UserDoc & { id: string }> = [];
        snap.forEach((docSnap) => {
            const data = docSnap.data() as DocumentData;
            records.push({
                id: docSnap.id,
                LastUpdated: data.LastUpdated,
                phone: data.phone ?? docSnap.id,
                projects: data.projects ?? {},
            });
        });

        const nextCursor =
            snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;

        return { records, nextCursor };
    }

    /**
     * Conteo total (sin traer todos los docs).
     */
    async getUsersCount(): Promise<number> {
        const coll = collection(db, this.collectionName);
        const snapshot = await getCountFromServer(coll);
        return snapshot.data().count;
    }

    /**
     * Helper para actualizar SOLO projects.goatMusic con URL y timestamp.
     * Mantiene el resto de projects intacto.
     * Reemplaza el doc para garantizar el esquema (LastUpdated/phone/projects).
     */
    async upsertGoatMusicUrl(params: { phone: string; url: string }) {
        const phone = normalizePhone(params.phone);

        // Obtener el doc actual (si existe) para preservar proyectos existentes
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

// Exporta una instancia única (Singleton)
export const usersService = new UsersService();
export default UsersService;
