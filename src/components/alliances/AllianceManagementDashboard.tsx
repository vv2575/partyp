// src/components/alliances/AllianceManagementDashboard.tsx
'use client';

import React from 'react';
import CreateAllianceForm from './CreateAllianceForm';
import EditAllianceForm from './EditAllianceForm';
import AllianceMembersManagement from './AllianceMembersManagement';
import type { Alliance } from '@/types/alliance';
import type { User } from '@/types/user';

interface AllianceManagementDashboardProps {
  alliance: Alliance;
  currentUser: User | null;
}

const AllianceManagementDashboard: React.FC<AllianceManagementDashboardProps> = ({ alliance, currentUser }) => {
  // Basic permission check: only alliance creator can see management tools
  // This should be expanded with roles and permissions in a real app
  const canManage = currentUser?.uid === alliance.creatorUid;

  if (!canManage) {
    return null; // Or a message indicating lack of permission
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 space-y-6">
      <h3 className="text-2xl font-semibold text-[#005A9C] border-b pb-3 mb-4">Alliance Management</h3>
      
      {/* Placeholder for Edit Alliance Details */}
      <div className="p-4 border rounded-md bg-gray-50">
        <h4 className="text-xl font-medium text-[#00A99D] mb-2">Edit Alliance Details</h4>
        <EditAllianceForm alliance={alliance} />
      </div>

      {/* Placeholder for Manage Members */}
      <div className="p-4 border rounded-md bg-gray-50">
        <h4 className="text-xl font-medium text-[#00A99D] mb-2">Manage Members</h4>
        <AllianceMembersManagement allianceId={alliance.allianceId} />
      </div>

      {/* CreateAllianceForm is usually not here, but included as per request for components */}
      {/* This would typically be on a different page or a global "Create Alliance" button */}
      {/* <div className="p-4 border rounded-md bg-gray-50">
        <h4 className="text-xl font-medium text-[#00A99D] mb-2">Create New Alliance (Placeholder)</h4>
        <CreateAllianceForm /> 
      </div> */}
      
      <p className="text-sm text-gray-500 mt-4">
        More management options will be available here.
      </p>
    </div>
  );
};

export default AllianceManagementDashboard;
