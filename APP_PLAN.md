# Political Platform App - Development Plan

## I. Project Overview

*   **Project Name**: (To be decided, e.g., CivicLink, PolitiConnect, CommunityAccord)
*   **Goal**: To create a political platform designed to foster community-driven collaboration and influence through a structured hierarchy. Users can create/join communities, form alliances, and engage in discussions to amplify their collective impact.
*   **Tech Stack**:
    *   Frontend: Next.js (App Router)
    *   Backend & Database: Firebase (Authentication, Firestore, Cloud Storage, Cloud Functions)

## II. Core Entities & Data Models (Firestore)

This section outlines the primary collections and their document structures in Cloud Firestore.

1.  **`users` Collection**
    *   Document ID: `uid` (from Firebase Authentication)
    *   Fields:
        *   `displayName`: (string) User's public name.
        *   `email`: (string) User's email (unique).
        *   `photoURL`: (string, optional) URL to profile picture.
        *   `location`: (string, optional) User-defined location.
        *   `expertise`: (array of strings, optional) User-defined areas of expertise.
        *   `bio`: (string, optional) Short user biography.
        *   `createdAt`: (timestamp) Account creation date.
        *   `updatedAt`: (timestamp) Last profile update.
        *   `ledCommunityIds`: (array of strings, optional) IDs of communities led by this user.
        *   `createdAllianceIds`: (array of strings, optional) IDs of alliances created by this user.

2.  **`communities` Collection**
    *   Document ID: Auto-generated (e.g., `communityId`)
    *   Fields:
        *   `name`: (string) Name of the community.
        *   `description`: (string) Detailed description.
        *   `type`: (enum: "location" | "expertise") Basis of the community.
        *   `basisDetail`: (string) Specific location (e.g., "New York City") or expertise (e.g., "Environmental Policy").
        *   `leaderUid`: (string) `uid` of the community leader (references `users` collection).
        *   `leaderName`: (string) Denormalized leader's display name for quick display.
        *   `memberCount`: (number) Denormalized count of active members.
        *   `allianceId`: (string, optional) ID of the alliance this community belongs to (references `alliances` collection).
        *   `allianceName`: (string, optional) Denormalized name of the alliance.
        *   `createdAt`: (timestamp) Community creation date.
        *   `updatedAt`: (timestamp) Last update to community details.
        *   `bannerImageUrl`: (string, optional) URL for community banner.

3.  **`communityMembers` Collection** (Tracks membership and roles within communities)
    *   Document ID: Composite key `communityId_userId` or auto-generated.
    *   Fields:
        *   `communityId`: (string) References `communities` collection.
        *   `userId`: (string) References `users` collection.
        *   `userDisplayName`: (string) Denormalized for easy listing.
        *   `userPhotoURL`: (string, optional) Denormalized.
        *   `role`: (enum: "leader" | "member") - Note: Leader info is also primary in `communities.leaderUid`.
        *   `status`: (enum: "pending" | "approved" | "rejected" | "banned")
        *   `joinedAt`: (timestamp, if approved) Date of joining.
        *   `requestedAt`: (timestamp) Date of join request.

