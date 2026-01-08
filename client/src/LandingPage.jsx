import React, { useState } from 'react';
import './LandingPage.css';
import App from './App'; // Import the main App component

// Placeholder images (In a real app, import these properly or use the artifact/public paths)
// For this demo, we assume the user will see the generated artifact paths in their mind or we simply direct to the generated images if possible.
// Since I can't easily link the temp artifact paths in the browser session without them being in 'public', I will use placeholders or the paths if they were moved.
// I will use simple colored divs or external placeholders if the local files aren't servable, but I will try to use a generic 'img' tag.
// Actually, I'll use text description placeholders or if the user moves them, it works.
// For now, I will use line styles for images.

const LandingPage = () => {
    const [showApp, setShowApp] = useState(false);

    if (showApp) {
        return <App />;
    }

    return (
        <div className="lp-container">
            {/* Navbar */}
            <nav className="lp-nav">
                <div className="lp-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/LinQSynQ Logo.png" alt="ATS Logo" style={{ height: '40px' }} />
                    ATS <span>LinQ-SynQ</span>
                </div>
                <button className="lp-btn-login" onClick={() => setShowApp(true)}>
                    LOGIN / DASHBOARD
                </button>
            </nav>

            {/* Hero Section */}
            <header className="lp-hero">
                <h1>
                    THE BRIDGE BETWEEN<br />
                    COMPLEXITY AND CONTROL.
                </h1>
                <p>
                    Stop struggling with bulky engineering software.
                    ATS LinQ-SynQ empowers maintenance teams to debug, monitor, and control PLCs
                    instantly from any device. No licenses. No dongles. Just results.
                </p>
                <div className="lp-hero-image">
                    {/* Using one of the generated images conceptually */}
                    {/* <img src="/path/to/hero.png" alt="Dashboard" /> */}
                    <div style={{ width: '100%', height: '500px', background: 'linear-gradient(45deg, #111, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#333', fontSize: '2rem', fontWeight: '900' }}>
                            [ HERO DASHBOARD VISUALIZATION ]
                            <br /><br />
                            (Generated Image 1 Placement)
                        </span>
                    </div>
                </div>
            </header>

            {/* Comparison Section (Old vs New) */}
            <section className="lp-comparison">
                <div className="lp-comp-side old">
                    <span className="lp-badge red">The Old Way (TIA Portal)</span>
                    <h2 className="lp-comp-title">License Locked & Complex.</h2>
                    <p className="lp-comp-desc">
                        Requires expensive engineering licenses, powerful laptops, specific cables, and hours of training.
                        Debugging a simple sensor fault means calling an engineer at 3 AM.
                    </p>
                    {/* <img className="lp-comp-img" src="/path/to/mess.png" /> */}
                    <div className="lp-comp-img" style={{ background: '#1a0505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#522', fontWeight: 'bold' }}>[ WIRE JUNGLE IMAGE ]</span>
                    </div>
                </div>
                <div className="lp-comp-side new">
                    <span className="lp-badge green">The LinQ-SynQ Way</span>
                    <h2 className="lp-comp-title">Instant Access & Clarity.</h2>
                    <p className="lp-comp-desc">
                        Browser-based access on reliable tablets. Restricted, safe controls for technicians.
                        Visual feedback on faults instantly. Solve 90% of issues without opening a laptop.
                    </p>
                    {/* <img className="lp-comp-img" src="/path/to/tablet.png" /> */}
                    <div className="lp-comp-img" style={{ background: '#051a05', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#252', fontWeight: 'bold' }}>[ HAPPY TECHNICIAN + TABLET ]</span>
                    </div>
                </div>
            </section>

            {/* Features Feature Grid (Bento) */}
            <section className="lp-features">
                <h2 className="lp-section-title">BUILT FOR SPEED. ENGINEERED FOR SAFETY.</h2>
                <div className="lp-grid">
                    <div className="lp-card">
                        <div className="lp-card-icon">⚡</div>
                        <h3>Real-Time Monitoring</h3>
                        <p>
                            Watch PLC tags update in milliseconds. Trend values over time to catch intermittent glitches before they stop the line.
                        </p>
                    </div>
                    <div className="lp-card">
                        <div className="lp-card-icon">☁️</div>
                        <h3>Cloud Bridge (MQTT)</h3>
                        <p>
                            Seamlessly pipe shop-floor data to your Cloud infrastructure (AWS, Azure) without distinct gateway hardware.
                        </p>
                    </div>
                    <div className="lp-card">
                        <div className="lp-card-icon">🛡️</div>
                        <h3>Role-Based Access</h3>
                        <p>
                            Admins get full control. Technicians get safe, restricted 'Write' access. Logs track every action for full accountability.
                        </p>
                    </div>
                    <div className="lp-card">
                        <div className="lp-card-icon">📱</div>
                        <h3>Any Device, Anywhere</h3>
                        <p>
                            Responsive design works on iPads, rugged tablets, phones, or desktops. Debug from the machine, not the control room.
                        </p>
                    </div>
                    <div className="lp-card">
                        <div className="lp-card-icon">🔧</div>
                        <h3>Node-RED Integration</h3>
                        <p>
                            Need custom logic? Open the embedded Node-RED editor to build flow-based automation on the fly.
                        </p>
                    </div>
                    <div className="lp-card">
                        <div className="lp-card-icon">🔌</div>
                        <h3>Multi-Protocol</h3>
                        <p>
                            Support for Siemens (S7), Allen-Bradley (EtherNet/IP), and standard OPC UA. One interface for your entire plant.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <footer className="lp-cta">
                <h2>READY TO OPTIMIZE?</h2>
                <button className="lp-cta-btn" onClick={() => setShowApp(true)}>
                    LAUNCH DASHBOARD
                </button>
            </footer>
        </div>
    );
};

export default LandingPage;
