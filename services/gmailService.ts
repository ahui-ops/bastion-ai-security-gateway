
import { analyzeEmailSecurity } from './geminiService';

export interface Email {
    id: string;
    from: string;
    subject: string;
    content: string;
    date: string;
    isThreat?: boolean;
    threatType?: string;
    explanation?: string;
    confidence?: number;
    riskScore?: number;
    mitigation?: string;
}

export const fetchGmailEmails = async (accessToken: string): Promise<Email[]> => {
    console.log("Starting Gmail fetch...");
    try {
        // 1. Get the last 10 messages
        const listResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!listResponse.ok) {
            const errorData = await listResponse.json();
            console.error("Gmail API List Error:", errorData);
            throw new Error(errorData.error?.message || "Failed to list messages");
        }

        const listData = await listResponse.json();
        console.log("List data received:", listData);

        if (!listData.messages || listData.messages.length === 0) {
            console.log("No messages found in inbox.");
            return [];
        }

        // 2. Fetch details for each message
        const emailDetails = await Promise.all(
            listData.messages.map(async (msg: { id: string }) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!detailResponse.ok) {
                    console.error(`Error fetching detail for ${msg.id}`);
                    return null;
                }

                const detailData = await detailResponse.json();

                const headers = detailData.payload.headers;
                const subject = headers.find((h: any) => h.name === 'Subject' || h.name === 'subject')?.value || 'No Subject';
                const from = headers.find((h: any) => h.name === 'From' || h.name === 'from')?.value || 'Unknown Sender';
                const date = headers.find((h: any) => h.name === 'Date' || h.name === 'date')?.value || '';

                // Get body content
                let content = detailData.snippet || '';

                // Try to get more content if available (simplified for now)
                if (detailData.payload.body?.data) {
                    try {
                        const decoded = atob(detailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                        if (decoded) content = decoded;
                    } catch (e) { }
                }

                return {
                    id: msg.id,
                    from,
                    subject,
                    content: content.substring(0, 1000), // Give Gemini more context
                    date: date ? new Date(date).toLocaleString() : 'Recent',
                };
            })
        );

        return emailDetails.filter((e): e is Email => e !== null);
    } catch (error) {
        console.error("Error in fetchGmailEmails:", error);
        throw error;
    }
};

export const scanEmails = async (emails: Email[], onProgress?: (current: number, total: number) => void) => {
    console.log(`Starting optimized scan for ${emails.length} emails...`);
    const total = emails.length;
    const scannedEmails: Email[] = new Array(total);

    // Process in small batches (concurrency: 3) to balance speed and quota
    const batchSize = 3;
    for (let i = 0; i < total; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        await Promise.all(batch.map(async (email, index) => {
            const currentIndex = i + index;
            try {
                if (onProgress) onProgress(currentIndex + 1, total);

                // Add a timeout to prevent hanging
                const analysisPromise = analyzeEmailSecurity(email.content);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Analysis Timeout")), 15000)
                );

                const analysis = await Promise.race([analysisPromise, timeoutPromise]) as any;

                scannedEmails[currentIndex] = {
                    ...email,
                    isThreat: analysis.isBlocked,
                    threatType: analysis.threatType,
                    explanation: analysis.explanation,
                    confidence: analysis.confidence,
                    riskScore: analysis.riskScore,
                    mitigation: analysis.mitigation
                };
            } catch (err) {
                console.error(`Error scanning email ${email.id}:`, err);
                scannedEmails[currentIndex] = {
                    ...email,
                    isThreat: false,
                    threatType: "Scan Error",
                    explanation: "Failed to analyze this email or timed out.",
                    confidence: 0,
                    riskScore: 0
                };
            }
        }));
    }

    return scannedEmails.filter(Boolean);
};
