import PulseLayout from '@/Layouts/PulseLayout';
import { Head } from '@inertiajs/react';

export default function Privacy() {
    return (
        <PulseLayout>
            <Head title="Ochrana osobných údajov — PULSE" />
            <LegalPage title="Ochrana osobných údajov" updated="1. januára 2026">
                <Section title="1. Aké údaje zbierame">
                    <p>Pri registrácii a používaní platformy PULSE zbierame nasledujúce osobné údaje:</p>
                    <ul>
                        <li><strong>Identifikačné údaje:</strong> meno, e-mailová adresa</li>
                        <li><strong>Platobné údaje:</strong> spracúvané výlučne cez Stripe — PULSE nemá prístup k číslam platobných kariet</li>
                        <li><strong>Prevádzkové údaje:</strong> IP adresa, typ prehliadača, čas prístupu</li>
                        <li><strong>Obsah:</strong> správy, komentáre a iný obsah, ktorý vytvoríte na platforme</li>
                    </ul>
                </Section>
                <Section title="2. Ako údaje používame">
                    <ul>
                        <li>Prevádzka a zlepšovanie platformy PULSE</li>
                        <li>Spracovanie platieb a výplat koučom</li>
                        <li>Zasielanie dôležitých notifikácií o vašom účte</li>
                        <li>Zabezpečenie platformy a prevencia podvodov</li>
                        <li>Plnenie zákonných povinností</li>
                    </ul>
                </Section>
                <Section title="3. Kto má prístup k vašim údajom">
                    <ul>
                        <li><strong>PULSE tím:</strong> zamestnanci a spolupracovníci s prístupom k systémom</li>
                        <li><strong>Stripe:</strong> spracovanie platieb — <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#c4714a' }}>Stripe Privacy Policy</a></li>
                        <li><strong>Poskytovatelia hostingu:</strong> cloudové servery v EÚ</li>
                        <li>Údaje <strong>nepredávame</strong> tretím stranám na marketingové účely</li>
                    </ul>
                </Section>
                <Section title="4. Vaše práva (GDPR)">
                    <ul>
                        <li><strong>Prístup:</strong> právo požiadať o výpis vašich osobných údajov</li>
                        <li><strong>Oprava:</strong> právo opraviť nesprávne údaje</li>
                        <li><strong>Vymazanie:</strong> právo na zabudnutie — môžete si vymazať účet v nastaveniach</li>
                        <li><strong>Prenosnosť:</strong> právo exportovať vaše údaje v strojovo čitateľnom formáte</li>
                        <li><strong>Námietka:</strong> právo namietať proti spracovaniu</li>
                    </ul>
                </Section>
                <Section title="5. Kontakt">
                    <p>Pre otázky ohľadne ochrany osobných údajov nás kontaktujte na <a href="mailto:hello@pulsehub.fun" style={{ color: '#c4714a' }}>hello@pulsehub.fun</a>.</p>
                </Section>
            </LegalPage>
        </PulseLayout>
    );
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
            <p style={{ fontSize: 12, color: '#c4714a', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                PULSE Legal
            </p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>
                {title}
            </h1>
            <p style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 40 }}>Posledná aktualizácia: {updated}</p>
            <div style={{ fontSize: 15, lineHeight: 1.75, color: '#4a3728' }}>
                {children}
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2d2118', marginBottom: 12 }}>
                {title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {children}
            </div>
        </div>
    );
}
