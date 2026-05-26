'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  // Form states - Dual Language Support
  const [titleEn, setTitleEn] = useState('');
  const [titleKn, setTitleKn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionKn, setDescriptionKn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'templeadmin123') {
      setIsAuthenticated(true);
      setMessage({ type: '', text: '' });
    } else {
      setMessage({ type: 'error', text: 'Invalid password. Please try again.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate that all fields are filled so we don't end up with half-empty layouts
    if (!titleEn || !titleKn || !descriptionEn || !descriptionKn || !imageUrl) {
      setMessage({ type: 'error', text: 'Please fill in all English and Kannada fields.' });
      setLoading(false);
      return;
    }

    // Insert the records matching our updated Supabase columns perfectly
    const { error } = await supabase.from('daily_darshan').insert([
      {
        title_en: titleEn,
        title_kn: titleKn,
        description_en: descriptionEn,
        description_kn: descriptionKn,
        image_url: imageUrl,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Database Error: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Darshan updated successfully in both languages! Redirecting...' });
      
      // Clear all form inputs
      setTitleEn('');
      setTitleKn('');
      setDescriptionEn('');
      setDescriptionKn('');
      setImageUrl('');
      
      // Navigate right back home to look at the fresh cards
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 text-[#3c2f2f]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#eaddcd] p-8 text-center">
          <h1 className="text-2xl font-serif font-bold text-[#4a1c1c] mb-2">Admin Security Gate</h1>
          <p className="text-sm text-[#8c7e7e] mb-6">Please enter your password to modify details.</p>
          
          {message.text && (
            <div className="p-3 rounded-xl text-sm mb-4 bg-red-50 text-red-800 border border-red-200">
              {message.text}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-[#eaddcd] focus:outline-none text-center focus:ring-2 focus:ring-[#4a1c1c]"
            />
            <button type="submit" className="w-full bg-[#4a1c1c] hover:bg-[#5a2e2e] text-[#f7efe5] font-bold py-2 px-4 rounded-xl transition shadow-sm">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] py-12 px-4 text-[#3c2f2f]">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-[#eaddcd] p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#4a1c1c]">Temple Admin Panel</h1>
            <p className="text-sm text-[#8c7e7e]">Update daily updates in English &amp; ಕನ್ನಡ simultaneously.</p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)} 
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg"
          >
            Lock
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ENGLISH INPUT BLOCK */}
          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">English Content</h3>
            <div>
              <label className="block text-xs font-bold text-[#5a2e2e] mb-1">Darshan Title / Deity (English)</label>
              <input
                type="text"
                placeholder="e.g., Special Alankara blessing"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-2 bg-white rounded-xl border border-[#eaddcd] focus:outline-none focus:ring-2 focus:ring-[#4a1c1c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a2e2e] mb-1">Description / Message (English)</label>
              <textarea
                rows={3}
                placeholder="Enter daily updates or prayers here..."
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full px-4 py-2 bg-white rounded-xl border border-[#eaddcd] focus:outline-none focus:ring-2 focus:ring-[#4a1c1c] whitespace-pre-line"
              />
            </div>
          </div>

          {/* KANNADA INPUT BLOCK */}
          <div className="p-4 bg-[#fdfbf7] rounded-2xl border border-[#eedecb]/60 space-y-4">
            <h3 className="text-sm font-bold text-[#8c503a] uppercase tracking-wider">ಕನ್ನಡ ವಿಷಯ (Kannada Content)</h3>
            <div>
              <label className="block text-xs font-bold text-[#5a2e2e] mb-1">ದರ್ಶನದ ಶೀರ್ಷಿಕೆ / ದೇವತೆ (Kannada)</label>
              <input
                type="text"
                placeholder="ಉದಾಹರಣೆಗೆ: ವಿಶೇಷ ಅಲಂಕಾರ ಪೂಜೆ"
                value={titleKn}
                onChange={(e) => setTitleKn(e.target.value)}
                className="w-full px-4 py-2 bg-white rounded-xl border border-[#eaddcd] focus:outline-none focus:ring-2 focus:ring-[#4a1c1c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5a2e2e] mb-1">ವಿವರಣೆ / ದೈನಂದಿನ ಸಂದೇಶ (Kannada)</label>
              <textarea
                rows={3}
                placeholder="ಇಂದಿನ ಪೂಜಾ ವಿವರಗಳು ಅಥವಾ ಶುಭಾಶಯಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
                value={descriptionKn}
                onChange={(e) => setDescriptionKn(e.target.value)}
                className="w-full px-4 py-2 bg-white rounded-xl border border-[#eaddcd] focus:outline-none focus:ring-2 focus:ring-[#4a1c1c] whitespace-pre-line"
              />
            </div>
          </div>

          {/* SHARED IMAGE URL BLOCK */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-[#5a2e2e]">Image URL Address</label>
            <input
              type="url"
              placeholder="https://upload.wikimedia.org/...image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-[#eaddcd] focus:outline-none focus:ring-2 focus:ring-[#4a1c1c]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4a1c1c] hover:bg-[#5a2e2e] text-[#f7efe5] font-black py-3.5 px-4 rounded-xl transition duration-200 shadow-md disabled:opacity-50 text-lg"
          >
            {loading ? 'Publishing Blessings...' : 'Publish Daily Darshan (ಪ್ರಕಟಿಸಿ)'}
          </button>
        </form>
      </div>
    </main>
  );
}