/**
 * Unit tests for useUIStore
 * Tests UI state management: modals, tabs, filters, settings
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../store/useUIStore';

describe('useUIStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useUIStore.setState({
            status: "",
            appStatus: "idle",
            busy: false,
            llmOpen: false,
            manageOpen: false,
            llmTab: "llm",
            manageTab: "glossary",
            mode: "bilingual",
            bilingualLayout: "inline",
            sourceLang: "",
            secondaryLang: "",
            targetLang: "zh-TW",
            sourceLocked: false,
            secondaryLocked: false,
            targetLocked: false,
            filterText: "",
            filterType: "all",
            filterSlide: ""
        });
    });

    describe('Status Management', () => {
        it('should set status message', () => {
            useUIStore.getState().setStatus('Processing...');
            expect(useUIStore.getState().status).toBe('Processing...');
        });

        it('should set app status', () => {
            useUIStore.getState().setAppStatus('translating');
            expect(useUIStore.getState().appStatus).toBe('translating');
        });

        it('should set busy state', () => {
            useUIStore.getState().setBusy(true);
            expect(useUIStore.getState().busy).toBe(true);
        });
    });

    describe('Modal Management', () => {
        it('should open LLM settings modal', () => {
            useUIStore.getState().setLlmOpen(true);
            expect(useUIStore.getState().llmOpen).toBe(true);
        });

        it('should close LLM settings modal', () => {
            useUIStore.setState({ llmOpen: true });
            useUIStore.getState().setLlmOpen(false);
            expect(useUIStore.getState().llmOpen).toBe(false);
        });

        it('should open manage modal', () => {
            useUIStore.getState().setManageOpen(true);
            expect(useUIStore.getState().manageOpen).toBe(true);
        });
    });

    describe('Tab Management', () => {
        it('should switch LLM tab', () => {
            useUIStore.getState().setLlmTab('fonts');
            expect(useUIStore.getState().llmTab).toBe('fonts');
        });

        it('should switch manage tab', () => {
            useUIStore.getState().setManageTab('memory');
            expect(useUIStore.getState().manageTab).toBe('memory');
        });
    });

    describe('Processing Settings', () => {
        it('should set mode', () => {
            useUIStore.getState().setMode('correction');
            expect(useUIStore.getState().mode).toBe('correction');
        });

        it('should set bilingual layout', () => {
            useUIStore.getState().setBilingualLayout('stacked');
            expect(useUIStore.getState().bilingualLayout).toBe('stacked');
        });

        it('should set source language', () => {
            useUIStore.getState().setSourceLang('en');
            expect(useUIStore.getState().sourceLang).toBe('en');
        });

        it('should set target language', () => {
            useUIStore.getState().setTargetLang('ja');
            expect(useUIStore.getState().targetLang).toBe('ja');
        });

        it('should set language lock states', () => {
            useUIStore.getState().setSourceLocked(true);
            useUIStore.getState().setTargetLocked(true);

            expect(useUIStore.getState().sourceLocked).toBe(true);
            expect(useUIStore.getState().targetLocked).toBe(true);
        });
    });

    describe('Filter Settings', () => {
        it('should set filter text', () => {
            useUIStore.getState().setFilterText('hello');
            expect(useUIStore.getState().filterText).toBe('hello');
        });

        it('should set filter type', () => {
            useUIStore.getState().setFilterType('title');
            expect(useUIStore.getState().filterType).toBe('title');
        });

        it('should set filter slide', () => {
            useUIStore.getState().setFilterSlide('5');
            expect(useUIStore.getState().filterSlide).toBe('5');
        });
    });
});
