'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';

// ==========================================
// SYSTEM TYPE INTEGRITY SCHEMAS
// ==========================================
interface TempleEvent {
  id: string;
  title_en: string;
  title_kn: string;
  scenario_type: 'yearly' | 'monthly' | 'weekly'; 
  category: string;                               
  event_date: string;                             
  day_of_week: string | null;                     
}

interface SevaItem {
  id: string;
  event_id: string | null;                        
  title_en: string;
  title_kn: string;
  cost: number;
  is_standalone_event: boolean;                   
}

interface BookingRecord {
  id: string;
  type: string;
  devotee_name: string;
  phone_number: string;
  nakshatra: string;
  gothra: string;
  service_title: string;
  total_paid: number;
  created_at: string;
}

export default function TempleEngineApp() {
  // Navigation & Localization States
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'sevas' | 'astrology' | 'donation'>('home');
  const [isKannada, setIsKannada] = useState<boolean>(false);
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [adminPasskey, setAdminPasskey] = useState<string>('');
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);

  // Home Page Dynamic States (Carousel Auto-Slide & Panchangam Matrix)
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [panchangam] = useState({
    rahu: "16:45 - 18:20",
    yama: "10:15 - 11:50",
    sunrise: "05:58 AM",
    sunset: "06:40 PM",
    text_nakshatra: "Rohini",
    lagna: "Simha"
  });

  // Live Cloud Sync Data Pools
  const [eventsPool, setEventsPool] = useState<TempleEvent[]>([]);
  const [sevasPool, setSevasPool] = useState<SevaItem[]>([]);
  const [bookingsPool, setBookingsPool] = useState<BookingRecord[]>([]);

  // UI Interactive Filtering Context States
  const [selectedFestivalContext, setSelectedFestivalContext] = useState<TempleEvent | null>(null);
  const [targetCalendarMonth, setTargetCalendarMonth] = useState<string>('2026-06');

  // Checkout Modal Management States (With Extended Information Modules)
  const [checkoutItem, setCheckoutItem] = useState<{ title: string; cost: number; type: string } | null>(null);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [devoteeStar, setDevoteeStar] = useState<string>('');
  const [devoteeGothra, setDevoteeGothra] = useState<string>('');

  // Clean Admin Intake Schemas
  const [adminScenario, setAdminScenario] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  
  const [eventForm, setEventForm] = useState({
    title_en: '',
    title_kn: '',
    event_date: '',                               
    day_of_week: 'Thursday'
  });

  const [sevaForm, setSevaForm] = useState({
    event_id: '', 
    title_en: '',
    title_kn: '',
    cost: '',
    is_standalone_event: false
  });

  // ==========================================
  // REAL-TIME DATA ARCHITECTURE PIPELINE
  // ==========================================
  const syncCoreDatabaseEngine = async () => {
    try {
      const { data: eventsData, error: eErr } = await supabase.from('events').select('*');
      if (eErr) console.error("Events fetch error:", eErr);
      if (eventsData) setEventsPool(eventsData);

      const { data: sevasData, error: sErr } = await supabase.from('sevas').select('*');
      if (sErr) console.error("Sevas fetch error:", sErr);
      if (sevasData) setSevasPool(sevasData);

      const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (bookingsData) setBookingsPool(bookingsData);
    } catch (err) {
      console.error("Database sync interrupted:", err);
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const { data, error } = await supabase.storage.from('temple-assets').list();
      if (error) throw error;
      
      if (data) {
        const validFiles = data.filter(file => !file.name.startsWith('.'));
        const urls = validFiles.map(file => {
          return supabase.storage.from('temple-assets').getPublicUrl(file.name).data.publicUrl;
        });
        setCarouselImages(urls);
      }
    } catch (err) {
      console.error("Storage infrastructure pipeline disconnected:", err);
      setCarouselImages([
        'https://images.unsplash.com/photo-1609137144814-118c7f991f24?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80'
      ]);
    }
  };

  useEffect(() => {
    syncCoreDatabaseEngine();
    fetchCarouselImages();
  }, []);

  useEffect(() => {
    if (carouselImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [carouselImages]);

  // ==========================================
  // DYNAMIC CALCULATED VIEWS (SCENARIO ROUTER)
  // ==========================================
  const currentMonthCalendarEvents = useMemo(() => {
    return eventsPool.filter(evt => {
      if (evt.scenario_type === 'weekly') return true; 
      if (evt.event_date && evt.event_date.startsWith(targetCalendarMonth)) return true;
      return false;
    });
  }, [eventsPool, targetCalendarMonth]);

  const activeSevasCatalog = useMemo(() => {
    if (selectedFestivalContext) {
      return sevasPool.filter(seva => seva.event_id === selectedFestivalContext.id);
    }
    return sevasPool.filter(seva => !seva.event_id && !seva.is_standalone_event);
  }, [sevasPool, selectedFestivalContext]);

  const routeCalendarToSevas = (eventItem: TempleEvent) => {
    setSelectedFestivalContext(eventItem);
    setActiveTab('sevas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // UPI PAYMENT & DB SUBMISSION FLOW
  // ==========================================
  const processBookingTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeName.trim() || !phone.trim() || !checkoutItem) return;

    const txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Commit registration log payload straight into Supabase
    const { error } = await supabase.from('bookings').insert([{
      id: txnId,
      type: checkoutItem.type,
      devotee_name: devoteeName,
      phone_number: phone, 
      nakshatra: devoteeStar,
      gothra: devoteeGothra,
      service_title: checkoutItem.title,
      total_paid: checkoutItem.cost
    }]);

    if (error) {
      alert(`Transaction database pipeline failure: ${error.message}`);
      return;
    }

    // 2. Database transaction recorded, initialize automatic UPI Deep-Link
    // ⚠️ CHOOSE YOUR UPI ID: Make sure to change this to your actual trust account VPA!
    const upiId = "yourtempleupi@bank"; 
    
    const businessName = encodeURIComponent("Shree Gowrishankara Sainatha Temple");
    const amount = checkoutItem.cost.toString();
    const transactionNote = encodeURIComponent(`Sankalpa Seva: ${checkoutItem.title} - ${devoteeName}`);
    
    // Official RBI/NPCI merchant code for Religious Organizations / Trusts
    const mcc = "9399"; 

    // Standardized Indian Interoperable Intent String with Merchant Identifiers
    const upiUrl = `upi://pay?pa=${upiId}&pn=${businessName}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${txnId}&mc=${mcc}&mode=02&purpose=00`;

    // Reset workflow states before executing interface route hop
    setCheckoutItem(null);
    setDevoteeName('');
    setPhone('');
    setDevoteeStar('');
    setDevoteeGothra('');
    syncCoreDatabaseEngine();

    // 3. Fire layout intent overlay trigger to open phone apps instantly
    window.location.href = upiUrl;
  };

    // 2. Database transaction recorded, initialize automatic UPI Deep-Link
    // ⚠️ REPLACE THIS STRING WITH THE TEMPLE'S ACTUAL UPI ID (VPA) BEFORE PUSHING LIVE
    const upiId = "gowrishankaraganapathi@sbi"; 
    
    const businessName = encodeURIComponent("Shree Gowrishankara Sainatha Temple");
    const amount = checkoutItem.cost.toString();
    const transactionNote = encodeURIComponent(`Sankalpa Seva: ${checkoutItem.title} - ${devoteeName}`);

    // Standardized Indian Interoperable Intent String
    const upiUrl = `upi://pay?pa=${upiId}&pn=${businessName}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${txnId}`;

    // Reset workflow states before executing interface route hop
    setCheckoutItem(null);
    setDevoteeName('');
    setPhone('');
    setDevoteeStar('');
    setDevoteeGothra('');
    syncCoreDatabaseEngine();

    // 3. Fire layout intent overlay trigger to open phone apps instantly
    window.location.href = upiUrl;
  };

  // ==========================================
  // ADMINISTRATIVE DATA WRITERS
  // ==========================================
  const handleAdminAuthentication = () => {
    if (adminPasskey === 'temple777') {
      setIsAdminVerified(true);
    } else {
      alert("Invalid configuration passkey.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const determinedDate = adminScenario === 'weekly' ? '1970-01-01' : eventForm.event_date;

    const payload = {
      title_en: eventForm.title_en,
      title_kn: eventForm.title_kn,
      scenario_type: adminScenario,
      category: adminScenario,                        
      event_date: determinedDate,                    
      day_of_week: adminScenario === 'weekly' ? eventForm.day_of_week : null
    };

    const { data: createdEvent, error } = await supabase.from('events').insert([payload]).select().single();
    if (error) return alert(`Database Rejected Insertion: ${error.message}`);

    if (adminScenario === 'monthly' && createdEvent) {
      await supabase.from('sevas').insert([{
        event_id: createdEvent.id,
        title_en: `${createdEvent.title_en} Pooja`,
        title_kn: `${createdEvent.title_kn} ಪೂಜೆ`,
        cost: 250, 
        is_standalone_event: true
      }]);
    }

    alert("Temporal event registered cleanly across cloud matrices.");
    setEventForm({ title_en: '', title_kn: '', event_date: '', day_of_week: 'Thursday' });
    syncCoreDatabaseEngine();
  };

  const handleCreateSeva = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      event_id: sevaForm.event_id === '' ? null : sevaForm.event_id,
      title_en: sevaForm.title_en,
      title_kn: sevaForm.title_kn,
      cost: parseInt(sevaForm.cost) || 0,
      is_standalone_event: sevaForm.is_standalone_event
    };

    const { error } = await supabase.from('sevas').insert([payload]);
    if (error) return alert(`Error appending catalog item: ${error.message}`);

    alert("New Seva catalog logic entry mapped successfully.");
    setSevaForm({ event_id: '', title_en: '', title_kn: '', cost: '', is_standalone_event: false });
    syncCoreDatabaseEngine();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-amber-100">
      
      {/* GLOBAL APPLICATION BRAND LOGIC TOPBAR */}
      <header className="bg-amber-800 text-white shadow-md sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🔱</span>
          <div>
            <h1 className="font-bold tracking-wide text-md sm:text-lg">
              {isKannada ? "ಶ್ರೀ ಗೌರಿ ಶಂಕರ ಸಾಯಿನಾಥ ದೇವಸ್ಥಾನ" : "Shree Gowrishankara Sainatha Temple"}
            </h1>
            <p className="text-[10px] text-amber-200 tracking-wider uppercase font-medium">Bhattarahalli Complex Engine Node</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button type="button" onClick={() => setAdminMode(!adminMode)} className="text-[11px] bg-amber-700 hover:bg-amber-900 border border-amber-600/40 px-3 py-1.5 rounded font-bold uppercase transition">
            ⚙️ Control Deck
          </button>
          <button type="button" onClick={() => setIsKannada(!isKannada)} className="bg-amber-600 hover:bg-amber-500 border border-amber-400/40 text-xs font-bold px-3 py-1.5 rounded transition">
            {isKannada ? "English" : "ಕನ್ನಡ"}
          </button>
        </div>
      </header>

      {/* ACCESS AUTHENTICATION DROPDOWN TRAY */}
      {adminMode && !isAdminVerified && (
        <div className="bg-slate-900 text-slate-100 p-5 border-b-4 border-amber-600 shadow-inner">
          <div className="max-w-md mx-auto text-center space-y-2">
            <h4 className="text-xs font-bold tracking-widest text-amber-400 uppercase">🔒 System Gateway Authorization Token Required</h4>
            <div className="flex items-center space-x-2">
              <input type="password" placeholder="Passkey Token Entry..." value={adminPasskey} onChange={e => setAdminPasskey(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white w-full focus:outline-none focus:border-amber-500" />
              <button type="button" onClick={handleAdminAuthentication} className="bg-amber-600 hover:bg-amber-500 font-bold px-4 py-2 rounded-lg uppercase text-[10px] tracking-wider whitespace-nowrap">Verify Key</button>
            </div>
          </div>
        </div>
      )}

      {/* CORE VIEWPORT COMPONENT COMPARTMENT HUB */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-4 sm:p-6">
        
        {/* VIEW TAB 1: DASHBOARD LANDING */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* MOTORIZED HARDWARE SLIDING IMAGE BANNER CAROUSEL CONTAINER */}
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-white group">
              {carouselImages.length > 0 ? (
                <>
                  <div 
                    className="flex w-full h-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {carouselImages.map((url, idx) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 relative">
                        <img 
                          src={url} 
                          alt={`Temple Sanctuary Slide ${idx + 1}`} 
                          className="w-full h-full object-cover select-none" 
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>

                  {/* Operational Carousel Navigation Progress Indicator Nodes */}
                  <div className="absolute bottom-3 inset-x-0 flex justify-center space-x-1.5 z-10">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-5 bg-amber-600' : 'w-2 bg-white/60 hover:bg-white'}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2 bg-slate-50">
                  <span className="text-3xl animate-pulse">🕉️</span>
                  <p className="text-xs font-medium tracking-wide">Syncing Temple Sanctuary Assets...</p>
                </div>
              )}
            </div>

            {/* DYNAMIC PANCHANGAM ASTROLOGICAL PARAMETERS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: isKannada ? "ರಾಹು ಕಾಲ" : "Rahu Kaala", val: panchangam.rahu, icon: "⏳" },
                { label: isKannada ? "ಯಮಗಂಡ" : "Yamaganda", val: panchangam.yama, icon: "⚠️" },
                { label: isKannada ? "ನಕ್ಷತ್ರ" : "Nakshatra", val: panchangam.text_nakshatra, icon: "✨" },
                { label: isKannada ? "ಸೂರ್ಯೋದಯ" : "Sunrise", val: panchangam.sunrise, icon: "🌅" },
                { label: isKannada ? "ಸೂರ್ಯಾಸ್ತ" : "Sunset", val: panchangam.sunset, icon: "🌇" },
                { label: isKannada ? "ಲಗ್ನ" : "Lagna", val: panchangam.lagna, icon: "🕉️" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3 hover:border-amber-500/40 transition">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div onClick={() => setActiveTab('calendar')} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:border-amber-500 cursor-pointer transition group">
                <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform">📅</span>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">{isKannada ? "ದೇವಸ್ಥಾನದ ಪಂಚಾಂಗ ಜಲಕ" : "Dynamic Monthly Setup"}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isKannada ? "ಮಾಸಿಕ ಸಂಕಷ್ಟಹರ ಚತುರ್ಥಿ, ಪೂರ್ಣಿಮಾ ಮತ್ತು ಹಬ್ಬಗಳ ನಿಖರ ದಿನಾಂಕ ಪರಿಶೀಲಿಸಿ." : "Jump straight into the interactive calendar ledger layout engine to observe floating lunar calendar tracking patterns."}</p>
              </div>

              <div onClick={() => { setSelectedFestivalContext(null); setActiveTab('sevas'); }} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:border-amber-500 cursor-pointer transition group">
                <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform">🎟️</span>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">{isKannada ? "ದೈನಂದಿನ ನಿತ್ಯ ಸೇವೆಗಳು" : "Standard Sevas Matrix"}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isKannada ? "ಯಾವುದೇ ವಿಶೇಷ ಹಬ್ಬದ ಬಾಧ್ಯತೆ ಇಲ್ಲದ ಸಾಮಾನ್ಯ ಪೂಜೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಕಾಯ್ದಿರಿಸಿ." : "Explore the permanent base routine catalogue always open to devotee registry configurations globally."}</p>
              </div>

              <div onClick={() => setActiveTab('donation')} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:border-amber-500 cursor-pointer transition group">
                <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform">🥣</span>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">{isKannada ? "ನಿತ್ಯ ಅನ್ನದಾನ ನಿಧಿ ಕಾಣಿಕೆ" : "Nitya Anna Danam Charity"}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isKannada ? "ದೇವಸ್ಥಾನದ ನಿರಂತರ ಪ್ರಸಾದ ವಿತರಣಾ ಸೇವೆಗಳಿಗೆ ನಿಮ್ಮ ಯಥಾಶಕ್ತಿ ಕಾಣಿಕೆ ನೀಡಿ." : "Sustain and fund community distribution arrays easily with tokenized ledger payment endpoints."}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW TAB 2: INTERACTIVE CALENDAR ROADMAP */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Calculation Month</label>
                <select value={targetCalendarMonth} onChange={e => setTargetCalendarMonth(e.target.value)} className="bg-slate-100 text-slate-800 font-bold rounded-lg px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                  <option value="2026-06">June 2026</option>
                  <option value="2026-07">July 2026</option>
                  <option value="2026-08">August 2026</option>
                  <option value="2026-09">September 2026</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs leading-tight font-medium">* Scenario 1 & 2 items auto-render relative to dates. Scenario 3 tracking loops persist permanently.</p>
            </div>

            <div className="space-y-3">
              {currentMonthCalendarEvents.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6 font-medium">No custom target anchors tracked in this matrix block.</p>
              ) : (
                currentMonthCalendarEvents.map(evt => {
                  const isScenario1 = evt.scenario_type === 'yearly';
                  const isScenario2 = evt.scenario_type === 'monthly';
                  
                  return (
                    <div key={evt.id} className={`p-4 rounded-xl bg-white border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition shadow-sm ${isScenario1 ? 'border-amber-400 ring-2 ring-amber-100/50 bg-gradient-to-r from-amber-50/10 to-white' : 'border-slate-100'}`}>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-100 border border-slate-200 font-mono text-[10px] px-2 py-0.5 rounded font-bold text-slate-700">
                            {evt.scenario_type === 'weekly' ? `Every ${evt.day_of_week}` : evt.event_date}
                          </span>
                          <span className={`text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${isScenario1 ? 'bg-amber-600 text-white' : isScenario2 ? 'bg-purple-600 text-white' : 'bg-slate-600 text-white'}`}>
                            {isScenario1 ? "Scenario 1: Grand Festival" : isScenario2 ? "Scenario 2: Monthly Event" : "Scenario 3: Weekly Routine"}
                          </span>
                        </div>
                        <h4 className="text-md font-bold tracking-tight text-slate-900 mt-1.5">
                          {isKannada ? evt.title_kn : evt.title_en}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => routeCalendarToSevas(evt)}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg uppercase tracking-wider transition"
                      >
                        {isScenario2 ? (isKannada ? "ಪೂಜೆ ಬುಕ್ಕಿಂಗ್ ಪ್ರವೇಶ" : "Book Pooja Entry") : (isKannada ? "ಸೇವೆಗಳ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ" : "Explore Linked Sevas")}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW TAB 3: DYNAMIC SEVAS CATALOG */}
        {activeTab === 'sevas' && (
          <div className="space-y-4">
            {selectedFestivalContext ? (
              <div className="bg-slate-900 text-slate-50 p-4 rounded-xl flex justify-between items-center shadow-lg border-l-4 border-amber-500">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-amber-600 text-white px-2 py-0.5 rounded shadow-sm">
                    Active Relational Filter Context Bounds
                  </span>
                  <h3 className="text-md font-bold tracking-tight mt-1">
                    Showing services for: <span className="text-amber-400 font-extrabold">{isKannada ? selectedFestivalContext.title_kn : selectedFestivalContext.title_en}</span>
                  </h3>
                </div>
                <button type="button" onClick={() => setSelectedFestivalContext(null)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition uppercase tracking-wider">
                  Show General Menu
                </button>
              </div>
            ) : (
              <div className="bg-white text-slate-600 p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold flex items-center space-x-2">
                <span>📋</span>
                <p>Showing standard general catalogue items. Looking for Scenario specific options? Target them straight out of the interactive <span className="text-amber-800 font-bold underline cursor-pointer" onClick={() => setActiveTab('calendar')}>Calendar Ledger tab</span>.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSevasCatalog.length === 0 ? (
                <p className="text-center text-xs text-slate-400 col-span-2 py-8">No sub-seva items linked under this event tracking segment yet.</p>
              ) : (
                activeSevasCatalog.map(seva => (
                  <div key={seva.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base tracking-tight">{isKannada ? seva.title_kn : seva.title_en}</h4>
                      <div className="text-emerald-700 font-black text-md font-mono mt-1.5">₹{seva.cost}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutItem({ title: isKannada ? seva.title_kn : seva.title_en, cost: seva.cost, type: 'Pooja Token Registration' })}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-4 py-2 rounded-lg border border-emerald-200/30 whitespace-nowrap transition active:scale-95 uppercase tracking-wider"
                    >
                      {isKannada ? "ಕಾಯ್ದಿರಿಸಿ" : "Book Seva"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW TAB 4: ASTROLOGICAL ASSIGNMENTS */}
        {activeTab === 'astrology' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center max-w-md mx-auto shadow-md space-y-4">
            <span className="text-4xl block">🔮</span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">{isKannada ? "ಪ್ರಧಾನ ಅರ್ಚಕರೊಂದಿಗೆ ಜಾತಕ ವಿಶ್ಲೇಷಣೆ" : "Astrological Timeline Consultation"}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">Schedule high-resolution diagnostic mappings of birth charts, planetary alignments, or trace localized remedial homam configuration schedules with master priests.</p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-left space-y-1 w-max mx-auto text-[10px] font-mono text-slate-500">
              <div>📍 Mode: Physical One-on-One Interaction Array</div>
              <div>💳 System Base Ticket Overhead: ₹500</div>
            </div>
            <button type="button" onClick={() => setCheckoutItem({ title: isKannada ? 'ಜಾತಕ ವಿಶ್ಲೇಷಣೆ ಕಾಯ್ದಿರಿಸುವಿಕೆ' : 'Astro Consultation Slot Booking', cost: 500, type: 'Astrological Consultation' })} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest shadow transition transform active:scale-95">
              Reserve Alignment Slot
            </button>
          </div>
        )}

        {/* VIEW TAB 5: DONATIONS CHANNELS */}
        {activeTab === 'donation' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center max-w-md mx-auto shadow-md space-y-5">
            <span className="text-4xl block">🥣</span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">{isKannada ? "ನಿತ್ಯ ಪ್ರಸಾದ ಅನ್ನದಾನ ನಿಧಿ" : "Voluntary Devotional Capital Contribution"}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">Route structural financial support channels straight into localized public feeding tracks or physical structural enhancements.</p>
            <div className="flex justify-center gap-3 max-w-xs mx-auto">
              {[251, 501, 1001].map(amt => (
                <button key={amt} type="button" onClick={() => setCheckoutItem({ title: isKannada ? 'ಸ್ವಯಂಪ್ರೇರಿತ ಅನ್ನದಾನ ನಿಧಿ' : 'Voluntary Anna Danam Charity Token', cost: amt, type: 'Charity Contribution' })} className="bg-amber-50 hover:bg-amber-100 border border-amber-200/40 text-amber-900 font-mono font-black p-3 rounded-xl text-md shadow-sm transition transform active:scale-95">
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTION MODAL OVERLAY WITH NATIVE UPI DEEP-LINK REDIRECT ROUTING */}
        {checkoutItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <form onSubmit={processBookingTransactionSubmit} className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 relative overflow-hidden shadow-2xl border border-slate-100">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">{checkoutItem.type}</span>
                  <h4 className="text-md font-bold text-slate-900 tracking-tight mt-1 truncate max-w-[240px]">{checkoutItem.title}</h4>
                </div>
                <button type="button" onClick={() => setCheckoutItem(null)} className="text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full hover:bg-slate-200">✕</button>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Value to Pay:</span>
                <span className="text-xl font-mono font-black text-emerald-700">₹{checkoutItem.cost}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Devotee Name *</label>
                  <input type="text" required value={devoteeName} onChange={e => setDevoteeName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white" placeholder="Enter full name..." />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone Number *</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white" placeholder="10-digit mobile number..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nakshatra (Star)</label>
                    <input type="text" value={devoteeStar} onChange={e => setDevoteeStar(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white" placeholder="Birth star..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Gothra Lineage</label>
                    <input type="text" value={devoteeGothra} onChange={e => setDevoteeGothra(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white" placeholder="Gothra..." />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest shadow transition-all transform active:scale-95">
                Pay Now & Commit Sankalpa
              </button>
            </form>
          </div>
        )}

      </main>

      {/* CORE ADMIN TERMINAL LAYOUT VIEW */}
      {adminMode && isAdminVerified && (
        <div className="fixed inset-0 bg-slate-900 text-slate-100 font-sans flex flex-col justify-between overflow-y-auto z-50">
          <header className="bg-amber-800 text-white px-6 py-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔱</span>
              <div>
                <h1 className="font-black text-lg uppercase tracking-wide">Shree Gowrishankara Sainatha Temple</h1>
                <p className="text-[10px] text-amber-200 font-mono tracking-widest uppercase">Scenario-Driven Admin Deck</p>
              </div>
            </div>
            <button type="button" onClick={() => { setAdminMode(false); setIsAdminVerified(false); }} className="bg-red-700 hover:bg-red-800 text-xs font-bold px-4 py-2 rounded-md uppercase tracking-wider transition">
              ⚙️ Exit Control Terminal
            </button>
          </header>

          <main className="flex-grow max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CONTROL BLOCK 1: EVENT ANCHORS WITH BOTH ENGLISH & KANNADA INPUTS */}
            <form onSubmit={handleCreateEvent} className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/60 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400">📅 Step 1: Initialize Event Target</h3>
              
              <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
                {(['yearly', 'monthly', 'weekly'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdminScenario(t)}
                    className={`py-1.5 rounded text-[10px] font-bold uppercase tracking-tight text-center transition ${adminScenario === t ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Event Name (English - e.g. Ganesha Festival)" required value={eventForm.title_en} onChange={e => setEventForm({...eventForm, title_en: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500" />
                <input type="text" placeholder="ಹಬ್ಬದ ಹೆಸರು (ಕನ್ನಡ - ಉದಾ: ಗಣೇಶ ಚತುರ್ಥಿ)" required value={eventForm.title_kn} onChange={e => setEventForm({...eventForm, title_kn: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500" />
                
                {adminScenario !== 'weekly' ? (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Target Date Slot</label>
                    <input type="date" required value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]" />
                    {adminScenario === 'monthly' && <p className="text-[10px] text-amber-500 mt-1 italic">* Auto-generates a linked base Seva option configuration instantly.</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Target Day Routine Recurrence</label>
                    <select value={eventForm.day_of_week} onChange={e => setEventForm({...eventForm, day_of_week: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500">
                      <option value="Monday">Every Monday (Shiva Pooja Path)</option>
                      <option value="Thursday">Every Thursday (Sai Baba Aarti Track)</option>
                      <option value="Saturday">Every Saturday (Shanimahathma / Anjaneya)</option>
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition shadow-md">Deploy Event Anchor</button>
            </form>

            {/* CONTROL BLOCK 2: MANAGE RELATIONAL SUB-SEVA TIERS */}
            <form onSubmit={handleCreateSeva} className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/60 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400">🎟️ Step 2: Append Custom Sub-Seva Packages</h3>
              
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Parent Event Connection Context</label>
                <select value={sevaForm.event_id} onChange={e => setSevaForm({...sevaForm, event_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="">General Menu Item (Always Available Globally)</option>
                  {eventsPool.filter(e => e.scenario_type === 'yearly').map(fest => (
                    <option key={fest.id} value={fest.id}>Scenario 1 Sub-Event: {fest.title_en} ({fest.event_date})</option>
                  ))}
                  {eventsPool.filter(e => e.scenario_type === 'weekly').map(routine => (
                    <option key={routine.id} value={routine.id}>Scenario 3 Service: {routine.title_en} (Every {routine.day_of_week})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Seva Package Title (English)" required value={sevaForm.title_en} onChange={e => setSevaForm({...sevaForm, title_en: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500" />
                <input type="text" placeholder="ಪೂಜೆ ಉಪ-ವಿವರ (ಕನ್ನಡ)" required value={sevaForm.title_kn} onChange={e => setSevaForm({...sevaForm, title_kn: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500" />
                <input type="number" placeholder="Cost Pricing Matrix Value (INR ₹)" required value={sevaForm.cost} onChange={e => setSevaForm({...sevaForm, cost: e.target.value})} className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition shadow-md">Deploy Seva Schema</button>
            </form>

            {/* CONTROL BLOCK 3: ENGINE REALTIME TRANSACTION AUDIT STREAM */}
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400 mb-3">📋 Connected Ledger Inscription Pipeline</h3>
                <div className="max-h-72 overflow-y-auto space-y-2 text-[11px] font-mono pr-1">
                  {bookingsPool.map(book => (
                    <div key={book.id} className="border-b border-slate-700/40 pb-2 flex justify-between items-start">
                      <div>
                        <span className="text-amber-500 font-bold">{book.id}</span> - <span className="text-slate-300 font-semibold">{book.devotee_name}</span>
                        <p className="text-slate-400 truncate max-w-[180px] mt-0.5">{book.service_title}</p>
                      </div>
                      <span className="text-emerald-400 font-bold">₹{book.total_paid}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-right pt-3 border-t border-slate-700/40">
                System Core Health: <span className="text-emerald-500 font-bold">Operational Edge Connected</span>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* FOOTER UTILITY TAB NAVIGATION TERMINAL */}
      <footer className="bg-white border-t border-slate-200 sticky bottom-0 z-40 shadow-2xl max-w-5xl w-full mx-auto rounded-t-xl">
        <nav className="flex justify-around items-center py-2">
          {([['home', '🏠', 'Home', 'ಮುಖಪುಟ'], ['calendar', '📅', 'Calendar', 'ಕ್ಯಾಲೆಂಡರ್'], ['sevas', '✋', 'Sevas', 'ಸೇವೆಗಳು'], ['astrology', '✨', 'Astro', 'ಜ್ಯೋತಿಷ್ಯ'], ['donation', '🪙', 'Charity', 'ಕಾಣಿಕೆ']] as const).map(([tab, icon, labelEn, labelKn]) => (
            <button key={tab} type="button" onClick={() => { if(tab === 'sevas') setSelectedFestivalContext(null); setActiveTab(tab); }} className={`flex flex-col items-center flex-1 py-1 transition ${activeTab === tab ? 'text-amber-800 font-bold scale-105' : 'text-slate-400'}`}>
              <span className="text-xl">{icon}</span>
              <span className="text-[9px] tracking-wider uppercase font-semibold mt-0.5">{isKannada ? labelKn : labelEn}</span>
            </button>
          ))}
        </nav>
      </footer>

    </div>
  );
}