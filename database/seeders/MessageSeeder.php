<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Message;
use App\Models\Broadcast;
use App\Models\BroadcastRecipient;
use Carbon\Carbon;

class MessageSeeder extends Seeder
{
    public function run(): void
    {
        Message::truncate();
        BroadcastRecipient::truncate();
        Broadcast::truncate();

        $fan = User::where('email', 'dominik@haluza.sk')->first();
        if (!$fan) {
            $fan = User::where('email', 'fan@pulse.sk')->first();
        }
        if (!$fan) return;

        $coaches = User::whereHas('coach')->take(3)->get();

        $conversations = [
            [
                'messages' => [
                    ['from' => 'coach', 'content' => 'Ahoj! Vitaj na PULSE. Som rád, že si sa prihlásil na odber. Čo ťa priviedlo k silovému tréningu?', 'hours_ago' => 48, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Zdravím! Chcem nabrať svalovú hmotu a zlepšiť celkovú kondíciu. Kde odporúčaš začať?', 'hours_ago' => 47, 'is_read' => true],
                    ['from' => 'coach', 'content' => 'Super cieľ! Odporúčam začať so základnými cvikmi — drep, mŕtvy ťah, benchpress. Máš skúsenosti s týmito cvikmi?', 'hours_ago' => 46, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Len minimálne. Chodil som do fitka asi pred 2 rokmi, ale potom prestalo. Treba nejaké vybavenie na doma?', 'hours_ago' => 45, 'is_read' => true],
                    ['from' => 'coach', 'content' => 'Nie je to nutné na začiatok. Ale odporúčam aspoň jednu sadu činiek 10-30kg a pull-up bar. Nový program pre začiatočníkov som práve pridal do feedu!', 'hours_ago' => 44, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Perfektné, práve som ho pozrel. Vyzerá reálne. Koľkokrát týždenne odporúčaš trénovať na začiatku?', 'hours_ago' => 2, 'is_read' => false],
                ],
            ],
            [
                'messages' => [
                    ['from' => 'coach', 'content' => 'Ahoj Dominik! Vidím, že si sa prihlásil na moj plán výživy. Máš nejaké potravinové alergie alebo obmedzenia?', 'hours_ago' => 24, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Ahoj! Nemám žiadne alergie. Ale nechutí mi brokolica 😅', 'hours_ago' => 23, 'is_read' => true],
                    ['from' => 'coach', 'content' => 'Haha, brokolica nie je povinná! 😄 Existuje veľa iných zelenín. Aký je tvoj cieľový kalorický príjem teraz?', 'hours_ago' => 22, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Neviem presne. Mám váhu 82kg a chcem schudnúť asi 8 kilo.', 'hours_ago' => 3, 'is_read' => false],
                    ['from' => 'coach', 'content' => 'Výborne! Pre teba odporučám kalorický deficit cca 400-500 kcal/deň. Pošlem ti personalizovaný jedálniček tento týždeň.', 'hours_ago' => 1, 'is_read' => false],
                ],
            ],
            [
                'messages' => [
                    ['from' => 'fan', 'content' => 'Dobrý deň, vaše videá o joge sú úžasné! Môžem sa opýtať ako dlho trvalo kým ste zvládli plný split?', 'hours_ago' => 72, 'is_read' => true],
                    ['from' => 'coach', 'content' => 'Ahoj! Ďakujem veľmi pekne! 🙏 Trvalo mi to asi 8 mesiacov pravidelného cvičenia. Kľúč je konzistencia a trpezlivosť.', 'hours_ago' => 71, 'is_read' => true],
                    ['from' => 'fan', 'content' => 'Wow, to je motivujúce! Začal som pred 3 týždňami a mám pocit, že som dosť tuhý. Je to normálne?', 'hours_ago' => 70, 'is_read' => true],
                    ['from' => 'coach', 'content' => 'Úplne normálne! Prvé 4-6 týždňov sú najtažšie. Potom uvidíš rýchle pokroky. Cvičíš aspoň 3x týždenne?', 'hours_ago' => 69, 'is_read' => true],
                ],
            ],
        ];

        foreach ($coaches as $i => $coach) {
            if (!isset($conversations[$i])) break;
            $conv = $conversations[$i];

            foreach ($conv['messages'] as $msgData) {
                $senderId = $msgData['from'] === 'fan' ? $fan->id : $coach->id;
                $receiverId = $msgData['from'] === 'fan' ? $coach->id : $fan->id;

                Message::create([
                    'sender_id' => $senderId,
                    'receiver_id' => $receiverId,
                    'content' => $msgData['content'],
                    'price_paid' => 0,
                    'is_paid' => false,
                    'is_read' => $msgData['is_read'],
                    'is_broadcast' => false,
                    'message_type' => 'text',
                    'read_at' => $msgData['is_read'] ? Carbon::now()->subHours($msgData['hours_ago'] - 1) : null,
                    'created_at' => Carbon::now()->subHours($msgData['hours_ago']),
                ]);
            }
        }

        // Add 2 sample broadcasts from the first coach
        if ($coaches->count() > 0) {
            $firstCoach = $coaches->first();
            $fans = User::where('role', 'fan')->get();

            $broadcast1 = Broadcast::create([
                'coach_id' => $firstCoach->id,
                'content' => '🔥 Nový tréningový plán je tu! Tento mesiac sa zameriame na hypertrofiu — 3 tréningy týždenne, progresívne preťaženie. Pozrite si môj najnovší post v ede!',
                'message_type' => 'text',
                'sent_at' => Carbon::now()->subDays(5),
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ]);

            $broadcast2 = Broadcast::create([
                'coach_id' => $firstCoach->id,
                'content' => '📅 Pripomínam: Live Q&A session bude v piatok o 19:00. Budeme sa rozprávať o výžive pred a po tréningu. Nepremeškajte!',
                'message_type' => 'text',
                'sent_at' => Carbon::now()->subDays(2),
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ]);

            // Create recipient records and messages for each broadcast
            foreach ([$broadcast1, $broadcast2] as $idx => $broadcast) {
                $daysAgo = $idx === 0 ? 5 : 2;
                $messages = [];
                $recipients = [];
                $sentAt = Carbon::now()->subDays($daysAgo);

                foreach ($fans as $fan2) {
                    $isRead = (bool) rand(0, 1);
                    $messages[] = [
                        'sender_id' => $firstCoach->id,
                        'receiver_id' => $fan2->id,
                        'content' => $broadcast->content,
                        'price_paid' => 0,
                        'is_paid' => false,
                        'is_read' => $isRead,
                        'is_broadcast' => true,
                        'message_type' => 'text',
                        'read_at' => $isRead ? $sentAt->copy()->addHours(rand(1, 12)) : null,
                        'created_at' => $sentAt,
                    ];
                    $recipients[] = [
                        'broadcast_id' => $broadcast->id,
                        'user_id' => $fan2->id,
                        'is_read' => $isRead,
                        'read_at' => $isRead ? $sentAt->copy()->addHours(rand(1, 12)) : null,
                        'created_at' => $sentAt,
                    ];
                }

                if (!empty($messages)) {
                    Message::insert($messages);
                    BroadcastRecipient::insert($recipients);
                }
            }
        }

        $this->command->info('MessageSeeder: seeded ' . Message::count() . ' messages and ' . Broadcast::count() . ' broadcasts');
    }
}
