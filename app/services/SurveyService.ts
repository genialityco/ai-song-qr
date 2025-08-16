import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, DocumentData } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { FormData } from "../survey/interfaces"; // Ajusta la ruta según tu estructura


class SurveyService {
    private collectionName = "encuestas";
    async createSurveyRecord(data: FormData): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), {
                ...data,
                createdAt: serverTimestamp(),
            });

            return docRef.id;
        } catch (error) {
            console.error("Error al crear registro de encuesta:", error);
            throw new Error("No se pudo guardar la encuesta. Por favor, intenta nuevamente.");
        }
    }

    /**
     * Obtiene todos los registros de encuestas ordenados por fecha de creación
     */
    async getAllSurveyRecords(): Promise<FormData[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);

            const records: FormData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as DocumentData;
                records.push({
                    id: doc.id,
                    nombre: data.nombre || "",
                    telefono: data.telefono || "",
                    correo: data.correo || "",
                    empresa: data.empresa || "",
                    cargo: data.cargo || "",
                    createdAt: data.createdAt,
                });
            });

            return records;
        } catch (error) {
            console.error("Error al obtener registros de encuestas:", error);
            throw new Error("No se pudieron cargar las encuestas. Por favor, intenta nuevamente.");
        }
    }

    /**
     * Obtiene registros de encuestas con paginación
     */
    async getSurveyRecordsPaginated(limit: number = 10): Promise<FormData[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy("createdAt", "desc")
                // Aquí podrías agregar startAfter para paginación real si es necesario
            );

            const querySnapshot = await getDocs(q);

            const records: FormData[] = [];
            let count = 0;

            querySnapshot.forEach((doc) => {
                if (count < limit) {
                    const data = doc.data() as DocumentData;
                    records.push({
                        id: doc.id,
                        nombre: data.nombre || "",
                        telefono: data.telefono || "",
                        correo: data.correo || "",
                        empresa: data.empresa || "",
                        cargo: data.cargo || "",
                        createdAt: data.createdAt,
                    });
                    count++;
                }
            });

            return records;
        } catch (error) {
            console.error("Error al obtener registros paginados:", error);
            throw new Error("No se pudieron cargar las encuestas. Por favor, intenta nuevamente.");
        }
    }

    /**
     * Obtiene el conteo total de registros
     */
    async getSurveyCount(): Promise<number> {
        try {
            const querySnapshot = await getDocs(collection(db, this.collectionName));
            return querySnapshot.size;
        } catch (error) {
            console.error("Error al obtener conteo de encuestas:", error);
            throw new Error("No se pudo obtener el conteo de encuestas.");
        }
    }
}

// Exportar una instancia única del servicio (patrón Singleton)
export const surveyService = new SurveyService();

// También exportar la clase por si necesitas crear múltiples instancias
export default SurveyService;