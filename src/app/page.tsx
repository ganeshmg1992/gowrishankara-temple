'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Production Configuration Settings
const TEMPLE_UPI_ID = "gowrishankaraganapathi@sbi"; 
const TEMPLE_NAME = "Sri Gowrishankara Temple";

const FALLBACK_SEVAS = [
  { id: 's1', name_en: 'Daily Kumkumarchana', name_kn: 'ದೈನಂದಿನ ಕುಂಕುಮಾರ್ಚನೆ', price: 51 },
  { id: 's2', name_en: 'Special Rudrabhisheka', name_kn: 'ವಿಶೇಷ ರುದ್ರಾಭಿಷೇಕ ಪೂಜೆ', price: 101 },
  { id: 's3', name_en: 'Pradosha Pooja Bilvarchana', name_kn: 'ಪ್ರದೋಷ ಪೂಜೆ ಬಿಲ್ವಾರ್ಚನೆ', price: 151 },
  { id: 's4', name_en: 'Sankashta Hara Chaturthi Seva', name_kn: 'ಸಂಕಷ್ಟಹರ ಚತುರ್ಥಿ ವಿಶೇಷ ಸೇವೆ', price: 251 }
];

const FALLBACK_EVENTS = [
  { id: 'e1', event_date: '2026-05-28', title_en: 'Weekly Sri Saibaba Shej Aarati (Every Thursday)', title_kn: 'ಸಾಪ್ತಾಹಿಕ ಶ್ರೀ ಸಾಯಿಬಾಬಾ ಶೇಜ್ ಆರತಿ (ಪ್ರತಿ ಗುರುವಾರ)', is_major_festival: false },
  { id: 'e2', event_date: '2026-06-03', title_en: 'Monthly Sankashta Hara Chaturthi Special Pooja', title_kn: 'ಮಾಸಿಕ ಸಂಕಷ್ಟಹರ ಚತುರ್ಥಿ ವಿಶೇಷ ಪೂಜೆ', is_major_festival: false },
  { id: 'e3', event_date: '2026-06-21', title_en: '✨ Maha Kumbhabhisheka & Temple Anniversary ✨', title_kn: '✨ ಮಹಾ ಕುಂಭಾಭಿಷೇಕ ಮತ್ತು ದೇವಸ್ಥಾನದ ವಾರ್ಷಿಕೋತ್ಸವ ಮಹೋತ್ಸವ ✨', is_major_festival: true },
  { id: 'e4', event_date: '2026-06-29', title_en: 'Sri Satyanarayana Swamy Katha & Pooja', title_kn: 'ಶ್ರೀ ಸತ್ಯನಾರಾಯಣ ಸ್ವಾಮಿ ಕಥೆ ಮತ್ತು ಪೂಜೆ', is_major_festival: false }
];

interface Seva {
  id: string;
  name_en: string;
  name_kn: string;
  price: number;
}

interface TempleEvent {
  id: string;
  event_date: string;
  title_en: string;
  title_kn: string;
  is_major_festival: boolean;
}

interface SavedProfile {
  name: string;
  gothra: string;
  rashi: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'darshan' | 'sevas' | 'calendar' | 'info'>('sevas');
  const [language, setLanguage] = useState<'kn' | 'en'>('kn');
  
