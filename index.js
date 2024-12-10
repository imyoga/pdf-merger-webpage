let pdfFiles = [];
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const uploadButton = document.getElementById('uploadButton');
const pdfList = document.getElementById('pdfList');
const mergeButton = document.getElementById('mergeButton');
const sortAscButton = document.getElementById('sortAsc');
const sortDescButton = document.getElementById('sortDesc');
const addMoreButton = document.getElementById('addMore');
const resetAllButton = document.getElementById('resetAll');

// Initialize Sortable
new Sortable(pdfList, {
    animation: 150,
    ghostClass: 'dragging',
    onEnd: updateRowNumbers
});

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    handleFiles(files);
});

// File input handlers
uploadButton.addEventListener('click', () => pdfInput.click());
addMoreButton.addEventListener('click', () => pdfInput.click());

pdfInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    pdfInput.value = ''; // Reset input
});

// Sort handlers
sortAscButton.addEventListener('click', () => sortFiles('asc'));
sortDescButton.addEventListener('click', () => sortFiles('desc'));

// Reset handler
resetAllButton.addEventListener('click', () => {
    pdfFiles = [];
    pdfList.innerHTML = '';
    updateMergeButton();
    updateRowNumbers();
});

function handleFiles(files) {
    files.forEach(file => {
        if (file.type === 'application/pdf') {
            pdfFiles.push(file);
            addFileToList(file);
        }
    });
    updateMergeButton();
}

function addFileToList(file) {
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="file-info">
            <span class="file-number"></span>
            <i class="fas fa-file-pdf"></i>
            <span class="file-name">${file.name}</span>
        </div>
        <div class="file-actions">
            <button class="remove-file" onclick="removeFile(this)" data-filename="${file.name}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    pdfList.appendChild(li);
    updateRowNumbers();
}

function removeFile(button) {
    const filename = button.getAttribute('data-filename');
    pdfFiles = pdfFiles.filter(file => file.name !== filename);
    button.closest('li').remove();
    updateRowNumbers();
    updateMergeButton();
}

function sortFiles(direction) {
    const items = Array.from(pdfList.children);
    items.sort((a, b) => {
        const aText = a.querySelector('.file-name').textContent;
        const bText = b.querySelector('.file-name').textContent;
        return direction === 'asc' ? 
            aText.localeCompare(bText) : 
            bText.localeCompare(aText);
    });
    
    // Update DOM
    items.forEach(item => pdfList.appendChild(item));
    
    // Update pdfFiles array to match new order
    pdfFiles = items.map(item => {
        const filename = item.querySelector('.file-name').textContent;
        return pdfFiles.find(file => file.name === filename);
    });
    
    updateRowNumbers();
}

function updateRowNumbers() {
    const items = Array.from(pdfList.children);
    items.forEach((item, index) => {
        const numberSpan = item.querySelector('.file-number');
        numberSpan.textContent = `${index + 1}.`;
    });
}

mergeButton.addEventListener('click', async () => {
    try {
        mergeButton.disabled = true;
        mergeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';
        
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (const file of pdfFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedPdfFile = await mergedPdf.save();
        download(mergedPdfFile, "merged.pdf", "application/pdf");
        
        mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
        mergeButton.disabled = false;
    } catch (error) {
        console.error('Error merging PDFs:', error);
        mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
        mergeButton.disabled = false;
        alert('Error merging PDFs. Please try again.');
    }
});

function updateMergeButton() {
    mergeButton.disabled = pdfFiles.length < 2;
}
