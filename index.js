const pdfInput = document.getElementById('pdfInput');
const uploadButton = document.getElementById('uploadButton');
const pdfList = document.getElementById('pdfList');
const mergeButton = document.getElementById('mergeButton');

let pdfs = [];

uploadButton.addEventListener('click', () => pdfInput.click());

pdfInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (pdfs.length + files.length > 15) {
        alert('You can only upload up to 15 PDFs');
        return;
    }
    
    files.forEach(file => {
        pdfs.push(file);
        addPdfToList(file);
    });
    
    updateMergeButton();
});

function addPdfToList(file) {
    const li = document.createElement('li');
    li.innerHTML = `
        ${file.name}
        <div class="move-buttons">
            <button class="move-up">↑</button>
            <button class="move-down">↓</button>
            <button class="remove">×</button>
        </div>
    `;
    
    li.querySelector('.move-up').addEventListener('click', () => movePdf(li, -1));
    li.querySelector('.move-down').addEventListener('click', () => movePdf(li, 1));
    li.querySelector('.remove').addEventListener('click', () => removePdf(li));
    
    pdfList.appendChild(li);
}

function movePdf(li, direction) {
    const index = Array.from(pdfList.children).indexOf(li);
    if ((direction === -1 && index > 0) || (direction === 1 && index < pdfs.length - 1)) {
        const newIndex = index + direction;
        [pdfs[index], pdfs[newIndex]] = [pdfs[newIndex], pdfs[index]];
        if (direction === -1) {
            pdfList.insertBefore(li, li.previousElementSibling);
        } else {
            pdfList.insertBefore(li.nextElementSibling, li);
        }
    }
}

function removePdf(li) {
    const index = Array.from(pdfList.children).indexOf(li);
    pdfs.splice(index, 1);
    li.remove();
    updateMergeButton();
}

function updateMergeButton() {
    mergeButton.disabled = pdfs.length < 2;
}

mergeButton.addEventListener('click', async () => {
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    for (const pdfFile of pdfs) {
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    download(pdfBytes, "merged.pdf", "application/pdf");
});
