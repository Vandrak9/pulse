<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoachSeeder extends Seeder
{
    public function run(): void
    {
        $coaches = [
            [
                'user' => [
                    'name' => 'Tomáš Kováč',
                    'email' => 'tomas.kovac@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Som certifikovaný silový tréner s viac ako 8 rokmi skúseností. Špecializujem sa na budovanie svalovej hmoty a zvyšovanie výkonnosti. Prešiel som stovkami klientov od začiatočníkov až po pokročilých atlétov. Verím, že každý môže dosiahnuť svoje ciele — treba len správny plán a odhodlanie.',
                    'specialization' => 'Silový tréning & Hypertrofia',
                    'monthly_price' => 29.99,
                ],
                'posts' => [
                    [
                        'title' => 'Ako správne robiť drep',
                        'content' => 'Drep je kráľ cvikov, ale len ak ho robíš správne. Tu je 5 chýb, ktoré robí 90% ľudí v posilňovni...',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Môj program na 12 týždňov — kompletný plán',
                        'content' => 'Tento program ti pomôže pribúdať 1–2 kg čistej svaloviny za mesiac. Obsahuje rozdelenie tréningov, výživový plán a tipy na regeneráciu...',
                        'is_exclusive' => true,
                    ],
                ],
            ],
            [
                'user' => [
                    'name' => 'Lucia Horáková',
                    'email' => 'lucia.horakova@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Fitness trénerka a výživová poradkyňa. Po vlastnom prechode zo 82 kg na fit postavu som sa rozhodla pomáhať ženám, ktoré chcú zmeniť svoje telo aj myslenie. Tréningom a zdravým jedlom sa dá dosiahnuť neuveriteľne veľa — bez hladovania a bez extrémov.',
                    'specialization' => 'Ženský fitness & Výživa',
                    'monthly_price' => 24.99,
                ],
                'posts' => [
                    [
                        'title' => 'Prečo HIIT nestačí na spaľovanie tuku',
                        'content' => 'Mnoho žien si myslí, že čím viac kardio, tým lepší výsledok. Opak je pravdou — tu je vysvetlenie, prečo...',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Jedálniček na celý týždeň — 1600 kcal',
                        'content' => 'Kompletný jedálniček vrátane receptov, nákupného zoznamu a makier pre každé jedlo. Nastavený na spaľovanie tuku pri zachovaní svalovej hmoty...',
                        'is_exclusive' => true,
                    ],
                ],
            ],
            [
                'user' => [
                    'name' => 'Marek Blaho',
                    'email' => 'marek.blaho@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Profesionálny crossfit atlét a tréner. Trénujem jednotlivcov aj tímy, ktorí chcú byť funkčne silní, rýchli a odolní. Moje tréningy sú náročné, ale výsledky hovoria za všetko — moji klienti pravidelne prekonávajú vlastné limity.',
                    'specialization' => 'CrossFit & Funkčný tréning',
                    'monthly_price' => 34.99,
                ],
                'posts' => [
                    [
                        'title' => 'WOD tohto týždňa — Murph challenge',
                        'content' => 'Tento týždeň si dáme klasiku: 1 míľa beh, 100 pullupov, 200 klikov, 300 drepov, 1 míľa beh. Ako sa naň správne pripraviť...',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Mobility rutina pre crossfitérov — 20 minút denne',
                        'content' => 'Bez správnej mobility sa zraníš skôr či neskôr. Tu je môj overený protokol, ktorý robím každé ráno pred tréningom...',
                        'is_exclusive' => true,
                    ],
                ],
            ],
        ];

        foreach ($coaches as $data) {
            $user = User::create([
                'name' => $data['user']['name'],
                'email' => $data['user']['email'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $coach = Coach::create([
                'user_id' => $user->id,
                'bio' => $data['coach']['bio'],
                'specialization' => $data['coach']['specialization'],
                'monthly_price' => $data['coach']['monthly_price'],
                'is_verified' => true,
            ]);

            foreach ($data['posts'] as $post) {
                Post::create([
                    'coach_id' => $coach->id,
                    'title' => $post['title'],
                    'content' => $post['content'],
                    'is_exclusive' => $post['is_exclusive'],
                ]);
            }
        }

        // Test fan user
        User::create([
            'name' => 'Fanúšik Test',
            'email' => 'fan@pulse.sk',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $this->command->info('Seeded 3 coaches and 1 fan user.');
    }
}
