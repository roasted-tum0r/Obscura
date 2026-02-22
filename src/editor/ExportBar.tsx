import React from 'react';
import { Download, FileType, FileIcon, Baseline } from 'lucide-react';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Editor } from '@tiptap/react';

interface ExportBarProps {
    onTriggerExport: (type: 'docx' | 'txt' | 'pdf') => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
    onTriggerExport
}) => {
    return (
        <div className="export-bar">
            {/* -- Label for the export group -- */}
            <div className="export-group-label">
                <Download size={14} />
                <span style={{ fontSize: '8px', fontWeight: 700 }}>EXPORT</span>
            </div>

            {/* -- Export Actions -- */}
            <button
                className="export-btn"
                onClick={() => onTriggerExport('docx')}
                title="Export as DOCX"
            >
                <FileType size={16} />
            </button>
            <button
                className="export-btn"
                onClick={() => onTriggerExport('pdf')}
                title="Export as PDF"
            >
                <FileIcon size={16} />
            </button>
            <button
                className="export-btn"
                onClick={() => onTriggerExport('txt')}
                title="Export as TXT"
            >
                <Baseline size={16} />
            </button>
        </div>
    );
};

// Utility function to perform actual export, can be used by MainEditor or ExportBar
export const performExportAction = async (
    editor: Editor | null,
    filename: string,
    type: 'docx' | 'txt' | 'pdf'
) => {
    if (!editor) {
        console.error("[Export] Editor instance not found");
        return;
    }

    console.log(`[Export] Starting ${type} export...`);
    const html = editor.getHTML();
    const text = editor.getText();
    const date = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${date}`;

    if (type === 'txt') {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${finalFilename}.txt`);
    } else if (type === 'docx') {
        const docxBlob = await asBlob(html, {
            orientation: 'portrait',
            margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        });
        saveAs(docxBlob as Blob, `${finalFilename}.docx`);
    } else if (type === 'pdf') {
        const element = document.querySelector('.ProseMirror');
        if (element) {
            try {
                const canvas = await html2canvas(element as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#000000'
                });

                const imgData = canvas.toDataURL('image/png');
                if (!imgData || imgData === 'data:,') {
                    throw new Error("Generated image data is empty or invalid");
                }

                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${finalFilename}.pdf`);
            } catch (error) {
                console.error("[Export] PDF generation failed:", error);
            }
        }
    }
};
