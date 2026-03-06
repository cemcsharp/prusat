'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register Arial for Turkish support
Font.register({
    family: 'Arial',
    fonts: [
        { src: '/fonts/Arial-Regular.ttf' },
        { src: '/fonts/Arial-Bold.ttf', fontWeight: 'bold' }
    ]
})

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Arial',
        fontSize: 10,
        color: '#334155',
    },
    headerBlock: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    headerInfo: {
        textAlign: 'right',
    },
    docTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    headerSubText: {
        fontSize: 8,
        color: '#94A3B8',
        marginTop: 2,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    infoCol: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
        border: '1px solid #E2E8F0',
    },
    label: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 4,
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: 2,
    },
    value: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        borderLeft: '4px solid #1E293B',
        paddingLeft: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        padding: 8,
        borderRadius: 2,
    },
    tableHeaderText: {
        fontSize: 8,
        color: '#FFFFFF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #F1F5F9',
        padding: 8,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 8,
        color: '#334155',
    },
    recommendationBox: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#EEF2FF',
        borderRadius: 4,
        border: '1px solid #C7D2FE',
    },
    recommendationText: {
        fontSize: 8,
        color: '#4F46E5',
        fontWeight: 'bold',
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1px solid #E2E8F0',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 7,
        color: '#94A3B8',
    }
})

interface RfqPdfProps {
    rfq: any
    scores: any[]
}

export const RfqPdfTemplate = ({ rfq, scores }: RfqPdfProps) => {
    const bestOffer = scores.length > 0 ? scores[0] : null

    return (
        <Document title={`RFQ-${rfq.rfqNo}`}>
            <Page size="A4" style={styles.page}>
                {/* Standard Corporate Header */}
                <View style={styles.headerBlock}>
                    <View>
                        <Text style={styles.logoText}>PRU SATINALMA</Text>
                        <Text style={styles.headerSubText}>TEKLİF TOPLAMA & ANALİZ SİSTEMİ</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.docTitle}>TEKLİF İSTEM FORMU (RFQ)</Text>
                        <Text style={styles.headerSubText}>Döküman No: {rfq.rfqNo}</Text>
                        <Text style={styles.headerSubText}>Tarih: {new Date(rfq.olusturmaTarihi).toLocaleDateString('tr-TR')}</Text>
                    </View>
                </View>

                {/* RFQ Context Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>PROJE / BAŞLIK</Text>
                        <Text style={styles.value}>{rfq.baslik}</Text>
                        <Text style={[styles.label, { marginTop: 8 }]}>KATEGORİ</Text>
                        <Text style={styles.value}>{rfq.kategori?.ad || 'GENEL SATINALMA'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>SÜREÇ YÖNETİCİSİ</Text>
                        <Text style={styles.value}>{rfq.olusturan?.adSoyad}</Text>
                        <Text style={[styles.label, { marginTop: 8 }]}>SON TEKLİF TARİHİ</Text>
                        <Text style={styles.value}>{new Date(rfq.sonTeklifTarihi).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>OPERASYON DURUMU</Text>
                        <Text style={[styles.value, { color: rfq.durum === 'TAMAMLANDI' ? '#059669' : '#2563EB' }]}>
                            {rfq.durum}
                        </Text>
                        <Text style={[styles.label, { marginTop: 8 }]}>TUR / REVİZYON</Text>
                        <Text style={styles.value}>Mevcut: {rfq.mevcutTur} / Max: {rfq.maksimumTur}</Text>
                    </View>
                </View>

                {/* Scope Table */}
                <Text style={styles.sectionTitle}>Talep Edilen Kapsam ve Teknik Detaylar</Text>
                <View style={[styles.tableHeader, { backgroundColor: '#1E293B' }]}>
                    <Text style={[styles.tableHeaderText, { flex: 4 }]}>Malzeme / Hizmet Tanımı</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Miktar</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Birim</Text>
                </View>
                {rfq.kalemler.map((k: any, i: number) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? { backgroundColor: '#F8FAFC' } : {}]}>
                        <View style={{ flex: 4 }}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{k.talepKalem.aciklama}</Text>
                            <Text style={{ fontSize: 6, color: '#64748B', marginTop: 2 }}>{k.talepKalem.detay || 'Teknik spesifikasyon eklenmemiş.'}</Text>
                        </View>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{k.miktar || k.talepKalem.miktar}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{k.talepKalem.birim}</Text>
                    </View>
                ))}

                {/* Analysis Matrix */}
                {rfq.teklifler && rfq.teklifler.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={styles.sectionTitle}>Teklif Karşılaştırma ve Skorlama Matrisi</Text>
                        <View style={[styles.tableHeader, { backgroundColor: '#334155' }]}>
                            <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Tedarikçi Adı</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Teklif Tutarı</Text>
                            <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center' }]}>Skor</Text>
                        </View>
                        {scores.slice(0, 5).map((s: any, i: number) => {
                            const teklif = rfq.teklifler.find((t: any) => t.id === s.teklifId)
                            if (!teklif) return null;
                            return (
                                <View key={i} style={[
                                    styles.tableRow,
                                    i === 0 ? { backgroundColor: '#ECFDF5', borderLeft: '3px solid #059669' } : {},
                                    i > 0 && i % 2 === 1 ? { backgroundColor: '#F8FAFC' } : {}
                                ]}>
                                    <View style={{ flex: 2.5 }}>
                                        <Text style={[styles.tableCell, { fontWeight: i === 0 ? 'bold' : 'normal' }]}>
                                            {teklif.tedarikci.ad} {i === 0 ? ' (En İyi)' : ''}
                                        </Text>
                                        <Text style={{ fontSize: 6, color: '#64748B', marginTop: 2 }}>
                                            Vade: {teklif.vadeGun || 0} Gün | Teslimat: {teklif.teslimSuresi || 0} Gün
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1.5, textAlign: 'right' }}>
                                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                                            {Number(teklif.toplamTutar).toLocaleString('tr-TR')} {teklif.paraBirimi}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 0.8, alignItems: 'center' }}>
                                        <Text style={[styles.tableCell, {
                                            fontWeight: 'bold',
                                            color: i === 0 ? '#059669' : '#1E293B'
                                        }]}>
                                            %{Math.round(s.score)}
                                        </Text>
                                    </View>
                                </View>
                            )
                        })}

                        {/* Smart Recommendation Highlight */}
                        {bestOffer && (
                            <View style={[styles.recommendationBox, { borderLeft: '4px solid #4F46E5' }]}>
                                <Text style={[styles.recommendationText, { fontSize: 7, textTransform: 'uppercase', marginBottom: 2 }]}>
                                    Sistem Analiz Raporu ve Tavsiyesi
                                </Text>
                                <Text style={styles.recommendationText}>
                                    {bestOffer.reason || 'Mevcut veriler ışığında en optimize teklif yukarıda vurgulanmıştır.'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Doc Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Bu döküman PRU Satınalma Karar Destek Mekanizması tarafından otomatik olarak oluşturulmuştur.
                    </Text>
                    <Text style={[styles.footerText, { marginTop: 4, fontWeight: 'bold' }]}>SAYFA 1 / 1</Text>
                </View>
            </Page>
        </Document>
    )
}
