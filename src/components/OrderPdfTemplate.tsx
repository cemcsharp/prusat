'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register a font that supports Turkish characters with local paths
Font.register({
    family: 'Arial',
    fonts: [
        { src: '/fonts/Arial-Regular.ttf' },
        { src: '/fonts/Arial-Bold.ttf', fontWeight: 'bold' }
    ]
})

// Define a corporate style for the PDF
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
        padding: 25,
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1.5,
    },
    headerInfo: {
        textAlign: 'right',
    },
    docTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    headerSubText: {
        fontSize: 8,
        color: '#94A3B8',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 20,
    },
    gridCol: {
        flex: 1,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
        border: '1px solid #E2E8F0',
    },
    sectionLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        borderBottom: '1px solid #CBD5E1',
        paddingBottom: 2,
    },
    infoText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
    },
    subInfoText: {
        fontSize: 8,
        color: '#64748B',
        marginTop: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        padding: 10,
        borderRadius: 2,
        marginBottom: 2,
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
        padding: 10,
        alignItems: 'center',
    },
    tableRowEven: {
        backgroundColor: '#F8FAFC',
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
    },
    tableCellDesc: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 60,
        paddingHorizontal: 20,
    },
    signatureBox: {
        width: '40%',
        borderTop: '1px solid #CBD5E1',
        paddingTop: 10,
        textAlign: 'center',
    },
    signatureTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    signatureName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 15,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1px dashed #E2E8F0',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 7,
        color: '#94A3B8',
        letterSpacing: 0.3,
    }
})

interface OrderPdfProps {
    order: any
}

export const OrderPdfTemplate = ({ order }: OrderPdfProps) => (
    <Document title={`Siparis-Formu-${order.barkod}`}>
        <Page size="A4" style={styles.page}>
            {/* Standard Header Block */}
            <View style={styles.headerBlock}>
                <View>
                    <Text style={styles.logoText}>PRU SATINALMA</Text>
                    <Text style={[styles.headerSubText, { color: '#94A3B8' }]}>KURUMSAL TEDARİK ÇÖZÜMLERİ</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.docTitle}>SİPARİŞ FORMU</Text>
                    <Text style={styles.headerSubText}>REF: {order.barkod}</Text>
                    <Text style={styles.headerSubText}>TARİH: {new Date(order.tarih).toLocaleDateString('tr-TR')}</Text>
                </View>
            </View>

            {/* Entity Grid */}
            <View style={styles.grid}>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionLabel}>Tedarikçi Bilgileri</Text>
                    <Text style={styles.infoText}>{order.tedarikci?.ad || 'BELİRTİLMEDİ'}</Text>
                    <Text style={styles.subInfoText}>{order.tedarikci?.yetkiliKisi}</Text>
                    <Text style={[styles.subInfoText, { fontSize: 7, marginTop: 4 }]}>{order.tedarikci?.email}</Text>
                    <Text style={[styles.subInfoText, { fontSize: 7 }]}>{order.tedarikci?.telefon}</Text>
                </View>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionLabel}>Sevkiyat / Birim</Text>
                    <Text style={styles.infoText}>{order.birim?.ad || 'GENEL MERKEZ'}</Text>
                    <Text style={styles.subInfoText}>Satınalma Yöntemi: {order.alimYontemi?.ad}</Text>
                    <Text style={[styles.subInfoText, { marginTop: 4 }]}>İlgili Yönetmelik Madde: {order.yonetmelik?.madde}</Text>
                </View>
            </View>

            {/* Purpose Section */}
            <View style={{ marginBottom: 25, padding: 12, backgroundColor: '#F1F5F9', borderRadius: 4 }}>
                <Text style={styles.sectionLabel}>İşin Amacı ve Gerekçesi</Text>
                <Text style={[styles.infoText, { fontWeight: 'normal', lineHeight: 1.4 }]}>
                    {order.talep?.gerekce || 'Bu sipariş, kurumun operasyonel ihtiyaçları doğrultusunda ilgili birim tarafından talep edilmiştir.'}
                </Text>
            </View>

            {/* Items Table */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 4 }]}>Hizmet / Malzeme Tanımı ve Detaylar</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Miktar</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Birim</Text>
            </View>

            {/* Zebra Styled Table Body */}
            <View style={[styles.tableRow, styles.tableRowEven]}>
                <View style={{ flex: 4 }}>
                    <Text style={styles.tableCellDesc}>{order.talep?.konu}</Text>
                    <Text style={[styles.tableCell, { fontSize: 7, color: '#64748B', marginTop: 3 }]}>
                        {order.aciklama || 'Sipariş detayları ve teknik spesifikasyonlar uyarınca.'}
                    </Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>1</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>ADET</Text>
            </View>

            {/* Added Terms and Conditions */}
            <View style={{ marginTop: 30, borderTop: '1px solid #E2E8F0', paddingTop: 15 }}>
                <Text style={styles.sectionLabel}>Sipariş Şartları ve Koşullar</Text>
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontSize: 7, color: '#64748B', lineHeight: 1.5 }}>
                            1. Teslimat, sipariş onayından sonra belirtilen süre içinde yapılmalıdır.
                            2. Fatura, sevkiyat ile birlikte kesilmelidir.
                        </Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 7, color: '#64748B', lineHeight: 1.5 }}>
                            3. Ürünler teknik şartnameye uygun olmalıdır. Uygunsuz ürünler iade edilir.
                            4. Ödeme, muayene ve kabul işlemlerinden sonra yapılacaktır.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Professional Signatures */}
            <View style={styles.signatureContainer}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureTitle}>Satınalma Sorumlusu</Text>
                    <View style={{ height: 40 }} />
                    <Text style={styles.signatureName}>Adı Soyadı</Text>
                    <Text style={[styles.subInfoText, { textAlign: 'center' }]}>İmza / Kaşe</Text>
                </View>
                <View style={[styles.signatureBox, { borderColor: '#1E293B', borderTopWidth: 2 }]}>
                    <Text style={[styles.signatureTitle, { color: '#1E293B' }]}>Onay Makamı</Text>
                    <View style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#059669', fontWeight: 'bold' }}>DİJİTAL ONAYLI</Text>
                    </View>
                    <Text style={styles.signatureName}>Genel Müdürlük</Text>
                    <Text style={[styles.subInfoText, { textAlign: 'center' }]}>{new Date().toLocaleDateString('tr-TR')}</Text>
                </View>
            </View>

            {/* Footer with Doc Info */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Bu döküman güvenli dijital altyapı üzerinden üretilmiştir.
                </Text>
                <Text style={[styles.footerText, { marginTop: 4, fontWeight: 'bold' }]}>
                    SAYFA 1 / 1
                </Text>
            </View>
        </Page>
    </Document>
)
