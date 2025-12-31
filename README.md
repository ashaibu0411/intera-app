# AfroConnect

A community-driven social platform connecting Africans and the African diaspora globally through local neighborhoods, shared culture, business, and opportunities.

**Slogan:** *Connecting Africans Globally, Building Communities*

## Features

### Welcome & Onboarding
- Detailed welcome page explaining all app features
- Location selection (Country > State/Region > City)
- Guest browsing mode - explore before signing up
- Sign up with Google, Email, or Phone number
- Global support for users worldwide

### Community Feed
- Location-based posts from your community
- Local/Global toggle to filter content
- Pull-to-refresh for latest updates
- Like, comment, and share interactions
- Guest users can browse but need account to interact

### Search & Discovery
- Search people, posts, events, and businesses
- Category filters (All, People, Posts, Events, Businesses)
- Suggested communities and popular users

### Marketplace
- Buy and sell African products, crafts, and services
- Home-based and store-based sellers
- Product categories: Fashion, Food, Art, Beauty, Electronics, etc.
- Direct messaging to contact sellers
- Product listings with images, prices, and descriptions
- View count and listing details
- **Create Listing** (`/create-listing`): Users can list items for sale with photos, pricing, category, condition, and description

### Business Directory
- Browse African-owned businesses by category
- Categories: Food, Beauty, Retail, Services, Health, Education, Auto, Real Estate
- Featured businesses with ratings and reviews
- Quick actions: Call, Message, Directions
- **Register Business** (`/register-business`): 3-step form to register your business with logo, cover photo, contact info, and description
- **African Market Mode**: Special feature for grocery stores to manage real-time inventory
- **Direct Messaging**: Contact businesses directly through the app

### Faith & Community
- Post religious services and faith events
- Support for multiple faith types (Christian, Islamic, Traditional African, etc.)
- Recurring service schedules
- Event RSVP functionality
- Contact information (phone/email) for organizations
- Location and address details
- **Create Faith Event** (`/create-faith-event`): Organizations can post services and events with recurring schedules

### Student Hub
- Scholarships discovery with deadlines and amounts
- Study groups with member counts and meeting times
- Internship listings from African companies
- Mentorship connections with industry professionals
- Campus events with RSVP functionality
- Search across all student resources
- **Create Study Groups**: Start your own study group with schedule, meeting type (online/in-person), and member limits
- **Become a Mentor**: Apply to be a mentor with a 3-step form (professional background, expertise areas, bio & contact)
- **Post Internships**: Companies can post internship opportunities with job details, compensation, and application info
- **New Arrival Help**: Resource guide for international students arriving in a new city (housing, jobs, healthcare, banking, legal, community)

### Create Posts
- Three creation options: Post, Sell Item, or Create Event
- Posts show your actual profile name and avatar
- Sell items with categories, pricing, condition, and images
- Create events with date/time, location, public/private settings, and RSVP

### Authentication
- Sign Up / Log In toggle for new and existing users
- Phone OTP authentication
- Google sign-in option
- Email authentication option

### Notifications
- Activity notifications (likes, comments)
- Neighborhood updates
- Community alerts
- Filter by category

### Profile
- User profile with avatar and bio
- Location and interests display
- Activity stats (posts, connections, communities)
- Sign out functionality

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- NativeWind (TailwindCSS)
- React Native Reanimated
- Zustand for state management
- React Query for async state
- Expo Image for optimized images
- **Supabase** for backend (authentication, database, real-time sync)

## Supabase Integration

The app is fully connected to Supabase for data persistence and syncing across users:

### Database Tables
- **profiles**: User profiles and account information
- **posts**: Community feed posts
- **comments**: Post comments
- **likes**: Post likes
- **conversations**: Messaging threads
- **messages**: Individual messages
- **marketplace_listings**: Items for sale in the marketplace
- **businesses**: Registered businesses in the directory
- **business_inventory**: Real-time inventory for African markets
- **faith_events**: Faith community events and services
- **faith_event_rsvps**: Event RSVPs

### API Layer (`/src/lib/marketplace-api.ts`)
- Full CRUD operations for marketplace listings, businesses, inventory, and faith events
- All user-generated content syncs to Supabase
- Pull-to-refresh on all listing screens
- Loading states for better UX

## Color Palette

