
import type { Preset } from '../types';

export const starterPresets: Preset[] = [
  {
    name: 'Psybient Crossover',
    categoryOrder: ['genre', 'mood', 'motifs', 'production'],
    selectedTags: {
      'g_psybient': { categoryId: 'genre', weight: 1.5 },
      'g_psytrance': { categoryId: 'genre', weight: 1 },
      'g_crossover': { categoryId: 'genre', weight: 1 },
      'g_electronica_downtempo': { categoryId: 'genre', weight: 1 },
      'm_soothing': { categoryId: 'mood', weight: 1.2 },
      'm_emotional': { categoryId: 'mood', weight: 1 },
      'mo_evolving_melody': { categoryId: 'motifs', weight: 1.5 },
      'p_wide': { categoryId: 'production', weight: 1 },
      'v_instrumental': { categoryId: 'vocals', weight: 1 },
    },
  },
  {
    name: 'Chillwave Dream',
    categoryOrder: ['genre', 'era', 'mood', 'instruments', 'production', 'vocals'],
    selectedTags: {
      'g_chillwave': { categoryId: 'genre', weight: 1.5 },
      'g_synthwave': { categoryId: 'genre', weight: 1 },
      'era_80s': { categoryId: 'era', weight: 1 },
      'm_dreamy': { categoryId: 'mood', weight: 1.2 },
      'm_warm': { categoryId: 'mood', weight: 1 },
      'm_bittersweet': { categoryId: 'mood', weight: 1 },
      'i_layered_synths': { categoryId: 'instruments', weight: 1.2 },
      'p_polished': { categoryId: 'production', weight: 1 },
      'v_soft': { categoryId: 'vocals', weight: 1 },
    },
  },
   {
    name: 'ABBA Early-80s Pop',
    categoryOrder: ['era', 'mood', 'instruments', 'vocals', 'production'],
    selectedTags: {
      'era_early_80s': { categoryId: 'era', weight: 1.5 },
      'm_melancholic': { categoryId: 'mood', weight: 1.2 },
      'm_cinematic': { categoryId: 'mood', weight: 1 },
      'i_synthesizer': { categoryId: 'instruments', weight: 1 },
      'i_piano': { categoryId: 'instruments', weight: 1 },
      'i_strings': { categoryId: 'instruments', weight: 0.5 },
      'v_harmony': { categoryId: 'vocals', weight: 1.5 },
      'v_female': { categoryId: 'vocals', weight: 1},
      'v_intimate': { categoryId: 'vocals', weight: 1 },
      'p_warm': { categoryId: 'production', weight: 1 },
    },
  },
  {
    name: 'Electro Swing / Nu Jazz Blend',
    categoryOrder: ['genre', 'instruments', 'rhythm', 'vocals'],
    selectedTags: {
        'g_electro_swing': { categoryId: 'genre', weight: 1.2 },
        'g_nu_jazz': { categoryId: 'genre', weight: 1.2 },
        'i_sampler': { categoryId: 'instruments', weight: 1 },
        'i_piano': { categoryId: 'instruments', weight: 1 },
        't_breakbeat': { categoryId: 'rhythm', weight: 1 },
        'v_female': { categoryId: 'vocals', weight: 1 },
    },
  },
];
