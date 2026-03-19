# Intera Features Roadmap

## Implemented (This Session)

### 1. Saved / Favorites (Expanded)
- **Store**: `savedEventIds`, `savedListingIds`, `savedBusinessIds` + toggle functions
- **Next**: Add bookmark UI to events, marketplace, business pages; create Saved hub with tabs

### 2. Appointment Reminders
- **Plan**: Schedule local notifications when booking (1 day + 1 hour before)
- **Requires**: `expo-notifications` scheduleNotificationAsync

### 3. Dark Mode
- **Plan**: Theme context, dark color palette, toggle in Settings
- **Requires**: ThemeProvider, persist preference

### 4. Unified Search
- **Exists**: app-search has features + people
- **Plan**: Add posts, events, marketplace, businesses to search results

---

## Phase 2 - Community & Engagement

### 5. Groups
- **Needs**: `groups` table, `group_members`, `group_posts`
- **UI**: Create/join groups, group feed, group events

### 6. Q&A
- **Needs**: `questions` table, `answers`, upvotes
- **UI**: Ask question, browse by location/category, upvote answers

### 7. Carpool / Ride Share
- **Exists**: Route `/carpool` - needs implementation
- **Needs**: `carpool_rides` table, offer/request flow

### 8. Skill Swap
- **Exists**: Route - needs implementation
- **Needs**: `skill_offers` table, match by skill/location

---

## Phase 3 - Business & Monetization

### 9. Business Analytics
- **Needs**: Aggregate views, bookings, revenue from existing tables
- **UI**: Dashboard for business owners

### 10. In-App Payments
- **Needs**: Stripe/PayPal SDK, payment flow, webhooks
- **Scope**: Marketplace, services, events

### 11. Promoted Listings
- **Needs**: `promoted_at` or `boost_expires` on posts/listings
- **Revenue**: Business Pro or per-listing boost

### 12. Subscription Tiers
- **Exists**: Business Pro paywall (RevenueCat)
- **Expand**: User premium tier (ad-free, extra features)

---

## Phase 4 - Trust & Safety

### 13. Verification Badges
- **Needs**: `profiles.verified_at`, `businesses.verified_at`
- **Process**: ID verification flow (manual or provider)

### 14. Report & Block
- **Exists**: `reportBlockedUser`, `blockUser` in store
- **Enhance**: Report content (posts, listings), moderation queue

### 15. Safety Check-In
- **Needs**: Optional "I'm safe" for meetups
- **UI**: Post-meetup reminder, share ETA with trusted contact

---

## Phase 5 - Polish

### 16. Offline Mode
- **Needs**: Cache feed, messages; sync when back online
- **Complex**: Conflict resolution, queue writes

### 17. Multi-Language
- **Needs**: i18n (react-i18next), translation files
- **Scope**: UI strings, user-generated stays in original

### 18. Stories
- **Exists**: `userStories` in store, stories route
- **Enhance**: Ephemeral 24h content from businesses/community

### 19. Referral Program
- **Needs**: `referral_codes` table, invite flow
- **Reward**: Gems or discount for inviter/invitee

### 20. Reviews & Ratings
- **Exists**: Business reviews (`getBusinessReviews`)
- **Expand**: Marketplace seller ratings, event ratings

---

## Implementation Order (Recommended)

1. Saved hub + bookmark buttons (finish)
2. Dark mode
3. Appointment reminders
4. Unified search enhancement
5. Business analytics
6. Q&A
7. Groups
8. In-app payments
9. Verification
10. Rest as prioritized
