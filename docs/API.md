# PULSE — Routes dokumentácia

Všetky routes sú v `routes/web.php`. Žiadne separátne API — všetko cez Inertia.js.
JSON odpovede (`response()->json()`) len pre AJAX volania (like, follow, reviews, unread count).

## Verejné routes (bez autentifikácie)

| Method | URI | Popis |
|--------|-----|-------|
| GET | `/` | Domovská stránka |
| GET | `/coaches` | Zoznam koučov (grid + filter) |
| GET | `/coaches/{coachId}` | Profil kouča (5 tabov) |
| GET | `/coaches/search` | Vyhľadávanie koučov (JSON) |
| GET | `/coaches/{coachId}/reviews` | Recenzie kouča (JSON, paginated) |
| GET | `/legal/privacy` | Privacy Policy |
| GET | `/legal/terms` | VOP |
| GET | `/legal/gdpr` | GDPR |
| GET | `/legal/cookies` | Cookie Policy |

## Auth routes

| Method | URI | Popis |
|--------|-----|-------|
| GET | `/login` | Prihlasovací formulár |
| POST | `/login` | Prihlásenie |
| POST | `/logout` | Odhlásenie |
| GET | `/register` | Registračný formulár |
| POST | `/register` | Registrácia (rola: fan/kouč) |

## Fan routes (vyžaduje `auth`)

| Method | URI | Popis |
|--------|-----|-------|
| GET | `/feed` | Hlavný feed (príspevky, reels, videá) |
| POST | `/feed/like/{postId}` | Like/unlike (JSON) |
| GET | `/messages` | Zoznam konverzácií |
| GET | `/messages/{userId}` | Konverzácia s používateľom |
| POST | `/messages/{userId}` | Odoslať správu (text/media) |
| GET | `/api/messages/unread-count` | Počet neprečítaných (JSON) |
| GET | `/notifications` | Notifikácie |
| POST | `/notifications/{id}/read` | Označiť prečítanú |
| POST | `/notifications/read-all` | Označiť všetky prečítané |
| GET | `/profile/{userId}` | Profil používateľa |
| POST | `/profile/update` | Upraviť vlastný profil |
| POST | `/follow/{userId}` | Follow/unfollow toggle (JSON) |
| GET | `/subscribe/{coachId}` | Spustiť Stripe Checkout |
| GET | `/subscription/success` | Úspešná platba (po Stripe redirect) |
| POST | `/subscription/cancel/{coachId}` | Zrušiť predplatné |
| POST | `/coaches/{coachId}/reviews` | Pridať/upraviť recenziu (JSON) |
| DELETE | `/coaches/{coachId}/reviews` | Zmazať vlastnú recenziu (JSON) |

## Coach routes (vyžaduje `auth` + `coach` rola)

| Method | URI | Popis |
|--------|-----|-------|
| GET | `/dashboard` | Prehľad (zárobky, graf, aktivita) |
| GET | `/dashboard/earnings` | Detailné zárobky |
| GET | `/dashboard/subscribers` | Zoznam predplatiteľov |
| GET | `/dashboard/profile` | Editácia profilu kouča |
| PUT | `/dashboard/profile` | Uložiť profil |
| GET | `/dashboard/posts/create` | Formulár nového príspevku |
| POST | `/dashboard/posts` | Uložiť príspevok |
| DELETE | `/dashboard/posts/{postId}` | Zmazať príspevok |
| GET | `/dashboard/reels/create` | Formulár nového reelu |
| POST | `/dashboard/reels` | Uložiť reel |
| GET | `/dashboard/broadcast` | Broadcast formulár |
| POST | `/dashboard/broadcast` | Odoslať broadcast správu |

## API endpoints (JSON only)

| Method | URI | Auth | Popis |
|--------|-----|------|-------|
| GET | `/api/coaches/suggested` | nie | Odporúčaní kouči pre sidebar (max 4) |
| GET | `/api/messages/unread-count` | áno | Počet neprečítaných správ |
| GET | `/coaches/search?q=` | nie | Vyhľadávanie koučov |
| GET | `/coaches/{id}/reviews` | nie | Recenzie kouča (paginated) |
