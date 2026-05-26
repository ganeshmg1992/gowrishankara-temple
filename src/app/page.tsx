'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UPI Constants
const TEMPLE_UPI_ID = "gowrishankaratemple@sbi"; // Replace with the actual temple UPI ID
const TEMPLE_NAME = "Sri Gowrishankara Temple";

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
  // Tab State: 'darshan' | 'sevas' | 'calendar'
  const [activeTab, setActiveTab] = useState<'darshan' | 'sevas' | 'calendar'>('darshan');
  const [language, setLanguage] = useState<'kn' | 'en'>('kn');
  
  // Data States
  const [sevas, setSevas] = useState<Seva[]>([]);
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedSeva, setSelectedSeva] = useState<Seva | null>(null);
  const [devoteeName, setDevoteeName] = useState('');
  const [gothra, setGothra] = useState('');
  const [rashi, setRashi] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: sevasData } = await supabase.from('sevas').select('*').order('price', { ascending: true });
        const { data: eventsData } = await supabase.from('temple_events').select('*').order('event_date', { ascending: true });
        
        if (sevasData) setSevas(sevasData);
        if (eventsData) setEvents(eventsData);
      } catch (err) {
        console.error("Error pulling database records:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Launch Mobile UPI Apps dynamically
  const triggerUPIPayment = () => {
    if (!selectedSeva || !devoteeName) {
      alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter devotee name');
      return;
    }

    const cleanName = devoteeName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
    const cleanSeva = selectedSeva.name_en.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
    const txNote = `Seva ${cleanSeva} ${cleanName}`.substring(0, 50);

    // Standard native UPI deep link format
    const upiUrl = `upi://pay?pa=${encodeURIComponent(TEMPLE_UPI_ID)}&pn=${encodeURIComponent(TEMPLE_NAME)}&am=${selectedSeva.price}&cu=INR&tn=${encodeURIComponent(txNote)}`;
    
    // Open installed payment ecosystem apps
    window.location.href = upiUrl;
    setPaymentInitiated(true);
  };

  // Submit record to Supabase
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeva || !devoteeName || !transactionId) return;

    setBookingStatus('submitting');

    try {
      const { error } = await supabase.from('seva_bookings').insert([
        {
          devotee_name: devoteeName,
          gothra: gothra || null,
          rashi: rashi || null,
          seva_id: selectedSeva.id,
          amount: selectedSeva.price,
          transaction_id: transactionId,
          status: 'Pending Verification', // Explicit status requiring Admin check against statements
          created_at: new Date().toISOString(),
        }
      ]);

      if (error) throw error;
      setBookingStatus('success');
    } catch (err) {
      console.error(err);
      setBookingStatus('error');
    }
  };

  const resetForm = () => {
    setSelectedSeva(null);
    setDevoteeName('');
    setGothra('');
    setRashi('');
    setTransactionId('');
    setPaymentInitiated(false);
    setBookingStatus('idle');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* Header Panel */}
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

      {/* Main Container */}
      <main className="max-w-md mx-auto bg-white min-h-[calc(100vh-65px)] pb-24 shadow-inline">
        {/* Navigation Tabs Bar */}
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

        {/* Tab Contents */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm animate-pulse">
              {language === 'kn' ? 'ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading data...'}
            </div>
          ) : (
            <>
              {/* Darshan Tab View */}
              {activeTab === 'darshan' && (
                <div className="space-y-4">
                  <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-5 text-center">
                    <h3 className="text-amber-800 font-bold text-md mb-2">
                      {language === 'kn' ? 'ಇಂದಿನ ದೈನಂದಿನ ದರ್ಶನ' : 'Today\'s Daily Darshan'}
                    </h3>
                    <div className="w-full h-48 bg-stone-200 rounded-lg mb-2 flex items-center justify-center text-stone-400 text-xs italic">
                      [ Alankara Photo Placeholder ]
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

              {/* Sevas List Tab View */}
              {activeTab === 'sevas' && (
                <div className="space-y-3">
                  {sevas.map((seva) => (
                    <div 
                      key={seva.id} 
                      className="border border-stone-200 rounded-xl p-4 flex justify-between items-center bg-white hover:border-amber-300 transition"
                    >
                      <div className="pr-2">
                        <h4 className="font-bold text-stone-900 text-base">
                          {language === 'kn' ? seva.name_kn : seva.name_en}
                        </h4>
                        <p className="text-amber-800 font-semibold text-sm mt-0.5">₹{seva.price}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSeva(seva)}
                        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition shrink-0"
                      >
                        {language === 'kn' ? 'ಬುಕ್ ಮಾಡಿ' : 'Book'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* MVP Events Calendar Tab View */}
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
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        {event.is_major_festival && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 animate-pulse bg-amber-100 px-1.5 py-0.5 rounded">
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
            </>
          )}
        </div>
      </main>

      {/* Booking Interactive Drawer / Modal Overlay */}
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
              <button 
                onClick={resetForm}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold bg-stone-100 h-8 w-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {bookingStatus === 'success' ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center text-green-600 text-2xl font-bold">✓</div>
                <h4 className="text-xl font-bold text-green-700">
                  {language === 'kn' ? 'ಬುಕ್ಕಿಂಗ್ ವಿನಂತಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!' : 'Booking Requested!'}
                </h4>
                <p className="text-sm text-stone-600 px-4">
                  {language === 'kn' 
                    ? 'ನಿಮ್ಮ ಯುಪಿಐ ಪಾವತಿ ವಿನಂತಿಯನ್ನು ಪರಿಶೀಲನೆಗಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ದೇವಸ್ಥಾನದ ಆಡಳಿತ ಮಂಡಳಿಯು ಖಚಿತಪಡಿಸಿದ ನಂತರ ನವೀಕರಿಸಲಾಗುತ್ತದೆ.' 
                    : 'Your transaction was saved successfully. Temple management will verify the reference code against bank receipts shortly.'}
                </p>
                <button 
                  onClick={resetForm}
                  className="w-full bg-stone-800 text-white font-bold py-2.5 rounded-xl text-sm shadow mt-2"
                >
                  {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Input Elements */}
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

                {/* Automation Payment Trigger Block */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-stone-700">
                    <span>{language === 'kn' ? 'ಸೇವೆ ಶುಲ್ಕ:' : 'Total Amount:'}</span>
                    <span className="text-amber-800 text-base">₹{selectedSeva.price}</span>
                  </div>

                  {!paymentInitiated ? (
                    <button
                      type="button"
                      onClick={triggerUPIPayment}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition"
                    >
                      📲 {language === 'kn' ? 'ಯುಪಿಐ ಆಪ್ ಮೂಲಕ ನೇರ ಪಾವತಿ' : 'Pay Directly via Mobile UPI App'}
                    </button>
                  ) : (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-lg text-center font-medium">
                      {language === 'kn' ? '✅ ಯುಪಿಐ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ' : '✅ UPI Payment application triggered'}
                    </div>
                  )}
                </div>

                {/* Manual Reference Collection Step */}
                {paymentInitiated && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-stone-200">
                    <label className="block text-xs font-bold text-stone-600">
                      {language === 'kn' ? 'ಯುಪಿಐ ಟ್ರಾನ್ಸಾಕ್ಷನ್ ಐಡಿ (ಕೊನೆಯ ೪ ಅಥವಾ ೧೨ ಅಂಕಿಗಳು) *' : 'UPI Transaction Ref Reference ID *'}
                    </label>
                    <input 
                      type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g., 6142xxxx or Ref No."
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-600 bg-amber-50/40"
                    />
                    <p className="text-[10px] text-stone-500 leading-relaxed">
                      {language === 'kn' 
                        ? 'ಪಾವತಿ ಪೂರ್ಣಗೊಂಡ ನಂತರ ನಿಮ್ಮ ಜಿಪೇ/ಫೋನ್‌ಪೇನಲ್ಲಿ ಕಾಣಿಸುವ ಸಂಖ್ಯೆಯನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ ಬುಕಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ.' 
                        : 'After making the transfer inside your banking application, type the resulting settlement ID here to finalize your database record.'}
                    </p>

                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting'}
                      className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-bold py-3 rounded-xl shadow-lg text-sm mt-2 transition"
                    >
                      {bookingStatus === 'submitting' 
                        ? (language === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting Reference...') 
                        : (language === 'kn' ? 'ಬುಕ್ಕಿಂಗ್ ಕನ್ಫರ್ಮ್ ಮಾಡಿ' : 'Confirm Registration')}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-stone-900 text-stone-400 text-[11px] text-center py-2 max-w-md mx-auto z-30 border-t border-stone-800">
        © 2026 Sri Gowrishankara Temple Trustees. Built with Next.js & Supabase Engine.
      </footer>
    </div>
  );
}