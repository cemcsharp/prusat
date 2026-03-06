'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register Arial for Turkish support (matches existing OrderPdfTemplate)
Font.register({
    family: 'Arial',
    fonts: [
        { src: '/fonts/Arial-Regular.ttf' },
        { src: '/fonts/Arial-Bold.ttf', fontWeight: 'bold' }
    ]
})

const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Arial' },
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #1E293B', paddingBottom: 20, marginBottom: 20 },
    logoSection: { flexDirection: 'column' },
    companyName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', letterSpacing: 1 },
    companySub: { fontSize: 7, color: '#64748B', marginTop: 2 },
    docTitleSection: { textAlign: 'right' },
    docTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    docNo: { fontSize: 9, color: '#64748B', marginTop: 4 },
    infoGrid: { flexDirection: 'row', marginBottom: 20, gap: 15 },
    infoCol: { flex: 1, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4, border: '1px solid #E2E8F0' },
    label: { fontSize: 7, color: '#94A3B8', marginBottom: 3, fontWeight: 'bold' },
    value: { fontSize: 9, color: '#334155', fontWeight: 'bold' },
    sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textTransform: 'uppercase', borderLeft: '3px solid #1E293B', paddingLeft: 6 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 6, borderRadius: 2 },
    tableHeaderText: { fontSize: 8, color: '#FFFFFF', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #E2E8F0', padding: 6 },
    tableCell: { fontSize: 8, color: '#334155' },
    matrixContainer: { marginTop: 20 },
    matrixHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderBottom: '1px solid #E2E8F0' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #E2E8F0', paddingTop: 10, textAlign: 'center' },
    footerText: { fontSize: 7, color: '#94A3B8' }
})

interface RfqListPdfProps {
    rfqs: any[]
}

export const RfqListPdfTemplate = ({ rfqs }: RfqListPdfProps) => {
    return (
        <Document title="RFQ-Listesi">
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Text style={styles.companyName}>PRU - SATINALMA PLATFORMU</Text>
                        <Text style={styles.companySub}>KURUMSAL TEDARİK ZİNCİRİ YÖNETİMİ</Text>
                    </View>
                    <View style={styles.docTitleSection}>
                        <Text style={styles.docTitle}>TEKLİF İSTEMLERİ (RFQ) LİSTESİ</Text>
                        <Text style={styles.docNo}>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</Text>
                    </View>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>RFQ No</Text>
                    <Text style={[styles.tableHeaderText, { flex: 3 }]}>Başlık</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Kategori</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Oluşturan</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Durum</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Son Tarih</Text>
                </View>
                {rfqs.map((rfq: any, i: number) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{rfq.rfqNo}</Text>
                        <Text style={[styles.tableCell, { flex: 3 }]}>{rfq.baslik}</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{rfq.kategori?.ad || '-'}</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{rfq.olusturan?.adSoyad}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{rfq.durum}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                            {new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}
                        </Text>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Bu döküman PRU - Satınalma Platformu sistemi üzerinden otomatik olarak üretilmiştir.</Text>
                    <Text style={[styles.footerText, { marginTop: 2 }]}>Sayfa 1 / 1</Text>
                </View>
            </Page>
        </Document>
    )
}
