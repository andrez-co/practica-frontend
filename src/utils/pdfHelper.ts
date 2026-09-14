// Fast PDF Helper & Cache
const blobCache = new Map<string, string>();

/**
 * Converts a data: URL (Base64) to an instant, lightweight Blob URL.
 * If already a normal URL or blob, returns it as is.
 */
export function getFastPdfUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.startsWith('data:')) return url;

  if (blobCache.has(url)) {
    return blobCache.get(url)!;
  }

  try {
    const parts = url.split(';base64,');
    const contentType = parts[0].replace('data:', '') || 'application/pdf';
    const base64Data = parts[1] || '';
    
    if (!base64Data) return url;

    // Fast Base64 decode to binary chunks
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);

    blobCache.set(url, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('Error optimizing PDF data URL:', err);
    return url;
  }
}

/**
 * Downloads or opens a PDF url with high performance
 */
export function downloadPdf(url: string, filename = 'documento.pdf') {
  const fastUrl = getFastPdfUrl(url);
  const a = document.createElement('a');
  a.href = fastUrl;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Opens a PDF in a new tab instantly using optimized Blob URL
 */
export function openPdfInNewTab(url: string) {
  const fastUrl = getFastPdfUrl(url);
  window.open(fastUrl, '_blank', 'noopener,noreferrer');
}
