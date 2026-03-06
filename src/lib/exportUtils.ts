import * as XLSX from 'xlsx';

/**
 * Verilen JSON verisini Excel dosyası olarak indirir.
 * @param data Excel'e yazılacak veri (Sekme ismi: veri dizisi şeklinde)
 * @param fileName Dosya ismi (uzantısız)
 */
export const exportToExcel = (data: { [sheetName: string]: any[] }, fileName: string) => {
    const workbook = XLSX.utils.book_new();

    Object.entries(data).forEach(([sheetName, sheetData]) => {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
