<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class CoachSeeder extends Seeder
{
    public function run(): void
    {
        $this->cleanup();

        $coaches = [
            [
                'user' => [
                    'name' => 'Tomáš Kováč',
                    'email' => 'tomas.kovac@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Som certifikovaný silový tréner s viac ako 8 rokmi skúseností. Špecializujem sa na budovanie svalovej hmoty a zvyšovanie výkonnosti. Prešiel som stovkami klientov od začiatočníkov až po pokročilých atlétov.',
                    'specialization' => 'Silový tréning & Hypertrofia',
                    'monthly_price' => 12.99,
                    'rating' => 4.8,
                    'subscriber_count' => 342,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/45.jpg',
                    'avatar_file' => 'avatars/tomas-kovac.jpg',
                ],
                'posts' => [
                    [
                        'title' => 'Ako správne robiť drep',
                        'content' => 'Drep je kráľ cvikov, ale len ak ho robíš správne. Tu je 5 chýb, ktoré robí 90% ľudí v posilňovni...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Technika drepu pre začiatočníkov — video',
                        'content' => 'Kompletný video návod na správnu techniku drepu krok za krokom.',
                        'media_type' => 'video',
                        'video_duration' => '14:22',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Môj program na 12 týždňov — kompletný plán',
                        'content' => 'Tento program ti pomôže pribúdať 1–2 kg čistej svaloviny za mesiac. Obsahuje rozdelenie tréningov, výživový plán a tipy na regeneráciu...',
                        'media_type' => 'video',
                        'video_duration' => '28:45',
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
                    'bio' => 'Fitness trénerka a výživová poradkyňa. Po vlastnom prechode zo 82 kg na fit postavu som sa rozhodla pomáhať ženám, ktoré chcú zmeniť svoje telo aj myslenie. Zdravá výživa a pohyb sú základ.',
                    'specialization' => 'Výživa & Ženský fitness',
                    'monthly_price' => 7.99,
                    'rating' => 4.9,
                    'subscriber_count' => 891,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/31.jpg',
                    'avatar_file' => 'avatars/lucia-horakova.jpg',
                ],
                'posts' => [
                    [
                        'title' => 'Prečo HIIT nestačí na spaľovanie tuku',
                        'content' => 'Mnoho žien si myslí, že čím viac kardio, tým lepší výsledok. Opak je pravdou — tu je vysvetlenie, prečo...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'HIIT tréning doma bez náradia — 30 minút',
                        'content' => 'Spaľuj tuk efektívne aj bez posilňovne.',
                        'media_type' => 'video',
                        'video_duration' => '31:08',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Jedálniček na celý týždeň — 1600 kcal',
                        'content' => 'Kompletný jedálniček vrátane receptov, nákupného zoznamu a makier pre každé jedlo.',
                        'media_type' => 'video',
                        'video_duration' => '18:55',
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
                    'bio' => 'Profesionálny crossfit atlét a tréner. Trénujem jednotlivcov aj tímy, ktorí chcú byť funkčne silní, rýchli a odolní. Moje tréningy sú náročné, ale výsledky hovoria za všetko.',
                    'specialization' => 'CrossFit & Silový tréning',
                    'monthly_price' => 14.99,
                    'rating' => 4.6,
                    'subscriber_count' => 156,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/22.jpg',
                    'avatar_file' => 'avatars/marek-blaho.jpg',
                ],
                'posts' => [
                    [
                        'title' => 'WOD tohto týždňa — Murph challenge',
                        'content' => 'Tento týždeň si dáme klasiku: 1 míľa beh, 100 pullupov, 200 klikov, 300 drepov, 1 míľa beh. Ako sa naň správne pripraviť...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Ranný strečing 20 minút — CrossFit recovery',
                        'content' => 'Ideálna ranná rutina po náročnom WOD.',
                        'media_type' => 'video',
                        'video_duration' => '20:14',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Mobility rutina pre crossfitérov — 20 minút denne',
                        'content' => 'Bez správnej mobility sa zraníš skôr či neskôr. Tu je môj overený protokol, ktorý robím každé ráno pred tréningom...',
                        'media_type' => 'video',
                        'video_duration' => '22:30',
                        'is_exclusive' => true,
                    ],
                ],
            ],

            // ── Joga ──
            [
                'user' => [
                    'name' => 'Zuzana Procházková',
                    'email' => 'zuzana.prochazka@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Certifikovaná inštruktorka jogy s 6-ročnou praxou. Vyštudovala som Hatha a Vinyasa jogu v Indii. Pomáham ľuďom nájsť rovnováhu medzi telom a mysľou — či už si začiatočník alebo pokročilý.',
                    'specialization' => 'Joga & Meditácia',
                    'monthly_price' => 9.99,
                    'rating' => 5.0,
                    'subscriber_count' => 674,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/44.jpg',
                    'avatar_file' => 'avatars/zuzana-prochazka.jpg',
                ],
                'posts' => [
                    [
                        'title' => '10-minútová ranná joga pre začiatočníkov',
                        'content' => 'Ideálny štart do dňa — táto krátka rutina prebudí telo, uvoľní stuhnuté svaly a nastaví pozitívnu myseľ na celý deň. Žiadne pomôcky nie sú potrebné...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Meditácia pred spánkom — 15 minút',
                        'content' => 'Uvoľni myseľ pred spaním s touto riadenou meditáciou.',
                        'media_type' => 'video',
                        'video_duration' => '15:00',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => '30-dňová joga výzva — kompletný program',
                        'content' => 'Každý deň nová lekcia, postupne náročnejšia. Program je zostavený tak, aby si po 30 dňoch zvládol základné ásany správne a bez bolesti...',
                        'media_type' => 'video',
                        'video_duration' => '45:12',
                        'is_exclusive' => true,
                    ],
                ],
            ],

            // ── Beh ──
            [
                'user' => [
                    'name' => 'Peter Horváth',
                    'email' => 'peter.horvath@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Maratónec a bežecký tréner. Prebehol som 14 maratónov vrátane Viedne, Berlína a Prahy. Trénujem bežcov všetkých úrovní — od prvých 5 km až po prípravu na maratón pod 4 hodiny.',
                    'specialization' => 'Beh & Vytrvalosť',
                    'monthly_price' => 8.99,
                    'rating' => 4.7,
                    'subscriber_count' => 289,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/67.jpg',
                    'avatar_file' => 'avatars/peter-horvath.jpg',
                ],
                'posts' => [
                    [
                        'title' => 'Ako sa pripraviť na prvých 10 km',
                        'content' => 'Desiatka je snom každého začínajúceho bežca. Tu je môj 8-týždňový plán, ktorý ťa dostane do cieľa bez zranení a s úsmevom...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Bežecká technika pre začiatočníkov — video rozbor',
                        'content' => 'Správna technika behu ti ušetrí kolená a zlepší výkon.',
                        'media_type' => 'video',
                        'video_duration' => '12:34',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Tréningový plán na maratón — 16 týždňov',
                        'content' => 'Kompletný plán vrátane dlhých behov, intervalov, regenerácie a výživovej stratégie na deň preteku. Odskúšané na vlastnej koži aj so stovkami klientov...',
                        'media_type' => 'video',
                        'video_duration' => '38:20',
                        'is_exclusive' => true,
                    ],
                ],
            ],

            // ── Wellness ──
            [
                'user' => [
                    'name' => 'Katarína Molnárová',
                    'email' => 'katarina.molnar@pulse.sk',
                ],
                'coach' => [
                    'bio' => 'Wellness koučka a špecialistka na zvládanie stresu. Kombinujem vedecky overené metódy dýchania, pohybu a mentálnej hygieny. Pomáham ľuďom žiť plnohodnotnejší a vyrovnanejší život.',
                    'specialization' => 'Wellness & Zvládanie stresu',
                    'monthly_price' => 11.99,
                    'rating' => 4.9,
                    'subscriber_count' => 512,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/57.jpg',
                    'avatar_file' => 'avatars/katarina-molnar.jpg',
                ],
                'posts' => [
                    [
                        'title' => 'Dychové cvičenie na okamžité upokojenie',
                        'content' => 'Technika 4-7-8 dýchania dokáže znížiť hladinu kortizolu za menej ako 2 minúty. Vysvetlím ti, prečo to funguje a ako ju správne robiť...',
                        'media_type' => 'none',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Ranný wellness rituál — 10 minút každé ráno',
                        'content' => 'Jednoduchá rutina ktorá zmení tvoj deň.',
                        'media_type' => 'video',
                        'video_duration' => '10:05',
                        'is_exclusive' => false,
                    ],
                    [
                        'title' => 'Môj 7-dňový wellness reset — protokol',
                        'content' => 'Celý týždeň krok po kroku: spánková rutina, ranné rituály, výživa, pohyb a digitálny detox. Klienti hlásia o 60% nižší stres už po prvom týždni...',
                        'media_type' => 'video',
                        'video_duration' => '52:18',
                        'is_exclusive' => true,
                    ],
                ],
            ],
        ];

        Storage::disk('public')->makeDirectory('avatars');

        foreach ($coaches as $data) {
            $avatarPath = $this->downloadAvatar(
                $data['coach']['avatar_url'],
                $data['coach']['avatar_file'],
            );

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
                'rating' => $data['coach']['rating'],
                'subscriber_count' => $data['coach']['subscriber_count'],
                'avatar_path' => $avatarPath,
                'is_verified' => true,
            ]);

            foreach ($data['posts'] as $post) {
                Post::create([
                    'coach_id' => $coach->id,
                    'title' => $post['title'],
                    'content' => $post['content'],
                    'media_type' => $post['media_type'] ?? 'none',
                    'video_duration' => $post['video_duration'] ?? null,
                    'is_exclusive' => $post['is_exclusive'],
                ]);
            }

            $status = $avatarPath ? 'photo OK' : 'no photo';
            $this->command->line("  <fg=green>✓</> {$data['user']['name']} | ⭐ {$data['coach']['rating']} | {$data['coach']['subscriber_count']} sledovateľov ({$status})");
        }

        User::create([
            'name' => 'Fanúšik Test',
            'email' => 'fan@pulse.sk',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $this->command->info('Seeded 6 coaches and 1 fan user.');
    }

    private function downloadAvatar(string $url, string $path): ?string
    {
        try {
            $response = Http::timeout(10)->get($url);
            if ($response->successful()) {
                Storage::disk('public')->put($path, $response->body());
                return $path;
            }
        } catch (\Exception $e) {
            $this->command->warn("Could not download avatar from {$url}: {$e->getMessage()}");
        }

        return null;
    }

    private function cleanup(): void
    {
        $emails = [
            'tomas.kovac@pulse.sk',
            'lucia.horakova@pulse.sk',
            'marek.blaho@pulse.sk',
            'zuzana.prochazka@pulse.sk',
            'peter.horvath@pulse.sk',
            'katarina.molnar@pulse.sk',
            'fan@pulse.sk',
        ];

        foreach (User::whereIn('email', $emails)->get() as $user) {
            if ($user->coach) {
                if ($user->coach->avatar_path) {
                    Storage::disk('public')->delete($user->coach->avatar_path);
                }
                $user->coach->posts()->delete();
                $user->coach->delete();
            }
            $user->delete();
        }
    }
}
