"use client";

import { useState, useEffect } from "react";
import { surveyService, type SurveyRecord } from "../services/SurveyService";

interface SurveyTableProps {
    refreshTrigger?: number; // Para forzar actualización cuando se agregue un nuevo registro
    className?: string;
}

export default function SurveyTable({ refreshTrigger = 0, className = "" }: SurveyTableProps) {
    const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5; // Menos registros para mejor visualización

    // Cargar datos al montar el componente y cuando cambie refreshTrigger
    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [surveysData, count] = await Promise.all([
                surveyService.getAllSurveyRecords(),
                surveyService.getSurveyCount()
            ]);

            setSurveys(surveysData);
            setTotalCount(count);
            setCurrentPage(1); // Reset página al recargar
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cargar las encuestas";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return "N/A";
    };

    const exportToCSV = () => {
        if (surveys.length === 0) return;

        const headers = ["Nombre", "Teléfono", "Correo", "Empresa", "Cargo", "Fecha"];
        const csvContent = [
            headers.join(","),
            ...surveys.map(survey => [
                `"${survey.nombre}"`,
                survey.telefono,
                `"${survey.correo}"`,
                `"${survey.empresa}"`,
                `"${survey.cargo}"`,
                survey.createdAt?.toDate ? survey.createdAt.toDate().toLocaleString() : "N/A"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `encuestas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Paginación
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = surveys.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(surveys.length / recordsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className={`${className} bg-white/10 backdrop-blur-md rounded-2xl p-6`}>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-white/80">Cargando registros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className} bg-white/10 backdrop-blur-md rounded-2xl p-6`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Registros de Encuestas</h3>
                    <p className="text-white/70 text-sm">
                        Total: <span className="font-semibold">{totalCount}</span> registros
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        Actualizar
                    </button>
                    <button
                        onClick={exportToCSV}
                        disabled={surveys.length === 0}
                        className="px-3 py-1 bg-green-500/80 hover:bg-green-600/80 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 mb-4">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Tabla */}
            {surveys.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-white/70 text-lg">No hay registros disponibles</p>
                    <p className="text-white/50 text-sm mt-1">
                        Los datos aparecerán aquí cuando se completen encuestas
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Nombre</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Teléfono</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Correo</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Empresa</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Cargo</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.map((survey, index) => (
                                    <tr key={survey.id} className={`border-b border-white/10 ${index % 2 === 0 ? 'bg-white/5' : ''}`}>
                                        <td className="py-2 px-2 text-white/90">{survey.nombre}</td>
                                        <td className="py-2 px-2 text-white/90">{survey.telefono}</td>
                                        <td className="py-2 px-2 text-white/90 text-xs">{survey.correo}</td>
                                        <td className="py-2 px-2 text-white/90">{survey.empresa}</td>
                                        <td className="py-2 px-2 text-white/90">{survey.cargo}</td>
                                        <td className="py-2 px-2 text-white/70 text-xs">{formatDate(survey.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 text-sm"
                            >
                                Anterior
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-2 py-1 rounded text-sm ${currentPage === page
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/20 hover:bg-white/30 text-white"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 text-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}

                    <div className="text-center mt-4 text-white/60 text-xs">
                        Mostrando {indexOfFirstRecord + 1} a {Math.min(indexOfLastRecord, surveys.length)} de {surveys.length} registros
                    </div>
                </>
            )}
        </div>
    );
}