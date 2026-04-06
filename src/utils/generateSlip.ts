import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface ApplicationData {
    full_name: string;
    reference_number: string;
    position: string;
    department: string;
    passport_url?: string;
    passportFile?: File | null;
    date_of_birth: string;
    state_of_origin: string;
}

export const generateSlip = async (data: ApplicationData, returnData: boolean = false): Promise<string | void> => {
    const doc = new jsPDF({
        compress: true
    });

    const BRAND_BLUE = '#1e3a5f';
    const BRAND_TEAL = '#4a9d7e';
    const LIGHT_BG = '#f8fafc';

    // -- Helper to load image from URL (Robust Fetch Version with Fallback) --
    const loadImage = async (url: string): Promise<string> => {
        console.log("Loading image from:", url);

        // 1. Force HTTPS if current page is HTTPS
        if (window.location.protocol === 'https:' && url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }

        // 2. Handle www vs non-www CORS mismatch
        // If we are on www.example.org but image is on example.org (or vice versa),
        // we can rewrite the image URL to match the current origin to make it a Same-Origin request.
        try {
            const currentUrl = new URL(window.location.href);
            const imageUrl = new URL(url);

            // Check if they are the same base domain
            const currentHost = currentUrl.hostname.replace('www.', '');
            const imageHost = imageUrl.hostname.replace('www.', '');

            if (currentHost === imageHost) {
                // If base domains match, force the image to use the current origin
                // This makes it a Same-Origin request, bypassing CORS entirely.
                url = `${currentUrl.origin}${imageUrl.pathname}${imageUrl.search}`;
                console.log("Rewrote image URL for Same-Origin:", url);
            }
        } catch (e) {
            console.warn("Error parsing URLs for CORS fix:", e);
        }

        try {
            // Attempt 1: Fetch with CORS and no-cache
            // Removed 'Access-Control-Allow-Origin' from headers as it is a response header, not a request header.
            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-store'
            });

            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn("Fetch failed, trying Image fallback:", error);

            // Attempt 2: Image Object Fallback
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = url;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/jpeg'));
                    } else {
                        reject(new Error('Canvas context failed'));
                    }
                };
                img.onerror = (e) => reject(new Error(`Image load failed: ${e}`));
            });
        }
    };

    // -- Helper to read File object --
    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    try {
        // 1. Header Background
        doc.setFillColor(BRAND_BLUE);
        doc.rect(0, 0, 210, 40, 'F');

        // 2. Logo - Use absolute URL
        const logoUrl = `${window.location.origin}/logo.svg`;
        try {
            const logoData = await loadImage(logoUrl);
            doc.addImage(logoData, 'PNG', 10, 5, 30, 30);
        } catch (e) {
            console.warn("Could not load logo", e);
        }

        // 3. Header Text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("Sahel Resilience Stack", 50, 18);
        doc.setFontSize(16);
        doc.text("Core Admin Module", 50, 28);

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text("Edge Deployment", 195, 35, { align: 'right' });

        // 4. Title Section
        doc.setFontSize(24);
        doc.setTextColor(BRAND_BLUE);
        doc.text("Enrollment Receipt", 105, 60, { align: "center" });

        doc.setDrawColor(BRAND_TEAL);
        doc.setLineWidth(1);
        doc.line(80, 65, 130, 65);

        // 5. Passport Photo Frame
        const photoX = 150;
        const photoY = 75;
        const photoSize = 40;

        // Draw shadow/border for passport
        doc.setFillColor(240, 240, 240);
        doc.rect(photoX, photoY, photoSize, photoSize, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(photoX, photoY, photoSize, photoSize, 'S');

        if (data.passportFile) {
            try {
                const passportData = await readFile(data.passportFile);
                doc.addImage(passportData, 'JPEG', photoX, photoY, photoSize, photoSize);
            } catch (e) { console.error(e); }
        } else if (data.passport_url) {
            try {
                const passportData = await loadImage(data.passport_url);
                doc.addImage(passportData, 'JPEG', photoX, photoY, photoSize, photoSize);
            } catch (e) {
                console.error("Passport load failed:", e);
                // Fallback text with specific error indication
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text("Photo Error", photoX + 20, photoY + 15, { align: 'center' });
                doc.setFontSize(6);
                doc.text("(Server Config/CORS)", photoX + 20, photoY + 25, { align: 'center' });
            }
        }

        // 6. Record Details Grid
        let y = 80;
        const startX = 20;
        const labelWidth = 50;
        const valueWidth = 70;
        const rowHeight = 12;

        doc.setFontSize(11);

        const addRow = (label: string, value: string, isAlternate: boolean = false) => {
            if (isAlternate) {
                doc.setFillColor(LIGHT_BG);
                doc.rect(startX - 2, y - 8, 120, rowHeight, 'F');
            }

            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(label, startX, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(value || '-', startX + labelWidth, y);

            y += rowHeight;
        };

        addRow("Reference", data.reference_number, true);
        addRow("Full Name", data.full_name);
        addRow("Date of Birth", data.date_of_birth, true);
        addRow("Region", data.state_of_origin);
        addRow("Assigned Role", data.position, true);
        addRow("Unit", data.department);
        addRow("Generated", new Date().toLocaleDateString(), true);

        // 7. QR Code Section
        const qrY = y + 20;
        const qrData = `REF:${data.reference_number}|NAME:${data.full_name}|POS:${data.position}`;
        const qrDataUrl = await QRCode.toDataURL(qrData);

        doc.setFillColor(LIGHT_BG);
        doc.roundedRect(20, qrY, 170, 50, 3, 3, 'F');

        doc.addImage(qrDataUrl, 'PNG', 25, qrY + 5, 40, 40);

        doc.setFontSize(10);
        doc.setTextColor(BRAND_BLUE);
        doc.setFont("helvetica", "bold");
        doc.text("Official Verification", 70, qrY + 15);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text("This receipt serves as proof of enrollment submission.", 70, qrY + 25);
        doc.text("Keep it for support and verification workflows.", 70, qrY + 32);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 70, qrY + 42);

        // 8. Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Sahel Resilience Stack • Core Admin Module", 105, 285, { align: "center" });

        if (returnData) {
            const dataUri = doc.output('datauristring');
            return dataUri.split(',')[1];
        } else {
            doc.save(`SRS_Receipt_${data.reference_number}.pdf`);
        }

    } catch (err) {
        console.error("Error generating slip:", err);
        if (!returnData) alert("Could not generate slip. Please try again.");
        throw err;
    }
};
