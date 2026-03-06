'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Font kaydı (Türkçe karakter desteği için Arial kullanıyoruz)
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
    header: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 4,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 8,
        color: '#94A3B8',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: 6,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    statCard: {
        width: '31%', // 3 columns
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
        border: '1px solid #E2E8F0',
    },
    statLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
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
        color: '#475569',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1px solid #E2E8F0',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 7,
        color: '#94A3B8',
        letterSpacing: 0.2,
    }
});

interface ReportData {
    summary: { Metrik: string, Değer: any }[];
    recentRequests: any[];
    activeOrders: any[];
}

export const ReportDocument = ({ data }: { data: ReportData }) => {
    const today = new Date().toLocaleDateString('tr-TR');

    return (
        <Document title="Yönetici-Performans-Raporu">
            <Page size="A4" style={styles.page}>
                {/* Modern Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Kurumsal Performans Özeti</Text>
                        <Text style={styles.subtitle}>Yönetici Raporu | Stratejik Analiz</Text>
                    </View>
                    <Text style={[styles.subtitle, { color: '#FFFFFF', fontSize: 10 }]}>{today}</Text>
                </View>

                {/* Summary Metrics */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Kritik Başarı Metrikleri</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        {data.summary.map((stat, i) => (
                            <View key={i} style={styles.statCard}>
                                <Text style={styles.statLabel}>{stat.Metrik}</Text>
                                <Text style={styles.statValue}>
                                    {typeof stat.Değer === 'number' && stat.Metrik.includes('Borç')
                                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stat.Değer)
                                        : stat.Değer}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Requests Table */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Operasyonel Talep Akışı (Son Kayıtlar)</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { width: '20%' }]}>Referans</Text>
                        <Text style={[styles.tableHeaderText, { width: '45%' }]}>Konu</Text>
                        <Text style={[styles.tableHeaderText, { width: '20%' }]}>Birim</Text>
                        <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>Tarih</Text>
                    </View>
                    {data.recentRequests.map((req, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{req.Referans}</Text>
                            <Text style={[styles.tableCell, { width: '45%' }]}>{req.Konu}</Text>
                            <Text style={[styles.tableCell, { width: '20%' }]}>{req.Birim}</Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{req.Tarih}</Text>
                        </View>
                    ))}
                </View>

                {/* Active Orders Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Aktif Tedarik Emirleri</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { width: '20%' }]}>Barkod</Text>
                        <Text style={[styles.tableHeaderText, { width: '40%' }]}>Tedarikçi</Text>
                        <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'center' }]}>Tutar</Text>
                        <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>Durum</Text>
                    </View>
                    {data.activeOrders.map((order, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{order.Barkod}</Text>
                            <Text style={[styles.tableCell, { width: '40%' }]}>{order.Tedarikçi}</Text>
                            <Text style={[styles.tableCell, { width: '25%', textAlign: 'center', fontWeight: 'bold' }]}>
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.Tutar)}
                            </Text>
                            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{order.Durum}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>PRU Satınalma Platformu | Dijital Raporlama Servisi</Text>
                    <Text style={[styles.footerText, { fontWeight: 'bold' }]}>SAYFA 1 / 1</Text>
                </View>
            </Page>
        </Document>
    );
};
