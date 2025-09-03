"use client";

import type { Timestamp, FieldValue } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
    Timestamp as FsTimestamp, // clase concreta para instanceof
} from "firebase/firestore";
import type { UserDoc, TypeProject } from "../survey/interfaces"; // <-- ajusta ruta
import { usersService } from "../services/SurveyService";         // <-- ajusta ruta

interface SurveyTableProps {
    refreshTrigger?: number;
    className?: string;
}
type Row = UserDoc & { id: string };

export default function SurveyTable({ refreshTrigger = 0, className = "" }: SurveyTableProps) {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [totalCount, setTotalCount] = useState<number>(0);

    // Paginación en cliente
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;

    useEffect(() => {
        void loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [users, count] = await Promise.all([usersService.getAllUsers(), usersService.getUsersCount()]);
            setRows(users);
            setTotalCount(count);
            setCurrentPage(1);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error al cargar los usuarios";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const formatTs = (ts?: Timestamp | FieldValue | null): string => {
        if (!ts) return "N/A";
        if (ts instanceof FsTimestamp) {
            return ts.toDate().toLocaleString("es-CO", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        // Si es FieldValue (por ejemplo, serverTimestamp), no se puede mostrar fecha
        return "N/A";
    };

    const shortUrl = (url?: string, max = 42) => {
        if (!url) return "";
        try {
            const u = new URL(url);
            const s = `${u.hostname}${u.pathname}`;
            return s.length > max ? `${s.slice(0, max - 1)}…` : s;
        } catch {
            return url.length > max ? `${url.slice(0, max - 1)}…` : url;
        }
    };

    const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;


    const toIsoOrEmpty = (ts?: Timestamp | FieldValue): string =>
        ts instanceof FsTimestamp ? ts.toDate().toISOString() : "";

    const exportToCSV = () => {
        if (rows.length === 0) return;

        const headers = [
            "phone",
            "LastUpdated",
            "goatHeart.updatedAt",
            "goatHeart.url",
            "goatMusic.updatedAt",
            "goatMusic.url",
            "goatBody.updatedAt",
            "goatBody.url",
        ];

        const rowsCsv = rows.map((r) => {
            const gh = r.projects?.goatHeart;
            const gm = r.projects?.goatMusic;
            const gb = r.projects?.goatBody;

            const values: string[] = [
                r.phone ?? "",
                toIsoOrEmpty(r.LastUpdated),
                toIsoOrEmpty(gh?.updatedAt),
                gh?.url ?? "",
                toIsoOrEmpty(gm?.updatedAt),
                gm?.url ?? "",
                toIsoOrEmpty(gb?.updatedAt),
                gb?.url ?? "",
            ];

            // Escapa solo strings; ya son strings todas
            return values.map(csvEscape).join(",");
        });

        const csv = [headers.join(","), ...rowsCsv].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = useMemo(
        () => rows.slice(indexOfFirstRecord, indexOfLastRecord),
        [rows, indexOfFirstRecord, indexOfLastRecord]
    );
    const totalPages = Math.ceil(rows.length / recordsPerPage);

    const renderProjectCell = (p?: TypeProject) => {
        if (!p) return <span className="text-white/50">—</span>;
        return (
            <div className="flex flex-col gap-1">
                <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline text-blue-200 hover:text-blue-100 break-all"
                    title={p.url}
                >
                    {shortUrl(p.url)}
                </a>
                <span className="text-[10px] text-white/60">{formatTs(p.updatedAt)}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`${className} bg-white/10 backdrop-blur-md rounded-2xl p-6`}>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
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
                    <h3 className="text-xl font-bold text-white">Usuarios / Proyectos</h3>
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
                        disabled={rows.length === 0}
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
            {rows.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-white/70 text-lg">No hay registros disponibles</p>
                    <p className="text-white/50 text-sm mt-1">Los datos aparecerán aquí cuando existan usuarios</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">Phone</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">goatHeart</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">goatMusic</th>
                                    <th className="text-left py-3 px-2 font-semibold text-white/90">goatBody</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.map((r, index) => (
                                    <tr key={r.id} className={`border-b border-white/10 ${index % 2 === 0 ? "bg-white/5" : ""}`}>
                                        <td className="py-2 px-2 text-white/90">{r.phone}</td>
                                        <td className="py-2 px-2">{renderProjectCell(r.projects?.goatHeart)}</td>
                                        <td className="py-2 px-2">{renderProjectCell(r.projects?.goatMusic)}</td>
                                        <td className="py-2 px-2">{renderProjectCell(r.projects?.goatBody)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 text-sm"
                            >
                                Anterior
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-2 py-1 rounded text-sm ${currentPage === page ? "bg-blue-500 text-white" : "bg-white/20 hover:bg-white/30 text-white"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 text-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}

                    <div className="text-center mt-4 text-white/60 text-xs">
                        Mostrando {Math.min(indexOfFirstRecord + 1, rows.length)} a {Math.min(indexOfLastRecord, rows.length)} de{" "}
                        {rows.length} registros
                    </div>
                </>
            )}
        </div>
    );
}
