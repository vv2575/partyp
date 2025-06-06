'use client';

import React from 'react';
import Link from 'next/link';
import type { AllianceMember } from '@/types/alliance'; // Assuming path
// import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'; // Example icons

interface AllianceMemberListItemProps {
  member: AllianceMember;
}

const AllianceMemberListItem: React.FC<AllianceMemberListItemProps> = ({ member }) => {
  return (
    <li className="flex items-center justify-between p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3">
        {/* Placeholder for a community icon or avatar */}
        <div className="w-10 h-10 bg-[#00A99D] rounded-full flex items-center justify-center text-white font-semibold">
          {member.communityName.charAt(0).toUpperCase()}
        </div>
        <div>
          <Link href={`/communities/${member.communityId}`} legacyBehavior>
            <a className="font-semibold text-lg text-[#005A9C] hover:underline hover:text-[#F57C00]">
              {member.communityName}
            </a>
          </Link>
          <p className="text-sm text-gray-500">
            Leader: 
            <Link href={`/profile/${member.communityLeaderUid}`} legacyBehavior> 
              <a className="text-[#00A99D] hover:underline ml-1">View Profile</a>
            </Link>
          </p>
        </div>
      </div>
      {/* Additional actions or info can go here, e.g., a 'View Community' button if not using the name as a link */}
      <Link href={`/communities/${member.communityId}`} legacyBehavior>
        <a className="px-4 py-2 text-sm bg-[#F57C00] text-white rounded-md hover:bg-opacity-90 transition-colors">
            View Community
        </a>
      </Link>
    </li>
  );
};

export default AllianceMemberListItem;
