# AfroConnect

A community-driven social platform connecting foreigners, expats, and global citizens worldwide through local neighborhoods, shared culture, business, and opportunities.

**Slogan:** *Connecting Foreigners Globally, Building Communities*

## Features

### Welcome & Onboarding
- Detailed welcome page explaining all app features
- Location selection (Country > State/Region > City)
- Guest browsing mode - explore before signing up
- Sign up with Google, Email, or Phone number
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
- Direct messaging to contact sellers
- Product listings with images, prices, and descriptions
- View count and listing details
- **Create Listing** (`/create-listing`): Users can list items for sale with photos, pricing, category, condition, and description

### Business Directory
- Browse local businesses by category
- Categories: Food, Beauty, Retail, Services, Health, Education, Auto, Real Estate
- Featured businesses with ratings and reviews
- Quick actions: Call, Message, Directions
- **Register Business** (`/register-business`): 3-step form to register your business with logo, cover photo, contact info, and description
- **Cultural Market Mode**: Special feature for grocery stores to manage real-time inventory
- **Direct Messaging**: Contact businesses directly through the app

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

These 10 major features make AfroConnect superior to Facebook, Nextdoor, and any other social networking app by leveraging cultural concepts from around the world and community-first design:

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

### Gem-Based Payment System (NEW!)
- **Virtual Currency Economy**: Gems are the in-app currency (100 gems = $1 USD)
- **Purchase Gems** (`/gem-store`):
  - 6 packages: $0.99 (100), $4.99 (550), $9.99 (1,400), $19.99 (3,000), $49.99 (8,000), $99.99 (20,000)
  - RevenueCat integration for App Store and Play Store
  - Test store for development/sandbox testing
- **Marketplace Buy Now**:
  - Buy items directly with gems from the marketplace
  - See gem price equivalent on all listings
  - Purchase confirmation modal with balance check
  - Sellers receive 90% of gems (10% platform fee)
  - Insufficient balance redirects to gem store
- **Business Service Payments**:
  - Pay for appointments with gems
  - "Pay with Gems" option alongside cash and card
  - Real-time balance display during booking
  - Gem price shown for all services
  - Business owners receive 90% of payment
- **Supabase Integration**:
  - `user_wallets` table: gem balances, total earned, total sent
  - `gift_transactions` table: all gift/transfer history
  - `marketplace_purchases` table: marketplace transactions
  - `gem_purchases` table: RevenueCat purchase records
- **Seller Earnings**:
  - Sellers earn gems from marketplace sales
  - 90% payout (10% platform fee)
  - Gems can be used in-app or cashed out (future feature)

### 6. Heritage Hub (`/heritage-hub`)
- **Cultural preservation and learning center**
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

Three powerful features designed to make AfroConnect the go-to app for foreigners and expats worldwide:

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
- **Two-tier referral system** where users AND AfroConnect both earn
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
- **AfroConnect Revenue**:
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


