<?php

/**
 * Predefined fitness & wellness categories for PULSE coaches.
 * Each coach can select multiple categories from this list.
 * Used for filtering on /coaches and for the coach profile edit form.
 */
return [
    // ── Fyzická kondícia ──────────────────────────────────────────────────
    ['key' => 'strength',     'label' => 'Silový tréning',          'icon' => '💪', 'group' => 'Fyzická kondícia'],
    ['key' => 'bodybuilding', 'label' => 'Kulturistika',             'icon' => '🏋️', 'group' => 'Fyzická kondícia'],
    ['key' => 'crossfit',     'label' => 'CrossFit',                 'icon' => '⚡', 'group' => 'Fyzická kondícia'],
    ['key' => 'hiit',         'label' => 'HIIT',                     'icon' => '🔥', 'group' => 'Fyzická kondícia'],
    ['key' => 'functional',   'label' => 'Funkčný tréning',          'icon' => '🤸', 'group' => 'Fyzická kondícia'],
    ['key' => 'calisthenics', 'label' => 'Kalistenics',              'icon' => '🏅', 'group' => 'Fyzická kondícia'],
    ['key' => 'powerlifting', 'label' => 'Powerlifting',             'icon' => '🏆', 'group' => 'Fyzická kondícia'],

    // ── Kardio & Šport ────────────────────────────────────────────────────
    ['key' => 'running',      'label' => 'Beh',                      'icon' => '🏃', 'group' => 'Kardio & Šport'],
    ['key' => 'cycling',      'label' => 'Cyklistika',               'icon' => '🚴', 'group' => 'Kardio & Šport'],
    ['key' => 'swimming',     'label' => 'Plávanie',                 'icon' => '🏊', 'group' => 'Kardio & Šport'],
    ['key' => 'martial_arts', 'label' => 'Bojové umenia',            'icon' => '🥊', 'group' => 'Kardio & Šport'],
    ['key' => 'dance',        'label' => 'Tanec & Zumba',            'icon' => '💃', 'group' => 'Kardio & Šport'],

    // ── Myseľ & Telo ─────────────────────────────────────────────────────
    ['key' => 'yoga',         'label' => 'Joga',                     'icon' => '🧘', 'group' => 'Myseľ & Telo'],
    ['key' => 'pilates',      'label' => 'Pilates',                  'icon' => '🌀', 'group' => 'Myseľ & Telo'],
    ['key' => 'meditation',   'label' => 'Meditácia',                'icon' => '🕊️', 'group' => 'Myseľ & Telo'],
    ['key' => 'mobility',     'label' => 'Strečing & Mobilita',      'icon' => '🤾', 'group' => 'Myseľ & Telo'],
    ['key' => 'breathwork',   'label' => 'Dýchacie techniky',        'icon' => '💨', 'group' => 'Myseľ & Telo'],

    // ── Výživa & Zdravie ──────────────────────────────────────────────────
    ['key' => 'nutrition',    'label' => 'Výživa',                   'icon' => '🥗', 'group' => 'Výživa & Zdravie'],
    ['key' => 'weight_loss',  'label' => 'Chudnutie',                'icon' => '⚖️', 'group' => 'Výživa & Zdravie'],
    ['key' => 'muscle_gain',  'label' => 'Naberanie svalov',         'icon' => '📈', 'group' => 'Výživa & Zdravie'],
    ['key' => 'rehab',        'label' => 'Rehabilitácia',            'icon' => '🩺', 'group' => 'Výživa & Zdravie'],

    // ── Špeciálne skupiny ─────────────────────────────────────────────────
    ['key' => 'seniors',      'label' => 'Seniori',                  'icon' => '👴', 'group' => 'Špeciálne skupiny'],
    ['key' => 'pregnancy',    'label' => 'Tehotenstvo & Po pôrode',  'icon' => '🤰', 'group' => 'Špeciálne skupiny'],
    ['key' => 'youth',        'label' => 'Deti & Mládež',            'icon' => '🧒', 'group' => 'Špeciálne skupiny'],

    // ── Životný štýl ─────────────────────────────────────────────────────
    ['key' => 'mindfulness',  'label' => 'Mindfulness',              'icon' => '🌿', 'group' => 'Životný štýl'],
    ['key' => 'stress',       'label' => 'Manažment stresu',         'icon' => '😌', 'group' => 'Životný štýl'],
    ['key' => 'sleep',        'label' => 'Spánok & Regenerácia',     'icon' => '😴', 'group' => 'Životný štýl'],
    ['key' => 'online',       'label' => 'Online koučing',           'icon' => '💻', 'group' => 'Životný štýl'],
];
