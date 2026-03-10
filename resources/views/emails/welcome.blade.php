<x-mail::message>
# Vitaj na PULSE, {{ $user->name }}! 👋

Sme radi že si tu. PULSE je fitness platforma kde nájdeš
tých najlepších slovenských a českých fitness koučov.

<x-mail::button :url="config('app.url') . '/coaches'" color="red">
Objaviť koučov
</x-mail::button>

**Čo môžeš robiť:**
- 👀 Sledovať koučov zadarmo
- 💳 Predplatiť si exkluzívny obsah
- 💬 Písať koučom priamo cez správy
- ⭐ Hodnotiť koučov po predplatnom

---

© {{ date('Y') }} PULSE · [pulsehub.fun]({{ config('app.url') }})
</x-mail::message>
