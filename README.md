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
- **Post Comments**: Tap any post to view comments, add your own comments, and see the full discussion
- **Share Posts**: Share posts using the native share sheet to any app on your device
- **Messaging**: Access messages from the home screen header, view conversations, and send messages

### Messaging System
- Conversation list with unread indicators
- Real-time chat interface
- Message history with timestamps
- Contact sellers and community members directly
