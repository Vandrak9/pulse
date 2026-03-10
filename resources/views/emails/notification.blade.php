<x-mail::message>
# {{ $title }}

{{ $body }}

<x-mail::button :url="$actionUrl" color="red">
{{ $actionText }}
</x-mail::button>

---

*Toto je automatický email z platformy PULSE.*
*Nastavenia emailových notifikácií môžeš zmeniť vo svojom [profile]({{ config('app.url') }}/profile/me).*

© {{ date('Y') }} PULSE · [pulsehub.fun]({{ config('app.url') }})
</x-mail::message>
