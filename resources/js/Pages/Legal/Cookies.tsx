import PulseLayout from '@/Layouts/PulseLayout';
import { Head } from '@inertiajs/react';

export default function Cookies() {
    return (
        <PulseLayout>
            <Head title="Cookies — PULSE" />
            <LegalPage title="Zásady používania cookies" updated="1. januára 2026">
                <Section title="1. Čo sú cookies">
                    <p>Cookies sú malé textové súbory ukladané do vášho prehliadača pri návšteve webovej stránky. Pomáhajú nám zapamätať si vaše preferencie a zlepšovať váš zážitok.</p>
                </Section>
                <Section title="2. Aké cookies používame">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#faf6f0' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e8d9c4', color: '#2d2118' }}>Typ</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e8d9c4', color: '#2d2118' }}>Účel</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e8d9c4', color: '#2d2118' }}>Doba</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { type: 'Nevyhnutné', purpose: 'Prihlásenie, session, CSRF ochrana', duration: 'Session / 2h' },
                                { type: 'Funkčné', purpose: 'Zapamätanie preferencií', duration: '1 rok' },
                                { type: 'Analytické', purpose: 'Štatistiky návštevnosti (anonymné)', duration: '90 dní' },
                                { type: 'Stripe', purpose: 'Prevencia podvodov pri platbách', duration: Session },
                            ].map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0e8df' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2d2118' }}>{r.type}</td>
                                    <td style={{ padding: '10px 12px', color: '#4a3728' }}>{r.purpose}</td>
                                    <td style={{ padding: '10px 12px', color: '#9a8a7a' }}>{r.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Section>
                <Section title="3. Nevyhnutné cookies">
                    <p>Tieto cookies sú potrebné pre fungovanie platformy a nemožno ich vypnúť. Zahŕňajú session cookie pre prihlásenie a CSRF token pre bezpečnosť formulárov.</p>
                </Section>
                <Section title="4. Ako spravovať cookies">
                    <p>Väčšinu cookies môžete vypnúť v nastaveniach prehliadača. Upozorňujeme, že vypnutie niektorých cookies môže obmedziť funkčnosť platformy (napr. prihlásenie nebude fungovať bez session cookie).</p>
                    <p>Návody pre populárne prehliadače:</p>
                    <ul>
                        <li>Chrome: Nastavenia → Ochrana súkromia → Cookies</li>
                        <li>Firefox: Nastavenia → Súkromie → Cookies</li>
                        <li>Safari: Nastavenia → Safari → Ochrana súkromia</li>
                    </ul>
                </Section>
                <Section title="5. Kontakt">
                    <p>Otázky o cookies: <a href="mailto:hello@pulsehub.fun" style={{ color: '#c4714a' }}>hello@pulsehub.fun</a></p>
                </Section>
            </LegalPage>
        </PulseLayout>
    );
}

const Session = 'Session';

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
