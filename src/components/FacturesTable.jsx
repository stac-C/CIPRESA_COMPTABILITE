import React from "react";

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  EMISE: "Émise",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
};

export default function FacturesTable({ factures }) {
  if (!factures.length) {
    return <p className="empty">Aucune facture pour le moment.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Date</th>
          <th>Montant TTC</th>
          <th>Reste à payer</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {factures.map((f) => (
          <tr key={f.id}>
            <td>{f.numero}</td>
            <td>{f.date_facture}</td>
            <td>{Number(f.montant_ttc).toLocaleString("fr-FR")} XAF</td>
            <td>{Number(f.reste_a_payer).toLocaleString("fr-FR")} XAF</td>
            <td>
              <span className={`badge badge-${f.statut.toLowerCase()}`}>
                {STATUT_LABELS[f.statut] || f.statut}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
