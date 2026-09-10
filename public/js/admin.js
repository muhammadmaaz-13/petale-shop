// Image preview on upload
function wireImagePreview(inputId, imgId, phId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById(imgId);
      const ph = document.getElementById(phId);
      img.src = e.target.result;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}
wireImagePreview('imageInput', 'previewImg', 'previewPh');
wireImagePreview('imageInput2', 'previewImg2', 'previewPh2');

// Accent color swatch picker
const swatchRow = document.getElementById('swatchRow');
if (swatchRow) {
  swatchRow.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    const color = swatch.dataset.color;
    document.getElementById('accentColorInput').value = color;
    const preview = document.getElementById('imagePreview');
    const ph = document.getElementById('previewPh');
    if (preview && !document.getElementById('imageInput').files.length) {
      preview.style.background = color;
    }
  });
}
