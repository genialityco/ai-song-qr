// app/survey/SurveyTable.tsx
"use client";

import * as React from "react";
import type { Timestamp } from "firebase/firestore";

// === Tipos (si ya los exportas desde tu módulo, impórtalos en lugar de re-declarar) ===
export interface TypeProject {
    updatedAt: Timestamp | null | undefined;
    url: string;
}
export type ProjectsMap = {
    goatHeart?: TypeProject;
    goatMusic?: TypeProject;
    goatBody?: TypeProject;
    [k: string]: TypeProject | undefined;
};
export interface UserDoc {
    lastUpdated: Timestamp | null | undefined;
    phone: string;
    projects: ProjectsMap;
}
export type UserRow = UserDoc & { id: string };

// === Utilidades ===
function fmtTs(ts: Timestamp | null | undefined): string {
    try {
        if (!ts) return "—";
        const d = ts.toDate();
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
        return "—";
    }
}

type ButtonClick = React.MouseEvent<HTMLButtonElement, MouseEvent>;

interface SurveyTableProps {
    rows: UserRow[];
    onRefresh?: () => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

export default function SurveyTable({
    rows,
    onRefresh,
    onNextPage,
    onPrevPage,
}: SurveyTableProps) {
    const handleRefresh = (e: ButtonClick) => {
        e.preventDefault();
        onRefresh?.();
    };

    return (
        <div className="w-full">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Usuarios</h2>
                <div className="flex gap-2">
                    {onPrevPage && (
                        <button
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                            onClick={(e) => {
                                e.preventDefault();
                                onPrevPage();
                            }}
                        >
                            ◀ Atrás
                        </button>
                    )}
                    {onNextPage && (
                        <button
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                            onClick={(e) => {
                                e.preventDefault();
                                onNextPage();
                            }}
                        >
                            Siguiente ▶
                        </button>
                    )}
                    {onRefresh && (
                        <button
                            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                            onClick={handleRefresh}
                        >
                            Refrescar
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">ID</th>
                            <th className="px-3 py-2 text-left font-medium">Teléfono</th>
                            <th className="px-3 py-2 text-left font-medium">lastUpdated</th>
                            <th className="px-3 py-2 text-left font-medium">goatMusic.url</th>
                            <th className="px-3 py-2 text-left font-medium">goatHeart.url</th>
                            <th className="px-3 py-2 text-left font-medium">goatBody.url</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-3 py-3" colSpan={6}>
                                    Sin registros
                                </td>
                            </tr>
                        ) : (
                            rows.map((row: UserRow) => (
                                <tr key={row.id} className="border-t">
                                    <td className="px-3 py-2">{row.id}</td>
                                    <td className="px-3 py-2">{row.phone}</td>
                                    <td className="px-3 py-2">{fmtTs(row.lastUpdated)}</td>
                                    <td className="px-3 py-2 break-all">
                                        {row.projects?.goatMusic?.url ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 break-all">
                                        {row.projects?.goatHeart?.url ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 break-all">
                                        {row.projects?.goatBody?.url ?? "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
