
const PLURAL_TO_SINGULAR: Record<string, string> = {
    'breakdowns': 'breakdown',
    'crescendos': 'crescendo',
    'hooks': 'hook',
    'melodies': 'melody',
    'countermelodies': 'countermelody',
    'synths': 'synth',
    'pads': 'pad',
    'bells': 'bell',
    'arpeggios': 'arpeggio',
    'drones': 'drone',
    'guitars': 'guitar',
    'strings': 'string',
    'harmonies': 'harmony',
    'vocals': 'vocal',
    'risers': 'riser',
};

const SPELLING_CORRECTIONS: Record<string, string> = {
    'melodical': 'melodic',
    'baseline': 'bassline',
};

const ALIASES: Record<string, string> = {
    '16/16 TB303 acidline': 'TB-303 acidline (16th)',
};

const KEBAB_EXCEPTIONS = ['J-pop', 'TB-303', 'TR-808', 'TR-909', 'CS-80', 'DX-7', 'SQ-80', 'Juno-106', 'Jupiter-8', 'Prophet-5', 'Korg M1', 'DJ-friendly'];

function normalizeWord(word: string): string {
    let normalized = word.toLowerCase().trim();

    // 1. Alias expansion
    if (ALIASES[normalized]) {
        return ALIASES[normalized];
    }
    
    // 2. Spelling correction
    if (SPELLING_CORRECTIONS[normalized]) {
        normalized = SPELLING_CORRECTIONS[normalized];
    }

    // 3. Plural merging
    if (PLURAL_TO_SINGULAR[normalized]) {
        normalized = PLURAL_TO_SINGULAR[normalized];
    }
    
    // 4. Kebab-case for multi-word tags, respecting exceptions
    const isException = KEBAB_EXCEPTIONS.some(ex => word.includes(ex));
    if (!isException && normalized.includes(' ')) {
        normalized = normalized.replace(/\s+/g, '-');
    }

    return normalized;
}

/**
 * Processes an array of raw tag labels and applies normalization rules.
 * Handles splitting, aliasing, spelling, plurals, and deduplication.
 */
export function normalizeTagLabels(labels: string[]): string[] {
    const processedLabels = new Set<string>();

    for (const label of labels) {
        // Strip weighting syntax for normalization
        const match = label.match(/(\(\(|\()(.+?)(?::\d\.\d{1,2})?(\)\)|\))/);
        let coreLabel = match ? match[2] : label;
        const prefix = match ? match[1] : '';
        const suffix = match ? match[3] : '';
        const weight = match ? label.substring(label.indexOf(':'), label.lastIndexOf(')')) : '';

        // Handle combo tags like "synthwave / electro"
        const splitLabels = coreLabel.split(/\s*\/\s*/).map(s => s.trim());

        for (let part of splitLabels) {
            let normalized = normalizeWord(part);
            
            // Re-apply weighting syntax if it existed
            if (prefix && suffix) {
                // If weight exists, keep it. Otherwise, just wrap.
                normalized = weight ? `${prefix}${normalized}${weight}${suffix}` : `${prefix}${normalized}${suffix}`;
            }

            processedLabels.add(normalized);
        }
    }

    return Array.from(processedLabels);
}
