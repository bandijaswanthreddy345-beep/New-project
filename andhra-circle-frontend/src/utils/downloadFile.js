export const downloadFile = async (fileUrl, fileName) => {
try {
const response = await fetch(fileUrl);

if (!response.ok) {
  throw new Error("Failed to download file");
}

const blob = await response.blob();

const blobUrl = window.URL.createObjectURL(blob);

const link = document.createElement("a");

link.href = blobUrl;
link.download = fileName || "download.pdf";

document.body.appendChild(link);

link.click();

document.body.removeChild(link);

window.URL.revokeObjectURL(blobUrl);

} catch (error) {
console.error("Download error:", error);
alert("Unable to download the file. Please try again.");
}
};