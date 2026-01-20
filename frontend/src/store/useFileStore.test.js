/**
 * Unit tests for useFileStore
 * Tests block management actions: add, update, select, clear
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../store/useFileStore';

describe('useFileStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useFileStore.setState({ file: null, blocks: [] });
    });

    describe('setFile', () => {
        it('should set file correctly', () => {
            const mockFile = { name: 'test.pptx', size: 1024 };
            useFileStore.getState().setFile(mockFile);

            expect(useFileStore.getState().file).toEqual(mockFile);
        });
    });

    describe('setBlocks', () => {
        it('should set blocks array directly', () => {
            const mockBlocks = [
                { _uid: '1', source_text: 'Hello', translated_text: '' },
                { _uid: '2', source_text: 'World', translated_text: '' }
            ];

            useFileStore.getState().setBlocks(mockBlocks);

            expect(useFileStore.getState().blocks).toHaveLength(2);
            expect(useFileStore.getState().blocks[0].source_text).toBe('Hello');
        });

        it('should support functional update', () => {
            const initialBlocks = [{ _uid: '1', source_text: 'Initial' }];
            useFileStore.setState({ blocks: initialBlocks });

            useFileStore.getState().setBlocks((prev) => [
                ...prev,
                { _uid: '2', source_text: 'Added' }
            ]);

            expect(useFileStore.getState().blocks).toHaveLength(2);
        });
    });

    describe('updateBlock', () => {
        it('should update specific block by uid', () => {
            const mockBlocks = [
                { _uid: '1', source_text: 'Hello', translated_text: '' },
                { _uid: '2', source_text: 'World', translated_text: '' }
            ];
            useFileStore.setState({ blocks: mockBlocks });

            useFileStore.getState().updateBlock('1', { translated_text: '你好' });

            const updated = useFileStore.getState().blocks.find(b => b._uid === '1');
            expect(updated.translated_text).toBe('你好');
        });

        it('should not affect other blocks', () => {
            const mockBlocks = [
                { _uid: '1', source_text: 'Hello', translated_text: '' },
                { _uid: '2', source_text: 'World', translated_text: '' }
            ];
            useFileStore.setState({ blocks: mockBlocks });

            useFileStore.getState().updateBlock('1', { translated_text: '你好' });

            const untouched = useFileStore.getState().blocks.find(b => b._uid === '2');
            expect(untouched.translated_text).toBe('');
        });
    });

    describe('selectBlock', () => {
        it('should select a block', () => {
            const mockBlocks = [
                { _uid: '1', source_text: 'Hello', selected: false }
            ];
            useFileStore.setState({ blocks: mockBlocks });

            useFileStore.getState().selectBlock('1', true);

            expect(useFileStore.getState().blocks[0].selected).toBe(true);
        });
    });

    describe('selectAllBlocks', () => {
        it('should select all blocks', () => {
            const mockBlocks = [
                { _uid: '1', selected: false },
                { _uid: '2', selected: false }
            ];
            useFileStore.setState({ blocks: mockBlocks });

            useFileStore.getState().selectAllBlocks(true);

            expect(useFileStore.getState().blocks.every(b => b.selected)).toBe(true);
        });

        it('should deselect all blocks when passed false', () => {
            const mockBlocks = [
                { _uid: '1', selected: true },
                { _uid: '2', selected: true }
            ];
            useFileStore.setState({ blocks: mockBlocks });

            useFileStore.getState().selectAllBlocks(false);

            expect(useFileStore.getState().blocks.every(b => b.selected === false)).toBe(true);
        });
    });

    describe('clearExtraction', () => {
        it('should reset file and blocks', () => {
            useFileStore.setState({
                file: { name: 'test.pptx' },
                blocks: [{ _uid: '1' }]
            });

            useFileStore.getState().clearExtraction();

            expect(useFileStore.getState().file).toBeNull();
            expect(useFileStore.getState().blocks).toHaveLength(0);
        });
    });

    describe('batchReplace', () => {
        beforeEach(() => {
            const mockBlocks = [
                { _uid: '1', source_text: 'Hello world', translated_text: 'Hello World from Block 1', selected: true },
                { _uid: '2', source_text: 'Test', translated_text: 'This is World test', selected: true },
                { _uid: '3', source_text: 'Skip', translated_text: 'Skip this World', selected: false }
            ];
            useFileStore.setState({ blocks: mockBlocks });
        });

        it('should replace exact match in selected blocks', () => {
            useFileStore.getState().batchReplace('World', '世界', { selectedOnly: true });

            const blocks = useFileStore.getState().blocks;
            expect(blocks[0].translated_text).toBe('Hello 世界 from Block 1');
            expect(blocks[1].translated_text).toBe('This is 世界 test');
            expect(blocks[2].translated_text).toBe('Skip this World'); // Unchanged
        });

        it('should replace in all blocks when selectedOnly is false', () => {
            useFileStore.getState().batchReplace('World', '世界', { selectedOnly: false });

            const blocks = useFileStore.getState().blocks;
            expect(blocks[2].translated_text).toBe('Skip this 世界');
        });

        it('should support case-insensitive search', () => {
            useFileStore.getState().batchReplace('world', '世界', { caseSensitive: false, selectedOnly: true });

            const blocks = useFileStore.getState().blocks;
            expect(blocks[0].translated_text).toBe('Hello 世界 from Block 1');
        });

        it('should support regex replace', () => {
            useFileStore.getState().batchReplace('World|world', 'Earth', { useRegex: true, selectedOnly: true });

            const blocks = useFileStore.getState().blocks;
            expect(blocks[0].translated_text).toContain('Earth');
        });
    });
});
