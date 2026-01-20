# Diaspora

A community-driven social platform connecting foreigners, expats, and global citizens worldwide through local neighborhoods, shared culture, business, and opportunities.

**Slogan:** *Connecting Foreigners Globally, Building Communities*

## The Intera Story

When users first download the app, they are greeted with the Intera origin story - a beautiful, immersive introduction that explains the meaning behind the name and the platform's mission:

> *"In a world that had become noisier but lonelier, people were surrounded by millions—yet truly connected to none... Then came Intera."*

The word **Intera** comes from *interact*, *interconnect*, and *interweave* — and that is exactly what the platform was built to do. Not just to show you content, but to weave people into each other's lives.

**Key Philosophy:**
- Intera doesn't ask, "Who do you follow?" It asks, "Who are you connected to?"
- It is not just social. It is relational.
- It is not about going viral. It is about belonging.
- *Intera — where the world doesn't just meet, it connects.*

## Core Philosophy

**"Not a social network — a living community."**

Diaspora doesn't compete with Facebook, TikTok, or Instagram. It replaces them in moments they cannot own:
- Moving to a new city
- Immigration & diaspora transitions
- College life abroad
- Faith & cultural communities
- Local survival & growth

## Bottom Navigation Tabs

The app has 5 main tabs in the bottom navigation:
1. **Home** - Community Presence Feed (not just posts - presence, pulse, conversations)
2. **Events** - Discover local and global events
3. **Clips** - Short-form video clips feed (TikTok-style vertical scrolling)
4. **Connect** - Meet people nearby with profile discovery
5. **Profile** - User profile and settings

### Community Presence Feed (HOME TAB - REDESIGNED!)

The home feed has been completely redesigned from a content feed to a **Community Presence Feed**. This is the big differentiator - when you open the app, it feels like walking into your neighborhood.

**Philosophy: Presence Over Posts**

Instead of showing posts first, your home feed now shows:
1. **Who is here?** - See active community members
2. **Is this alive?** - Live activity signals
3. **Do I belong?** - Community context before content

**6-Section Layout:**

1. **Community Presence** (Top Section)
   - "47 people here now" with live pulse indicator
   - Active member avatars with role colors (Welcomer=pink, Mentor=blue, etc.)
   - Live Activity Feed showing real-time community actions:
     - "A new family arrived in [City]"
     - "Ama is helping a newcomer find housing"
     - "Community dinner starting in 2 hours"
     - "Kofi just joined the community"

