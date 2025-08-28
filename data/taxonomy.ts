
import type { Taxonomy } from '../types';

export const starterTaxonomy: Taxonomy = [
  {
    id: 'genre',
    name: 'Genre / Sub-genre',
    tags: [
      { id: 'g_trance', label: 'Trance', description: 'Driving, melodic electronic music, typically around 130-140 BPM.' },
      { id: 'g_psytrance', label: 'Psytrance', description: 'Hypnotic, fast-paced trance with characteristic basslines.', implies: ['t_fast'] },
      { id: 'g_synthpop', label: 'Synth-Pop', description: 'Pop music featuring synthesizers as the dominant instrument.', implies: ['era_80s', 'i_synth'] },
      { id: 'g_ambient', label: 'Ambient', description: 'Atmospheric, textural music focusing on tone and atmosphere over rhythm.' },
      { id: 'g_deephouse', label: 'Deep House', description: 'Slower, more melodic house music with complex chords and soulful vocals.' },
      { id: 'g_orchestral', label: 'Orchestral Hybrid', description: 'A blend of traditional orchestra with modern electronic elements.' },
    ],
  },
  {
    id: 'era',
    name: 'Era / Vibe',
    tags: [
      { id: 'era_70s', label: '70s', description: 'Vibes of disco, funk, and early electronic music.' },
      { id: 'era_80s', label: '80s', description: 'Characterized by big synths, gated reverb, and iconic drum machines.' },
      { id: 'era_90s', label: '90s', description: 'The golden age of trance, house, and rave culture.' },
      { id: 'era_00s', label: '00s', description: 'Early 2000s sound, often glossier and more digital.' },
      { id: 'era_y2k', label: 'Y2K', description: 'Futuristic and tech-optimistic sounds from the turn of the millennium.' },
      { id: 'era_modern', label: 'Modern', description: 'Contemporary, clean production with current sonic trends.', conflictsWith: ['m_lofi'] },
      { id: 'era_retro', label: 'Retro-Futuristic', description: 'A vintage vision of the future, like vaporwave or outrun.' },
    ],
  },
  {
    id: 'mood',
    name: 'Mood / Energy',
    tags: [
      { id: 'm_melancholic', label: 'Melancholic', description: 'Sad, thoughtful, and introspective.' },
      { id: 'm_euphoric', label: 'Euphoric', description: 'Extremely happy, uplifting, and anthemic.' },
      { id: 'm_driving', label: 'Driving', description: 'High energy, propulsive rhythm that pushes forward.' },
      { id: 'm_dreamy', label: 'Dreamy', description: 'Ethereal, atmospheric, and hazy.' },
      { id: 'm_dark', label: 'Dark', description: 'Ominous, moody, and serious in tone.' },
      { id: 'm_uplifting', label: 'Uplifting', description: 'Positive, hopeful, and inspiring.' },
    ],
  },
  {
    id: 'tempo',
    name: 'Tempo',
    tags: [
      { id: 't_slow', label: 'Slow', description: 'Leisurely pace, typically under 100 BPM.' },
      { id: 't_medium', label: 'Medium', description: 'A walking or head-nodding pace, 100-125 BPM.' },
      { id: 't_fast', label: 'Fast', description: 'High energy, danceable pace, 125+ BPM.' },
      { id: 't_fourfloor', label: 'Four-on-the-floor', description: 'A steady, uniformly accented beat in 4/4 time.' },
    ],
  },
  {
    id: 'instruments',
    name: 'Instrumentation',
    tags: [
      { id: 'i_synth', label: 'Synths', description: 'Electronic synthesizers, the core of electronic music.' },
      { id: 'i_drummachine', label: 'Drum Machines', description: 'Programmed, electronic percussion.' },
      { id: 'i_guitar', label: 'Electric Guitar', description: 'Can be clean, distorted, or ambient.' },
      { id: 'i_strings', label: 'Strings', description: 'Violins, cellos, etc., either acoustic or synthesized.' },
      { id: 'i_choir', label: 'Choir', description: 'Vocal chorus, can be angelic, epic, or haunting.' },
      { id: 'i_piano', label: 'Piano', description: 'Acoustic or electric piano for melody or chords.' },
    ],
  },
  {
    id: 'classics',
    name: 'Classic Synths / Drums',
    tags: [
      { id: 'cs_juno', label: 'Juno-106', description: 'Classic Roland poly-synth known for lush pads and chorus.', implies: ['i_synth'] },
      { id: 'cs_jupiter', label: 'Jupiter-8', description: 'Iconic poly-synth famous for its warm, rich analog sound.', implies: ['i_synth'] },
      { id: 'cs_prophet', label: 'Prophet-5', description: 'Legendary synth with a powerful, distinctly American sound.', implies: ['i_synth'] },
      { id: 'cs_808', label: 'TR-808', description: 'The legendary drum machine with deep kicks and snappy snares.', implies: ['i_drummachine'] },
      { id: 'cs_909', label: 'TR-909', description: 'The heartbeat of house and techno, known for its punchy kick and hi-hats.', implies: ['i_drummachine'] },
      { id: 'cs_303', label: 'TB-303', description: 'The source of the "acid" sound with its squelchy, resonant filter.', implies: ['sd_acid'] },
    ],
  },
  {
    id: 'sound_design',
    name: 'Sound Design',
    tags: [
      { id: 'sd_arp', label: 'Arpeggio / Sequence', description: 'A rhythmic pattern of notes played in sequence.' },
      { id: 'sd_pads', label: 'Warm Pads', description: 'Lush, sustained chords that create atmosphere.' },
      { id: 'sd_bells', label: 'Shimmering Bells', description: 'Bright, metallic, or crystalline bell sounds.' },
      { id: 'sd_bass', label: 'Gritty Bass', description: 'A distorted, aggressive bass sound.' },
      { id: 'sd_supersaw', label: 'Supersaw', description: 'A detuned, layered sawtooth wave, classic in trance.' },
      { id: 'sd_acid', label: 'Acid', description: 'The squelchy, resonant sound of a TB-303 synthesizer.' },
    ],
  },
  {
    id: 'production',
    name: 'Production Techniques',
    tags: [
      { id: 'p_sidechain', label: 'Sidechain Pumping', description: 'The volume of pads/bass ducks in time with the kick drum.' },
      { id: 'p_saturation', label: 'Tape-like Saturation', description: 'Adds warmth, harmonics, and subtle compression.' },
      { id: 'p_gatedreverb', label: 'Gated Reverb', description: 'A classic 80s effect with a sharp reverb tail cutoff.' },
      { id: 'p_wide', label: 'Wide Stereo Image', description: 'Sounds are spread far to the left and right.' },
    ],
  },
  {
    id: 'structure',
    name: 'Structure / Arrangement',
    tags: [
      { id: 's_intro', label: 'Intro', description: 'The beginning of the track, often building energy.' },
      { id: 's_buildup', label: 'Build-up', description: 'A section of rising tension and energy.' },
      { id: 's_breakdown', label: 'Breakdown', description: 'A sparse section where rhythmic elements are removed.' },
      { id: 's_drop', label: 'Drop', description: 'The moment the main beat and bassline kick in with full energy.' },
      { id: 's_outro', label: 'Outro', description: 'The end of the track, fading out or simplifying elements.' },
      { id: 's_djfriendly', label: 'DJ-friendly intro/outro', description: 'Extended, beat-only sections for mixing.' },
    ],
  },
  {
    id: 'vocals',
    name: 'Vocals',
    tags: [
      { id: 'v_instrumental', label: 'Instrumental', description: 'No vocals.', conflictsWith: ['v_female', 'v_male'] },
      { id: 'v_female', label: 'Female Vocals', description: 'Lead vocals by a female singer.' },
      { id: 'v_male', label: 'Male Vocals', description: 'Lead vocals by a male singer.' },
      { id: 'v_soft', label: 'Soft / Airy Vocals', description: 'Gentle, breathy vocal performance.' },
      { id: 'v_powerful', label: 'Powerful Vocals', description: 'Strong, commanding vocal performance.' },
      { id: 'v_harmony', label: 'Vocal Harmonies', description: 'Multiple vocal parts singing different notes.' },
    ],
  },
  {
    id: 'mix',
    name: 'Mix & Mastering Tone',
    tags: [
      { id: 'm_warm', label: 'Warm / Analog', description: 'Rich low-mids, smooth highs, often with saturation.' },
      { id: 'm_glossy', label: 'Glossy / Modern', description: 'Bright, clean, and polished sound.', conflictsWith: ['m_lofi']},
      { id: 'm_lofi', label: 'Lo-fi', description: 'Intentionally imperfect, with noise, wow, and flutter.', conflictsWith: ['m_glossy']},
      { id: 'm_punchy', label: 'Punchy', description: 'Strong transient impact, especially in the drums.' },
    ],
  },
];
