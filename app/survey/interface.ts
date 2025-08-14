export interface FormData {
    nombre: string;
    telefono: string;
    correo: string;
    empresa: string;
    cargo: string;
}

export interface FormErrors {
    nombre?: string;
    telefono?: string;
    correo?: string;
    empresa?: string;
    cargo?: string;
}