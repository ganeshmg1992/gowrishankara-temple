'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Production Verified UPI Constants
const TEMPLE_UPI_ID = "gowrishankaraganapathi@sbi"; 
const TEMPLE_NAME = "Sri Gowrishankara Temple";

// Local Fallbacks to guarantee the app NEVER loads blank tabs
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'darshan' | 'sevas' | 'calendar'>('darshan');
  const [language, setLanguage] = useState<'kn' | 'en'>('kn');
  
  // Initialize states with fallbacks directly so page layout populates instantly
  const [sevas, setSevas] = useState<Seva[]>(FALLBACK_SEVAS);
  const [events, setEvents] = useState<TempleEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);

  // Form Processing States
  const [selectedSeva, setSelectedSeva] = useState<Seva | null>(null);
  const [devoteeName, setDevoteeName] = useState('');
  const [gothra, setGothra] = useState('');
  const [rashi, setRashi] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: sevasData } = await supabase.from('sevas').select('*').order('price', { ascending: true });
        const { data: eventsData } = await supabase.from('temple_events').select('*').order('event_date', { ascending: true });
        
        if (sevasData && sevasData.length > 0) setSevas(sevasData);
        if (eventsData && eventsData.length > 0) setEvents(eventsData);
      } catch (err) {
        console.error("Supabase live fetch bypassed, running resilient local layout:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Submit booking record to Supabase and seamlessly trigger UPI application
  const handleBookingAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeva || !devoteeName) return;

    setBookingStatus('submitting');

    // Create a temporary reference code for temple accounts to trace back manually
    const generatedRefId = `TXT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Instantly log user details into the database
      const { error } = await supabase.from('seva_bookings').insert([
        {
          devotee_name: devoteeName,
          gothra: gothra || null,
          rashi: rashi || null,
          seva_id: String(selectedSeva.id),
          amount: selectedSeva.price,
          transaction_id: generatedRefId,
          status: 'Awaiting Bank Settlement', // Informative status for back-office tracking
          created_at: new Date().toISOString(),
        }
      ]);

      if (error) throw error;

      // 2. Format transaction note for UPI app clarity
      const cleanName = devoteeName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
      const cleanSeva = selectedSeva.name_en.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
      const txNote = `Seva ${cleanSeva} ${cleanName}`.substring(0, 35);

      // 3. Construct mobile deep link string
      const upiUrl = `upi://pay?pa=${encodeURIComponent(TEMPLE_UPI_ID)}&pn=${encodeURIComponent(TEMPLE_NAME)}&am=${selectedSeva.price}&cu=INR&tn=${encodeURIComponent(txNote)}`;
      
      // 4. Fire open the native payment sheet window & show success confirmation immediately behind it
      window.location.href = upiUrl;
      setBookingStatus('success');

    } catch (err) {
      console.error("Submission blocked:", err);
      setBookingStatus('error');
    }
  };

  const resetForm = () => {
    setSelectedSeva(null);
    setDevoteeName('');
    setGothra('');
    setRashi('');
    setBookingStatus('idle');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* Header Container */}
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
          onClick={() => setLanguage(l => l === 'kn' ? 'en' : 'kn')}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-full font-semibold border border-amber-200 transition"
        >
          {language === 'kn' ? 'English' : 'ಕನ್ನಡ'}
        </button>
      </header>

      {/* Main UI Container */}
      <main className="max-w-md mx-auto bg-white min-h-[calc(100vh-65px)] pb-24 shadow-sm">
        {/* Tab Selection Row */}
        <div className="flex border-b border-stone-200 bg-stone-100/50">
          {(['darshan', 'sevas', 'calendar'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-amber-800 border-b-2 border-amber-700 font-bold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'darshan' && (language === 'kn' ? '🔱 ದರ್ಶನ' : '🔱 Darshan')}
              {tab === 'sevas' && (language === 'kn' ? '🙏 ಸೇವೆಗಳು' : '🙏 Sevas')}
              {tab === 'calendar' && (language === 'kn' ? '📅 ಹಬ್ಬಗಳು' : '📅 Calendar')}
            </button>
          ))}
        </div>

        {/* Dynamic Display Panel */}
        <div className="p-4">
          {/* Darshan Panel */}
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

          {/* Sevas Listing Panel */}
          {activeTab === 'sevas' && (
            <div className="space-y-3">
              {sevas.map((seva) => (
                <div 
                  key={seva.id} 
                  className="border border-stone-200 rounded-xl p-4 flex justify-between items-center bg-white hover:border-amber-300 transition"
                >
                  <div>
                    <h4 className="font-bold text-stone-900 text-base">
                      {language === 'kn' ? seva.name_kn : seva.name_en}
                    </h4>
                    <p className="text-amber-800 font-semibold text-sm mt-0.5">₹{seva.price}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSeva(seva)}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                  >
                    {language === 'kn' ? 'ಬುಕ್ ಮಾಡಿ' : 'Book'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Events Calendar Panel */}
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
                    {event.is_major_festival && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                        {language === 'kn' ? 'ವಿಶೇಷ ಉತ್ಸವ' : 'Major Festival'}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-base font-bold ${event.is_major_festival ? 'text-amber-900' : 'text-stone-900'}`}>
                    {language === 'kn' ? event.title_kn : event.title_en}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Sheet Drawer Overlays */}
      {selectedSeva && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 overflow-y-auto backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl pb-10">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {language === 'kn' ? 'ಸಂಕಲ್ಪ ವಿವರಗಳು' : 'Sankalpa Registration'}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  {language === 'kn' ? selectedSeva.name_kn : selectedSeva.name_en}
                </h3>
              </div>
              <button onClick={resetForm} className="text-stone-400 hover:text-stone-600 text-xl font-bold bg-stone-100 h-8 w-8 rounded-full flex items-center justify-center">✕</button>
            </div>

            {bookingStatus === 'success' ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-green-100 rounded-full mx-auto flex items-center justify-center text-green-600 text-2xl font-bold">✓</div>
                <h4 className="text-xl font-bold text-green-700">
                  {language === 'kn' ? 'ಬುಕ್ಕಿಂಗ್ ವಿನಂತಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!' : 'Booking Complete!'}
                </h4>
                <p className="text-sm text-stone-600 px-2 leading-relaxed">
                  {language === 'kn' 
                    ? 'ನಿಮ್ಮ ಸಂಕಲ್ಪ ವಿವರಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ ಮತ್ತು ಯುಪಿಐ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ. ಧನ್ಯವಾದಗಳು!' 
                    : 'Your Sankalpa registration details have been saved, and your mobile UPI application has been invoked.'}
                </p>
                <button onClick={resetForm} className="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl text-sm shadow mt-2">
                  {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingAndPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    {language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು *' : 'Devotee Name *'}
                  </label>
                  <input 
                    type="text" required value={devoteeName} onChange={(e) => setDevoteeName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
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
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {language === 'kn' ? 'ರಾಶಿ' : 'Rashi'}
                    </label>
                    <input 
                      type="text" value={rashi} onChange={(e) => setRashi(e.target.value)}
                      placeholder="e.g., Mesha"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 pt-4">
                  <div className="flex justify-between text-sm font-bold text-stone-700 mb-1">
                    <span>{language === 'kn' ? 'ಸೇವೆ ಶುಲ್ಕ:' : 'Total Amount:'}</span>
                    <span className="text-amber-800 text-base">₹{selectedSeva.price}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingStatus === 'submitting'}
                    className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-400 text-white font-bold py-3 rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition"
                  >
                    {bookingStatus === 'submitting' 
                      ? (language === 'kn' ? 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Processing Request...') 
                      : (language === 'kn' ? '📲 ಬುಕ್ ಮಾಡಿ ಮತ್ತು ಪಾವತಿಸಿ' : '📲 Book & Pay with Any UPI App')}
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