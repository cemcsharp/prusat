'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#E2E8F0',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 10,
        textTransform: 'uppercase',
        backgroundColor: '#F8FAFC',
        padding: 6,
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '50%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#F8FAFC',
        padding: 6,
    },
    tableCol: {
        width: '50%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 6,
    },
    cellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
    },
    cell: {
        fontSize: 9,
        color: '#64748B',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
    }
});

interface AnalyticsData {
    spendingTrend: any[];
    birimDistribution: any[];
    savingsPerformance: any[];
}

export const AnalyticsReportDocument = ({ data }: { data: AnalyticsData }) => {
    const today = new Date().toLocaleDateString('tr-TR');

    return (
        <Document title="Veri Analitik Raporu">
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Veri Analitiği ve Performans Raporu</Text>
                    <Text style={styles.subtitle}>Sistem Analiz Çıktısı - {today}</Text>
                </View>

                {/* Spending Trend Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Harcama Trendi (Son 12 Ay)</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>Dönem (Ay)</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>Toplam Harcama (TL)</Text></View>
                        </View>
                        {data.spendingTrend.map((item, i) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.tableCol}><Text style={styles.cell}>{item.name}</Text></View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.cell}>
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.toplam)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Unit Distribution Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Birim Bazlı İşlem Yoğunluğu</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>Birim Adı</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>İşlem Adedi</Text></View>
                        </View>
                        {data.birimDistribution.map((item, i) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.tableCol}><Text style={styles.cell}>{item.name}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.cell}>{item.value} Operasyon</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Savings Performance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Pazarlık Başarısı ve Tasarruf Analizi</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>RFQ / İhale No</Text></View>
                            <View style={styles.tableColHeader}><Text style={styles.cellHeader}>Tasarruf Oranı (%)</Text></View>
                        </View>
                        {data.savingsPerformance.map((item, i) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.tableCol}><Text style={styles.cell}>{item.name}</Text></View>
                                <View style={styles.tableCol}><Text style={styles.cell}>%{item.oran} Tasarruf</Text></View>
                            </View>
                        ))}
                    </View>
                    {data.savingsPerformance.length === 0 && (
                        <Text style={[styles.cell, { marginTop: 10, fontStyle: 'italic' }]}>
                            Henüz tamamlanmış ihale verisi bulunmamaktadır.
                        </Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>PRU - Satınalma Platformu Veri Analitiği</Text>
                    <Text style={styles.footerText}>Sayfa 1 / 1</Text>
                </View>
            </Page>
        </Document>
    );
};
