'use client';

import React, { useEffect, useState } from 'react';
import type { AllianceMember } from '@/types/alliance'; // Assuming path
import { getCommunitiesInAlliance } from '@/firebase/allianceService'; // Assuming path
import AllianceMemberListItem from './AllianceMemberListItem'; // Import AllianceMemberListItem

interface AllianceMemberListProps {
  allianceId: string;
  initialMembers?: AllianceMember[]; // Optional: pass initial members to avoid re-fetch on page load if already available
}

const AllianceMemberList: React.FC<AllianceMemberListProps> = ({ allianceId, initialMembers }) => {
  const [members, setMembers] = useState<AllianceMember[]>(initialMembers || []);
  const [loading, setLoading] = useState(!initialMembers || initialMembers.length === 0); // Set loading if no initial members or empty array
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if initialMembers were not provided or are empty
    if ((!initialMembers || initialMembers.length === 0) && allianceId) {
      setLoading(true);
      getCommunitiesInAlliance(allianceId)
        .then(data => {
          setMembers(data);
          setError(null);
        })
        .catch(err => {
          console.error('Error fetching alliance members:', err);
          setError('Failed to load member communities.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (initialMembers && initialMembers.length > 0) {
      // If initialMembers are provided and not empty, no need to load further unless allianceId changes and triggers refetch.
      setLoading(false); 
    }
  }, [allianceId, initialMembers]); // Rerun if allianceId or initialMembers reference changes

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading members...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (members.length === 0) {
    return <p className="text-gray-500 text-center py-4">No member communities found in this alliance yet.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold text-[#005A9C] mb-4">Member Communities ({members.length})</h3>
      <ul className="space-y-3">
        {members.map(member => (
          <AllianceMemberListItem key={member.communityId} member={member} />
        ))}
      </ul>
    </div>
  );
};

export default AllianceMemberList;
