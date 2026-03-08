import PulseLayout from '@/Layouts/PulseLayout';
import { Head } from '@inertiajs/react';

export default function Gdpr() {
    return (
        <PulseLayout>
            <Head title="GDPR — PULSE" />
            <LegalPage title="GDPR — Ochrana údajov" updated="1. januára 2026">
                <Section title="1. Správca osobných údajov">
                    <p>Správcom vašich osobných údajov je spoločnosť PULSE Platform s.r.o. Kontakt: <a href="mailto:hello@pulsehub.fun" style={{ color: '#c4714a' }}>hello@pulsehub.fun</a></p>
                </Section>
                <Section title="2. Právny základ spracovania">
                    <ul>
                        <li><strong>Plnenie zmluvy (čl. 6 ods. 1 písm. b GDPR):</strong> spracovanie potrebné pre poskytovanie služieb platformy</li>
                        <li><strong>Oprávnený záujem (čl. 6 ods. 1 písm. f GDPR):</strong> zabezpečenie a prevencia podvodov</li>
                        <li><strong>Súhlas (čl. 6 ods. 1 písm. a GDPR):</strong> marketingová komunikácia (voliteľné)</li>
                    </ul>
                </Section>
                <Section title="3. Doba uchovávania údajov">
                    <ul>
                        <li>Údaje účtu: po dobu trvania účtu + 3 roky po jeho zrušení (zákonná povinnosť)</li>
                        <li>Platobné záznamy: 10 rokov (daňové účely)</li>
                        <li>Správy: 2 roky od odoslania</li>
                        <li>Logy a bezpečnostné záznamy: 6 mesiacov</li>
                    </ul>
                </Section>
                <Section title="4. Vaše práva podľa GDPR">
                    <ul>
                        <li><strong>Právo na prístup (čl. 15):</strong> môžete požiadať o kópiu vašich údajov</li>
                        <li><strong>Právo na opravu (čl. 16):</strong> opravíme nesprávne alebo neúplné údaje</li>
                        <li><strong>Právo na vymazanie (čl. 17):</strong> "právo byť zabudnutý" — vymazanie účtu v nastaveniach</li>
                        <li><strong>Právo na obmedzenie spracovania (čl. 18):</strong> za určitých podmienok</li>
                        <li><strong>Právo na prenosnosť (čl. 20):</strong> export údajov v strojovo čitateľnom formáte</li>
                        <li><strong>Právo namietať (čl. 21):</strong> proti spracovaniu na základe oprávneného záujmu</li>
                    </ul>
                </Section>
                <Section title="5. Prenos údajov mimo EÚ">
                    <p>Stripe, Inc. (USA) spracúva platobné údaje. Prenos sa uskutočňuje na základe štandardných zmluvných doložiek schválených EK. Ďalší prenos mimo EÚ sa neuskutočňuje.</p>
                </Section>
                <Section title="6. Právo podať sťažnosť">
                    <p>Máte právo podať sťažnosť na Úrad na ochranu osobných údajov SR (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" style={{ color: '#c4714a' }}>dataprotection.gov.sk</a>).</p>
                </Section>
                <Section title="7. Kontakt">
                    <p><a href="mailto:hello@pulsehub.fun" style={{ color: '#c4714a' }}>hello@pulsehub.fun</a></p>
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
