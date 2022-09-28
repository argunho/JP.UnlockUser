import React, { useEffect } from 'react';
// import { Button } from '@mui/material';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'
import Table from './Table';

export default function PDFConverter({ name, subTitle, names, list, savedPdf }) {
    const regex = /(<([^>]+)>)/ig;

    useEffect(() => {
        saveApply();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const saveApply = () => {
        // const doc = new jsPDF('l', 'mm', [800, 801]);        
        const doc = new jsPDF('p', 'pt', 'a4');
        doc.setFontSize(20);
        doc.text(name.replaceAll(regex, ""), 40, 50);
        doc.setFontSize(15);
        doc.text(subTitle, 40, 75);

        doc.autoTable({
            margin: { top: 95 },
            headStyles: { fillColor: [31, 114, 47], cellPadding: 12 },
            bodyStyles: { cellPadding: 11 },
            columnStyles: { 2: { textColor: [208, 66, 66] } },
            html: "#list"
        });

        const output = doc.output('blob');
        savedPdf(output);
        doc.save(name.replaceAll(regex, "") + ".pdf");

        //     // Convert HTML to PDF in JavaScript
        //     const pdfContent = document.querySelector('#content');
        //     doc.html(pdfContent, {
        //         callback: function (pdf) {
        //             pdf.save(name + " " + subTitle + ".pdf");
        //         },
        //         x: 10,
        //         y: 10
        // });


        // const ps = doc.internal.pageSize;
        // const pageHeight = ps.height;
        // const pageWidth = ps.width;
        // doc.setFont("Times-Roman");
        // doc.setFontSize(20);
        // doc.text(name, 15, 50); 
        // doc.setFontSize(10)
        // doc.setTextColor(12, 130, 51);
        // doc.text(subTitle, pageWidth - 80, 10);

        // let position = 90;
        // for (let i = 0; i < content.length; i++) {
        //     doc.setFontSize(12);
        //     doc.setTextColor(0);
        //     doc.text(content[i].displayName, 25, position);
        //     if (position > pageHeight) {
        //         doc.addPage();
        //         position = 15;
        //     }
        //     doc.setFontSize(9);
        //     doc.setTextColor(53, 53, 53);

        //     doc.text(content[i].password, 35, position + 5)
        //     if (position > pageHeight) {
        //         doc.addPage();
        //         position = 15;
        //     }
        //     position += 40;
        // }
    }

    return ( <Table names={names}
            list={list} 
            cls={" hidden-content"} /> )
}