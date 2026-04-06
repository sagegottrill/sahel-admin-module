export const sendEmail = async (
    to: string,
    subject: string,
    message: string,
    attachment?: { name: string; data: string }
) => {
    // Use the PHP proxy script
    const emailUrl = import.meta.env.VITE_EMAIL_URL || '/send_email.php';

    try {
        const response = await fetch(emailUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                message,
                attachment
            }),
        });

        const data = await response.json();
        if (!data.status || data.status !== 'success') {
            throw new Error(data.message || 'Failed to send email');
        }
        return data;
    } catch (error) {
        console.error('Email Error:', error);
        throw error;
    }
};