- **Terracotta** (#D4673A): Primary brand color
- **Forest Green** (#1B4D3E): Secondary/accent
- **Gold** (#C9A227): Highlights
- **Cream** (#FAF7F2): Background
- **Warm Brown** (#2D1F1A): Text

## New Features (Latest Update)

### Marketplace, Business & Faith User-Generated Content
- **Create Listing** (`/create-listing`): List items for sale with up to 5 photos, price, category, condition (new/used/refurbished), and seller type (individual/business)
- **Register Business** (`/register-business`): 3-step registration for businesses with cover photo, logo, contact info, business hours, and African Market toggle for inventory management
- **Create Faith Event** (`/create-faith-event`): Post services and events with organization info, date/time, recurring schedules, and contact information
- **Direct Messaging to Businesses**: Message businesses directly from the Business Directory

### Student Hub User-Generated Content
- **Create Study Groups** (`/create-study-group`): Users can create their own study groups with name, subject, description, meeting schedule, online/in-person toggle, and privacy settings
- **Become a Mentor** (`/become-mentor`): 3-step application form for professionals to become mentors - includes professional background, expertise areas (up to 3), availability, and contact info
- **Post Internships** (`/post-internship`): Companies can post internship opportunities with company info, position details, compensation, and application instructions
- **New Arrival Help** (`/new-arrival-help`): Comprehensive resource guide for international students with categories for housing, jobs, healthcare, transportation, banking, legal, and community resources

### Home Screen Quick Access
- 2x2 grid layout for quick access to: Marketplace, Businesses, Student Hub, Faith Centers
- Local/Global feed filtering - Local shows posts from your city, Global shows all posts worldwide

### Working Features
- **Location Button**: Tap the location button in the header to change your city/community
- **Quick City Switch**: When changing location, you now see a fast search interface to instantly jump to any city without going through country → state → city flow. Just search and tap to switch!
- **Automatic City Detection**: The app automatically detects your current city using device location and prompts you to switch communities if you've moved to a new city
- **Location Change Modal**: When a new city is detected, you can choose to switch to the new city's community, stay in your current community, or dismiss future location prompts
- **Post Comments**: Tap any post to view comments, add your own comments, and see the full discussion
- **Share Posts**: Share posts using the native share sheet to any app on your device
- **Post Options Menu**: Tap the three dots on any post to access options:
  - Save/Unsave Post - Bookmark posts to view later
  - Copy Link - Copy a shareable link to clipboard
  - View Profile - Visit the author's profile (for other people's posts)
  - Report Post - Flag inappropriate content (for other people's posts)
  - Delete Post - Remove your own posts
- **Messaging**: Access messages from the home screen header, view conversations, and send messages

### Messaging System
- Conversation list with unread indicators
- Real-time chat interface
- Message history with timestamps
- Contact sellers and community members directly

### Premium Subscription (RevenueCat)
- **Monthly Plan**: $4.99/month
- **Annual Plan**: $39.99/year (33% savings)
- **Premium Features**:
  - Verified gold badge on profile
  - Unlimited posts (no daily limits)
  - Priority customer support
  - Ad-free experience
  - Access to exclusive communities
- Premium paywall screen (`/paywall`) with beautiful UI
- Premium status badge displayed on user profile
- "Go Premium" button on profile for non-subscribers

### Connect - Meet People Nearby
- **New Tab**: Dedicated Connect tab in the bottom navigation for meeting people in your neighborhood
- **Profile Discovery**: Browse profiles of people near you with photos, bio, and interests
- **Looking For Filters**: Filter by what people are looking for:
  - Friends - Social connections
  - Dating - Romantic connections
  - Networking - Professional connections
  - All - Open to everything
- **Like & Connect**: Heart profiles you're interested in and connect to start conversations
- **Connected Status**: Once connected, message button appears for direct chat
- **Stats Dashboard**: See how many people are nearby, connected, and liked

### Local News Feed
- **City-Specific News**: Local news section on the home feed showing relevant articles for your city
- **News Categories**: Culture, Business, Education, Food, Community, Politics, Tech, Entertainment
- **Compact Cards**: Horizontal scroll of news cards with images, headlines, sources, and timestamps
- **Opens in Browser**: Tap any article to read the full story in your browser
- **Auto-Updates**: News refreshes when you change cities or pull-to-refresh

### Events Tab - Discover Local & Global Events
- **Dedicated Events Tab**: Calendar icon in the bottom navigation for discovering events
- **Local/Global Toggle**: Switch between events near you and events happening worldwide
- **Category Filters**: Filter events by type:
  - Social Gatherings
  - Cultural Celebrations
  - Food & Dining
  - Music & Entertainment
  - Networking
  - Education & Workshop
- **Event Cards**: Beautiful cards showing event image, date badge, title, description, time, location, and attendee count
- **RSVP System**: Mark yourself as "Interested" or "Going" for any event
- **This Week Section**: Quick horizontal scroll of upcoming events in the next 7 days
- **Stats Dashboard**: See total events, how many you're going to, and interested in
- **Create Events**: Plus button to create your own events
- **Event Details**: Tap any event for full details with host info and location

### Seller Pro Subscription (RevenueCat)
- **First 50 in-app sales are FREE** - no fees for new sellers
- **Cash/offline payments are ALWAYS FREE** - only in-app payments require Seller Pro after 50 sales
- **Monthly Plan**: $9.99/month
- **Annual Plan**: $79.99/year (33% savings)
- **Seller Pro Features**:
  - Unlimited in-app payment processing
  - Sales analytics and performance tracking
  - Verified seller badge on listings
  - Secure payment processing
  - Lower transaction fees
- Seller Pro paywall screen (`/seller-pro-paywall`) with sales progress tracking
- Automatic sales counting for in-app transactions
- Helper utilities in `src/lib/sellerPro.ts` for checking seller status

