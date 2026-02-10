import { createContext, useContext, type ReactNode } from 'react';

export type AiEditRequestFn = (
    selectedText: string,
    instruction: string
) => Promise<string | null>;

export type AiEditResultCardData = {
    from: number;
    to: number;
    originalText: string;
    rewrittenText: string;
};

export type ShowAiResultCardFn = (data: AiEditResultCardData) => void;

type AiEditContextValue = {
    onAiEditRequest: AiEditRequestFn | null;
    showResultCard: ShowAiResultCardFn | null;
};

const AiEditContext = createContext<AiEditContextValue>({
    onAiEditRequest: null,
    showResultCard: null,
});

export function AiEditProvider({
    onAiEditRequest,
    showResultCard,
    children,
}: {
    onAiEditRequest: AiEditRequestFn | null;
    showResultCard: ShowAiResultCardFn | null;
    children: ReactNode;
}) {
    const value: AiEditContextValue = {
        onAiEditRequest,
        showResultCard,
    };
    return (
        <AiEditContext.Provider value={value}>
            {children}
        </AiEditContext.Provider>
    );
}

export function useAiEdit(): AiEditContextValue {
    return useContext(AiEditContext);
}
