// validators.ts
export const validateNombre = (nombre: string): string | undefined => {
    if (!nombre.trim()) {
        return "El nombre es obligatorio";
    }
    if (nombre.trim().length < 2) {
        return "El nombre debe tener al menos 2 caracteres";
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        return "El nombre solo puede contener letras y espacios";
    }
    return undefined;
};

export const validateTelefono = (telefono: string): string | undefined => {
    if (!telefono.trim()) {
        return "El teléfono es obligatorio";
    }
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
    if (!/^\d+$/.test(telefonoLimpio)) {
        return "El teléfono solo puede contener números";
    }
    if (telefonoLimpio.length < 7 || telefonoLimpio.length > 10) {
        return "El teléfono debe tener entre 7 y 10 dígitos";
    }
    return undefined;
};

export const validateCorreo = (correo: string): string | undefined => {
    if (!correo.trim()) {
        return "El correo es obligatorio";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        return "Ingresa un correo válido (ejemplo@dominio.com)";
    }
    if (!correo.includes('@')) {
        return "El correo debe contener @";
    }
    if (!/\.(com|co|net|org)$/i.test(correo)) {
        return "El correo debe tener una extensión válida (.com, .co, .net, .org)";
    }
    return undefined;
};

export const validateEmpresa = (empresa: string): string | undefined => {
    if (empresa.trim() && empresa.trim().length < 2) {
        return "Si ingresas empresa, debe tener al menos 2 caracteres";
    }
    return undefined;
};

export const validateCargo = (cargo: string): string | undefined => {
    if (cargo.trim() && cargo.trim().length < 2) {
        return "Si ingresas cargo, debe tener al menos 2 caracteres";
    }
    return undefined;
};
