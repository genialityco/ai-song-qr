/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Timestamp } from "firebase/firestore";

export interface FormData {
    id?: string;
    nombre: string;
    telefono: string;
    correo: string;
    empresa: string;
    cargo: string;
    createdAt?: Timestamp;
}

export interface FormErrors {
    nombre?: string;
    telefono?: string;
    correo?: string;
    empresa?: string;
    cargo?: string;
}