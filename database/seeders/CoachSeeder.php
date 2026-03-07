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
                    ['title' => 'Ako správne robiť drep', 'content' => 'Drep je kráľ cvikov, ale len ak ho robíš správne. Tu je 5 chýb, ktoré robí 90% ľudí v posilňovni — a ako ich opraviť ešte dnes.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 200],
                    ['title' => 'Technika drepu — reel', 'content' => 'Správny drep za 60 sekúnd. Chodidlá, kolená, chrbát.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 180],
                    ['title' => 'Ako robiť mŕtvy ťah — reel', 'content' => 'Základy mŕtveho ťahu od nuly. Bezpečnosť na prvom mieste.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 150],
                    ['title' => 'Ramenné svaly — reel tip', 'content' => 'Top 3 cviky pre väčšie ramená. Ukážem ti, čo skutočne funguje.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 120],
                    ['title' => 'Bench press — ako pridávať kilogramy každý týždeň', 'content' => 'Lineárna progresia je najefektívnejší spôsob ako sa zlepšovať na bench presse.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 90],
                    ['title' => 'Ranný tréning — záznamy z posilňovne', 'content' => 'Celý ranný tréning na videu. Motivácia, technika, výber váh.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 48],
                    ['title' => 'Môj 12-týždňový program — kompletný plán', 'content' => 'Program ti pomôže pribúdať 1–2 kg čistej svaloviny za mesiac.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 8],
                ],
            ],

            // ── Výživa ──
            [
                'user' => ['name' => 'Lucia Horáková', 'email' => 'lucia.horakova@pulse.sk'],
                'coach' => [
                    'bio' => 'Fitness trénerka a výživová poradkyňa. Po vlastnom prechode zo 82 kg na fit postavu som sa rozhodla pomáhať ženám, ktoré chcú zmeniť svoje telo aj myslenie.',
                    'specialization' => 'Výživa & Ženský fitness',
                    'monthly_price' => 7.99,
                    'rating' => 4.9,
                    'subscriber_count' => 891,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/31.jpg',
                    'avatar_file' => 'avatars/lucia-horakova.jpg',
                ],
                'posts' => [
                    ['title' => 'Prečo HIIT nestačí na spaľovanie tuku', 'content' => 'Mnoho žien si myslí, že čím viac kardio, tým lepší výsledok. Opak je pravdou.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 200],
                    ['title' => 'HIIT 30 minút doma — reel', 'content' => 'Spaľuj tuk efektívne aj bez posilňovne. Špeciálne pre ženy začiatočníčky.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 170],
                    ['title' => 'Raňajky za 5 minút — reel', 'content' => '30g proteínu za 5 minút. Môj obľúbený recept na výživné raňajky.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 140],
                    ['title' => 'Makrá v praxi — reel', 'content' => 'Ako sledovať makrá bez toho, aby si sa zbláznila. Jednoducho po slovensky.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 110],
                    ['title' => 'Moje obľúbené proteínové raňajky', 'content' => 'Tieto 3 recepty pripravíš za menej ako 10 minút a každý má cez 30g proteínu.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 80],
                    ['title' => 'Jedálniček na celý týždeň — 1600 kcal', 'content' => 'Kompletný jedálniček vrátane receptov a nákupného zoznamu.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 40],
                    ['title' => 'Recept: proteínový cheesecake bez pečenia', 'content' => 'Dezert ktorý chutí skvelo a pritom ti nepomýli makrá. 320 kcal, 28g proteínu.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 5],
                ],
            ],

            // ── CrossFit ──
            [
                'user' => ['name' => 'Marek Blaho', 'email' => 'marek.blaho@pulse.sk'],
                'coach' => [
                    'bio' => 'Profesionálny crossfit atlét a tréner. Trénujem jednotlivcov aj tímy, ktorí chcú byť funkčne silní, rýchli a odolní.',
                    'specialization' => 'CrossFit & Silový tréning',
                    'monthly_price' => 14.99,
                    'rating' => 4.6,
                    'subscriber_count' => 156,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/22.jpg',
                    'avatar_file' => 'avatars/marek-blaho.jpg',
                ],
                'posts' => [
                    ['title' => 'WOD tohto týždňa — Murph challenge', 'content' => 'Tento týždeň si dáme klasiku: 1 míľa beh, 100 pullupov, 200 klikov, 300 drepov.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 200],
                    ['title' => 'Pullup technika — reel', 'content' => 'Prvý pullup za 30 dní. Tento postup funguje garantovane.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 175],
                    ['title' => 'Muscle-up od nuly — reel', 'content' => 'Muscle-up krok za krokom. Začni tu, ak si ešte nevie ani urobiť pullup.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 145],
                    ['title' => 'Box jump technika — reel', 'content' => 'Správna technika skoku na bedňu. Bezpečne a výbušne.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 110],
                    ['title' => 'Výživa okolo WOD — pred, počas, po', 'content' => 'CrossFit tréningy sú energeticky veľmi náročné. Naučím ťa, ako fueling maximalizovať.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 80],
                    ['title' => 'Mobility rutina pre crossfitérov', 'content' => 'Bez správnej mobility sa zraníš skôr či neskôr. Môj overený protokol každé ráno.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 40],
                    ['title' => '8-týždňový CrossFit program pre začiatočníkov', 'content' => 'Zostavil som program špeciálne pre ľudí, ktorí s CrossFitom začínajú.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 5],
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
                    ['title' => '10-minútová ranná joga — reel', 'content' => 'Prebuď telo a nastavy myseľ. Ideálny štart do dňa.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 190],
                    ['title' => 'Dychové techniky — reel', 'content' => 'Pranayama za 60 sekúnd. Upokojenie mysle okamžite.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 160],
                    ['title' => 'Warrior poza — reel', 'content' => 'Ako správne vstúpiť do Warrior I, II a III. Základy Vinyasa jogy.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 130],
                    ['title' => 'Joga pre kancelárskych pracovníkov', 'content' => 'Sedíš 8 hodín denne? Tieto 4 polohy ťa zachránia pred chronickými bolesťami chrbta.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 100],
                    ['title' => 'Meditácia pred spánkom — 15 minút', 'content' => 'Uvoľni myseľ pred spaním s touto riadenou meditáciou.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 60],
                    ['title' => 'Yin joga pre hlboké uvoľnenie — 45 minút', 'content' => 'Yin joga pracuje s hlbokými tkanivami. Ideálna po náročnom týždni.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 10],
                    ['title' => '30-dňová joga výzva', 'content' => 'Každý deň nová lekcia, postupne náročnejšia. Po 30 dňoch zvládneš základné ásany.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 2],
                ],
            ],

            // ── Beh ──
            [
                'user' => ['name' => 'Peter Horváth', 'email' => 'peter.horvath@pulse.sk'],
                'coach' => [
                    'bio' => 'Maratónec a bežecký tréner. Prebehol som 14 maratónov vrátane Viedne, Berlína a Prahy. Trénujem bežcov všetkých úrovní.',
                    'specialization' => 'Beh & Vytrvalosť',
                    'monthly_price' => 8.99,
                    'rating' => 4.7,
                    'subscriber_count' => 289,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/67.jpg',
                    'avatar_file' => 'avatars/peter-horvath.jpg',
                ],
                'posts' => [
                    ['title' => 'Bežecká technika — reel', 'content' => 'Správny dopad chodidla, pohyb paží, naklonenie tela. Za 60 sekúnd.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 185],
                    ['title' => 'Intervalový tréning — reel', 'content' => '4×400m interval pre každého. Ako na to, aby si sa nezranil.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 155],
                    ['title' => 'Strečing po behu — reel', 'content' => '5 povinných strečingov po každom behu. Kratšie ako 3 minúty.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 120],
                    ['title' => 'Ako sa pripraviť na prvých 10 km', 'content' => 'Tu je môj 8-týždňový plán, ktorý ťa dostane do cieľa bez zranení.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 90],
                    ['title' => 'Ranný beh 5 km — záznamy z Petržalky', 'content' => 'Dnes som natočil ranný beh pozdĺž Dunaja. Krásne ráno.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 50],
                    ['title' => 'Tréningový plán na maratón — 16 týždňov', 'content' => 'Kompletný plán vrátane dlhých behov, intervalov, regenerácie a výžive.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 8],
                ],
            ],

            // ── Wellness ──
            [
                'user' => ['name' => 'Katarína Molnárová', 'email' => 'katarina.molnar@pulse.sk'],
                'coach' => [
                    'bio' => 'Wellness koučka a špecialistka na zvládanie stresu. Kombinujem vedecky overené metódy dýchania, pohybu a mentálnej hygieny.',
                    'specialization' => 'Wellness & Zvládanie stresu',
                    'monthly_price' => 11.99,
                    'rating' => 4.9,
                    'subscriber_count' => 512,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/57.jpg',
                    'avatar_file' => 'avatars/katarina-molnar.jpg',
                ],
                'posts' => [
                    ['title' => 'Dychové cvičenie 4-7-8 — reel', 'content' => 'Technika, ktorá zníži kortizol za 2 minúty. Vyskúšaj teraz.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 195],
                    ['title' => 'Ranný wellness rituál — reel', 'content' => 'Môj 10-minútový rituál každé ráno. Denník, dýchanie, pohyb.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 165],
                    ['title' => 'Body scan meditácia — reel', 'content' => 'Uvoľni napätie v tele za 90 sekúnd. Kedykoľvek, kdekoľvek.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 135],
                    ['title' => 'Spánok je superzbraň — tipy', 'content' => '7–9 hodín kvalitného spánku je dôležitejších ako akýkoľvek doplnok.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 100],
                    ['title' => 'Guided meditácia — uvoľnenie napätia (30 min)', 'content' => 'Táto riadená meditácia ťa naučí vnímať a uvoľňovať napätie v tele.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 55],
                    ['title' => '7-dňový wellness reset — protokol', 'content' => 'Celý týždeň krok po kroku: spánková rutina, ranné rituály, výživa, pohyb.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 6],
                ],
            ],

            // ── Pilates ──
            [
                'user' => ['name' => 'Jana Novotná', 'email' => 'jana.novotna@pulse.sk'],
                'coach' => [
                    'bio' => 'Certifikovaná Pilates inštruktorka a fyzioterapeutka. Pomáham ľuďom posilniť stred tela, zlepšiť držanie tela a eliminovať bolesti chrbta. 7 rokov praxe.',
                    'specialization' => 'Pilates & Core',
                    'monthly_price' => 8.99,
                    'rating' => 4.8,
                    'subscriber_count' => 445,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/12.jpg',
                    'avatar_file' => 'avatars/jana-novotna.jpg',
                ],
                'posts' => [
                    ['title' => 'Plank variácie — reel', 'content' => 'Tri variácie planku pre silnejší core. Začni od základu.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 190],
                    ['title' => 'The Hundred — reel', 'content' => 'Klasický Pilates cvik The Hundred. Správna technika za 60 sekúnd.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 160],
                    ['title' => 'Rollup technika — reel', 'content' => 'Rollup bez pomocných rúk. Posil chrbtové svalstvo správne.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 130],
                    ['title' => 'Pilates pre boľavý chrbát', 'content' => 'Tieto cviky odporúčam každému, kto sedí v kancelárii. Bolesti chrbta sú riešiteľné.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 100],
                    ['title' => 'Pilates s pomôckami — loop band', 'content' => 'Ako využiť odporový pás v Pilates cvičení. Kompletný tréning.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 60],
                    ['title' => '30-minútový Pilates mat tréning', 'content' => 'Kompletný tréning na podložke bez pomôcok. Pre stredne pokročilých.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 12],
                    ['title' => 'Prečo Pilates nie je len pre ženy', 'content' => 'Mnohí profesionálni športovci zaradili Pilates do prípravy. Vysvetlím prečo.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 3],
                ],
            ],

            // ── Funkčný tréning ──
            [
                'user' => ['name' => 'Martin Šimko', 'email' => 'martin.simko@pulse.sk'],
                'coach' => [
                    'bio' => 'Funkčný tréner a S&C koach. Trénujem profesionálnych športovcov aj bežných ľudí, ktorí chcú pohyb v každodennom živote. Baví ma nachádzať individuálny prístup ku každému klientovi.',
                    'specialization' => 'Funkčný tréning & S&C',
                    'monthly_price' => 13.99,
                    'rating' => 4.7,
                    'subscriber_count' => 203,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/33.jpg',
                    'avatar_file' => 'avatars/martin-simko.jpg',
                ],
                'posts' => [
                    ['title' => 'Kettlebell swing — reel', 'content' => 'Správny swing je základ kettlebell tréningu. Neber si viac, ako zvládneš.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 185],
                    ['title' => 'Turkish get-up — reel', 'content' => 'Najkomplexnejší pohyb v silovom tréningu. Krok za krokom.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 155],
                    ['title' => 'Farmer carry variácie — reel', 'content' => 'Farmer carry posilní celé telo. Tri variácie pre rôzne ciele.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 125],
                    ['title' => 'Prečo funkčný tréning trumpuje izolačné cviky', 'content' => 'Vysvetlím ti, prečo cviky s vlastnou váhou a kettlebell prinášajú lepšie výsledky.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 95],
                    ['title' => 'Kompletný kettlebell tréning — 45 minút', 'content' => 'Celý tréning s kettlebell od rozcvičenia po strečing. Stredne pokročilí.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 50],
                    ['title' => 'Atletická príprava — plyometria', 'content' => 'Výbušnosť a rýchlosť sú trénovateľné. Môj protokol pre atletov.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 10],
                ],
            ],

            // ── Box ──
            [
                'user' => ['name' => 'Radoslav Oravec', 'email' => 'radoslav.oravec@pulse.sk'],
                'coach' => [
                    'bio' => 'Profesionálny boxer a kondičný tréner. 12 rokov na ringoch Slovenska a Česka. Trénujem bojovníkov aj ľudí, ktorí hľadajú najefektívnejší spôsob, ako zhodiť tuk a nabrať sebavedomie.',
                    'specialization' => 'Box & Bojové umenia',
                    'monthly_price' => 15.99,
                    'rating' => 4.5,
                    'subscriber_count' => 178,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/52.jpg',
                    'avatar_file' => 'avatars/radoslav-oravec.jpg',
                ],
                'posts' => [
                    ['title' => 'Jab-cross kombinácia — reel', 'content' => 'Základná kombinácia pre začiatočníkov. Rýchlosť príde s opakovaním.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 180],
                    ['title' => 'Pohyb nôh v boxe — reel', 'content' => 'Footwork je základ. Bez pohybu nôh ťa každý trafí.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 150],
                    ['title' => 'Shadow box tréning — reel', 'content' => '3 minúty shadow boxu pre maximálne spaľovanie tuku. Vyskúšaj teraz.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 120],
                    ['title' => 'Box ako cardio — prečo je lepší ako beh', 'content' => 'Box spáli v priemere 700 kcal/hod a pritom posilní celé telo. Porovnanie.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 90],
                    ['title' => 'Vak tréning pre začiatočníkov — 30 minút', 'content' => 'Kompletný tréning na vaku. Naučíš sa správne biť a neporaníš si ruky.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 45],
                    ['title' => '8-týždňová boxerská kondícia', 'content' => 'Program pre ľudí, ktorí nikdy neboxovali, ale chcú boxerské telo.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 7],
                ],
            ],

            // ── Strečing ──
            [
                'user' => ['name' => 'Eva Kováčová', 'email' => 'eva.kovacova@pulse.sk'],
                'coach' => [
                    'bio' => 'Špecialistka na mobilitu a strečing. Po vážnom zranení kolena som si sama obnovila pohyb cez cielenou strečing a mobilizačné cvičenia. Teraz pomáham iným robiť to isté.',
                    'specialization' => 'Strečing & Mobilita',
                    'monthly_price' => 6.99,
                    'rating' => 4.9,
                    'subscriber_count' => 623,
                    'avatar_url' => 'https://randomuser.me/api/portraits/women/23.jpg',
                    'avatar_file' => 'avatars/eva-kovacova.jpg',
                ],
                'posts' => [
                    ['title' => 'Ranný strečing 5 minút — reel', 'content' => 'Prebuď stuhnuté svaly za 5 minút. Každé ráno bez výnimky.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 188],
                    ['title' => 'Hip flexor uvoľnenie — reel', 'content' => 'Sedavý spôsob života ničí hip flexory. Toto sú 2 najlepšie polohy.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 158],
                    ['title' => 'Hrudný strečing — reel', 'content' => 'Uvoľni hrudník a zlepši držanie tela. Ideálne po práci za počítačom.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 128],
                    ['title' => 'Ako zvýšiť flexibilitu za 30 dní', 'content' => 'Konkrétny plán, ktorý funguje aj bez predchádzajúcej flexibility.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 98],
                    ['title' => 'Mobilita ramien a krku — kompletná rutina', 'content' => 'Ak cítiš napätie v ramenách a krku, toto je pre teba. 20 minút denne.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 55],
                    ['title' => 'Full body strečing — 40 minút', 'content' => 'Kompletný strečing celého tela. Ideálne na záver náročného dňa.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 9],
                    ['title' => 'Strečing pred spaním — lepší spánok garantovaný', 'content' => 'Tieto 4 polohy pred spaním znížia napätie a zlepšia kvalitu spánku.', 'media_type' => 'image', 'is_exclusive' => false, 'hours_ago' => 1],
                ],
            ],

            // ── Cyklistika ──
            [
                'user' => ['name' => 'Michal Dubovský', 'email' => 'michal.dubovsky@pulse.sk'],
                'coach' => [
                    'bio' => 'Cyklista a triatlonista. Dokončil som Ironman Zürich a Bratislava Triathlon. Trénujem cyklistov aj triatlonistov od hobbyistov po tých, ktorí chcú závodiť.',
                    'specialization' => 'Cyklistika & Triathlon',
                    'monthly_price' => 10.99,
                    'rating' => 4.6,
                    'subscriber_count' => 267,
                    'avatar_url' => 'https://randomuser.me/api/portraits/men/78.jpg',
                    'avatar_file' => 'avatars/michal-dubovsky.jpg',
                ],
                'posts' => [
                    ['title' => 'Kadencia vs sila v pedálovaní — reel', 'content' => 'Vyššia kadencia alebo väčší odpor? Vysvetlím za 60 sekúnd.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 182],
                    ['title' => 'Nastavenie sedla na bicykli — reel', 'content' => 'Zlé nastavenie sedla = bolesti kolien. Správne nastavenie za 2 minúty.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 152],
                    ['title' => 'Triatlonový beh z bicykla — reel', 'content' => 'Transition z bicykla na beh je špeciálna zručnosť. Tréning nôh.', 'media_type' => 'video', 'is_exclusive' => false, 'hours_ago' => 122],
                    ['title' => 'Výživa počas dlhej jazdy na bicykli', 'content' => 'Ako sa stravovať počas 3+ hodinových jázd. Čo a kedy jesť.', 'media_type' => 'none', 'is_exclusive' => false, 'hours_ago' => 92],
                    ['title' => 'Intervalový tréning na bicykli — 60 minút', 'content' => 'VO2max tréning pre zlepšenie vytrvalosti. Kompletný protokol.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 48],
                    ['title' => 'Príprava na prvý triathlon — 12 týždňov', 'content' => 'Kompletný plán pre plávanie, bicykel aj beh. Reálne ciele pre bežného človeka.', 'media_type' => 'video', 'is_exclusive' => true, 'hours_ago' => 6],
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
                    'coach_id'     => $coach->id,
                    'title'        => $postData['title'],
                    'content'      => $postData['content'],
                    'media_type'   => $postData['media_type'] ?? 'none',
                    'is_exclusive' => $postData['is_exclusive'],
                ]);

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

        User::create([
            'name'               => 'Dominik Haluza',
            'email'              => 'dominik@haluza.sk',
            'role'               => 'coach',
            'password'           => Hash::make('password'),
            'email_verified_at'  => now(),
        ]);

        $count = count($coaches);
        $this->command->info("Seeded {$count} coaches, 1 fan user, and extra accounts.");
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
            'jana.novotna@pulse.sk',
            'martin.simko@pulse.sk',
            'radoslav.oravec@pulse.sk',
            'eva.kovacova@pulse.sk',
            'michal.dubovsky@pulse.sk',
            'fan@pulse.sk',
            'dominik@haluza.sk',
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
