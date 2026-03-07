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
                    'monthly_price' => 29.99,
                    'rating' => 4.8,
                    'subscriber_count' => 342,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/45.jpg',
                    'avatar_file' => 'avatars/tomas-kovac.jpg',
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
                    'bio' => 'Fitness trénerka a výživová poradkyňa. Po vlastnom prechode zo 82 kg na fit postavu som sa rozhodla pomáhať ženám, ktoré chcú zmeniť svoje telo aj myslenie. Zdravá výživa a pohyb sú základ.',
                    'specialization' => 'Výživa & Ženský fitness',
                    'monthly_price' => 24.99,
                    'rating' => 4.9,
                    'subscriber_count' => 891,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/31.jpg',
                    'avatar_file' => 'avatars/lucia-horakova.jpg',
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
                    'bio' => 'Profesionálny crossfit atlét a tréner. Trénujem jednotlivcov aj tímy, ktorí chcú byť funkčne silní, rýchli a odolní. Moje tréningy sú náročné, ale výsledky hovoria za všetko.',
                    'specialization' => 'CrossFit & Silový tréning',
                    'monthly_price' => 34.99,
                    'rating' => 4.6,
                    'subscriber_count' => 156,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/22.jpg',
                    'avatar_file' => 'avatars/marek-blaho.jpg',
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

        $this->command->info('Seeded 3 coaches and 1 fan user.');
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