2. **Local Pulse** (What's Happening Near You)
   - Real-world events FIRST, not posts
   - Examples:
     - "Community dinner tonight" - 7:00 PM
     - "Job opportunity posted" - 3h ago
     - "3 people offering rides to airport"
     - "Someone needs help moving" - Urgent
     - "Room available for newcomer"
   - Expandable list with "See more"

3. **Quick Post Prompts** (Start a Conversation)
   - Posts default to conversations, not broadcasts
   - 5 prompt types:
     - **Ask** - "Can someone help me..."
     - **Looking for** - "New here, looking for..."
     - **Offer** - "I can help with..."
     - **Invite** - "Who wants to join..."
     - **Check-in** - "Anyone else experiencing..."

4. **Active Conversations** (Join the Discussion)
   - Horizontal scroll of active community discussions
   - Shows question/request type badges
   - "Hot" indicator for trending conversations
   - Reply counts and last activity time
   - Author info with role badges

5. **Community Remembers** (Memory Layer)
   - Your app remembers you and your journey
   - Examples:
     - "3 months in [City]!" - Anniversary
     - "Last year this week" - Throwback
     - "You've helped 12 people" - Impact
     - "Your first post here" - Milestone
   - Carousel of memories with beautiful gradient cards

6. **Recent Posts** (Traditional Feed - Last)
   - Posts moved to bottom, not the focus
   - "From your community" subtitle
   - Limited to 10 posts to avoid infinite scroll

**Why This Matters:**
- Facebook, TikTok, Instagram = passive consumption
- Diaspora = active community participation
- No infinite scroll
- No viral junk
- Human pacing with calm, sectioned UI

### Clips Tab (NEW!)
- **Full-screen vertical video feed** like TikTok/Reels
- **Real video playback** using expo-av with auto-play when visible
- **Swipe to browse**: Vertical paging through clips
- **For You / Following**: Toggle between personalized and followed content
- **Create clips**: Tap the + button to record or upload your own video clips
  - Record directly from camera (up to 60 seconds)
  - Upload from photo library
  - Add description and music tags
  - Custom cover image selection
- **Engagement actions**:
  - Tap to play/pause video
  - Double-tap to like with heart animation
  - Like, comment, save, and share buttons
  - Follow creators directly from clips
- **Creator info**: Username, description, and music attribution
- **Haptic feedback** on all interactions

## Features

### Welcome & Onboarding
- Detailed welcome page explaining all app features
- Location selection (Country > State/Region > City)
- **After selecting location, users are directed to create an account or sign in**
- Sign up with Apple, Email, or Phone number
- Guest browsing option available from sign up screen
- Global support for users from all continents and countries

### Community Feed
- Location-based posts from your community
- Local/Global toggle to filter content
- Pull-to-refresh for latest updates
- **Country Flags**: Each post shows the poster's country flag next to their name (190+ countries supported)
- **Community Guidelines Reminder**: Subtle reminder on every post to keep conversations respectful
- **Emoji Reactions**: Express yourself with 6 reactions
  - Quick tap for heart reaction
  - Long-press to open reaction picker: Love, Fire, Clap, Real, Bless, Haha
  - Animated floating emojis when reacting
  - Color-coded reaction counts
- **Double-Tap to Like**: Instagram-style double-tap on images
  - Big heart animation on double-tap
  - Burst of colorful emojis (hearts, fire, sparkles) exploding from the image
  - Haptic feedback for satisfying interaction
- **Reaction Summary Bar**: See which emojis people used on each post
  - Shows stacked emoji icons
  - "Liked by X people" text
- Like, comment, and share interactions
- Guest users can browse but need account to interact

### Search & Discovery
- Search people, posts, events, and businesses
- Category filters (All, People, Posts, Events, Businesses)
- Suggested communities and popular users

### Marketplace
- Buy and sell products, crafts, and services
- Home-based and store-based sellers
- Product categories: Fashion, Food, Art, Beauty, Electronics, etc.
- **Direct messaging to contact sellers** - Start conversations directly from listings
- Product listings with images, prices, and descriptions
- View count and listing details
- **Real-time data** - All listings from Supabase database (no mock data)
- **Create Listing** (`/create-listing`): Users can list items for sale with photos, pricing, category, condition, and description

### Business Directory
- Browse local businesses by category
- Categories: Food, Beauty, Retail, Services, Health, Education, Auto, Real Estate, **African Markets**
- Featured businesses with ratings and reviews
- Quick actions: Call, Message, Directions
- **Real-time data** - All businesses from Supabase database (no mock data)
- **Direct Messaging**: Contact business owners directly through the app with real conversations
- **Register Business** (`/register-business`): 3-step form to register your business with logo, cover photo, contact info, and description
- **Cultural Market Mode**: Special feature for grocery stores to manage real-time inventory
- **Business Inventory Display**: Customers can view what's in stock when visiting a business page
  - Horizontal scroll of in-stock items with prices
  - Out-of-stock items shown separately
  - Tap any item for full details (price, description, availability)
  - "Contact About This Item" button to start conversation with pre-filled message
- **Inventory Management** (`/manage-inventory`): Businesses can manage their product inventory
  - Add new items with name, description, price, category, and image
  - Toggle stock status (in stock/out of stock)
  - Set quantity for inventory tracking
  - Edit or delete existing items
  - Real-time sync with Supabase
- **Business Community Posts**: Businesses can post to the community feed
  - Toggle between posting as yourself or your business
  - Business posts are prefixed with the business name and icon
  - Reach your community with announcements, promotions, and updates

### Faith & Community
- Post religious services and faith events
- Support for multiple faith types (Christian, Islamic, Buddhist, Hindu, etc.)
- Recurring service schedules
- Event RSVP functionality
- Contact information (phone/email) for organizations
- Location and address details
- **Create Faith Event** (`/create-faith-event`): Organizations can post services and events with recurring schedules
- **Serve & Connect** (`/serve-connect`): Talent directory for churches and organizations to find musicians, volunteers, and skilled helpers
  - Browse available talent by category (Musicians, Worship Leaders, Singers, Sound/AV Tech, Media, Youth Leaders, etc.)
  - Filter by availability and search by skills
  - View detailed profiles with experience, skills, portfolio images, and contact info
  - Save favorite talent profiles for later
  - **Register as Talent** (`/register-talent`): 3-step registration to offer your skills to churches
    - Select service category and skills
    - Add experience, bio, and faith background
    - Set availability, travel preferences, and contact information

### Groups & Community Associations (NEW!)
- **Create Group** (`/create-group`): Churches, mosques, temples, and community associations can create their own groups
  - 7 category types: Church, Mosque, Temple, Synagogue, Community, Association, Other
  - Faith type selection for religious groups
  - Public or Private visibility settings
  - Location and contact information
  - Group logo/image upload
- **Group Detail Page** (`/group/[id]`): Full-featured group pages inspired by Facebook Groups
  - **4-Tab Interface**:
    - **Home**: About section, notices, files, contact info
    - **Posts**: Member posts with images, likes, comments
    - **Events**: Group events with RSVP system
    - **Albums**: Photo albums with grid gallery view
  - **Member Features**:
    - Join/Leave groups
    - Create posts with images
    - Like and comment on posts
    - RSVP to events
    - View photo albums
  - **Admin Features**:
    - Post announcements and notices
    - Pin important posts
    - Create events
    - Create photo albums
    - Invite members
    - Manage group settings
  - **Group Info**:
    - Member count and admin info
    - Public/Private visibility badge
    - Notification settings
    - Invite link sharing
- **Faith Community** (`/faith-community`): Browse and discover groups
  - Featured groups section
  - Create a Group button
  - Quick links to Prayer Wall and Serve & Connect

### Student Hub
- Scholarships discovery with deadlines and amounts
- Study groups with member counts and meeting times
- Internship listings from local and international companies
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
- **Sign in with Apple** - Required for App Store compliance (Guideline 4.8)
- Phone OTP authentication
- Email authentication option
- **Account Deletion** - Users can delete their account from Settings (Guideline 5.1.1)

### User Safety & Moderation (App Store Guideline 1.2 Compliance)
- **Block Users**: Block abusive users from posts, profile pages, and the feed menu
  - Blocking immediately removes all content from the blocked user from your feed
  - Blocked user cannot message you or see your content
  - Block action automatically reports the user to our moderation team
  - View and unblock users in Settings > Privacy & Safety > Blocked Users
- **Report Users**: Report users for violations via profile page or post menu
  - Report reasons: Harassment, Hate Speech, Sexual Content, Violence, Scam, Spam, Other
  - All reports are sent to moderation team for review
  - False reports warning to prevent abuse
- **User Profile Page** (`/profile/[id]`): View other users' profiles with safety actions
  - Block and Report buttons prominently displayed
  - Safety notice explaining blocking behavior
  - Blocked users see a "User Blocked" state when viewing blocked profiles
- **Content Moderation**: Automated text filtering and community reporting system
  - Zero tolerance for sexual and violent content
  - Progressive discipline: Warning > 24hr restriction > 7-day suspension > Permanent ban

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
- **business_inventory**: Real-time inventory for cultural markets
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
- **Register Business** (`/register-business`): 3-step registration for businesses with cover photo, logo, contact info, business hours, and Cultural Market toggle for inventory management
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
- **Community Member Count**: See how many people are in your community - count increases when you join
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

### Contextual Weather Signal (NEW!)
- **Smart Weather Header**: Compact, contextual weather bar at the top of the feed
- **Community-Relevant Context**: Weather tied to community activity, not just forecasts
  - "Great weather for outdoor activities" with event suggestions
  - "Heavy rain - outdoor events may be affected" with affected event count
  - "Snow conditions - check for schedule updates" with school alerts
  - "High winds - outdoor activities may be affected"
  - "Foggy conditions - drive safely" for commuter awareness
- **Visual Indicators**:
  - Green bar for good weather conditions
  - Amber bar for caution (rain, fog, wind)
  - Red bar for severe weather alerts
- **Affected Events Badge**: Shows number of outdoor events that may be impacted
- **Tap for Details**: Opens a bottom sheet with:
  - Current temperature and conditions
  - Humidity and wind speed
  - Community impact summary
  - Weather tips relevant to community activities
- **Real-time Data**: Powered by Open-Meteo API (free, no API key needed)

### Detailed Weather Experience
- **Weather Widget**: Beautiful weather card on home feed showing current conditions
- **Tap for Full Forecast**: Tap the weather widget to open detailed weather screen
- **Detailed Weather Screen** (`/weather-details`):
  - Current temperature with feels-like
  - Dynamic gradient backgrounds based on weather and time of day
  - **24-hour Hourly Forecast**: Scrollable hourly temperatures
  - **7-Day Forecast**: Daily high/low temps with weather icons
  - **Weather Details Grid**:
    - Feels Like temperature
    - UV Index with risk level (Low/Moderate/High/Very High/Extreme)
    - Wind speed and direction
    - Humidity percentage
    - Atmospheric pressure
    - Visibility distance
  - **Sunrise & Sunset Times**: Beautiful sun icons with exact times
  - Pull-to-refresh for latest data
  - Powered by Open-Meteo API (free, no API key required)

### Local News Feed
- **Regional News**: News adapts to your location - if you're in Aurora, you'll see Colorado-wide news
- **Real News API**: Integrates with GNews API for real, current news (requires API key in ENV tab)
- **Smart Fallback**: Shows relevant mock news when API key not configured
- **Location-Aware**: Searches by city first, then expands to state/region if needed
- **News Categories**: Culture, Business, Education, Food, Community, Politics, Tech, Entertainment, Health
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

### Business Appointments & Booking System
- **Book Appointments**: Users can book appointments with barbershops, salons, and health services directly from the Business Directory
- **4-Step Booking Flow** (`/book-appointment`):
  1. Select Service - Browse and choose from available services with pricing and duration
  2. Pick Date & Time - Interactive calendar with available time slots
  3. Payment Method - Choose to pay in-app or at the location (cash)
  4. Confirm Booking - Review details and confirm appointment
- **Unique Booking Links & QR Codes** (`/business-booking-link`):
  - Each business gets a unique booking URL (e.g., `intera.app/book/BUSINESS_ID`)
  - Scannable QR code that customers can scan to book instantly
  - Short code for easy sharing (e.g., "ABCD1234")
  - Share via WhatsApp, SMS, or any app
  - Tips for promoting: print QR code at location, add to social media, business cards
- **My Appointments** (`/my-appointments`):
  - View upcoming, past, and cancelled appointments
  - Appointment stats dashboard
  - Quick actions: Call, Message, or Cancel appointments
  - Status tracking (Pending, Confirmed, Completed, Cancelled)
- **Business Integration**:
  - "Book" button appears on businesses that accept appointments (Beauty, Health categories)
  - Businesses can define their services, pricing, and availability
  - Support for in-app payments (future) and pay-at-location options

### Business Pro Subscription (For Barbershops & Salons)
- **First 25 bookings are FREE** - businesses can try the booking system at no cost
- **After 25 bookings**: Requires Business Pro subscription to continue accepting bookings
- **Monthly Plan**: $29.99/month
- **Annual Plan**: $239.99/year (33% savings - $19.99/month)
- **Business Pro Features**:
  - Unlimited appointment bookings
  - Business analytics and revenue tracking
  - Instant booking notifications
  - Verified business badge
  - Customer management
  - Flexible scheduling tools
- **Business Management Screens**:
  - `/business-appointments` - View and manage incoming appointments (Confirm, Complete, Decline)
  - `/manage-booking-calendar` - Set business hours, add services, block dates
  - `/business-pro-paywall` - Upgrade to Business Pro subscription
- **Booking Settings**:
  - Set open/close times for each day of the week
  - Add services with name, description, duration, and price
  - Configure advance booking days (how far ahead customers can book)
  - Set buffer time between appointments
  - **Block Time Slots**: Block recurring times for lunch breaks, meetings, prayer time, or personal time
  - Block specific days or every day with custom time ranges
  - Customers cannot book during blocked time periods

## Advanced Community Features (NEW!)

These 10 major features make Diaspora superior to Facebook, Nextdoor, and any other social networking app by leveraging cultural concepts from around the world and community-first design:

### 1. Ubuntu Trust Score (`/trust-score`)
- **Community reputation system** based on the Ubuntu philosophy ("I am because we are")
- Verification levels: Newcomer → Verified → Trusted → Elder
- Trust score (0-100) based on activity, badges, and community vouches
- Earn badges for contributions: Community Helper, Mentor, Event Host, etc.
- Community members can vouch for each other to increase trust
- Profile verification through ID, phone, email, and social connections

### 2. Village Council (`/village-council`)
- **Democratic community governance** inspired by traditional council systems
- **Polls & Voting**: Create and vote on community decisions and initiatives
- **Community Projects**: Crowdfund local projects (playgrounds, events, improvements)
- **Emergency Broadcasts**: Important community alerts (severe weather, safety, closures)
- **Ask the Neighborhood**: Post questions and get answers from neighbors
- Anonymous voting option for sensitive topics

### 3. Susu Savings Circles (`/susu-circles`)
- **Traditional rotating savings system** (Susu/Tanda/ROSCAs)
- Create or join savings circles with trusted community members
- **Privacy Settings**:
  - Public circles: Anyone can find and request to join
  - Private circles: Only invited members can see and join
  - Set maximum number of members (slots)
- **Invite Members**:
  - Share unique invite code with trusted contacts
  - Share invite link via WhatsApp, SMS, or any app
  - Send direct invitations by name, phone, or email
  - Track pending invitations
  - Member slots progress bar showing available spots
- **Payment Tracking System**:
  - Multiple payment methods: Card, Bank Transfer, Mobile Money (M-Pesa, Venmo), Cash
  - Real-time contribution progress bar showing who has paid
  - Payment status tracking: Pending → Paid → Confirmed
  - Organizer confirmation system for accountability
- **Organizer Dashboard**:
  - View all member payments at a glance
  - Confirm cash/manual payments with one tap
  - Track confirmed vs pending vs late payments
  - See payment method used by each member
  - Invite tab for managing new member invitations
- **Member Accountability**:
  - Trust scores displayed for transparency
  - Contribution history for each member
  - Missed payment tracking
  - Total contributed amount
- **5 Tab Interface**:
  - Overview: Pool size, round info, next payout recipient
  - Payments: Current round contribution status for all members
  - Members: Trust scores, contribution stats, payout status
  - Invite (Organizers only): Share invite code/link, send direct invitations
  - History: Complete payment history grouped by round
- Support for different contribution amounts and frequencies (weekly/biweekly/monthly)
- View circle rules and upcoming payouts

### 4. Job Board & Skills Marketplace (`/job-board`)
- **Community-powered employment** connecting expat job seekers and employers
- Browse job listings from local and diaspora businesses
- Filter by job type: Full-time, Part-time, Contract, Remote
- **Skills Marketplace**: Hire community members for services (tutoring, cleaning, repairs, etc.)
- Post job openings for your business
- Rate and review service providers

### 5. Voice Rooms (`/voice-rooms`)
- **Live audio discussions** like Clubhouse, but for the expat community
- Join or host voice rooms on topics: Culture, Business, Wellness, Faith, Politics
- Raise hand to speak, moderated by room hosts
- Schedule rooms in advance with topics and descriptions
- See who's speaking and who's listening
- Categories: Culture Chat, Business Talk, Wellness, Faith, Community, Politics
- **Note**: Live audio functionality requires LiveKit integration (coming soon). Currently shows real-time presence, hand raises, and room features via Supabase Realtime.
- **Gift System**: Send virtual gifts to hosts and speakers to show support
  - 6 gift types: Heart (1 gem), Star (5), Fire (10), Diamond (50), Crown (100), Sparkle (500)
  - Floating gift animations in the room
  - Gifts deduct from sender's gem balance
  - Hosts earn gems from received gifts
  - Recent gifts displayed in room
- **Gem Store** (`/gem-store`): Purchase gems to send gifts
  - Multiple gem packages from 100 to 20,000 gems
  - Bonus gems on larger purchases (up to 5,000 bonus!)
  - RevenueCat integration for secure purchases
  - Transaction history to track sent/received gifts
  - Balance displayed with USD equivalent

### Creator Battles (`/creator-battles`) (NEW!)
- **Head-to-head gift competitions** between two creators in real-time
- **Split-screen battle arena**: Purple vs Orange themed sides
- **Live scoring**: Watch gem counts update in real-time as viewers send gifts
- **Battle timer**: Timed matches (3 or 5 minutes) with countdown display
- **Gift to support**: Tap either creator's side to send them gifts
  - Same 6 gift types as Voice Rooms
  - Floating gift animations on the chosen side
  - Instant score updates
- **Score bar**: Visual progress bar showing who's winning
- **Battle lobby**:
  - Browse live battles happening now
  - See waiting battles you can join as challenger
  - View battle stats (viewers, total gifts)
- **Battle categories**: Entertainment, Music, Comedy, Dance, Talent, Chat
- **Winner determination**: Creator with highest gift score wins when timer ends
- **Viewer count**: See how many people are watching each battle

### Daily Rewards System (NEW!)
- **Daily Login Rewards**: Earn free gems every day just by opening the app
- **7-Day Reward Cycle**: Increasing rewards each consecutive day:
  - Day 1: 10 gems
  - Day 2: 15 gems
  - Day 3: 20 gems
  - Day 4: 25 gems
  - Day 5: 30 gems
  - Day 6: 40 gems
  - Day 7 Bonus: 100 gems (big reward!)
- **Streak Tracking**: Keep your streak alive by claiming daily
  - Miss a day and your streak resets
  - Track your current streak and longest streak
  - Total days claimed counter
- **Beautiful Animated Modal**:
  - Pulsing "claim" animation for available rewards
  - Satisfying claim animations with haptic feedback
  - Visual progress through the week
  - See locked, claimed, and available days
- **Home Screen Banner**:
  - Glowing banner when reward is ready
  - Shows current streak status
  - One-tap to open rewards modal
- **Persistence**: Your streak and progress saved across app restarts

### Gem-Based Payment System (NEW!)
- **Virtual Currency Economy**: Gems are the in-app currency (100 gems = $1 USD)
- **Ultra-Low 5% Platform Fee** - Way better than TikTok's 50%!
  - Sellers/businesses keep 95% of every transaction (or 100% if buyer covers fee)
  - Compare: TikTok 50%, Fiverr 20%, Uber Eats 15-30%
- **Buyer-Pays-Fee Option**:
  - Buyers can choose to cover the 5% platform fee to support sellers/businesses
  - Toggle "Support the seller/business" during checkout
  - When enabled: seller/business receives 100% of the item price
  - When disabled (default): seller/business receives 95%, platform takes 5%
- **Purchase Gems** (`/gem-store`):
  - 6 packages: $0.99 (100), $4.99 (550), $9.99 (1,400), $19.99 (3,000), $49.99 (8,000), $99.99 (20,000)
  - RevenueCat integration for App Store and Play Store
  - Test store for development/sandbox testing
- **Marketplace Buy Now**:
  - Buy items directly with gems from the marketplace
  - See gem price equivalent on all listings
  - Purchase confirmation modal with balance check
  - "Support the seller" toggle - buyer can cover the 5% fee
  - Dynamic price breakdown showing fee when buyer pays it
  - Sellers receive 95% or 100% of gems (depending on buyer choice)
  - Insufficient balance redirects to gem store
- **Business Service Payments**:
  - Pay for appointments with gems
  - "Pay with Gems" option alongside cash and card
  - "Support the business" toggle - buyer can cover the 5% fee
  - Real-time balance display during booking
  - Gem price shown for all services (including fee if applicable)
  - Business owners receive 95% or 100% of payment
- **Supabase Integration**:
  - `user_wallets` table: gem balances, total earned, total sent
  - `gift_transactions` table: all gift/transfer history
  - `marketplace_purchases` table: marketplace transactions (tracks who paid fee)
  - `gem_purchases` table: RevenueCat purchase records
- **Seller Earnings**:
  - Sellers earn gems from marketplace sales
  - 95% payout (or 100% when buyer pays fee!)
  - Gems can be used in-app or cashed out (future feature)

### 6. Heritage Hub (`/heritage-hub`)
- **Cultural preservation and learning center**
- **Cultural Music** (`/cultural-music`): Discover and listen to traditional music from around the world
  - **12 World Regions**: West Africa, East Africa, Southern Africa, North Africa, Caribbean, Latin America, South Asia, East Asia, Middle East, Pacific Islands, Indigenous
  - **35+ Music Genres**: Highlife, Jùjú, Afrobeat, Mbalax, Soukous, Benga, Taarab, Kwaito, Mbaqanga, Gnawa, Raï, Reggae, Calypso, Soca, Cumbia, Bossa Nova, Samba, Qawwali, Ghazal, Sufi, Pakistani Folk, Coke Studio, Bhangra, and more
  - **Featured Playlists**: Curated collections including:
    - **Ghana Highlife Classics**: 18 iconic Highlife songs from Nana Ampadu, Daddy Lumba, Amakye Dede, and more
    - **Pakistani Legends**: Qawwali, Ghazal, and Sufi masters from Pakistan
    - **Coke Studio Hits**: Best of Pakistani Coke Studio performances
    - "African Classics", "Caribbean Vibes", "Sounds of India", "Latin Rhythms", "Middle Eastern Melodies"
  - **Pakistan Music Collection**: 25+ classic Pakistani songs including:
    - **Qawwali**: Nusrat Fateh Ali Khan (Mustt Mustt, Allah Hoo, Tumhe Dillagi, Afreen Afreen)
    - **Sufi**: Abida Parveen (Tere Ishq Nachaya, Ghoom Charakhra, Yaar Ko Humne)
    - **Ghazal**: Mehdi Hassan (Ranjish Hi Sahi, Gulon Mein Rang Bhare), Ghulam Ali (Chupke Chupke Raat Din)
    - **Pakistani Folk**: Reshma (Lambi Judai, Ankhiyan Nu Rehn De, Hayo Rabba)
    - **Coke Studio**: Tajdar-e-Haram (Atif Aslam), Afreen Afreen (Rahat & Momina), Pasoori (Ali Sethi & Shae Gill)
    - **Sufi Rock**: Junoon (Sayonee, Bulleya)
    - **Pakistani Pop**: Vital Signs (Dil Dil Pakistan)
  - **LIVE STREAMING (NEW!)**: Real music streaming from multiple sources
    - **JioSaavn Integration**: Stream real Pakistani and Indian music (Qawwali, Ghazal, Bollywood, Coke Studio)
    - **Deezer Integration**: Stream Caribbean (Reggae, Soca), Latin (Bossa Nova, Salsa), Middle Eastern, and global music
    - **30-Second Previews**: For songs not available for full streaming
    - **Smart Search**: Type any artist or song to search across streaming services
    - **Streaming Indicator**: Green badge shows when playing from streaming services
    - **Hybrid Mode**: Seamlessly switch between offline library and streaming results
  - **Full Music Player**:
    - **Real Audio Playback**: Actual streaming audio playback using expo-av
    - Mini player with progress bar and playback controls (play/pause, skip forward/back)
    - Full-screen player with spinning disc animation
    - **Seekable Progress Bar**: Tap anywhere on the progress bar to jump to that position
    - **Volume Control**: Tap volume button to show/hide volume slider
    - **Shuffle Mode**: Randomize playback order
    - **Repeat Modes**: Off, Repeat All, or Repeat One
    - **Skip Controls**: Skip to next/previous song (previous restarts if >3 seconds in)
    - **Share Songs**: Share song info with friends via native share sheet
    - Song descriptions and play counts
    - Like/favorite songs
    - Loading indicator while buffering
  - **Search & Filter**: Search by song, artist, country, or genre
  - **Classic Songs**: Timeless hits like "Sweet Mother", "Zombie", "One Love", "Pata Pata", "Garota de Ipanema", and more
  - **Song Details**: Artist, album, year, country, genre, description, and play count
- **Global Translator** (`/translator`): Translate anywhere in the world
  - **Type or Speak**: Voice input with microphone button or type your text
  - **50+ Languages**: English, Spanish, French, Portuguese, Arabic, Chinese, Hindi, Swahili, Yoruba, Tagalog, and more
  - **Swap languages** instantly with one tap
  - **Quick Phrases**: Common phrases for fast translation
  - **Listen to Translation**: Hear how to pronounce the translation
  - **Copy to Clipboard**: Share translations easily
  - **Recent Translations**: Access your translation history
- **Traditional Recipes**: Share and discover authentic recipes from around the world
- **Language Learning Pods** (`/language-pod`): Join groups learning any language
  - Pod details with host info, schedule, and member count
  - **Phrases Tab**: Common phrases with pronunciation guides
  - **Translation Tab**: Basic translation feature to help communicate in the language you're learning
  - Join/Leave pod functionality
- **Create Language Pod** (`/create-language-pod`): Host your own language learning group
  - 3-step form: Select language & level → Pod details → Schedule
  - Set max participants and online/in-person
- **Family Trees** (`/family-tree`): Document your lineage and preserve your heritage
  - Visual family tree grouped by generations
  - Member detail cards with photos, birth/death years, birthplace, and bio
  - Add family members with relationship types
  - Public/Private privacy settings
- **Create Family Tree** (`/create-family-tree`): Start documenting your family history
  - 3-step form: Name & description → Add family members → Review
  - Add members with relationships, birth info, and stories
- Recipe categories: Main Dishes, Soups & Stews, Sides, Desserts, Drinks, Snacks
- Language levels: Beginner, Intermediate, Advanced

### 7. Safety Network (`/safety-network`)
- **Community emergency response system**
- **SOS Button**: Hold for 3 seconds to alert trusted contacts with your location
- **Trusted Contacts**: Add neighbors and family as emergency contacts
- **Walk With Me**: Share your journey in real-time while walking/traveling
- **I'm Safe Check-in**: Quick safety confirmations during emergencies
- Automatic location sharing during emergencies

### 8. Support Circles (`/support-circles`)
- **Community support groups** for life challenges
- Categories: Grief & Loss, Immigration Support, Career Transition, New Parents, etc.
- Join circles based on your needs or offer support to others
- Private and anonymous participation options
- Facilitated meetings with scheduled times
- Connect with others facing similar challenges

### 9. Gamification System (`/gamification`)
- **Community engagement rewards** to encourage participation
- **Challenges**: Daily, weekly, and monthly challenges to earn XP
- **Leaderboards**: Compete with community members for top spots
- **Badges**: Earn badges for achievements (Social Butterfly, Event Organizer, Heritage Guardian)
- **Levels**: Progress through levels as you contribute more
- **Streak System**: Maintain daily engagement streaks for bonus rewards
- Badge rarities: Common, Rare, Epic, Legendary

### 10. Advanced Events (`/advanced-events`)
- **Enhanced event system** beyond basic RSVPs
- **Ticketed Events**: Sell tickets directly through the app
- **Virtual Events**: Host online-only events with video links
- **Hybrid Events**: Combined in-person and virtual attendance
- **Watch Parties**: Synchronized viewing with community chat
- Event categories: Cultural, Music, Food, Education, Art, Sports, Networking
- Attendee counts and capacity limits
- Featured events carousel

## Game-Changing Features (NEW!)

Three powerful features designed to make Diaspora the go-to app for foreigners and expats worldwide:

### 11. Remittance & Money Transfer (`/remittance`)
- **Compare rates AND send money** through official provider apps
- **35+ countries supported** across 5 regions:
  - **Africa**: Nigeria, Ghana, Kenya, South Africa, Ethiopia, Tanzania, Uganda, Cameroon, Senegal, Rwanda, Zambia, Zimbabwe
  - **Caribbean**: Jamaica, Trinidad & Tobago, Barbados, Haiti, Dominican Republic, Guyana
  - **Europe**: UK, Germany, France, Poland, Ukraine, Romania
  - **Asia**: India, Pakistan, Bangladesh, Philippines, Vietnam, Nepal
  - **Latin America**: Mexico, Colombia, Brazil, Peru
- **12 money transfer providers integrated**:
  - Wise, Taptap Send, Flutterwave, LemFi, Remitly, Chipper Cash, WorldRemit, Sendwave, Paysend, Western Union, MoneyGram, Xoom (PayPal)
- **NEW: Deep Linking to Provider Apps**:
  - Select a provider and enter recipient details
  - App opens the provider's app or website with pre-filled information
  - Complete the transfer securely in the provider's app
  - If the app isn't installed, opens the App Store or Play Store
- **NEW: Affiliate/Referral Tracking**:
  - Providers with referral programs are marked with a "Bonus" badge
  - Users may be eligible for sign-up bonuses through affiliate links
  - Tracks affiliate clicks for analytics
- Features:
  - Enter send amount and select destination country
  - Only shows providers that support the selected country
  - See real-time exchange rates and fees from each provider
  - Best deal automatically highlighted
  - "Fastest" badge for instant transfer providers
  - Provider ratings, reviews, and delivery speed info
  - Recipient details form (name, phone, email)
  - "How It Works" guide explaining the 3-step process

### Refer & Earn Program (`/referrals`)
- **Two-tier referral system** where users AND Diaspora both earn
- **User Referral Rewards**:
  - **$1.00** when a friend signs up using your code
  - **$5.00** when they make their first money transfer
  - **10% commission** on every transfer they make (forever!)
- **New User Bonuses**:
  - **$2.00** welcome bonus for signing up with a referral code
  - **$3.00** bonus on their first transfer
- **Features**:
  - Unique referral code (format: AFRO-NAME-XXXX)
  - One-tap copy code to clipboard
  - Share via WhatsApp, SMS, or any app
  - Real-time stats: total referrals, pending rewards, earned rewards
  - Reward history with status tracking (pending, confirmed, paid)
  - Three tabs: Overview, History, How It Works
  - FAQ section explaining payout process
- **Diaspora Revenue**:
  - Earns affiliate commissions from transfer providers
  - Shares portion with referring users (10%)
  - Sustainable revenue model benefiting everyone

### 12. Immigration Help Center (`/immigration-help`)
- **Comprehensive immigration resource hub** for expats and foreigners
- **3-Tab Interface**:
  1. **Q&A Forum**: Community questions and answers about immigration
     - Browse questions by visa category
     - Upvote helpful questions
     - See answer counts and view counts
     - Ask your own questions
  2. **Lawyers Directory**: Find verified immigration attorneys
     - Attorney profiles with specializations
     - Success rates, reviews, and years of experience
     - Consultation fees and booking options
     - Filter by visa type expertise
  3. **Documents Checklist**: Complete document requirements
     - Organized by visa category
     - Checkbox tracking for your application
     - Categories: Work Visa, Student Visa, Family Visa, Green Card, Asylum, Visitor Visa
- **6 Visa Categories**: Work (H-1B, L-1), Student (F-1, J-1), Family-Based, Green Card, Asylum, Visitor
- Community-powered knowledge base

### 13. Global Food Network (`/african-food`)
- **Order authentic home-cooked food from cooks** in your community
- **Featured Home Cooks**: Verified cooks with ratings, reviews, and specialties
- **Cuisines from around the world**: Ethiopian, Mexican, Indian, Vietnamese, Caribbean, Middle Eastern, and more
- Features:
  - Browse dishes with photos, descriptions, and pricing
  - Filter by cuisine type (flags for each country)
  - Search dishes, cooks, or cuisines
  - Spicy and vegetarian labels
  - Prep time and serving size info
  - Star ratings for each dish
  - Save favorite dishes
- **Shopping Cart**:
  - Add/remove items with quantity controls
  - Floating cart button with item count
  - Subtotal, delivery fee, and total calculation
  - Place order with estimated delivery time
- **Dish Details Modal**: Full dish info with add to cart
- Support local home cooks and taste authentic global cuisine!

### 14. Stories (`/stories`)
- **24-hour disappearing stories** for sharing moments
- **Story Ring on Profile Pictures**:
  - Profile photos throughout the app show gradient rings when user has stories
  - Purple/pink gradient ring for unseen stories
  - Gray ring for already-viewed stories
  - Tap profile picture to view their story
  - **Current user's profile picture**: Shows dashed purple ring with "+" icon to create a story
  - Integrated in PostCard, Profile, Comments, and other areas
- **Stories Row on Home Feed**: Horizontal scrollable stories bar at the top of the feed
  - Your story avatar with add button
  - Other users' stories with ring indicators
  - Tap to view or create stories
- **Story Viewer**: Full-screen immersive viewing experience
  - Auto-progress timer bar for each story
  - Tap left/right to navigate between stories
  - Swipe to skip to next user's stories
  - Larger close (X) button with improved tap area
- **Story Types**:
  - Photo stories with full-screen images
  - Text stories with colorful gradient backgrounds
  - Video stories (up to 30 seconds)
- **Create Story**:
  - Choose between photo, text, or video story
  - 7 beautiful gradient background options for text
  - Content moderation - inappropriate content blocked
  - Guidelines acceptance before posting
  - Stories are saved to your profile
- **Story Privacy Settings** (Settings gear icon):
  - Hide your stories from specific people
  - Select which connections can't see your stories
  - Privacy list shows count of blocked users
  - Toggle individual users on/off
- **Engagement**:
  - Reply to stories directly
  - View count tracking
  - Story reactions

### 15. Clips & Highlights (`/clips`)
- **Short-form video clips** and stream highlights
- **Category Filters**: Trending, Music, Dance, Comedy, Gaming, Cooking, Fashion
- **Clip Features**:
  - Video thumbnails with duration badges
  - Creator info with avatars
  - View counts and engagement stats
  - Like, comment, save, and share actions
- **Search**: Find clips by creator name or content
- **Report System**: Flag inappropriate content with detailed report form
- **Content Moderation**: Built-in guidelines enforcement

### 16. Creator Battles (`/creator-battles`)
- **1v1 split-screen competitions** where creators battle for gifts
- **Real-time Scoring**: Live gift totals displayed during battles
- **Battle Features**:
  - Split-screen view with both creators
  - Progress bars showing who's winning
  - Countdown timer (2-5 minute battles)
  - Live viewer count
- **Categories**: Entertainment, Music, Comedy, Dance, Talent, Chat
- **Gift System**: Viewers send gifts to support their favorite creator
- **Battle Invites**: Challenge other creators to battle

### 17. Polls & Q&A for Streams (`/stream-polls`)
- **Interactive engagement tools** for live streams
- **Live Polls**:
  - Create polls with 2-6 options
  - Real-time vote tracking with percentages
  - Animated progress bars
  - Duration settings (1min, 2min, 5min, 10min)
  - Poll results and winner display
- **Q&A Mode**:
  - Viewers submit questions during streams
  - Upvote system - popular questions rise to top
  - Host can pin important questions
  - Mark questions as answered
- **Host Controls**: Start/end polls, pin questions, moderate content
- **Content Moderation**: All questions and poll options screened

### 18. Duets / Split Screen (`/duets`)
- **Create side-by-side videos** with other creators
- **Duet With**: Browse videos that have duets enabled
  - See duet count for each original video
  - Filter by category (Music, Dance, Comedy, Reaction)
- **Create Duet**:
  - Choose layout: Side-by-side or Top & Bottom
  - Record your video alongside the original
  - Add title and description
  - Content moderation enforcement
- **Duet Feed**: Browse trending duets
  - Split-screen preview showing both creators
  - Category badges
  - Like, comment, and share

### Content Moderation System
- **Zero tolerance** for sexual and violent content
- **Multi-layer Protection**:
  - Automated text filtering for inappropriate terms
  - Category-based content blocking
  - User reporting system with detailed forms
  - Community guidelines enforcement
- **Report Types**: Sexual content, Violence, Hate speech, Harassment, Scam, Spam, Drugs, Other
- **Consequences**:
  - 1st offense: Warning
  - 2nd offense: 24hr restriction
  - 3rd offense: 7-day suspension
  - Severe violations: Permanent ban
- **Pre-Upload Warnings**: Guidelines modal before creating content

### Push Notifications
- **Comprehensive notification system** for all app events
- **Notification Types**:
  - Stream going live
  - New followers
  - Gifts received
  - Battle invites
  - Story replies
  - Poll results
  - Daily reward reminders
- **Preferences**: Granular control over which notifications to receive
- **Notification History**: View and manage past notifications
- **Badge Count**: Unread notification count on app icon

### Daily Rewards System
- **7-day reward streak** with increasing gem rewards
- **Reward Schedule**:
  - Day 1: 10 gems
  - Day 2: 15 gems
  - Day 3: 20 gems
  - Day 4: 25 gems
  - Day 5: 30 gems
  - Day 6: 40 gems
  - Day 7: 100 gems (Jackpot!)
- **Streak Tracking**: Maintain your streak for bigger rewards
- **Visual Calendar**: See which days you've claimed
- **Home Screen Banner**: Quick access to claim rewards

### 19. Sports Betting with Gems (`/sports-betting`)
- **Bet on sports events using virtual gems** - fun, engaging, and safe
- **Multiple Sports Categories**:
  - NFL Football
  - NBA Basketball
  - Soccer (Premier League, AFCON, La Liga)
  - MMA/UFC
  - Boxing
- **Betting Features**:
  - Live events with real-time scores
  - Upcoming events with countdown timers
  - Odds displayed for home/away/draw (soccer)
  - Quick bet amounts: 50, 100, 250, 500 gems
  - Minimum bet: 10 gems, Maximum: 10,000 gems
  - Potential winnings calculator based on odds
- **My Bets Tab**:
  - Track all pending, won, and lost bets
  - Status color coding (green/red/yellow)
  - Bet details with team, prediction, odds, and outcome
- **Stats Dashboard**:
  - Total bets placed
  - Win/loss record
  - Win rate percentage
  - Current and longest win streaks
  - Total gems wagered, won, and lost
- **Referral Integration**:
  - 100 gem bonus for new users who join with referral code
  - 50 gem bonus for referrer when their friend places first bet

### 20. Live Radio Broadcasting (`/live-radio`)
- **Community-powered radio stations** - broadcast from anywhere!
- **Listen to Live Stations**:
  - Live Now section with active broadcasts
  - Listener counts and current track/show info
  - Station categories: Afrobeats, Gospel, Talk, News, Culture, Sports
  - Genre-based filtering
- **Station Features**:
  - Host profile with avatar and name
  - Station description and tags
  - Follower counts
  - Broadcast duration display
  - Cover images for visual appeal
- **Popular Stations**: Top stations ranked by followers
- **Upcoming Shows**:
  - Schedule of upcoming broadcasts
  - Day and time info
  - Reminder button to get notified
- **Mini Player**:
  - Persistent player at bottom of screen
  - Play/pause controls
  - Mute toggle
  - Audio wave visualizer animation
- **Full Player & Live Chat**:
  - Full-screen listening experience
  - Live chat with other listeners
  - DJ messages highlighted
  - Follow/unfollow stations
  - Share station functionality
- **Start Your Own Station**:
  - Create and broadcast from your basement, bedroom, anywhere!
  - Share music, host talk shows, or discuss community topics
  - Build your listener base and followers
- **Audio Wave Animation**: Animated bars showing audio activity

### Enhanced Referral System
- **Gem Bonuses** in addition to cash rewards:
  - **100 gems** for referrer when friend signs up
  - **50 gems** for new user when signing up with code
  - **50 gems** for referrer when their referral places first bet
- Combined with existing cash rewards for maximum earnings

### 21. Partner Referral Hub (`/referral-hub`) (NEW!)
- **Earn from top financial apps** with two-tier referral system
- **4 Partner Categories**:
  1. **Invest**: Robinhood, Webull, Public, Acorns
     - Earn $5-$12 per referral + free stocks for friends
  2. **Crypto**: Coinbase, Crypto.com, Binance US, Gemini
     - Earn $10-$25 per referral + crypto bonuses for friends
  3. **Banking**: Chime, Cash App, SoFi, Venmo
     - Earn $10-$100 per referral (Chime pays $100!)
  4. **Cashback**: Rakuten, Ibotta, Honey, Fetch Rewards
     - Earn $2-$30 per referral + shopping rewards for friends
- **Two-Tier Earnings System**:
  - **Tier 1**: Earn full bonus when you refer friends directly
  - **Tier 2**: Earn 15-25% when YOUR friends refer others!
  - Passive income from your network's referrals
- **Features**:
  - Browse 16+ popular financial apps
  - See exactly how much you and your friend earn
  - Popular partners highlighted with badges
  - Filter by category or view all popular partners
  - One-tap share to WhatsApp, SMS, or any app
  - Real-time earnings tracking by category
  - Complete earnings history with status (pending/confirmed/paid)
  - Detailed "How It Works" guide
  - Potential earnings calculator
- **Example Earnings**:
  - 5 friends join Robinhood: $50
  - 3 friends join Chime: $300
  - 5 friends join Coinbase: $50
  - 10 friends join Rakuten: $300
  - **Tier 1 Total: $700+** plus Tier 2 earnings!

## New Community Features (Latest!)

### 22. Cultural Calendar (`/cultural-calendar`)
- **Global holiday calendar** with holidays from 32+ cultures worldwide
- Filter by culture: African, Caribbean, South Asian, East Asian, Middle Eastern, European, Indigenous, and more
- Reminder toggle for each holiday
- Holiday details: traditions, food, history, public holiday badges
- Beautiful holiday cards with cultural images
- Search holidays by name or culture

### 23. Skill Swap (`/skill-swap`)
- **Trade skills** with community members - no money needed!
- Browse skills others are offering and seeking
- Categories: Music, Cooking, Languages, Tech, Art, Sports, Business, Health, Education
- Skill levels: Beginner, Intermediate, Advanced
- Stats: total swaps, skills offered, skills requested
- Create swap requests with what you're offering and seeking

### 24. Carpool & Ride Share (`/carpool`)
- **Community ride sharing** for commutes, events, and trips
- **Works in any country** - supports local currencies and payment methods
- Ride types: Airport, Commute, Events, Road Trips
- Driver profiles with ratings and car info
- Route visualization (from → stops → destination)
- Amenities badges (WiFi, Phone Charger, Quiet Ride, etc.)
- Price with custom currency display (USD, GBP, NGN, KES, GHS, EUR, CFA, etc.)
- Seat availability display
- **Flexible Pricing Options**:
  - **Fixed Price** - Set your own price per seat
  - **Split Gas** - Riders share actual gas costs (40-60% cheaper than rideshare!)
    - Enter trip distance, gas cost is calculated and split among all riders
    - Shows "your share of gas" on ride cards
  - **Free Ride** - Community spirit rides for those who need it
    - Perfect for going to the same destination anyway
    - Builds community trust and goodwill
  - **Tips Welcome** - Pay what you can model
    - Great for building goodwill while covering some costs
    - Riders can tip whatever they can afford
- **International Payment Methods**:
  - **M-Pesa / Mobile Money** - Popular in Africa (Kenya, Tanzania, Ghana, Nigeria, etc.)
  - **PayPal** - Global payments
  - **Wise (TransferWise)** - International transfers
  - **Bank Transfer** - Direct bank payments
  - **Cash App** - US-based
  - **Venmo** - US-based
  - **Zelle** - US-based
  - **Cash** - Pay driver in person
  - **In-App Payment** - Secure payment through Diaspora (5% platform fee)
- Post your own rides with:
  - Flexible pricing type selection with visual icons
  - Local currency support
  - Multiple payment method options
  - "Support the driver" toggle for passengers to cover platform fees
- Sample rides from multiple countries: USA, Ghana, Nigeria, UK, Senegal, Kenya

#### Car Rental with Document Upload (NEW!)
- **Rent a Car Tab** - Rent cars directly from community members
- **Document Requirements System** - Car owners can require renters to upload documents through the app
- **10 Document Types Available**:
  - Driver's License (front & back)
  - Government ID (National ID, state ID)
  - Insurance Proof (current auto insurance certificate)
  - Passport (valid passport photo page)
  - Proof of Address (utility bill or bank statement)
  - Credit Card Photo (last 4 digits visible for security)
  - Selfie with ID (photo holding your ID)
  - Vehicle Registration (proof you own a vehicle)
  - Employment Proof (pay stub or employment letter)
  - Bank Statement (recent statement, can redact amounts)
- **For Car Owners**:
  - Select which documents renters must upload before approval
  - Everything handled through the app - no need to meet first
  - Review uploaded documents before approving rental
  - Set minimum age, insurance requirements, deposit amounts
- **For Renters**:
  - See required documents before requesting to rent
  - Upload documents via photo library or camera capture
  - Progress tracker showing uploaded vs required documents
  - Add optional message to introduce yourself
  - Privacy notice: documents encrypted and auto-deleted after 30 days
- **Two-Button System**:
  - "Request to Rent" - Opens document upload modal when documents are required
  - "Message Owner" - Direct chat for questions or simple rentals

### 25. Pet Connect (`/pet-connect`)
- **Connect with pet owners** in your community
- Pet profiles with photos, breed, age, and personality
- Filter by pet type: Dogs, Cats, Birds, Fish, Rabbits, Reptiles
- "Looking for" tags: Playdate, Pet-Sitting, Walking Buddy, Vet Recommendations
- Like and connect with pet owners
- Add your own pet with full profile

### 26. Memory Capsules (`/memory-capsules`)
- **Time-locked posts** that unlock on a future date
- Capsule types: Personal, Shared, Community
- Beautiful gradient themes for each capsule
- Lock/unlock status with countdown
- Create capsules with unlock dates months or years away
- Perfect for future celebrations, anniversaries, or community milestones

### 27. Housing Board (`/housing-board`)
- **Find roommates, sublets, and housing** in your community
- Listing types: Room, Apartment, Sublet, House
- Detailed listings with photos, amenities, and pricing
- Contact poster directly
- Save favorite listings
- Post your own housing with availability dates

### 28. Lost & Found Board (`/lost-found`)
- **Report and find lost items** in your community
- Lost and Found tabs for easy browsing
- Categories: Documents, Electronics, Pets, Keys, Jewelry, Bags, Clothing
- Reward badges for lost items
- Status tracking: Active, Claimed, Returned
- Location and date information
- Report items with photos and descriptions

### 29. Appreciation Wall (`/appreciation-wall`)
- **Public shoutouts and thank-yous** for community members
- Post types: Shoutout, Thank You, Recognition, Milestone
- From/To display for appreciation posts
- Emoji reactions and engagement
- Create appreciation posts to celebrate others
- Perfect for recognizing community helpers, mentors, and friends

### 30. Proverbs & Wisdom (`/proverbs-wisdom`)
- **Daily cultural proverbs** from around the world
- Origins: African, Caribbean, Asian, Indigenous, Middle Eastern, Global
- Categories: Life, Love, Success, Community, Family, Wisdom
- Daily proverb with meaning and origin
- Browse all proverbs with search and filters
- Save and share your favorite proverbs

### 31. Name Meanings & Origins (`/name-meanings`)
- **Discover the meaning** of African and cultural names
- Name details: pronunciation, meaning, origin
- Variations and famous people with the name
- Gender and origin filters
- Expandable cards with full information
- Save and share names
- Search 100+ cultural names

### 32. Group Grocery Orders (`/group-grocery`)
- **Bulk buying** with community members
- Join group orders for African, Caribbean, and specialty foods
- Progress bars showing order capacity
- Participant counts and product variety
- Total order value display
- Join orders with item quantity selection
- Save money by buying in bulk together

### 33. Traditional Attire Guide (`/traditional-attire`)
- **Learn about cultural clothing** from around the world
- 15+ traditional garments: Kente, Dashiki, Agbada, Aso Oke, Ankara, Kaftan, Gele, Boubou, Shuka, Habesha Kemis, and more
- Origin, history, and cultural significance
- How to wear guides
- Where to buy information
- Occasions for each garment
- Save favorites and share

### 34. Community Fitness Challenges (`/fitness-challenges`)
- **Join fitness challenges** with community members
- Challenge types: Steps, Workout, Water intake, Meditation
- Difficulty levels: Beginner, Intermediate, Advanced
- Duration options: 7, 14, 30 days
- Leaderboards with rankings
- XP rewards and streak tracking
- Join/leave challenges with progress tracking
- Stats: active challenges, total XP, current streak

### 35. Mental Health Check-ins (`/mental-health`)
- **Track your mood** and mental wellness
- Emoji mood selection: Amazing, Good, Okay, Low, Struggling
- Activity logging: Exercise, Social, Work, Rest, Outdoors
- Mood history calendar
- Journal prompt suggestions
- Crisis resources with helpline numbers
- Resources modal with mental health support info
- Self-care reminders

### 36. Emergency Contacts Directory (`/emergency-contacts`)
- **Essential emergency numbers** for the diaspora
- Categories: Emergency Services, Embassies, Health, Community, Legal
- US emergency services (911, Poison Control, Suicide Prevention)
- African embassies in the US (Nigeria, Ghana, Ethiopia, Kenya, South Africa, Jamaica)
- Health resources (CDC, SAMHSA)
- Community organizations
- Legal aid services
- Quick call buttons and website links

### 37. Document Translation Help (`/document-translation`)
- **Find translation helpers** in your community
- Helper profiles with languages and specializations
- Document types: Legal, Medical, Immigration, Academic, Financial
- Trust scores and verification badges
- Contact helpers directly
- Request translation with document upload
- Urgency levels and fee display

### 38. Traditional Medicine Directory (`/traditional-medicine`)
- **Find herbalists and holistic practitioners** in your community
- Traditions: African, Caribbean, Chinese Medicine, Ayurveda, Islamic Medicine
- Practitioner profiles with ratings and reviews
- Services and pricing displayed
- Experience and verification badges
- Call and view profile buttons
- Health disclaimer included

### 39. Photo Booth (`/photo-booth`)
- **Apply cultural filters** to your photos
- 12+ cultural filters: Ankara Glow, Kente Gold, Safari Sunset, Caribbean Vibes, Reggae Tones, and more
- Cultural frames: Kente Border, Adinkra Corners, Ankara Frame, Mudcloth Border, Rasta Colors
- Cultural stickers: Crown, Africa, Lion, Fist, Hibiscus, Drum, and more
- Filter categories: African, Caribbean, Universal
- Photo editing: Flip, change filters/frames/stickers
- Save and share your creations

### 40. Universal Feature Search (`/app-search`)
- **Find any feature or tab** by typing to search
- **Search Button**: Quick access from the home screen header (magnifying glass icon)
- **55+ Features Indexed**: All app features are searchable
- **Smart Search**: Search by feature name, description, or keywords
  - Type "pet" to find Pet Connect
  - Type "music" to find Cultural Music (Ghana Highlife, Pakistan Qawwali, etc.)
  - Type "money" to find Money Transfer, Susu Circles, Gem Store
  - Type "pakistan" to find Pakistani music collection
- **Category Filters**: Filter by Social, Community, Culture, Finance, Entertainment, Health, Services, Food, Safety
- **Popular Features**: Quick access to most-used features
- **Beautiful Cards**: Each feature shows icon, name, description, and category badge
- **Instant Navigation**: Tap any feature to go directly to that screen

### 41. Immigration Career Guide (`/immigration-career-guide`)
- **Step-by-step career guides** for professionals immigrating to work abroad
- **6 Professional Pathways**:
  1. **Nursing** - NCLEX-RN, VisaScreen, state licensing, H-1B/EB-3 visa paths
  2. **Software Engineering** - H-1B visa, job search, tech company sponsorship
  3. **Teaching** - Teaching license, visa sponsorship, J-1 exchange programs
  4. **Accounting** - CPA licensing, H-1B visa, Big 4 firms sponsorship
  5. **Physical Therapy** - NPTE exam, credential evaluation, healthcare visas
  6. **Engineering** - PE license, work authorization, engineering firms
- **Country Selection**: Guides for USA, UK, Canada, Australia, Germany
- **Step Details**: Each step includes duration, estimated cost, helpful tips, and links to official resources
- **Progress Tracking**: Mark steps as complete as you progress
- **Salary Information**: Expected salary range and job demand level
- **Top States/Regions**: Where jobs are most in-demand

### 42. International Jobs Board (`/international-jobs`)
- **Visa-sponsored job listings** from around the world
- **5 Countries**: USA, UK, Canada, Australia, Germany
- **Job Categories**: Healthcare, Technology, Education, Engineering, Finance
- **Features**:
  - Urgent hiring badges for immediate openings
  - Salary ranges with currency conversion
  - Visa sponsorship type displayed (H-1B, Skilled Worker, etc.)
  - Requirements, benefits, and application deadlines
  - Company profiles with size and industry
  - Link to Immigration Career Guide for each profession
- **Filters**: Country and category filters
- **Search**: Find jobs by title, company, or location
- **Quick Apply**: Apply directly through the job modal

### 43. International Schools Finder (`/international-schools`)
- **Schools accepting international students** for study abroad
- **5 Countries**: USA, UK, Canada, Australia, Germany
- **School Types**: Universities, Colleges, Community Colleges, Graduate Schools
- **Features**:
  - World rankings and acceptance rates
  - International tuition fees per year
  - Scholarship availability and funding types
  - Application deadlines and test requirements (TOEFL, IELTS, SAT, GRE)
  - Campus amenities (housing, work permits, career services, etc.)
  - Popular programs and majors offered
  - Application checklist with official links
- **Filters**: Country, school type, and scholarship availability
- **Search**: Find schools by name, location, or programs
- **School Details Modal**: Full info with "Apply Now" button

### 44. AI Immigration Assistant (`/immigration-assistant`)
- **Real-time AI chat** for immigration questions
- **Powered by GPT-5.2**: Answers specific questions about visas, licensing, jobs, schools
- **Expert Knowledge Areas**:
  - Work visa processes (H-1B, EB-3, Skilled Worker visas)
  - Professional licensing (CGFNS, WES, NACES evaluations)
  - Healthcare worker immigration (nurses, doctors, PTs)
  - Tech worker immigration (software engineers)
  - Student visas and scholarships
  - Document requirements and timelines
  - Cost estimates and financial planning
- **Quick Questions**: Pre-written common questions to get started fast
- **Context-Aware**: Remembers your conversation for follow-up questions
- **Quick Links**: Direct access to Career Guides, Jobs, Schools from chat
- **Accessible from**: Career Guide, International Jobs, and Schools pages (green chat button)

## Newcomer Support System (NEW!)

Two revolutionary features that make Diaspora the first app to truly support people relocating to new cities:

### 45. Arrival Mode (`/arrival-mode`)
- **30-day onboarding experience** for newcomers who just moved to a new city
- **What Arrival Mode provides**:
  - Helpers automatically surface near you
  - Ask anything without judgment
  - Priority support from the community
  - Local tips and essential info
- **Customizable help needs**:
  - Select what you need help with: Housing, Jobs, Schools, Healthcare, Transport, Shopping, Faith, Community
  - Helpers with matching skills will see your profile
- **Visual indicators**:
  - Amber "Arrival Mode Active" banner on home feed
  - "New Arrival" badge on your profile
  - Days remaining countdown (30-day window)
- **Quick actions**:
  - Find Helpers button to connect with community helpers
  - Ask Anything button to post judgment-free questions
  - City Guide for essential local information

### 46. Community Roles (`/become-helper`, `/find-helpers`)
- **Replace followers with responsibility** - No likes, no follower counts, just earned roles
- **7 Community Roles**:
  - **Welcomer** (Pink) - Helps newcomers settle in
  - **Connector** (Purple) - Introduces people to each other
  - **Organizer** (Amber) - Hosts events and gatherings
  - **Fixer** (Green) - Provides practical help (rides, repairs, advice)
  - **Story Keeper** (Indigo) - Preserves community history and traditions
  - **Mentor** (Blue) - Guides career and life decisions
  - **Business Builder** (Red) - Supports local businesses
- **Role features**:
  - Roles are earned through helping, not purchased
  - Roles can expire to keep them meaningful
  - "Helped count" shows impact on community
  - Multiple roles can be earned
- **Become a Helper** (`/become-helper`):
  - Select skills you can help with
  - Get the Welcomer role automatically
  - Track people you've helped
  - Build your reputation and trust score
- **Find Helpers** (`/find-helpers`):
  - Search helpers by name, skill, or language
  - Filter by skill category
  - See helper ratings and reviews
  - View languages spoken
  - One-tap messaging to connect

### 47. Ask Community (`/ask-community`)
- **Judgment-free question posting** for newcomers
- **Safe space** - Questions from new arrivals are protected
- **Suggested questions** - Common questions to get started
- **Community answers** - Get answers from experienced locals
- **Tags** - Categorize questions by topic
- **Upvoting** - Best answers rise to the top

### 48. Seasonal Community Missions (`/community-missions`)
- **Quarterly community goals** that turn spectators into collective actors
- **5 Mission Types**:
  - **Welcome Newcomers** - Help new arrivals settle in
  - **Support Local Businesses** - Visit, review, promote diaspora businesses
  - **Mentor Students** - Career advice, college apps, skill development
  - **Help Families Find Housing** - Connect families with housing options
  - **Host Community Events** - Organize gatherings, potlucks, celebrations
- **Features**:
  - Progress tracking with visual progress bars
  - Join/leave missions freely
  - Log contributions to earn points
  - Mission rewards (badges, gems)
  - Days remaining countdown
- **3-Tab Interface**:
  - **Missions** - Browse and join active missions
  - **Activity** - See recent contributions from community
  - **Leaderboard** - Top contributors with podium display
- **Gamification**:
  - Points for every contribution
  - Your rank shown against community
  - Badges for completing missions

### 49. Cultural Time Capsules (`/time-capsules`)
- **Preserve traditions, recipes, stories, and memories** for future generations
- **6 Capsule Types**:
  - **Stories** - Migration journeys, family histories
  - **Recipes** - Traditional dishes passed through generations
  - **Traditions** - Cultural customs, wedding ceremonies, celebrations
  - **Prayers** - Audio recordings of blessings from elders
  - **Music** - Traditional songs, lullabies, anthems
  - **History** - Neighborhood and community histories
- **Time-Lock Conditions**:
  - **Date-based** - Unlock on Independence Day, Christmas, etc.
  - **Milestone** - Unlock when community reaches 100 members
  - **Community Age** - Unlock after 1 year in community
- **Features**:
  - Beautiful cover images for each capsule
  - Contributor count and item count
  - Locked/Unlocked visual indicators
  - Filter by locked, unlocked, or all
  - Create new capsules with unlock conditions
- **Example Capsules**:
  - "Ghanaian Migration Stories (1990-2010)" - Unlocks on Ghana Independence Day
  - "Grandma's Recipes" - Unlocked when community hit 100 members
  - "Wedding Traditions" - Unlocked after 1 year

### 50. Diaspora Circles (`/diaspora-circles`)
- **Identity-based groups that overlay cities** - Not Facebook Groups, but belonging
- **Circle Categories**:
  - **Generation** - First-Gen Africans, Second-Gen Diaspora
  - **Professional** - Students, Professionals, Entrepreneurs
  - **Faith** - Faith & Spirituality (cross-faith community)
  - **Language** - French Speakers, Swahili Speakers, etc.
  - **Family** - Diaspora Parents
- **Features**:
  - Join circles that match your identity
  - See which cities are active in each circle
  - Cross-city connections and solidarity
  - Private discussion feeds per circle
  - Circle-exclusive events
  - Mentorship matching within circles
- **8 Pre-built Circles**:
  - First-Gen Africans (2,453 members)
  - Second-Gen Diaspora (1,876 members)
  - Diaspora Students (3,241 members)
  - Faith & Spirituality (1,543 members)
  - Diaspora Professionals (4,521 members)
  - Diaspora Parents (987 members)
  - French Speakers (1,234 members)
  - Diaspora Entrepreneurs (2,156 members)
- **Circle Benefits**:
  - Private discussion feed
  - Circle-exclusive events
  - Cross-city connections
  - Mentorship matching

## Supporting Sub-Pages (NEW!)

These sub-pages provide full functionality for the main features above:

### Mission Contributions (`/log-contribution`)
- **Log your community contributions** to earn points in missions
- Select from 9 contribution types based on current mission
- Add optional details and photos
- Earn points ranging from 5-25 per contribution type
- Success confirmation with points display

### Time Capsule Details (`/capsule-detail`)
- **Explore unlocked capsule contents**
- Browse items: recipes, stories, audio recordings, photos
- Filter by content type (All, Recipes, Stories, Audio, Photos)
- Like and comment on contributions
- Add your own content to the capsule
- Contributor profiles and timestamps

### Circle Feed (`/circle-feed`)
- **Private discussion feed** for joined circles
- Post updates visible only to circle members
- Like posts and give "hugs" for support
- Comment and reply to discussions
- Share images and links
- Member city locations displayed
- Role badges (Welcomer, Mentor, Organizer)

### Add Recipe (`/add-recipe`)
- **Share traditional recipes** with the community
- Upload recipe photo
- Add ingredients with amounts (dynamic list)
- Write cooking instructions
- Set prep time, servings, difficulty
- Share the story behind your recipe
- Contributes to Heritage Hub and Time Capsules

### Connect Setup (`/connect-setup`)
- **Configure connection preferences** for meeting people
- Select interests: Networking, Dating, Friendship, Mentorship, Roommate, Faith, Food, Culture
- Write a connection bio
- Set preferred age range
- Privacy controls for your profile

### Support Circle Details (`/support-circle`)
- **Join private support groups** for life challenges
- Anonymous posting within circles
- Safe space guidelines displayed
- Give "hugs" instead of likes (supportive language)
- Access group sessions and resources
- Categories: Grief & Loss, Anxiety, Immigration Stress

### Project Contributions (`/contribute-project`)
- **Support community crowdfunding projects**
- View project details, progress, and goal
- Select preset amounts ($10-$500) or enter custom
- See contributor count and days remaining
- Project updates from organizers
- 100% goes to the project

### Emergency Request (`/create-emergency`)
- **Request community help** in emergencies
- Select emergency type: Medical, Housing, Transport, Financial, Family
- Add title and detailed description
- Optional financial amount needed
- Location input
- Anonymous posting option
- Immediate community notification

### Community Questions (`/create-ask`)
- **Ask the community** for help and advice
- Select category: Housing, Jobs, Schools, Transport, Healthcare, Shopping, Community
- Set urgency level: Whenever, This Week, Urgent
- Add location for local questions
- Community members get notified and can respond