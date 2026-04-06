export interface SMSResponse {
    status: string;
    code?: string;
    message: string;
    data?: any;
}

export const sendSMS = async (to: string, body: string): Promise<SMSResponse> => {
    try {
        // In development, you might need to point to the live server or a local PHP server.
        // For production builds, relative path works.
        const smsUrl = import.meta.env.VITE_SMS_URL || '/send_sms.php';

        // Format phone number as requested
        // Ensure it starts with +234 if it's a Nigerian number
        let formattedTo = to.trim().replace(/\s+/g, ''); // Remove spaces

        // Remove any non-digit characters (except +)
        formattedTo = formattedTo.replace(/[^\d+]/g, '');

        if (formattedTo.startsWith('0')) {
            // 080... -> +23480...
            formattedTo = '+234' + formattedTo.substring(1);
        } else if (formattedTo.startsWith('234')) {
            // 234... -> +234...
            formattedTo = '+' + formattedTo;
        }
        // If it already starts with +234, leave it.

        const response = await fetch(smsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: formattedTo,
                body,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return {
            status: 'error',
            message: 'Failed to send SMS due to network or server error.',
        };
    }
};
