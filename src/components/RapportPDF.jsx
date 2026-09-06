import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#17212b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { fontSize: 20, fontWeight: "bold", color: "#0e7490" },
  title: { fontSize: 18, fontWeight: "bold" },
  section: { marginBottom: 18 },
  row: { flexDirection: "row", borderBottom: "1 solid #d8e1e8", paddingVertical: 8 },
  cell: { flex: 1 },
  label: { color: "#637381", marginBottom: 4 },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, fontSize: 12, fontWeight: "bold" },
  footer: { marginTop: 36, color: "#637381", fontSize: 9 },
});

export default function RapportPDF({ report }) {
  return (
    <Document title={`Rapport ${report.reference}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View><Text style={styles.brand}>CIPRESA</Text><Text>Gestion comptable et financière</Text></View>
          <View><Text style={styles.title}>RAPPORT FINANCIER</Text><Text>{report.reference}</Text></View>
        </View>
        <View style={styles.section}><Text style={styles.label}>Intitulé</Text><Text>{report.nom}</Text></View>
        <View style={styles.section}><Text style={styles.label}>Période</Text><Text>Du {report.date_debut} au {report.date_fin}</Text></View>
        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.cell}>Indicateur</Text><Text style={styles.cell}>Montant</Text></View>
          <View style={styles.row}><Text style={styles.cell}>Solde initial</Text><Text style={styles.cell}>{Number(report.solde_initial || 0).toLocaleString("fr-FR")} XAF</Text></View>
          <View style={styles.row}><Text style={styles.cell}>Total des entrées</Text><Text style={styles.cell}>{Number(report.total_entrees || 0).toLocaleString("fr-FR")} XAF</Text></View>
          <View style={styles.row}><Text style={styles.cell}>Total des sorties</Text><Text style={styles.cell}>{Number(report.total_sorties || 0).toLocaleString("fr-FR")} XAF</Text></View>
        </View>
        <View style={styles.total}><Text>Solde final : {Number(report.solde_final || 0).toLocaleString("fr-FR")} XAF</Text></View>
        <Text style={styles.footer}>Document généré par la plateforme CIPRESA.</Text>
      </Page>
    </Document>
  );
}
