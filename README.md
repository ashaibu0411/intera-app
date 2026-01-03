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

### Business Appointments & Booking System
- **Book Appointments**: Users can book appointments with barbershops, salons, and health services directly from the Business Directory
- **4-Step Booking Flow** (`/book-appointment`):
  1. Select Service - Browse and choose from available services with pricing and duration
  2. Pick Date & Time - Interactive calendar with available time slots
  3. Payment Method - Choose to pay in-app or at the location (cash)
  4. Confirm Booking - Review details and confirm appointment
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

These 10 major features make AfroConnect superior to Facebook, Nextdoor, and any other social networking app by leveraging African cultural concepts and community-first design:

### 1. Ubuntu Trust Score (`/trust-score`)
- **Community reputation system** based on the African philosophy of Ubuntu
- Verification levels: Newcomer → Verified → Trusted → Elder
- Trust score (0-100) based on activity, badges, and community vouches
- Earn badges for contributions: Community Helper, Mentor, Event Host, etc.
- Community members can vouch for each other to increase trust
- Profile verification through ID, phone, email, and social connections

### 2. Village Council (`/village-council`)
- **Democratic community governance** inspired by traditional African councils
- **Polls & Voting**: Create and vote on community decisions and initiatives
- **Community Projects**: Crowdfund local projects (playgrounds, events, improvements)
- **Emergency Broadcasts**: Important community alerts (severe weather, safety, closures)
- **Ask the Neighborhood**: Post questions and get answers from neighbors
- Anonymous voting option for sensitive topics

### 3. Susu Savings Circles (`/susu-circles`)
- **Traditional African rotating savings system** (Susu/Esusu/Stokvel)
- Create or join savings circles with trusted community members
- Track contribution schedules and payout order
- Member trust scores displayed for transparency
- Support for different contribution amounts and frequencies
- View circle history and upcoming payouts

### 4. Job Board & Skills Marketplace (`/job-board`)
- **Community-powered employment** connecting diaspora job seekers and employers
- Browse job listings from African and diaspora businesses
- Filter by job type: Full-time, Part-time, Contract, Remote
- **Skills Marketplace**: Hire community members for services (tutoring, cleaning, repairs, etc.)
- Post job openings for your business
- Rate and review service providers

### 5. Voice Rooms (`/voice-rooms`)
- **Live audio discussions** like Clubhouse, but for the African diaspora
- Join or host voice rooms on topics: Culture, Business, Wellness, Faith, Politics
- Raise hand to speak, moderated by room hosts
- Schedule rooms in advance with topics and descriptions
- See who's speaking and who's listening
- Categories: Culture Chat, Business Talk, Wellness, Faith, Community, Politics

### 6. Heritage Hub (`/heritage-hub`)
- **Cultural preservation and learning center**
- **Traditional Recipes**: Share and discover authentic African recipes with stories
- **Language Learning Pods** (`/language-pod`): Join groups learning Swahili, Yoruba, Twi, Amharic, Igbo, Wolof, etc.
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


