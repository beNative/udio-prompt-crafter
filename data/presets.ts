import type { Preset } from '../types';

export const starterPresets: Preset[] = [
  {
    name: 'Psybient Crossover',
    categoryOrder: ['genre', 'mood', 'motifs', 'production'],
    selectedTags: {
      'g_psybient': { categoryId: 'genre' },
      'g_psytrance': { categoryId: 'genre' },
      'g_crossover': { categoryId: 'genre' },
      'g_electronica_downtempo': { categoryId: 'genre' },
      'm_soothing': { categoryId: 'mood' },
      'm_emotional': { categoryId: 'mood' },
      'mo_evolving_melody': { categoryId: 'motifs' },
      'p_wide': { categoryId: 'production' },
      'v_instrumental': { categoryId: 'vocals' },
    },
  },
  {
    name: 'Chillwave Dream',
    categoryOrder: ['genre', 'era', 'mood', 'instruments', 'production', 'vocals'],
    selectedTags: {
      'g_chillwave': { categoryId: 'genre' },
      'g_synthwave': { categoryId: 'genre' },
      'era_80s': { categoryId: 'era' },
      'm_dreamy': { categoryId: 'mood' },
      'm_warm': { categoryId: 'mood' },
      'm_bittersweet': { categoryId: 'mood' },
      'i_layered_synths': { categoryId: 'instruments' },
      'p_polished': { categoryId: 'production' },
      'v_soft': { categoryId: 'vocals' },
    },
  },
   {
    name: 'ABBA Early-80s Pop',
    categoryOrder: ['era', 'mood', 'instruments', 'vocals', 'production'],
    selectedTags: {
      'era_early_80s': { categoryId: 'era' },
      'm_melancholic': { categoryId: 'mood' },
      'm_cinematic': { categoryId: 'mood' },
      'i_synthesizer': { categoryId: 'instruments' },
      'i_piano': { categoryId: 'instruments' },
      'i_strings': { categoryId: 'instruments' },
      'v_harmony': { categoryId: 'vocals' },
      'v_female': { categoryId: 'vocals'},
      'v_intimate': { categoryId: 'vocals' },
      'p_warm': { categoryId: 'production' },
    },
  },
  {
    name: 'Electro Swing / Nu Jazz Blend',
    categoryOrder: ['genre', 'instruments', 'rhythm', 'vocals'],
    selectedTags: {
        'g_electro_swing': { categoryId: 'genre' },
        'g_nu_jazz': { categoryId: 'genre' },
        'i_sampler': { categoryId: 'instruments' },
        'i_piano': { categoryId: 'instruments' },
        't_breakbeat': { categoryId: 'rhythm' },
        'v_female': { categoryId: 'vocals' },
    },
  },
];