/**
 * Export Multi-Format
 * Permet d'exporter les synthèses, flashcards et quiz en différents formats
 */

// Export en Markdown
export function exportToMarkdown(data) {
    const { title, content, type } = data;

    let markdown = `# ${title}\n\n`;
    markdown += `**Type:** ${type}\n`;
    markdown += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    markdown += `---\n\n`;
    markdown += content;

    downloadFile(`${title}.md`, markdown, 'text/markdown');
}

// Export en PDF (using jsPDF)
export async function exportToPDF(data) {
    const { title, content } = data;

    // Import jsPDF dynamically
    const jsPDF = await loadJsPDF();
    if (!jsPDF) {
        alert('Impossible de charger le module PDF');
        return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(title, 20, 20);

    // Content
    doc.setFontSize(12);
    const splitContent = doc.splitTextToSize(content, 170);
    doc.text(splitContent, 20, 40);

    doc.save(`${title}.pdf`);
}

// Export Flashcards au format Anki
export function exportToAnki(flashcards) {
    // Format Anki CSV: front, back
    let csv = 'Question;Réponse\n';

    flashcards.forEach(card => {
        const front = card.question.replace(/"/g, '""').replace(/;/g, ',');
        const back = card.answer.replace(/"/g, '""').replace(/;/g, ',');
        csv += `"${front}";"${back}"\n`;
    });

    downloadFile('flashcards_anki.csv', csv, 'text/csv');
}

// Export en JSON
export function exportToJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(`export_${Date.now()}.json`, json, 'application/json');
}

// Export Quiz en JSON formaté
export function exportQuizToJSON(quiz) {
    const formatted = {
        title: quiz.title,
        questions: quiz.questions.map(q => ({
            question: q.question,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ''
        }))
    };

    exportToJSON(formatted);
}

// Helper: Download file
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Load jsPDF dynamically
async function loadJsPDF() {
    try {
        const module = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        return window.jspdf.jsPDF;
    } catch (error) {
        console.error('Failed to load jsPDF:', error);
        return null;
    }
}

// Export widget (à ajouter sur les pages)
export function createExportWidget(data, container) {
    const widget = document.createElement('div');
    widget.className = 'fixed bottom-6 right-6 z-40';

    widget.innerHTML = `
        <div class="relative group">
            <button class="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition flex items-center justify-center">
                <i class="fas fa-download text-xl text-white"></i>
            </button>

            <!-- Export options -->
            <div class="hidden group-hover:block absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden min-w-[200px]">
                <button class="export-option w-full px-4 py-3 text-left text-sm hover:bg-gray-800 transition flex items-center gap-3" data-format="markdown">
                    <i class="fas fa-file-alt text-blue-400"></i>
                    <span>Markdown (.md)</span>
                </button>
                <button class="export-option w-full px-4 py-3 text-left text-sm hover:bg-gray-800 transition flex items-center gap-3" data-format="pdf">
                    <i class="fas fa-file-pdf text-red-400"></i>
                    <span>PDF</span>
                </button>
                <button class="export-option w-full px-4 py-3 text-left text-sm hover:bg-gray-800 transition flex items-center gap-3" data-format="json">
                    <i class="fas fa-code text-green-400"></i>
                    <span>JSON</span>
                </button>
                ${data.type === 'flashcards' ? `
                <button class="export-option w-full px-4 py-3 text-left text-sm hover:bg-gray-800 transition flex items-center gap-3" data-format="anki">
                    <i class="fas fa-brain text-purple-400"></i>
                    <span>Anki (.csv)</span>
                </button>
                ` : ''}
            </div>
        </div>
    `;

    container.appendChild(widget);

    // Event listeners
    widget.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            handleExport(data, format);
        });
    });
}

// Handle export
function handleExport(data, format) {
    switch (format) {
        case 'markdown':
            exportToMarkdown(data);
            break;
        case 'pdf':
            exportToPDF(data);
            break;
        case 'json':
            exportToJSON(data);
            break;
        case 'anki':
            if (data.type === 'flashcards') {
                exportToAnki(data.cards);
            }
            break;
    }

    showExportSuccessMessage(format);
}

// Success message
function showExportSuccessMessage(format) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-6 z-50 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl animate-fade-in-up';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-check-circle text-2xl"></i>
            <div>
                <p class="font-bold">Export réussi!</p>
                <p class="text-sm opacity-90">Fichier ${format.toUpperCase()} téléchargé</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

console.log('✅ Export module loaded');