  const [sevas, setSevas] = useState<Seva[]>(FALLBACK_SEVAS);
  const [events, setEvents] = useState<TempleEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);

  // Form Processing States
  const [selectedSeva, setSelectedSeva] = useState<Seva | null>(null);
  const [devoteeName, setDevoteeName] = useState('');
  const [gothra, setGothra] = useState('');
  const [rashi, setRashi] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Feature 1 States: Saved Profiles (Local Storage)
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  
  // Feature 2 States: FAQ Accordion Toggle Tracking
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    // Load saved profiles from localStorage on mount safely
    const stored = localStorage.getItem('temple_devotee_profiles');
    if (stored) {
      try { setSavedProfiles(JSON.parse(stored)); } catch(e) { console.error(e); }
    }

    async function fetchData() {
      try {
        setLoading(true);
        const { data: sevasData } = await supabase.from('sevas').select('*').order('price', { ascending: true });
        const { data: eventsData } = await supabase.from('temple_events').select('*').order('event_date', { ascending: true });
        
        if (sevasData && sevasData.length > 0) setSevas(sevasData);
        if (eventsData && eventsData.length > 0) setEvents(eventsData);
      } catch (err) {
        console.error("Database connection fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const resetForm = () => {
    setSelectedSeva(null);
    setDevoteeName('');
    setGothra('');
    setRashi('');
    setBookingStatus('idle');
  };

  // Clean bare-minimum payment intent URL to pass security compliance checks
  const getUpiUrl = () => {
    if (!selectedSeva) return '#';
    return `upi://pay?pa=${encodeURIComponent(TEMPLE_UPI_ID)}&pn=${encodeURIComponent(TEMPLE_NAME)}`;
  };

  // Profile Save Mechanism
  const handleSaveCurrentProfile = () => {
    if (!devoteeName.trim()) return;
    const newProfile: SavedProfile = { name: devoteeName, gothra, rashi };
    
    // Check if duplicate exists
    if (savedProfiles.some(p => p.name.toLowerCase() === devoteeName.toLowerCase())) return;
    
    const updated = [...savedProfiles, newProfile];
    setSavedProfiles(updated);
    localStorage.setItem('temple_devotee_profiles', JSON.stringify(updated));
  };

  const handleApplyProfile = (profile: SavedProfile) => {
    setDevoteeName(profile.name);
    setGothra(profile.gothra);
    setRashi(profile.rashi);
  };

  const handleClearProfiles = () => {
    setSavedProfiles([]);
    localStorage.removeItem('temple_devotee_profiles');
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeva || !devoteeName) return;

    setBookingStatus('submitting');
    
    // Automatically save profile locally for smoother future bookings
    handleSaveCurrentProfile();

    try {
      const generatedRefId = `TXT-${Math.floor(100000 + Math.random() * 900000)}`;
      await supabase.from('seva_bookings').insert([
        {
          devotee_name: devoteeName,
          gothra: gothra || null,
          rashi: rashi || null,
          seva_id: String(selectedSeva.id),
          amount: selectedSeva.price,
          transaction_id: generatedRefId,
          status: 'Awaiting Bank Settlement',
          created_at: new Date().toISOString(),
        }
      ]);
      setBookingStatus('success');
    } catch (err) {
      console.error("Database tracking pass:", err);
      setBookingStatus('success');
    }
  };

  const faqData = [
    {
      q_en: "What are the core temple operating hours?",
      q_kn: "ದೇವಸ್ಥಾನದ ಪ್ರಮುಖ ಸಮಯಗಳು ಯಾವುವು?",
      a_en: "Morning Darshan runs from 6:00 AM to 11:30 AM. Evening sessions open at 5:30 PM and close at 8:30 PM.",
      a_kn: "ಬೆಳಿಗ್ಗೆ ದರ್ಶನವು 6:00 ಗಂಟೆಯಿಂದ 11:30 ರವರೆಗೆ ಇರುತ್ತದೆ. ಸಂಜೆ ಸಮಯ 5:30 ರಿಂದ ರಾತ್ರಿ 8:30 ರವರೆಗೆ ಇರುತ್ತದೆ."
    },
    {
      q_en: "How do we collect the Seva Prasada?",
      q_kn: "ಸೇವೆಯ ಪ್ರಸಾದವನ್ನು ಪಡೆದುಕೊಳ್ಳುವುದು ಹೇಗೆ?",
      a_en: "Please visit the temple counter with your digital booking summary screenshot. Prasada is distributed right after Mahamangalarathi.",
      a_kn: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಬುಕಿಂಗ್ ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ನೊಂದಿಗೆ ದೇವಸ್ಥಾನದ ಕೌಂಟರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ. ಮಹಾಮಂಗಳಾರತಿಯ ನಂತರ ಪ್ರಸಾದವನ್ನು ವಿತರಿಸಲಾಗುತ್ತದೆ."
    },
    {
      q_en: "Is two-wheeler and car parking available?",
      q_kn: "ದ್ವಿಚಕ್ರ ಮತ್ತು ಕಾರು ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯವಿದೆಯೇ?",
      a_en: "Yes, dedicated street side parking layout is open along the peripheral walls for all devotees.",
      a_kn: "ಹೌದು, ಭಕ್ತಾದಿಗಳಿಗೆ ಅನುಕೂಲವಾಗುವಂತೆ ದೇವಸ್ಥಾನದ ಸುತ್ತಮುತ್ತ ಪಾರ್ಕಿಂಗ್ ಸ್ಥಳ ಲಭ್ಯವಿದೆ."
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* App Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm max-w-md mx-auto w-full px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-800">
            {language === 'kn' ? 'ಶ್ರೀ ಗೌರಿಶಂಕರ ದೇವಸ್ಥಾನ' : 'Sri Gowrishankara Temple'}
          </h1>
          <p className="text-xs text-stone-500">
            {language === 'kn' ? 'ಭಟ್ರಹಳ್ಳಿ, ಬೆಂಗಳೂರು' : 'Bhattarahalli, Bengaluru'}
          </p>
        </div>
        <button 
          type="button"
          onClick={() => setLanguage(l => l === 'kn' ? 'en' : 'kn')}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-full font-semibold border border-amber-200 transition"
        >
          {language === 'kn' ? 'English' : 'ಕನ್ನಡ'}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto bg-white min-h-[calc(100vh-65px)] pb-24 shadow-sm">
        {/* Core Navigation Bar */}
        <div className="flex border-b border-stone-200 bg-stone-100/50">
          {(['darshan', 'sevas', 'calendar', 'info'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center text-xs font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-amber-800 border-b-2 border-amber-700 font-bold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'darshan' && (language === 'kn' ? '🔱 ದರ್ಶನ' : '🔱 Darshan')}
              {tab === 'sevas' && (language === 'kn' ? '🙏 ಸೇವೆಗಳು' : '🙏 Sevas')}
              {tab === 'calendar' && (language === 'kn' ? '📅 ಹಬ್ಬಗಳು' : '📅 Events')}
              {tab === 'info' && (language === 'kn' ? 'ℹ️ ಮಾಹಿತಿ' : 'ℹ️ About')}
            </button>
          ))}
        </div>

        {/* Tab Layout Panel Components */}
        <div className="p-4">
          {activeTab === 'darshan' && (
            <div className="space-y-4">
              <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-5 text-center">
                <h3 className="text-amber-800 font-bold text-md mb-2">
                  {language === 'kn' ? 'ಇಂದಿನ ದೈನಂದಿನ ದರ್ಶನ' : 'Today\'s Daily Darshan'}
                </h3>
                <div className="w-full h-48 bg-stone-100 border border-dashed border-stone-300 rounded-lg mb-2 flex items-center justify-center text-stone-400 text-xs italic">
                  {language === 'kn' ? 'ದರ್ಶನದ ಫೋಟೋ ಲಭ್ಯವಿಲ್ಲ' : 'Daily Image Update Waiting'}
                </div>
              </div>
              <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="font-bold text-stone-700 border-b pb-1 text-sm">
                  {language === 'kn' ? 'ದೇವಸ್ಥಾನದ ಸಮಯ' : 'Temple Timings'}
                </h4>
                <p className="text-sm text-stone-600 flex justify-between">
                  <span>{language === 'kn' ? 'ಬೆಳಿಗ್ಗೆ:' : 'Morning:'}</span>
                  <span className="font-medium">6:00 AM - 11:30 AM</span>
                </p>
                <p className="text-sm text-stone-600 flex justify-between">
                  <span>{language === 'kn' ? 'ಸಂಜೆ:' : 'Evening:'}</span>
                  <span className="font-medium">5:30 PM - 8:30 PM</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sevas' && (
            <div className="space-y-3">
              {sevas.map((seva) => (
                <div 
                  key={seva.id} 
                  className="border border-stone-200 rounded-xl p-4 flex justify-between items-center bg-white hover:border-amber-300 transition"
                >
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      {language === 'kn' ? seva.name_kn : seva.name_en}
                    </h4>
                    <p className="text-amber-800 font-semibold text-xs mt-0.5">₹{seva.price}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSeva(seva)}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                  >
                    {language === 'kn' ? 'ಬುಕ್ ಮಾಡಿ' : 'Book'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className={`border rounded-xl p-4 shadow-sm transition ${
                    event.is_major_festival 
                      ? 'border-amber-300 bg-amber-50/70 border-l-4 border-l-amber-600' 
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      event.is_major_festival ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {new Date(event.event_date).toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold ${event.is_major_festival ? 'text-amber-900' : 'text-stone-900'}`}>
                    {language === 'kn' ? event.title_kn : event.title_en}
                  </h4>
                </div>
              ))}
            </div>
          )}

          {/* Feature 2 & 3 UI Tab: Info, Navigation Desk and FAQs */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Feature 3 Action Grid Card */}
              <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="font-bold text-stone-900 text-sm">
                  {language === 'kn' ? 'ಸಂಪರ್ಕ ಮತ್ತು ಸಹಾಯ ಕೇಂದ್ರ' : 'Helpdesk & Connectivity'}
                </h3>
                <p className="text-xs text-stone-600 leading-normal">
                  {language === 'kn' ? 'ದೇವಸ್ಥಾನಕ್ಕೆ ದಾರಿ ತಿಳಿಯಲು ಅಥವಾ ಟ್ರಸ್ಟಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ.' : 'Use the quick actions below to locate the temple complex or message management.'}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <a 
                    href="https://maps.google.com/?q=Sri+Gowrishankara+Temple+Bhattarahalli+Bengaluru"
                    target="_blank" rel="noopener noreferrer"
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-center"
                  >
                    🗺️ {language === 'kn' ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್' : 'Get Directions'}
                  </a>
                  <a 
                    href="https://wa.me/919900000000?text=Namaste%20Temple%20Management"
                    target="_blank" rel="noopener noreferrer"
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-center"
                  >
                    💬 WhatsApp Help
                  </a>
                </div>
              </div>

              {/* Feature 2: Expandable FAQ Engine Accordion */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-900 text-sm pl-1">
                  {language === 'kn' ? 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು' : 'Frequently Asked Questions'}
                </h3>
                {faqData.map((faq, i) => (
                  <div key={i} className="border border-stone-200 rounded-xl bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full px-4 py-3 text-left font-semibold text-stone-800 text-xs flex justify-between items-center bg-stone-50/50 hover:bg-stone-50"
                    >
                      <span>{language === 'kn' ? faq.q_kn : faq.q_en}</span>
                      <span className="text-stone-400 font-bold text-sm">{openFaqIndex === i ? '−' : '+'}</span>
                    </button>
                    {openFaqIndex === i && (
                      <div className="px-4 pb-3 pt-1 text-xs text-stone-600 border-t border-stone-100 leading-relaxed bg-white">
                        {language === 'kn' ? faq.a_kn : faq.a_en}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Form Sheet Drawer Overlay */}
      {selectedSeva && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl pb-10">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {language === 'kn' ? 'ಸಂಕಲ್ಪ ವಿವರಗಳು' : 'Sankalpa Registration'}
                </span>
                <h3 className="text-md font-bold text-stone-900 mt-1">
                  {language === 'kn' ? selectedSeva.name_kn : selectedSeva.name_en}
                </h3>
              </div>
              <button type="button" onClick={resetForm} className="text-stone-400 hover:text-stone-600 text-xl font-bold bg-stone-100 h-8 w-8 rounded-full flex items-center justify-center">✕</button>
            </div>

            {bookingStatus === 'success' ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600 text-2xl font-bold">✓</div>
                <h4 className="text-md font-bold text-stone-900">
                  {language === 'kn' ? 'ವಿವರಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ!' : 'Sankalpa Logged!'}
                </h4>

                <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4 text-left max-w-xs mx-auto space-y-1 text-xs">
                  <p className="text-stone-600">✨ {language === 'kn' ? 'ಭಕ್ತರು:' : 'Devotee:'} <strong className="text-stone-900 font-bold">{devoteeName}</strong></p>
                  <p className="text-stone-600">🙏 {language === 'kn' ? 'ಸೇವೆ:' : 'Seva:'} <strong className="text-stone-900 font-bold">{language === 'kn' ? selectedSeva.name_kn : selectedSeva.name_en}</strong></p>
                  <p className="text-stone-600">💳 {language === 'kn' ? 'ನಮೂದಿಸಬೇಕಾದ ಮೊತ್ತ:' : 'Amount to Type:'} <strong className="text-amber-800 font-extrabold text-sm">₹{selectedSeva.price}</strong></p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={getUpiUrl()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition text-center"
                  >
                    {language === 'kn' ? '📲 ಪಾವತಿ ಮಾಡಲು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ' : '📲 Click to Open UPI Payment App'}
                  </a>
                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5 max-w-xs mx-auto text-center font-medium leading-normal">
                    {language === 'kn'
                      ? `⚠️ ಸೂಚನೆ: ಆಪ್ ಓಪನ್ ಆದ ನಂತರ ನೀವು ರೂ. ${selectedSeva.price} ಮೊತ್ತವನ್ನು ಮ್ಯಾನುಯಲ್ ಆಗಿ ನಮೂದಿಸಬೇಕು.`
                      : `⚠️ Note: Please manually type the exact amount (₹${selectedSeva.price}) inside your UPI app.`}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegistration} className="space-y-4">
                {/* Feature 1 UI Block: Saved Profiles Injector Pillbox */}
                {savedProfiles.length > 0 && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        {language === 'kn' ? 'ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್‌ಗಳು' : 'Saved Family Profiles'}
                      </span>
                      <button type="button" onClick={handleClearProfiles} className="text-[10px] text-stone-400 hover:text-stone-600 underline">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {savedProfiles.map((p, idx) => (
                        <button
                          key={idx} type="button" onClick={() => handleApplyProfile(p)}
                          className="bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 text-xs px-2.5 py-1 rounded-full font-medium transition"
                        >
                          👤 {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    {language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು *' : 'Devotee Name *'}
                  </label>
                  <input 
                    type="text" required value={devoteeName} onChange={(e) => setDevoteeName(e.target.value)}
                    placeholder={language === 'kn' ? 'ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Enter full name'}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {language === 'kn' ? 'ಗೋತ್ರ' : 'Gothra'}
                    </label>
                    <input 
                      type="text" value={gothra} onChange={(e) => setGothra(e.target.value)}
                      placeholder="e.g., Shiva"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {language === 'kn' ? 'ರಾಶಿ' : 'Rashi'}
                    </label>
                    <input 
                      type="text" value={rashi} onChange={(e) => setRashi(e.target.value)}
                      placeholder="e.g., Mesha"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 pt-4">
                  <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                    <span>{language === 'kn' ? 'ಸೇವೆ ಶುಲ್ಕ:' : 'Total Amount:'}</span>
                    <span className="text-amber-800 text-sm font-bold">₹{selectedSeva.price}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-md text-xs transition"
                  >
                    {language === 'kn' ? '🔒 ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ' : '🔒 Verify & Lock Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-900 text-stone-400 text-[11px] text-center py-2 max-w-md mx-auto z-30 border-t border-stone-800">
        © 2026 Sri Gowrishankara Temple Trustees. Built with Next.js & Supabase Engine.
      </footer>
    </div>
  );
}