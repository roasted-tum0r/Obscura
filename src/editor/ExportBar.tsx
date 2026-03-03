import React from 'react';
import { Download,  } from 'lucide-react';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import { jsPDF } from 'jspdf';
import type { Editor } from '@tiptap/react';
interface ExportOptions {
    type: string;
    icon: React.ReactNode;
    label: string;
    placeholder?: boolean;
}
interface ExportBarProps {
    onTriggerExport: (type: 'docx' | 'txt' | 'pdf') => void;
    items: ExportOptions[]
}

export const ExportBar: React.FC<ExportBarProps> = ({
    onTriggerExport,
    items
}) => {
    const radius = 80;

    

    return (
        <div className="export-radial-container">
            {/* -- Central Trigger -- */}
            <div className="export-trigger">
                <Download size={20} />
                <span style={{ fontSize: '7px', fontWeight: 800, marginTop: '2px' }}>EXPORT</span>
            </div>

            {/* -- Orbiting Actions -- */}
            {items.map((item, index) => {
                const angle = 120 + (index * (240 - 120) / (items.length - 1));
                const rad = angle * (Math.PI / 180);
                const tx = Math.cos(rad) * radius;
                const ty = Math.sin(rad) * radius;

                return (
                    <button
                        key={item.label}
                        className={`radial-item ${item.placeholder ? 'coming-soon' : ''}`}
                        style={{
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            transitionDelay: `${index * 0.05}s`
                        } as any}
                        onClick={() => !item.placeholder && onTriggerExport(item.type as any)}
                        title={item.placeholder ? `${item.label} (Coming Soon)` : `Export as ${item.label}`}
                    >
                        {item.icon}
                        <div className="radial-tooltip">{item.placeholder ? 'COMING SOON' : item.label}</div>
                    </button>
                );
            })}
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
                const pdf = new jsPDF('p', 'mm', 'a4');
                const margin = 20;
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const contentWidth = pdfWidth - (2 * margin);
                let cursorY = margin;

                // Set initial font to Times New Roman
                pdf.setFont("times", "normal");

                // Process the document nodes
                const nodes = Array.from(element.children);

                nodes.forEach((node) => {
                    const tag = node.tagName.toLowerCase();
                    const text = (node as HTMLElement).innerText;

                    if (!text.trim() && tag !== 'hr') return;

                    let fontSize = 11;
                    let fontStyle = "normal";
                    let spacing = 7;

                    if (tag === 'h1') {
                        fontSize = 22;
                        fontStyle = "bold";
                        spacing = 10;
                    } else if (tag === 'h2') {
                        fontSize = 16;
                        fontStyle = "bold";
                        spacing = 8;
                    } else if (tag === 'blockquote') {
                        fontStyle = "italic";
                        fontSize = 11;
                    }

                    pdf.setFont("times", fontStyle);
                    pdf.setFontSize(fontSize);

                    // Wrap text
                    const lines = pdf.splitTextToSize(text, contentWidth);

                    // Check for page break
                    const totalLineHeight = lines.length * (fontSize * 0.4);
                    if (cursorY + totalLineHeight + spacing > pdf.internal.pageSize.getHeight() - margin) {
                        pdf.addPage();
                        cursorY = margin;
                    }

                    // Render lines
                    lines.forEach((line: string) => {
                        pdf.text(line, margin, cursorY);
                        cursorY += (fontSize * 0.4);
                    });

                    cursorY += 4; // Paragraph gap
                });

                pdf.save(`${finalFilename}.pdf`);
            } catch (error) {
                console.error("[Export] PDF generation failed:", error);
            }
        }
    }
};
