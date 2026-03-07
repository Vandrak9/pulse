<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class CoachSeeder extends Seeder
{
    public function run(): void
    {
        $this->cleanup();

        $coaches = [
            // ── Silový ──
            [
                'user' => ['name' => 'Tomáš Kováč', 'email' => 'tomas.kovac@pulse.sk'],
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
                    ['title' => 'Ako správne robiť drep', 'content' => 'Drep je kráľ cvikov, ale len ak ho robíš správne. Tu je 5 chýb, ktoré robí 90% ľudí v posilňovni — a ako ich opraviť ešte dnes.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 96],
                    ['title' => 'Technika drepu pre začiatočníkov — video', 'content' => 'Kompletný video návod na správnu techniku drepu krok za krokom. Ukážem ti nastavenie stopy, hĺbku, polohu chrbta aj dýchanie.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 72],
                    ['title' => 'Top 5 cvikov pre väčšie ramená', 'content' => 'Ramená sú pre mnohých problémová partia. Tu sú moje obľúbené cviky, ktoré zaručene fungujú — overené na stovkách klientov.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 48],
                    ['title' => 'Bench press — ako pridávať kilogramy každý týždeň', 'content' => 'Lineárna progresia je najefektívnejší spôsob ako sa zlepšovať na bench presse. Ukážem ti môj overený postup.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 24],
                    ['title' => 'Ranný tréning o 6:00 — záznamy z posilňovne', 'content' => 'Dnes som natočil celý ranný tréning. Motivácia, technika, výber váh — všetko naživo.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 8],
                    ['title' => 'Môj program na 12 týždňov — kompletný plán', 'content' => 'Tento program ti pomôže pribúdať 1–2 kg čistej svaloviny za mesiac. Obsahuje rozdelenie tréningov, výživový plán a tipy na regeneráciu. Garantujem výsledky.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 3],
                    ['title' => 'Výživa pre silu — čo jiem pred aj po tréningu', 'content' => 'Predtréningové jedlo ovplyvní tvoj výkon o 20–30%. Tu je to, čo jiem ja a čo odporúčam klientom.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 1],
                ],
            ],

            // ── Výživa ──
            [
                'user' => ['name' => 'Lucia Horáková', 'email' => 'lucia.horakova@pulse.sk'],
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
                    ['title' => 'Prečo HIIT nestačí na spaľovanie tuku', 'content' => 'Mnoho žien si myslí, že čím viac kardio, tým lepší výsledok. Opak je pravdou — tu je vysvetlenie podložené vedeckými štúdiami.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 120],
                    ['title' => 'HIIT tréning doma bez náradia — 30 minút', 'content' => 'Spaľuj tuk efektívne aj bez posilňovne. Tento tréning som zostavila špeciálne pre ženy začiatočníčky.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 80],
                    ['title' => 'Moje obľúbené proteínové raňajky', 'content' => 'Tieto 3 recepty pripravíš za menej ako 10 minút a každý má cez 30g proteínu. Ideálne pre rušné ráno.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 50],
                    ['title' => 'Ako vypočítať svoje TDEE a makrá', 'content' => 'TDEE (Total Daily Energy Expenditure) je základ každého úspešného stravovacieho plánu. Naučím ťa, ako ho presne vypočítať.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 28],
                    ['title' => 'Jedálniček na celý týždeň — 1600 kcal', 'content' => 'Kompletný jedálniček vrátane receptov, nákupného zoznamu a makier pre každé jedlo. Zostavený pre ženy so sedavým zamestnaním.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 10],
                    ['title' => 'Recept: proteínový cheesecake bez pečenia', 'content' => 'Dezert ktorý chutí skvelo a pritom ti nepomýli makrá. 320 kcal na porciu, 28g proteínu.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 2],
                ],
            ],

            // ── CrossFit ──
            [
                'user' => ['name' => 'Marek Blaho', 'email' => 'marek.blaho@pulse.sk'],
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
                    ['title' => 'WOD tohto týždňa — Murph challenge', 'content' => 'Tento týždeň si dáme klasiku: 1 míľa beh, 100 pullupov, 200 klikov, 300 drepov, 1 míľa beh. Ako sa naň správne pripraviť a neprehorieť.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 110],
                    ['title' => 'Ranný strečing 20 minút — CrossFit recovery', 'content' => 'Ideálna ranná rutina po náročnom WOD. Zamerajme sa na bedrá, plecia a hrudník.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 70],
                    ['title' => 'Ako robiť muscle-up od nuly', 'content' => 'Muscle-up je jeden z najtesnejších crossfit pohybov. Tu je postupný plán od nulových začiatočníkov.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 44],
                    ['title' => 'Výživa okolo WOD — pred, počas, po', 'content' => 'CrossFit tréningy sú energeticky veľmi náročné. Naučím ťa, ako fueling okolo tréningov maximalizovať.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 20],
                    ['title' => 'Mobility rutina pre crossfitérov — 20 minút denne', 'content' => 'Bez správnej mobility sa zraníš skôr či neskôr. Tu je môj overený protokol, ktorý robím každé ráno pred tréningom.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 5],
                    ['title' => 'Môj 8-týždňový CrossFit program — úplné začiatočník', 'content' => 'Zostavil som program špeciálne pre ľudí, ktorí s CrossFitom začínajú. Žiadne predchádzajúce skúsenosti nie sú potrebné.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 1],
                ],
            ],

            // ── Joga ──
            [
                'user' => ['name' => 'Zuzana Procházková', 'email' => 'zuzana.prochazka@pulse.sk'],
                'coach' => [
                    'bio' => 'Certifikovaná inštruktorka jogy s 6-ročnou praxou. Vyštudovala som Hatha a Vinyasa jogu v Indii. Pomáham ľuďom nájsť rovnováhu medzi telom a mysľou.',
                    'specialization' => 'Joga & Meditácia',
                    'monthly_price' => 9.99,
                    'rating' => 5.0,
                    'subscriber_count' => 674,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/44.jpg',
                    'avatar_file' => 'avatars/zuzana-prochazka.jpg',
                ],
                'posts' => [
                    ['title' => '10-minútová ranná joga pre začiatočníkov', 'content' => 'Ideálny štart do dňa — táto krátka rutina prebudí telo, uvoľní stuhnuté svaly a nastaví pozitívnu myseľ. Žiadne pomôcky nie sú potrebné.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 130],
                    ['title' => 'Meditácia pred spánkom — 15 minút', 'content' => 'Uvoľni myseľ pred spaním s touto riadenou meditáciou. Pomôže ti znížiť kortizol a zlepšiť kvalitu spánku.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 90],
                    ['title' => 'Joga pre kancelárskych pracovníkov — uvoľnenie chrbta', 'content' => 'Sedíš 8 hodín denne? Tieto 4 polohy ťa zachránia pred chronickými bolesťami chrbta.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 55],
                    ['title' => 'Čo je Vinyasa joga a prečo ju milujem', 'content' => 'Vinyasa joga je dynamický štýl, kde pohyby plynú v synchronizácii s dychom. Vysvetlím ti základné princípy a prečo je ideálna pre aktívnych ľudí.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 30],
                    ['title' => 'Yin joga pre hlboké uvoľnenie — 45 minút', 'content' => 'Yin joga pracuje s hlbokými tkanivami — fasciami a väzivom. Ideálna po náročnom týždni.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 12],
                    ['title' => '30-dňová joga výzva — kompletný program', 'content' => 'Každý deň nová lekcia, postupne náročnejšia. Program je zostavený tak, aby si po 30 dňoch zvládol základné ásany správne a bez bolesti.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 4],
                ],
            ],

            // ── Beh ──
            [
                'user' => ['name' => 'Peter Horváth', 'email' => 'peter.horvath@pulse.sk'],
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
                    ['title' => 'Ako sa pripraviť na prvých 10 km', 'content' => 'Desiatka je snom každého začínajúceho bežca. Tu je môj 8-týždňový plán, ktorý ťa dostane do cieľa bez zranení a s úsmevom.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 100],
                    ['title' => 'Bežecká technika pre začiatočníkov — video rozbor', 'content' => 'Správna technika behu ti ušetrí kolená a zlepší výkon. Analyzujem 5 najčastejších chýb začiatočníkov.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 68],
                    ['title' => 'Prečo je pomalý beh dôležitejší ako intervalový', 'content' => 'Väčšina bežcov robí príliš veľa záťaže a príliš málo regeneračného behu. Vysvetlím ti princíp 80/20.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 40],
                    ['title' => 'Ranný beh 5 km — záznamy z Petržalky', 'content' => 'Dnes som natočil ranný beh pozdĺž Dunaja. Krásne ráno a veľa myšlienok o disciplíne a konzistencii.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 18],
                    ['title' => 'Strečing po behu — 15 minút (povinné!)', 'content' => 'Ak vynecháš strečing, zaplatíš za to neskôr. Tu je moja minimálna rutina po každom behu.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 6],
                    ['title' => 'Tréningový plán na maratón — 16 týždňov', 'content' => 'Kompletný plán vrátane dlhých behov, intervalov, regenerácie a výživovej stratégie na deň preteku. Odskúšané na vlastnej koži aj so stovkami klientov.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 2],
                ],
            ],

            // ── Wellness ──
            [
                'user' => ['name' => 'Katarína Molnárová', 'email' => 'katarina.molnar@pulse.sk'],
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
                    ['title' => 'Dychové cvičenie na okamžité upokojenie', 'content' => 'Technika 4-7-8 dýchania dokáže znížiť hladinu kortizolu za menej ako 2 minúty. Vysvetlím ti, prečo to funguje a ako ju správne robiť.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 115],
                    ['title' => 'Ranný wellness rituál — 10 minút každé ráno', 'content' => 'Jednoduchá rutina, ktorá zmení tvoj deň. Denník, dýchanie a pohyb — všetko do 10 minút.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 75],
                    ['title' => 'Ako stres ničí tvoje výsledky v posilňovni', 'content' => 'Chronický stres zvyšuje kortizol, ktorý priamo blokuje spaľovanie tuku a budovanie svalu. Vysvetlenie a riešenia.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 45],
                    ['title' => 'Spánok je superzbraň — ako ho optimalizovať', 'content' => '7–9 hodín kvalitného spánku je dôležitejších ako akýkoľvek doplnok. Tu sú konkrétne tipy na zlepšenie kvality spánku.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 22],
                    ['title' => 'Guided meditácia — uvoľnenie napätia v tele (30 min)', 'content' => 'Táto riadená meditácia cez body scan ťa naučí vnímať a uvoľňovať napätie v jednotlivých častiach tela.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 7],
                    ['title' => 'Môj 7-dňový wellness reset — protokol', 'content' => 'Celý týždeň krok po kroku: spánková rutina, ranné rituály, výživa, pohyb a digitálny detox. Klienti hlásia o 60% nižší stres už po prvom týždni.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 1],
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
                'name'               => $data['user']['name'],
                'email'              => $data['user']['email'],
                'role'               => 'coach',
                'password'           => Hash::make('password'),
                'email_verified_at'  => now(),
            ]);

            $coach = Coach::create([
                'user_id'          => $user->id,
                'bio'              => $data['coach']['bio'],
                'specialization'   => $data['coach']['specialization'],
                'monthly_price'    => $data['coach']['monthly_price'],
                'rating'           => $data['coach']['rating'],
                'subscriber_count' => $data['coach']['subscriber_count'],
                'avatar_path'      => $avatarPath,
                'is_verified'      => true,
            ]);

            foreach ($data['posts'] as $postData) {
                $timestamp = Carbon::now()->subHours($postData['hours_ago']);

                $post = Post::create([
                    'coach_id'       => $coach->id,
                    'title'          => $postData['title'],
                    'content'        => $postData['content'],
                    'media_type'     => $postData['media_type'] ?? 'none',
                    'video_duration' => $postData['video_duration'] ?? null,
                    'is_exclusive'   => $postData['is_exclusive'],
                ]);

                // Override auto-set timestamps with realistic past times
                $post->created_at = $timestamp;
                $post->updated_at = $timestamp;
                $post->save();
            }

            $status = $avatarPath ? 'photo OK' : 'no photo';
            $this->command->line("  <fg=green>✓</> {$data['user']['name']} | ⭐ {$data['coach']['rating']} | {$data['coach']['subscriber_count']} sledovateľov ({$status})");
        }

        User::create([
            'name'               => 'Fanúšik Test',
            'email'              => 'fan@pulse.sk',
            'role'               => 'fan',
            'password'           => Hash::make('password'),
            'email_verified_at'  => now(),
        ]);

        $this->command->info('Seeded 6 coaches (6 posts each) and 1 fan user.');
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
