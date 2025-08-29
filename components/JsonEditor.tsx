import React, { useRef, useEffect } from 'react';

interface JsonEditorProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    error: string | null;
    height?: string;
}

const highlightJson = (json: string) => {
    if (!json) return { __html: '' };
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
    return { __html: highlighted };
};

export const JsonEditor: React.FC<JsonEditorProps> = ({ id, value, onChange, error, height = '200px' }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        const syncScroll = () => {
            if (textareaRef.current && preRef.current) {
                preRef.current.scrollTop = textareaRef.current.scrollTop;
                preRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        };
        const textarea = textareaRef.current;
        textarea?.addEventListener('scroll', syncScroll);
        return () => textarea?.removeEventListener('scroll', syncScroll);
    }, []);
    
    const baseClasses = "mt-1 block w-full shadow-sm sm:text-sm rounded-md bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-200 border";
    const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
    const normalClasses = "border-bunker-300 dark:border-bunker-700 focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className={`json-editor-container ${baseClasses} ${error ? errorClasses : normalClasses}`} style={{ height }}>
            <textarea
                ref={textareaRef}
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="json-editor-textarea"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
            <pre ref={preRef} className="json-editor-pre" aria-hidden="true">
                <code dangerouslySetInnerHTML={highlightJson(value)} />
            </pre>
        </div>
    );
};
