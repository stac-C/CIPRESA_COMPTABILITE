import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#17212b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { fontSize: 20, fontWeight: "bold", color: "#0e7490" },
  title: { fontSize: 18, fontWeight: "bold" },
  section: { marginBottom: 18 },
  row: { flexDirection: "row", borderBottom: "1 solid #d8e1e8", paddingVertical: 7 },
  cell: { flex: 1 },
  label: { color: "#637381", marginBottom: 3 },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, fontSize: 12, fontWeight: "bold" },
  footer: { marginTop: 36, color: "#637381", fontSize: 9 },
});

export default function FacturePDF({ facture, lignes = [] }) {
  return (
    <Document title={`Facture ${facture.numero}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View><Text style={styles.brand}>CIPRESA</Text><Text>Gestion comptable et financière</Text></View>
          <View><Text style={styles.title}>FACTURE</Text><Text>{facture.numero}</Text><Text>{facture.date_facture}</Text></View>
        </View>
        <View style={styles.section}><Text style={styles.label}>Client</Text><Text>{facture.client_nom || facture.client_id || "Client non renseigné"}</Text></View>
        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.cell}>Désignation</Text><Text style={styles.cell}>Quantité</Text><Text style={styles.cell}>Prix unitaire</Text><Text style={styles.cell}>Total</Text></View>
          {lignes.map((ligne) => <View style={styles.row} key={ligne.id}><Text style={styles.cell}>{ligne.designation || ligne.produit_id}</Text><Text style={styles.cell}>{ligne.quantite}</Text><Text style={styles.cell}>{ligne.prix_unitaire} XAF</Text><Text style={styles.cell}>{ligne.total} XAF</Text></View>)}
        </View>
        <View style={styles.total}><Text>Total TTC : {facture.montant_ttc} XAF</Text></View>
        <View style={styles.total}><Text>Reste à payer : {facture.reste_a_payer} XAF</Text></View>
        <Text style={styles.footer}>Merci pour votre confiance. Document généré par la plateforme CIPRESA.</Text>
      </Page>
    </Document>
  );
}