4.  **`communityPosts` Collection** (Posts within a specific community's discussion page)
    *   Document ID: Auto-generated (e.g., `postId`)
    *   Fields:
        *   `communityId`: (string) References `communities` collection.
        *   `authorUid`: (string) `uid` of the post author (references `users` collection).
        *   `authorDisplayName`: (string) Denormalized author's name.
        *   `authorPhotoURL`: (string, optional) Denormalized author's photo.
        *   `content`: (text) The main content of the post.
        *   `mediaUrls`: (array of strings, optional) URLs for images/videos attached.
        *   `createdAt`: (timestamp) Post creation time.
        *   `updatedAt`: (timestamp) Last edit time.
        *   `likesCount`: (number, default: 0)
        *   `commentsCount`: (number, default: 0)
    *   Subcollection: **`comments`**
        *   Document ID: Auto-generated (`commentId`)
        *   Fields: `authorUid`, `authorDisplayName`, `authorPhotoURL`, `content`, `createdAt`, `likesCount`.

5.  **`alliances` Collection**
    *   Document ID: Auto-generated (e.g., `allianceId`)
    *   Fields:
        *   `name`: (string) Name of the alliance.
        *   `description`: (string) Detailed description.
        *   `creatorUid`: (string) `uid` of the alliance creator (must be a community leader, references `users` collection).
        *   `creatorName`: (string) Denormalized creator's display name.
        *   `memberCommunityCount`: (number) Denormalized count of communities in the alliance.
        *   `createdAt`: (timestamp) Alliance creation date.
        *   `updatedAt`: (timestamp) Last update to alliance details.
        *   `bannerImageUrl`: (string, optional) URL for alliance banner.

6.  **`allianceMembers` Collection** (Tracks communities that are members of an alliance)
    *   Document ID: Composite key `allianceId_communityId` or auto-generated.
    *   Fields:
        *   `allianceId`: (string) References `alliances` collection.
        *   `communityId`: (string) References `communities` collection.
        *   `communityName`: (string) Denormalized community name.
        *   `communityLeaderUid`: (string) Denormalized leader UID of the member community.
        *   `joinedAt`: (timestamp) Date community joined the alliance.

7.  **`alliancePosts` Collection** (Posts within an alliance's discussion page)
    *   Document ID: Auto-generated (e.g., `postId`)
    *   Fields:
        *   `allianceId`: (string) References `alliances` collection.
        *   `authorUid`: (string) `uid` of the post author (references `users` collection).
        *   `authorDisplayName`: (string) Denormalized.
        *   `authorPhotoURL`: (string, optional) Denormalized.
        *   `authorCommunityId`: (string) ID of the community the author belongs to (references `communities`).
        *   `authorCommunityName`: (string) Denormalized name of the author's community.
        *   `content`: (text) Main content.
        *   `mediaUrls`: (array of strings, optional)
        *   `createdAt`: (timestamp)
        *   `updatedAt`: (timestamp)
        *   `likesCount`: (number, default: 0)
        *   `commentsCount`: (number, default: 0)
    *   Subcollection: **`comments`**
        *   Similar structure to `communityPosts.comments`.

8.  **`notifications` Collection**
    *   Document ID: Auto-generated (`notificationId`)
    *   Fields:
        *   `userId`: (string) The user to whom the notification is addressed.
        *   `type`: (enum: "join_request", "request_approved", "request_rejected", "new_community_post", "new_alliance_post", "new_comment", "alliance_invite", "alliance_invite_accepted")
        *   `message`: (string) Notification text.
        *   `link`: (string, optional) URL to the relevant page (e.g., community page, post).
        *   `isRead`: (boolean, default: false)
        *   `createdAt`: (timestamp)
        *   `relatedEntityId`: (string, optional) ID of the community, post, user, etc. related to the notification.

## III. Next.js App Router Structure

*   `/` (Home/Dashboard: Feed of relevant activity, links to communities/alliances)
*   `/auth`
    *   `/login` (Login page)
    *   `/signup` (Signup page)
    *   `/forgot-password` (Password reset)
*   `/profile`
    *   `/[userId]` (View user profile)
    *   `/edit` (Edit current user's profile)
*   `/communities`
    *   `/` (Discover communities: list, search, filter)
    *   `/create` (Form to create a new community)
    *   `/[communityId]` (Community landing page)
        *   `/` (Default view: discussion or overview)
        *   `/discussion` (Main discussion forum for the community)
        *   `/members` (List of members; for leader: manage members, view join requests)
        *   `/settings` (For leader: edit community details, manage settings)
*   `/alliances`
    *   `/` (Discover alliances: list, search)
    *   `/create` (Form to create a new alliance - accessible by community leaders)
    *   `/[allianceId]` (Alliance landing page)
        *   `/` (Default view: discussion or overview)
        *   `/discussion` (Main discussion forum for the alliance - members of allied communities)
        *   `/communities` (List of communities part of this alliance)
        *   `/settings` (For creator: edit alliance details, manage settings)
*   `/notifications` (Page displaying user notifications)
*   `/settings` (User account settings: password change, email preferences, etc.)

## IV. Key Features & Modules

1.  **User Authentication & Profile Management**
    *   Firebase Auth (Email/Password, Google Sign-In).
    *   User profile creation, viewing, and editing.
2.  **Community Creation & Management**
    *   Form for creating communities (name, description, type, basis).
    *   Creator automatically becomes leader.
    *   Leader dashboard for managing members (approving/rejecting join requests, removing members).
    *   Editing community details.
3.  **Community Participation**
    *   Browsing and searching for communities.
    *   Requesting to join communities.
    *   Community discussion page: creating posts, viewing posts.
    *   Commenting on posts.
4.  **Alliance Creation & Management**
    *   Form for community leaders to create alliances.
    *   Alliance creator manages alliance details.
    *   Mechanism for communities to join/request to join an alliance (managed by alliance creator or leaders of existing member communities).
5.  **Alliance Participation**
    *   Alliance discussion page: members of allied communities can post and comment.
    *   Viewing member communities of an alliance.
6.  **Content Moderation**
    *   Community leaders moderate their community's discussion page.
    *   Alliance creators/admins moderate the alliance discussion page.
    *   Reporting system for inappropriate content/users.
7.  **Notifications System**
    *   Real-time notifications for join requests, approvals, new posts in relevant discussions, mentions, etc.
8.  **Search & Discovery**
    *   Search communities by name, type, location/expertise.
    *   Search alliances by name.

## V. Firebase Integration

*   **Firebase Authentication**: Handles all user sign-up, sign-in, and session management.
*   **Cloud Firestore**:
    *   Primary database for all application data.
    *   Utilize Firestore Security Rules extensively to control data access and enforce business logic (e.g., only a leader can modify community settings, only members can post in a community).
    *   Real-time listeners for dynamic content like discussion feeds and notifications.
*   **Cloud Storage for Firebase**:
    *   Storing user profile pictures.
    *   Storing images/videos uploaded in posts (community & alliance).
    *   Storing banner images for communities and alliances.
*   **Cloud Functions for Firebase**:
    *   **Triggers**:
        *   On new user creation (`onCreate` user document): Perform setup tasks.
        *   On community/alliance post creation/deletion: Update `commentsCount`, `postsCount`.
        *   On new member joining/leaving community: Update `memberCount` in `communities`.
        *   On community joining/leaving alliance: Update `memberCommunityCount` in `alliances`.
        *   On new comment: Update `commentsCount` on parent post, send notifications.
    *   **Callable Functions**:
        *   Complex actions requiring multiple writes or privileged operations (e.g., processing a join request, creating an alliance and setting up initial roles).
        *   Sending notifications.
        *   Aggregating data for dashboards or analytics.

## VI. Development Phases (High-Level)

1.  **Phase 1: Foundation & Core User/Community Features**
    *   Firebase project setup.
    *   User authentication (email/password).
    *   Basic user profile (view, edit).
    *   Community creation.
    *   Community display (basic page).
    *   Open joining of communities (no approval workflow yet).
    *   Basic community discussion (posting, viewing posts - no comments yet).
2.  **Phase 2: Enhanced Community & Interaction**
    *   Community leader roles & permissions.
    *   Membership management: join requests, leader approval/rejection, member removal.
    *   Commenting on community posts.
    *   Community settings page for leaders.
    *   Firestore Security Rules for community access.
3.  **Phase 3: Alliances**
    *   Alliance creation by community leaders.
    *   Communities joining/leaving alliances (basic workflow).
    *   Alliance display page.
    *   Basic alliance discussion (posting, viewing posts - members of allied communities).
    *   Firestore Security Rules for alliance access.
4.  **Phase 4: Advanced Features & Polish**
    *   Notifications system (basic).
    *   Search and discovery for communities and alliances.
    *   User settings page.
    *   Commenting on alliance posts.
    *   Refined UI/UX across the platform.
    *   Cloud Storage integration for images (profiles, posts).
5.  **Phase 5: Cloud Functions & Optimization**
    *   Implement Cloud Functions for denormalization and triggers.
    *   Advanced notifications.
    *   Performance optimization.
    *   Comprehensive testing.
    *   Moderation tools.

## VII. Future Considerations

*   Direct messaging between users.
*   Events calendar for communities/alliances.
*   Polls and surveys within discussions.
*   User reputation system.
*   Advanced analytics for leaders/creators.
*   Gamification elements.
*   Mobile responsiveness and PWA features.
*   Integration with other platforms/APIs.

This plan provides a solid foundation. We will refer to and refine this document as development progresses.
