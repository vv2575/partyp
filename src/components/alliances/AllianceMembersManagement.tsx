// src/components/alliances/AllianceMembersManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { AllianceMember } from '@/types/alliance';
import { getCommunitiesInAlliance /*, approveCommunityJoin, rejectCommunityJoin, removeCommunityFromAlliance */ } from '@/firebase/allianceService';
// Assuming you might have functions like approveCommunityJoin, rejectCommunityJoin, removeCommunityFromAlliance in allianceService

interface AllianceMembersManagementProps {
  allianceId: string;
}

const AllianceMembersManagement: React.FC<AllianceMembersManagementProps> = ({ allianceId }) => {
  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AllianceMember[]>([]); // Placeholder for join requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const memberData = await getCommunitiesInAlliance(allianceId);
        // In a real app, you'd also fetch pending join requests separately
        // For now, we'll just use the current members as an example list
        setMembers(memberData.filter(m => m.status === 'approved')); // Assuming a 'status' field
        setPendingRequests(memberData.filter(m => m.status === 'pending')); // Assuming a 'status' field
        setError(null);
      } catch (err) {
        console.error('Error fetching alliance members for management:', err);
        setError('Failed to load members for management.');
      }
      setLoading(false);
    };

    if (allianceId) {
      fetchMembers();
    }
  }, [allianceId]);

  const handleApprove = async (communityId: string) => {
    console.log(`Placeholder: Approving community ${communityId} for alliance ${allianceId}`);
    alert(`Placeholder: Approved community ${communityId}`);
    // Call actual approveCommunityJoin(allianceId, communityId) and refetch/update state
  };

  const handleReject = async (communityId: string) => {
    console.log(`Placeholder: Rejecting community ${communityId} for alliance ${allianceId}`);
    alert(`Placeholder: Rejected community ${communityId}`);
    // Call actual rejectCommunityJoin(allianceId, communityId) and refetch/update state
  };

  const handleRemove = async (communityId: string) => {
    if (window.confirm('Are you sure you want to remove this community from the alliance?')) {
      console.log(`Placeholder: Removing community ${communityId} from alliance ${allianceId}`);
      alert(`Placeholder: Removed community ${communityId}`);
      // Call actual removeCommunityFromAlliance(allianceId, communityId) and refetch/update state
    }
  };

  if (loading) return <p className="text-gray-600">Loading member data...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Section for Pending Join Requests (Placeholder) */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-[#005A9C] mb-2">Pending Join Requests ({pendingRequests.length})</h4>
          <ul className="space-y-2">
            {pendingRequests.map(request => (
              <li key={request.communityId} className="p-3 bg-blue-50 rounded-md border border-blue-200 flex justify-between items-center">
                <span>{request.communityName} (Leader: {request.communityLeaderUid.substring(0,6)}...)</span>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleApprove(request.communityId)} 
                    className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(request.communityId)} 
                    className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pendingRequests.length === 0 && <p className="text-sm text-gray-500">No pending join requests.</p>}

      {/* Section for Current Members */}
      <div>
        <h4 className="text-lg font-medium text-[#005A9C] mb-2">Current Members ({members.length})</h4>
        {members.length > 0 ? (
          <ul className="space-y-2">
            {members.map(member => (
              <li key={member.communityId} className="p-3 bg-gray-100 rounded-md border border-gray-200 flex justify-between items-center">
                <div>
                  <span className="font-semibold">{member.communityName}</span>
                  <span className="text-xs text-gray-600 block">Leader UID: {member.communityLeaderUid}</span>
                  <span className="text-xs text-gray-500 block">Joined: {member.joinedAt ? new Date((member.joinedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                </div>
                <button 
                  onClick={() => handleRemove(member.communityId)} 
                  className="px-3 py-1 text-xs font-medium text-white bg-[#F57C00] rounded-md hover:bg-opacity-80 transition-colors"
                >
                  Remove Member
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No active members in this alliance.</p>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4">Full member management functionality (roles, permissions, etc.) will be implemented later.</p>
    </div>
  );
};

export default AllianceMembersManagement;
