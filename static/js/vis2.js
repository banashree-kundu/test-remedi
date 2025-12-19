let selectedFile = null;

// Browse files (images only)
function browseImages() {
    document.getElementById("imageInput").click();
}

// Upload button (images + pdf)
function openFilePicker() {
    document.getElementById("fileInput").click();
}

// Image-only handler
document.getElementById("imageInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    selectedFile = file;
    document.getElementById("fileName").textContent =
        "Selected file: " + file.name;
});

// Image + PDF handler
document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type.");
        this.value = "";
        return;
    }

    selectedFile = file;
    document.getElementById("fileName").textContent =
        "Selected file: " + file.name;
});

function confirmUpload() {
    if (!selectedFile) {
        alert("Please upload a prescription first.");
        return;
    }

    alert("Prescription uploaded successfully!");
}
