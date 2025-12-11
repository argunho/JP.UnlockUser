// Installed
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function PDFConverter(name, subName) {
    const regex = /(<([^>]+)>)/ig;

    // const doc = new jsPDF('l', 'mm', [800, 801]);        
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(20);
    doc.text(name.replaceAll(regex, ""), 40, 50);

    doc.setFontSize(15);
    doc.text(subName, 40, 75);

    const tableContent = document.getElementById("list");

    if (!tableContent) {
        console.error("Table with id #list not found.");
        return;
    }

    autoTable(doc, {
        html: tableContent,
        margin: { top: 95 },
        headStyles: { fillColor: [31, 114, 47], cellPadding: 12 },
        bodyStyles: { cellPadding: 11 },
        columnStyles: { 2: { textColor: [208, 66, 66] } }
    });

    // doc.save(name.replaceAll(regex, "") + ".pdf");
    const output = doc.output('blob');
    return output;
}