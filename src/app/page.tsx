'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';

interface DarshanData {
  title_en: string;
  title_kn: string;
  description_en: string;
  description_kn: string;
  image_url: string;
}

interface SevaItem {
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

type ActiveTab = 'darshan' | 'sevas' | 'calendar';

export default function Home() {
  const [lang, setLang] = useState<'kn' | 'en'>('kn');
  const [activeTab, setActiveTab] = useState<ActiveTab>('darshan'); // Default to Darshan view
  const [darshan, setDarshan] = useState<DarshanData | null>(null);
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Seva Booking States
  const [selectedSeva, setSelectedSeva] = useState<SevaItem | null>(null);
  const [devoteeName, setDevoteeName] = useState('');
  const [gothra, setGothra] = useState('');
  const [rashi, setRashi] = useState('');
  const [sankalpaDate, setSankalpaDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const sevasList: SevaItem[] = [
    { id: '1', name_en: 'Daily Kumkumarchana', name_kn: 'ದೈನಂದಿನ ಕುಂಕುಮಾರ್ಚನೆ', price: 51 },
    { id: '2', name_en: 'Special Rudrabhisheka', name_kn: 'ವಿಶೇಷ ರುದ್ರಾಭಿಷೇಕ ಪೂಜೆ', price: 101 },
    { id: '3', name_en: 'Sankashta Hara Chaturthi Seva', name_kn: 'ಸಂಕಷ್ಟಹರ ಚತುರ್ಥಿ ವಿಶೇಷ ಸೇವೆ', price: 251 },
    { id: '4', name_en: 'Pradosha Pooja Bilvarchana', name_kn: 'ಪ್ರದೋಷ ಪೂಜೆ ಬಿಲ್ವಾರ್ಚನೆ', price: 151 },
  ];

  useEffect(() => {
    async function fetchTempleData() {
      try {
        const { data: darshanData } = await supabase
          .from('daily_darshan')
          .select('title_en, title_kn, description_en, description_kn, image_url')
          .order('created_at', { ascending: false })
          .limit(1);

        if (darshanData && darshanData.length > 0) {
          setDarshan(darshanData[0]);
        }

        const { data: eventData } = await supabase
          .from('temple_events')
          .select('id, event_date, title_en, title_kn, is_major_festival')
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(6);

        if (eventData) {
          setEvents(eventData);
        }
      } catch (err) {
        console.error('Error fetching database data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTempleData();
  }, []);

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' };
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-IN' : 'kn-IN', options);
  };

  const text = {
    en: {
      templeName: 'Sri Gowrishankara Temple',
      location: 'Chikkalasandra, Bengaluru',
      tabDarshan: '🌅 Darshan',
      tabSevas: '🛕 Seva Booking',
      tabCalendar: '📅 Festivals',
      darshanTitle: "Today's Daily Darshan",
      loading: 'Loading Blessings...',
      noDarshan: 'No Darshan details available for today.',
      btnMap: '📍 View Map & Route',
      btnCall: '📞 Call Temple Priest',
      btnShare: '💬 Share on WhatsApp',
      timings: 'Temple Timings',
      morning: 'Morning: 6:00 AM – 11:30 AM',
      evening: 'Evening: 5:30 PM – 8:30 PM',
      calendarHeader: 'Upcoming Festivals & Auspicious Days',
      noEvents: 'No special events listed for this month.',
      sevaHeader: 'Book Sacred Sevas Online',
      sevaSub: 'Fill details and pay securely via UPI instantly.',
      lblPrice: 'Token Amount: ₹',
      btnBookNow: 'Book Seva / ಸೇವೆ ಕಾಯ್ದಿರಿಸಿ',
      formHeader: 'Devotee Sankalpa Details',
      lblName: 'Devotee Name / ಭಕ್ತರ ಹೆಸರು *',
      lblGothra: 'Gothra / ಗೋತ್ರ (Optional)',
      lblRashi: 'Rashi / ರಾಶಿ (Optional)',
      lblDate: 'Sankalpa Date / ಪೂಜಾ ದಿನಾಂಕ *',
      btnPaySubmit: 'Pay Token & Confirm Booking',
      msgSuccess: '✨ Seva Booked Successfully! Recieved by Temple Desk. ✨',
      btnClose: 'Close / ಮುಚ್ಚಿ'
    },
    kn: {
      templeName: 'ಶ್ರೀ ಗೌರಿಶಂಕರ ದೇವಸ್ಥಾನ',
      location: 'ಚಿಕ್ಕಲಸಂದ್ರ, ಬೆಂಗಳೂರು',
      tabDarshan: '🌅 ದರ್ಶನ',
      tabSevas: '🛕 ಸೇವೆಗಳು',
      tabCalendar: '📅 ಹಬ್ಬಗಳು',
      darshanTitle: 'ಇಂದಿನ ದೈನಂದಿನ ದರ್ಶನ',
      loading: 'ದರ್ಶನ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      noDarshan: 'ಇಂದಿನ ದರ್ಶನದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
      btnMap: '📍 ದಾರಿಯ ನಕ್ಷೆ (ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್)',
      btnCall: '📞 ಅರ್ಚಕರನ್ನು ಸಂಪರ್ಕಿಸಿ',
      btnShare: '💬 ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ',
      timings: 'ದೇವಸ್ಥಾನದ ಸಮಯ',
      morning: 'ಬೆಳಗ್ಗೆ: 6:00 ರಿಂದ 11:30',
      evening: 'ಸಂಜೆ: 5:30 ರಿಂದ 8:30',
      calendarHeader: 'ಮುಂಬರುವ ಹಬ್ಬಗಳು ಮತ್ತು ವಿಶೇಷ ದಿನಗಳು',
      noEvents: 'ಈ ತಿಂಗಳು ಯಾವುದೇ ವಿಶೇಷ ಆಚರಣೆಗಳು ಪಟ್ಟಿಯಾಗಿಲ್ಲ.',
      sevaHeader: 'ಆನ್‌ಲೈನ್ ಸೇವಾ ಬುಕಿಂಗ್',
      sevaSub: 'ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಯುಪಿಐ (UPI) ಮೂಲಕ ತಕ್ಷಣ ಪಾವತಿಸಿ.',
      lblPrice: 'ಸೇವಾ ಕಾಣಿಕೆ: ₹',
      btnBookNow: 'ಸೇವೆ ಕಾಯ್ದಿರಿಸಿ',
      formHeader: 'ಭಕ್ತರ ಸಂಕಲ್ಪ ವಿವರಗಳು',
      lblName: 'ಭಕ್ತರ ಹೆಸರು (Devotee Name) *',
      lblGothra: 'ಗೋತ್ರ (Gothra - ಐಚ್ಛಿಕ)',
      lblRashi: 'ರಾಶಿ (Rashi - ಐಚ್ಛಿಕ)',
      lblDate: 'ಸಂಕಲ್ಪ ದಿನಾಂಕ (Sankalpa Date) *',
      btnPaySubmit: 'ಕಾಣಿಕೆ ಪಾವತಿಸಿ ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ',
      msgSuccess: '✨ ಸೇವೆ ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ! ಅರ್ಚಕರ ಮಂಡಳಿಗೆ ತಲುಪಿದೆ. ✨',
      btnClose: 'ಮುಚ್ಚಿ'
    }
  };

  const handleSevaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeva || !devoteeName || !sankalpaDate) return;
    setBookingLoading(true);

    setTimeout(async () => {
      const mockPaymentId = 'PAY_UPI_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      try {
        await supabase.from('seva_bookings').insert([
          {
            seva_name_en: selectedSeva.name_en,
            seva_name_kn: selectedSeva.name_kn,
            price: selectedSeva.price,
            devotee_name: devoteeName,
            gothra: gothra || 'Not Specified',
            rashi: rashi || 'Not Specified',
            sankalpa_date: sankalpaDate,
            payment_status: 'Paid',
            payment_id: mockPaymentId
          }
        ]);
        setBookingSuccess(true);
        setDevoteeName(''); setGothra(''); setRashi(''); setSankalpaDate('');
      } catch (err) {
        console.error(err);
      } finally {
        setBookingLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] pb-36 font-sans antialiased text-[#3c2f2f]">
      
      {/* FIXED HEADER BLOCK */}
      <header className="bg-white border-b border-[#eedecb] px-4 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#4a1c1c] tracking-tight">{text[lang].templeName}</h1>
            <p className="text-sm font-bold text-[#8c7355] mt-0.5">{text[lang].location}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            className="bg-[#4a1c1c] text-white font-black py-2.5 px-4 rounded-xl shadow-sm text-base border border-[#eedecb]"
          >
            {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>
        </div>
      </header>

      {/* FIXED TAB NAVIGATION ENGINE */}
      <div className="bg-white sticky top-0 z-30 border-b-2 border-[#eedecb] shadow-sm px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveTab('darshan')}
            className={`py-3.5 text-center font-black rounded-xl text-base transition-all active:scale-95 ${
              activeTab === 'darshan'
                ? 'bg-[#4a1c1c] text-white shadow-md'
                : 'bg-[#faf6f0] text-[#5a4848] hover:bg-[#eedecb]/40'
            }`}
          >
            {text[lang].tabDarshan}
          </button>

          <button
            onClick={() => setActiveTab('sevas')}
            className={`py-3.5 text-center font-black rounded-xl text-base transition-all active:scale-95 ${
              activeTab === 'sevas'
                ? 'bg-[#4a1c1c] text-white shadow-md'
                : 'bg-[#faf6f0] text-[#5a4848] hover:bg-[#eedecb]/40'
            }`}
          >
            {text[lang].tabSevas}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3.5 text-center font-black rounded-xl text-base transition-all active:scale-95 ${
              activeTab === 'calendar'
                ? 'bg-[#4a1c1c] text-white shadow-md'
                : 'bg-[#faf6f0] text-[#5a4848] hover:bg-[#eedecb]/40'
            }`}
          >
            {text[lang].tabCalendar}
          </button>
        </div>
      </div>

      {/* CORE TAB DYNAMIC RENDER PORTAL */}
      <main className="max-w-md mx-auto p-4">
        
        {/* VIEW 1: DAILY DARSHAN TAB */}
        {activeTab === 'darshan' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#eedecb] space-y-4">
              <h2 className="text-lg font-black text-[#8c503a] uppercase tracking-wide border-b border-dashed border-[#eedecb] pb-2">
                {text[lang].darshanTitle}
              </h2>
              {loading ? (
                <p className="text-center py-12 font-bold text-[#8c7e7e] animate-pulse">{text[lang].loading}</p>
              ) : darshan ? (
                <div className="space-y-4">
                  <div className="relative w-full h-[350px] rounded-2xl overflow-hidden border border-[#eedecb]">
                    <Image src={darshan.image_url} alt="Deity View" fill className="object-cover" priority />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-[#4a1c1c]">{lang === 'en' ? darshan.title_en : darshan.title_kn}</h3>
                    <p className="text-lg text-gray-800 font-bold bg-[#fdfbf7] p-3 rounded-xl border border-[#eedecb]/60">
                      {lang === 'en' ? darshan.description_en : darshan.description_kn}
                    </p>
                  </div>
                </div>
              ) : <p>{text[lang].noDarshan}</p>}
            </section>

            {/* TIMINGS CONTAINER EMBEDDED IN DARSHAN FOR EASY UTILITY */}
            <section className="bg-white rounded-2xl p-5 border border-[#eedecb] space-y-1">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">{text[lang].timings}</h4>
              <p className="text-base font-bold text-gray-700">{text[lang].morning}</p>
              <p className="text-base font-bold text-gray-700">{text[lang].evening}</p>
            </section>
          </div>
        )}

        {/* VIEW 2: SEVA BOOKING TAB */}
        {activeTab === 'sevas' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-1">
              <h2 className="text-xl font-black text-[#4a1c1c]">{text[lang].sevaHeader}</h2>
              <p className="text-sm text-gray-500 font-medium">{text[lang].sevaSub}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {sevasList.map((seva) => (
                <div key={seva.id} className="bg-white rounded-2xl p-4 border-2 border-[#eedecb] shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[#4a1c1c]">{lang === 'en' ? seva.name_en : seva.name_kn}</h3>
                    <p className="text-md font-bold text-[#da7b34] mt-0.5">{text[lang].lblPrice}{seva.price}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedSeva(seva); setBookingSuccess(false); }}
                    className="w-full bg-[#8c503a] hover:bg-[#a05f47] text-white font-black py-3.5 rounded-xl text-md shadow-sm"
                  >
                    {text[lang].btnBookNow}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: EVENTS CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#eedecb] space-y-3 animate-fade-in">
            <h2 className="text-lg font-black text-[#4a1c1c] tracking-tight mb-2">
              {text[lang].calendarHeader}
            </h2>
            <div className="space-y-2.5">
              {events.length > 0 ? (
                events.map((event) => (
                  <div 
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-2xl border ${
                      event.is_major_festival ? 'bg-amber-50/60 border-amber-200' : 'bg-[#faf6f0]/40 border-gray-100'
                    }`}
                  >
                    <div className="bg-[#4a1c1c] text-[#f7efe5] rounded-xl py-2 px-3 text-center min-w-[75px]">
                      <span className="block text-xs font-bold uppercase opacity-90">
                        {new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'kn-IN', { month: 'short' })}
                      </span>
                      <span className="block text-xl font-black">{new Date(event.event_date).getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold leading-tight ${event.is_major_festival ? 'text-[#4a1c1c] font-black' : 'text-gray-800'}`}>
                        {lang === 'en' ? event.title_en : event.title_kn}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">{formatDate(event.event_date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 font-bold text-center py-4">{text[lang].noEvents}</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* SANKALPA DRAWER MODAL OVERLAY */}
      {selectedSeva && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 border-t-4 border-[#4a1c1c] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="bg-orange-50 text-[#da7b34] text-xs font-black px-2.5 py-1 rounded-md uppercase">Booking Seva</span>
                <h3 className="text-xl font-black text-[#4a1c1c] mt-1">{lang === 'en' ? selectedSeva.name_en : selectedSeva.name_kn}</h3>
                <p className="text-md font-bold text-gray-500">{text[lang].lblPrice}{selectedSeva.price}</p>
              </div>
              <button onClick={() => setSelectedSeva(null)} className="text-gray-400 text-2xl font-black px-2">×</button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto">✓</div>
                <p className="text-lg font-bold text-green-800 px-2">{text[lang].msgSuccess}</p>
                <button onClick={() => setSelectedSeva(null)} className="bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm">{text[lang].btnClose}</button>
              </div>
            ) : (
              <form onSubmit={handleSevaSubmit} className="space-y-4">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider">{text[lang].formHeader}</h4>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{text[lang].lblName}</label>
                  <input type="text" required placeholder="e.g. Ramesh Kumar" value={devoteeName} onChange={(e) => setDevoteeName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-[#eedecb] text-base font-medium focus:outline-none focus:border-[#4a1c1c]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{text[lang].lblGothra}</label>
                    <input type="text" placeholder="e.g. Shiva" value={gothra} onChange={(e) => setGothra(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#eedecb] text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{text[lang].lblRashi}</label>
                    <input type="text" placeholder="e.g. Simha" value={rashi} onChange={(e) => setRashi(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#eedecb] text-base" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{text[lang].lblDate}</label>
                  <input type="date" required value={sankalpaDate} onChange={(e) => setSankalpaDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-[#eedecb] text-base font-medium focus:outline-none focus:border-[#4a1c1c]" />
                </div>
                <button type="submit" disabled={bookingLoading} className="w-full bg-[#4a1c1c] text-white font-black text-lg py-4 rounded-xl shadow-md disabled:opacity-50">
                  {bookingLoading ? 'Verifying UPI Wallet...' : text[lang].btnPaySubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FIXED BOTTOM EMBEDDED UTILITIES */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#eedecb] shadow-md px-4 py-3 z-30">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <a href="http://googleusercontent.com/maps.google.com/4" target="_blank" rel="noopener noreferrer" className="bg-[#da7b34] text-white font-black text-center text-md py-3.5 rounded-xl flex items-center justify-center">{text[lang].btnMap}</a>
          <a href="tel:+919876543210" className="bg-[#4a1c1c] text-white font-black text-center text-md py-3.5 rounded-xl flex items-center justify-center">{text[lang].btnCall}</a>
        </div>
      </div>

    </div>
  );
}