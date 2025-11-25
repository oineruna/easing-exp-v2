import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）の処理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;

        // データ検証
        if (!data.participantId || !data.tasks) {
            return res.status(400).json({ error: 'Invalid data: missing required fields' });
        }

        console.log('[Experiment Data] Received from participant:', data.participantId);

        // Vercel Blob Storageに保存
        // ファイル名: experiments/experiment_data_{participantId}_{timestamp}.json
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `experiments/experiment_data_${data.participantId}_${timestamp}.json`;

        const blob = await put(filename, JSON.stringify(data, null, 2), {
            access: 'public',
            contentType: 'application/json',
        });

        console.log('[Experiment Data] Saved to Blob Storage:', blob.url);

        return res.status(200).json({
            success: true,
            message: 'Data received and saved successfully',
            participantId: data.participantId,
            url: blob.url
        });
    } catch (error) {
        console.error('[Experiment Data] Error processing data:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
