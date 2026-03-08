# Ako prispievať do PULSE

## Git workflow

### Branches

| Branch | Popis |
|--------|-------|
| `main` | Produkcia ([pulsehub.fun](https://pulsehub.fun)) — len merge cez PR |
| `develop` | Integračná branch — sem mergujeme features pred releasom |
| `feature/nazov` | Nová funkcionalita |
| `fix/nazov` | Oprava bugu |
| `hotfix/nazov` | Urgentná oprava priamo na produkciu |

### Postup pre novú funkciu

```bash
git checkout develop
git pull origin develop
git checkout -b feature/moja-funkcia

# ... práca, commity ...

git push origin feature/moja-funkcia
# Otvor Pull Request → develop
# Min. 1 code review approval → merge
```

### Postup pre hotfix (urgentná oprava produkcie)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/popis-problemu

# ... oprava ...

git push origin hotfix/popis-problemu
# PR → main + PR → develop (aby sa oprava dostala do oboch)
```

---

## Commit správy (Conventional Commits)

```
feat:      nová funkcia
fix:       oprava bugu
chore:     údržba, závislosti, konfigurácia
docs:      dokumentácia
refactor:  refaktoring bez zmeny správania
test:      testy
style:     formátovanie, bez logických zmien
perf:      výkonnostné vylepšenia
```

**Príklady:**
```
feat: add coach review system with star rating
fix: fan 500 error when sending first message
fix: review 500 — wrong notifications table schema
chore: developer onboarding — README, CONTRIBUTING, tests
docs: update README with local setup guide
perf: add DB index on coach_id in reviews table
```

---

## Code review checklist

Pred mergom skontroluj:

- [ ] TypeScript bez chýb: `npx tsc --noEmit`
- [ ] PHP syntax OK: `php -l app/Http/Controllers/MyController.php`
- [ ] Žiadne `dd()`, `var_dump()`, `console.log()` v kóde
- [ ] Migrácia má funkčný `down()` (rollback)
- [ ] Nové routes majú správny middleware (`auth`, `throttle`)
- [ ] Externé API volania (Stripe, Pexels) obalené v `try/catch`
- [ ] Notifikácie obalené v `try/catch` — nesmú crashnúť hlavnú akciu
- [ ] Nové stĺpce pridané do `$fillable` modelu
- [ ] Nové FK constraints majú index

---

## Kódové štandardy

### PHP / Laravel

- **PSR-12** štandard
- Všetky public metódy majú návratový typ (`Response`, `JsonResponse`, `void`, ...)
- `try/catch` na **všetky** externé API volania (Stripe, Pexels, email)
- Notifikačné inserty vždy v `try/catch` — neúspešná notifikácia nesmie blokovať hlavnú akciu
- Žiadne raw SQL bez parametrizácie (ochrana pred SQL injection)
- Rate limiting na všetky write endpointy (`throttle:messages`, `throttle:uploads`)

```php
// ✓ Správne
public function store(Request $request): JsonResponse
{
    try {
        $stripe = new StripeClient(config('cashier.secret'));
        $session = $stripe->checkout->sessions->create([...]);
    } catch (ApiErrorException $e) {
        Log::error('Stripe error: ' . $e->getMessage());
        return response()->json(['message' => 'Platba zlyhala'], 500);
    }
}

// ✗ Nesprávne — žiadny try/catch, žiadny return type
public function store(Request $request)
{
    $stripe = new StripeClient(config('cashier.secret'));
    $session = $stripe->checkout->sessions->create([...]);
}
```

### TypeScript / React

- **Funkčné komponenty** s hooks (žiadne class components)
- Props vždy typované — `interface` alebo `type`
- **Axios** pre API volania (nie `fetch`), s try/catch
- **Optimistic UI** pre like/follow akcie (okamžitá odozva + revert pri chybe)
- Brand farby ako **inline styles**, nikdy Tailwind utility klasy
- Žiadne `any` typy okrem legitímnych prípadov (napr. error handling)

```tsx
// ✓ Správne
interface Props {
    coach: CoachData;
    isSubscribed: boolean;
}

async function handleFollow() {
    const prev = following;
    setFollowing(!prev); // optimistic
    try {
        const res = await axios.post(`/follow/${coach.user_id}`);
        setFollowing(res.data.following);
    } catch {
        setFollowing(prev); // revert
    }
}
```

### Databáza

- Každá nová tabuľka musí mať migráciu s funkčným `down()`
- FK constraints vždy (`->constrained()->cascadeOnDelete()`)
- Index na každý FK stĺpec a frequently queried stĺpec
- Nové stĺpce = pridať do `$fillable` modelu
- Amounts v centoch ako integer (nie float) — pre finančné hodnoty

---

## Lokálne prostredie

**Odporúčané:**
- [Laravel Herd](https://herd.laravel.com/) (Mac) — PHP + nginx bez Docker
- [Laravel Sail](https://laravel.com/docs/sail) (Docker) — cross-platform

**Minimálne** (manuálne):
```bash
php artisan serve    # port 8000
npm run dev          # Vite HMR
php artisan queue:work --queue=default,notifications
```

---

## Bezpečnosť

Ak objavíš bezpečnostnú zraniteľnosť, **nepublikuj ju ako issue**.
Kontaktuj nás priamo: [hello@pulsehub.fun](mailto:hello@pulsehub.fun)

---

## Testovanie

### DÔLEŽITÉ — Izolácia testov
Testy bežia na separátnej databáze `pulse_test` (PostgreSQL), NIE na `pulse_db`.
`phpunit.xml` je nakonfigurovaný na `DB_DATABASE=pulse_test`.

Nikdy nespúšťaj testy s `--env=production` alebo so zmenou `DB_CONNECTION` v `.env`.

### Spustenie testov
```bash
php artisan test                    # všetky testy
php artisan test --filter=Coach     # konkrétna skupina
php artisan test --stop-on-failure  # zastaviť pri prvej chybe
```

### Pridávanie testov
- Každá nová feature musí mať aspoň 1 feature test
- Testy patria do `tests/Feature/`
- Naming: `FeatureNameTest.php`
- Vždy použiť `use RefreshDatabase`
- Factories: `database/factories/` (existuje `UserFactory`, `CoachFactory`)
