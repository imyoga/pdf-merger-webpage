document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const pdfInput = document.getElementById('pdfInput');
    const initialUploadButton = document.getElementById('initialUploadButton');
    const additionalUploadButton = document.getElementById('additionalUploadButton');
    const pdfList = document.getElementById('pdfList');
    const mergeButton = document.getElementById('mergeButton');
    const controlsSection = document.getElementById('controlsSection');
    const fileNameInput = document.getElementById('fileNameInput');
    const sortAscButton = document.getElementById('sortAsc');
    const sortDescButton = document.getElementById('sortDesc');
    const addMoreButton = document.getElementById('addMore');
    const resetAllButton = document.getElementById('resetAll');

    let pdfs = [];

    // Initialize Sortable
    new Sortable(pdfList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'dragging',
        onStart: function() {
            document.body.style.cursor = 'grabbing';
        },
        onEnd: function(evt) {
            document.body.style.cursor = 'default';
            // Update the pdfs array to match the new order
            const item = pdfs[evt.oldIndex];
            pdfs.splice(evt.oldIndex, 1);
            pdfs.splice(evt.newIndex, 0, item);
            updatePDFList();
        }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        handleFiles(files);
    });

    // Click to upload handlers
    initialUploadButton.addEventListener('click', () => {
        pdfInput.click();
    });

    additionalUploadButton.addEventListener('click', () => {
        pdfInput.click();
    });

    pdfInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
        pdfInput.value = ''; // Reset input for same file selection
    });

    function getUniqueFileName(fileName) {
        // Remove .pdf extension
        const baseName = fileName.slice(0, -4);
        const extension = '.pdf';
        let copyNumber = 1;
        let newName = fileName;

        // Check if the name already ends with (copy X)
        const copyMatch = baseName.match(/^(.*?)(?: \(copy (\d+)\))?$/);
        const originalName = copyMatch[1];
        const existingCopyNumber = copyMatch[2] ? parseInt(copyMatch[2]) : null;

        // Function to generate name with copy number
        const generateName = (name, num) => `${name} (copy ${num})${extension}`;

        // If this is already a copy, start checking from the next number
        if (existingCopyNumber !== null) {
            copyNumber = existingCopyNumber + 1;
            newName = generateName(originalName, copyNumber);
        }

        // Keep incrementing copy number until we find a unique name
        while (pdfs.some(pdf => pdf.name === newName)) {
            if (existingCopyNumber === null && copyNumber === 1) {
                // First copy of an original file
                newName = generateName(baseName, copyNumber);
            } else {
                // Increment copy number until we find a unique name
                newName = generateName(originalName, copyNumber);
            }
            copyNumber++;
        }

        return newName;
    }

    function handleFiles(files) {
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.type === 'application/pdf') {
                let uniqueFile = new File([file], getUniqueFileName(file.name), {
                    type: file.type,
                    lastModified: file.lastModified
                });
                pdfs.push(uniqueFile);
            }
        });

        updatePDFList();
        updateControlsVisibility();
    }

    function updateControlsVisibility() {
        if (pdfs.length > 0) {
            controlsSection.classList.remove('hidden');
            mergeButton.disabled = false;
            dropZone.classList.add('files-added');
            
            // Update text visibility
            document.querySelectorAll('.initial-text').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.after-upload-text').forEach(el => el.classList.remove('hidden'));
        } else {
            controlsSection.classList.add('hidden');
            mergeButton.disabled = true;
            dropZone.classList.remove('files-added');
            
            // Reset text visibility
            document.querySelectorAll('.initial-text').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.after-upload-text').forEach(el => el.classList.add('hidden'));
        }
    }

    function updatePDFList() {
        pdfList.innerHTML = '';
        pdfs.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="file-info">
                    <span class="file-number">${index + 1}.</span>
                    <i class="fas fa-file-pdf"></i>
                    <span class="file-name">${file.name}</span>
                </div>
                <button onclick="removePDF(${index})" class="remove-button">
                    <i class="fas fa-times"></i>
                </button>
            `;
            pdfList.appendChild(li);
        });
    }

    // Remove PDF function
    window.removePDF = function(index) {
        pdfs.splice(index, 1);
        updatePDFList();
        updateControlsVisibility();
    };

    // Sort handlers
    sortAscButton.addEventListener('click', () => {
        pdfs.sort((a, b) => a.name.localeCompare(b.name));
        updatePDFList();
    });

    sortDescButton.addEventListener('click', () => {
        pdfs.sort((a, b) => b.name.localeCompare(a.name));
        updatePDFList();
    });

    // Add more files
    addMoreButton.addEventListener('click', () => {
        pdfInput.click();
    });

    // Reset all
    resetAllButton.addEventListener('click', () => {
        pdfs = [];
        updatePDFList();
        updateControlsVisibility();
        fileNameInput.value = 'merged';
    });

    // Merge PDFs
    mergeButton.addEventListener('click', async () => {
        if (pdfs.length === 0) return;

        mergeButton.disabled = true;
        mergeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';

        // Calculate total size
        const totalSize = pdfs.reduce((sum, file) => sum + file.size, 0);
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB limit

        if (totalSize > MAX_SIZE) {
            alert('Total PDF size exceeds 100MB. Please try with smaller files or fewer PDFs.');
            mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
            mergeButton.disabled = false;
            return;
        }

        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            const totalFiles = pdfs.length;
            
            for (let i = 0; i < pdfs.length; i++) {
                const pdf = pdfs[i];
                try {
                    const pdfBytes = await pdf.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                    
                    // Update progress
                    const progress = Math.round(((i + 1) / totalFiles) * 100);
                    mergeButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Merging... ${progress}%`;
                } catch (fileError) {
                    console.error(`Error processing ${pdf.name}:`, fileError);
                    throw new Error(`Failed to process ${pdf.name}. The file might be corrupted or password protected.`);
                }
            }

            const mergedPdfFile = await mergedPdf.save();
            download(mergedPdfFile, `${fileNameInput.value}.pdf`, "application/pdf");
            
            mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
            mergeButton.disabled = false;
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert(`Error merging PDFs: ${error.message}`);
            mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
            mergeButton.disabled = false;
        }
    });
});
