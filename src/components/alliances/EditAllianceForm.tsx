// src/components/alliances/EditAllianceForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Alliance } from '@/types/alliance';
// import { updateAllianceDetails } from '@/firebase/allianceService'; // Would be used in full implementation

interface EditAllianceFormProps {
  alliance: Alliance;
}

const EditAllianceForm: React.FC<EditAllianceFormProps> = ({ alliance }) => {
  const [name, setName] = useState(alliance.name);
  const [description, setDescription] = useState(alliance.description || '');
  const [bannerImageUrl, setBannerImageUrl] = useState(alliance.bannerImageUrl || '');
  const [rules, setRules] = useState(alliance.rules || ''); // Assuming 'rules' is a field in your Alliance type
  const [visibility, setVisibility] = useState(alliance.visibility || 'public'); // Assuming 'visibility'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName(alliance.name);
    setDescription(alliance.description || '');
    setBannerImageUrl(alliance.bannerImageUrl || '');
    setRules(alliance.rules || '');
    setVisibility(alliance.visibility || 'public');
  }, [alliance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Alliance name cannot be empty.');
      return;
    }
    // In a full implementation, call updateAllianceDetails
    const updatedDetails = { name, description, bannerImageUrl, rules, visibility };
    console.log('Updating alliance:', alliance.allianceId, updatedDetails);
    setSuccess(`Placeholder: Alliance "${name}" details update initiated.`);
    alert('Placeholder: Alliance edit form submitted. See console for data.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div>
        <label htmlFor="editAllianceName" className="block text-sm font-medium text-gray-700 mb-1">Alliance Name</label>
        <input 
          type="text" 
          id="editAllianceName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D] transition-colors"
          placeholder="Your Alliance Name"
        />
      </div>
      <div>
        <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          id="editDescription" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D] transition-colors"
          placeholder="Describe your alliance..."
        />
      </div>
      <div>
        <label htmlFor="editBannerImageUrl" className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL (Optional)</label>
        <input 
          type="url" 
          id="editBannerImageUrl" 
          value={bannerImageUrl} 
          onChange={(e) => setBannerImageUrl(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D] transition-colors"
          placeholder="https://example.com/banner.jpg"
        />
      </div>
       <div>
        <label htmlFor="editAllianceRules" className="block text-sm font-medium text-gray-700 mb-1">Alliance Rules (Optional)</label>
        <textarea 
          id="editAllianceRules" 
          value={rules} 
          onChange={(e) => setRules(e.target.value)} 
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D] transition-colors"
          placeholder="Outline the rules and guidelines for your alliance members."
        />
      </div>
      <div>
        <label htmlFor="editAllianceVisibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select 
          id="editAllianceVisibility" 
          value={visibility} 
          onChange={(e) => setVisibility(e.target.value as 'public' | 'private')} 
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D] transition-colors bg-white"
        >
          <option value="public">Public</option>
          <option value="private">Private (Invite Only)</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
      {success && <p className="text-sm text-green-600 p-2 bg-green-50 rounded-md">{success}</p>}
      <button 
        type="submit" 
        className="w-full py-3 px-4 bg-[#F57C00] text-white font-semibold rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F57C00] transition-transform transform hover:scale-105 shadow-md"
      >
        Save Changes (Placeholder)
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">This is a placeholder form. Changes are not saved yet.</p>
    </form>
  );
};

export default EditAllianceForm;
