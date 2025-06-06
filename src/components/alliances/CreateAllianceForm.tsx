// src/components/alliances/CreateAllianceForm.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/user';
// import { createAlliance } from '@/firebase/allianceService'; // Would be used in full implementation

const CreateAllianceForm: React.FC = () => {
  const { currentUser } = useAuth() as { currentUser: User | null };
  const [allianceName, setAllianceName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentUser) {
      setError('You must be logged in to create an alliance.');
      return;
    }
    if (!allianceName.trim() || !description.trim()) {
      setError('Alliance name and description are required.');
      return;
    }
    // In a full implementation, you would call createAlliance here
    // For now, this is a placeholder.
    console.log('Submitting alliance:', { allianceName, description });
    setSuccess(`Placeholder: Alliance "${allianceName}" creation initiated.`);
    // setAllianceName('');
    // setDescription('');
    alert('Placeholder: Alliance creation form submitted. See console for data.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-[#005A9C]">Create New Alliance</h3>
      <div>
        <label htmlFor="allianceName" className="block text-sm font-medium text-gray-700 mb-1">Alliance Name</label>
        <input 
          type="text" 
          id="allianceName" 
          value={allianceName} 
          onChange={(e) => setAllianceName(e.target.value)} 
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D]"
          placeholder="e.g., The Grand Designers"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00A99D] focus:border-[#00A99D]"
          placeholder="A brief description of your alliance's purpose and goals."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <button 
        type="submit" 
        className="w-full py-2 px-4 bg-[#F57C00] text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors duration-150 ease-in-out shadow-sm"
      >
        Create Alliance (Placeholder)
      </button>
      <p className="text-xs text-gray-500 text-center">This is a placeholder form. Full functionality will be added later.</p>
    </form>
  );
};

export default CreateAllianceForm;
