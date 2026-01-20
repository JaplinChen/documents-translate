import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePptxProcessor } from './usePptxProcessor';
import { useUIStore } from '../store/useUIStore';
import { useFileStore } from '../store/useFileStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { APP_STATUS } from '../constants';

// Mock constants
vi.mock('../constants', () => ({
    API_BASE: 'http://localhost:8080',
    APP_STATUS: {
        IDLE: "idle",
        UPLOADING: "uploading",
        EXTRACTING: "extracting",
        TRANSLATING: "translating",
        EXPORTING: "exporting",
        TRANSLATION_COMPLETED: "translation_completed",
        EXPORT_COMPLETED: "export_completed",
        ERROR: "error"
    }
}));


// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('usePptxProcessor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        // Reset stores
        useUIStore.setState({
            status: "",
            appStatus: 'IDLE',
            busy: false,
            targetLang: 'zh-TW',
            slideDimensions: { width: 0, height: 0 }
        });
        useFileStore.setState({ file: null, blocks: [] });
    });

    it('should handle successful extraction', async () => {
        const mockFile = new File([''], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
        const mockData = {
            blocks: [{ _uid: '1', source_text: 'hello', slide_index: 0, shape_id: 1 }],
            slide_width: 720,
            slide_height: 540,
            language_summary: { 'en': 100 }
        };

        // Pre-set file in store
        useFileStore.setState({ file: mockFile });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => usePptxProcessor());

        let summary;
        await act(async () => {
            summary = await result.current.handleExtract();
        });

        expect(useFileStore.getState().file).toBe(mockFile);
        expect(useFileStore.getState().blocks.length).toBe(1);
        expect(summary).toEqual(mockData.language_summary);
    });


    it('should handle extraction failure', async () => {
        const mockFile = new File([''], 'test.pptx');
        useFileStore.setState({ file: mockFile });

        global.fetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'Invalid file'
        });

        const { result } = renderHook(() => usePptxProcessor());

        await act(async () => {
            await result.current.handleExtract();
        });

        expect(useUIStore.getState().appStatus).toBe("error");
    });


    it('should handle successful translation (stream)', async () => {
        const mockBlocks = [{ _uid: '1', source_text: 'hello', translated_text: '' }];
        useFileStore.setState({ blocks: mockBlocks });

        const mockEventData = JSON.stringify({
            blocks: [{ _uid: '1', source_text: 'hello', translated_text: '你好' }]
        });

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(`event: complete\ndata: ${mockEventData}\n\n`));
                controller.close();
            }
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            body: stream
        });

        const { result } = renderHook(() => usePptxProcessor());

        await act(async () => {
            await result.current.handleTranslate();
        });

        expect(useFileStore.getState().blocks[0].translated_text).toBe('你好');
        expect(useUIStore.getState().appStatus).toBe('translation_completed');
    });

});

