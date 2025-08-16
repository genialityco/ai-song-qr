"use client";

import { useState } from "react";
import { surveyService } from "../services/SurveyService"; // Ajusta la ruta según tu estructura
import type { FormData, FormErrors } from "./interfaces";
import {
    validateNombre,
    validateTelefono,
    validateCorreo,
    validateEmpresa,
    validateCargo,
} from "./validators";

interface SurveyFormProps {
    onSuccess?: () => void;
    onSubmitStart?: () => void;
    onSubmitEnd?: () => void;
}

export default function SurveyForm({ onSuccess, onSubmitStart, onSubmitEnd }: SurveyFormProps) {
    const [formData, setFormData] = useState<FormData>({
        nombre: "",
        telefono: "",
        correo: "",
        empresa: "",
        cargo: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>("");

    const validators: Record<keyof FormData, (v: string) => string | undefined> = {
        nombre: validateNombre,
        telefono: validateTelefono,
        correo: validateCorreo,
        empresa: validateEmpresa,
        cargo: validateCargo,
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
            const error = validators[key](formData[key]);
            if (error) newErrors[key] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const key = name as keyof FormData;
        setFormData((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: validators[key](value) }));

        // Limpiar el error de envío cuando el usuario empiece a escribir
        if (submitError) setSubmitError("");
    };

    const resetForm = () => {
        setFormData({
            nombre: "",
            telefono: "",
            correo: "",
            empresa: "",
            cargo: "",
        });
        setErrors({});
        setSubmitError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError("");
        onSubmitStart?.();

        try {
            const recordId = await surveyService.createSurveyRecord(formData);
            console.log("Registro creado con ID:", recordId);

            resetForm();
            onSuccess?.();
        } catch (error) {
            console.error("Error al guardar la encuesta:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Ocurrió un error al enviar los datos. Intenta nuevamente.";
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
            onSubmitEnd?.();
        }
    };

    const inputClass = "w-full px-4 py-2 rounded-lg bg-white/20 border focus:outline-none focus:ring-2";

    const fields = [
        { name: "nombre", type: "text", placeholder: "Nombre *" },
        { name: "telefono", type: "tel", placeholder: "Teléfono (7-10 dígitos) *" },
        { name: "correo", type: "email", placeholder: "Correo *" },
        { name: "empresa", type: "text", placeholder: "Empresa *" },
        { name: "cargo", type: "text", placeholder: "Cargo *" },
    ] as const;

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Formulario de Encuesta</h2>

            {/* Error de envío */}
            {submitError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg">
                    <p className="text-red-300 text-sm">{submitError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(({ name, type, placeholder }) => (
                    <div key={name}>
                        <input
                            type={type}
                            name={name}
                            placeholder={placeholder}
                            value={formData[name]}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className={`${inputClass} ${errors[name]
                                ? "border-red-400 focus:ring-red-400"
                                : "border-white/30 focus:ring-blue-400"
                                } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                        />
                        {errors[name] && (
                            <p className="text-red-300 text-sm mt-1">{errors[name]}</p>
                        )}
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full ${isSubmitting
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                        } text-white py-2 rounded-lg font-semibold transition`}
                >
                    {isSubmitting ? "Enviando..." : "Enviar"}
                </button>
            </form>
        </div>
    );
}