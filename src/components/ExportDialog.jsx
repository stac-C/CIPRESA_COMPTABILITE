import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileSpreadsheet, FileText, X } from "lucide-react";

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[\";\n\r]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv(title, columns, rows, filename) {
  const lines = [
    [title],
    [],
    columns.map((column) => escapeCsv(column.label)).join(";"),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column.key])).join(";")),
  ];
  downloadBlob(`\ufeff${lines.join("\r\n")}`, `${filename}.csv`, "text/csv;charset=utf-8");
}

function exportExcel(title, columns, rows, filename) {
  const header = columns.map((column) => `<th>${column.label}</th>`).join("");
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${String(row[column.key] ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`).join("");
  const documentHtml = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#17212b}h1{font-size:18px}table{border-collapse:collapse;width:100%}th{background:#164b36;color:#fff;text-align:left}th,td{border:1px solid #cbd5d1;padding:7px}tr:nth-child(even){background:#f2f7f4}</style></head><body><h1>${title}</h1><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(`\ufeff${documentHtml}`, `${filename}.xls`, "application/vnd.ms-excel;charset=utf-8");
}

export default function ExportDialog({ title, columns, rows, onClose }) {
  const [format, setFormat] = useState("xlsx");
  const [filename, setFilename] = useState("export-cipresa");
  const [selectedKeys, setSelectedKeys] = useState(columns.map((column) => column.key));

  useEffect(() => {
    function closeOnEscape(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function toggleColumn(key) {
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function exportDocument(event) {
    event.preventDefault();
    const selectedColumns = columns.filter((column) => selectedKeys.includes(column.key));
    if (!selectedColumns.length || !filename.trim()) return;
    const safeFilename = filename.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "export-cipresa";
    if (format === "csv") exportCsv(title, selectedColumns, rows, safeFilename);
    else exportExcel(title, selectedColumns, rows, safeFilename);
    onClose();
  }

  return createPortal(<div className="modal-backdrop export-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" onSubmit={exportDocument}><div className="export-dialog-header"><div><p className="section-kicker">Export personnalisé</p><h2 id="export-title">{title}</h2><p className="panel-description">Choisissez le format et les colonnes à inclure.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer"><X size={17} /></button></div><fieldset className="export-format-options"><legend>Format du fichier</legend><label className={format === "csv" ? "export-format active" : "export-format"}><input type="radio" name="format" value="csv" checked={format === "csv"} onChange={(event) => setFormat(event.target.value)} /><FileText size={18} /><span><strong>CSV</strong><small>Compatible avec les tableurs et outils de données</small></span></label><label className={format === "xlsx" ? "export-format active" : "export-format"}><input type="radio" name="format" value="xlsx" checked={format === "xlsx"} onChange={(event) => setFormat(event.target.value)} /><FileSpreadsheet size={18} /><span><strong>Excel</strong><small>Tableau mis en forme pour une lecture immédiate</small></span></label></fieldset><label className="export-filename">Nom du fichier<input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="export-cipresa" /></label><fieldset className="export-columns"><legend>Colonnes à exporter</legend><div>{columns.map((column) => <label key={column.key}><input type="checkbox" checked={selectedKeys.includes(column.key)} onChange={() => toggleColumn(column.key)} />{column.label}</label>)}</div></fieldset><div className="export-dialog-actions"><button className="btn-secondary" type="button" onClick={onClose}>Annuler</button><button className="primary-button" type="submit" disabled={!selectedKeys.length || !filename.trim()}><Download size={15} /> Télécharger</button></div></form></div>, document.body);
}
