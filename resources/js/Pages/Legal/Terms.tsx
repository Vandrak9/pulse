import PulseLayout from '@/Layouts/PulseLayout';
import { Head } from '@inertiajs/react';

export default function Terms() {
    return (
        <PulseLayout>
            <Head title="Podmienky použitia — PULSE" />
            <LegalPage title="Podmienky použitia" updated="1. januára 2026">
                <Section title="1. Prijatie podmienok">
                    <p>Používaním platformy PULSE súhlasíte s týmito Podmienkami použitia. Ak nesúhlasíte, platformu nepoužívajte.</p>
                </Section>
                <Section title="2. Popis služby">
                    <p>PULSE je platforma spájajúca fitness koučov s ich fanúšikmi. Umožňuje predaj predplatného, zdieľanie obsahu a priamu komunikáciu.</p>
                </Section>
                <Section title="3. Registrácia a účet">
                    <ul>
                        <li>Musíte mať minimálne 18 rokov</li>
                        <li>Zodpovedáte za bezpečnosť svojho hesla</li>
                        <li>Jeden účet na osobu — zakazujeme zdieľanie účtov</li>
                        <li>Zakazujeme vytváranie falošných profilov</li>
                    </ul>
                </Section>
                <Section title="4. Platby a predplatné">
                    <ul>
                        <li>Platby sú spracované cez Stripe — bezpečne, šifrované</li>
                        <li>Predplatné sa automaticky obnovuje každý mesiac</li>
                        <li>Zrušenie predplatného je možné kedykoľvek — prístup ostáva do konca plateného obdobia</li>
                        <li>Koučom ide 85% z každej platby; PULSE si ponecháva 15% ako poplaatok za platformu</li>
                        <li>Refundácia je možná do 48 hodín od prvého predplatenia ak nebol obsah sprístupnený</li>
                    </ul>
                </Section>
                <Section title="5. Pravidlá obsahu">
                    <ul>
                        <li>Zakazujeme obsah porušujúci autorské práva</li>
                        <li>Zakazujeme sexuálny obsah, obsah propagujúci násilie alebo nenávisť</li>
                        <li>Obsah musí súvisieť s fitness, wellness alebo zdravým životným štýlom</li>
                        <li>PULSE si vyhradzuje právo odstrániť obsah porušujúci tieto pravidlá</li>
                    </ul>
                </Section>
                <Section title="6. Zodpovednosť">
                    <p>PULSE neposkytuje medicínske poradenstvo. Obsah na platforme slúži len na informačné účely. Pred začatím tréningového programu sa poraďte s lekárom.</p>
                </Section>
                <Section title="7. Kontakt">
                    <p>Otázky a sťažnosti: <a href="mailto:hello@pulsehub.fun" style={{ color: '#c4714a' }}>hello@pulsehub.fun</a></p>
                </Section>
            </LegalPage>
        </PulseLayout>
    );
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
            <p style={{ fontSize: 12, color: '#c4714a', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>PULSE Legal</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>{title}</h1>
            <p style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 40 }}>Posledná aktualizácia: {updated}</p>
            <div style={{ fontSize: 15, lineHeight: 1.75, color: '#4a3728' }}>{children}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2d2118', marginBottom: 12 }}>{title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
        </div>
    );
}
