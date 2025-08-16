export interface FormData {
    id: string;
    nombre: string;
    telefono: string;
    correo: string;
    empresa: string;
    cargo: string;
    createdAt: any; 
}

export interface FormErrors {
    nombre?: string;
    telefono?: string;
    correo?: string;
    empresa?: string;
    cargo?: string;
}