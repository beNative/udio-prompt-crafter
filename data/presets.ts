
import type { Preset } from '../types';

export const starterPresets: Preset[] = [
  {
    name: '90s Progressive Trance',
    categoryOrder: ['genre', 'era', 'mood', 'tempo', 'sound_design', 'production', 'structure', 'vocals'],
    selectedTags: {
      'g_trance': { categoryId: 'genre', weight: 1.5 },
      'era_90s': { categoryId: 'era', weight: 1 },
      'm_euphoric': { categoryId: 'mood', weight: 1 },
      'm_driving': { categoryId: 'mood', weight: 1.2 },
      't_fast': { categoryId: 'tempo', weight: 1 },
      't_fourfloor': { categoryId: 'tempo', weight: 1 },
      'sd_arp': { categoryId: 'sound_design', weight: 1 },
      'sd_supersaw': { categoryId: 'sound_design', weight: 1.2 },
      'p_wide': { categoryId: 'production', weight: 1 },
      's_buildup': { categoryId: 'structure', weight: 1 },
      's_breakdown': { categoryId: 'structure', weight: 1 },
      's_drop': { categoryId: 'structure', weight: 1 },
      'v_instrumental': { categoryId: 'vocals', weight: 1 },
    },
  },
  {
    name: 'Retro 80s Synth-Pop',
    categoryOrder: ['genre', 'era', 'classics', 'production', 'vocals', 'mood'],
    selectedTags: {
      'g_synthpop': { categoryId: 'genre', weight: 1.5 },
      'era_80s': { categoryId: 'era', weight: 1.2 },
      'm_nostalgic': { categoryId: 'mood', weight: 1 },
      'cs_juno': { categoryId: 'classics', weight: 1 },
      'cs_808': { categoryId: 'classics', weight: 1 },
      'p_gatedreverb': { categoryId: 'production', weight: 1.2 },
      'v_female': { categoryId: 'vocals', weight: 1 },
    },
  },
  {
    name: 'Ambient Psybient',
    categoryOrder: ['genre', 'mood', 'sound_design', 'tempo', 'vocals'],
    selectedTags: {
      'g_ambient': { categoryId: 'genre', weight: 1.2 },
      'g_psytrance': { categoryId: 'genre', weight: 0.8 },
      'm_dreamy': { categoryId: 'mood', weight: 1.5 },
      'm_melancholic': { categoryId: 'mood', weight: 1 },
      't_slow': { categoryId: 'tempo', weight: 1 },
      'sd_pads': { categoryId: 'sound_design', weight: 1.2 },
      'sd_bells': { categoryId: 'sound_design', weight: 1 },
      'v_instrumental': { categoryId: 'vocals', weight: 1 },
    },
  },
];
