import React, { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { PDFViewer } from "@react-pdf/renderer";
import FacturePDF from "./FacturePDF";

const LABELS = { BROUILLON: "Brouillon", EMISE: "Émise", PARTIELLEMENT_PAYEE: "Partiellement payée", PAYEE: "Payée", EN_RETARD: "En retard", ANNULEE: "Annulée" };

export default function FacturesDataTable({ factures = [] }) {
  const [sorting, setSorting] = useState([]);
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState(null);
  const columns = useMemo(() => [
    { accessorKey: "numero", header: "Numéro" },
    { accessorKey: "date_facture", header: "Date" },
    { accessorKey: "montant_ttc", header: "Montant TTC", cell: ({ getValue }) => `${Number(getValue() || 0).toLocaleString("fr-FR")} XAF` },
    { accessorKey: "reste_a_payer", header: "Reste à payer", cell: ({ getValue }) => `${Number(getValue() || 0).toLocaleString("fr-FR")} XAF` },
    { accessorKey: "statut", header: "Statut", cell: ({ getValue }) => LABELS[getValue()] || getValue() },
    { id: "actions", header: "Document", enableSorting: false, cell: ({ row }) => <button className="link-button" type="button" onClick={() => setPreview(row.original)}>Aperçu PDF</button> },
  ], []);
  const table = useReactTable({ data: factures, columns, state: { sorting, globalFilter: filter }, onSortingChange: setSorting, onGlobalFilterChange: setFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <><section className="content-panel transactions-panel"><div className="section-heading"><div><h2>Factures récentes</h2><p className="panel-description">Tri, recherche et pagination des factures Supabase.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Tous les statuts</option>{Object.entries(LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="table-scroll"><table className="data-table"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}><button className="link-button" type="button" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())} {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}</button></th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div><div className="table-pagination"><button className="btn-secondary" type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</button><span>Page {table.getState().pagination.pageIndex + 1}</span><button className="btn-secondary" type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</button></div></section>{preview && <div className="modal-backdrop" role="presentation" onClick={() => setPreview(null)}><div className="pdf-modal" role="dialog" aria-modal="true" aria-label={`Aperçu de la facture ${preview.numero}`} onClick={(event) => event.stopPropagation()}><div className="section-heading"><h2>Aperçu PDF · {preview.numero}</h2><button className="btn-secondary" type="button" onClick={() => setPreview(null)}>Fermer</button></div><PDFViewer width="100%" height="620"><FacturePDF facture={preview} /></PDFViewer></div></div>}</>;
}
